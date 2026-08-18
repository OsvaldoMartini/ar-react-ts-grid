import type { ElementDTO } from '../instructionsMockData';
import {
  PAGE_SCANNER_ELEMENT_RENAME_OPERATION,
  normalizePageScannerClientNamed,
  pageScannerElementRenameMessage,
  replacePageScannerElementAlias,
  replacePageScannerGroupedElementAlias,
  resolvePageScannerElementRenameResponse,
} from './PageScannerElementRename';
import { pageScannerLocatorElementKey } from './PageScannerLocator';

const element = (id = 7): ElementDTO => ({
  id,
  typeElement: 'input',
  tagName: 'input',
  xPath: "//input[@id='account']",
  someText: 'Account',
  definedName: 'account',
  clientNamed: null,
  attribId: 'account',
  attribName: '',
  coordinates: '',
  attributeData: [],
  customXPath: '',
  cssSelector: 'input#account',
  iFrameXPath: '',
  attributeValue: '',
  attributeType: '',
  autoScroll: '',
  autoEnter: '',
});

test('builds a reduced detached rename contract', () => {
  const target = element();
  const pending = { requestId: 'rename-1', elementKey: pageScannerLocatorElementKey(target), target };
  const message = pageScannerElementRenameMessage({
    sessionId: 'page-scanner-abc', homeBankingId: 2, botJobId: 29,
  }, pending, 'Primary account');

  expect(message.type).toBe(PAGE_SCANNER_ELEMENT_RENAME_OPERATION);
  expect(JSON.parse(message.body)).toEqual({
    contractVersion: 1,
    requestId: 'rename-1',
    elementKey: pending.elementKey,
    runtimeMode: 'JAVA_V1',
    identity: {
      xPath: target.xPath,
      iFrameXPath: '',
      attribId: 'account',
      cssSelector: 'input#account',
    },
    clientNamed: 'Primary account',
  });

  const v2Message = pageScannerElementRenameMessage({
    sessionId: 'page-scanner-abc', homeBankingId: 2, botJobId: 29,
  }, pending, 'Primary account', 'TYPESCRIPT_PLAYWRIGHT_V2');
  expect(JSON.parse(v2Message.body).runtimeMode).toBe('TYPESCRIPT_PLAYWRIGHT_V2');
});

test('normalizes canonical names to a cleared override', () => {
  const target = element();
  expect(normalizePageScannerClientNamed('', target)).toBeNull();
  expect(normalizePageScannerClientNamed(' account ', target)).toBeNull();
  expect(normalizePageScannerClientNamed('Account', target)).toBeNull();
  expect(normalizePageScannerClientNamed('Personal account', target)).toBe('Personal account');
});

test('accepts only the correlated authoritative one-row acknowledgement', () => {
  const target = element();
  const pending = { requestId: 'rename-2', elementKey: pageScannerLocatorElementKey(target), target };
  expect(resolvePageScannerElementRenameResponse({
    requestId: 'stale', ok: true, persisted: true, affectedRows: 1,
  }, pending)).toEqual({ status: 'stale' });
  expect(resolvePageScannerElementRenameResponse({
    requestId: pending.requestId,
    elementKey: pending.elementKey,
    ok: true,
    persisted: true,
    affectedRows: 0,
    clientNamed: 'Personal account',
  }, pending)).toMatchObject({ status: 'error' });
  expect(resolvePageScannerElementRenameResponse({
    requestId: pending.requestId,
    elementKey: pending.elementKey,
    ok: true,
    persisted: true,
    affectedRows: 1,
    clientNamed: 'Personal account',
  }, pending)).toEqual({ status: 'success', clientNamed: 'Personal account' });
});

test('reconciles the same alias in grid, grouped rows, and staged memory without changing identity', () => {
  const target = element();
  const sibling = { ...element(8), xPath: "//input[@id='other']", attribId: 'other' };
  const key = pageScannerLocatorElementKey(target);
  const grid = replacePageScannerElementAlias([target, sibling], key, 'Personal account');
  const grouped = replacePageScannerGroupedElementAlias({
    input: { tagName: 'input', elements: [target, sibling] },
  }, key, 'Personal account');

  expect(grid.replaced).toBe(true);
  expect(grid.elements[0].clientNamed).toBe('Personal account');
  expect(grid.elements[0].xPath).toBe(target.xPath);
  expect(grid.elements[1]).toBe(sibling);
  expect(grouped.input.elements[0].clientNamed).toBe('Personal account');
  expect(pageScannerLocatorElementKey(grid.elements[0])).toBe(key);
});
