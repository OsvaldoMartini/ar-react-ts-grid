export interface ScannerActionRequestContext {
  enabled: boolean;
  botJobId: number | null;
  hasPendingAction: boolean;
}

export function canRequestScannerAction(context: ScannerActionRequestContext): boolean {
  if (!context.enabled) return false;
  if (!context.botJobId || context.botJobId <= 0) return false;
  return !context.hasPendingAction;
}
