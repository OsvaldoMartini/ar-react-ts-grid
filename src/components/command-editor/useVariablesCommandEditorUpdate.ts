import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseVariablesWorkspaceMessage,
  VARIABLES_MANAGER_SESSION_ID,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';
import type { CommandEditorMutationIntent } from './commandEditorMutation';

export const VARIABLES_COMMAND_UPDATE_OPERATION =
  'variablesWorkspace.commandEditor.update' as const;
export const VARIABLES_COMMAND_UPDATE_RESPONSE =
  'variablesWorkspace.commandEditor.updateResponse' as const;

export interface VariablesCommandUpdateResult {
  ok: boolean;
  requestId: string;
  message: string;
  errorCode: string;
  instructionId: number | null;
}

interface Context {
  webSocket: WebSocket | null;
  connected: boolean;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesCommandUpdateResult) => void;
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

const failure = (requestId: string, message: string): VariablesCommandUpdateResult => ({
  ok: false,
  requestId,
  message,
  errorCode: 'COMMAND_UPDATE_CLIENT_REFUSED',
  instructionId: null,
});

const bodyObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

export const useVariablesCommandEditorUpdate = ({
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
    if (
      !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || snapshot?.bindingEpoch !== pending.bindingEpoch
      || snapshot.workspaceEpoch !== pending.workspaceEpoch
    ) {
      clearPending();
      onResult(failure(
        pending.requestId,
        'The Variables workspace changed before the command update completed.',
      ));
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((intent: CommandEditorMutationIntent): string | null => {
    const capability = snapshot?.mutationCapability;
    const configuration = intent.draft.configuration;
    if (
      intent.action !== 'UPDATE'
      || configuration.kind === 'LEGACY'
      || !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
    ) {
      return null;
    }
    sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
    const requestId = `${Date.now().toString(36)}-command-update-${sequence.toString(36)}`;
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult(failure(
        requestId,
        'Command update timed out. The last Variables snapshot remains visible.',
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
        type: VARIABLES_COMMAND_UPDATE_OPERATION,
        sessionId: VARIABLES_MANAGER_SESSION_ID,
        body: JSON.stringify({
          contractVersion: 1,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          sourceInstructionId: intent.sourceInstructionId,
          targetBlockId: intent.targetBlockId,
          placement: {
            kind: intent.placement.kind,
            referenceInstructionId: intent.placement.kind === 'AFTER_INSTRUCTION'
              ? intent.placement.instructionId
              : null,
          },
          configuration,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult(failure(requestId, 'The command update could not be sent.'));
      return null;
    }
  }, [clearPending, connected, onResult, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(
        typeof raw === 'string' ? raw : JSON.stringify(raw),
      );
    } catch (_) {
      return false;
    }
    if (envelope.operationId !== VARIABLES_COMMAND_UPDATE_RESPONSE) return false;
    const body = bodyObject(envelope.body);
    const pending = pendingRef.current;
    const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
    if (!body || !pending || requestId !== pending.requestId) return false;
    clearPending();
    onResult({
      ok: body.ok === true && body.committed !== false,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      errorCode: typeof body.errorCode === 'string' ? body.errorCode.trim() : '',
      instructionId: Number.isSafeInteger(Number(body.instructionId))
        ? Number(body.instructionId)
        : null,
    });
    return true;
  }, [clearPending, onResult]);

  return { pendingRequestId, submit, handleMessage, resetPending: clearPending };
};
