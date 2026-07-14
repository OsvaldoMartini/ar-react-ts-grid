import { fireEvent, render, screen } from '@testing-library/react';
import { useScannerController } from './useScannerController';

function Harness({ socket }: { socket: WebSocket }) {
  const controller = useScannerController({
    webSocket: socket,
    connected: true,
    messages: [],
    sessionId: 'scannerGrid',
    homeBankingId: 2,
    botJobId: 42,
  });

  return (
    <button
      type="button"
      onClick={() => controller.sendAction('PAGE_SCANNER', { searchTerms: 'input, button' })}
    >
      scan
    </button>
  );
}

test('sends scanner action payload through websocket envelope', () => {
  const socket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;

  render(<Harness socket={socket} />);

  fireEvent.click(screen.getByRole('button', { name: 'scan' }));

  const raw = (socket.send as jest.Mock).mock.calls
    .map(([message]) => JSON.parse(message))
    .find((message) => message.type === 'scanner.action');

  expect(raw.sessionId).toBe('scannerGrid');
  expect(raw.homeBankingId).toBe(2);
  expect(JSON.parse(raw.body)).toMatchObject({
    action: 'PAGE_SCANNER',
    botJobId: 42,
    searchTerms: 'input, button',
  });
});
