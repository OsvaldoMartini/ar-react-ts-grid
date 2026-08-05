import { act, renderHook } from '@testing-library/react';
import { useVariablesAutoResolve } from './useVariablesAutoResolve';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';

test('sends one compact batch request for all scoped variable work', () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const snapshot = {
    bindingEpoch: 'binding-1',
    workspaceEpoch: 7,
    mutationCapability: {
      graphVersion: 42,
      graphRevision: 'a'.repeat(64),
    },
  } as unknown as VariableWorkspaceSnapshot;
  const { result } = renderHook(() => useVariablesAutoResolve({
    webSocket: socket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit([30, 10, 30, 20], 'DISTINCT')).not.toBeNull();
  });

  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope.type).toBe('variablesWorkspace.variables.autoResolve');
  expect(JSON.parse(envelope.body)).toMatchObject({
    contractVersion: 2,
    bindingEpoch: 'binding-1',
    workspaceEpoch: 7,
    baseGraphVersion: 42,
    graphRevision: 'a'.repeat(64),
    instructionIds: [30, 10, 20],
    variableMode: 'DISTINCT',
    operation: 'RESOLVE',
  });
});

test('sends one compact release request for the complete scope', () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const snapshot = {
    bindingEpoch: 'binding-1',
    workspaceEpoch: 7,
    mutationCapability: {
      graphVersion: 42,
      graphRevision: 'a'.repeat(64),
    },
  } as unknown as VariableWorkspaceSnapshot;
  const { result } = renderHook(() => useVariablesAutoResolve({
    webSocket: socket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit([30, 10, 30], 'SAME', 'RELEASE')).not.toBeNull();
  });

  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(JSON.parse(envelope.body)).toMatchObject({
    instructionIds: [30, 10],
    variableMode: 'SAME',
    operation: 'RELEASE',
  });
});
