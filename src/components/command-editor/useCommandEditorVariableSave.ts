import { useCallback, useEffect, useRef, useState } from 'react';
import { VARIABLES_REACT_AUTHORED_PROFILE } from '../variablesWorkspace.contract';
import type { CommandEditorMutationIntent } from './commandEditorMutation';
import {
  changedCommandEditorVariableBindings,
  type CommandEditorVariableBinding,
} from './commandEditorVariableBindings';

type SaveStage = 'COMMAND' | 'LEFT' | 'RIGHT' | 'COMMAND_VARIABLE';

export interface CommandEditorSaveAuthority {
  sessionId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  graphVersion: number;
  graphRevision: string;
  ownerAssertion: {
    workspaceKind: 'BOT_JOB';
    homeBankingId: number;
    botJobId: number;
  };
  botJobName: string;
  targetSessionId?: 'botJobTasks';
  selectionRevision?: number;
}

export interface CommandEditorVariableSaveResult {
  ok: boolean;
  requestId: string;
  stage: SaveStage;
  message: string;
  errorCode: string;
  instructionId: number | null;
  committedGraphVersion: number | null;
  graphRevision: string;
}

interface Context {
  webSocket: WebSocket | null;
  connected: boolean;
  authority: CommandEditorSaveAuthority | null;
  onResult: (result: CommandEditorVariableSaveResult) => void;
  timeoutMs?: number;
}

interface GraphAuthority {
  graphVersion: number;
  graphRevision: string;
}

