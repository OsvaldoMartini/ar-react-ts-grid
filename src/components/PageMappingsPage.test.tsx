import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import PageMappingsPage from './PageMappingsPage';
import type { PageMappingsRetentionState } from './page-mappings/PageMappingsRetentionPanel';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));
jest.mock('./PagesOpenButton', () => () => <button type="button">Pages</button>);
jest.mock('./DetachedPageShell', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const socket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
} as unknown as WebSocket;
let messages: string[] = [];
let connected = true;

const retentionState = (
  overrides: Partial<PageMappingsRetentionState> = {},
): PageMappingsRetentionState => ({
  retentionDays: 14,
  maxUnpinnedPerPage: 4,
  enabled: true,
  readyCount: 1,
  pinnedCount: 0,
  eligibleCount: 2,
  ...overrides,
});

const readyStorage = (overrides: Partial<PageMappingsRetentionState> = {}) => ({
  storageReady: true,
  retention: retentionState(overrides),
});

const response = (operationId: string, body: Record<string, unknown>) => JSON.stringify({
  operationId,
  sessionId: 'pageMappingsManager',
  body: JSON.stringify(body),
});

const sent = (operation: string) => (socket.send as jest.Mock).mock.calls
  .map(([value]) => JSON.parse(String(value)))
  .filter(envelope => envelope.type === operation);

const latestSentBody = (operation: string): Record<string, unknown> => {
  const envelopes = sent(operation);
  return JSON.parse(envelopes[envelopes.length - 1].body) as Record<string, unknown>;
};

const page = () => (
  <PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />
);

const appendResponse = (
  view: ReturnType<typeof render>,
  operationId: string,
  body: Record<string, unknown>,
) => {
  messages = [...messages, response(operationId, body)];
  view.rerender(page());
};

const hydrateReadyRetention = async (
  view: ReturnType<typeof render>,
  overrides: Partial<PageMappingsRetentionState> = {},
) => {
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrap = latestSentBody('pageMappings.bootstrap');
  appendResponse(view, 'pageMappings.bootstrapResponse', {
    ok: true,
    requestId: bootstrap.requestId,
    bindingEpoch: 'binding-retention',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    botJobName: 'Retention Job',
    ...readyStorage(overrides),
    snapshots: [],
  });

  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(1));
  const cache = latestSentBody('pageMappings.cacheState');
  appendResponse(view, 'pageMappings.cacheStateResponse', {
    ok: false,
    requestId: cache.requestId,
    bindingEpoch: cache.bindingEpoch,
    message: 'Live comparison is not required by this test.',
  });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled());
  return { bootstrap, retention: retentionState(overrides) };
};

