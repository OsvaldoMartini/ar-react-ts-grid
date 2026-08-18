import { act, renderHook } from '@testing-library/react';

import type { BotJobGraphMutationCapability } from './useBotJobInstructionGraphMutation';
import {
  GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION,
  GRID_ITEM_WEB_ELEMENT_TYPE_OPERATION,
  GRID_ITEM_WEB_ELEMENT_TYPE_RESPONSE,
  gridItemWebElementTypeForAction,
  useGridItemWebElementType,
} from './useGridItemWebElementType';

const GRAPH_REVISION = 'a'.repeat(64);
const NEXT_GRAPH_REVISION = 'b'.repeat(64);

const capability: BotJobGraphMutationCapability = {
  enabled: true,
  contractVersion: 3,
  workspaceEpoch: 7,
  graphVersion: 21,
  graphRevision: GRAPH_REVISION,
  ownerAssertion: {
    workspaceKind: 'BOT_JOB',
    homeBankingId: 2,
    botJobId: 32,
  },
};

const socket = (send = jest.fn()): WebSocket => ({
  readyState: WebSocket.OPEN,
  send,
} as unknown as WebSocket);

const responseEnvelope = (body: Record<string, unknown>): string => JSON.stringify({
  operationId: GRID_ITEM_WEB_ELEMENT_TYPE_RESPONSE,
  sessionId: 'botJobTasks',
  body: JSON.stringify(body),
});

test('derives only backend-supported persisted Web Element types', () => {
  expect(gridItemWebElementTypeForAction('I:Account')).toBe('INPUT');
  expect(gridItemWebElementTypeForAction('input')).toBe('INPUT');
  expect(gridItemWebElementTypeForAction('O:Balance')).toBe('OUTPUT');
  expect(gridItemWebElementTypeForAction('output')).toBe('OUTPUT');
  expect(gridItemWebElementTypeForAction('C')).toBe('CLICK');
  expect(gridItemWebElementTypeForAction('click')).toBe('CLICK');
  expect(gridItemWebElementTypeForAction('W:legacy')).toBe('CLICK');
  expect(gridItemWebElementTypeForAction('other')).toBe('CLICK');
  expect(gridItemWebElementTypeForAction('A:Terms')).toBeNull();
  expect(gridItemWebElementTypeForAction('GET')).toBeNull();
  expect(gridItemWebElementTypeForAction(null)).toBeNull();
});

test('sends one compact correlated type update with required graph authority', () => {
  const send = jest.fn();
  const webSocket = socket(send);
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useGridItemWebElementType({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
  }));

  let requestId: string | null = null;
  act(() => {
    requestId = result.current.submit(1728, 'INPUT', 'OUTPUT');
  });

  expect(requestId).not.toBeNull();
  expect(send).toHaveBeenCalledTimes(1);
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(result.current.pendingInstructionId).toBe(1728);
  expect(result.current.pendingReplacementType).toBe('OUTPUT');
  expect(onResult).not.toHaveBeenCalled();

  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope).toEqual({
    type: GRID_ITEM_WEB_ELEMENT_TYPE_OPERATION,
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    body: expect.any(String),
  });
  expect(JSON.parse(envelope.body)).toEqual({
    contractVersion: GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION,
    requestId,
    homeBankingId: 2,
    botJobId: 32,
    instructionId: 1728,
    workspaceEpoch: 7,
    baseGraphVersion: 21,
    graphRevision: GRAPH_REVISION,
    expectedType: 'INPUT',
    replacementType: 'OUTPUT',
  });
  expect(envelope.body).not.toContain('layoutRows');
  expect(envelope.body).not.toContain('expectedAction');

  act(() => {
    expect(result.current.submit(1729, 'OUTPUT', 'CLICK')).toBeNull();
  });
  expect(send).toHaveBeenCalledTimes(1);
  unmount();
});

test('requires the exact Bot Job session and authoritative graph capability', () => {
  const send = jest.fn();
  const webSocket = socket(send);
  const { result, rerender, unmount } = renderHook(({
    sessionId,
    activeCapability,
  }: {
    sessionId: string;
    activeCapability: BotJobGraphMutationCapability | null;
  }) => useGridItemWebElementType({
    webSocket,
    connected: true,
    messages: [],
    sessionId,
    homeBankingId: 2,
    botJobId: 32,
    capability: activeCapability,
    onResult: jest.fn(),
  }), {
    initialProps: {
      sessionId: 'componentTasks',
      activeCapability: capability as BotJobGraphMutationCapability | null,
    },
  });

  act(() => {
    expect(result.current.submit(1728, 'INPUT', 'OUTPUT')).toBeNull();
  });
  rerender({ sessionId: 'botJobTasks', activeCapability: null });
  act(() => {
    expect(result.current.submit(1728, 'INPUT', 'OUTPUT')).toBeNull();
  });
  rerender({ sessionId: 'botJobTasks', activeCapability: capability });
  act(() => {
    expect(result.current.submit(1728, 'INPUT', 'INPUT')).toBeNull();
  });
  expect(send).not.toHaveBeenCalled();
  unmount();
});

test('accepts only a correlated authoritative acknowledgement without changing rows locally', () => {
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemWebElementType({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit(1728, 'INPUT', 'OUTPUT') ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId: 'stale-request',
      ok: true,
    }))).toBe(true);
  });
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(onResult).not.toHaveBeenCalled();

  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId,
      ok: true,
      changed: true,
      instructionId: 1728,
      previousType: 'INPUT',
      committedType: 'OUTPUT',
      committedAction: 'O:Account',
      graphVersion: 22,
      graphRevision: NEXT_GRAPH_REVISION,
      workspaceEpoch: 7,
      resyncRequired: false,
      message: 'Web Element type updated.',
    }))).toBe(true);
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith({
    ok: true,
    requestId,
    instructionId: 1728,
    expectedType: 'INPUT',
    replacementType: 'OUTPUT',
    changed: true,
    committedType: 'OUTPUT',
    committedAction: 'O:Account',
    message: 'Web Element type updated.',
    code: '',
    resyncRequired: false,
  });
  unmount();
});

test('surfaces a correlated backend refusal and releases pending state', () => {
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemWebElementType({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit(1728, 'OUTPUT', 'CLICK') ?? '';
  });
  act(() => {
    result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId,
      ok: false,
      code: 'STALE_GRAPH',
      message: 'Refresh the Bot Job before changing this Web Element.',
      resyncRequired: false,
    }));
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    instructionId: 1728,
    expectedType: 'OUTPUT',
    replacementType: 'CLICK',
    code: 'STALE_GRAPH',
  }));
  unmount();
});

test('times out a request and clears pending state', () => {
  jest.useFakeTimers();
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemWebElementType({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
    timeoutMs: 50,
  }));

  act(() => {
    expect(result.current.submit(1728, 'CLICK', 'INPUT')).not.toBeNull();
    jest.advanceTimersByTime(50);
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    code: 'TIMEOUT',
    instructionId: 1728,
  }));
  unmount();
  jest.useRealTimers();
});
