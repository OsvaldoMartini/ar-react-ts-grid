import type { ElementDTO } from '../instructionsMockData';
import { pageScannerLocatorElementKey } from './PageScannerLocator';

export const PAGE_SCANNER_ELEMENT_RENAME_OPERATION = 'pageScanner.element.rename';
export const PAGE_SCANNER_ELEMENT_RENAME_RESPONSE = 'pageScanner.element.renameResponse';

export type PendingPageScannerElementRename = {
  requestId: string;
  elementKey: string;
  target: ElementDTO;
};

type PageScannerRenameScope = {
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
};

export const normalizePageScannerClientNamed = (
  typedName: string | null | undefined,
  element: ElementDTO,
): string | null => {
  const typed = (typedName || '').trim();
  if (!typed
      || typed === element.definedName
      || typed === element.someText
      || typed === element.tagName) return null;
  return typed;
};

export const pageScannerElementRenameMessage = (
  scope: PageScannerRenameScope,
  pending: PendingPageScannerElementRename,
  clientNamed: string | null,
  runtimeMode: 'JAVA_V1' | 'TYPESCRIPT_PLAYWRIGHT_V2' = 'JAVA_V1',
) => ({
  type: PAGE_SCANNER_ELEMENT_RENAME_OPERATION,
  sessionId: scope.sessionId,
  homeBankingId: scope.homeBankingId,
  botJobId: scope.botJobId,
  body: JSON.stringify({
    contractVersion: 1,
    requestId: pending.requestId,
    elementKey: pending.elementKey,
    runtimeMode,
    identity: {
      xPath: pending.target.xPath || '',
      iFrameXPath: pending.target.iFrameXPath || '',
      attribId: pending.target.attribId || '',
      cssSelector: pending.target.cssSelector || '',
    },
    clientNamed,
  }),
});

export type PageScannerElementRenameResolution =
  | { status: 'stale' }
  | { status: 'error'; message: string }
  | { status: 'success'; clientNamed: string | null };

export const resolvePageScannerElementRenameResponse = (
  body: Record<string, any> | null | undefined,
  pending: PendingPageScannerElementRename | null,
): PageScannerElementRenameResolution => {
  if (!pending || body?.requestId !== pending.requestId) return { status: 'stale' };
  if (body?.ok === false) {
    return {
      status: 'error',
      message: String(body?.message || body?.error || 'The Page Scanner name was not saved.'),
    };
  }
  if (body?.persisted !== true || Number(body?.affectedRows) !== 1) {
    return { status: 'error', message: 'The backend did not confirm one saved Page Scanner name.' };
  }
  if (body?.elementKey !== pending.elementKey) {
    return { status: 'error', message: 'The rename response did not match the selected Page Scanner element.' };
  }
  if (body?.clientNamed !== null && typeof body?.clientNamed !== 'string') {
    return { status: 'error', message: 'The backend returned an invalid Page Scanner name.' };
  }
  return { status: 'success', clientNamed: body.clientNamed };
};

export const replacePageScannerElementAlias = (
  elements: ElementDTO[],
  elementKey: string,
  clientNamed: string | null,
): { elements: ElementDTO[]; replaced: boolean } => {
  let replaced = false;
  const next = elements.map((element) => {
    if (pageScannerLocatorElementKey(element) !== elementKey) return element;
    replaced = true;
    return { ...element, clientNamed };
  });
  return { elements: replaced ? next : elements, replaced };
};

export const replacePageScannerGroupedElementAlias = (
  grouped: Record<string, { tagName: string; elements: ElementDTO[] }>,
  elementKey: string,
  clientNamed: string | null,
): Record<string, { tagName: string; elements: ElementDTO[] }> => {
  let changed = false;
  const next = Object.fromEntries(Object.entries(grouped).map(([groupKey, group]) => {
    const replacement = replacePageScannerElementAlias(group.elements, elementKey, clientNamed);
    changed ||= replacement.replaced;
    return [groupKey, replacement.replaced ? { ...group, elements: replacement.elements } : group];
  }));
  return changed ? next : grouped;
};

export const applyPageScannerAliasesByXPath = (
  elements: ElementDTO[],
  aliases: ReadonlyMap<string, string>,
): ElementDTO[] => {
  let changed = false;
  const next = elements.map((element) => {
    const proposed = aliases.get(element.xPath);
    if (!proposed || proposed === element.clientNamed) return element;
    changed = true;
    return { ...element, clientNamed: proposed };
  });
  return changed ? next : elements;
};
