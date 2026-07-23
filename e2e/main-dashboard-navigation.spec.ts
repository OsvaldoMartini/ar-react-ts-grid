import { expect, test, type Locator, type Page } from '@playwright/test';
import automationCatalog from './fixtures/automation-catalog.json';

const botJobs = [
  {
    id: 101,
    name: 'Primary Checkout',
    description: 'Desktop checkout flow',
    priority: 'WEB',
    active: true,
    organizationName: 'AllinWeb QA',
    environmentName: 'QA',
    blockCount: 12,
    launchable: true,
  },
  {
    id: 202,
    name: 'Secondary Mobile',
    description: 'Mobile handoff flow',
    priority: 'MOBILE',
    active: false,
    organizationName: 'AllinWeb Lab',
    environmentName: 'STAGE',
    blockCount: 4,
    launchable: false,
  },
];

const installMockBackend = async (page: Page) => {
  await page.addInitScript(
    ({ catalog, jobs }) => {
      const state = {
        requests: [] as Array<{ type?: string; body?: string }>,
        openCalls: [] as string[],
        botJobs: jobs,
      };

      Object.defineProperty(window, '__AR_E2E__', {
        configurable: true,
        value: state,
      });
      Object.defineProperty(window, 'open', {
        configurable: true,
        value: (url?: string | URL) => {
          state.openCalls.push(String(url || ''));
          return null;
        },
      });

      class MockWebSocket extends EventTarget {
        static readonly CONNECTING = 0;
        static readonly OPEN = 1;
        static readonly CLOSING = 2;
        static readonly CLOSED = 3;

        readonly url: string;
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
          queueMicrotask(() => {
            if (this.readyState !== MockWebSocket.CONNECTING) return;
            this.readyState = MockWebSocket.OPEN;
            const openEvent = new Event('open');
            this.onopen?.(openEvent);
            this.dispatchEvent(openEvent);

            if (this.url.includes('sessionId=mainDashboardBootstrap')) {
              queueMicrotask(() => this.reply('react.session.open', {
                targetSession: 'mainDashboard',
                port: 4173,
                botJobId: -9999,
              }));
            }
          });
        }

        send(payload: string | ArrayBufferLike | Blob | ArrayBufferView) {
          if (typeof payload !== 'string' || payload.startsWith('ping-')) return;

          let request: { type?: string; body?: string };
          try {
            request = JSON.parse(payload);
          } catch {
            return;
          }
          if (!request.type) return;
          state.requests.push(request);

          if (request.type === 'mainDashboard.list') {
            this.reply('mainDashboard.listResponse', { botJobs: state.botJobs });
          } else if (request.type === 'license.bootstrap') {
            this.reply('license.bootstrapResponse', {
              active: true,
              status: 'ACTIVE',
              statusCode: 'ACTIVE',
              organization: 'AllinWeb QA',
              owner: 'QA License Owner',
              licensedUser: 'qa.user',
            });
          } else if (request.type === 'automationTests.list') {
            this.reply('automationTests.listResponse', catalog);
          } else if (request.type === 'mainDashboard.deleteBotJob') {
            const body = request.body ? JSON.parse(request.body) : {};
            state.botJobs = state.botJobs.filter(job => job.id !== body.botJobId);
            this.reply('mainDashboard.actionResponse', {
              ok: true,
              message: 'Bot Job deleted in mock mode',
              botJobs: state.botJobs,
            });
          } else if (request.type.startsWith('mainDashboard.')) {
            this.reply('mainDashboard.actionResponse', {
              ok: true,
              message: `Mocked ${request.type}`,
            });
          }
        }

        close(code = 1000, reason = '') {
          if (this.readyState === MockWebSocket.CLOSED) return;
          this.readyState = MockWebSocket.CLOSED;
          const closeEvent = new CloseEvent('close', { code, reason, wasClean: true });
          this.onclose?.(closeEvent);
          this.dispatchEvent(closeEvent);
        }

        private reply(operationId: string, body: unknown) {
          queueMicrotask(() => {
            if (this.readyState !== MockWebSocket.OPEN) return;
            const event = new MessageEvent('message', {
              data: JSON.stringify({ operationId, body }),
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
    },
    { catalog: automationCatalog, jobs: botJobs },
  );
};

const operationCount = (page: Page, type: string) =>
  page.evaluate((operation) => {
    const state = (window as typeof window & {
      __AR_E2E__: { requests: Array<{ type?: string }> };
    }).__AR_E2E__;
    return state.requests.filter(request => request.type === operation).length;
  }, type);

const dragBy = async (page: Page, handle: Locator, deltaX: number, deltaY: number) => {
  const bounds = await handle.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + Math.min(48, bounds!.width / 2);
  const startY = bounds!.y + bounds!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 });
  await page.mouse.up();
};

test('navigates every safe dashboard control and the Auto Test workspace without a backend', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installMockBackend(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'AR Web' })).toBeVisible();
  await expect(page.getByText('Loaded 2 bot jobs')).toBeVisible();
  await expect.poll(() => operationCount(page, 'mainDashboard.list')).toBeGreaterThan(0);
  await expect.poll(() => operationCount(page, 'license.bootstrap')).toBeGreaterThan(0);

  const dashboard = page.getByRole('region', { name: 'Main Dashboard' });
  await expect(dashboard).toBeVisible();
  await expect(dashboard).toHaveAttribute('data-testid', 'main-dashboard-workspace');
  expect(await dashboard.getAttribute('aria-modal')).toBeNull();
  expect(await dashboard.evaluate(element => window.getComputedStyle(element).position)).toBe('fixed');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  const dashboardBeforeDrag = await dashboard.boundingBox();
  expect(dashboardBeforeDrag).not.toBeNull();
  expect(dashboardBeforeDrag!.width).toBeCloseTo(1240, 0);
  expect(dashboardBeforeDrag!.height).toBeCloseTo(820, 0);
  await dragBy(page, dashboard.getByTestId('main-dashboard-drag-handle'), 72, 44);
  const dashboardAfterDrag = await dashboard.boundingBox();
  expect(dashboardAfterDrag).not.toBeNull();
  expect(dashboardAfterDrag!.x).toBeGreaterThan(dashboardBeforeDrag!.x + 20);
  expect(dashboardAfterDrag!.y).toBeGreaterThan(dashboardBeforeDrag!.y + 20);

  await expect(page.getByRole('button', { name: 'Clone Job' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Launch' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open Job' })).toBeDisabled();

  for (const command of ['Organizations', 'New Bot Job', 'Config', 'Info', 'Refresh', 'Exit']) {
    await page.getByRole('button', { name: command, exact: true }).click();
  }

  const botJobsGrid = page.getByTestId('main-dashboard-bot-jobs-grid');
  const findInput = botJobsGrid.getByRole('textbox', { name: 'Find:' });
  await expect(findInput).toHaveAttribute('id', 'main-dashboard-find');
  for (const [query, expectedRow, hiddenRow] of [
    ['Secondary', /Secondary Mobile/, /Primary Checkout/],
    ['Mobile handoff', /Secondary Mobile/, /Primary Checkout/],
    ['AllinWeb Lab', /Secondary Mobile/, /Primary Checkout/],
    ['STAGE', /Secondary Mobile/, /Primary Checkout/],
    ['MOBILE', /Secondary Mobile/, /Primary Checkout/],
    ['Inactive', /Secondary Mobile/, /Primary Checkout/],
    ['Active', /Primary Checkout/, /Secondary Mobile/],
  ] as const) {
    await findInput.fill(query);
    await expect(botJobsGrid.getByRole('row', { name: expectedRow })).toBeVisible();
    await expect(botJobsGrid.getByRole('row', { name: hiddenRow })).toHaveCount(0);
    await expect(botJobsGrid.getByTestId('main-dashboard-bot-jobs-grid-count')).toHaveText('1 / 2');
  }
  await page.getByTitle('Clear Find').click();
  await expect(botJobsGrid.getByRole('row', { name: /Primary Checkout/ })).toBeVisible();
  await expect(botJobsGrid.getByRole('row', { name: /Secondary Mobile/ })).toBeVisible();

  for (const column of ['ID', 'Name', 'Description', 'Organization', 'Environment', 'Type', 'Status', 'Blocks']) {
    await page.getByRole('columnheader', { name: new RegExp(`^${column}`) }).click();
  }

  const primaryRow = page.getByRole('row', { name: /Primary Checkout/ });
  await primaryRow.click();
  await expect(page.getByRole('button', { name: 'Clone Job' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Launch' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Open Job' })).toBeEnabled();
  await page.getByRole('button', { name: 'Clone Job' }).click();
  await page.getByRole('button', { name: 'Launch' }).click();
  await page.getByRole('button', { name: 'Open Job' }).click();

  await primaryRow.getByTitle('Delete Bot Job').click();
  await expect(page.getByText('Bot Job Deletion')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect.poll(() => operationCount(page, 'mainDashboard.deleteBotJob')).toBe(0);
  await primaryRow.getByTitle('Delete Bot Job').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('row', { name: /Primary Checkout/ })).toHaveCount(0);

  await page.getByRole('row', { name: /Secondary Mobile/ }).dblclick();
  const openedUrls = await page.evaluate(() => (
    window as typeof window & { __AR_E2E__: { openCalls: string[] } }
  ).__AR_E2E__.openCalls);
  expect(openedUrls).toEqual([]);

  const userMenuButton = page.getByRole('button', { name: 'Open user menu' });
  const suppliedUserIcon = userMenuButton.locator('svg').first();
  await expect(suppliedUserIcon).toHaveAttribute('width', '15');
  await expect(suppliedUserIcon).toHaveAttribute('height', '15');
  await expect(suppliedUserIcon).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(suppliedUserIcon).toHaveAttribute('fill', 'none');
  await expect(suppliedUserIcon).toHaveAttribute('stroke', 'currentColor');
  await expect(suppliedUserIcon).toHaveAttribute('stroke-width', '2');
  await expect(suppliedUserIcon.locator('path[d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"]')).toHaveCount(1);
  await expect(suppliedUserIcon.locator('circle[cx="12"][cy="7"][r="4"]')).toHaveCount(1);

  const dashboardBeforeMenu = await dashboard.boundingBox();
  await userMenuButton.click();
  const dashboardAfterMenu = await dashboard.boundingBox();
  expect(dashboardBeforeMenu).not.toBeNull();
  expect(dashboardAfterMenu).not.toBeNull();
  expect(Math.abs(dashboardAfterMenu!.x - dashboardBeforeMenu!.x)).toBeLessThan(1);
  expect(Math.abs(dashboardAfterMenu!.y - dashboardBeforeMenu!.y)).toBeLessThan(1);
  const userMenu = page.getByRole('menu', { name: 'User menu' });
  await expect(userMenu).toBeVisible();
  await expect(userMenu.getByText('Licensed user')).toBeVisible();
  await expect(userMenu.getByText('QA License Owner')).toBeVisible();
  await expect(userMenu.getByText('qa.user')).toBeVisible();
  await expect(userMenu.getByText('ACTIVE')).toBeVisible();
  await userMenu.getByRole('menuitem', { name: /Auto Test/ }).click();

  const workspace = page.getByRole('region', { name: 'Auto Test automation catalog' });
  await expect(workspace).toBeVisible();
  await expect(dashboard).toBeVisible();
  expect(await dashboard.getAttribute('aria-modal')).toBeNull();
  await expect(workspace.getByRole('heading', { name: 'Auto Test' })).toBeVisible();
  await expect(workspace.getByText('3', { exact: true }).first()).toBeVisible();
  await expect(workspace.locator('tbody tr')).toHaveCount(4);

  await workspace.getByRole('combobox', { name: 'Filter by repository' }).selectOption('AR React UI');
  await expect(workspace.locator('tbody tr')).toHaveCount(2);
  await workspace.getByRole('combobox', { name: 'Filter by test type' }).selectOption('PLAYWRIGHT');
  await workspace.getByRole('combobox', { name: 'Filter by safety' }).selectOption('SAFE');
  await workspace.getByRole('textbox', { name: 'Find tests' }).fill('navigation');
  await expect(workspace.locator('tbody tr')).toHaveCount(1);
  await expect(workspace.getByText('Dashboard safe navigation and Auto Test workspace')).toBeVisible();
  await workspace.getByRole('button', { name: 'Clear' }).click();
  await expect(workspace.locator('tbody tr')).toHaveCount(4);

  const dashboardBeforeAutoTestDrag = await dashboard.boundingBox();
  const beforeDrag = await workspace.boundingBox();
  expect(beforeDrag).not.toBeNull();
  await dragBy(page, workspace.getByTestId('auto-test-drag-handle'), 80, 50);
  const afterDrag = await workspace.boundingBox();
  const dashboardAfterAutoTestDrag = await dashboard.boundingBox();
  expect(afterDrag).not.toBeNull();
  expect(dashboardBeforeAutoTestDrag).not.toBeNull();
  expect(dashboardAfterAutoTestDrag).not.toBeNull();
  expect(afterDrag!.x).toBeGreaterThan(beforeDrag!.x + 40);
  expect(afterDrag!.y).toBeGreaterThan(beforeDrag!.y + 20);
  expect(Math.abs(dashboardAfterAutoTestDrag!.x - dashboardBeforeAutoTestDrag!.x)).toBeLessThan(1);
  expect(Math.abs(dashboardAfterAutoTestDrag!.y - dashboardBeforeAutoTestDrag!.y)).toBeLessThan(1);

  const catalogRequestsBeforeRefresh = await operationCount(page, 'automationTests.list');
  await workspace.getByRole('button', { name: 'Refresh test catalog' }).click();
  await expect.poll(() => operationCount(page, 'automationTests.list')).toBeGreaterThan(catalogRequestsBeforeRefresh);
  await workspace.getByRole('button', { name: 'Close Auto Test' }).click();
  await expect(workspace).toHaveCount(0);
  await expect(dashboard).toBeVisible();

  await page.setViewportSize({ width: 700, height: 900 });
  await expect.poll(async () => {
    const bounds = await dashboard.boundingBox();
    return Boolean(
      bounds
      && bounds.x >= 7
      && bounds.x + bounds.width <= 701
      && bounds.y >= 7
      && bounds.y < 900,
    );
  }).toBe(true);
  await expect(dashboard.getByTestId('main-dashboard-drag-handle')).toBeVisible();
  await expect(userMenuButton).toBeVisible();
  const listRequestsBeforeResponsiveRefresh = await operationCount(page, 'mainDashboard.list');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect.poll(() => operationCount(page, 'mainDashboard.list'))
    .toBeGreaterThan(listRequestsBeforeResponsiveRefresh);

  const expectedOperations = [
    'mainDashboard.openOrganizations',
    'mainDashboard.newBotJob',
    'mainDashboard.openConfig',
    'mainDashboard.openInfo',
    'mainDashboard.list',
    'mainDashboard.exit',
    'mainDashboard.cloneBotJob',
    'mainDashboard.launchBotJob',
    'mainDashboard.openBotJob',
    'mainDashboard.deleteBotJob',
    'license.bootstrap',
    'automationTests.list',
  ];
  for (const operation of expectedOperations) {
    await expect.poll(() => operationCount(page, operation)).toBeGreaterThan(0);
  }

  await page.setViewportSize({ width: 1240, height: 820 });
  await page.goto('/?desktopShell=1');
  const desktopDashboard = page.getByRole('region', { name: 'Main Dashboard' });
  await expect(desktopDashboard).toBeVisible();
  await expect(page).toHaveTitle('AR Web');
  await expect.poll(async () => {
    const bounds = await desktopDashboard.boundingBox();
    return Boolean(
      bounds
      && Math.abs(bounds.x) < 1
      && Math.abs(bounds.y) < 1
      && Math.abs(bounds.width - 1240) < 1
      && Math.abs(bounds.height - 820) < 1,
    );
  }).toBe(true);
  expect(await desktopDashboard.evaluate(element => window.getComputedStyle(element).borderRadius)).toBe('0px');
  expect(await desktopDashboard.evaluate(element => window.getComputedStyle(element).boxShadow)).toBe('none');

  const desktopBeforeDrag = await desktopDashboard.boundingBox();
  await dragBy(page, desktopDashboard.getByTestId('main-dashboard-drag-handle'), 80, 50);
  const desktopAfterDrag = await desktopDashboard.boundingBox();
  expect(desktopBeforeDrag).not.toBeNull();
  expect(desktopAfterDrag).not.toBeNull();
  expect(Math.abs(desktopAfterDrag!.x - desktopBeforeDrag!.x)).toBeLessThan(1);
  expect(Math.abs(desktopAfterDrag!.y - desktopBeforeDrag!.y)).toBeLessThan(1);

  await page.setViewportSize({ width: 700, height: 900 });
  await expect.poll(async () => {
    const bounds = await desktopDashboard.boundingBox();
    return Boolean(
      bounds
      && Math.abs(bounds.x) < 1
      && Math.abs(bounds.y) < 1
      && Math.abs(bounds.width - 700) < 1
      && Math.abs(bounds.height - 900) < 1,
    );
  }).toBe(true);
  expect(pageErrors).toEqual([]);
});
