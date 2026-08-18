import {
  MOBILE_RETURN_SERVER_SESSION_ID,
  isPageScannerWorkspaceSession,
  PAGE_SCANNER_WORKSPACE_SESSION_PREFIX,
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
  expect(PAGE_SCANNER_WORKSPACE_SESSION_PREFIX).toBe('page-scanner-');
});

test('accepts only coordinator-issued Page Scanner UUID sessions', () => {
  expect(isPageScannerWorkspaceSession('page-scanner-123e4567-e89b-42d3-a456-426614174000')).toBe(true);
  expect(isPageScannerWorkspaceSession('page-scanner-not-a-uuid')).toBe(false);
  expect(isPageScannerWorkspaceSession('preScannerGrid')).toBe(false);
});
