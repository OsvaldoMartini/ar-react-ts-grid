import { act, renderHook } from '@testing-library/react';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';
import {
  useVariablesCreate,
  VARIABLES_CREATE_CONTRACT_VERSION,
  VARIABLES_CREATE_OPERATION,
} from './useVariablesCreate';

const snapshot = {
  bindingEpoch: 'binding-create',
  workspaceEpoch: 8,
  mutationCapability: null,
} as VariableWorkspaceSnapshot;

test('creates a standalone variable as VOID', () => {
  const send = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesCreate({
    webSocket: {
      readyState: WebSocket.OPEN,
      send,
    } as unknown as WebSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot,
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit({
      name: '  payment_text  ',
    })).not.toBeNull();
  });

  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope.type).toBe(VARIABLES_CREATE_OPERATION);
  expect(JSON.parse(envelope.body)).toMatchObject({
    contractVersion: VARIABLES_CREATE_CONTRACT_VERSION,
    bindingEpoch: 'binding-create',
    workspaceEpoch: 8,
    name: 'payment_text',
    initialState: 'VOID',
  });
  unmount();
});
