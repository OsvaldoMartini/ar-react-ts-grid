import { useCallback, useRef, useState } from 'react';
import {
  parseVariablesWorkspaceMessage,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';
import type { VariableResolutionMode } from './domain/variableResolutionAssignments';

const OPERATION = 'variablesWorkspace.variables.autoResolve';
const RESPONSE = 'variablesWorkspace.variables.autoResolveResponse';

export type VariablesAutoResolveResult = {
  ok: boolean;
  requestId: string;
  message: string;
  error: string;
};

type Context = {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  onResult: (result: VariablesAutoResolveResult) => void;
};

const objectValue = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

export const useVariablesAutoResolve = ({
  webSocket,
  connected,
  sessionId,
  snapshot,
  onResult,
}: Context) => {
  const pendingRef = useRef<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const submit = useCallback((
    instructionIds: readonly number[],
    variableMode: VariableResolutionMode,
  ): string | null => {
    const capability = snapshot?.mutationCapability;
    if (!snapshot || !capability || !connected || pendingRef.current
      || !webSocket || webSocket.readyState !== WebSocket.OPEN
      || instructionIds.length === 0) return null;
    const requestId = `${Date.now().toString(36)}-variables-auto-resolve`;
    pendingRef.current = requestId;
    setPendingRequestId(requestId);
    try {
      webSocket.send(JSON.stringify({
        type: OPERATION,
        sessionId,
        body: JSON.stringify({
          contractVersion: 2,
          requestId,
          bindingEpoch: snapshot.bindingEpoch,
          workspaceEpoch: snapshot.workspaceEpoch,
          baseGraphVersion: capability.graphVersion,
          graphRevision: capability.graphRevision,
          instructionIds: [...new Set(instructionIds)],
          variableMode,
        }),
      }));
      return requestId;
    } catch (_) {
      pendingRef.current = null;
      setPendingRequestId(null);
      return null;
    }
  }, [connected, sessionId, snapshot, webSocket]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    let envelope;
    try {
      envelope = parseVariablesWorkspaceMessage(String(raw));
    } catch (_) {
      return false;
    }
    if (envelope.operationId !== RESPONSE) return false;
    const body = objectValue(envelope.body);
    if (!body) return true;
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    if (!requestId || requestId !== pendingRef.current) return true;
    pendingRef.current = null;
    setPendingRequestId(null);
    onResult({
      ok: body.ok === true,
      requestId,
      message: typeof body.message === 'string' ? body.message.trim() : '',
      error: typeof body.message === 'string' && body.ok !== true
        ? body.message.trim()
        : '',
    });
    return true;
  }, [onResult]);

  return { pendingRequestId, submit, handleMessage };
};
