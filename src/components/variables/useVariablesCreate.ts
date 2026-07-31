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

export const VARIABLES_CREATE_OPERATION =
  'variablesWorkspace.variables.create' as const;
export const VARIABLES_CREATE_RESPONSE =
  'variablesWorkspace.variables.createResponse' as const;
export const VARIABLES_CREATE_CONTRACT_VERSION = 1 as const;

export type VariablesCreateDraft = {
  name: string;
};

export type VariablesCreateResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
  variableId: number | null;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesCreateResult) => void;
  timeoutMs?: number;
};

type PendingCreate = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
let createSequence = 0;

const nextRequestId = (): string => {
  createSequence = createSequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : createSequence + 1;
  return `${Date.now().toString(36)}-variables-create-${createSequence.toString(36)}`;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

export const useVariablesCreate = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingCreate | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingCreate | null => {
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
        error: 'The Variables workspace changed before creation completed.',
        variableId: null,
      });
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((draft: VariablesCreateDraft): string | null => {
    const capability = snapshot?.mutationCapability;
    const name = draft.name.trim();
    if (
      !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
      || !name
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
        error: 'Variable creation timed out. No local variable was created.',
        variableId: null,
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
        type: VARIABLES_CREATE_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: VARIABLES_CREATE_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          name,
          initialState: 'VOID',
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'Variable creation could not be sent.',
        variableId: null,
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
    if (envelope.operationId !== VARIABLES_CREATE_RESPONSE) return false;
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
        error: 'Variable creation returned for an obsolete Variables workspace.',
        variableId: null,
      });
      return true;
    }
    const ok = body.ok === true;
    const variableId = Number(body.variableId ?? body.createdVariableId);
    onResult({
      ok,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      error: typeof body.error === 'string'
        ? body.error.trim()
        : ok
          ? ''
          : typeof body.message === 'string'
            ? body.message.trim()
            : 'Variable creation was refused.',
      variableId: Number.isSafeInteger(variableId) && variableId > 0
        ? variableId
        : null,
    });
    return true;
  }, [clearPending, onResult]);

  return {
    pendingRequestId,
    submit,
    handleMessage,
    resetPending: clearPending,
  };
};
