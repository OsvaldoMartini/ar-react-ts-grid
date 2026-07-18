export const SCANNER_GRID_SESSION_ID = 'scannerGrid';
export const PRE_SCANNER_GRID_SESSION_ID = 'preScannerGrid';
export const SCANNER_TOOL_SESSION_ID = 'scannerTool';
export const SCANNER_ELEMENT_PANE_SESSION_ID = 'scanner-element-pane';
export const MOBILE_RETURN_SERVER_SESSION_ID = 'mobile-return-server';
export const OCR_CONFIG_WORKSPACE_KIND = 'config';
export const OCR_RESULTS_WORKSPACE_KIND = 'results';
export const OCR_CONFIG_WORKSPACE_SESSION_PREFIX = 'ocr-config-';
export const OCR_RESULTS_WORKSPACE_SESSION_PREFIX = 'ocr-results-';

export type OcrWorkspaceKind =
  | typeof OCR_CONFIG_WORKSPACE_KIND
  | typeof OCR_RESULTS_WORKSPACE_KIND;
