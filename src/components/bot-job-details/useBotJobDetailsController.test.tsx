import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BotJobDetailsState } from './BotJobDetails.types';
import { useBotJobDetailsController } from './useBotJobDetailsController';

const state: BotJobDetailsState = {
  revision: 5, metadataRevision: 5, botJobId: 42, name: 'Payments', description: 'Flow', projectType: 'Web App', active: true,
  homeBankingId: 7, organizationName: 'Bank', homeUrlId: 8, environmentName: 'TEST',
  environmentUrl: 'https://test.example', navigationTimeSeconds: 2, transferPathConfigured: true,
  environments: [{ id: 8, name: 'TEST', url: 'https://test.example', homeBankingId: 7, organizationName: 'Bank' }],
  blocks: [],
  capabilities: { canUseWorkspaceActions: true, canEditMetadata: true, canUsePreScan: true, canShowComponents: true, canExecute: true, canLaunch: true, canUseFileActions: true, canOpenOrganizations: true },
  executionState: 'IDLE', activeSurface: 'botJob', componentsVisible: false,
};

interface HarnessProps {
  socket: WebSocket;
  messages: string[];
  botJobId?: number;
  onSurfaceOpen?: (targetSession: string, botJobId: number) => void;
}

const Harness: React.FC<HarnessProps> = ({ socket, messages, botJobId = 42, onSurfaceOpen }) => {
  const controller = useBotJobDetailsController({
    webSocket: socket, connected: true, messages, sessionId: 'botJobTasks', homeBankingId: 7, botJobId,
    onSurfaceOpen,
  });
  return <div>
    <span data-testid="job-name">{controller.state?.name || ''}</span>
    <span data-testid="surface">{controller.state?.activeSurface || ''}</span>
    <span data-testid="loading">{String(controller.loadingState)}</span>
    <span data-testid="saving">{String(controller.savingMetadata)}</span>
    <span data-testid="saved-revision">{controller.metadataSavedRevision ?? ''}</span>
    <span data-testid="workspace-capability">{String(controller.state?.capabilities.canUseWorkspaceActions)}</span>
    <span data-testid="pending-toolbar">{controller.pendingToolbarAction || ''}</span>
    <span data-testid="transfer-path">{controller.transferPath}</span>
    <span data-testid="status">{controller.status}</span>
    <span data-testid="pause-request">{controller.executionPause?.requestId || ''}</span>
    <button type="button" onClick={() => controller.saveMetadata({ expectedMetadataRevision: 3, name: 'Payments QA', description: 'Flow', homeUrlId: 8 })}>Save metadata</button>
    <button type="button" onClick={() => controller.sendAction('SHOW_COMPONENTS')}>Show components</button>
    <button type="button" onClick={() => controller.sendAction('SHOW_VARIABLES')}>Show variables</button>
    <button type="button" onClick={() => controller.sendAction('SHOW_PRE_SCAN')}>Show pre scan</button>
    <button type="button" onClick={() => controller.sendToolbarAction('CHOOSE_TRANSFER_PATH')}>Choose transfer folder</button>
    <button type="button" onClick={() => controller.sendToolbarAction('OPEN_EXCEL')}>Open Excel</button>
    <button type="button" onClick={() => controller.sendToolbarAction('CREATE_BAT')}>Create BAT</button>
    <button type="button" onClick={() => controller.sendToolbarAction('EXPORT_JOB', { confirmed: true, transferPath: 'D:\\exports' })}>Export toolbar</button>
    <button type="button" onClick={() => controller.sendToolbarAction('TEST_RUN', { executionMode: 'ALL', blockId: 0 })}>Start test run</button>
    <button type="button" onClick={() => controller.sendToolbarAction('STOP_TEST_RUN')}>Stop test run</button>
    <button type="button" onClick={() => controller.sendAction('CLOSE')}>Close workspace</button>
    <button type="button" onClick={() => controller.resolveExecutionPause('CONTINUE')}>Continue pause</button>
    <button type="button" onClick={() => controller.resolveExecutionPause('STOP')}>Stop pause</button>
    <button type="button" onClick={controller.retryBootstrap}>Retry bootstrap</button>
  </div>;
};

function response(operationId: string, body: Record<string, unknown>, sessionId = 'botJobTasks'): string {
  return JSON.stringify({ sessionId, operationId, body: JSON.stringify(body) });
}

