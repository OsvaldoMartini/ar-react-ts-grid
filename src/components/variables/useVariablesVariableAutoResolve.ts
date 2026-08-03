import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseVariablesWorkspaceMessage,
  VARIABLES_MANAGER_SESSION_ID,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';

export const VARIABLES_VARIABLE_AUTO_RESOLVE_OPERATION =
  'variablesWorkspace.variables.autoResolve' as const;
export const VARIABLES_VARIABLE_AUTO_RESOLVE_RESPONSE =
  'variablesWorkspace.variables.autoResolveResponse' as const;

export interface VariablesVariableAutoResolveResult {
  ok: boolean;
  requestId: string;
  message: string;
  errorCode: string;
  createdCount: number;
  connectedExisting: number;
}

export interface VariablesVariableAutoResolveSubmission {
  instructionIds: readonly number[];
  /** Fresh CAS base when chaining after a committed graph mutation. */
  baseGraphVersion?: number;
  graphRevision?: string;
}

interface Context {
  webSocket: WebSocket | null;
  connected: boolean;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesVariableAutoResolveResult) => void;
  timeoutMs?: number;
}

interface Pending {
  requestId: string;
  bindingEpoch: string;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 15_000;
let sequence = 0;

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const failure = (
  requestId: string,
  message: string,
): VariablesVariableAutoResolveResult => ({
  ok: false,
  requestId,
  message,
  errorCode: 'VARIABLE_AUTO_RESOLVE_CLIENT_REFUSED',
  createdCount: 0,
  connectedExisting: 0,
});

export const useVariablesVariableAutoResolve = ({
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
    ) {
      clearPending();
      onResult(failure(
        pending.requestId,
        'The Variables workspace changed before variable resolution completed.',
      ));
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (pending) clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    submission: VariablesVariableAutoResolveSubmission,
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    if (
      submission.instructionIds.length === 0
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
    const requestId = `${Date.now().toString(36)}-variable-resolve-${sequence.toString(36)}`;
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult(failure(
        requestId,
        'Variable resolution timed out. The current Variables snapshot remains visible.',
      ));
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      webSocket,
      timeoutId,
    };
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_VARIABLE_AUTO_RESOLVE_OPERATION,
        sessionId: VARIABLES_MANAGER_SESSION_ID,
        body: JSON.stringify({
          contractVersion: 1,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: submission.baseGraphVersion ?? capability.graphVersion,
          graphRevision: submission.graphRevision ?? capability.graphRevision,
          instructionIds: [...submission.instructionIds],
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult(failure(requestId, 'The variable resolution could not be sent.'));
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
    if (envelope.operationId !== VARIABLES_VARIABLE_AUTO_RESOLVE_RESPONSE) return false;
    const body = objectValue(envelope.body);
    const pending = pendingRef.current;
    const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
    if (!body || !pending || requestId !== pending.requestId) return false;
    clearPending();
    const createdVariables = Array.isArray(body.createdVariables)
      ? body.createdVariables
      : [];
    onResult({
      ok: body.ok === true && body.committed !== false,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      errorCode: typeof body.errorCode === 'string' ? body.errorCode.trim() : '',
      createdCount: createdVariables.length,
      connectedExisting: Number.isSafeInteger(Number(body.connectedExisting))
        ? Number(body.connectedExisting)
        : 0,
    });
    return true;
  }, [clearPending, onResult]);

  return { pendingRequestId, submit, handleMessage, resetPending: clearPending };
};
