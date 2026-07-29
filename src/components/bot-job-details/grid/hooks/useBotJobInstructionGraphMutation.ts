import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  BOT_JOB_GRAPH_MUTATION_RESPONSE,
  BOT_JOB_GRAPH_MUTATION_TYPE,
  INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
  type BotJobGraphMutationDraft,
  type BotJobGraphMutationErrorResponse,
  type BotJobGraphMutationResponse,
  type BotJobGraphMutationSuccessResponse,
  type InstructionGraphMutationV3Request,
  type InstructionGraphOwnerAssertion,
  isBotJobGraphMutationResponse,
  sameInstructionGraphOwner,
} from '../domain/instructionGraphMutation.contract';

export type BotJobGraphMutationCapability = {
  enabled: boolean;
  contractVersion: typeof INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION;
  workspaceEpoch: number;
  graphVersion: number;
  graphRevision: string;
  ownerAssertion: InstructionGraphOwnerAssertion & {
    workspaceKind: 'BOT_JOB';
    botJobId: number;
  };
};

export type BotJobGraphMutationContext = {
  webSocket: WebSocket | null;
  connected: boolean;
  capability: BotJobGraphMutationCapability | null;
  timeoutMs?: number;
};

export type BotJobGraphMutationCallbacks = {
  rollback: (reason: string) => void;
  committed?: (response: BotJobGraphMutationSuccessResponse) => void;
  refused?: (response: BotJobGraphMutationErrorResponse) => void;
};

type PendingMutation = {
  request: InstructionGraphMutationV3Request;
  callbacks: BotJobGraphMutationCallbacks;
  timeoutId: ReturnType<typeof setTimeout>;
  webSocket: WebSocket;
};

type MutationEnvelope = {
  sessionId?: unknown;
  operationId?: unknown;
  body?: unknown;
};

const BOT_JOB_SESSION_ID = 'botJobTasks';
const DEFAULT_TIMEOUT_MS = 12_000;

const parseBody = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

