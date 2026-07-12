import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  failConnection() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }
}

const originalWebSocket = global.WebSocket;

const HookHarness: React.FC = () => {
  const { reconnectAttempts, error } = useWebSocket(7357, 'botJobTasks-test');
  return (
    <div>
      <span data-testid="attempts">{reconnectAttempts}</span>
      <span data-testid="error">{error || ''}</span>
    </div>
  );
};

beforeEach(() => {
  jest.useFakeTimers();
  MockWebSocket.instances = [];
  Object.defineProperty(global, 'WebSocket', {
    configurable: true,
    writable: true,
    value: MockWebSocket,
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

afterAll(() => {
  Object.defineProperty(global, 'WebSocket', {
    configurable: true,
    writable: true,
    value: originalWebSocket,
  });
});

test('closes the locally created socket during cleanup and keeps only one live StrictMode connection', () => {
  const { unmount } = render(
    <React.StrictMode>
      <HookHarness />
    </React.StrictMode>,
  );

  expect(MockWebSocket.instances).toHaveLength(2);
  expect(MockWebSocket.instances[0].close).toHaveBeenCalledTimes(1);
  expect(
    MockWebSocket.instances.filter((socket) => socket.readyState !== MockWebSocket.CLOSED),
  ).toHaveLength(1);

  unmount();

  expect(MockWebSocket.instances[1].close).toHaveBeenCalledTimes(1);
  act(() => {
    jest.runOnlyPendingTimers();
  });
  expect(MockWebSocket.instances).toHaveLength(2);
});

test('bounds consecutive reconnects without creating parallel sockets', () => {
  render(<HookHarness />);

  expect(MockWebSocket.instances).toHaveLength(1);
  for (let retry = 1; retry <= 5; retry += 1) {
    const currentSocket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    act(() => {
      currentSocket.failConnection();
      jest.runOnlyPendingTimers();
    });

    expect(MockWebSocket.instances).toHaveLength(retry + 1);
    expect(
      MockWebSocket.instances.filter((socket) => socket.readyState !== MockWebSocket.CLOSED),
    ).toHaveLength(1);
  }

  const finalSocket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
  act(() => {
    finalSocket.failConnection();
    jest.runOnlyPendingTimers();
  });

  expect(MockWebSocket.instances).toHaveLength(6);
  expect(screen.getByTestId('attempts')).toHaveTextContent('5');
  expect(screen.getByTestId('error')).toHaveTextContent('Max reconnect attempts reached');
});
