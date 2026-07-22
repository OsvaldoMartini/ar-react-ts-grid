import type { ElementDTO } from '../instructionsMockData';
import {
  authoritativeLocatorElementFromResponse,
  PAGE_SCANNER_LOCATOR_APPLY_OPERATION,
  PAGE_SCANNER_LOCATOR_GENERATE_OPERATION,
  pageScannerLocatorApplyMessage,
  pageScannerLocatorElementKey,
  pageScannerLocatorElementLabel,
  pageScannerLocatorGenerateMessage,
  elementDTOFromLocatorResult,
  mergeGeneratedLocatorElements,
  replacePageScannerLocatorElement,
  replacePageScannerLocatorGroupedElement,
  resolvePageScannerLocatorApplyResponse,
} from './PageScannerLocator';

const element = (id: number, customXPath = ''): ElementDTO => ({
  id,
  typeElement: 'button',
  tagName: 'button',
  xPath: `//button[${id}]`,
  someText: `Button ${id}`,
  attribId: '',
  attribName: '',
  coordinates: '',
  attributeData: [],
  customXPath,
  iFrameXPath: '',
  attributeValue: '',
  attributeType: '',
  autoScroll: '',
  autoEnter: '',
});

test('builds canonical locator envelopes for the exact detached session', () => {
  const scope = {
    sessionId: 'page-scanner-123e4567-e89b-42d3-a456-426614174000',
    homeBankingId: 7,
    botJobId: 41,
  };
  const target = element(2);
  const key = pageScannerLocatorElementKey(target);
  const generate = pageScannerLocatorGenerateMessage(scope, 'generate-1', '<button>Go</button>');
  const apply = pageScannerLocatorApplyMessage(
    scope,
    { requestId: 'apply-1', elementKey: key, xpath: "//button[@test-id='go']", target },
    target,
  );

  expect(generate.type).toBe(PAGE_SCANNER_LOCATOR_GENERATE_OPERATION);
  expect(generate.sessionId).toBe(scope.sessionId);
  expect(JSON.parse(generate.body)).toEqual({
    requestId: 'generate-1',
    html: '<button>Go</button>',
  });
  expect(apply.type).toBe(PAGE_SCANNER_LOCATOR_APPLY_OPERATION);
  expect(apply.sessionId).toBe(scope.sessionId);
  expect(JSON.parse(apply.body)).toEqual({
    requestId: 'apply-1',
    elementKey: key,
    xpath: "//button[@test-id='go']",
    elementDetails: [target],
  });
});

test('converts a generated locator into an ElementDTO candidate with CSS and names', () => {
  const generated = elementDTOFromLocatorResult({
    controlIndex: 0,
    tagName: 'button',
    controlKind: 'button',
    label: 'Avanti',
    someText: 'Avanti',
    definedName: 'avanti',
    attribId: '',
    attribName: '',
    attributeType: 'test-id',
    attributeValue: 'next',
    attributeData: [{ name: 'test-id', value: 'next' }],
    xpath: "//button[@test-id='next']",
    css: "button[test-id='next']",
    cssSelector: "button[test-id='next']",
    positional: false,
    note: 'Unique by test-id.',
  }, 0);

  expect(generated.customXPath).toBe("//button[@test-id='next']");
  expect(generated.cssSelector).toBe("button[test-id='next']");
  expect(generated.someText).toBe('Avanti');
  expect(generated.definedName).toBe('avanti');
  expect(generated.attributeType).toBe('test-id');
  expect(generated.active).toBe(true);
  expect(generated.attributeData).toEqual(expect.arrayContaining([{ name: 'test-id', value: 'next' }]));
  expect(pageScannerLocatorElementLabel(generated)).toContain("CSS: button[test-id='next']");
});

