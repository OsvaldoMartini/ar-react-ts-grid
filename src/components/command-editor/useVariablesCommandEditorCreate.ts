import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseVariablesWorkspaceMessage,
  VARIABLES_MANAGER_SESSION_ID,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';
import type { CommandEditorMutationIntent } from './commandEditorMutation';
import { validateIfFamilyCreate } from '../variables/domain/ifFamilyRules';

export const VARIABLES_COMMAND_CREATE_OPERATION =
  'variablesWorkspace.commandEditor.create' as const;
export const VARIABLES_COMMAND_CREATE_RESPONSE =
  'variablesWorkspace.commandEditor.createResponse' as const;

export interface VariablesCommandCreateResult {
  ok: boolean;
  requestId: string;
  message: string;
  errorCode: string;
  createdInstructionId: number | null;
}

interface Context {
  webSocket: WebSocket | null;
  connected: boolean;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesCommandCreateResult) => void;
  timeoutMs?: number;
}

interface Pending {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 15_000;
let sequence = 0;
const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any> : null;
const failure = (requestId: string, message: string): VariablesCommandCreateResult => ({
  ok: false,
  requestId,
  message,
  errorCode: 'COMMAND_CREATE_CLIENT_REFUSED',
  createdInstructionId: null,
});

export const useVariablesCommandEditorCreate = ({
  webSocket,
  connected,
  snapshot,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<Pending | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    return pending;
  }, []);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || snapshot?.bindingEpoch !== pending.bindingEpoch
      || snapshot.workspaceEpoch !== pending.workspaceEpoch) {
      clearPending();
      onResult(failure(
        pending.requestId,
        'The Variables workspace changed before Add Command completed.',
      ));
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (pending) clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((intent: CommandEditorMutationIntent): string | null => {
    const capability = snapshot?.mutationCapability;
    const configuration = intent.draft.configuration;
    const wireConfiguration = configuration.kind === 'LEGACY'
      ? { kind: 'NONE' }
      : configuration;
    if (intent.action !== 'CREATE_NEW'
      || !snapshot || !capability || !connected || !webSocket
      || webSocket.readyState !== WebSocket.OPEN || pendingRef.current) return null;

    // React owns the IF-family rules (backend refusals are parked): refuse here, visibly.
    const ifFamilyRefusal = validateIfFamilyCreate(
      snapshot,
      intent.targetBlockId,
      intent.draft.action,
      intent.placement.kind === 'AFTER_INSTRUCTION'
        ? { kind: 'AFTER_INSTRUCTION', instructionId: intent.placement.instructionId }
        : { kind: intent.placement.kind },
    );
    if (ifFamilyRefusal) {
      onResult({
        ok: false,
        requestId: '',
        message: ifFamilyRefusal.message,
        errorCode: ifFamilyRefusal.code,
        createdInstructionId: null,
      });
      return null;
    }

    sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
    const requestId = `${Date.now().toString(36)}-command-create-${sequence.toString(36)}`;
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult(failure(
        requestId,
        'Add Command timed out. Existing commands remain unchanged.',
      ));
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch,
      webSocket,
      timeoutId,
    };
    setPendingRequestId(requestId);

    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_COMMAND_CREATE_OPERATION,
        sessionId: VARIABLES_MANAGER_SESSION_ID,
        body: JSON.stringify({
          contractVersion: 1,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          ...(intent.targetBlockId > 0 ? { targetBlockId: intent.targetBlockId } : {}),
          placement: {
            kind: intent.placement.kind,
            referenceInstructionId: intent.placement.kind === 'AFTER_INSTRUCTION'
              ? intent.placement.instructionId : null,
          },
          configuration: wireConfiguration,
          targetAction: intent.draft.action,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult(failure(requestId, 'Add Command could not be sent.'));
      return null;
    }
  }, [clearPending, connected, onResult, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(
        typeof raw === 'string' ? raw : JSON.stringify(raw));
    } catch (_) { return false; }
    if (envelope.operationId !== VARIABLES_COMMAND_CREATE_RESPONSE) return false;
    const body = objectValue(envelope.body);
    const pending = pendingRef.current;
    const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
    if (!body || !pending || requestId !== pending.requestId) return false;
    clearPending();
    onResult({
      ok: body.ok === true && body.committed !== false,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      errorCode: typeof body.errorCode === 'string' ? body.errorCode.trim() : '',
      createdInstructionId: Number.isSafeInteger(Number(body.createdInstructionId))
        ? Number(body.createdInstructionId) : null,
    });
    return true;
  }, [clearPending, onResult]);

  return { pendingRequestId, submit, handleMessage, resetPending: clearPending };
};
