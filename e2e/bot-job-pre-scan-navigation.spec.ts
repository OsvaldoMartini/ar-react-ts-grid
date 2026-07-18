import { expect, test, type Page } from '@playwright/test';

type RecordedRequest = Record<string, unknown> & { type?: string };

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
          const surface = this.sessionId === 'preScannerGrid' ? 'preScan' : 'botJob';
          this.reply('botJobDetails.bootstrapResponse', {
            ok: true,
            message: 'Bot Job Details loaded',
            requestId: body.requestId,
            botJobId: 42,
            state: { ...botJobState, activeSurface: surface },
          });
          return;
        }

        if (request.type === 'botJobDetails.action') {
          const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
          if (body.action === 'SHOW_PRE_SCAN') {
            this.reply('botJobDetails.actionResponse', {
              ok: true,
              message: 'Pre Scan workspace opened',
              requestId: body.requestId,
              botJobId: 42,
              action: 'SHOW_PRE_SCAN',
              activeSurface: 'preScan',
              componentsVisible: false,
            });
          }
          return;
        }

        if (request.type === 'PRE_SCAN_PAGE') {
          this.reply('preScanStatus', {
            status: 'done',
            message: 'Found 2 web element(s).',
            elementCount: 2,
            botJobId: 42,
            botJobName: 'Payments',
            homeBankingId: 5,
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
          this.reply('ocrWorkspace.bootstrapResponse', {
            ok: true,
            kind: results ? 'results' : 'config',
            sessionId: this.sessionId,
            homeBankingId: 5,
            botJobId: 42,
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
    }

    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      value: MockWebSocket,
    });
  });
};

const recordedRequests = (page: Page, type: string) => page.evaluate((requestType) => {
  const state = (window as typeof window & {
    __AR_BOT_JOB_E2E__: { requests: RecordedRequest[] };
  }).__AR_BOT_JOB_E2E__;
  return state.requests.filter(request => request.type === requestType);
}, type);

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
  await page.goto('/?openBotJob=42');

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
});

test('keeps Bot Job and Page Scanner Grid in the full-client desktop shell', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(page);
  await page.goto('/?desktopShell=1&openBotJob=42');

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
    const requests = await recordedRequests(page, 'botJobDetails.action');
    return requests.some((request) => {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
      return body.action === 'SHOW_PRE_SCAN' && typeof body.requestId === 'string';
    });
  }).toBe(true);

  const scannerWorkspace = page.getByTestId('pre-scan-workspace');
  await expect(scannerWorkspace).toBeVisible();
  await expect(page.getByRole('region', { name: 'Page Scanner Grid' })).toHaveCount(1);
  await expect(page.getByTestId('bot-job-details-workspace')).toHaveCount(0);
  expect(page.url()).toBe(initialUrl);
  expect(await page.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { openCalls: string[] } }
  ).__AR_BOT_JOB_E2E__.openCalls)).toEqual([]);

  await page.getByRole('button', { name: 'Page Scanner', exact: true }).click();
  await expect.poll(async () => (await recordedRequests(page, 'PRE_SCAN_PAGE')).length).toBe(1);
  const [scanRequest] = await recordedRequests(page, 'PRE_SCAN_PAGE');
  expect(scanRequest).toMatchObject({
    type: 'PRE_SCAN_PAGE',
    sessionId: 'preScannerGrid',
    botJobId: 42,
    focusProfile: 'factory-default',
    searchTerms: '',
    searchHiddenFields: false,
  });
  await expect(page.getByText('Found 2 web element(s).', { exact: true })).toBeVisible();
  await expect(page.getByText('done', { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('keeps Bot Job, OCR Config, and OCR Results in three independent full-client windows', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(`scanner: ${error.message}`));
  await page.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(page);
  await page.goto('/?desktopShell=1&openBotJob=42');

  await page.getByRole('button', { name: 'Pre Scan' }).click();
  await expect(page.getByTestId('pre-scan-workspace')).toBeVisible();

  await page.getByRole('button', { name: 'OCR Config' }).click();
  await page.getByRole('button', { name: 'OCR Results' }).click();
  await expect.poll(async () => (await recordedRequests(page, 'ocrWorkspace.open')).length).toBe(2);
  const parentOpenRequests = await recordedRequests(page, 'ocrWorkspace.open');
  expect(parentOpenRequests.map(request => {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : {};
    return body.kind;
  })).toEqual(['config', 'results']);
  await expect(page.getByTestId('ocr-config-workspace')).toHaveCount(0);
  await expect(page.getByTestId('ocr-results-workspace')).toHaveCount(0);

  const configPage = await page.context().newPage();
  const configErrors: string[] = [];
  configPage.on('pageerror', error => configErrors.push(error.message));
  await configPage.setViewportSize({ width: 1240, height: 820 });
  await installMockBackend(configPage);
  await configPage.goto('/?desktopShell=1&openOcr=config&ocrSession=ocr-config-config-window-1');
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
  await resultsPage.goto('/?desktopShell=1&openOcr=results&ocrSession=ocr-results-results-window-1');
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
  expect(configSessions).toContain('ocr-config-config-window-1');
  expect(resultsSessions).toContain('ocr-results-results-window-1');
  expect(configSessions).not.toContain('mainDashboardBootstrap');
  expect(resultsSessions).not.toContain('mainDashboardBootstrap');

  await configPage.close();
  expect(page.isClosed()).toBe(false);
  expect(resultsPage.isClosed()).toBe(false);
  await expect(page.getByTestId('pre-scan-workspace')).toBeVisible();
  await expect(resultsWorkspace).toBeVisible();

  expect(await page.evaluate(() => (
    window as typeof window & { __AR_BOT_JOB_E2E__: { openCalls: string[] } }
  ).__AR_BOT_JOB_E2E__.openCalls)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(configErrors).toEqual([]);
  expect(resultsErrors).toEqual([]);
  await resultsPage.close();
});
