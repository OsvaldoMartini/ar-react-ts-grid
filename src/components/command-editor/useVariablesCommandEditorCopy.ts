import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseVariablesWorkspaceMessage,
  VARIABLES_MANAGER_SESSION_ID,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';
import type { CommandEditorMutationIntent } from './commandEditorMutation';

export const VARIABLES_COMMAND_COPY_OPERATION =
  'variablesWorkspace.commandEditor.copy' as const;
export const VARIABLES_COMMAND_COPY_RESPONSE =
  'variablesWorkspace.commandEditor.copyResponse' as const;

export interface VariablesCommandCopyResult {
  ok: boolean;
  requestId: string;
  message: string;
  errorCode: string;
  createdInstructionId: number | null;
  action: 'COPY_NEW';
}

interface Context {
  webSocket: WebSocket | null;
  connected: boolean;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesCommandCopyResult) => void;
  timeoutMs?: number;
}

interface Pending {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
  action: 'COPY_NEW';
}

const DEFAULT_TIMEOUT_MS = 15_000;
let sequence = 0;
const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any> : null;
const failure = (
  requestId: string,
  message: string,
  action: 'COPY_NEW' = 'COPY_NEW',
): VariablesCommandCopyResult => ({
  ok: false, requestId, message,
  errorCode: 'COMMAND_COPY_CLIENT_REFUSED', createdInstructionId: null, action,
});

export const useVariablesCommandEditorCopy = ({
  webSocket, connected, snapshot, onResult, timeoutMs = DEFAULT_TIMEOUT_MS,
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
      onResult(failure(pending.requestId,
        'The Variables workspace changed before command creation completed.',
        pending.action));
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
    const action = intent.action;
    // LEGACY drafts (no-config commands such as GET/REFRESH) travel as the
    // wire kind NONE so command transformations into them can persist.
    const wireConfiguration = configuration.kind === 'LEGACY'
      ? { kind: 'NONE' }
      : configuration;
    if (action !== 'COPY_NEW'
      || !snapshot || !capability || !connected || !webSocket
      || webSocket.readyState !== WebSocket.OPEN || pendingRef.current) return null;
    sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
    const requestId = `${Date.now().toString(36)}-command-copy-${sequence.toString(36)}`;
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult(failure(requestId,
        'Command creation timed out. The original commands remain unchanged.',
        action));
    }, timeoutMs);
    pendingRef.current = {
      requestId, bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch, webSocket, timeoutId,
      action,
    };
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_COMMAND_COPY_OPERATION,
        sessionId: VARIABLES_MANAGER_SESSION_ID,
        body: JSON.stringify({
          contractVersion: 1,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          sourceInstructionId: intent.sourceInstructionId,
          createBlank: false,
          targetBlockId: intent.targetBlockId,
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
      onResult(failure(requestId, 'The command creation could not be sent.', action));
      return null;
    }
  }, [clearPending, connected, onResult, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(
        typeof raw === 'string' ? raw : JSON.stringify(raw));
    } catch (_) { return false; }
    if (envelope.operationId !== VARIABLES_COMMAND_COPY_RESPONSE) return false;
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
      action: pending.action,
    });
    return true;
  }, [clearPending, onResult]);

  return { pendingRequestId, submit, handleMessage, resetPending: clearPending };
};
