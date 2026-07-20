import { expect, test, type Page } from '@playwright/test';

type RecordedRequest = Record<string, unknown> & { type?: string };

const BOT_JOB_WINDOW_SESSION = 'bot-job-window-123e4567-e89b-42d3-a456-426614174000';
const PAGE_SCANNER_SESSION = 'page-scanner-223e4567-e89b-42d3-a456-426614174000';
const NEXT_PAGE_SCANNER_SESSION = 'page-scanner-323e4567-e89b-42d3-a456-426614174000';
const OCR_CONFIG_SESSION = 'ocr-config-config-window-1';
const NEXT_OCR_CONFIG_SESSION = 'ocr-config-config-window-2';
const OCR_RESULTS_SESSION = 'ocr-results-results-window-1';
const NEXT_OCR_RESULTS_SESSION = 'ocr-results-results-window-2';

const installMockBackend = async (page: Page) => {
  await page.addInitScript(() => {
    const botJobState = {
      revision: 7,
      metadataRevision: 3,
      botJobId: 42,
      name: 'Payments',
      description: 'Payment flow',
      projectType: 'Web App',
      active: true,
      homeBankingId: 5,
      organizationName: 'AllinWeb QA',
      homeUrlId: 8,
      environmentName: 'TEST',
      environmentUrl: 'https://client.example',
      navigationTimeSeconds: 2,
      transferPathConfigured: true,
      environments: [{
        id: 8,
        name: 'TEST',
        url: 'https://client.example',
        homeBankingId: 5,
        organizationName: 'AllinWeb QA',
      }],
      blocks: [{
        id: 11,
        order: 1,
        name: 'Login',
        description: '',
        typeId: 1,
        active: true,
        waitSeconds: 0,
      }],
      capabilities: {
        canUseWorkspaceActions: true,
        canEditMetadata: true,
        canUsePreScan: true,
        canShowComponents: true,
        canExecute: true,
        canLaunch: true,
        canUseFileActions: true,
        canOpenOrganizations: true,
      },
      executionState: 'IDLE',
      activeSurface: 'botJob',
      componentsVisible: false,
    };
    const testState = {
      requests: [] as RecordedRequest[],
      openCalls: [] as string[],
      closeCalls: 0,
      socketSessions: [] as string[],
    };
    const sockets: MockWebSocket[] = [];

    Object.defineProperty(window, '__AR_BOT_JOB_E2E__', {
      configurable: true,
      value: testState,
    });
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: (url?: string | URL) => {
        testState.openCalls.push(String(url ?? ''));
        return null;
      },
    });
    Object.defineProperty(window, 'close', {
      configurable: true,
      value: () => {
        testState.closeCalls += 1;
      },
    });

    class MockWebSocket extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      readonly url: string;
      readonly sessionId: string;
      readyState = MockWebSocket.CONNECTING;
      bufferedAmount = 0;
      extensions = '';
      protocol = '';
      binaryType: BinaryType = 'blob';
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;

      constructor(url: string | URL) {
        super();
        this.url = String(url);
        this.sessionId = new URL(this.url).searchParams.get('sessionId') ?? '';
        testState.socketSessions.push(this.sessionId);
        sockets.push(this);
        queueMicrotask(() => {
          if (this.readyState !== MockWebSocket.CONNECTING) return;
          this.readyState = MockWebSocket.OPEN;
          const event = new Event('open');
          this.onopen?.(event);
          this.dispatchEvent(event);
        });
      }

      send(payload: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (typeof payload !== 'string' || payload.startsWith('ping-')) return;

        let request: RecordedRequest;
        try {
          request = JSON.parse(payload) as RecordedRequest;
        } catch {
          return;
        }
        if (!request.type) return;
        testState.requests.push(request);

        if (request.type === 'botJobDetails.bootstrap') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          const requestedBotJobId = Number(body.botJobId || 42);
          this.reply('botJobDetails.bootstrapResponse', {
            ok: true,
            message: 'Bot Job Details loaded',
            requestId: body.requestId,
            botJobId: requestedBotJobId,
            state: {
              ...botJobState,
              botJobId: requestedBotJobId,
              name: requestedBotJobId === 42 ? 'Payments' : `Bot Job ${requestedBotJobId}`,
              activeSurface: 'botJob',
            },
          });
          return;
        }

        if (request.type === 'pageScannerWorkspace.open') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          if (body.action === 'SHOW_PRE_SCAN') {
            this.reply('pageScannerWorkspace.openResponse', {
              ok: true,
              message: 'Page Scanner opened in its reusable window',
              requestId: body.requestId,
              botJobId: Number(body.botJobId || 42),
              action: 'SHOW_PRE_SCAN',
              sessionId: 'page-scanner-launched-by-java',
            });
          }
          return;
        }

        if (request.type === 'pageScannerWorkspace.bootstrap') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          const targetBotJobId = this.sessionId.includes('323e4567') ? 84 : 42;
          this.reply('pageScannerWorkspace.bootstrapResponse', {
            ok: true,
            requestId: body.requestId,
            sessionId: this.sessionId,
            homeBankingId: 5,
            botJobId: targetBotJobId,
            botJobName: targetBotJobId === 42 ? 'Payments' : 'Bot Job 84',
            blocks: [{ id: 11, name: 'Login' }],
          });
          return;
        }

        if (request.type === 'pageScanner.scan') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          this.reply('pageScanner.scanResponse', {
            ok: true,
            requestId: body.requestId,
            message: 'Page Scanner operation accepted.',
          });
          this.reply('pageScanner.status', {
            status: 'done',
            message: 'Found 2 web element(s).',
            elementCount: 2,
          });
          return;
        }

        if (request.type === 'ocrWorkspace.open') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          this.reply('ocrWorkspace.openResponse', {
            ok: true,
            requestId: body.requestId,
            kind: body.kind,
            sessionId: `ocr-${body.kind}-launched-by-java`,
            message: 'OCR workspace opened.',
          });
          return;
        }

        if (request.type === 'ocrWorkspace.bootstrap') {
          const results = this.sessionId.startsWith('ocr-results-');
          const nextBinding = this.sessionId.endsWith('-2');
          this.reply('ocrWorkspace.bootstrapResponse', {
            ok: true,
            kind: results ? 'results' : 'config',
            sessionId: this.sessionId,
            homeBankingId: 5,
            botJobId: nextBinding ? 84 : 42,
            homeUrlId: 8,
            parameters: results ? [{
              category: 'engine',
              name: 'psm_mode',
              valueType: 'integer',
              value: '6',
            }] : [],
          });
          return;
        }

        if (request.type === 'ocrConfig.bootstrap') {
          this.reply('ocrConfig.bootstrapResponse', {
            ok: true,
            profiles: [{
              id: 7,
              name: 'Client OCR',
              description: 'Client page recognition',
              default: false,
            }],
            profile: { id: 7 },
            categories: ['engine'],
            parameters: [{
              category: 'engine',
              name: 'psm_mode',
              valueType: 'integer',
              value: '6',
              options: ['3', '6'],
            }],
          });
          return;
        }

        if (request.type === 'ocrTest.run') {
          this.reply('ocrTest.runResponse', {
            ok: true,
            source: 'elementDTO-PS.json',
            wordCount: 4,
            counts: { EXACT_CONTAIN: 1, OVERLAP: 0, PROXIMITY: 0, NONE: 1 },
            rows: [{
              definedName: 'login',
              quality: 'EXACT_CONTAIN',
              tag: 'button',
              domText: 'Log in',
              ocrText: 'Login now',
              xPath: '/html/body/button',
            }],
          });
          return;
        }

        if (request.type === 'ocrWorkspace.applySuggestions') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          this.reply('ocrWorkspace.applySuggestionsResponse', {
            ok: true,
            published: true,
            suggestionCount: Array.isArray(body.suggestions) ? body.suggestions.length : 0,
            message: 'OCR suggestions sent to the scanner workspace.',
          });
        }
      }

      close(code = 1000, reason = '') {
        if (this.readyState === MockWebSocket.CLOSED) return;
        this.readyState = MockWebSocket.CLOSED;
        const event = new CloseEvent('close', { code, reason, wasClean: true });
        this.onclose?.(event);
        this.dispatchEvent(event);
      }

      private reply(operationId: string, body: unknown) {
        queueMicrotask(() => {
          if (this.readyState !== MockWebSocket.OPEN) return;
          const event = new MessageEvent('message', {
            data: JSON.stringify({
              sessionId: this.sessionId,
              homeBankingId: 5,
              operationId,
              body: JSON.stringify(body),
            }),
          });
          this.onmessage?.(event);
          this.dispatchEvent(event);
        });
      }

      serverMessage(operationId: string, body: unknown) {
        this.reply(operationId, body);
      }
    }

    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      value: MockWebSocket,
    });
    Object.defineProperty(window, '__AR_E2E_SERVER_MESSAGE__', {
      configurable: true,
      value: (targetSessionId: string, operationId: string, body: unknown) => {
        sockets
          .filter(socket => socket.sessionId === targetSessionId && socket.readyState === MockWebSocket.OPEN)
          .forEach(socket => socket.serverMessage(operationId, body));
      },
    });
  });
};

