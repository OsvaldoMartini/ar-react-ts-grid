import {
  pageScannerCloseMessage,
  pageScannerRetargetDisposition,
  pageScannerRequestForResponse,
  pageScannerWorkspaceRetarget,
  pageScannerWorkspaceCloseReason,
} from './PageScanner.contract';
import { isPageScannerWorkspaceSession } from './Scanner.sessions';

const CURRENT_SESSION = 'page-scanner-123e4567-e89b-42d3-a456-426614174000';
const NEXT_SESSION = 'page-scanner-223e4567-e89b-42d3-a456-426614174000';

test('maps correlated Page Scanner responses to their request operations', () => {
  expect(pageScannerRequestForResponse('pageScanner.scanResponse')).toBe('pageScanner.scan');
  expect(pageScannerRequestForResponse('pageScanner.refreshResponse')).toBe('pageScanner.refresh');
  expect(pageScannerRequestForResponse('pageScanner.clearResponse')).toBe('pageScanner.clear');
  expect(pageScannerRequestForResponse('pageScanner.testElementResponse')).toBe('pageScanner.testElement');
  expect(pageScannerRequestForResponse('pageScanner.errorResponse')).toBeNull();
});

test('recognizes only terminal detached workspace reasons', () => {
  expect(pageScannerWorkspaceCloseReason({ reason: 'BOT_JOB_CLOSED' })).toBe('BOT_JOB_CLOSED');
  expect(pageScannerWorkspaceCloseReason({ closeReason: 'superseded' })).toBe('SUPERSEDED');
  expect(pageScannerWorkspaceCloseReason({ errorCode: 'EXPIRED' })).toBe('EXPIRED');
  expect(pageScannerWorkspaceCloseReason({ reason: 'USER_CLOSED' })).toBeNull();
  expect(pageScannerCloseMessage('EXPIRED')).toContain('expired');
});

test('accepts a cross-job Page Scanner retarget only from the current binding', () => {
  const retarget = pageScannerWorkspaceRetarget({
    previousSessionId: CURRENT_SESSION,
    sessionId: NEXT_SESSION,
    botJobId: 43,
    workspaceEpoch: 10,
  }, CURRENT_SESSION, isPageScannerWorkspaceSession);
  expect(retarget).toEqual({
    previousSessionId: CURRENT_SESSION,
    sessionId: NEXT_SESSION,
    botJobId: 43,
    workspaceEpoch: 10,
  });
  expect(pageScannerRetargetDisposition(retarget!, CURRENT_SESSION)).toBe('SWITCH_SESSION');
  expect(pageScannerWorkspaceRetarget({
    previousSessionId: NEXT_SESSION,
    sessionId: CURRENT_SESSION,
    botJobId: 43,
    workspaceEpoch: 10,
  }, CURRENT_SESSION, isPageScannerWorkspaceSession)).toBeNull();
});

test('accepts a same-session Page Scanner retarget as a focus-only signal', () => {
  const retarget = pageScannerWorkspaceRetarget({
    previousSessionId: CURRENT_SESSION,
    sessionId: CURRENT_SESSION,
    botJobId: 42,
    workspaceEpoch: 9,
  }, CURRENT_SESSION, isPageScannerWorkspaceSession);
  expect(retarget).toEqual({
    previousSessionId: CURRENT_SESSION,
    sessionId: CURRENT_SESSION,
    botJobId: 42,
    workspaceEpoch: 9,
  });
  expect(pageScannerRetargetDisposition(retarget!, CURRENT_SESSION)).toBe('FOCUS_ONLY');
});
