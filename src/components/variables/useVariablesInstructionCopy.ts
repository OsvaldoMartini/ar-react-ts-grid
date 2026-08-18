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

export const VARIABLES_INSTRUCTION_COPY_OPERATION =
  'variablesWorkspace.instructions.copy' as const;
export const VARIABLES_INSTRUCTION_COPY_RESPONSE =
  'variablesWorkspace.instructions.copyResponse' as const;
export const VARIABLES_INSTRUCTION_COPY_CONTRACT_VERSION = 1 as const;

export type VariablesInstructionCopyScope =
  | 'ONLY_INSTRUCTION'
  | 'WITH_PARENTS';

export type VariablesInstructionCopyRequest = {
  targetBlockId: number;
  selectedInstructionId: number;
  scope: VariablesInstructionCopyScope;
  sourceInstructionIds: readonly number[];
};

export type VariablesInstructionCopyResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
  createdInstructionIds: readonly number[];
  committedGraphVersion: number | null;
  graphRevision: string;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesInstructionCopyResult) => void;
  timeoutMs?: number;
};

type PendingCopy = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  graphVersion: number;
  graphRevision: string;
  webSocket: WebSocket;
  targetBlockId: number;
  selectedInstructionId: number;
  scope: VariablesInstructionCopyScope;
  sourceInstructionIds: readonly number[];
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
let copySequence = 0;

const nextRequestId = (): string => {
  copySequence = copySequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : copySequence + 1;
  return `${Date.now().toString(36)}-variables-copy-${copySequence.toString(36)}`;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const createdIds = (body: Record<string, any>): readonly number[] => {
  const explicit = Array.isArray(body.createdInstructionIds)
    ? body.createdInstructionIds
    : null;
  const generated = objectValue(body.generatedInstructionIds);
  const values = explicit ?? (generated ? Object.values(generated) : []);
  const seen = new Set<number>();
  return values.reduce<number[]>((result, value) => {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) return result;
    seen.add(id);
    result.push(id);
    return result;
  }, []);
};

const responseResult = (
  body: Record<string, any>,
): VariablesInstructionCopyResult => ({
  ok: body.ok === true && body.committed !== false,
  requestId: typeof body.requestId === 'string' ? body.requestId.trim() : '',
  message: typeof body.message === 'string' ? body.message.trim() : '',
  error: typeof body.error === 'string'
    ? body.error.trim()
    : typeof body.message === 'string' && body.ok !== true
      ? body.message.trim()
      : '',
  createdInstructionIds: createdIds(body),
  committedGraphVersion: Number.isSafeInteger(Number(
    body.committedGraphVersion ?? body.graphVersion,
  ))
    ? Number(body.committedGraphVersion ?? body.graphVersion)
    : null,
  graphRevision: typeof body.graphRevision === 'string'
    ? body.graphRevision.trim()
    : '',
});

const failure = (
  requestId: string,
  error: string,
): VariablesInstructionCopyResult => ({
  ok: false,
  requestId,
  message: '',
  error,
  createdInstructionIds: [],
  committedGraphVersion: null,
  graphRevision: '',
});

const exactSourceIds = (
  sourceInstructionIds: readonly number[],
): number[] | null => {
  if (sourceInstructionIds.length === 0) return null;
  const seen = new Set<number>();
  const result: number[] = [];
  for (const id of sourceInstructionIds) {
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) return null;
    seen.add(id);
    result.push(id);
  }
  return result;
};

export const useVariablesInstructionCopy = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingCopy | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingCopy | null => {
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
        'The Variables workspace connection changed before instruction copy completed.',
      ));
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    request: VariablesInstructionCopyRequest,
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    const sourceInstructionIds = exactSourceIds(request.sourceInstructionIds);
    const factIds = new Set(
      capability?.instructionFacts.map(fact => fact.instructionId) ?? [],
    );
    if (
      !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
      || !Number.isSafeInteger(request.targetBlockId)
      || request.targetBlockId <= 0
      || !Number.isSafeInteger(request.selectedInstructionId)
      || request.selectedInstructionId <= 0
      || (request.scope !== 'ONLY_INSTRUCTION'
        && request.scope !== 'WITH_PARENTS')
      || !sourceInstructionIds
      || !sourceInstructionIds.includes(request.selectedInstructionId)
      || !snapshot.blocks.some(block => block.id === request.targetBlockId)
      || sourceInstructionIds.some(id => !factIds.has(id))
      || (
        request.scope === 'ONLY_INSTRUCTION'
        && (
          sourceInstructionIds.length !== 1
          || sourceInstructionIds[0] !== request.selectedInstructionId
        )
      )
    ) {
      return null;
    }

    const requestId = nextRequestId();
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      onResult(failure(
        requestId,
        'Instruction copy timed out. The last Variables snapshot remains visible.',
      ));
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch,
      graphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      webSocket,
      targetBlockId: request.targetBlockId,
      selectedInstructionId: request.selectedInstructionId,
      scope: request.scope,
      sourceInstructionIds,
      timeoutId,
    };
    setPendingRequestId(requestId);

    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_INSTRUCTION_COPY_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: VARIABLES_INSTRUCTION_COPY_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          targetBlockId: request.targetBlockId,
          selectedInstructionId: request.selectedInstructionId,
          scope: request.scope,
          sourceInstructionIds,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult(failure(requestId, 'Instruction copy could not be sent.'));
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
    if (envelope.operationId !== VARIABLES_INSTRUCTION_COPY_RESPONSE) {
      return false;
    }
    const body = objectValue(envelope.body);
    if (!body) return true;
    const pending = pendingRef.current;
    const requestId = typeof body.requestId === 'string'
      ? body.requestId.trim()
      : '';
    if (!pending || requestId !== pending.requestId) return true;
    const completed = clearPending();
    if (!completed) return true;
    const result = responseResult(body);
    const responseSourceIds = exactSourceIds(
      Array.isArray(body.sourceInstructionIds)
        ? body.sourceInstructionIds.map(Number)
        : [],
    );
    const matchesAuthority =
      body.bindingEpoch === completed.bindingEpoch
      && Number(body.workspaceEpoch) === completed.workspaceEpoch;
    const matchesCommittedScope = !result.ok || (
      Number(body.targetBlockId) === completed.targetBlockId
      && Number(body.selectedInstructionId) === completed.selectedInstructionId
      && body.scope === completed.scope
      && responseSourceIds !== null
      && responseSourceIds.length === completed.sourceInstructionIds.length
      && responseSourceIds.every(
        (id, index) => id === completed.sourceInstructionIds[index],
      )
    );
    if (!matchesAuthority || !matchesCommittedScope) {
      onResult(failure(
        requestId,
        'Instruction copy returned for an obsolete Variables workspace.',
      ));
      return true;
    }
    if (
      result.ok
      && (
        result.committedGraphVersion === null
        || result.committedGraphVersion <= completed.graphVersion
        || result.createdInstructionIds.length
          !== completed.sourceInstructionIds.length
      )
    ) {
      onResult(failure(
        requestId,
        'Instruction copy returned an invalid commit receipt. Refresh before retrying.',
      ));
      return true;
    }
    onResult(result);
    return true;
  }, [clearPending, onResult]);

  return {
    pendingRequestId,
    submit,
    handleMessage,
    resetPending: clearPending,
  };
};
