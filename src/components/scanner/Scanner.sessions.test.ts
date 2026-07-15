import {
  MOBILE_RETURN_SERVER_SESSION_ID,
  SCANNER_ELEMENT_PANE_SESSION_ID,
  PRE_SCANNER_GRID_SESSION_ID,
  SCANNER_GRID_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from './Scanner.sessions';

test('keeps scanner session ids stable', () => {
  expect(SCANNER_GRID_SESSION_ID).toBe('scannerGrid');
  expect(PRE_SCANNER_GRID_SESSION_ID).toBe('preScannerGrid');
  expect(SCANNER_TOOL_SESSION_ID).toBe('scannerTool');
  expect(SCANNER_ELEMENT_PANE_SESSION_ID).toBe('scanner-element-pane');
  expect(MOBILE_RETURN_SERVER_SESSION_ID).toBe('mobile-return-server');
});
