import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
  isBotJobGraphMutationResponse,
  sameInstructionGraphOwner,
  type BotJobGraphMutationDraft,
  type BotJobGraphMutationErrorResponse,
  type BotJobGraphMutationSuccessResponse,
  type InstructionGraphMutationV3Request,
} from '../bot-job-details/grid/domain/instructionGraphMutation.contract';
import {
  VARIABLES_MANAGER_SESSION_ID,
  type VariableWorkspaceSnapshot,
  type VariablesMutationProfile,
} from '../variablesWorkspace.contract';

export const VARIABLES_GRAPH_MUTATION_TYPE =
  'variablesWorkspace.graphMutationV3' as const;
export const VARIABLES_GRAPH_MUTATION_RESPONSE =
  'variablesWorkspace.graphMutationV3Response' as const;

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  snapshot: VariableWorkspaceSnapshot | null;
  timeoutMs?: number;
};

type Callbacks = {
  committed: (response: BotJobGraphMutationSuccessResponse) => void;
  refused: (
    response: BotJobGraphMutationErrorResponse | null,
    reason: string,
  ) => void;
};

type Pending = {
  request: InstructionGraphMutationV3Request;
  bindingEpoch: string;
  webSocket: WebSocket;
  callbacks: Callbacks;
  mutationProfile: VariablesMutationProfile;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 12_000;
let sequence = 0;

const nextRequestId = (): string => {
  sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
  const entropy = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-variables-v3-${sequence.toString(36)}-${entropy}`;
};

const parseMutationBody = (body: unknown) => {
  let value = body;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  return isBotJobGraphMutationResponse(value) ? value : null;
};

const parseEnvelope = (
  raw: unknown,
): ReturnType<typeof parseMutationBody> => {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  if (!value || typeof value !== 'object') return null;
  const envelope = value as Record<string, unknown>;
  if (
    envelope.sessionId !== VARIABLES_MANAGER_SESSION_ID
    || envelope.operationId !== VARIABLES_GRAPH_MUTATION_RESPONSE
  ) {
    return null;
  }
  return parseMutationBody(envelope.body);
};

/**
 * Private transport for Variables-page mutations.
 *
 * It intentionally does not share pending state or session IDs with Bot Job,
 * Components, or Memory List drag controllers.
 */
export const useVariablesGraphMutation = ({
  webSocket,
  connected,
  snapshot,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<Pending | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): Pending | null => {
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
    const capability = snapshot?.mutationCapability;
    const authorityChanged = !capability
      || snapshot.bindingEpoch !== pending.bindingEpoch
      || snapshot.workspaceEpoch !== pending.request.workspaceEpoch
      || capability.graphVersion !== pending.request.baseGraphVersion
      || capability.graphRevision !== pending.request.graphRevision
      || (
        pending.mutationProfile !== capability.profile
        && pending.mutationProfile !== capability.crossBlockProfile
        && pending.mutationProfile !== capability.reactAuthoredProfile
      )
      || !sameInstructionGraphOwner(
        capability.ownerAssertion,
        pending.request.ownerAssertion,
      );
    if (
      !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || authorityChanged
    ) {
      clearPending()?.callbacks.refused(null, 'WORKSPACE_CHANGED');
    }
  }, [clearPending, connected, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    pending.callbacks.refused(null, 'UNMOUNTED');
  }, []);

  const submit = useCallback((
    draft: BotJobGraphMutationDraft,
    callbacks: Callbacks,
    mutationProfile?: VariablesMutationProfile,
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    const selectedProfile = mutationProfile ?? capability?.profile;
    if (
      !snapshot
      || !capability
      || !selectedProfile
      || (
        selectedProfile !== capability.profile
        && selectedProfile !== capability.crossBlockProfile
        && selectedProfile !== capability.reactAuthoredProfile
      )
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
    ) {
      return null;
    }
    const requestId = nextRequestId();
    const request: InstructionGraphMutationV3Request = {
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      mutationKind: draft.mutationKind,
      requestId,
      baseGraphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      workspaceEpoch: snapshot.workspaceEpoch,
      ownerAssertion: capability.ownerAssertion,
      draggedInstructionId: draft.draggedInstructionId,
      layoutRows: [...draft.layoutRows],
      instructionRelationPatches: [...draft.instructionRelationPatches],
      variableBindingPatches: [...draft.variableBindingPatches],
      variableOwnerPatches: [...draft.variableOwnerPatches],
    };
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.request.requestId !== requestId) return;
      clearPending()?.callbacks.refused(null, 'TIMEOUT');
    }, timeoutMs);
    pendingRef.current = {
      request,
      bindingEpoch: snapshot.bindingEpoch,
      webSocket,
      callbacks,
      mutationProfile: selectedProfile,
      timeoutId,
    };
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_GRAPH_MUTATION_TYPE,
        sessionId: VARIABLES_MANAGER_SESSION_ID,
        body: JSON.stringify({
          ...request,
          bindingEpoch: snapshot.bindingEpoch,
          mutationProfile: selectedProfile,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending()?.callbacks.refused(null, 'SEND_FAILED');
      return null;
    }
  }, [clearPending, connected, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    const response = parseEnvelope(raw);
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
    const completed = clearPending();
    if (!completed) return false;
    if (
      response.ok
      && response.committedGraphVersion <= completed.request.baseGraphVersion
    ) {
      completed.callbacks.refused(null, 'INVALID_COMMIT_VERSION');
      return true;
    }
    if (response.ok) completed.callbacks.committed(response);
    else completed.callbacks.refused(response, response.errorCode);
    return true;
  }, [clearPending]);

  return {
    pendingRequestId,
    submit,
    handleMessage,
  };
};
