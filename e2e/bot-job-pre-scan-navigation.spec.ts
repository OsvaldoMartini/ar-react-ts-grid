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
