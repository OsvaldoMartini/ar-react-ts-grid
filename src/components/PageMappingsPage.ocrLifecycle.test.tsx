import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import PageMappingsPage from './PageMappingsPage';
import type { PageMappingsOcrAliasChange } from './page-mappings/PageMappingsOcrReview.types';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));
jest.mock('./PagesOpenButton', () => () => null);
jest.mock('./DetachedPageShell', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('./page-mappings/PageMappingsCachePanel', () => () => null);
jest.mock('./page-mappings/PageMappingsRetentionPanel', () => () => null);
jest.mock('./page-mappings/PageMappingsOcrReviewPanel', () => ({
  busy,
  applying,
  message,
  canRun,
  onRun,
  onApply,
}: {
  busy: boolean;
  applying: boolean;
  message: string;
  canRun: boolean;
  onRun: () => void;
  onApply: (changes: PageMappingsOcrAliasChange[]) => void;
}) => <section aria-label="OCR lifecycle probe">
  <div data-testid="ocr-lifecycle-message">{message}</div>
  <button type="button" disabled={!canRun || busy || applying} onClick={onRun}>Run OCR lifecycle</button>
  <button
    type="button"
    disabled={!canRun || busy || applying}
    onClick={() => onApply([{
      scannedElementId: 41,
      elementHash: 'a'.repeat(64),
      expectedLastScannedAt: '2026-08-07T12:00:00Z',
      expectedScanCount: 1,
      expectedClientNamed: null,
      clientNamed: 'OCR Alias',
    }])}
  >Apply OCR lifecycle</button>
</section>);

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const outbound: string[] = [];
let activeSocket: WebSocket | null;
let connected = true;
let messages: string[] = [];

const OWNER_A = {
  bindingEpoch: 'binding-a',
  workspaceEpoch: 7,
  homeBankingId: 2,
  botJobId: 32,
  botJobName: 'OCR A',
  scanId: 'scan-a',
  pageKey: 'page-a',
  capturedAt: '2026-08-07T12:00:00Z',
  manifestSha256: 'b'.repeat(64),
};

const OWNER_B = {
  bindingEpoch: 'binding-b',
  workspaceEpoch: 8,
  homeBankingId: 3,
  botJobId: 44,
  botJobName: 'OCR B',
  scanId: 'scan-b',
  pageKey: 'page-b',
  capturedAt: '2026-08-08T12:00:00Z',
  manifestSha256: 'c'.repeat(64),
};

type Owner = typeof OWNER_A;

const makeSocket = (): WebSocket => ({
  readyState: WebSocket.OPEN,
  send: jest.fn((value: string) => outbound.push(String(value))),
} as unknown as WebSocket);

const page = () => <PageMappingsPage socketPort={5000} sessionId="pageMappingsManager" />;

const response = (operationId: string, body: Record<string, unknown>) => JSON.stringify({
  operationId,
  sessionId: 'pageMappingsManager',
  body: JSON.stringify(body),
});

const sent = (operation: string) => outbound
  .map(value => JSON.parse(value) as { type: string; body: string })
  .filter(envelope => envelope.type === operation);

const latestBody = (operation: string): Record<string, unknown> => {
  const envelopes = sent(operation);
  return JSON.parse(envelopes[envelopes.length - 1].body) as Record<string, unknown>;
};

const appendResponse = (
  view: ReturnType<typeof render>,
  operationId: string,
  body: Record<string, unknown>,
) => {
  messages = [...messages, response(operationId, body)];
  view.rerender(page());
};

const appendReadyBootstrap = (
  view: ReturnType<typeof render>,
  request: Record<string, unknown>,
  owner: Owner,
) => appendResponse(view, 'pageMappings.bootstrapResponse', {
  ok: true,
  requestId: request.requestId,
  bindingEpoch: owner.bindingEpoch,
  workspaceEpoch: owner.workspaceEpoch,
  homeBankingId: owner.homeBankingId,
  botJobId: owner.botJobId,
  botJobName: owner.botJobName,
  storageReady: true,
  retention: {
    retentionDays: 14,
    maxUnpinnedPerPage: 4,
    enabled: true,
    readyCount: 1,
    pinnedCount: 0,
    eligibleCount: 0,
  },
  snapshots: [{
    scanId: owner.scanId,
    pageKey: owner.pageKey,
    pageUrl: `https://${owner.pageKey}.example/`,
    capturedAt: owner.capturedAt,
    elementCount: 1,
    manifestSha256: owner.manifestSha256,
    status: 'READY',
    pinned: false,
  }],
});

const appendCaptureAndCache = (
  view: ReturnType<typeof render>,
  owner: Owner,
  valid = true,
) => {
  const capture = latestBody('pageMappings.capture');
  const cache = latestBody('pageMappings.cacheState');
  messages = [
    ...messages,
    response('pageMappings.captureResponse', {
      ok: true,
      requestId: capture.requestId,
      bindingEpoch: owner.bindingEpoch,
      scanId: owner.scanId,
      pageKey: owner.pageKey,
      capturedAt: owner.capturedAt,
      ...(valid ? { manifestSha256: owner.manifestSha256 } : {}),
      elements: [{
        scannedElementId: 41,
        elementHash: 'a'.repeat(64),
        lastScannedAt: '2026-08-07T12:00:00Z',
        scanCount: 1,
        clientNamed: null,
        tagName: 'input',
      }],
      rectangles: [],
      screenshotBase64: 'aW1tdXRhYmxlLWNhcHR1cmU=',
      screenshotMime: 'image/png',
    }),
    response('pageMappings.cacheStateResponse', {
      ok: false,
      requestId: cache.requestId,
      bindingEpoch: owner.bindingEpoch,
      message: 'Live comparison is outside this lifecycle test.',
    }),
  ];
  view.rerender(page());
};

const hydrateCapture = async (view: ReturnType<typeof render>, owner: Owner = OWNER_A) => {
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(1));
  appendReadyBootstrap(view, latestBody('pageMappings.bootstrap'), owner);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(1));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(1));
  appendCaptureAndCache(view, owner);
  fireEvent.click(await screen.findByRole('button', { name: 'OCR Review' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeEnabled());
};

beforeEach(() => {
  outbound.length = 0;
  messages = [];
  connected = true;
  activeSocket = makeSocket();
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/?openWorkspace=pageMappings&sourceBotJobId=32');
  mockedUseWebSocket.mockImplementation(() => ({
    webSocket: activeSocket,
    connected,
    reconnectAttempts: 0,
    messages,
    error: null,
  }));
});

afterEach(() => {
  jest.useRealTimers();
});

test('retires a read-only OCR Review on disconnect without replaying it', async () => {
  const view = render(page());
  await hydrateCapture(view);
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR lifecycle' }));
  expect(sent('pageMappings.ocrReview')).toHaveLength(1);

  connected = false;
  activeSocket = null;
  view.rerender(page());
  connected = true;
  activeSocket = makeSocket();
  view.rerender(page());

  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  expect(sent('pageMappings.ocrReview')).toHaveLength(1);
});

test('preserves and resends the exact OCR Apply request before reconnect bootstrap', async () => {
  const view = render(page());
  await hydrateCapture(view);
  fireEvent.click(screen.getByRole('button', { name: 'Apply OCR lifecycle' }));
  expect(sent('pageMappings.ocrReviewApply')).toHaveLength(1);
  const firstBody = sent('pageMappings.ocrReviewApply')[0].body;

  connected = false;
  activeSocket = null;
  view.rerender(page());
  expect(screen.getByTestId('ocr-lifecycle-message')).toHaveTextContent('exact request');

  connected = true;
  activeSocket = makeSocket();
  view.rerender(page());

  await waitFor(() => expect(sent('pageMappings.ocrReviewApply')).toHaveLength(2));
  expect(sent('pageMappings.ocrReviewApply')[1].body).toBe(firstBody);
  expect(sent('pageMappings.bootstrap')).toHaveLength(1);

  const apply = JSON.parse(firstBody) as Record<string, unknown>;
  appendResponse(view, 'pageMappings.ocrReviewApplyResponse', {
    ...apply,
    ok: true,
    changedCount: 1,
    aliases: [{
      scannedElementId: 41,
      elementHash: 'a'.repeat(64),
      lastScannedAt: '2026-08-07T12:00:00Z',
      scanCount: 1,
      clientNamed: 'OCR Alias',
      changed: true,
    }],
    message: 'One Page Mapping name was saved.',
  });

  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
});

test('keeps the Apply gate through timeout, mismatched bootstrap, and invalid capture', async () => {
  const view = render(page());
  await hydrateCapture(view);
  jest.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Apply OCR lifecycle' }));
  act(() => { jest.advanceTimersByTime(120_000); });
  jest.useRealTimers();

  expect(screen.getByTestId('ocr-lifecycle-message')).toHaveTextContent('commit outcome is unknown');
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  const reload = latestBody('pageMappings.bootstrap');
  appendReadyBootstrap(view, { requestId: 'unrelated-bootstrap' }, OWNER_A);
  expect(sent('pageMappings.capture')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();

  appendReadyBootstrap(view, reload, OWNER_A);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(2));
  appendCaptureAndCache(view, OWNER_A, false);
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(3));
  appendReadyBootstrap(view, latestBody('pageMappings.bootstrap'), OWNER_A);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(3));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(3));
  appendCaptureAndCache(view, OWNER_A);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeEnabled());
});