const recordedRequests = (page: Page, type: string) => page.evaluate((requestType) => {
  const state = (window as typeof window & {
    __AR_BOT_JOB_E2E__: { requests: RecordedRequest[] };
  }).__AR_BOT_JOB_E2E__;
  return state.requests.filter(request => request.type === requestType);
}, type);

const sendServerMessage = (
  page: Page,
  sessionId: string,
  operationId: string,
  body: Record<string, unknown>,
) => page.evaluate(({ targetSessionId, targetOperationId, targetBody }) => {
  const send = (window as typeof window & {
    __AR_E2E_SERVER_MESSAGE__: (
      sessionId: string,
      operationId: string,
      body: Record<string, unknown>,
    ) => void;
  }).__AR_E2E_SERVER_MESSAGE__;
  send(targetSessionId, targetOperationId, targetBody);
}, {
  targetSessionId: sessionId,
  targetOperationId: operationId,
  targetBody: body,
});

const dragBy = async (page: Page, handle: ReturnType<Page['locator']>, deltaX: number, deltaY: number) => {
  const bounds = await handle.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + Math.min(24, bounds!.width / 2);
  const startY = bounds!.y + bounds!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 });
  await page.mouse.up();
};

test('uses the shared draggable non-modal Bot Job frame outside desktop-shell mode', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installMockBackend(page);
  await page.goto(`/?openBotJob=42&botJobWindowSession=${BOT_JOB_WINDOW_SESSION}`);

  const botJobWorkspace = page.getByTestId('bot-job-details-workspace');
  await expect(botJobWorkspace).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pre Scan' })).toBeEnabled();
  expect(await botJobWorkspace.getAttribute('aria-modal')).toBeNull();
  expect(await botJobWorkspace.evaluate(element => getComputedStyle(element).position)).toBe('fixed');

  const before = await botJobWorkspace.boundingBox();
  expect(before).not.toBeNull();
  expect(before!.x).toBeCloseTo(100, 0);
  expect(before!.y).toBeCloseTo(90, 0);
  expect(before!.width).toBeCloseTo(1240, 0);
  expect(before!.height).toBeCloseTo(820, 0);

  await dragBy(page, page.getByText('Bot Job Details', { exact: true }).first(), 72, 44);
  const after = await botJobWorkspace.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).toBeGreaterThan(before!.x + 20);
  expect(after!.y).toBeGreaterThan(before!.y + 20);

  const socketSessions = await page.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { socketSessions: string[] } }
  ).__AR_BOT_JOB_E2E__.socketSessions);
  expect(socketSessions).toContain(BOT_JOB_WINDOW_SESSION);
  expect(socketSessions).not.toContain('mainDashboardBootstrap');
});

