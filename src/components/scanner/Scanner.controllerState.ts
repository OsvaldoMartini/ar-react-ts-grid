import type { ScannerStatusTone } from './Scanner.types';
import {
  SCANNER_LOADING_STATUS_MESSAGE,
  SCANNER_READY_STATUS_MESSAGE,
} from './Scanner.controllerStatus';

export interface ScannerControllerResetState {
  loadingState: boolean;
  status: string;
  statusTone: ScannerStatusTone;
}

export function scannerControllerResetState(enabled: boolean): ScannerControllerResetState {
  return {
    loadingState: enabled,
    status: enabled ? SCANNER_LOADING_STATUS_MESSAGE : SCANNER_READY_STATUS_MESSAGE,
    statusTone: 'neutral',
  };
}
