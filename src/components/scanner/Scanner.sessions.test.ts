import {
  PRE_SCANNER_GRID_SESSION_ID,
  SCANNER_GRID_SESSION_ID,
} from './Scanner.sessions';

test('keeps scanner session ids stable', () => {
  expect(SCANNER_GRID_SESSION_ID).toBe('scannerGrid');
  expect(PRE_SCANNER_GRID_SESSION_ID).toBe('preScannerGrid');
});
