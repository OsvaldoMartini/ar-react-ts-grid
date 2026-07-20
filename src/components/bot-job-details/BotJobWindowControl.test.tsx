import { render, waitFor } from '@testing-library/react';
import BotJobWindowControl from './BotJobWindowControl';

let mockMessages: string[] = [];

jest.mock('../useWebSocket', () => ({
  useWebSocket: () => ({ messages: mockMessages }),
}));

const SESSION = 'bot-job-window-123e4567-e89b-42d3-a456-426614174000';

test('accepts a typed target only from its exact persistent control session', async () => {
  const onTarget = jest.fn();
  const view = render(
    <BotJobWindowControl socketPort={53972} sessionId={SESSION} onTarget={onTarget} />,
  );

  mockMessages = [JSON.stringify({
    sessionId: 'bot-job-window-223e4567-e89b-42d3-a456-426614174000',
    operationId: 'botJobDetails.windowTarget',
    body: JSON.stringify({ botJobId: 41, workspaceEpoch: 8 }),
  })];
  view.rerender(
    <BotJobWindowControl socketPort={53972} sessionId={SESSION} onTarget={onTarget} />,
  );
  expect(onTarget).not.toHaveBeenCalled();

  mockMessages = [...mockMessages, JSON.stringify({
    sessionId: SESSION,
    operationId: 'botJobDetails.windowTarget',
    body: JSON.stringify({ botJobId: 42, workspaceEpoch: 9 }),
  })];
  view.rerender(
    <BotJobWindowControl socketPort={53972} sessionId={SESSION} onTarget={onTarget} />,
  );

  await waitFor(() => expect(onTarget).toHaveBeenCalledWith({ botJobId: 42, workspaceEpoch: 9 }));
});

afterEach(() => {
  mockMessages = [];
});
