export type ScannerAction = 'REFRESH_STATE' | 'CLEAR_GRID' | 'REFRESH_PAGE';

export type ScannerStatusTone = 'neutral' | 'success' | 'warning' | 'error';

export interface ScannerBlock {
  id: number;
  order: number;
  name: string;
  active: boolean;
}

export interface ScannerBrowserState {
  state: string;
  activeUrl: string;
  activeTitle: string;
  openTabs: number;
  scannable: boolean;
}

export interface ScannerState {
  revision: number;
  botJobId: number;
  botJobName: string;
  homeBankingId: number;
  environmentUrl: string;
  blocks: ScannerBlock[];
  browser: ScannerBrowserState;
  focus: {
    profile: string;
    searchTerms: string[];
  };
  ocr: {
    available: boolean;
    status: string;
  };
  capabilities: {
    canRefreshState: boolean;
    canUsePageScanner: boolean;
    canUseOcr: boolean;
    canExecute: boolean;
    canApplyElements: boolean;
  };
  executionState: string;
}

export interface ScannerResponse {
  ok: boolean;
  message?: string;
  requestId?: string;
  botJobId: number;
  action?: ScannerAction;
  state?: ScannerState | null;
  errorCode?: string;
  fieldErrors?: Record<string, string>;
}

export interface ScannerEnvelope {
  sessionId: string;
  operationId: string;
  homeBankingId?: number;
  body: ScannerResponse;
}
