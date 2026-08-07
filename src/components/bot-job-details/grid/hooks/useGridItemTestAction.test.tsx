import { act, renderHook } from '@testing-library/react';
import type { BotJobGraphMutationCapability } from './useBotJobInstructionGraphMutation';
import {
  GRID_ITEM_TEST_ACTION_CONTRACT_VERSION,
  GRID_ITEM_TEST_ACTION_OPERATION,
  GRID_ITEM_TEST_ACTION_RESPONSE,
  GRID_ITEM_TEST_ACTION_TIMEOUT_MS,
  gridItemTestActionForInstruction,
  useGridItemTestAction,
} from './useGridItemTestAction';

const GRAPH_REVISION = 'a'.repeat(64);

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
  operationId: GRID_ITEM_TEST_ACTION_RESPONSE,
  sessionId: 'botJobTasks',
  body: JSON.stringify({ botJobId: 32, ...body }),
});

test('maps only input and click Web Element actions to physical tests', () => {
  expect(gridItemTestActionForInstruction('I:Account')).toBe('INPUT');
  expect(gridItemTestActionForInstruction('input')).toBe('INPUT');
  expect(gridItemTestActionForInstruction('C:Submit')).toBe('CLICK');
  expect(gridItemTestActionForInstruction('click')).toBe('CLICK');
  expect(gridItemTestActionForInstruction('O:Balance')).toBeNull();
  expect(gridItemTestActionForInstruction('GET')).toBeNull();
  expect(gridItemTestActionForInstruction('SET')).toBeNull();
  expect(gridItemTestActionForInstruction(null)).toBeNull();
});

test('sends one compact correlated INPUT request with available graph authority', () => {
  const send = jest.fn();
  const webSocket = socket(send);
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useGridItemTestAction({
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
    requestId = result.current.submit(1728, 'INPUT', 0);
  });

  expect(requestId).not.toBeNull();
  expect(send).toHaveBeenCalledTimes(1);
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(result.current.pendingInstructionId).toBe(1728);
  expect(result.current.pendingAction).toBe('INPUT');

  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope).toEqual({
    type: GRID_ITEM_TEST_ACTION_OPERATION,
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    body: expect.any(String),
  });
  const body = JSON.parse(envelope.body);
  expect(body).toEqual({
    contractVersion: GRID_ITEM_TEST_ACTION_CONTRACT_VERSION,
    requestId,
    homeBankingId: 2,
    botJobId: 32,
    instructionId: 1728,
    action: 'INPUT',
    excelRowIndex: 0,
    workspaceEpoch: 7,
    baseGraphVersion: 21,
    graphRevision: GRAPH_REVISION,
  });
  expect(body).not.toHaveProperty('value');
  expect(body).not.toHaveProperty('defaultValue');
  expect(body).not.toHaveProperty('elementDetails');
  expect(body).not.toHaveProperty('xPath');

  act(() => {
    expect(result.current.submit(1728, 'INPUT', 0)).toBeNull();
    expect(result.current.submit(1729, 'CLICK', 0)).toBeNull();
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(onResult).not.toHaveBeenCalled();
  unmount();
});

test('sends CLICK without inventing graph authority when none is available', () => {
  const send = jest.fn();
  const webSocket = socket(send);
  const { result, unmount } = renderHook(() => useGridItemTestAction({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability: null,
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit(1664, 'CLICK')).not.toBeNull();
  });

  const body = JSON.parse(JSON.parse(send.mock.calls[0][0]).body);
  expect(body).toMatchObject({
    instructionId: 1664,
    action: 'CLICK',
    excelRowIndex: 0,
  });
  expect(body).not.toHaveProperty('workspaceEpoch');
  expect(body).not.toHaveProperty('baseGraphVersion');
  expect(body).not.toHaveProperty('graphRevision');
  unmount();
});

test('accepts only the correlated response and strips any returned input value', () => {
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemTestAction({
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
    requestId = result.current.submit(1728, 'INPUT', 0) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId: 'another-request',
      ok: true,
      instructionId: 1728,
      action: 'INPUT',
    }))).toBe(true);
  });
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(onResult).not.toHaveBeenCalled();

  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId,
      botJobId: 31,
      ok: true,
      instructionId: 1728,
      action: 'INPUT',
    }))).toBe(true);
  });
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(onResult).not.toHaveBeenCalled();

  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId,
      ok: true,
      instructionId: 1728,
      action: 'INPUT',
      message: 'Input test completed.',
      valueSource: 'EXCEL_MEMORY',
      datasetMode: 'REAL',
      excelRowIndex: 0,
      column: 'IBAN',
      value: 'CH9300762011623852957',
      inputValue: 'CH9300762011623852957',
    }))).toBe(true);
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledTimes(1);
  const reported = onResult.mock.calls[0][0];
  expect(reported).toEqual({
    ok: true,
    requestId,
    instructionId: 1728,
    action: 'INPUT',
    message: 'Input test completed.',
    error: '',
    code: '',
    valueSource: 'EXCEL_MEMORY',
    datasetMode: 'REAL',
    excelRowIndex: 0,
    column: 'IBAN',
  });
  expect(reported).not.toHaveProperty('value');
  expect(reported).not.toHaveProperty('inputValue');
  unmount();
});

