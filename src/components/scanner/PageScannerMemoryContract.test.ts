import { pageScannerMemoryWorkspaceEpoch } from './PageScannerMemoryContract';

test('static scanners assert their exact Bot Job workspace generation', () => {
  expect(pageScannerMemoryWorkspaceEpoch('scannerGrid', 7)).toBe(7);
  expect(pageScannerMemoryWorkspaceEpoch('preScannerGrid', 8)).toBe(8);
  expect(pageScannerMemoryWorkspaceEpoch('preScannerGrid', 0)).toBe(0);
});

test('detached Page Scanner leaves generation authority with its backend binding', () => {
  expect(pageScannerMemoryWorkspaceEpoch(
    'page-scanner-073aace2-a0ee-425f-9aa5-aef63f93596b',
    9,
  )).toBeNull();
});