interface PendingSave {
  authority: CommandEditorSaveAuthority;
  intent: CommandEditorMutationIntent;
  bindings: readonly CommandEditorVariableBinding[];
  bindingIndex: number;
  stage: SaveStage;
  requestId: string;
  firstRequestId: string;
  graph: GraphAuthority;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

const DEFAULT_TIMEOUT_MS = 15_000;
let requestSequence = 0;

const nextRequestId = (stage: SaveStage, instructionId: number): string => {
  requestSequence = requestSequence >= Number.MAX_SAFE_INTEGER ? 1 : requestSequence + 1;
  return `${Date.now().toString(36)}-command-editor-${stage.toLowerCase()}-${instructionId}-${requestSequence.toString(36)}`;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const parseEnvelope = (raw: unknown): {
  operationId: string;
  sessionId: string;
  body: Record<string, any> | null;
} | null => {
  try {
    const envelopeValue = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const envelope = objectValue(envelopeValue);
    if (!envelope) return null;
    let bodyValue: unknown = envelope.body ?? envelope;
    if (typeof bodyValue === 'string') bodyValue = JSON.parse(bodyValue);
    return {
      operationId: String(envelope.operationId || envelope.type || ''),
      sessionId: String(envelope.sessionId || ''),
      body: objectValue(bodyValue),
    };
  } catch (_) {
    return null;
  }
};

const stageForBinding = (binding: CommandEditorVariableBinding): SaveStage => {
  if (binding.slot === 'LEFT') return 'LEFT';
  if (binding.slot === 'RIGHT') return 'RIGHT';
  return 'COMMAND_VARIABLE';
};

const operationForStage = (stage: SaveStage): string => {
  if (stage === 'COMMAND') return 'variablesWorkspace.commandEditor.update';
  if (stage === 'LEFT') return 'variablesWorkspace.graphMutationLeft';
  if (stage === 'RIGHT') return 'variablesWorkspace.graphMutationRight';
  return 'variablesWorkspace.graphMutationCommandVariable';
};

const responseForStage = (stage: SaveStage): string => `${operationForStage(stage)}Response`;

const positiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const nonNegativeInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * One isolated save coordinator per Command Editor surface.
 *
 * Intrinsic command metadata commits first. Changed variable slots then use
 * their dedicated LEFT, RIGHT, or regular-command WebSocket operation one at
 * a time, carrying the graph version/revision returned by the previous commit.
 * COPY and CREATE deliberately stay outside this hook and remain disconnected.
 */
export const useCommandEditorVariableSave = ({
  webSocket,
  connected,
  authority,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingSave | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingSave | null => {
    const pending = pendingRef.current;
    if (!pending) return null;
    if (pending.timeoutId !== null) clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    return pending;
  }, []);

  const fail = useCallback((
    pending: PendingSave,
    message: string,
    errorCode: string,
  ) => {
    clearPending();
    onResult({
      ok: false,
      requestId: pending.firstRequestId,
      stage: pending.stage,
      message,
      errorCode,
      instructionId: pending.intent.sourceInstructionId,
      committedGraphVersion: pending.graph.graphVersion,
      graphRevision: pending.graph.graphRevision,
    });
  }, [clearPending, onResult]);

  const armTimeout = useCallback((pending: PendingSave): PendingSave => ({
    ...pending,
    timeoutId: setTimeout(() => {
      const current = pendingRef.current;
      if (!current || current.requestId !== pending.requestId) return;
      fail(
        current,
        `${current.stage === 'COMMAND' ? 'Command update' : 'Variable connection'} timed out. Reloading authoritative state is required.`,
        'COMMAND_EDITOR_SAVE_TIMEOUT',
      );
    }, timeoutMs),
  }), [fail, timeoutMs]);

  const sendBody = useCallback((
    pending: PendingSave,
    operation: string,
    body: Record<string, unknown>,
  ): boolean => {
    try {
      pending.webSocket.send(JSON.stringify({
        type: operation,
        sessionId: pending.authority.sessionId,
        homeBankingId: pending.authority.ownerAssertion.homeBankingId,
        body: JSON.stringify(body),
      }));
      return true;
    } catch (_) {
      return false;
    }
  }, []);

  const graphBody = useCallback((
    pending: PendingSave,
    binding: CommandEditorVariableBinding,
    requestId: string,
  ): Record<string, unknown> => ({
    contractVersion: 3,
    mutationKind: 'RELATIONSHIP_UPDATE',
    requestId,
    bindingEpoch: pending.authority.bindingEpoch,
    workspaceEpoch: pending.authority.workspaceEpoch,
    baseGraphVersion: pending.graph.graphVersion,
    graphRevision: pending.graph.graphRevision,
    ownerAssertion: pending.authority.ownerAssertion,
    targetSessionId: pending.authority.targetSessionId,
    selectionRevision: pending.authority.selectionRevision,
    homeBankingId: pending.authority.ownerAssertion.homeBankingId,
    botJobId: pending.authority.ownerAssertion.botJobId,
    botJobName: pending.authority.botJobName,
    sourceInstructionId: pending.intent.sourceInstructionId,
    selectedInstructionId: pending.intent.sourceInstructionId,
    draggedInstructionId: null,
    layoutRows: [],
    instructionRelationPatches: [],
    variableBindingPatches: [{
      instructionId: pending.intent.sourceInstructionId,
      slot: binding.slot,
      operation: binding.desiredVariableId === null ? 'CLEAR' : 'SET',
      expected: { value: binding.currentVariableId },
      replacement: { value: binding.desiredVariableId },
    }],
    variableOwnerPatches: [],
    mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
  }), []);

  const sendNextBinding = useCallback((completed: PendingSave): boolean => {
    const binding = completed.bindings[completed.bindingIndex];
    if (!binding) return false;
    const stage = stageForBinding(binding);
    const requestId = nextRequestId(stage, completed.intent.sourceInstructionId);
    const next = armTimeout({
      ...completed,
      stage,
      requestId,
      timeoutId: null,
    });
    pendingRef.current = next;
    setPendingRequestId(requestId);
    if (sendBody(next, operationForStage(stage), graphBody(next, binding, requestId))) {
      return true;
    }
    fail(next, 'The variable connection could not be sent.', 'COMMAND_EDITOR_SAVE_SEND_FAILED');
    return false;
  }, [armTimeout, fail, graphBody, sendBody]);

  const submit = useCallback((intent: CommandEditorMutationIntent): string | null => {
    if (
      intent.action !== 'UPDATE'
      || !authority
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
    ) {
      return null;
    }
    const bindings = changedCommandEditorVariableBindings(intent.variableBindings);
    const requestId = nextRequestId('COMMAND', intent.sourceInstructionId);
    const basePending: PendingSave = {
      authority,
      intent,
      bindings,
      bindingIndex: 0,
      stage: 'COMMAND',
      requestId,
      firstRequestId: requestId,
      graph: {
        graphVersion: authority.graphVersion,
        graphRevision: authority.graphRevision,
      },
      webSocket,
      timeoutId: null,
    };
    const pending = armTimeout(basePending);
    pendingRef.current = pending;
    setPendingRequestId(requestId);
    const configuration = intent.draft.configuration.kind === 'LEGACY'
      ? { kind: 'NONE' }
      : intent.draft.configuration;
    const body: Record<string, unknown> = {
      contractVersion: 1,
      requestId,
      bindingEpoch: authority.bindingEpoch,
      workspaceEpoch: authority.workspaceEpoch,
      baseGraphVersion: authority.graphVersion,
      graphRevision: authority.graphRevision,
      ownerAssertion: authority.ownerAssertion,
      targetSessionId: authority.targetSessionId,
      selectionRevision: authority.selectionRevision,
      homeBankingId: authority.ownerAssertion.homeBankingId,
      botJobId: authority.ownerAssertion.botJobId,
      botJobName: authority.botJobName,
      sourceInstructionId: intent.sourceInstructionId,
      targetBlockId: intent.targetBlockId,
      placement: {
        kind: intent.placement.kind,
        referenceInstructionId: intent.placement.kind === 'AFTER_INSTRUCTION'
          ? intent.placement.instructionId
          : null,
      },
      configuration,
      targetAction: intent.draft.action,
      allowRelationshipDisconnect: intent.allowRelationshipDisconnect,
      allowConditionalFamilyDissolve: intent.allowConditionalFamilyDissolve,
      conditionalFamilyDeleteIds: [...intent.conditionalFamilyDeleteIds],
    };
    if (sendBody(pending, operationForStage('COMMAND'), body)) return requestId;
    fail(pending, 'The command update could not be sent.', 'COMMAND_EDITOR_SAVE_SEND_FAILED');
    return null;
  }, [armTimeout, authority, connected, fail, sendBody, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    const envelope = parseEnvelope(raw);
    const pending = pendingRef.current;
    if (!envelope || !pending) return false;
    if (
      envelope.operationId !== responseForStage(pending.stage)
      || (envelope.sessionId && envelope.sessionId !== pending.authority.sessionId)
    ) {
      return false;
    }
    const body = envelope.body;
    if (!body || String(body.requestId || '') !== pending.requestId) return false;

    if (pending.timeoutId !== null) clearTimeout(pending.timeoutId);
    if (body.ok !== true || body.committed === false) {
      fail(
        pending,
        String(body.message || body.error || 'The Command Editor save was refused.'),
        String(body.errorCode || 'COMMAND_EDITOR_SAVE_REFUSED'),
      );
      return true;
    }

    const graphVersion = nonNegativeInteger(body.committedGraphVersion);
    const graphRevision = String(body.graphRevision || '').trim();
    if (graphVersion === null || !graphRevision) {
      fail(
        pending,
        'The save response did not contain the committed graph authority.',
        'COMMAND_EDITOR_SAVE_RESPONSE_INVALID',
      );
      return true;
    }
    const completed: PendingSave = {
      ...pending,
      graph: { graphVersion, graphRevision },
      bindingIndex: pending.stage === 'COMMAND'
        ? 0
        : pending.bindingIndex + 1,
    };
    if (completed.bindingIndex < completed.bindings.length) {
      sendNextBinding(completed);
      return true;
    }

    clearPending();
    onResult({
      ok: true,
      requestId: pending.firstRequestId,
      stage: pending.stage,
      message: String(body.message || 'Command and variable connections saved.'),
      errorCode: '',
      instructionId: positiveInteger(body.instructionId)
        ?? pending.intent.sourceInstructionId,
      committedGraphVersion: graphVersion,
      graphRevision,
    });
    return true;
  }, [clearPending, fail, onResult, sendNextBinding]);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const owner = authority?.ownerAssertion;
    if (
      !authority
      || !owner
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || authority.sessionId !== pending.authority.sessionId
      || authority.bindingEpoch !== pending.authority.bindingEpoch
      || authority.workspaceEpoch !== pending.authority.workspaceEpoch
      || owner.homeBankingId !== pending.authority.ownerAssertion.homeBankingId
      || owner.botJobId !== pending.authority.ownerAssertion.botJobId
    ) {
      fail(
        pending,
        'The Command Editor target changed before all connections were saved.',
        'COMMAND_EDITOR_SAVE_AUTHORITY_CHANGED',
      );
    }
  }, [authority, connected, fail, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.timeoutId !== null) clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  return {
    pendingRequestId,
    submit,
    handleMessage,
    resetPending: clearPending,
  };
};
