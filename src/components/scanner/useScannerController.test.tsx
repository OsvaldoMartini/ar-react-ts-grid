import { act, fireEvent, render, screen } from '@testing-library/react';
import { useScannerController } from './useScannerController';
import { scannerState } from './Scanner.testUtils';
import type { ScannerControllerState } from './useScannerController';

let latestController: ScannerControllerState | null = null;

function Harness({
  socket,
  messages = [],
  botJobId = 42,
  onReady,
}: {
  socket: WebSocket;
  messages?: string[];
  botJobId?: number;
  onReady?: (controller: ScannerControllerState) => void;
}) {
  const controller = useScannerController({
    webSocket: socket,
    connected: true,
    messages,
    sessionId: 'scannerGrid',
    homeBankingId: 2,
    botJobId,
  });
  latestController = controller;
  onReady?.(controller);

  return (
    <button
      type="button"
      onClick={() => controller.sendAction('PAGE_SCANNER', { searchTerms: 'input, button' })}
    >
      scan
    </button>
  );
}

function socket() {
  return {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
}

function sentMessages(socketValue: WebSocket) {
  return ((socketValue.send as jest.Mock).mock.calls as [string][])
    .map(([message]) => JSON.parse(message));
}

function message(operationId: string, body: Record<string, unknown>) {
  return JSON.stringify({
    sessionId: 'scannerGrid',
    operationId,
    homeBankingId: 2,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  latestController = null;
  jest.useRealTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('sends scanner action payload through websocket envelope', () => {
  const ws = socket();

  render(<Harness socket={ws} />);

  fireEvent.click(screen.getByRole('button', { name: 'scan' }));

  const raw = sentMessages(ws)
    .find((message) => message.type === 'scanner.action');

  expect(raw.sessionId).toBe('scannerGrid');
  expect(raw.homeBankingId).toBe(2);
  expect(JSON.parse(raw.body)).toMatchObject({
    action: 'PAGE_SCANNER',
    botJobId: 42,
    searchTerms: 'input, button',
  });
});

test('requests scanner bootstrap when connected', () => {
  const ws = socket();

  render(<Harness socket={ws} />);

  const raw = sentMessages(ws).find((entry) => entry.type === 'scanner.bootstrap');
  expect(raw.sessionId).toBe('scannerGrid');
  expect(raw.homeBankingId).toBe(2);
  expect(JSON.parse(raw.body)).toMatchObject({ botJobId: 42 });
  expect(JSON.parse(raw.body).requestId).toContain('scanner-bootstrap');
});

test('applies matching bootstrap response state', () => {
  const ws = socket();
  const { rerender } = render(<Harness socket={ws} />);
  const bootstrap = sentMessages(ws).find((entry) => entry.type === 'scanner.bootstrap');
  const requestId = JSON.parse(bootstrap.body).requestId;
  const state = scannerState({ revision: 2 });

  rerender(<Harness socket={ws} messages={[
    message('scanner.bootstrapResponse', {
      ok: true,
      botJobId: 42,
      requestId,
      state,
      message: 'loaded',
    }),
  ]} />);

  expect(latestController?.state?.revision).toBe(2);
  expect(latestController?.loadingState).toBe(false);
  expect(latestController?.status).toBe('loaded');
  expect(latestController?.statusTone).toBe('success');
});

test('ignores stale action responses with mismatched request id', () => {
  const ws = socket();
  const { rerender } = render(<Harness socket={ws} />);
  fireEvent.click(screen.getByRole('button', { name: 'scan' }));
  const action = sentMessages(ws).find((entry) => entry.type === 'scanner.action');
  expect(JSON.parse(action.body).action).toBe('PAGE_SCANNER');

  rerender(<Harness socket={ws} messages={[
    message('scanner.actionResponse', {
      ok: true,
      botJobId: 42,
      requestId: 'old-action',
      action: 'PAGE_SCANNER',
      state: scannerState({ revision: 3 }),
      message: 'old response',
    }),
  ]} />);

  expect(latestController?.pendingAction).toBe('PAGE_SCANNER');
  expect(latestController?.completedAction).toBeNull();
  expect(latestController?.state).toBeNull();
});

test('clears pending action for matching backend failure without parsed action', () => {
  const ws = socket();
  const { rerender } = render(<Harness socket={ws} />);
  fireEvent.click(screen.getByRole('button', { name: 'scan' }));
  const action = sentMessages(ws).find((entry) => entry.type === 'scanner.action');
  const requestId = JSON.parse(action.body).requestId;

  rerender(<Harness socket={ws} messages={[
    message('scanner.actionResponse', {
      ok: false,
      botJobId: 42,
      requestId,
      errorCode: 'INVALID_SCANNER_REQUEST',
      message: 'Scanner request body is required',
    }),
  ]} />);

  expect(latestController?.pendingAction).toBeNull();
  expect(latestController?.completedAction).toBeNull();
  expect(latestController?.status).toBe('Scanner request body is required');
  expect(latestController?.statusTone).toBe('error');
});

test('clears pending action for malformed backend failure with unknown job fallback', () => {
  const ws = socket();
  const { rerender } = render(<Harness socket={ws} />);
  fireEvent.click(screen.getByRole('button', { name: 'scan' }));
  const action = sentMessages(ws).find((entry) => entry.type === 'scanner.action');
  const requestId = JSON.parse(action.body).requestId;

  rerender(<Harness socket={ws} messages={[
    message('scanner.actionResponse', {
      ok: false,
      botJobId: -1,
      requestId,
      errorCode: 'INVALID_SCANNER_REQUEST',
      message: 'Scanner request body must be valid JSON',
    }),
  ]} />);

  expect(latestController?.pendingAction).toBeNull();
  expect(latestController?.completedAction).toBeNull();
  expect(latestController?.status).toBe('Scanner request body must be valid JSON');
  expect(latestController?.statusTone).toBe('error');
});

test('ignores matching request responses with conflicting action', () => {
  const ws = socket();
  const { rerender } = render(<Harness socket={ws} />);
  fireEvent.click(screen.getByRole('button', { name: 'scan' }));
  const action = sentMessages(ws).find((entry) => entry.type === 'scanner.action');
  const requestId = JSON.parse(action.body).requestId;

  rerender(<Harness socket={ws} messages={[
    message('scanner.actionResponse', {
      ok: true,
      botJobId: 42,
      requestId,
      action: 'CLEAR_GRID',
      state: scannerState({ revision: 3 }),
      message: 'wrong action',
    }),
  ]} />);

  expect(latestController?.pendingAction).toBe('PAGE_SCANNER');
  expect(latestController?.completedAction).toBeNull();
  expect(latestController?.state).toBeNull();
});

test('action timeout clears pending state and reports error', () => {
  jest.useFakeTimers();
  const ws = socket();
  render(<Harness socket={ws} />);

  fireEvent.click(screen.getByRole('button', { name: 'scan' }));
  expect(latestController?.pendingAction).toBe('PAGE_SCANNER');

  act(() => {
    jest.advanceTimersByTime(10000);
  });

  expect(latestController?.pendingAction).toBeNull();
  expect(latestController?.status).toBe('The backend did not answer the scanner action');
  expect(latestController?.statusTone).toBe('error');
});
