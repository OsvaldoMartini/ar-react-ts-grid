import {
  SCANNER_RESPONSE_TIMEOUT_MS,
  SCANNER_STATUS_RESET_MS,
  clearScannerTimer,
} from './Scanner.controllerTiming';

test('keeps scanner controller timing values stable', () => {
  expect(SCANNER_RESPONSE_TIMEOUT_MS).toBe(10000);
  expect(SCANNER_STATUS_RESET_MS).toBe(3500);
});

test('clears scanner timer refs', () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const ref = { current: setTimeout(callback, 1) };

  clearScannerTimer(ref);
  jest.runOnlyPendingTimers();

  expect(ref.current).toBeNull();
  expect(callback).not.toHaveBeenCalled();
  jest.useRealTimers();
});