const parseResponseEnvelope = (
  raw: unknown,
): BotJobGraphMutationResponse | null => {
  let envelopeValue = raw;
  if (typeof raw === 'string') {
    try {
      envelopeValue = JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  if (!envelopeValue || typeof envelopeValue !== 'object') return null;
  const envelope = envelopeValue as MutationEnvelope;
  if (
    envelope.sessionId !== BOT_JOB_SESSION_ID
    || envelope.operationId !== BOT_JOB_GRAPH_MUTATION_RESPONSE
  ) {
    return null;
  }
  const body = parseBody(envelope.body);
  return isBotJobGraphMutationResponse(body) ? body : null;
};

let requestSequence = 0;

const requestEntropy = (): string => {
  try {
    const cryptoProvider = globalThis.crypto;
    if (typeof cryptoProvider?.randomUUID === 'function') {
      return cryptoProvider.randomUUID();
    }
    if (typeof cryptoProvider?.getRandomValues === 'function') {
      const values = new Uint32Array(4);
      cryptoProvider.getRandomValues(values);
      return Array.from(values, value => value.toString(36)).join('-');
    }
  } catch (_) {
    // A runtime may expose a restricted crypto object. The monotonic sequence
    // still guarantees uniqueness inside this mounted JavaScript process.
  }
  return `${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36).slice(2)}`;
};

const requestId = (): string => {
  requestSequence = requestSequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : requestSequence + 1;
  return [
    Date.now().toString(36),
    BOT_JOB_SESSION_ID,
    'graph-v3',
    requestSequence.toString(36),
    requestEntropy(),
  ].join('-');
};

const isUsableCapability = (
  value: unknown,
): value is BotJobGraphMutationCapability => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BotJobGraphMutationCapability>;
  const ownerValue = candidate.ownerAssertion;
  if (!ownerValue || typeof ownerValue !== 'object') return false;
  const owner = ownerValue as Partial<
    BotJobGraphMutationCapability['ownerAssertion']
  >;
  return candidate.enabled === true
    && candidate.contractVersion
      === INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION
    && Number.isSafeInteger(candidate.workspaceEpoch)
    && (candidate.workspaceEpoch ?? 0) > 0
    && Number.isSafeInteger(candidate.graphVersion)
    && (candidate.graphVersion ?? -1) >= 0
    && typeof candidate.graphRevision === 'string'
    && candidate.graphRevision.trim().length > 0
    && owner.workspaceKind === 'BOT_JOB'
    && Number.isSafeInteger(owner.homeBankingId)
    && (owner.homeBankingId ?? 0) > 0
    && Number.isSafeInteger(owner.botJobId)
    && (owner.botJobId ?? 0) > 0;
};

/**
 * Private Bot Job v3 transport. It is deliberately not shared with Components
 * and remains inert until the backend advertises an exact v3 capability.
 */
export const useBotJobInstructionGraphMutation = ({
  webSocket,
  connected,
  capability,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: BotJobGraphMutationContext) => {
  const pendingRef = useRef<PendingMutation | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingMutation | null => {
    const current = pendingRef.current;
    if (!current) return null;
    clearTimeout(current.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    return current;
  }, []);

  const cancelPending = useCallback((reason = 'CANCELLED') => {
    const current = clearPending();
    current?.callbacks.rollback(reason);
  }, [clearPending]);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const usableCapability = isUsableCapability(capability);
    const sameWorkspace = usableCapability
      && capability.workspaceEpoch === pending.request.workspaceEpoch
      && sameInstructionGraphOwner(
        capability.ownerAssertion,
        pending.request.ownerAssertion,
      );
    const compatibleAuthority = sameWorkspace
      && (
        capability.graphVersion > pending.request.baseGraphVersion
        || (
          capability.graphVersion === pending.request.baseGraphVersion
          && capability.graphRevision === pending.request.graphRevision
        )
      );
    if (
      !webSocket
      || !connected
      || webSocket.readyState !== WebSocket.OPEN
      || pending.webSocket !== webSocket
      || !compatibleAuthority
    ) {
      const retired = clearPending();
      retired?.callbacks.rollback(
        !connected || !webSocket ? 'DISCONNECTED' : 'WORKSPACE_CHANGED',
      );
    }
  }, [capability, clearPending, connected, webSocket]);

  useEffect(() => () => {
    const current = pendingRef.current;
    if (!current) return;
    clearTimeout(current.timeoutId);
    pendingRef.current = null;
    current.callbacks.rollback('UNMOUNTED');
  }, []);

  const submitMutation = useCallback((
    draft: BotJobGraphMutationDraft,
    callbacks: BotJobGraphMutationCallbacks,
  ): string | null => {
    if (
      !webSocket
      || !connected
      || webSocket.readyState !== WebSocket.OPEN
      || !isUsableCapability(capability)
      || pendingRef.current
    ) {
      return null;
    }

    const nextRequestId = requestId();
    const request: InstructionGraphMutationV3Request = {
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      mutationKind: draft.mutationKind,
      requestId: nextRequestId,
      baseGraphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      workspaceEpoch: capability.workspaceEpoch,
      ownerAssertion: capability.ownerAssertion,
      draggedInstructionId: draft.draggedInstructionId,
      layoutRows: [...draft.layoutRows],
      instructionRelationPatches: [...draft.instructionRelationPatches],
      variableBindingPatches: [...draft.variableBindingPatches],
      variableOwnerPatches: [...draft.variableOwnerPatches],
    };
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.request.requestId !== nextRequestId) return;
      const timedOut = clearPending();
      timedOut?.callbacks.rollback('TIMEOUT');
    }, timeoutMs);
    pendingRef.current = {
      request,
      callbacks,
      timeoutId,
      webSocket,
    };
    setPendingRequestId(nextRequestId);

    try {
      webSocket.send(JSON.stringify({
        type: BOT_JOB_GRAPH_MUTATION_TYPE,
        sessionId: BOT_JOB_SESSION_ID,
        ...request,
      }));
      return nextRequestId;
    } catch (_) {
      const failed = clearPending();
      failed?.callbacks.rollback('SEND_FAILED');
      return null;
    }
  }, [capability, clearPending, connected, timeoutMs, webSocket]);

  const handleMutationMessage = useCallback((raw: unknown): boolean => {
    const response = parseResponseEnvelope(raw);
    const pending = pendingRef.current;
    if (
      !response
      || !pending
      || response.requestId !== pending.request.requestId
      || response.workspaceEpoch !== pending.request.workspaceEpoch
      || !sameInstructionGraphOwner(
        response.ownerAssertion,
        pending.request.ownerAssertion,
      )
    ) {
      return false;
    }

    if (
      response.ok
      && response.committedGraphVersion
        <= pending.request.baseGraphVersion
    ) {
      return false;
    }

    const completed = clearPending();
    if (!completed) return false;
    if (response.ok) {
      completed.callbacks.committed?.(response);
    } else {
      completed.callbacks.rollback(response.errorCode);
      completed.callbacks.refused?.(response);
    }
    return true;
  }, [clearPending]);

  return {
    pendingRequestId,
    submitMutation,
    handleMutationMessage,
    cancelPending,
  };
};