test('merges generated locator candidates into scanner grid with stable active state', () => {
  const nextButton = elementDTOFromLocatorResult({
    controlIndex: 0,
    tagName: 'button',
    controlKind: 'button',
    label: 'Avanti',
    someText: 'Avanti',
    definedName: 'avanti',
    attribId: '',
    attribName: '',
    attributeType: 'test-id',
    attributeValue: 'next',
    attributeData: [{ name: 'test-id', value: 'next' }],
    xpath: "//button[@test-id='next']",
    css: "button[test-id='next']",
    cssSelector: "button[test-id='next']",
    positional: false,
    note: 'Unique by test-id.',
  }, 0);
  const cancelButton = elementDTOFromLocatorResult({
    controlIndex: 1,
    tagName: 'button',
    controlKind: 'button',
    label: 'Annulla',
    someText: 'Annulla',
    definedName: 'annulla',
    attribId: '',
    attribName: '',
    attributeType: 'test-id',
    attributeValue: 'cancel',
    attributeData: [{ name: 'test-id', value: 'cancel' }],
    xpath: "//button[@test-id='cancel']",
    css: "button[test-id='cancel']",
    cssSelector: "button[test-id='cancel']",
    positional: false,
    note: 'Unique by test-id.',
  }, 1);

  const existingGenerated = { ...nextButton, id: -9, active: false };
  const merged = mergeGeneratedLocatorElements(
    [existingGenerated],
    [nextButton, cancelButton],
  );

  expect(merged.elements).toHaveLength(2);
  expect(merged.accepted).toHaveLength(2);
  expect(merged.elements[0].id).toBe(-9);
  expect(merged.elements[0].active).toBe(false);
  expect(merged.elements[1].id).toBe(-2);
  expect(merged.elements[1].active).toBe(true);
});

test('synchronizes only the authoritative target in grid, grouped, and memory state', () => {
  const first = element(1);
  const target = element(2);
  const authoritative = element(2, "//button[@test-id='next']");
  const key = pageScannerLocatorElementKey(target);

  const grid = replacePageScannerLocatorElement([first, target], key, authoritative);
  const grouped = replacePageScannerLocatorGroupedElement({
    button: { tagName: 'button', elements: [first, target] },
  }, key, authoritative);
  const memory = replacePageScannerLocatorElement([target], key, authoritative);

  expect(grid.replaced).toBe(true);
  expect(grid.elements[0]).toBe(first);
  expect(grid.elements[1].customXPath).toBe("//button[@test-id='next']");
  expect(grouped.button.elements[1].customXPath).toBe("//button[@test-id='next']");
  expect(memory.elements[0].customXPath).toBe("//button[@test-id='next']");
  expect(target.customXPath).toBe('');
});

test('accepts only a backend element with a non-empty authoritative XPath', () => {
  const updated = element(2, '//button[2]');
  expect(authoritativeLocatorElementFromResponse({ element: updated })).toEqual(updated);
  expect(authoritativeLocatorElementFromResponse({ elementDetails: [updated] })).toEqual(updated);
  expect(authoritativeLocatorElementFromResponse({ element: element(2) })).toBeNull();
  expect(authoritativeLocatorElementFromResponse({ customXPath: '//button[2]' })).toBeNull();
});

test('requires exact correlation and persisted confirmation before accepting authoritative apply', () => {
  const target = element(2);
  const authoritative = element(2, "//button[@test-id='next']");
  const pending = {
    requestId: 'apply-2',
    elementKey: pageScannerLocatorElementKey(target),
    xpath: authoritative.customXPath,
    target,
  };

  expect(resolvePageScannerLocatorApplyResponse({
    requestId: 'stale-request',
    ok: true,
    persisted: true,
    elementKey: pending.elementKey,
    element: authoritative,
  }, pending)).toEqual({ status: 'stale' });
  expect(resolvePageScannerLocatorApplyResponse({
    requestId: pending.requestId,
    ok: true,
    persisted: false,
    elementKey: pending.elementKey,
    element: authoritative,
  }, pending)).toMatchObject({ status: 'error' });
  expect(resolvePageScannerLocatorApplyResponse({
    requestId: pending.requestId,
    ok: true,
    persisted: true,
    elementKey: pending.elementKey,
    element: authoritative,
  }, pending)).toEqual({ status: 'success', element: authoritative });
});