test('latches malformed Apply success until the retargeted owner reloads its capture', async () => {
  const view = render(page());
  await hydrateCapture(view);
  fireEvent.click(screen.getByRole('button', { name: 'Apply OCR lifecycle' }));
  const malformed = latestBody('pageMappings.ocrReviewApply');
  appendResponse(view, 'pageMappings.ocrReviewApplyResponse', {
    ...malformed,
    ok: true,
    changedCount: 0,
    aliases: [],
  });

  expect(screen.getByTestId('ocr-lifecycle-message')).toHaveTextContent('invalid or stale save response');
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();

  appendResponse(view, 'pageMappings.retarget', {
    bindingEpoch: OWNER_B.bindingEpoch,
    workspaceEpoch: OWNER_B.workspaceEpoch,
    homeBankingId: OWNER_B.homeBankingId,
    botJobId: OWNER_B.botJobId,
    botJobName: OWNER_B.botJobName,
  });
  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  appendReadyBootstrap(view, latestBody('pageMappings.bootstrap'), OWNER_B);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(2));
  fireEvent.click(await screen.findByRole('button', { name: 'OCR Review' }));
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();
  appendCaptureAndCache(view, OWNER_B);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeEnabled());
  expect(sent('pageMappings.ocrReviewApply')).toHaveLength(1);
});

