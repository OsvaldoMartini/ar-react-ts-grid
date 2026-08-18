export interface OpenPageEntry {
  pageId: string;
  title: string;
  kind: string;
  sessionId?: string;
  detail?: string;
  botJobName?: string;
  openedAt?: string;
  main: boolean;
  closeable: boolean;
}

export const parsePagesOpenMessage = (raw: string): { operationId?: string; body: any } => {
  const outer = JSON.parse(raw);
  return {
    operationId: outer.operationId || outer.type,
    body: typeof outer.body === 'string' ? JSON.parse(outer.body) : outer.body ?? outer,
  };
};

export const pagesOpenTextValue = (...candidates: unknown[]): string => {
  const value = candidates.find(candidate => typeof candidate === 'string' && candidate.trim());
  return typeof value === 'string' ? value.trim() : '';
};

const normalizePage = (candidate: any, index: number): OpenPageEntry | null => {
  if (!candidate || typeof candidate !== 'object') return null;

  const sessionId = pagesOpenTextValue(candidate.sessionId, candidate.session);
  const pageId = pagesOpenTextValue(
    candidate.pageId,
    candidate.pageKey,
    candidate.workspaceId,
    candidate.id,
    sessionId,
  );
  if (!pageId) return null;

  const kind = pagesOpenTextValue(
    candidate.kind,
    candidate.pageKind,
    candidate.workspaceKind,
    candidate.type,
    'WORKSPACE',
  );
  const title = pagesOpenTextValue(
    candidate.title,
    candidate.displayName,
    candidate.name,
    candidate.label,
    `Page ${index + 1}`,
  );
  const normalizedKind = kind.toUpperCase().replace(/[\s-]+/g, '_');
  const explicitMain = typeof candidate.main === 'boolean'
    ? candidate.main
    : typeof candidate.isMain === 'boolean'
      ? candidate.isMain
      : null;
  const main = explicitMain ?? (
    normalizedKind === 'MAIN'
    || normalizedKind === 'MAIN_DASHBOARD'
    || sessionId === 'mainApplicationControl'
  );

  return {
    pageId,
    title,
    kind,
    sessionId: sessionId || undefined,
    detail: pagesOpenTextValue(candidate.detail, candidate.description) || undefined,
    botJobName: pagesOpenTextValue(candidate.botJobName) || undefined,
    openedAt: pagesOpenTextValue(candidate.openedAt, candidate.opened) || undefined,
    main,
    closeable: candidate.closeable !== false && candidate.canClose !== false,
  };
};

export const normalizeOpenPages = (body: any): OpenPageEntry[] => {
  const candidates = Array.isArray(body)
    ? body
    : Array.isArray(body?.pages)
      ? body.pages
      : Array.isArray(body?.items)
        ? body.items
        : Array.isArray(body?.workspaces)
          ? body.workspaces
          : [];

  return candidates
    .map(normalizePage)
    .filter((page: OpenPageEntry | null): page is OpenPageEntry => page !== null);
};
