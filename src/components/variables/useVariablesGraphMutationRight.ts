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
import { connectedVariableSlots } from './domain/variableSlotRequirements';

export const VARIABLES_GRAPH_MUTATION_RIGHT_CONTRACT_VERSION = 3 as const;

export type VariablesGraphMutationRightResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
  connectedCount: number;
  skippedCount: number;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  operationType: 'variablesWorkspace.graphMutationRight';
  responseType: 'variablesWorkspace.graphMutationRightResponse';
  onResult: (result: VariablesGraphMutationRightResult) => void;
  timeoutMs?: number;
};

type PendingConnect = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
let sequence = 0;

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const nextRequestId = (): string => {
  sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
  return `${Date.now().toString(36)}-check-operand-connect-${sequence.toString(36)}`;
};

/**
 * NEW variable rules step 1 (2026-08-03): submits the React-authored
 * Right_Operand connection for the given CheckValue commands. This WebSocket
 * contract owns only RIGHT-slot CONNECT and DISCONNECT persistence.
 */
export const useVariablesGraphMutationRight = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  operationType,
  responseType,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingConnect | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const clearPending = useCallback((): PendingConnect | null => {
    const pending = pendingRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    return pending;
  }, []);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    rightVariableId: number | null,
    instructionIds: readonly number[],
    operation: 'CONNECT' | 'DISCONNECT' = 'CONNECT',
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    if (
      !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
      || instructionIds.length !== 1
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
        error: 'The right-operand connection timed out.',
        connectedCount: 0,
        skippedCount: 0,
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
      const instructionId = instructionIds[0];
      const command = snapshot.commands.find(entry => entry.id === instructionId);
      const expectedVariableId = command
        ? connectedVariableSlots(command).get('RIGHT') ?? null
        : null;
      webSocket.send(JSON.stringify({
        type: operationType,
        sessionId,
        contractVersion: 3,
        mutationKind: 'RELATIONSHIP_UPDATE',
        requestId,
        bindingEpoch: snapshot.bindingEpoch,
        workspaceEpoch: snapshot.workspaceEpoch,
        baseGraphVersion: capability.graphVersion,
        graphRevision: capability.graphRevision,
        ownerAssertion: capability.ownerAssertion,
        draggedInstructionId: null,
        instructionRelationPatches: [],
        variableBindingPatches: [{
          instructionId,
          slot: 'RIGHT',
          operation: operation === 'DISCONNECT' ? 'CLEAR' : 'SET',
          expected: { value: expectedVariableId },
          replacement: { value: rightVariableId },
        }],
        variableOwnerPatches: [],
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'The right-operand connection could not be sent.',
        connectedCount: 0,
        skippedCount: 0,
      });
      return null;
    }
  }, [clearPending, connected, onResult, operationType, sessionId, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(String(raw));
    } catch (_) {
      return false;
    }
    if (envelope.operationId !== responseType) return false;
    const body = objectValue(envelope.body);
    if (!body) return true;
    const pending = pendingRef.current;
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    if (!pending || requestId !== pending.requestId) return true;
    clearPending();
    onResult({
      ok: body.ok === true,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      error: body.ok === true
        ? ''
        : typeof body.message === 'string'
          ? body.message.trim()
          : 'The right-operand connection was refused.',
      connectedCount: Number.isSafeInteger(Number(body.connectedCount))
        ? Number(body.connectedCount)
        : 0,
      skippedCount: Number.isSafeInteger(Number(body.skippedCount))
        ? Number(body.skippedCount)
        : 0,
    });
    return true;
  }, [clearPending, onResult, responseType]);

  return {
    pendingRequestId,
    submit,
    handleMessage,
    resetPending: clearPending,
  };
};
