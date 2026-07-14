import { isMatchingScannerActionResponse } from './Scanner.responseMatching';
import type { ScannerResponse } from './Scanner.types';

function response(overrides: Partial<ScannerResponse> = {}): ScannerResponse {
  return {
    ok: true,
    botJobId: 42,
    requestId: 'action-1',
    action: 'PAGE_SCANNER',
    ...overrides,
  };
}

test('matches action response by request id and action', () => {
  expect(isMatchingScannerActionResponse(
    response(),
    { requestId: 'action-1', action: 'PAGE_SCANNER' },
  )).toBe(true);
});

test('matches backend failure without parsed action when request id is current', () => {
  expect(isMatchingScannerActionResponse(
    response({ ok: false, action: undefined }),
    { requestId: 'action-1', action: 'PAGE_SCANNER' },
  )).toBe(true);
});

test('rejects stale request id and conflicting action', () => {
  expect(isMatchingScannerActionResponse(
    response({ requestId: 'old-action' }),
    { requestId: 'action-1', action: 'PAGE_SCANNER' },
  )).toBe(false);
  expect(isMatchingScannerActionResponse(
    response({ action: 'CLEAR_GRID' }),
    { requestId: 'action-1', action: 'PAGE_SCANNER' },
  )).toBe(false);
});

test('rejects response when no action is pending', () => {
  expect(isMatchingScannerActionResponse(response(), null)).toBe(false);
});
