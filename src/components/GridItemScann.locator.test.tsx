import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GridItemScann from './GridItemScann';
import type { ElementDTO } from './instructionsMockData';
import {
  PAGE_SCANNER_LOCATOR_APPLY_OPERATION,
  PAGE_SCANNER_LOCATOR_APPLY_RESPONSE,
  PAGE_SCANNER_LOCATOR_GENERATE_OPERATION,
  PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE,
} from './scanner/PageScannerLocator';

const mockSend = jest.fn();
const mockSocket = { send: mockSend, readyState: WebSocket.OPEN } as unknown as WebSocket;
let mockMessages: string[] = [];
let mockConnected = true;

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: mockSocket,
    connected: mockConnected,
    reconnectAttempts: 0,
    messages: mockMessages,
    error: null,
  }),
}));

jest.mock('./bot-job-details/useBotJobDetailsController', () => ({
  useBotJobDetailsController: () => ({ state: null, sendAction: jest.fn() }),
}));

jest.mock('./scanner/useScannerController', () => ({
  useScannerController: () => ({
    state: null,
    loadingState: false,
    pendingAction: null,
    completedAction: null,
    status: '',
    statusTone: 'neutral',
    sendAction: jest.fn(),
  }),
}));

jest.mock('./scanner/PageScannerWorkspaceHeader', () => () => <div>Page Scanner Header</div>);

const SESSION_ID = 'page-scanner-123e4567-e89b-42d3-a456-426614174000';

const target: ElementDTO = {
  id: 15,
  typeElement: 'button',
  tagName: 'button',
  xPath: '//button[1]',
  someText: 'Avanti',
  attribId: '',
  attribName: '',
  coordinates: '',
  attributeData: [],
  customXPath: '',
  iFrameXPath: '',
  attributeValue: '',
  attributeType: '',
  autoScroll: '',
  autoEnter: '',
};

const props = {
  homeBankingIdInitial: 4,
  botJobIdInitial: 21,
  botJobNameInitial: 'Locator test',
  dataDTO: [target],
  socketPort: 52101,
  sessionId: SESSION_ID,
  mode: 'preScan' as const,
  onSessionOpen: jest.fn(),
};

const sentMessage = (type: string) => mockSend.mock.calls
  .map(([payload]) => JSON.parse(payload))
  .find((message) => message.type === type);

const response = (operationId: string, body: Record<string, unknown>) => JSON.stringify({
  sessionId: SESSION_ID,
  homeBankingId: 4,
  operationId,
  body: JSON.stringify(body),
});

const openAndGenerate = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open Locator Generator' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Control HTML' }), {
    target: { value: "<button test-id='next'>Avanti</button>" },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
  await waitFor(() => expect(sentMessage(PAGE_SCANNER_LOCATOR_GENERATE_OPERATION)).toBeDefined());
  return sentMessage(PAGE_SCANNER_LOCATOR_GENERATE_OPERATION);
};

afterEach(() => {
  cleanup();
  mockMessages = [];
  mockConnected = true;
  mockSend.mockReset();
  window.localStorage.clear();
  jest.useRealTimers();
});

test('does not expose detached locator actions on a legacy scanner transport', () => {
  render(<GridItemScann {...props} sessionId="preScannerGrid" />);

  expect(screen.queryByRole('button', { name: 'Open Locator Generator' })).not.toBeInTheDocument();
});

test('keeps the detached locator launcher available when the scan grid is empty', () => {
  render(<GridItemScann {...props} dataDTO={[]} />);

  expect(screen.getByRole('button', { name: 'Open Locator Generator' })).toBeInTheDocument();
});

test('offers input and click tests for every scanned Web Element row', () => {
  render(<GridItemScann {...props} />);

  const inputTest = screen.getByAltText('Test Input');
  const clickTest = screen.getByAltText('Test Click');
  expect(inputTest).toBeInTheDocument();
  expect(clickTest).toBeInTheDocument();

  fireEvent.click(inputTest);
  const inputRequest = sentMessage('pageScanner.testElement');
  expect(inputRequest).toBeDefined();
  expect(JSON.parse(inputRequest.body)).toMatchObject({
    action: 'TEST_INPUT_DTO',
    testAction: 'input',
  });

  mockSend.mockClear();
  fireEvent.click(clickTest);
  const clickRequest = sentMessage('pageScanner.testElement');
  expect(clickRequest).toBeDefined();
  expect(JSON.parse(clickRequest.body)).toMatchObject({
    action: 'TEST_CLICK_DTO',
    testAction: 'click',
  });
});

test('routes detached browser actions to the exact owner runtime preference', () => {
  window.localStorage.setItem(
    'arweb.smoke.runtime-mode.4.21',
    'TYPESCRIPT_PLAYWRIGHT_V2',
  );
  render(<GridItemScann {...props} />);

  fireEvent.click(screen.getByRole('button', { name: 'Refresh Web Page' }));
  expect(JSON.parse(sentMessage('pageScanner.refresh').body).runtimeMode)
    .toBe('TYPESCRIPT_PLAYWRIGHT_V2');

  mockSend.mockClear();
  fireEvent.click(screen.getByAltText('Test Click'));
  expect(JSON.parse(sentMessage('pageScanner.testElement').body).runtimeMode)
    .toBe('TYPESCRIPT_PLAYWRIGHT_V2');
});

