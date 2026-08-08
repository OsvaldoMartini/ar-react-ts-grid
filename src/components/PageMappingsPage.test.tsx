import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  window.history.replaceState({}, '', '/?openWorkspace=pageMappings&sourceBotJobId=10&homeBankingId=999');
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

  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  const bootstrapEnvelope = sent('pageMappings.bootstrap')[0];
  const bootstrapBody = JSON.parse(bootstrapEnvelope.body);
  expect(bootstrapBody).toEqual({ requestId: expect.any(String) });

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
  expect(memoryBody.snapshot.homeBankingId).toBe(2);
  expect(memoryBody.snapshot.botJobId).toBe(20);
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
