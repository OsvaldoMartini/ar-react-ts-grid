export const SCANNER_RESPONSE_TIMEOUT_MS = 10000;
export const SCANNER_STATUS_RESET_MS = 3500;

export interface ScannerTimerRef {
  current: ReturnType<typeof setTimeout> | null;
}

export function clearScannerTimer(ref: ScannerTimerRef): void {
  if (ref.current) clearTimeout(ref.current);
  ref.current = null;
}