test('sends exact-session requests and waits for persisted authoritative apply response', async () => {
  const view = render(<GridItemScann {...props} />);
  const generateMessage = await openAndGenerate();
  expect(generateMessage.sessionId).toBe(SESSION_ID);
  const generateBody = JSON.parse(generateMessage.body);

  const locator = {
    tagName: 'button',
    controlKind: 'button',
    label: 'Avanti',
    xpath: "//button[@test-id='next']",
    css: "button[test-id='next']",
    positional: false,
    note: 'Unique by test-id.',
  };
  mockMessages = [response(PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE, {
    requestId: generateBody.requestId,
    ok: true,
    controls: [locator],
    warning: '',
  })];
  view.rerender(<GridItemScann {...props} />);

  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply XPath' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Apply XPath' }));
  await waitFor(() => expect(sentMessage(PAGE_SCANNER_LOCATOR_APPLY_OPERATION)).toBeDefined());
  const applyMessage = sentMessage(PAGE_SCANNER_LOCATOR_APPLY_OPERATION);
  const applyBody = JSON.parse(applyMessage.body);
  expect(applyMessage.sessionId).toBe(SESSION_ID);
  expect(applyBody.xpath).toBe(locator.xpath);

  // A stale response is ignored and cannot update the selected element.
  mockMessages = [...mockMessages, response(PAGE_SCANNER_LOCATOR_APPLY_RESPONSE, {
    requestId: 'stale-apply',
    ok: true,
    persisted: true,
    elementKey: applyBody.elementKey,
    element: { ...target, customXPath: '//wrong' },
  })];
  view.rerender(<GridItemScann {...props} />);
  expect(screen.queryByText(/Current XPath:/)).not.toBeInTheDocument();

  mockMessages = [...mockMessages, response(PAGE_SCANNER_LOCATOR_APPLY_RESPONSE, {
    requestId: applyBody.requestId,
    ok: true,
    persisted: true,
    elementKey: applyBody.elementKey,
    element: { ...target, customXPath: locator.xpath },
  })];
  view.rerender(<GridItemScann {...props} />);
  await waitFor(() => expect(screen.getByText(`Current XPath: ${locator.xpath}`)).toBeInTheDocument());
});

test('matching Page Scanner server error clears generation busy state', async () => {
  const view = render(<GridItemScann {...props} />);
  const generateMessage = await openAndGenerate();
  const requestId = JSON.parse(generateMessage.body).requestId;

  mockMessages = [response('pageScanner.errorResponse', {
    requestId,
    ok: false,
    message: 'Locator HTML was rejected.',
  })];
  view.rerender(<GridItemScann {...props} />);

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Locator HTML was rejected.'));
  expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
});

test('generation timeout releases busy state and reports an unconfirmed request', async () => {
  jest.useFakeTimers();
  render(<GridItemScann {...props} />);
  await openAndGenerate();

  act(() => {
    jest.advanceTimersByTime(12000);
  });

  expect(screen.getByRole('alert')).toHaveTextContent(/timed out/i);
  expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
});

test('disconnect releases a pending request with refresh-or-rescan guidance', async () => {
  const view = render(<GridItemScann {...props} />);
  await openAndGenerate();

  mockConnected = false;
  view.rerender(<GridItemScann {...props} />);

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/refresh or rescan/i));
  expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
});

test('reports a persisted locator as needing refresh when its row was cleared in flight', async () => {
  const view = render(<GridItemScann {...props} />);
  const generateMessage = await openAndGenerate();
  const generateBody = JSON.parse(generateMessage.body);
  const locator = {
    tagName: 'button',
    controlKind: 'button',
    label: 'Avanti',
    xpath: "//button[@test-id='next']",
    css: "button[test-id='next']",
    positional: false,
    note: 'Unique by test-id.',
  };

  mockMessages = [response(PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE, {
    requestId: generateBody.requestId,
    ok: true,
    controls: [locator],
    warning: '',
  })];
  view.rerender(<GridItemScann {...props} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply XPath' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Apply XPath' }));
  await waitFor(() => expect(sentMessage(PAGE_SCANNER_LOCATOR_APPLY_OPERATION)).toBeDefined());
  const applyBody = JSON.parse(sentMessage(PAGE_SCANNER_LOCATOR_APPLY_OPERATION).body);

  fireEvent.click(screen.getByRole('button', { name: 'Clear Grid' }));
  await waitFor(() => expect(sentMessage('pageScanner.clear')).toBeDefined());
  const clearBody = JSON.parse(sentMessage('pageScanner.clear').body);

  mockMessages = [
    ...mockMessages,
    response('pageScanner.clearResponse', {
      requestId: clearBody.requestId,
      ok: true,
      message: 'Grid cleared.',
    }),
    response(PAGE_SCANNER_LOCATOR_APPLY_RESPONSE, {
      requestId: applyBody.requestId,
      ok: true,
      persisted: true,
      elementKey: applyBody.elementKey,
      element: { ...target, customXPath: locator.xpath },
    }),
  ];
  view.rerender(<GridItemScann {...props} />);

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/row is no longer in the grid/i));
  expect(screen.queryByText(/XPath applied to/i)).not.toBeInTheDocument();
});