function sentBody(send: jest.Mock, index: number): Record<string, any> {
  return JSON.parse(JSON.parse(send.mock.calls[index][0]).body);
}

async function completeBootstrap(
  view: ReturnType<typeof render>,
  socket: WebSocket,
  send: jest.Mock,
  onSurfaceOpen?: HarnessProps['onSurfaceOpen'],
): Promise<string[]> {
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  const message = response('botJobDetails.bootstrapResponse', {
    ok: true, botJobId: 42, requestId: sentBody(send, 0).requestId, state,
  });
  view.rerender(<Harness socket={socket} messages={[message]} onSurfaceOpen={onSurfaceOpen} />);
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
  expect(sentBody(send, 1)).toMatchObject({ expectedMetadataRevision: 3, botJobId: 42 });
});

test('requires matching action and a successful known surface before updating workspace state', async () => {
  const send = jest.fn();
  const onSurfaceOpen = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} onSurfaceOpen={onSurfaceOpen} />);
  let messages = await completeBootstrap(view, socket, send, onSurfaceOpen);
  fireEvent.click(screen.getByRole('button', { name: 'Show components' }));
  const actionRequest = sentBody(send, 1);

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true, botJobId: 42, requestId: actionRequest.requestId, action: 'REFRESH', activeSurface: 'components',
    state: { ...state, revision: 6, name: 'Wrong action state' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);
  expect(screen.getByTestId('job-name')).toHaveTextContent('Payments');

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: false, botJobId: 42, requestId: actionRequest.requestId,
    activeSurface: 'unknown', message: 'Components unavailable',
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Components unavailable'));
  expect(screen.getByTestId('surface')).toHaveTextContent('botJob');

  fireEvent.click(screen.getByRole('button', { name: 'Show components' }));
  const successRequest = sentBody(send, 2);
  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true, botJobId: 42, requestId: successRequest.requestId, action: 'SHOW_COMPONENTS',
    activeSurface: 'components', componentsVisible: true,
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Action accepted'));
  expect(screen.getByTestId('surface')).toHaveTextContent('botJob');
  expect(onSurfaceOpen).not.toHaveBeenCalled();
});

test('opens Variables as a detached action without replacing Bot Job Details state', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Show variables' }));
  const actionRequest = sentBody(send, 1);
  expect(actionRequest.action).toBe('SHOW_VARIABLES');

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true,
    botJobId: 42,
    requestId: actionRequest.requestId,
    action: 'SHOW_VARIABLES',
    message: 'Variables opened',
    state: { ...state, name: 'Must not replace the active Bot Job state' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);

  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Variables opened'));
  expect(screen.getByTestId('job-name')).toHaveTextContent('Payments');
  expect(screen.getByTestId('job-name')).not.toHaveTextContent('Must not replace');
});

