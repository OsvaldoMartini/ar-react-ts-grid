import {
  isOcrConfigWorkspaceSession,
  isOcrResultsWorkspaceSession,
  OCR_CONFIG_WORKSPACE_KIND,
  type OcrWorkspaceKind,
} from '../scanner/Scanner.sessions';

export const OCR_WORKSPACE_WINDOW_RETARGET_OPERATION = 'ocrWorkspace.windowRetarget';

export interface OcrWorkspaceRetarget {
  kind: OcrWorkspaceKind;
  previousSessionId: string;
  sessionId: string;
  homeBankingId: number;
  botJobId: number;
  homeUrlId?: number;
}

export type OcrWorkspaceRetargetDisposition = 'FOCUS_ONLY' | 'SWITCH_SESSION';

const isSessionForKind = (kind: OcrWorkspaceKind, sessionId: string): boolean =>
  kind === OCR_CONFIG_WORKSPACE_KIND
    ? isOcrConfigWorkspaceSession(sessionId)
    : isOcrResultsWorkspaceSession(sessionId);

const positiveSafeInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const ocrWorkspaceRetarget = (
  body: unknown,
  currentSessionId: string,
  expectedKind: OcrWorkspaceKind,
): OcrWorkspaceRetarget | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const candidate = body as Record<string, unknown>;
  if (candidate.kind !== expectedKind) return null;

  const previousSessionId = typeof candidate.previousSessionId === 'string'
    ? candidate.previousSessionId.trim()
    : '';
  const sessionId = typeof candidate.sessionId === 'string' ? candidate.sessionId.trim() : '';
  if (!isSessionForKind(expectedKind, currentSessionId)) return null;
  if (previousSessionId !== currentSessionId) return null;
  if (!isSessionForKind(expectedKind, previousSessionId)) return null;
  if (!isSessionForKind(expectedKind, sessionId)) return null;

  const homeBankingId = positiveSafeInteger(candidate.homeBankingId);
  const botJobId = positiveSafeInteger(candidate.botJobId);
  if (homeBankingId === null || botJobId === null) return null;

  const rawHomeUrlId = candidate.homeUrlId;
  const homeUrlId = rawHomeUrlId === undefined || rawHomeUrlId === null
    ? undefined
    : positiveSafeInteger(rawHomeUrlId);
  if (rawHomeUrlId !== undefined && rawHomeUrlId !== null && homeUrlId === null) return null;
  const normalizedHomeUrlId = homeUrlId ?? undefined;

  return {
    kind: expectedKind,
    previousSessionId,
    sessionId,
    homeBankingId,
    botJobId,
    ...(normalizedHomeUrlId === undefined ? {} : { homeUrlId: normalizedHomeUrlId }),
  };
};

export const ocrWorkspaceRetargetDisposition = (
  retarget: OcrWorkspaceRetarget,
  currentSessionId: string,
): OcrWorkspaceRetargetDisposition => retarget.sessionId === currentSessionId
  ? 'FOCUS_ONLY'
  : 'SWITCH_SESSION';

export const ocrWorkspaceTargetUrl = (
  currentUrl: string,
  kind: OcrWorkspaceKind,
  sessionId: string,
): string => {
  if (!isSessionForKind(kind, sessionId)) {
    throw new Error('The OCR session does not match the requested workspace kind');
  }
  const target = new URL(currentUrl);
  target.searchParams.set('desktopShell', '1');
  target.searchParams.set('openOcr', kind);
  target.searchParams.set('ocrSession', sessionId);
  return target.toString();
};