test('keeps Bot Job mounted while one detached Page Scanner retargets in place', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(`bot-job: ${error.message}`));
  await page.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(page);
  await page.goto(`/?desktopShell=1&openBotJob=42&botJobWindowSession=${BOT_JOB_WINDOW_SESSION}`);

  const botJobWorkspace = page.getByTestId('bot-job-details-workspace');
  await expect(botJobWorkspace).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pre Scan' })).toBeEnabled();
  const botJobBounds = await botJobWorkspace.boundingBox();
  expect(botJobBounds).not.toBeNull();
  expect(botJobBounds!.x).toBeCloseTo(0, 0);
  expect(botJobBounds!.y).toBeCloseTo(0, 0);
  expect(botJobBounds!.width).toBeCloseTo(1240, 0);
  expect(botJobBounds!.height).toBeCloseTo(820, 0);
  expect(await botJobWorkspace.evaluate(element => getComputedStyle(element).borderRadius)).toBe('0px');
  expect(await botJobWorkspace.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');

  const initialUrl = page.url();
  await page.getByRole('button', { name: 'Pre Scan' }).click();
  await expect.poll(async () => {
    const requests = await recordedRequests(page, 'pageScannerWorkspace.open');
    return requests.some((request) => {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
      return body.action === 'SHOW_PRE_SCAN' && typeof body.requestId === 'string';
    });
  }).toBe(true);

  await expect(botJobWorkspace).toBeVisible();
  await expect(page.getByTestId('pre-scan-workspace')).toHaveCount(0);
  await expect(page.getByTestId('detached-page-scanner-workspace')).toHaveCount(0);
  expect(page.url()).toBe(initialUrl);
  expect(await page.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { openCalls: string[] } }
  ).__AR_BOT_JOB_E2E__.openCalls)).toEqual([]);

  const scannerPage = await page.context().newPage();
  const scannerErrors: string[] = [];
  scannerPage.on('pageerror', error => scannerErrors.push(error.message));
  await scannerPage.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(scannerPage);
  await scannerPage.goto(
    `/?desktopShell=1&openPageScanner=preScan&pageScannerSession=${PAGE_SCANNER_SESSION}`,
  );

  const scannerWorkspace = scannerPage.getByTestId('detached-page-scanner-workspace');
  await expect(scannerWorkspace).toBeVisible();
  await expect(scannerPage.getByRole('region', { name: 'Page Scanner' })).toHaveCount(1);
  await expect(scannerPage.getByRole('button', { name: 'Page Scanner', exact: true })).toBeEnabled();
  await expect(scannerPage.getByRole('button', { name: 'OCR Config' })).toBeEnabled();
  await expect(scannerPage.getByRole('button', { name: 'OCR Results' })).toBeEnabled();
  await expect(scannerPage.getByRole('button', { name: 'Refresh Web Page' })).toBeEnabled();
  await expect(scannerPage.getByText('Search Hidden Fields', { exact: true })).toBeVisible();
  await expect(scannerPage.getByPlaceholder('button, label, input, data-testid')).toBeVisible();

  const scannerBounds = await scannerWorkspace.boundingBox();
  expect(scannerBounds).not.toBeNull();
  expect(scannerBounds!.x).toBeCloseTo(0, 0);
  expect(scannerBounds!.y).toBeCloseTo(0, 0);
  expect(scannerBounds!.width).toBeCloseTo(1240, 0);
  expect(scannerBounds!.height).toBeCloseTo(820, 0);
  expect(await scannerWorkspace.evaluate(element => getComputedStyle(element).borderRadius)).toBe('0px');
  expect(await scannerWorkspace.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');

  await scannerPage.getByRole('button', { name: 'Page Scanner', exact: true }).click();
  await expect.poll(async () => (await recordedRequests(scannerPage, 'pageScanner.scan')).length).toBe(1);
  const [scanRequest] = await recordedRequests(scannerPage, 'pageScanner.scan');
  expect(scanRequest).toMatchObject({
    type: 'pageScanner.scan',
    sessionId: PAGE_SCANNER_SESSION,
    botJobId: 42,
  });
  const scanBody = typeof scanRequest.body === 'string' ? JSON.parse(scanRequest.body) : {};
  expect(scanBody).toMatchObject({
    focusProfile: 'factory-default',
    searchTerms: '',
    searchHiddenFields: false,
  });
  expect(typeof scanBody.requestId).toBe('string');
  await expect(scannerPage.getByRole('status')).toHaveText('Found 2 web element(s).');
  await expect(scannerPage.getByText('done', { exact: true })).toBeVisible();

  const pageCountBeforeRetarget = page.context().pages().length;
  await sendServerMessage(scannerPage, PAGE_SCANNER_SESSION, 'pageScanner.workspaceRetarget', {
    previousSessionId: PAGE_SCANNER_SESSION,
    sessionId: NEXT_PAGE_SCANNER_SESSION,
    botJobId: 84,
    workspaceEpoch: 2,
  });
  await expect.poll(() => new URL(scannerPage.url()).searchParams.get('pageScannerSession'))
    .toBe(NEXT_PAGE_SCANNER_SESSION);
  await expect(scannerPage.getByTestId('detached-page-scanner-workspace')).toHaveCount(1);
  await expect(scannerPage.getByText('Bot Job ID 84', { exact: true })).toBeVisible();
  expect(page.context().pages().length).toBe(pageCountBeforeRetarget);
  expect(scannerPage.isClosed()).toBe(false);
  await expect(botJobWorkspace).toBeVisible();

  const scannerSessions = await scannerPage.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { socketSessions: string[] } }
  ).__AR_BOT_JOB_E2E__.socketSessions);
  expect(scannerSessions).toContain(PAGE_SCANNER_SESSION);
  expect(scannerSessions).toContain(NEXT_PAGE_SCANNER_SESSION);
  expect(scannerSessions).not.toContain('mainDashboardBootstrap');
  expect(pageErrors).toEqual([]);
  expect(scannerErrors).toEqual([]);
  await scannerPage.close();
});