beforeEach(() => {
  messages = [];
  connected = true;
  jest.clearAllMocks();
  window.history.replaceState(
    {},
    '',
    '/?openWorkspace=pageMappings&sourceBotJobId=10&homeBankingId=999&windowCapability=opaque%20%2B%2F%3F%3D%26%20capability',
  );
  mockedUseWebSocket.mockImplementation(() => ({
    webSocket: socket,
    connected,
    reconnectAttempts: 0,
    messages,
    error: null,
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
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
    ...readyStorage(),
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
    ...readyStorage(),
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
    ...readyStorage(),
    snapshots: [{
      scanId: 'scan-b', pageKey: 'page-b', pageUrl: 'https://b.example/',
      capturedAt: '2026-08-07T11:00:00Z', elementCount: 1, artifactPath: 'b',
      manifestSha256: 'b'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(2));
  const captureB = JSON.parse(sent('pageMappings.capture')[1].body);
  const cacheB = JSON.parse(sent('pageMappings.cacheState')[1].body);

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
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cacheB.requestId,
      bindingEpoch: cacheB.bindingEpoch,
      message: 'Live comparison unavailable in this test.',
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
    ...readyStorage(),
    snapshots: [{
      scanId: 'scan-active', pageKey: 'page-active', pageUrl: 'https://bank.example/',
      capturedAt: '2026-08-07T12:00:00Z', elementCount: 1,
      artifactPath: 'sensitive/server/path', manifestSha256: 'c'.repeat(64),
      status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(1));
  const captureRequest = JSON.parse(sent('pageMappings.capture')[0].body);
  const cacheRequest = JSON.parse(sent('pageMappings.cacheState')[0].body);

  messages = [...messages,
    response('pageMappings.captureResponse', {
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
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cacheRequest.requestId,
      bindingEpoch: cacheRequest.bindingEpoch,
      message: 'Live comparison unavailable in this test.',
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
    ...readyStorage(),
    snapshots: [{
      scanId: 'scan-a', pageKey: 'page-a', pageUrl: 'https://a.example/',
      capturedAt: '2026-08-07T10:00:00Z', elementCount: 1,
      manifestSha256: 'a'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(1));
  const captureA = JSON.parse(sent('pageMappings.capture')[0].body);
  const cacheA = JSON.parse(sent('pageMappings.cacheState')[0].body);
  messages = [...messages,
    response('pageMappings.captureResponse', {
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
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cacheA.requestId,
      bindingEpoch: cacheA.bindingEpoch,
      message: 'Live comparison unavailable in this test.',
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
    ...readyStorage(),
    snapshots: [{
      scanId: 'scan-b', pageKey: 'page-b', pageUrl: 'https://b.example/',
      capturedAt: '2026-08-07T11:00:00Z', elementCount: 1,
      manifestSha256: 'b'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(2));
  const captureB = JSON.parse(sent('pageMappings.capture')[1].body);
  const cacheB = JSON.parse(sent('pageMappings.cacheState')[1].body);
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
        scannedElementId: 22, elementHash: 'hash-b',
        lastScannedAt: '2026-08-07T11:00:00Z', scanCount: 2,
        clientNamed: 'Owner B element', typeElement: 'INPUT', tagName: 'input', xPath: '//b',
      }],
      rectangles: [],
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cacheB.requestId,
      bindingEpoch: cacheB.bindingEpoch,
      message: 'Live comparison unavailable in this test.',
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
    ...readyStorage(),
    snapshots: [{
      scanId: 'scan-a2', pageKey: 'page-a', pageUrl: 'https://a.example/',
      capturedAt: '2026-08-07T12:00:00Z', elementCount: 1,
      manifestSha256: 'c'.repeat(64), status: 'READY', pinned: false,
    }],
  })];
  view.rerender(<PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(3));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(3));
  const captureA2 = JSON.parse(sent('pageMappings.capture')[2].body);
  const cacheA2 = JSON.parse(sent('pageMappings.cacheState')[2].body);
  messages = [...messages,
    response('pageMappings.captureResponse', {
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
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cacheA2.requestId,
      bindingEpoch: cacheA2.bindingEpoch,
      message: 'Live comparison unavailable in this test.',
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
  await waitFor(() => expect(sent('memoryList.sync')).toHaveLength(3));

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

test('requires confirmation and sends the authoritative expected policy when purging', async () => {
  const view = render(page());
  await hydrateReadyRetention(view, {
    retentionDays: 21,
    maxUnpinnedPerPage: 6,
    eligibleCount: 2,
  });
  const confirm = jest.spyOn(window, 'confirm')
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);

  fireEvent.click(screen.getByRole('button', { name: 'Purge Eligible' }));

  expect(confirm).toHaveBeenLastCalledWith(
    'Permanently purge 2 eligible unpinned captures for this Bot Job?',
  );
  expect(sent('pageMappings.retentionPurge')).toHaveLength(0);
  expect(screen.getByRole('status')).toHaveTextContent('Snapshot purge cancelled.');

  fireEvent.click(screen.getByRole('button', { name: 'Purge Eligible' }));

  await waitFor(() => expect(sent('pageMappings.retentionPurge')).toHaveLength(1));
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(latestSentBody('pageMappings.retentionPurge')).toEqual({
    requestId: expect.any(String),
    bindingEpoch: 'binding-retention',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    expectedRetentionDays: 21,
    expectedMaxUnpinnedPerPage: 6,
  });
  expect(screen.getByRole('button', { name: 'Purging...' })).toBeDisabled();
});

test('requires reload after a correlated retention failure reports an unknown outcome', async () => {
  const view = render(page());
  await hydrateReadyRetention(view);
  fireEvent.change(screen.getByLabelText('Retain days'), { target: { value: '15' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(sent('pageMappings.retentionUpdate')).toHaveLength(1));
  const update = latestSentBody('pageMappings.retentionUpdate');

  appendResponse(view, 'pageMappings.retentionUpdateResponse', {
    ok: false,
    requestId: update.requestId,
    reloadRequired: true,
    error: 'Retention outcome is unknown.',
  });

  expect(await screen.findByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  expect(screen.getByRole('status')).toHaveTextContent('Retention outcome is unknown.');
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Purge Eligible' })).not.toBeInTheDocument();

  appendResponse(view, 'pageMappings.retentionUpdateResponse', {
    ...update,
    ok: true,
    retention: retentionState({ retentionDays: 15 }),
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Snapshot retention reload required');
});

test('requires reload after a correlated retention success contains malformed state', async () => {
  const view = render(page());
  await hydrateReadyRetention(view);
  fireEvent.change(screen.getByLabelText('Retain days'), { target: { value: '15' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(sent('pageMappings.retentionUpdate')).toHaveLength(1));
  const update = latestSentBody('pageMappings.retentionUpdate');

  appendResponse(view, 'pageMappings.retentionUpdateResponse', {
    ...update,
    ok: true,
    retention: retentionState({ retentionDays: 15, eligibleCount: -1 }),
  });

  expect(await screen.findByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  expect(screen.getByRole('status')).toHaveTextContent(
    'The snapshot retention response was invalid. Reload Page Mappings.',
  );
});

test('requires reload when a purge response returns a different retention policy', async () => {
  const view = render(page());
  await hydrateReadyRetention(view, { retentionDays: 21, maxUnpinnedPerPage: 6 });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Purge Eligible' }));
  await waitFor(() => expect(sent('pageMappings.retentionPurge')).toHaveLength(1));
  const purge = latestSentBody('pageMappings.retentionPurge');

  appendResponse(view, 'pageMappings.retentionPurgeResponse', {
    ...purge,
    ok: true,
    retention: retentionState({ retentionDays: 22, maxUnpinnedPerPage: 6 }),
    purgedScanIds: [],
  });

  expect(await screen.findByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  expect(screen.getByRole('status')).toHaveTextContent(
    'The purge policy changed while the request was running. Reload Page Mappings.',
  );
});

test('keeps the reload latch after a retention timeout until its correlated bootstrap completes', async () => {
  const view = render(page());
  await hydrateReadyRetention(view);
  fireEvent.change(screen.getByLabelText('Retain days'), { target: { value: '15' } });
  jest.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(sent('pageMappings.retentionUpdate')).toHaveLength(1);

  act(() => { jest.advanceTimersByTime(30_000); });
  jest.useRealTimers();

  expect(await screen.findByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  expect(screen.getByRole('status')).toHaveTextContent(
    'The retention response timed out. Reload Page Mappings before retrying because the outcome is unknown.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  const reload = latestSentBody('pageMappings.bootstrap');

  appendResponse(view, 'pageMappings.bootstrapResponse', {
    ok: true,
    requestId: 'mismatched-bootstrap-request',
    bindingEpoch: 'binding-retention',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    ...readyStorage(),
    snapshots: [],
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Snapshot retention reload required');

  appendResponse(view, 'pageMappings.bootstrapResponse', {
    ok: true,
    requestId: reload.requestId,
    bindingEpoch: 'binding-retention',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    ...readyStorage(),
    snapshots: [],
  });
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(screen.getByText('SYSTEM-WIDE SNAPSHOT RETENTION')).toBeInTheDocument();
});

test('keeps the reload latch across reconnect after disconnecting during retention', async () => {
  const view = render(page());
  await hydrateReadyRetention(view);
  fireEvent.change(screen.getByLabelText('Retain days'), { target: { value: '15' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(sent('pageMappings.retentionUpdate')).toHaveLength(1));

  connected = false;
  view.rerender(page());

  expect(await screen.findByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Connection lost during snapshot retention. Reconnect and reload before another retention action.',
  );

  connected = true;
  view.rerender(page());
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  expect(screen.getByRole('alert')).toHaveTextContent('Snapshot retention reload required');
  const reconnect = latestSentBody('pageMappings.bootstrap');

  appendResponse(view, 'pageMappings.bootstrapResponse', {
    ok: true,
    requestId: reconnect.requestId,
    bindingEpoch: 'binding-retention',
    workspaceEpoch: 7,
    homeBankingId: 2,
    botJobId: 32,
    ...readyStorage(),
    snapshots: [],
  });

  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(screen.getByText('SYSTEM-WIDE SNAPSHOT RETENTION')).toBeInTheDocument();
});
