import { canRequestScannerBootstrap } from './Scanner.bootstrapRequest';
import type { ScannerBootstrapRequestContext } from './Scanner.bootstrapRequest';

const OPEN = 1;
const CLOSED = 3;

function context(overrides: Partial<ScannerBootstrapRequestContext> = {}): ScannerBootstrapRequestContext {
  return {
    enabled: true,
    connected: true,
    socketReadyState: OPEN,
    openReadyState: OPEN,
    botJobId: 42,
    force: false,
    alreadyBootstrappedOnSocket: false,
    ...overrides,
  };
}

test('allows bootstrap when scanner and socket are ready', () => {
  expect(canRequestScannerBootstrap(context())).toBe(true);
});

test('rejects bootstrap when scanner, socket, or bot job is not ready', () => {
  expect(canRequestScannerBootstrap(context({ enabled: false }))).toBe(false);
  expect(canRequestScannerBootstrap(context({ connected: false }))).toBe(false);
  expect(canRequestScannerBootstrap(context({ socketReadyState: null }))).toBe(false);
  expect(canRequestScannerBootstrap(context({ socketReadyState: CLOSED }))).toBe(false);
  expect(canRequestScannerBootstrap(context({ botJobId: null }))).toBe(false);
  expect(canRequestScannerBootstrap(context({ botJobId: 0 }))).toBe(false);
});

test('skips duplicate bootstrap on the same socket unless forced', () => {
  expect(canRequestScannerBootstrap(context({ alreadyBootstrappedOnSocket: true }))).toBe(false);
  expect(canRequestScannerBootstrap(context({
    alreadyBootstrappedOnSocket: true,
    force: true,
  }))).toBe(true);
});
