import {
  SCANNER_ACTION_TIMEOUT_MESSAGE,
  SCANNER_BOOTSTRAP_TIMEOUT_MESSAGE,
  SCANNER_LOADING_STATUS_MESSAGE,
  SCANNER_READY_STATUS_MESSAGE,
  scannerErrorMessage,
} from './Scanner.controllerStatus';

test('keeps scanner baseline status messages stable', () => {
  expect(SCANNER_READY_STATUS_MESSAGE).toBe('Ready');
  expect(SCANNER_LOADING_STATUS_MESSAGE).toBe('Loading scanner state');
});

test('keeps scanner timeout messages stable', () => {
  expect(SCANNER_BOOTSTRAP_TIMEOUT_MESSAGE).toBe('The backend did not return scanner state');
  expect(SCANNER_ACTION_TIMEOUT_MESSAGE).toBe('The backend did not answer the scanner action');
});

test('returns error message or fallback for unknown failures', () => {
  expect(scannerErrorMessage(new Error('socket failed'), 'fallback')).toBe('socket failed');
  expect(scannerErrorMessage('plain failure', 'fallback')).toBe('fallback');
});
