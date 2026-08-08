import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import PageMappingsPage from './PageMappingsPage';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));
jest.mock('./PagesOpenButton', () => () => <button type="button">Pages</button>);
jest.mock('./DetachedPageShell', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const socket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
} as unknown as WebSocket;
let messages: string[] = [];

const response = (operationId: string, body: Record<string, unknown>) => JSON.stringify({
  operationId,
  sessionId: 'pageMappingsManager',
  body: JSON.stringify(body),
});

const sent = (operation: string) => (socket.send as jest.Mock).mock.calls
  .map(([value]) => JSON.parse(String(value)))
  .filter(envelope => envelope.type === operation);

beforeEach(() => {
  messages = [];
  jest.clearAllMocks();
  window.history.replaceState(
    {},
    '',
    '/?openWorkspace=pageMappings&sourceBotJobId=10&homeBankingId=999&windowCapability=opaque%20%2B%2F%3F%3D%26%20capability',
  );
  mockedUseWebSocket.mockImplementation(() => ({
    webSocket: socket,
    connected: true,
    reconnectAttempts: 0,
    messages,
    error: null,
  }));
});

test('uses the server-owned binding and sends correlated capture requests without owner authority', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(mockedUseWebSocket).toHaveBeenCalledWith(5000, 'pageMappingsManager', {
    windowCapability: 'opaque +/?=& capability',
  });
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapEnvelope = sent('pageMappings.bootstrap')[0];
  const bootstrapBody = JSON.parse(bootstrapEnvelope.body);
  expect(bootstrapBody).toEqual({ requestId: expect.any(String) });
  expect(bootstrapEnvelope.windowCapability).toBeUndefined();
  expect(bootstrapEnvelope.body).not.toContain('opaque +/?=& capability');

  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapBody.requestId,
    bindingEpoch: 'binding-a',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    botJobName: 'Authoritative Bot Job',
    snapshots: [{
      scanId: 'scan-a',
      pageKey: 'page-a',
      pageUrl: 'https://bank.example/login',
      capturedAt: '2026-08-07T10:00:00Z',
      elementCount: 1,
      artifactPath: 'org-2/bot-job-32/scan-a',
      manifestSha256: 'a'.repeat(64),
      status: 'READY',
      pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  expect(JSON.parse(sent('pageMappings.capture')[0].body)).toEqual({
    requestId: expect.any(String),
    scanId: 'scan-a',
    bindingEpoch: 'binding-a',
  });
  expect(screen.getByText(/Owner-scoped captures for Bot Job 32/)).toBeInTheDocument();
  expect(new URLSearchParams(window.location.search).has('homeBankingId')).toBe(false);
  expect(new URLSearchParams(window.location.search).get('windowCapability'))
    .toBe('opaque +/?=& capability');
});

test('does not attach a blank detached-window capability', async () => {
  window.history.replaceState(
    {},
    '',
    '/?openWorkspace=pageMappings&sourceBotJobId=10&windowCapability=%20%20',
  );

  render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(mockedUseWebSocket).toHaveBeenCalledWith(5000, 'pageMappingsManager', undefined);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  expect(JSON.parse(sent('pageMappings.bootstrap')[0].body))
    .toEqual({ requestId: expect.any(String) });
});

test('rejects an invalidation with a mismatched primary and partial alternate binding', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapRequest = JSON.parse(sent('pageMappings.bootstrap')[0].body);
  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapRequest.requestId,
    bindingEpoch: 'binding-b',
    workspaceEpoch: 2,
    homeBankingId: 2,
    botJobId: 20,
    botJobName: 'B',
    snapshots: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(await screen.findByText(/Owner-scoped captures for Bot Job 20/)).toBeInTheDocument();

  messages = [...messages, response('pageMappings.invalidated', {
    bindingEpoch: 'binding-a',
    workspaceEpoch: 1,
    homeBankingId: 1,
    botJobId: 10,
    alternateBindingEpoch: 'binding-b',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(screen.queryByText('Page Mappings is unavailable.')).not.toBeInTheDocument();
  expect(screen.getByText(/Owner-scoped captures for Bot Job 20/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
});

test('accepts an invalidation whose complete alternate binding matches the active owner', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapRequest = JSON.parse(sent('pageMappings.bootstrap')[0].body);
  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapRequest.requestId,
    bindingEpoch: 'binding-b',
    workspaceEpoch: 2,
    homeBankingId: 2,
    botJobId: 20,
    botJobName: 'B',
    snapshots: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(await screen.findByText(/Owner-scoped captures for Bot Job 20/)).toBeInTheDocument();

  messages = [...messages, response('pageMappings.invalidated', {
    bindingEpoch: 'binding-a',
    workspaceEpoch: 1,
    homeBankingId: 1,
    botJobId: 10,
    alternateBindingEpoch: 'binding-b',
    alternateWorkspaceEpoch: 2,
    alternateHomeBankingId: 2,
    alternateBotJobId: 20,
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(await screen.findByRole('status')).toHaveTextContent('Page Mappings is unavailable.');
  expect(screen.getByText(/Owner-scoped captures for Bot Job —/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reload' })).toBeDisabled();
});

test('retargets atomically, ignores a late capture, and stages only authoritative registry identity', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const firstBootstrap = JSON.parse(sent('pageMappings.bootstrap')[0].body);

  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: firstBootstrap.requestId,
    bindingEpoch: 'binding-a',
    workspaceEpoch: 1,
    homeBankingId: 1,
    botJobId: 10,
    botJobName: 'A',
    snapshots: [{
      scanId: 'scan-a', pageKey: 'page-a', pageUrl: 'https://a.example/',
      capturedAt: '2026-08-07T10:00:00Z', elementCount: 1, artifactPath: 'a',
      manifestSha256: 'a'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  const captureA = JSON.parse(sent('pageMappings.capture')[0].body);

  messages = [...messages, response('pageMappings.retarget', {
    bindingEpoch: 'binding-b',
    workspaceEpoch: 2,
    homeBankingId: 2,
    botJobId: 20,
    botJobName: 'B',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  expect(new URLSearchParams(window.location.search).get('windowCapability'))
    .toBe('opaque +/?=& capability');
  const bootstrapB = JSON.parse(sent('pageMappings.bootstrap')[1].body);

  messages = [...messages, response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapB.requestId,
    bindingEpoch: 'binding-b',
    workspaceEpoch: 2,
    homeBankingId: 2,
    botJobId: 20,
    botJobName: 'B',
    snapshots: [{
      scanId: 'scan-b', pageKey: 'page-b', pageUrl: 'https://b.example/',
      capturedAt: '2026-08-07T11:00:00Z', elementCount: 1, artifactPath: 'b',
      manifestSha256: 'b'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  const captureB = JSON.parse(sent('pageMappings.capture')[1].body);

  messages = [...messages,
    response('pageMappings.captureResponse', {
      ok: true,
      requestId: captureB.requestId,
      bindingEpoch: 'binding-b',
      scanId: 'scan-b',
      pageKey: 'page-b',
      capturedAt: '2026-08-07T11:00:00Z',
      manifestSha256: 'b'.repeat(64),
      elements: [{
        scannedElementId: 91,
        elementHash: 'hash-b',
        lastScannedAt: '2026-08-07T11:00:00Z',
        scanCount: 3,
        clientNamed: 'B element',
        tagName: 'input',
        typeElement: 'INPUT',
        xPath: '//input[@id="b"]',
      }],
      rectangles: [],
    }),
    response('pageMappings.captureResponse', {
      ok: true,
      requestId: captureA.requestId,
      bindingEpoch: 'binding-a',
      scanId: 'scan-a',
      pageKey: 'page-a',
      capturedAt: '2026-08-07T10:00:00Z',
      manifestSha256: 'a'.repeat(64),
      elements: [{ clientNamed: 'STALE A element' }],
      rectangles: [],
    })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(await screen.findByText('B element')).toBeInTheDocument();
  expect(screen.queryByText('STALE A element')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));

  await waitFor(() => expect(sent('memoryList.open')).toHaveLength(1));
  const memoryBody = JSON.parse(sent('memoryList.open')[0].body);
  expect(memoryBody.sourceBindingEpoch).toBe('binding-b');
  expect(memoryBody.workspaceEpoch).toBe(2);
  expect(memoryBody.snapshot.homeBankingId).toBe(2);
  expect(memoryBody.snapshot.botJobId).toBe(20);
  expect(memoryBody.snapshot.workspaceEpoch).toBe(2);
  expect(memoryBody.snapshot.items[0].payload).toEqual({
    captureId: 'scan-b',
    pageKey: 'page-b',
    scannedElementId: 91,
    elementHash: 'hash-b',
    expectedLastScannedAt: '2026-08-07T11:00:00Z',
    expectedScanCount: 3,
  });
  expect(memoryBody.snapshot.items[0].payload.elementDTO).toBeUndefined();
});

test('clears every owner-scoped surface and staged mapping when the workspace is invalidated', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapRequest = JSON.parse(sent('pageMappings.bootstrap')[0].body);

  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapRequest.requestId,
    bindingEpoch: 'binding-active',
    workspaceEpoch: 4,
    homeBankingId: 2,
    botJobId: 32,
    botJobName: 'Active owner',
    snapshots: [{
      scanId: 'scan-active', pageKey: 'page-active', pageUrl: 'https://bank.example/',
      capturedAt: '2026-08-07T12:00:00Z', elementCount: 1,
      artifactPath: 'sensitive/server/path', manifestSha256: 'c'.repeat(64),
      status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  const captureRequest = JSON.parse(sent('pageMappings.capture')[0].body);

  messages = [...messages, response('pageMappings.captureResponse', {
    ok: true,
    requestId: captureRequest.requestId,
    bindingEpoch: 'binding-active',
    scanId: 'scan-active',
    pageKey: 'page-active',
    capturedAt: '2026-08-07T12:00:00Z',
    manifestSha256: 'c'.repeat(64),
    elements: [{
      scannedElementId: 101,
      elementHash: 'hash-active',
      lastScannedAt: '2026-08-07T12:00:00Z',
      scanCount: 1,
      clientNamed: 'Staged active element',
      tagName: 'input',
      typeElement: 'INPUT',
      xPath: '//input',
    }],
    rectangles: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(await screen.findByText('Staged active element')).toBeInTheDocument();
  expect(screen.queryByText('sensitive/server/path')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search captured elements'), {
    target: { value: 'Staged active' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  expect(within(screen.getByLabelText('Selected elements for Memory List'))
    .getByText('Staged active element')).toBeInTheDocument();

  messages = [...messages, response('pageMappings.invalidated', {
    bindingEpoch: 'binding-active',
    workspaceEpoch: 4,
    homeBankingId: 2,
    botJobId: 32,
    reason: 'owner deleted',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);

  expect(await screen.findByRole('status')).toHaveTextContent('Page Mappings is unavailable.');
  expect(screen.getByText(/Owner-scoped captures for Bot Job —/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reload' })).toBeDisabled();
  expect(screen.getByText('Run Page Scanner to create the first immutable capture.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Search captured elements')).not.toBeInTheDocument();
  expect(screen.queryByText('Staged active element')).not.toBeInTheDocument();
});

test('rejects late Memory List responses and commands after an owner retarget', async () => {
  const view = render(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapA = JSON.parse(sent('pageMappings.bootstrap')[0].body);

  messages = [response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapA.requestId,
    bindingEpoch: 'binding-a',
    workspaceEpoch: 1,
    homeBankingId: 1,
    botJobId: 10,
    botJobName: 'A',
    snapshots: [{
      scanId: 'scan-a', pageKey: 'page-a', pageUrl: 'https://a.example/',
      capturedAt: '2026-08-07T10:00:00Z', elementCount: 1,
      manifestSha256: 'a'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  const captureA = JSON.parse(sent('pageMappings.capture')[0].body);
  messages = [...messages, response('pageMappings.captureResponse', {
    ok: true,
    requestId: captureA.requestId,
    bindingEpoch: 'binding-a',
    scanId: 'scan-a',
    pageKey: 'page-a',
    capturedAt: '2026-08-07T10:00:00Z',
    manifestSha256: 'a'.repeat(64),
    elements: [{
      scannedElementId: 11, elementHash: 'hash-a',
      lastScannedAt: '2026-08-07T10:00:00Z', scanCount: 1,
      clientNamed: 'Owner A element', typeElement: 'INPUT', tagName: 'input', xPath: '//a',
    }],
    rectangles: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(await screen.findByText('Owner A element')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  await waitFor(() => expect(sent('memoryList.open')).toHaveLength(1));
  const memoryA = JSON.parse(sent('memoryList.open')[0].body);

  messages = [...messages, response('pageMappings.retarget', {
    bindingEpoch: 'binding-b', workspaceEpoch: 2,
    homeBankingId: 2, botJobId: 20, botJobName: 'B',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  const bootstrapB = JSON.parse(sent('pageMappings.bootstrap')[1].body);

  messages = [...messages, response('memoryList.openResponse', {
    ok: true,
    requestId: memoryA.requestId,
    homeBankingId: 1,
    botJobId: 10,
    ownerEpoch: 'owner-a',
    message: 'LATE OWNER A RESPONSE',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(screen.queryByText('LATE OWNER A RESPONSE')).not.toBeInTheDocument();

  messages = [...messages, response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapB.requestId,
    bindingEpoch: 'binding-b',
    workspaceEpoch: 2,
    homeBankingId: 2,
    botJobId: 20,
    botJobName: 'B',
    snapshots: [{
      scanId: 'scan-b', pageKey: 'page-b', pageUrl: 'https://b.example/',
      capturedAt: '2026-08-07T11:00:00Z', elementCount: 1,
      manifestSha256: 'b'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  const captureB = JSON.parse(sent('pageMappings.capture')[1].body);
  messages = [...messages, response('pageMappings.captureResponse', {
    ok: true,
    requestId: captureB.requestId,
    bindingEpoch: 'binding-b',
    scanId: 'scan-b',
    pageKey: 'page-b',
    capturedAt: '2026-08-07T11:00:00Z',
    manifestSha256: 'b'.repeat(64),
    elements: [{
      scannedElementId: 22, elementHash: 'hash-b',
      lastScannedAt: '2026-08-07T11:00:00Z', scanCount: 2,
      clientNamed: 'Owner B element', typeElement: 'INPUT', tagName: 'input', xPath: '//b',
    }],
    rectangles: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(await screen.findByText('Owner B element')).toBeInTheDocument();
  messages = [...messages, response('pageMappings.invalidated', {
    bindingEpoch: 'binding-a', workspaceEpoch: 1, homeBankingId: 1, botJobId: 10,
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(screen.queryByText('Page Mappings is unavailable.')).not.toBeInTheDocument();
  expect(screen.getByText('Owner B element')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  await waitFor(() => expect(sent('memoryList.open')).toHaveLength(2));
  const memoryB = JSON.parse(sent('memoryList.open')[1].body);
  expect(memoryB.ownerEpoch).toBe('');
  expect(memoryB.snapshot.items).toHaveLength(1);
  expect(memoryB.snapshot.items[0].label).toBe('Owner B element');

  messages = [...messages, response('memoryList.openResponse', {
    ok: true,
    requestId: memoryB.requestId,
    homeBankingId: 2,
    botJobId: 20,
    ownerEpoch: 'owner-b',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('memoryList.sync')).toHaveLength(1));

  const dropZone = screen.getByLabelText('Selected elements for Memory List');
  messages = [...messages, response('memoryList.command', {
    command: 'REMOVE',
    homeBankingId: 1,
    botJobId: 10,
    sourceBindingEpoch: 'binding-a',
    ownerEpoch: 'owner-a',
    payload: { sourceItemKey: 'scan-b:22' },
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(within(dropZone).getByText('Owner B element')).toBeInTheDocument();

  messages = [...messages, response('memoryList.command', {
    command: 'REMOVE',
    homeBankingId: 2,
    botJobId: 20,
    sourceBindingEpoch: 'binding-b',
    ownerEpoch: 'owner-b',
    payload: { sourceItemKey: 'scan-b:22' },
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(within(dropZone).queryByText('Owner B element')).not.toBeInTheDocument());

  messages = [...messages, response('pageMappings.retarget', {
    bindingEpoch: 'binding-a2', workspaceEpoch: 3,
    homeBankingId: 1, botJobId: 10, botJobName: 'A reopened',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(3));
  const bootstrapA2 = JSON.parse(sent('pageMappings.bootstrap')[2].body);
  messages = [...messages, response('pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrapA2.requestId,
    bindingEpoch: 'binding-a2',
    workspaceEpoch: 3,
    homeBankingId: 1,
    botJobId: 10,
    botJobName: 'A reopened',
    snapshots: [{
      scanId: 'scan-a2', pageKey: 'page-a', pageUrl: 'https://a.example/',
      capturedAt: '2026-08-07T12:00:00Z', elementCount: 1,
      manifestSha256: 'c'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(3));
  const captureA2 = JSON.parse(sent('pageMappings.capture')[2].body);
  messages = [...messages, response('pageMappings.captureResponse', {
    ok: true,
    requestId: captureA2.requestId,
    bindingEpoch: 'binding-a2',
    scanId: 'scan-a2',
    pageKey: 'page-a',
    capturedAt: '2026-08-07T12:00:00Z',
    manifestSha256: 'c'.repeat(64),
    elements: [{
      scannedElementId: 33, elementHash: 'hash-a2',
      lastScannedAt: '2026-08-07T12:00:00Z', scanCount: 3,
      clientNamed: 'Owner A reopened element', typeElement: 'INPUT', tagName: 'input', xPath: '//a2',
    }],
    rectangles: [],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(await screen.findByText('Owner A reopened element')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  await waitFor(() => expect(sent('memoryList.open')).toHaveLength(3));
  const memoryA2 = JSON.parse(sent('memoryList.open')[2].body);
  messages = [...messages, response('memoryList.openResponse', {
    ok: true,
    requestId: memoryA2.requestId,
    homeBankingId: 1,
    botJobId: 10,
    ownerEpoch: 'owner-a',
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('memoryList.sync')).toHaveLength(2));

  const reopenedDropZone = screen.getByLabelText('Selected elements for Memory List');
  messages = [...messages, response('memoryList.command', {
    command: 'REMOVE',
    homeBankingId: 1,
    botJobId: 10,
    sourceBindingEpoch: 'binding-a',
    ownerEpoch: 'owner-a',
    payload: { sourceItemKey: 'scan-a2:33' },
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  expect(within(reopenedDropZone).getByText('Owner A reopened element')).toBeInTheDocument();

  messages = [...messages, response('memoryList.command', {
    command: 'REMOVE',
    homeBankingId: 1,
    botJobId: 10,
    sourceBindingEpoch: 'binding-a2',
    ownerEpoch: 'owner-a',
    payload: { sourceItemKey: 'scan-a2:33' },
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(within(reopenedDropZone)
    .queryByText('Owner A reopened element')).not.toBeInTheDocument());
});
