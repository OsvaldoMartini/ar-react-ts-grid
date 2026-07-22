import type { ElementDTO } from '../instructionsMockData';

export const PAGE_SCANNER_LOCATOR_GENERATE_OPERATION = 'pageScanner.locator.generate';
export const PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE = 'pageScanner.locator.generateResponse';
export const PAGE_SCANNER_LOCATOR_APPLY_OPERATION = 'pageScanner.locator.apply';
export const PAGE_SCANNER_LOCATOR_APPLY_RESPONSE = 'pageScanner.locator.applyResponse';

export type LocatorResult = {
  controlIndex?: number;
  tagName: string;
  controlKind: string;
  label: string;
  someText?: string;
  definedName?: string;
  attribId?: string;
  attribName?: string;
  attributeType?: string;
  attributeValue?: string;
  attributeData?: Array<{ name: string; value: string }>;
  xpath: string;
  css: string;
  cssSelector?: string;
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

const normalizeGeneratedKeyPart = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase();

export const pageScannerGeneratedElementKey = (element: ElementDTO): string => [
  normalizeGeneratedKeyPart(element.customXPath || element.xPath),
  normalizeGeneratedKeyPart(element.cssSelector),
  normalizeGeneratedKeyPart(element.tagName),
  normalizeGeneratedKeyPart(element.typeElement),
  normalizeGeneratedKeyPart(element.attributeType),
  normalizeGeneratedKeyPart(element.attributeValue),
  normalizeGeneratedKeyPart(element.attribId),
  normalizeGeneratedKeyPart(element.attribName),
  normalizeGeneratedKeyPart(element.someText || element.definedName || element.clientNamed),
].join('||');

export const pageScannerLocatorElementLabel = (element: ElementDTO): string => {
  const displayName = element.clientNamed
    || element.definedName
    || element.someText
    || element.attribName
    || element.attribId
    || element.tagName
    || `Element ${element.id}`;
  const cssSelector = element.cssSelector || '';
  const cssSuffix = cssSelector ? ` - CSS: ${cssSelector}` : '';
  return `${displayName} - <${element.tagName || 'element'}>${cssSuffix}`;
};

const locatorTypeElement = (result: LocatorResult): string => {
  const tag = (result.tagName || '').toLowerCase();
  const kind = (result.controlKind || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || kind === 'text-input' || kind === 'text-area') return 'input';
  if (tag === 'a' || tag === 'link') return 'a';
  if (kind === 'button' || kind === 'select' || kind === 'checkbox' || kind === 'radio') return 'button';
  return tag || 'button';
};

export const elementDTOFromLocatorResult = (
  result: LocatorResult,
  index: number,
): ElementDTO => {
  const someText = result.someText || result.label || result.definedName || result.tagName || '';
  const definedName = result.definedName || someText || result.tagName || `generated_element_${index + 1}`;
  const generatedReferences = [
    { name: 'generated-source', value: 'locator-generator' },
    { name: 'cssSelector', value: result.cssSelector || result.css || '' },
    { name: 'generated-xpath', value: result.xpath || '' },
  ];
  return {
    id: -1 * (index + 1),
    typeElement: locatorTypeElement(result),
    tagName: result.tagName || 'button',
    xPath: result.xpath,
    someText,
    attribId: result.attribId || '',
    attribName: result.attribName || '',
    coordinates: '',
    attributeData: [
      ...(Array.isArray(result.attributeData) ? result.attributeData : []),
      ...generatedReferences,
    ].filter((item) => item.value.length > 0),
    customXPath: result.xpath,
    iFrameXPath: '',
    attributeValue: result.attributeValue || '',
    attributeType: result.attributeType || result.controlKind || result.tagName || '',
    autoScroll: '',
    autoEnter: '',
    active: true,
    definedName,
    clientNamed: null,
    cssSelector: result.cssSelector || result.css,
  };
};

const nextTemporaryElementId = (usedIds: Set<number>, requestedId: number | null | undefined): number => {
  if (typeof requestedId === 'number' && Number.isFinite(requestedId) && requestedId < 0 && !usedIds.has(requestedId)) {
    usedIds.add(requestedId);
    return requestedId;
  }
  let nextId = -1;
  while (usedIds.has(nextId)) nextId -= 1;
  usedIds.add(nextId);
  return nextId;
};

export const mergeGeneratedLocatorElements = (
  currentElements: ElementDTO[],
  generatedElements: ElementDTO[],
): { elements: ElementDTO[]; accepted: ElementDTO[] } => {
  const usedIds = new Set(
    currentElements
      .map((element) => element.id)
      .filter((id) => Number.isFinite(id)),
  );
  const nextElements = [...currentElements];
  const accepted: ElementDTO[] = [];

  generatedElements.forEach((candidate) => {
    const key = pageScannerGeneratedElementKey(candidate);
    const existingIndex = nextElements.findIndex(
      (element) => pageScannerGeneratedElementKey(element) === key,
    );

    if (existingIndex >= 0) {
      const existing = nextElements[existingIndex];
      const merged = {
        ...existing,
        ...candidate,
        id: existing.id,
        active: existing.active ?? candidate.active ?? true,
      };
      nextElements[existingIndex] = merged;
      accepted.push(merged);
      return;
    }

    const inserted = {
      ...candidate,
      id: nextTemporaryElementId(usedIds, candidate.id),
      active: candidate.active ?? true,
    };
    nextElements.push(inserted);
    accepted.push(inserted);
  });

  return { elements: nextElements, accepted };
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
