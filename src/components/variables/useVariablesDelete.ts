import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  parseVariablesWorkspaceMessage,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';

export const VARIABLES_DELETE_OPERATION =
  'variablesWorkspace.variables.delete' as const;
export const VARIABLES_DELETE_RESPONSE =
  'variablesWorkspace.variables.deleteResponse' as const;
export const VARIABLES_DELETE_CONTRACT_VERSION = 1 as const;

export type VariablesDeleteMode = 'SINGLE' | 'ALL';

export type VariablesDeleteResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
  deletedCount: number;
  clearedInstructionCount: number;
  committedGraphVersion: number | null;
  graphRevision: string;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesDeleteResult) => void;
  timeoutMs?: number;
};

type PendingDelete = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
let deleteSequence = 0;

const nextRequestId = (): string => {
  deleteSequence = deleteSequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : deleteSequence + 1;
  return `${Date.now().toString(36)}-variables-delete-${deleteSequence.toString(36)}`;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const responseResult = (body: Record<string, any>): VariablesDeleteResult => ({
  ok: body.ok === true,
  requestId: typeof body.requestId === 'string' ? body.requestId : '',
  message: typeof body.message === 'string' ? body.message.trim() : '',
  error: typeof body.error === 'string'
    ? body.error.trim()
    : typeof body.message === 'string' && body.ok !== true
      ? body.message.trim()
      : '',
  deletedCount: Number.isSafeInteger(Number(body.deletedCount))
    ? Number(body.deletedCount)
    : 0,
  clearedInstructionCount:
    Number.isSafeInteger(Number(body.clearedInstructionCount))
      ? Number(body.clearedInstructionCount)
      : 0,
  committedGraphVersion:
    Number.isSafeInteger(Number(body.committedGraphVersion))
      ? Number(body.committedGraphVersion)
      : null,
  graphRevision: typeof body.graphRevision === 'string'
    ? body.graphRevision.trim()
    : '',
});

export const useVariablesDelete = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingDelete | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingDelete | null => {
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
      || snapshot?.bindingEpoch !== pending.bindingEpoch
      || snapshot.workspaceEpoch !== pending.workspaceEpoch
    ) {
      clearPending();
      onResult({
        ok: false,
        requestId: pending.requestId,
        message: '',
        error: 'The Variables workspace changed before deletion completed.',
        deletedCount: 0,
        clearedInstructionCount: 0,
        committedGraphVersion: null,
        graphRevision: '',
      });
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    mode: VariablesDeleteMode,
    requestedIds: readonly number[],
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    const variableIds = [...new Set(requestedIds)]
      .filter(id => Number.isSafeInteger(id) && id > 0)
      .sort((left, right) => left - right);
    if (
      !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
      || variableIds.length === 0
      || (mode === 'SINGLE' && variableIds.length !== 1)
    ) {
      return null;
    }
    const requestId = nextRequestId();
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'Variable deletion timed out. The last Variables snapshot remains visible.',
        deletedCount: 0,
        clearedInstructionCount: 0,
        committedGraphVersion: null,
        graphRevision: '',
      });
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch,
      timeoutId,
    };
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_DELETE_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: VARIABLES_DELETE_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          mode,
          variableIds,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'Variable deletion could not be sent.',
        deletedCount: 0,
        clearedInstructionCount: 0,
        committedGraphVersion: null,
        graphRevision: '',
      });
      return null;
    }
  }, [
    clearPending,
    connected,
    onResult,
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
    if (envelope.operationId !== VARIABLES_DELETE_RESPONSE) return false;
    const body = objectValue(envelope.body);
    if (!body) return true;
    const pending = pendingRef.current;
    const requestId = typeof body.requestId === 'string'
      ? body.requestId.trim()
      : '';
    if (!pending || requestId !== pending.requestId) return true;
    const completed = clearPending();
    if (!completed) return true;
    const matchesScope =
      body.bindingEpoch === completed.bindingEpoch
      && Number(body.workspaceEpoch) === completed.workspaceEpoch;
    if (!matchesScope) {
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'Variable deletion returned for an obsolete Variables workspace.',
        deletedCount: 0,
        clearedInstructionCount: 0,
        committedGraphVersion: null,
        graphRevision: '',
      });
      return true;
    }
    onResult(responseResult(body));
    return true;
  }, [clearPending, onResult]);

  return {
    pendingRequestId,
    submit,
    handleMessage,
  };
};
