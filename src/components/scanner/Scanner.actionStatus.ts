import type { ScannerAction } from './Scanner.types';

export function scannerActionPendingStatus(action: ScannerAction): string {
  switch (action) {
    case 'REFRESH_STATE':
      return 'Refreshing scanner state';
    case 'REFRESH_PAGE':
      return 'Refreshing scanner browser page';
    case 'PAGE_SCANNER':
      return 'Scanning browser page';
    case 'PREVIOUS_TAB':
      return 'Switching to previous browser tab';
    case 'NEXT_TAB':
      return 'Switching to next browser tab';
    case 'PRE_LAUNCH':
      return 'Starting scanner Pre-Launch';
    case 'STOP_PRE_LAUNCH':
      return 'Stopping scanner Pre-Launch';
    case 'CLEAR_GRID':
      return 'Clearing scanner grid';
  }
}
