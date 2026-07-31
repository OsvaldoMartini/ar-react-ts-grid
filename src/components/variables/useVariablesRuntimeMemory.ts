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
export const MEMORY_CLEAR_ALL_OPERATION =
  'variablesWorkspace.runtimeMemory.clearAll' as const;
export const MEMORY_CLEAR_ALL_RESPONSE =
  'variablesWorkspace.runtimeMemory.clearAllResponse' as const;
export const RUNTIME_MEMORY_CONTRACT_VERSION = 1 as const;
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
  const pendingClearAllRef = useRef<{
    requestId: string;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const [pendingVariableIds, setPendingVariableIds] =
    useState<ReadonlySet<number>>(() => new Set());
  const [pendingClearAll, setPendingClearAll] = useState(false);

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
    if (pendingClearAllRef.current) {
      clearTimeout(pendingClearAllRef.current.timeoutId);
      pendingClearAllRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (connected && webSocket?.readyState === WebSocket.OPEN) return;
    pendingRef.current.forEach(edit => clearTimeout(edit.timeoutId));
    pendingRef.current.clear();
    if (pendingClearAllRef.current) {
      clearTimeout(pendingClearAllRef.current.timeoutId);
      pendingClearAllRef.current = null;
      setPendingClearAll(false);
    }
    syncPendingIds();
  }, [connected, syncPendingIds, webSocket]);

  const updateValue = useCallback((variableId: number, value: string): boolean => {
    if (
      !snapshot
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingClearAllRef.current !== null
      || [...pendingRef.current.values()].some(
        edit => edit.variableId === variableId,
      )
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
      const entryRevision = snapshot.runtimeMemory.variables.find(
        entry => entry.variableId === variableId,
      )?.entryRevision ?? 0;
      webSocket.send(JSON.stringify({
        type: MEMORY_UPDATE_OPERATION,
        sessionId,
        body: JSON.stringify({
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          contractVersion: RUNTIME_MEMORY_CONTRACT_VERSION,
          baseRuntimeRevision: snapshot.runtimeMemory.revision,
          variableId,
          operation: 'SET',
          expectedEntryRevision: entryRevision,
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
    sessionId,
    snapshot,
    syncPendingIds,
    timeoutMs,
    webSocket,
  ]);

  const clearAllValues = useCallback((): boolean => {
    if (
      !snapshot
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingClearAllRef.current !== null
      || pendingRef.current.size > 0
    ) {
      return false;
    }
    const requestId = nextRequestId();
    const timeoutId = setTimeout(() => {
      if (pendingClearAllRef.current?.requestId !== requestId) return;
      pendingClearAllRef.current = null;
      setPendingClearAll(false);
      onStatus({
        level: 'error',
        text: 'Runtime values were not cleared. The request timed out.',
      });
    }, timeoutMs);
    pendingClearAllRef.current = { requestId, timeoutId };
    setPendingClearAll(true);
    try {
      webSocket.send(JSON.stringify({
        type: MEMORY_CLEAR_ALL_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: RUNTIME_MEMORY_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseRuntimeRevision: snapshot.runtimeMemory.revision,
        }),
      }));
      onStatus({
        level: 'warn',
        text: 'Clearing all runtime values to VOID...',
      });
      return true;
    } catch (_) {
      clearTimeout(timeoutId);
      pendingClearAllRef.current = null;
      setPendingClearAll(false);
      onStatus({
        level: 'error',
        text: 'Clear All Values could not be sent.',
      });
      return false;
    }
  }, [
    connected,
    onStatus,
    sessionId,
    snapshot,
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
      && envelope.operationId !== MEMORY_CLEAR_ALL_RESPONSE
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
    if (envelope.operationId === MEMORY_CLEAR_ALL_RESPONSE) {
      const requestId = typeof body?.requestId === 'string'
        ? body.requestId.trim()
        : '';
      const pending = pendingClearAllRef.current;
      if (!pending || requestId !== pending.requestId) return true;
      clearTimeout(pending.timeoutId);
      pendingClearAllRef.current = null;
      setPendingClearAll(false);
      if (body?.ok === false) {
        onStatus({
          level: 'error',
          text: typeof body.error === 'string' && body.error.trim()
            ? body.error.trim()
            : 'Runtime values were not cleared.',
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
            : 'All runtime values were cleared to VOID.',
        });
      }
      return true;
    }
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
    pendingClearAll,
    updateValue,
    clearAllValues,
    handleMessage,
  };
};
