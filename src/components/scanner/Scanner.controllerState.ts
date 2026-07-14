import type { ScannerStatusTone } from './Scanner.types';

export interface ScannerControllerResetState {
  loadingState: boolean;
  status: string;
  statusTone: ScannerStatusTone;
}

export function scannerControllerResetState(enabled: boolean): ScannerControllerResetState {
  return {
    loadingState: enabled,
    status: enabled ? 'Loading scanner state' : 'Ready',
    statusTone: 'neutral',
  };
}