test('reports a correlated backend refusal and releases the pending request', () => {
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemTestAction({
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
    requestId = result.current.submit(1664, 'CLICK') ?? '';
  });
  act(() => {
    result.current.handleMessage(responseEnvelope({
      contractVersion: 1,
      requestId,
      ok: false,
      instructionId: 1664,
      action: 'CLICK',
      code: 'LOCATOR_NOT_FOUND',
      message: 'The persisted Web Element could not be resolved.',
    }));
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    instructionId: 1664,
    action: 'CLICK',
    code: 'LOCATOR_NOT_FOUND',
    error: 'The persisted Web Element could not be resolved.',
  }));
  unmount();
});

test('consumes a correlated response from the shared WebSocket message stream', () => {
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, rerender, unmount } = renderHook(({
    messages,
  }: { messages: readonly string[] }) => useGridItemTestAction({
    webSocket,
    connected: true,
    messages,
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
  }), {
    initialProps: { messages: [] as readonly string[] },
  });

  let requestId = '';
  act(() => {
    requestId = result.current.submit(1664, 'CLICK') ?? '';
  });
  act(() => {
    rerender({
      messages: [responseEnvelope({
        contractVersion: 1,
        requestId,
        ok: true,
        instructionId: 1664,
        action: 'CLICK',
        message: 'Click test completed.',
      })],
    });
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: true,
    requestId,
    instructionId: 1664,
    action: 'CLICK',
  }));
  unmount();
});

test('reports a timeout and clears pending state', () => {
  jest.useFakeTimers();
  const onResult = jest.fn();
  const webSocket = socket();
  const { result, unmount } = renderHook(() => useGridItemTestAction({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult,
  }));

  act(() => {
    expect(result.current.submit(1728, 'INPUT')).not.toBeNull();
  });
  act(() => {
    jest.advanceTimersByTime(GRID_ITEM_TEST_ACTION_TIMEOUT_MS - 1);
  });

  expect(result.current.pendingRequestId).not.toBeNull();
  expect(onResult).not.toHaveBeenCalled();
  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(result.current.pendingRequestId).toBeNull();
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    action: 'INPUT',
    code: 'TIMEOUT',
  }));
  unmount();
  jest.useRealTimers();
});

test('does not send from component or detached non-Bot-Job sessions', () => {
  const send = jest.fn();
  const webSocket = socket(send);
  const { result, unmount } = renderHook(() => useGridItemTestAction({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'componentTasks',
    homeBankingId: 2,
    botJobId: 32,
    capability,
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit(1728, 'INPUT')).toBeNull();
  });
  expect(send).not.toHaveBeenCalled();
  unmount();
});
