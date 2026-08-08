import { renderHook, waitFor } from '@testing-library/react';
import { useMemoryListSummary } from './useMemoryListSummary';

const response = (
  workspaceEpoch: number,
  itemCount: number,
  sessionId = 'botJobTasks',
): string => JSON.stringify({
  sessionId,
  operationId: 'memoryList.summaryChanged',
  body: JSON.stringify({
    ok: true,
    homeBankingId: 2,
    botJobId: 32,
    workspaceEpoch,
    itemCount,
  }),
});

test('subscribes and correlates Memory counts by workspace generation', async () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const view = renderHook(
    ({ workspaceEpoch, messages }: { workspaceEpoch: number; messages: string[] }) =>
      useMemoryListSummary({
        webSocket,
        connected: true,
        messages,
        sessionId: 'botJobTasks',
        homeBankingId: 2,
        botJobId: 32,
        workspaceEpoch,
      }),
    { initialProps: { workspaceEpoch: 7, messages: [] as string[] } },
  );

  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(JSON.parse(JSON.parse(send.mock.calls[0][0]).body)).toEqual({
    homeBankingId: 2,
    botJobId: 32,
    workspaceEpoch: 7,
  });

  view.rerender({ workspaceEpoch: 8, messages: [] });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(JSON.parse(JSON.parse(send.mock.calls[1][0]).body).workspaceEpoch).toBe(8);

  view.rerender({
    workspaceEpoch: 8,
    messages: [response(7, 99)],
  });
  expect(view.result.current).toBe(0);

  view.rerender({
    workspaceEpoch: 8,
    messages: [response(7, 99), response(8, 3)],
  });
  await waitFor(() => expect(view.result.current).toBe(3));
});

test('waits for an authoritative static workspace generation', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  renderHook(() => useMemoryListSummary({
    webSocket,
    connected: true,
    messages: [],
    sessionId: 'componentTasks',
    homeBankingId: 2,
    botJobId: 32,
    workspaceEpoch: 0,
  }));
  expect(send).not.toHaveBeenCalled();
});

test('leaves detached Page Scanner generation authority with the backend', async () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const sessionId = 'page-scanner-073aace2-a0ee-425f-9aa5-aef63f93596b';
  const view = renderHook(
    ({ messages }: { messages: string[] }) => useMemoryListSummary({
      webSocket,
      connected: true,
      messages,
      sessionId,
      homeBankingId: 2,
      botJobId: 32,
      workspaceEpoch: null,
    }),
    { initialProps: { messages: [] as string[] } },
  );

  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(JSON.parse(JSON.parse(send.mock.calls[0][0]).body)).toEqual({
    homeBankingId: 2,
    botJobId: 32,
  });

  view.rerender({ messages: [response(11, 4, sessionId)] });
  await waitFor(() => expect(view.result.current).toBe(4));
});
