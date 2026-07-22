import type { ElementDTO } from '../instructionsMockData';

export const PAGE_SCANNER_LOCATOR_GENERATE_OPERATION = 'pageScanner.locator.generate';
export const PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE = 'pageScanner.locator.generateResponse';
export const PAGE_SCANNER_LOCATOR_APPLY_OPERATION = 'pageScanner.locator.apply';
export const PAGE_SCANNER_LOCATOR_APPLY_RESPONSE = 'pageScanner.locator.applyResponse';

export type LocatorResult = {
  tagName: string;
  controlKind: string;
  label: string;
  xpath: string;
  css: string;
  positional: boolean;
  note: string;
};

export type PendingLocatorApply = {
  requestId: string;
  elementKey: string;
  xpath: string;
  target: ElementDTO;
};

type LocatorEnvelopeScope = {
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
};

export const pageScannerLocatorGenerateMessage = (
  scope: LocatorEnvelopeScope,
  requestId: string,
  html: string,
) => ({
  type: PAGE_SCANNER_LOCATOR_GENERATE_OPERATION,
  sessionId: scope.sessionId,
  homeBankingId: scope.homeBankingId,
  botJobId: scope.botJobId,
  body: JSON.stringify({ requestId, html }),
});

export const pageScannerLocatorApplyMessage = (
  scope: LocatorEnvelopeScope,
  pending: PendingLocatorApply,
  element: ElementDTO,
) => ({
  type: PAGE_SCANNER_LOCATOR_APPLY_OPERATION,
  sessionId: scope.sessionId,
  homeBankingId: scope.homeBankingId,
  botJobId: scope.botJobId,
  body: JSON.stringify({
    requestId: pending.requestId,
    elementKey: pending.elementKey,
    xpath: pending.xpath,
    elementDetails: [element],
  }),
});

export const pageScannerLocatorElementKey = (element: ElementDTO): string =>
  `${element.id}||${element.xPath || ''}||${element.tagName || ''}`;

export const pageScannerLocatorElementLabel = (element: ElementDTO): string => {
  const displayName = element.clientNamed
    || element.definedName
    || element.someText
    || element.attribName
    || element.attribId
    || element.tagName
    || `Element ${element.id}`;
  return `${displayName} - <${element.tagName || 'element'}>`;
};

export const replacePageScannerLocatorElement = (
  elements: ElementDTO[],
  elementKey: string,
  authoritativeElement: ElementDTO,
): { elements: ElementDTO[]; replaced: boolean } => {
  let replaced = false;
  const next = elements.map((element) => {
    if (pageScannerLocatorElementKey(element) !== elementKey) return element;
    replaced = true;
    return { ...element, ...authoritativeElement };
  });
  return { elements: replaced ? next : elements, replaced };
};

export const replacePageScannerLocatorGroupedElement = (
  grouped: Record<string, { tagName: string; elements: ElementDTO[] }>,
  elementKey: string,
  authoritativeElement: ElementDTO,
): Record<string, { tagName: string; elements: ElementDTO[] }> => {
  let changed = false;
  const next = Object.fromEntries(Object.entries(grouped).map(([groupKey, group]) => {
    const replacement = replacePageScannerLocatorElement(
      group.elements,
      elementKey,
      authoritativeElement,
    );
    changed ||= replacement.replaced;
    return [groupKey, replacement.replaced ? { ...group, elements: replacement.elements } : group];
  }));
  return changed ? next : grouped;
};

export const authoritativeLocatorElementFromResponse = (
  body: Record<string, any> | null | undefined,
): ElementDTO | null => {
  if (!body) return null;
  const candidate = body.element
    || (Array.isArray(body.elementDetails) ? body.elementDetails[0] : null);
  if (!candidate || typeof candidate !== 'object') return null;
  if (typeof candidate.customXPath !== 'string' || !candidate.customXPath.trim()) return null;
  return candidate as ElementDTO;
};

export type LocatorApplyResolution =
  | { status: 'stale' }
  | { status: 'error'; message: string }
  | { status: 'success'; element: ElementDTO };

export const resolvePageScannerLocatorApplyResponse = (
  body: Record<string, any> | null | undefined,
  pending: PendingLocatorApply | null,
): LocatorApplyResolution => {
  if (!pending || body?.requestId !== pending.requestId) return { status: 'stale' };
  if (body?.ok === false) {
    return {
      status: 'error',
      message: String(body?.message || body?.error || 'The backend refused the XPath change.'),
    };
  }
  if (body?.persisted !== true) {
    return {
      status: 'error',
      message: 'The backend did not confirm that the XPath was persisted. Refresh or rescan before retrying.',
    };
  }
  if (body?.elementKey !== pending.elementKey) {
    return {
      status: 'error',
      message: 'The XPath response did not match the selected scanned element. Refresh or rescan before retrying.',
    };
  }
  const element = authoritativeLocatorElementFromResponse(body);
  if (!element) {
    return {
      status: 'error',
      message: 'The backend acknowledged the request without returning the updated element. Refresh or rescan before retrying.',
    };
  }
  return { status: 'success', element };
};
