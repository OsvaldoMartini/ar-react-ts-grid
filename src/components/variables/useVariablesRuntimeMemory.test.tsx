import { act, renderHook } from '@testing-library/react';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';
import {
  MEMORY_CLEAR_ALL_OPERATION,
  RUNTIME_MEMORY_CONTRACT_VERSION,
  useVariablesRuntimeMemory,
} from './useVariablesRuntimeMemory';

const snapshot = {
  bindingEpoch: 'binding-memory',
  workspaceEpoch: 6,
  botJob: { id: 30, homeBankingId: 2 },
  variables: [{ id: 12, name: 'Amount', type: '$String' }],
  runtimeMemory: {
    revision: 18,
    variables: [{
      variableId: 12,
      name: 'Amount',
      type: '$String',
      state: 'VALUE',
      value: '1.234,56 €',
      voidReason: null,
      entryRevision: 7,
      source: 'EXECUTION',
    }],
  },
} as VariableWorkspaceSnapshot;

test('sends exact text with optimistic runtime and entry revisions', () => {
  const send = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesRuntimeMemory({
    webSocket: {
      readyState: WebSocket.OPEN,
      send,
    } as unknown as WebSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onMemory: jest.fn(),
    onStatus: jest.fn(),
  }));

  act(() => {
    expect(result.current.updateValue(12, ' CHF 1’234.50 ')).toBe(true);
  });

  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(JSON.parse(envelope.body)).toMatchObject({
    contractVersion: RUNTIME_MEMORY_CONTRACT_VERSION,
    bindingEpoch: 'binding-memory',
    workspaceEpoch: 6,
    baseRuntimeRevision: 18,
    variableId: 12,
    operation: 'SET',
    expectedEntryRevision: 7,
    value: ' CHF 1’234.50 ',
  });
  unmount();
});

test('sends only one synchronous update for the same variable before rerender', () => {
  const send = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesRuntimeMemory({
    webSocket: {
      readyState: WebSocket.OPEN,
      send,
    } as unknown as WebSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onMemory: jest.fn(),
    onStatus: jest.fn(),
  }));

  act(() => {
    const updateValue = result.current.updateValue;
    expect(updateValue(12, 'first')).toBe(true);
    expect(updateValue(12, 'duplicate')).toBe(false);
  });

  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(JSON.parse(envelope.body).value).toBe('first');
  unmount();
});

test('requests one atomic clear-all against the authoritative revision', () => {
  const send = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesRuntimeMemory({
    webSocket: {
      readyState: WebSocket.OPEN,
      send,
    } as unknown as WebSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onMemory: jest.fn(),
    onStatus: jest.fn(),
  }));

  act(() => {
    expect(result.current.clearAllValues()).toBe(true);
  });

  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope.type).toBe(MEMORY_CLEAR_ALL_OPERATION);
  expect(JSON.parse(envelope.body)).toMatchObject({
    contractVersion: RUNTIME_MEMORY_CONTRACT_VERSION,
    bindingEpoch: 'binding-memory',
    workspaceEpoch: 6,
    baseRuntimeRevision: 18,
  });
  expect(result.current.pendingClearAll).toBe(true);
  unmount();
});