test('opens a detached Page Scanner without navigating the Bot Job surface', async () => {
  const send = jest.fn();
  const onSurfaceOpen = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} onSurfaceOpen={onSurfaceOpen} />);
  let messages = await completeBootstrap(view, socket, send, onSurfaceOpen);

  fireEvent.click(screen.getByRole('button', { name: 'Show pre scan' }));
  expect(JSON.parse(send.mock.calls[1][0]).type).toBe('pageScannerWorkspace.open');
  const firstRequest = sentBody(send, 1);

  messages = [...messages, response('botJobDetails.actionResponse', {
    ok: true,
    botJobId: 42,
    requestId: firstRequest.requestId,
    action: 'SHOW_COMPONENTS',
    activeSurface: 'preScan',
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);
  expect(onSurfaceOpen).not.toHaveBeenCalled();

  messages = [...messages, response('pageScannerWorkspace.openResponse', {
    ok: false,
    botJobId: 42,
    requestId: firstRequest.requestId,
    message: 'Pre Scan unavailable',
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Pre Scan unavailable'));
  expect(onSurfaceOpen).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Show pre scan' }));
  const successRequest = sentBody(send, 2);
  messages = [...messages, response('pageScannerWorkspace.openResponse', {
    ok: true,
    botJobId: 42,
    requestId: successRequest.requestId,
    message: 'Page Scanner opened',
  })];
  view.rerender(<Harness socket={socket} messages={messages} onSurfaceOpen={onSurfaceOpen} />);

  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Page Scanner opened'));
  expect(onSurfaceOpen).not.toHaveBeenCalled();
  expect(screen.getByTestId('surface')).toHaveTextContent('botJob');
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
    state: { ...state, revision: 6, metadataRevision: 6, name: 'Payments QA' },
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('job-name')).toHaveTextContent('Payments QA'));
  expect(screen.getByTestId('saving')).toHaveTextContent('false');
});

test('keeps the toolbar action pending until request and action correlation both match', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Choose transfer folder' }));
  expect(send).toHaveBeenCalledTimes(2);
  expect(JSON.parse(send.mock.calls[1][0]).type).toBe('botJobDetails.toolbar.action');
  const request = sentBody(send, 1);
  expect(request).toMatchObject({ action: 'CHOOSE_TRANSFER_PATH', botJobId: 42 });
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CHOOSE_TRANSFER_PATH');

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true, botJobId: 42, requestId: 'wrong-request', action: 'CHOOSE_TRANSFER_PATH',
    selectedPath: 'D:\\wrong',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CHOOSE_TRANSFER_PATH');
  expect(screen.getByTestId('transfer-path')).toBeEmptyDOMElement();

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true, botJobId: 42, requestId: request.requestId, action: 'OPEN_REPORT',
    selectedPath: 'D:\\also-wrong',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CHOOSE_TRANSFER_PATH');
  expect(screen.getByTestId('transfer-path')).toBeEmptyDOMElement();

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true, botJobId: 42, requestId: request.requestId, action: 'CHOOSE_TRANSFER_PATH',
    selectedPath: 'D:\\exports\\payments', message: 'Transfer folder selected',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);

  await waitFor(() => expect(screen.getByTestId('pending-toolbar')).toBeEmptyDOMElement());
  expect(screen.getByTestId('transfer-path')).toHaveTextContent('D:\\exports\\payments');
  expect(screen.getByTestId('status')).toHaveTextContent('Transfer folder selected');
});

test('does not treat the opened workbook path as the Bot Job transfer folder', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Open Excel' }));
  const request = sentBody(send, 1);
  expect(request.action).toBe('OPEN_EXCEL');

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true,
    botJobId: 42,
    requestId: request.requestId,
    action: 'OPEN_EXCEL',
    selectedPath: 'D:\\Excel\\Payments.xlsx',
    message: 'Excel file opened',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);

  await waitFor(() => expect(screen.getByTestId('pending-toolbar')).toBeEmptyDOMElement());
  expect(screen.getByTestId('transfer-path')).toBeEmptyDOMElement();
  expect(screen.getByTestId('status')).toHaveTextContent('Excel file opened');
});

test('shows the exact BAT destination only after a correlated successful response', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Create BAT' }));
  expect(JSON.parse(send.mock.calls[1][0]).type).toBe('botJobDetails.toolbar.action');
  const request = sentBody(send, 1);
  expect(request).toMatchObject({ action: 'CREATE_BAT', botJobId: 42 });
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CREATE_BAT');

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true,
    botJobId: 42,
    requestId: 'wrong-request',
    action: 'CREATE_BAT',
    selectedPath: 'D:\\wrong\\launcher.bat',
    message: 'BAT file created',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CREATE_BAT');
  expect(screen.getByTestId('status')).not.toHaveTextContent('D:\\wrong\\launcher.bat');

  const destination = 'D:\\Bot Jobs\\execute_web_app_7_Botjob_42.bat';
  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true,
    botJobId: 42,
    requestId: request.requestId,
    action: 'CREATE_BAT',
    selectedPath: destination,
    message: 'BAT file created',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);

  await waitFor(() => expect(screen.getByTestId('pending-toolbar')).toBeEmptyDOMElement());
  expect(screen.getByTestId('status')).toHaveTextContent(`BAT file created — ${destination}`);
  expect(screen.getByTestId('transfer-path')).toBeEmptyDOMElement();
});

test('does not replace a correlated toolbar request with a concurrent operation', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Choose transfer folder' }));
  fireEvent.click(screen.getByRole('button', { name: 'Export toolbar' }));

  expect(send).toHaveBeenCalledTimes(2);
  expect(sentBody(send, 1).action).toBe('CHOOSE_TRANSFER_PATH');
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CHOOSE_TRANSFER_PATH');
  expect(screen.getByTestId('status')).toHaveTextContent('Wait for the current Bot Job operation');
});