test('retires a pending Apply on owner retarget without replaying it for the new owner', async () => {
  const view = render(page());
  await hydrateCapture(view);
  fireEvent.click(screen.getByRole('button', { name: 'Apply OCR lifecycle' }));
  expect(sent('pageMappings.ocrReviewApply')).toHaveLength(1);

  appendResponse(view, 'pageMappings.retarget', {
    bindingEpoch: OWNER_B.bindingEpoch,
    workspaceEpoch: OWNER_B.workspaceEpoch,
    homeBankingId: OWNER_B.homeBankingId,
    botJobId: OWNER_B.botJobId,
    botJobName: OWNER_B.botJobName,
  });

  await waitFor(() => expect(sent('pageMappings.bootstrap')).toHaveLength(2));
  appendReadyBootstrap(view, latestBody('pageMappings.bootstrap'), OWNER_B);
  await waitFor(() => expect(sent('pageMappings.capture')).toHaveLength(2));
  await waitFor(() => expect(sent('pageMappings.cacheState')).toHaveLength(2));
  fireEvent.click(await screen.findByRole('button', { name: 'OCR Review' }));
  expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeDisabled();

  appendCaptureAndCache(view, OWNER_B);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR lifecycle' })).toBeEnabled());
  expect(sent('pageMappings.ocrReviewApply')).toHaveLength(1);
});
