import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  parseVariablesWorkspaceMessage,
  type VariableInstructionNode,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';

export const VARIABLES_INSTRUCTION_STATUS_OPERATION =
  'variablesWorkspace.commands.status' as const;
export const VARIABLES_INSTRUCTION_STATUS_RESPONSE =
  'variablesWorkspace.commands.statusResponse' as const;
export const VARIABLES_INSTRUCTION_STATUS_CONTRACT_VERSION = 1 as const;

export type VariablesInstructionStatusResult = {
  ok: boolean;
  requestId: string;
  instructionId: number;
  active: boolean;
  updatedCount: number;
  message: string;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesInstructionStatusResult) => void;
  timeoutMs?: number;
};

type PendingStatus = {
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  instructionId: number;
  active: boolean;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT_MS = 12_000;
let sequence = 0;

const nextRequestId = (): string => {
  sequence = sequence >= Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
  return `${Date.now().toString(36)}-variables-command-status-${sequence.toString(36)}`;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

export const useVariablesInstructionStatus = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onResult,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: Context) => {
  const pendingRef = useRef<PendingStatus | null>(null);
  const [pendingInstructionId, setPendingInstructionId] =
    useState<number | null>(null);

  const clearPending = useCallback((): PendingStatus | null => {
    const pending = pendingRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingInstructionId(null);
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
      const completed = clearPending();
      if (completed) {
        onResult({
          ok: false,
          requestId: completed.requestId,
          instructionId: completed.instructionId,
          active: completed.active,
          updatedCount: 0,
          message: 'The Variables workspace changed before the command status was saved.',
        });
      }
    }
  }, [clearPending, connected, onResult, snapshot, webSocket]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    instruction: VariableInstructionNode,
    active: boolean,
  ): string | null => {
    if (
      instruction.id === null
      || !snapshot
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
      const completed = clearPending();
      if (!completed) return;
      onResult({
        ok: false,
        requestId,
        instructionId: completed.instructionId,
        active: completed.active,
        updatedCount: 0,
        message: 'Changing the command status timed out. The current status remains visible.',
      });
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      bindingEpoch: snapshot.bindingEpoch,
      workspaceEpoch: snapshot.workspaceEpoch,
      instructionId: instruction.id,
      active,
      timeoutId,
    };
    setPendingInstructionId(instruction.id);
    try {
      webSocket.send(JSON.stringify({
        type: VARIABLES_INSTRUCTION_STATUS_OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: VARIABLES_INSTRUCTION_STATUS_CONTRACT_VERSION,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          instructionId: instruction.id,
          expectedActive: instruction.active !== false,
          active,
        }),
      }));
      return requestId;
    } catch (_) {
      clearPending();
      onResult({
        ok: false,
        requestId,
        instructionId: instruction.id,
        active,
        updatedCount: 0,
        message: 'The command status change could not be sent.',
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
    if (envelope.operationId !== VARIABLES_INSTRUCTION_STATUS_RESPONSE) return false;
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
      instructionId: Number.isSafeInteger(Number(body.instructionId))
        ? Number(body.instructionId)
        : completed.instructionId,
      active: typeof body.active === 'boolean' ? body.active : completed.active,
      updatedCount: Number.isSafeInteger(Number(body.updatedCount))
        ? Number(body.updatedCount)
        : 0,
      message: validScope
        ? typeof body.message === 'string'
          ? body.message.trim()
          : body.ok === true
            ? 'Command status updated.'
            : 'The command status change was refused.'
        : 'The command status response belongs to an obsolete Variables workspace.',
    });
    return true;
  }, [clearPending, onResult]);

  return {
    pendingInstructionId,
    submit,
    handleMessage,
    resetPending: clearPending,
  };
};
