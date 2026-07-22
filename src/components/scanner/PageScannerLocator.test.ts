import type { ElementDTO } from '../instructionsMockData';
import {
  authoritativeLocatorElementFromResponse,
  PAGE_SCANNER_LOCATOR_APPLY_OPERATION,
  PAGE_SCANNER_LOCATOR_GENERATE_OPERATION,
  pageScannerLocatorApplyMessage,
  pageScannerLocatorElementKey,
  pageScannerLocatorGenerateMessage,
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
