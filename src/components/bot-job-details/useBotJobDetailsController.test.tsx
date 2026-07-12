import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BotJobDetailsState } from './BotJobDetails.types';
import { useBotJobDetailsController } from './useBotJobDetailsController';

const state: BotJobDetailsState = {
  revision: 5, botJobId: 42, name: 'Payments', description: 'Flow', projectType: 'Web App', active: true,
  homeBankingId: 7, organizationName: 'Bank', homeUrlId: 8, environmentName: 'TEST',
  environmentUrl: 'https://test.example', navigationTimeSeconds: 2,
  environments: [{ id: 8, name: 'TEST', url: 'https://test.example', homeBankingId: 7, organizationName: 'Bank' }],
  blocks: [],
  capabilities: { canUseWorkspaceActions: true, canEditMetadata: true, canUsePreScan: true, canShowComponents: true, canExecute: true, canLaunch: true, canOpenOrganizations: true },
  executionState: 'IDLE', activeSurface: 'botJob', componentsVisible: false,
};

interface HarnessProps { socket: WebSocket; messages: string[]; botJobId?: number }

const Harness: React.FC<HarnessProps> = ({ socket, messages, botJobId = 42 }) => {
  const controller = useBotJobDetailsController({
    webSocket: socket, connected: true, messages, sessionId: 'botJobTasks', homeBankingId: 7, botJobId,
  });
  return <div>
    <span data-testid="job-name">{controller.state?.name || ''}</span>
    <span data-testid="surface">{controller.state?.activeSurface || ''}</span>
    <span data-testid="loading">{String(controller.loadingState)}</span>
    <span data-testid="saving">{String(controller.savingMetadata)}</span>
    <span data-testid="saved-revision">{controller.metadataSavedRevision ?? ''}</span>
    <span data-testid="workspace-capability">{String(controller.state?.capabilities.canUseWorkspaceActions)}</span>
    <span data-testid="status">{controller.status}</span>
    <button type="button" onClick={() => controller.saveMetadata({ expectedRevision: 3, name: 'Payments QA', description: 'Flow', homeUrlId: 8 })}>Save metadata</button>
    <button type="button" onClick={() => controller.sendAction('SHOW_COMPONENTS')}>Show components</button>
    <button type="button" onClick={controller.retryBootstrap}>Retry bootstrap</button>
  </div>;
};

function response(operationId: string, body: Record<string, unknown>, sessionId = 'botJobTasks'): string {
  return JSON.stringify({ sessionId, operationId, body: JSON.stringify(body) });
}

function sentBody(send: jest.Mock, index: number): Record<string, any> {
  return JSON.parse(JSON.parse(send.mock.calls[index][0]).body);
}

async function completeBootstrap(view: ReturnType<typeof render>, socket: WebSocket, send: jest.Mock): Promise<string[]> {
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  const message = response('botJobDetails.bootstrapResponse', {
    ok: true, botJobId: 42, requestId: sentBody(send, 0).requestId, state,
  });
  view.rerender(<Harness socket={socket} messages={[message]} />);
  await waitFor(() => expect(screen.getByTestId('job-name')).toHaveTextContent('Payments'));
  return [message];
}

test('applies bootstrap state only after request correlation and sends the draft base revision', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  const requestId = sentBody(send, 0).requestId;
  const wrong = response('botJobDetails.bootstrapResponse', {
    ok: true, botJobId: 42, requestId: 'wrong-request', state: { ...state, name: 'Wrong state' },
  });
  view.rerender(<Harness socket={socket} messages={[wrong]} />);
  expect(screen.getByTestId('job-name')).toHaveTextContent('');

  const correct = response('botJobDetails.bootstrapResponse', { ok: true, botJobId: 42, requestId, state });
  view.rerender(<Harness socket={socket} messages={[wrong, correct]} />);
  await waitFor(() => expect(screen.getByTestId('job-name')).toHaveTextContent('Payments'));
  fireEvent.click(screen.getByRole('button', { name: 'Save metadata' }));
  expect(sentBody(send, 1)).toMatchObject({ expectedRevision: 3, botJobId: 42 });
});

