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
import type { VariablesCommandDeletePlan } from './domain/variablesCommandDelete';

export const VARIABLES_COMMAND_DELETE_OPERATION =
  'variablesWorkspace.commands.delete' as const;
export const VARIABLES_COMMAND_DELETE_RESPONSE =
  'variablesWorkspace.commands.deleteResponse' as const;
export const VARIABLES_COMMAND_DELETE_CONTRACT_VERSION = 1 as const;

export type VariablesCommandDeleteResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
  instructionId: number | null;
  disconnectedInstructionCount: number;
  disconnectedVariableCount: number;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesCommandDeleteResult) => void;
  timeoutMs?: number;
};

type PendingDelete = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  instructionId: number;
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
  return `${Date.now().toString(36)}-variables-command-delete-${sequence.toString(36)}`;
};

export const useVariablesCommandDelete = ({
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
        error: 'The Variables workspace changed before command deletion completed.',
        instructionId: pending.instructionId,
        disconnectedInstructionCount: 0,
        disconnectedVariableCount: 0,
      });
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((plan: VariablesCommandDeletePlan): string | null => {
    const capability = snapshot?.mutationCapability;
    if (
      !snapshot
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current
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
        error: 'Command deletion timed out. The last Variables snapshot remains visible.',
        instructionId: plan.instruction.id,
        disconnectedInstructionCount: 0,
        disconnectedVariableCount: 0,
      });
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch,
      instructionId: plan.instruction.id,
      timeoutId,
    };
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_COMMAND_DELETE_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: VARIABLES_COMMAND_DELETE_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          instructionId: plan.instruction.id,
          expectedBlockId: plan.instruction.blockId,
          expectedInstructionOrder: plan.instruction.instructionOrder,
          parentRepairInstructionIds: plan.parentRepairInstructionIds,
          variableOwnerIds: plan.variableOwnerIds,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult({
        ok: false,
        requestId,
        message: '',
        error: 'Command deletion could not be sent.',
        instructionId: plan.instruction.id,
        disconnectedInstructionCount: 0,
        disconnectedVariableCount: 0,
      });
      return null;
    }
  }, [clearPending, connected, onResult, sessionId, snapshot, timeoutMs, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(String(raw));
    } catch (_) {
      return false;
    }
    if (envelope.operationId !== VARIABLES_COMMAND_DELETE_RESPONSE) return false;
    const body = objectValue(envelope.body);
    if (!body) return true;
    const pending = pendingRef.current;
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    if (!pending || requestId !== pending.requestId) return true;
    const completed = clearPending();
    if (!completed) return true;
    const validScope = body.bindingEpoch === completed.bindingEpoch
      && Number(body.workspaceEpoch) === completed.workspaceEpoch;
    onResult({
      ok: validScope && body.ok === true,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      error: validScope
        ? typeof body.error === 'string'
          ? body.error.trim()
          : body.ok === true
            ? ''
            : typeof body.message === 'string'
              ? body.message.trim()
              : 'Command deletion was refused.'
        : 'Command deletion returned for an obsolete Variables workspace.',
      instructionId: Number.isSafeInteger(Number(body.instructionId))
        ? Number(body.instructionId)
        : completed.instructionId,
      disconnectedInstructionCount:
        Number.isSafeInteger(Number(body.disconnectedInstructionCount))
          ? Number(body.disconnectedInstructionCount)
          : 0,
      disconnectedVariableCount:
        Number.isSafeInteger(Number(body.disconnectedVariableCount))
          ? Number(body.disconnectedVariableCount)
          : 0,
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
