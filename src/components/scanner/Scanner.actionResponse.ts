import type { ScannerResponse, ScannerStatusTone } from './Scanner.types';

export interface ScannerActionResponseStatus {
  message: string;
  tone: ScannerStatusTone;
}

export function scannerActionResponseStatus(response: ScannerResponse): ScannerActionResponseStatus {
  if (response.ok && response.state) {
    return { message: response.message || 'Scanner action completed', tone: 'success' };
  }
  return { message: response.message || 'Scanner action failed', tone: 'error' };
}