test('requires matching action and a successful known surface before updating workspace state', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);
  fireEvent.click(screen.getByRole('button', { name: 'Show components' }));
  const actionRequest = sentBody(send, 1);

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true, botJobId: 42, requestId: actionRequest.requestId, action: 'REFRESH', activeSurface: 'components',
    state: { ...state, revision: 6, name: 'Wrong action state' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('job-name')).toHaveTextContent('Payments');

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: false, botJobId: 42, requestId: actionRequest.requestId,
    activeSurface: 'unknown', message: 'Components unavailable',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Components unavailable'));
  expect(screen.getByTestId('surface')).toHaveTextContent('botJob');

  fireEvent.click(screen.getByRole('button', { name: 'Show components' }));
  const successRequest = sentBody(send, 2);
  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true, botJobId: 42, requestId: successRequest.requestId, action: 'SHOW_COMPONENTS',
    activeSurface: 'components', componentsVisible: true,
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('surface')).toHaveTextContent('components'));
});

test('matches metadata response operation before applying its state', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);
  fireEvent.click(screen.getByRole('button', { name: 'Save metadata' }));
  const updateRequest = sentBody(send, 1);

  messages = [...messages, response('botJobDetails.environments.refreshResponse', {
    ok: true, botJobId: 42, requestId: updateRequest.requestId,
    state: { ...state, revision: 6, name: 'Wrong operation state' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('job-name')).toHaveTextContent('Payments');
  expect(screen.getByTestId('saving')).toHaveTextContent('true');

  messages = [...messages, response('botJobDetails.metadata.updateResponse', {
    ok: true, botJobId: 42, requestId: updateRequest.requestId,
    state: { ...state, revision: 6, name: 'Payments QA' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('job-name')).toHaveTextContent('Payments QA'));
  expect(screen.getByTestId('saving')).toHaveTextContent('false');
});

test('closes the saved draft when persistence committed but desktop synchronization failed', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);
  fireEvent.click(screen.getByRole('button', { name: 'Save metadata' }));
  const updateRequest = sentBody(send, 1);

  messages = [...messages, response('botJobDetails.metadata.updateResponse', {
    ok: false,
    errorCode: 'DESKTOP_STATE_SYNC_FAILED',
    message: 'Metadata was saved but the desktop context could not be synchronized',
    botJobId: 42,
    requestId: updateRequest.requestId,
    state: { ...state, revision: 6, name: 'Payments QA' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);

  await waitFor(() => expect(screen.getByTestId('job-name')).toHaveTextContent('Payments QA'));
  expect(screen.getByTestId('saved-revision')).toHaveTextContent('6');
  expect(screen.getByTestId('status')).toHaveTextContent('desktop context could not be synchronized');
});

test('invalidates capabilities on license loss and reboots state after activation', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  messages = [...messages, response('license.statusChanged', { active: false })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('workspace-capability')).toHaveTextContent('false'));
  expect(screen.getByTestId('status')).toHaveTextContent('License activation is required');

  messages = [...messages, response('license.statusChanged', { active: true })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(JSON.parse(send.mock.calls[1][0]).type).toBe('botJobDetails.bootstrap');
});

test('times out bootstrap and retries explicitly on the same socket', () => {
  jest.useFakeTimers();
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  expect(send).toHaveBeenCalledTimes(1);
  const firstRequestId = sentBody(send, 0).requestId;
  act(() => { jest.advanceTimersByTime(10000); });
  expect(screen.getByTestId('loading')).toHaveTextContent('false');
  expect(screen.getByTestId('status')).toHaveTextContent('did not return Bot Job details');
  fireEvent.click(screen.getByRole('button', { name: 'Retry bootstrap' }));
  expect(send).toHaveBeenCalledTimes(2);
  expect(sentBody(send, 1).requestId).not.toBe(firstRequestId);
  view.unmount();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('identity change clears stale state and issues a new bootstrap', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  view.rerender(<Harness socket={socket} messages={[]} botJobId={99} />);
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(sentBody(send, 1).botJobId).toBe(99);
  expect(screen.getByTestId('job-name')).toHaveTextContent('');
});