test('keeps one independent OCR Config and one OCR Results window while both retarget in place', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(`bot-job: ${error.message}`));
  await page.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(page);
  await page.goto(`/?desktopShell=1&openBotJob=42&botJobWindowSession=${BOT_JOB_WINDOW_SESSION}`);

  await page.getByRole('button', { name: 'Pre Scan' }).click();
  await expect(page.getByTestId('bot-job-details-workspace')).toBeVisible();

  const scannerPage = await page.context().newPage();
  const scannerErrors: string[] = [];
  scannerPage.on('pageerror', error => scannerErrors.push(error.message));
  await scannerPage.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(scannerPage);
  await scannerPage.goto(
    `/?desktopShell=1&openPageScanner=preScan&pageScannerSession=${PAGE_SCANNER_SESSION}`,
  );
  await expect(scannerPage.getByTestId('detached-page-scanner-workspace')).toBeVisible();

  await scannerPage.getByRole('button', { name: 'OCR Config' }).click();
  await scannerPage.getByRole('button', { name: 'OCR Results' }).click();
  await expect.poll(async () => (await recordedRequests(scannerPage, 'ocrWorkspace.open')).length).toBe(2);
  const parentOpenRequests = await recordedRequests(scannerPage, 'ocrWorkspace.open');
  expect(parentOpenRequests.map(request => {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
    return body.kind;
  })).toEqual(['config', 'results']);
  await expect(scannerPage.getByTestId('ocr-config-workspace')).toHaveCount(0);
  await expect(scannerPage.getByTestId('ocr-results-workspace')).toHaveCount(0);

  const configPage = await page.context().newPage();
  const configErrors: string[] = [];
  configPage.on('pageerror', error => configErrors.push(error.message));
  await configPage.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(configPage);
  await configPage.goto(`/?desktopShell=1&openOcr=config&ocrSession=${OCR_CONFIG_SESSION}`);
  const configWindow = configPage.getByTestId('ocr-config-window');
  const configWorkspace = configPage.getByTestId('ocr-config-workspace');
  await expect(configWindow).toBeVisible();
  await expect(configWorkspace).toBeVisible();
  await expect(configPage.getByLabel('Profile')).toHaveValue('7');
  await expect(configPage.getByLabel('Profile')).toContainText('Client OCR');
  expect(await configWorkspace.evaluate(element => getComputedStyle(element).position)).toBe('static');
  expect(await configWorkspace.evaluate(element => getComputedStyle(element).fontFamily)).toContain('Arial');
  expect(await configPage.getByTestId('ocr-config-header').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(11, 83, 148)');
  expect(await configPage.locator('[data-floating-workspace-drag-handle]').count()).toBe(0);

  const resultsPage = await page.context().newPage();
  const resultsErrors: string[] = [];
  resultsPage.on('pageerror', error => resultsErrors.push(error.message));
  await resultsPage.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(resultsPage);
  await resultsPage.goto(`/?desktopShell=1&openOcr=results&ocrSession=${OCR_RESULTS_SESSION}`);
  const resultsWindow = resultsPage.getByTestId('ocr-results-window');
  const resultsWorkspace = resultsPage.getByTestId('ocr-results-workspace');
  await expect(resultsWindow).toBeVisible();
  await expect(resultsWorkspace).toBeVisible();
  await expect(resultsPage.getByText('Login now', { exact: true })).toBeVisible();
  expect(await resultsWorkspace.evaluate(element => getComputedStyle(element).position)).toBe('static');
  expect(await resultsPage.locator('[data-floating-workspace-drag-handle]').count()).toBe(0);

  for (const [workspacePage, testId] of [
    [configPage, 'ocr-config-window'],
    [resultsPage, 'ocr-results-window'],
  ] as const) {
    const bounds = await workspacePage.getByTestId(testId).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeCloseTo(0, 0);
    expect(bounds!.y).toBeCloseTo(0, 0);
    expect(bounds!.width).toBeCloseTo(1240, 0);
    expect(bounds!.height).toBeCloseTo(820, 0);
  }

  const pageCountBeforeRetarget = page.context().pages().length;
  await sendServerMessage(configPage, OCR_CONFIG_SESSION, 'ocrWorkspace.windowRetarget', {
    kind: 'config',
    previousSessionId: OCR_CONFIG_SESSION,
    sessionId: NEXT_OCR_CONFIG_SESSION,
    homeBankingId: 5,
    botJobId: 84,
    homeUrlId: 8,
  });
  await sendServerMessage(resultsPage, OCR_RESULTS_SESSION, 'ocrWorkspace.windowRetarget', {
    kind: 'results',
    previousSessionId: OCR_RESULTS_SESSION,
    sessionId: NEXT_OCR_RESULTS_SESSION,
    homeBankingId: 5,
    botJobId: 84,
    homeUrlId: 8,
  });
  await expect.poll(() => new URL(configPage.url()).searchParams.get('ocrSession'))
    .toBe(NEXT_OCR_CONFIG_SESSION);
  await expect.poll(() => new URL(resultsPage.url()).searchParams.get('ocrSession'))
    .toBe(NEXT_OCR_RESULTS_SESSION);
  await expect(configPage.getByTestId('ocr-config-window')).toHaveCount(1);
  await expect(resultsPage.getByTestId('ocr-results-window')).toHaveCount(1);
  await expect(configPage.getByLabel('Profile')).toHaveValue('7');
  await expect(resultsPage.getByText('Login now', { exact: true })).toBeVisible();
  expect(page.context().pages().length).toBe(pageCountBeforeRetarget);

  await configPage.getByRole('button', { name: 'Test current page' }).click();
  await expect.poll(async () => (await recordedRequests(configPage, 'ocrWorkspace.open')).length).toBe(1);
  const [configOpenResults] = await recordedRequests(configPage, 'ocrWorkspace.open');
  expect(typeof configOpenResults.body === 'string' ? JSON.parse(configOpenResults.body).kind : '').toBe('results');

  await resultsPage.getByLabel('Approve login').click();
  await resultsPage.getByRole('button', { name: /Accept OCR names/ }).click();
  await expect.poll(async () => resultsPage.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { closeCalls: number } }
  ).__AR_BOT_JOB_E2E__.closeCalls)).toBe(1);

  const configSessions = await configPage.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { socketSessions: string[] } }
  ).__AR_BOT_JOB_E2E__.socketSessions);
  const resultsSessions = await resultsPage.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { socketSessions: string[] } }
  ).__AR_BOT_JOB_E2E__.socketSessions);
  expect(configSessions).toContain(OCR_CONFIG_SESSION);
  expect(configSessions).toContain(NEXT_OCR_CONFIG_SESSION);
  expect(resultsSessions).toContain(OCR_RESULTS_SESSION);
  expect(resultsSessions).toContain(NEXT_OCR_RESULTS_SESSION);
  expect(configSessions).not.toContain('mainDashboardBootstrap');
  expect(resultsSessions).not.toContain('mainDashboardBootstrap');

  await configPage.close();
  expect(page.isClosed()).toBe(false);
  expect(scannerPage.isClosed()).toBe(false);
  expect(resultsPage.isClosed()).toBe(false);
  await expect(page.getByTestId('bot-job-details-workspace')).toBeVisible();
  await expect(scannerPage.getByTestId('detached-page-scanner-workspace')).toBeVisible();
  await expect(resultsWorkspace).toBeVisible();

  expect(await page.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { openCalls: string[] } }
  ).__AR_BOT_JOB_E2E__.openCalls)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(scannerErrors).toEqual([]);
  expect(configErrors).toEqual([]);
  expect(resultsErrors).toEqual([]);
  await resultsPage.close();
  await scannerPage.close();
});
