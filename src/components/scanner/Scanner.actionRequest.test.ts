import { canRequestScannerAction } from './Scanner.actionRequest';
import type { ScannerActionRequestContext } from './Scanner.actionRequest';

function context(overrides: Partial<ScannerActionRequestContext> = {}): ScannerActionRequestContext {
  return {
    enabled: true,
    botJobId: 42,
    hasPendingAction: false,
    ...overrides,
  };
}

test('allows action request when scanner has a valid job and no pending action', () => {
  expect(canRequestScannerAction(context())).toBe(true);
});

test('rejects action request when scanner is disabled or job is invalid', () => {
  expect(canRequestScannerAction(context({ enabled: false }))).toBe(false);
  expect(canRequestScannerAction(context({ botJobId: null }))).toBe(false);
  expect(canRequestScannerAction(context({ botJobId: 0 }))).toBe(false);
});

test('rejects action request while another action is pending', () => {
  expect(canRequestScannerAction(context({ hasPendingAction: true }))).toBe(false);
});
