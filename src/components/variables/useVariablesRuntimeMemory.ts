import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  normalizeRuntimeVariableMemorySnapshot,
  parseVariablesWorkspaceMessage,
  type RuntimeVariableMemorySnapshot,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onMemory: (memory: RuntimeVariableMemorySnapshot) => void;
  onStatus: (status: Status) => void;
  timeoutMs?: number;
};

type PendingEdit = {
  requestId: string;
  variableId: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

const MEMORY_SNAPSHOT_OPERATION =
  'variablesWorkspace.runtimeMemory.snapshot';
const MEMORY_UPDATE_RESPONSE =
  'variablesWorkspace.runtimeMemory.updateResponse';
const MEMORY_UPDATE_OPERATION =
  'variablesWorkspace.runtimeMemory.update';
const DEFAULT_TIMEOUT_MS = 10_000;

const bodyObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

let editSequence = 0;

const nextRequestId = (): string => {
  editSequence = editSequence >= Number.MAX_SAFE_INTEGER ? 1 : editSequence + 1;
  return `${Date.now().toString(36)}-variables-memory-${editSequence.toString(36)}`;
};

/**
 * Private Variables runtime-memory transport.
 *
 * Values are never written to variable definitions. A blank string is a valid
 * runtime VALUE; VOID remains an explicit state sent by the backend.
 */
export const useVariablesRuntimeMemory = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onMemory,
  onStatus,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<Map<string, PendingEdit>>(new Map());
  const [pendingVariableIds, setPendingVariableIds] =
    useState<ReadonlySet<number>>(() => new Set());

  const syncPendingIds = useCallback(() => {
    setPendingVariableIds(new Set(
      [...pendingRef.current.values()].map(edit => edit.variableId),
    ));
  }, []);

  const clearPending = useCallback((requestId: string): PendingEdit | null => {
    const pending = pendingRef.current.get(requestId) ?? null;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current.delete(requestId);
    syncPendingIds();
    return pending;
  }, [syncPendingIds]);

  useEffect(() => () => {
    pendingRef.current.forEach(edit => clearTimeout(edit.timeoutId));
    pendingRef.current.clear();
  }, []);

  useEffect(() => {
    if (connected && webSocket?.readyState === WebSocket.OPEN) return;
    pendingRef.current.forEach(edit => clearTimeout(edit.timeoutId));
    pendingRef.current.clear();
    syncPendingIds();
  }, [connected, syncPendingIds, webSocket]);

  const updateValue = useCallback((variableId: number, value: string): boolean => {
    if (
      !snapshot
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingVariableIds.has(variableId)
    ) {
      return false;
    }
    const requestId = nextRequestId();
    const timeoutId = setTimeout(() => {
      if (!clearPending(requestId)) return;
      onStatus({
        level: 'error',
        text: `Variable #${variableId} was not updated. The request timed out.`,
      });
    }, timeoutMs);
    pendingRef.current.set(requestId, { requestId, variableId, timeoutId });
    syncPendingIds();
    try {
      webSocket.send(JSON.stringify({
        type: MEMORY_UPDATE_OPERATION,
        sessionId,
        body: JSON.stringify({
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          variableId,
          operation: 'SET',
          value,
        }),
      }));
      onStatus({
        level: 'warn',
        text: `Updating runtime variable #${variableId}...`,
      });
      return true;
    } catch (_) {
      clearPending(requestId);
      onStatus({
        level: 'error',
        text: `Variable #${variableId} could not be sent for update.`,
      });
      return false;
    }
  }, [
    clearPending,
    connected,
    onStatus,
    pendingVariableIds,
    sessionId,
    snapshot,
    syncPendingIds,
    timeoutMs,
    webSocket,
  ]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(String(raw));
    } catch (_) {
      return false;
    }
    if (
      envelope.operationId !== MEMORY_SNAPSHOT_OPERATION
      && envelope.operationId !== MEMORY_UPDATE_RESPONSE
    ) {
      return false;
    }
    const body = bodyObject(envelope.body);
    const matchesCurrentScope = Boolean(
      snapshot
      && body?.bindingEpoch === snapshot.bindingEpoch
      && Number(body?.workspaceEpoch) === snapshot.workspaceEpoch
      && Number(body?.botJobId) === snapshot.botJob.id
      && Number(body?.homeBankingId) === snapshot.botJob.homeBankingId,
    );
    if (envelope.operationId === MEMORY_UPDATE_RESPONSE) {
      const requestId = typeof body?.requestId === 'string'
        ? body.requestId.trim()
        : '';
      const pending = requestId ? clearPending(requestId) : null;
      if (!pending) return true;
      if (body?.ok === false) {
        onStatus({
          level: 'error',
          text: typeof body.error === 'string' && body.error.trim()
            ? body.error.trim()
            : `Variable #${pending.variableId} was not updated.`,
        });
      } else {
        if (matchesCurrentScope) {
          const normalized = normalizeRuntimeVariableMemorySnapshot(
            body?.runtimeMemory,
            snapshot?.variables ?? [],
          );
          if (normalized) onMemory(normalized);
        }
        onStatus({
          level: 'ok',
          text: typeof body?.message === 'string' && body.message.trim()
            ? body.message.trim()
            : `Variable #${pending.variableId} updated.`,
        });
      }
      return true;
    }

    if (!snapshot || body?.ok === false || !matchesCurrentScope) return true;
    const normalized = normalizeRuntimeVariableMemorySnapshot(
      body?.runtimeMemory ?? body,
      snapshot.variables,
    );
    if (normalized) onMemory(normalized);
    return true;
  }, [clearPending, onMemory, onStatus, snapshot]);

  return {
    pendingVariableIds,
    updateValue,
    handleMessage,
  };
};
