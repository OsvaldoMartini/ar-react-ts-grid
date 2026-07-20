export type PageScannerRequestOperation =
  | 'pageScanner.scan'
  | 'pageScanner.refresh'
  | 'pageScanner.clear'
  | 'pageScanner.testElement';

export type PageScannerWorkspaceCloseReason =
  | 'BOT_JOB_CLOSED'
  | 'SUPERSEDED'
  | 'EXPIRED';

export interface PageScannerWorkspaceRetarget {
  previousSessionId: string;
  sessionId: string;
  botJobId: number;
  workspaceEpoch: number;
}

export type PageScannerRetargetDisposition = 'FOCUS_ONLY' | 'SWITCH_SESSION';

const RESPONSE_TO_REQUEST: Record<string, PageScannerRequestOperation> = {
  'pageScanner.scanResponse': 'pageScanner.scan',
  'pageScanner.refreshResponse': 'pageScanner.refresh',
  'pageScanner.clearResponse': 'pageScanner.clear',
  'pageScanner.testElementResponse': 'pageScanner.testElement',
};

const CLOSE_REASONS = new Set<PageScannerWorkspaceCloseReason>([
  'BOT_JOB_CLOSED',
  'SUPERSEDED',
  'EXPIRED',
]);

export const pageScannerRequestForResponse = (
  responseOperation: string,
): PageScannerRequestOperation | null => RESPONSE_TO_REQUEST[responseOperation] ?? null;

export const pageScannerWorkspaceCloseReason = (
  body: Record<string, unknown> | null | undefined,
): PageScannerWorkspaceCloseReason | null => {
  const rawReason = body?.reason ?? body?.closeReason ?? body?.errorCode;
  const normalized = typeof rawReason === 'string' ? rawReason.trim().toUpperCase() : '';
  return CLOSE_REASONS.has(normalized as PageScannerWorkspaceCloseReason)
    ? normalized as PageScannerWorkspaceCloseReason
    : null;
};

export const pageScannerCloseMessage = (reason: PageScannerWorkspaceCloseReason): string => {
  if (reason === 'BOT_JOB_CLOSED') return 'The Bot Job was closed. This Page Scanner will close.';
  if (reason === 'SUPERSEDED') return 'This Page Scanner was replaced by a newer workspace and will close.';
  return 'This Page Scanner session expired and will close.';
};

export const pageScannerWorkspaceRetarget = (
  body: Record<string, unknown> | null | undefined,
  currentSessionId: string,
  isValidSession: (sessionId: string) => boolean,
): PageScannerWorkspaceRetarget | null => {
  const previousSessionId = typeof body?.previousSessionId === 'string'
    ? body.previousSessionId.trim()
    : '';
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const botJobId = Number(body?.botJobId);
  const workspaceEpoch = Number(body?.workspaceEpoch);
  if (!isValidSession(currentSessionId) || previousSessionId !== currentSessionId) return null;
  if (!isValidSession(sessionId)) return null;
  if (!Number.isSafeInteger(botJobId) || botJobId <= 0) return null;
  if (!Number.isSafeInteger(workspaceEpoch) || workspaceEpoch <= 0) return null;
  return { previousSessionId, sessionId, botJobId, workspaceEpoch };
};

export const pageScannerRetargetDisposition = (
  retarget: PageScannerWorkspaceRetarget,
  currentSessionId: string,
): PageScannerRetargetDisposition => retarget.sessionId === currentSessionId
  ? 'FOCUS_ONLY'
  : 'SWITCH_SESSION';
