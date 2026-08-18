import type { ScannerAction, ScannerResponse } from './Scanner.types';

export interface PendingScannerAction {
  requestId: string;
  action: ScannerAction;
}

export function isMatchingScannerActionResponse(
  response: ScannerResponse,
  pending: PendingScannerAction | null,
): pending is PendingScannerAction {
  if (!pending || response.requestId !== pending.requestId) return false;
  return !response.action || response.action === pending.action;
}
