import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import OCRConfigWorkspace from './OCRConfigWorkspace';
import OCRResultsWorkspace from './OCRResultsWorkspace';

jest.mock('../useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const CONFIG_SESSION = 'ocr-config-current-window';
const NEXT_CONFIG_SESSION = 'ocr-config-next-window';
const RESULTS_SESSION = 'ocr-results-current-window';
const NEXT_RESULTS_SESSION = 'ocr-results-next-window';

const socket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
} as unknown as WebSocket;

const useMessages = (messages: string[]) => {
  mockedUseWebSocket.mockReturnValue({
    webSocket: socket,
    connected: true,
    reconnectAttempts: 0,
    messages,
    error: null,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('OCR Config forwards a valid same-window retarget from its current socket', async () => {
  const onWorkspaceRetarget = jest.fn();
  useMessages([JSON.stringify({
    operationId: 'ocrWorkspace.windowRetarget',
    sessionId: CONFIG_SESSION,
    body: JSON.stringify({
      kind: 'config',
      previousSessionId: CONFIG_SESSION,
      sessionId: NEXT_CONFIG_SESSION,
      homeBankingId: 5,
      botJobId: 42,
      homeUrlId: 9,
    }),
  })]);

  render(
    <OCRConfigWorkspace
      socketPort={53972}
      sessionId={CONFIG_SESSION}
      onWorkspaceRetarget={onWorkspaceRetarget}
    />,
  );

  await waitFor(() => expect(onWorkspaceRetarget).toHaveBeenCalledWith({
    kind: 'config',
    previousSessionId: CONFIG_SESSION,
    sessionId: NEXT_CONFIG_SESSION,
    homeBankingId: 5,
    botJobId: 42,
    homeUrlId: 9,
  }));
});

test('OCR Results forwards a valid fresh logical session for keyed remounting', async () => {
  const onWorkspaceRetarget = jest.fn();
  useMessages([JSON.stringify({
    operationId: 'ocrWorkspace.windowRetarget',
    sessionId: RESULTS_SESSION,
    body: {
      kind: 'results',
      previousSessionId: RESULTS_SESSION,
      sessionId: NEXT_RESULTS_SESSION,
      homeBankingId: 5,
      botJobId: 43,
    },
  })]);

  render(
    <OCRResultsWorkspace
      socketPort={53972}
      sessionId={RESULTS_SESSION}
      onWorkspaceRetarget={onWorkspaceRetarget}
    />,
  );

  await waitFor(() => expect(onWorkspaceRetarget).toHaveBeenCalledWith({
    kind: 'results',
    previousSessionId: RESULTS_SESSION,
    sessionId: NEXT_RESULTS_SESSION,
    homeBankingId: 5,
    botJobId: 43,
  }));
});

test('OCR workspaces reject stale or cross-kind retarget messages', async () => {
  const onWorkspaceRetarget = jest.fn();
  useMessages([JSON.stringify({
    operationId: 'ocrWorkspace.windowRetarget',
    sessionId: CONFIG_SESSION,
    body: {
      kind: 'config',
      previousSessionId: 'ocr-config-stale-window',
      sessionId: RESULTS_SESSION,
      homeBankingId: 5,
      botJobId: 42,
    },
  })]);

  render(
    <OCRConfigWorkspace
      socketPort={53972}
      sessionId={CONFIG_SESSION}
      onWorkspaceRetarget={onWorkspaceRetarget}
    />,
  );

  await waitFor(() => expect(socket.send).toHaveBeenCalled());
  expect(onWorkspaceRetarget).not.toHaveBeenCalled();
});
