export const SCANNER_GRID_SESSION_ID = 'scannerGrid';
export const PRE_SCANNER_GRID_SESSION_ID = 'preScannerGrid';
export const PAGE_SCANNER_WORKSPACE_KIND = 'preScan';
export const PAGE_SCANNER_WORKSPACE_SESSION_PREFIX = 'page-scanner-';
export const SCANNER_TOOL_SESSION_ID = 'scannerTool';
export const SCANNER_ELEMENT_PANE_SESSION_ID = 'scanner-element-pane';
export const MOBILE_RETURN_SERVER_SESSION_ID = 'mobile-return-server';
export const OCR_CONFIG_WORKSPACE_KIND = 'config';
export const OCR_RESULTS_WORKSPACE_KIND = 'results';
export const OCR_CONFIG_WORKSPACE_SESSION_PREFIX = 'ocr-config-';
export const OCR_RESULTS_WORKSPACE_SESSION_PREFIX = 'ocr-results-';

const PAGE_SCANNER_WORKSPACE_SESSION_PATTERN = new RegExp(
  `^${PAGE_SCANNER_WORKSPACE_SESSION_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
  'i',
);

const OCR_CONFIG_WORKSPACE_SESSION_PATTERN = new RegExp(
  `^${OCR_CONFIG_WORKSPACE_SESSION_PREFIX}[A-Za-z0-9-]{1,80}$`,
);

const OCR_RESULTS_WORKSPACE_SESSION_PATTERN = new RegExp(
  `^${OCR_RESULTS_WORKSPACE_SESSION_PREFIX}[A-Za-z0-9-]{1,80}$`,
);

export const isPageScannerWorkspaceSession = (sessionId: string): boolean =>
  PAGE_SCANNER_WORKSPACE_SESSION_PATTERN.test(sessionId);

export const isOcrConfigWorkspaceSession = (sessionId: string): boolean =>
  OCR_CONFIG_WORKSPACE_SESSION_PATTERN.test(sessionId);

export const isOcrResultsWorkspaceSession = (sessionId: string): boolean =>
  OCR_RESULTS_WORKSPACE_SESSION_PATTERN.test(sessionId);

export const isOcrWorkspaceSession = (sessionId: string): boolean =>
  isOcrConfigWorkspaceSession(sessionId) || isOcrResultsWorkspaceSession(sessionId);

export type OcrWorkspaceKind =
  | typeof OCR_CONFIG_WORKSPACE_KIND
  | typeof OCR_RESULTS_WORKSPACE_KIND;
