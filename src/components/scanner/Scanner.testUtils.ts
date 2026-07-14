import type { ScannerState } from './Scanner.types';

export function scannerState(overrides: Partial<ScannerState> = {}): ScannerState {
  const base: ScannerState = {
    revision: 1,
    botJobId: 42,
    botJobName: 'Apre Acconto',
    homeBankingId: 2,
    environmentUrl: 'https://bank.example',
    blocks: [{ id: 100, order: 1, name: 'Login', active: true }],
    browser: { state: 'UNKNOWN', activeUrl: '', activeTitle: '', openTabs: 0, scannable: false },
    focus: { profile: 'default', searchTerms: [] },
    ocr: { available: true, status: 'IDLE' },
    capabilities: {
      canRefreshState: true,
      canUsePageScanner: true,
      canUseOcr: true,
      canExecute: true,
      canApplyElements: true,
    },
    executionState: 'IDLE',
  };

  return {
    ...base,
    ...overrides,
    browser: { ...base.browser, ...overrides.browser },
    focus: { ...base.focus, ...overrides.focus },
    ocr: { ...base.ocr, ...overrides.ocr },
    capabilities: { ...base.capabilities, ...overrides.capabilities },
  };
}