test('allows Close to supersede a pending native chooser operation', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Choose transfer folder' }));
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('CHOOSE_TRANSFER_PATH');
  fireEvent.click(screen.getByRole('button', { name: 'Close workspace' }));

  expect(send).toHaveBeenCalledTimes(3);
  expect(sentBody(send, 2).action).toBe('CLOSE');
  expect(screen.getByTestId('pending-toolbar')).toBeEmptyDOMElement();
  view.unmount();
});

test('allows prompt STOP to supersede a pending TEST RUN startup request', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);

  fireEvent.click(screen.getByRole('button', { name: 'Start test run' }));
  const startRequest = sentBody(send, 1);
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('TEST_RUN');
  fireEvent.click(screen.getByRole('button', { name: 'Stop test run' }));
  const stopRequest = sentBody(send, 2);
  expect(stopRequest.action).toBe('STOP_TEST_RUN');
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('STOP_TEST_RUN');

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true, botJobId: 42, requestId: startRequest.requestId, action: 'TEST_RUN',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  expect(screen.getByTestId('pending-toolbar')).toHaveTextContent('STOP_TEST_RUN');

  messages = [...messages, response('botJobDetails.toolbar.actionResponse', {
    ok: true, botJobId: 42, requestId: stopRequest.requestId, action: 'STOP_TEST_RUN',
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('pending-toolbar')).toBeEmptyDOMElement());
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
    state: { ...state, revision: 6, metadataRevision: 6, name: 'Payments QA' },
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

  const restoredRequest = sentBody(send, 1);
  messages = [...messages, response('botJobDetails.bootstrapResponse', {
    ok: true,
    botJobId: 42,
    requestId: restoredRequest.requestId,
    state,
  })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('workspace-capability')).toHaveTextContent('true'));
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

test('correlates PAUSE and sends one exact Continue response for the active execution', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  let messages = await completeBootstrap(view, socket, send);
  const pause = {
    requestId: 'pause-17',
    botJobId: 42,
    workspaceEpoch: 9,
    executionId: 17,
    executionAttemptId: 3,
    title: 'PAUSE BOT JOB',
    header: 'Paused at block',
    blockName: 'Login',
    instructionName: 'Review page',
    body: 'Use Page Scanner or continue.',
    continueLabel: 'Continue',
    stopLabel: 'Stop Run',
  };
  messages = [...messages, response('botJobExecution.pause.request', pause)];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('pause-request')).toHaveTextContent('pause-17'));

  messages = [...messages, response('license.statusChanged', { active: false })];
  view.rerender(<Harness socket={socket} messages={messages} />);
  await waitFor(() => expect(screen.getByTestId('workspace-capability')).toHaveTextContent('false'));
  expect(screen.getByTestId('pause-request')).toHaveTextContent('pause-17');

  fireEvent.click(screen.getByRole('button', { name: 'Continue pause' }));
  expect(JSON.parse(send.mock.calls[1][0]).type).toBe('botJobExecution.pause.response');
  expect(sentBody(send, 1)).toEqual({
    requestId: 'pause-17',
    botJobId: 42,
    workspaceEpoch: 9,
    executionId: 17,
    executionAttemptId: 3,
    decision: 'CONTINUE',
  });
  expect(screen.getByTestId('pause-request')).toBeEmptyDOMElement();

  fireEvent.click(screen.getByRole('button', { name: 'Continue pause' }));
  expect(send).toHaveBeenCalledTimes(2);
});

test('ignores a PAUSE request for another Bot Job', async () => {
  const send = jest.fn();
  const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
  const view = render(<Harness socket={socket} messages={[]} />);
  const messages = await completeBootstrap(view, socket, send);
  view.rerender(<Harness socket={socket} messages={[...messages, response('botJobExecution.pause.request', {
    requestId: 'wrong-job', botJobId: 99, workspaceEpoch: 9, executionId: 17,
    executionAttemptId: 3, title: 'PAUSE', header: 'Paused', blockName: 'Wrong',
    instructionName: '', body: '', continueLabel: 'Continue', stopLabel: 'Stop Run',
  })]} />);

  expect(screen.getByTestId('pause-request')).toBeEmptyDOMElement();
});
