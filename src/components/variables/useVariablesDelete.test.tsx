import { act, renderHook } from '@testing-library/react';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';
import {
  useVariablesDelete,
  VARIABLES_DELETE_CONTRACT_VERSION,
  VARIABLES_DELETE_OPERATION,
  VARIABLES_DELETE_RESPONSE,
} from './useVariablesDelete';

const REVISION = 'a'.repeat(64);
const COMMITTED_REVISION = 'b'.repeat(64);

const snapshot = (
  overrides: Partial<VariableWorkspaceSnapshot> = {},
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'bootstrap-1',
  bindingEpoch: 'binding-delete',
  workspaceEpoch: 9,
  graphRevision: REVISION,
  botJob: {
    id: 30,
    name: 'Delete variables',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 2,
    producerCount: 1,
    consumerCount: 1,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [],
  commands: [],
  variables: [],
  edges: [],
  diagnostics: [],
  runtimeMemory: { revision: 1, variables: [] },
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: null,
    graphVersion: 12,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 30,
    },
    layoutRows: [],
    instructionFacts: [],
  },
  ...overrides,
});

const responseEnvelope = (
  body: Record<string, unknown>,
  operationId: string = VARIABLES_DELETE_RESPONSE,
): string => JSON.stringify({
  sessionId: 'variablesManager',
  operationId,
  body: JSON.stringify(body),
});

test('sends the exact SINGLE payload and deduplicates while it is pending', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesDelete({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId: string | null = null;
  act(() => {
    requestId = result.current.submit('SINGLE', [44]);
  });

  expect(requestId).not.toBeNull();
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope.type).toBe(VARIABLES_DELETE_OPERATION);
  expect(envelope.sessionId).toBe('variablesManager');
  expect(JSON.parse(envelope.body)).toEqual({
    contractVersion: VARIABLES_DELETE_CONTRACT_VERSION,
    requestId,
    bindingEpoch: 'binding-delete',
    workspaceEpoch: 9,
    baseGraphVersion: 12,
    graphRevision: REVISION,
    mode: 'SINGLE',
    variableIds: [44],
  });

  act(() => {
    expect(result.current.submit('SINGLE', [55])).toBeNull();
    expect(result.current.submit('ALL', [44, 55])).toBeNull();
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(onResult).not.toHaveBeenCalled();
  unmount();
});

test('sends the exact ALL payload with unique, sorted positive variable IDs', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const { result, unmount } = renderHook(() => useVariablesDelete({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult: jest.fn(),
  }));

  let requestId: string | null = null;
  act(() => {
    requestId = result.current.submit('ALL', [75, 12, 75, -1, 0]);
  });

  expect(requestId).not.toBeNull();
  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope).toMatchObject({
    type: VARIABLES_DELETE_OPERATION,
    sessionId: 'variablesManager',
  });
  expect(JSON.parse(envelope.body)).toEqual({
    contractVersion: VARIABLES_DELETE_CONTRACT_VERSION,
    requestId,
    bindingEpoch: 'binding-delete',
    workspaceEpoch: 9,
    baseGraphVersion: 12,
    graphRevision: REVISION,
    mode: 'ALL',
    variableIds: [12, 75],
  });
  unmount();
});

test('accepts one correlated success response and releases the pending request', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesDelete({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit('SINGLE', [44]) ?? '';
  });

  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: true,
      requestId,
      bindingEpoch: 'binding-delete',
      workspaceEpoch: 9,
      message: 'Variable deleted.',
      deletedCount: 1,
      clearedInstructionCount: 3,
      committedGraphVersion: 13,
      graphRevision: COMMITTED_REVISION,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledTimes(1);
  expect(onResult).toHaveBeenCalledWith({
    ok: true,
    requestId,
    message: 'Variable deleted.',
    error: '',
    deletedCount: 1,
    clearedInstructionCount: 3,
    committedGraphVersion: 13,
    graphRevision: COMMITTED_REVISION,
  });
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test('reports a correlated backend refusal without treating it as a success', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesDelete({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit('ALL', [12, 75]) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: false,
      requestId,
      bindingEpoch: 'binding-delete',
      workspaceEpoch: 9,
      message: 'Variable deletion refused.',
      error: 'The graph revision is stale.',
      deletedCount: 0,
      clearedInstructionCount: 0,
      committedGraphVersion: 12,
      graphRevision: REVISION,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    message: 'Variable deletion refused.',
    error: 'The graph revision is stale.',
    deletedCount: 0,
    clearedInstructionCount: 0,
  }));
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test('ignores unrelated operations and keeps the correlated deletion pending', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesDelete({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit('SINGLE', [44]) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope(
      { ok: true, requestId },
      'variablesWorkspace.snapshot',
    ))).toBe(false);
  });

  expect(result.current.pendingRequestId).toBe(requestId);
  expect(onResult).not.toHaveBeenCalled();
  expect(send).toHaveBeenCalledTimes(1);
  unmount();
});
