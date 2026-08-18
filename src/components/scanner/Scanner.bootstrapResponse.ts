import type { ScannerResponse, ScannerStatusTone } from './Scanner.types';

export interface ScannerResponseStatus {
  message: string;
  tone: ScannerStatusTone;
}

export function isMatchingScannerBootstrapResponse(
  response: ScannerResponse,
  requestId: string | null,
): boolean {
  return Boolean(requestId) && response.requestId === requestId;
}

export function scannerBootstrapResponseStatus(response: ScannerResponse): ScannerResponseStatus {
  if (response.ok && response.state) {
    return { message: response.message || 'Scanner state loaded', tone: 'success' };
  }
  return { message: response.message || 'Could not load scanner state', tone: 'error' };
}
