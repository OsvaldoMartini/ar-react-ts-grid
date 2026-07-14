import { scannerActionPendingStatus } from './Scanner.actionStatus';
import type { ScannerAction } from './Scanner.types';

test.each<[ScannerAction, string]>([
  ['REFRESH_STATE', 'Refreshing scanner state'],
  ['REFRESH_PAGE', 'Refreshing scanner browser page'],
  ['PAGE_SCANNER', 'Scanning browser page'],
  ['PREVIOUS_TAB', 'Switching to previous browser tab'],
  ['NEXT_TAB', 'Switching to next browser tab'],
  ['PRE_LAUNCH', 'Starting scanner Pre-Launch'],
  ['STOP_PRE_LAUNCH', 'Stopping scanner Pre-Launch'],
  ['CLEAR_GRID', 'Clearing scanner grid'],
])('returns pending status for %s', (action, expected) => {
  expect(scannerActionPendingStatus(action)).toBe(expected);
});
