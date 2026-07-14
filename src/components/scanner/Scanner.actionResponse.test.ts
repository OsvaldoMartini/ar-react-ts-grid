import { scannerActionResponseStatus } from './Scanner.actionResponse';
import { scannerState } from './Scanner.testUtils';
import type { ScannerResponse } from './Scanner.types';

function response(overrides: Partial<ScannerResponse> = {}): ScannerResponse {
  return {
    ok: true,
    botJobId: 42,
    requestId: 'action-1',
    action: 'PAGE_SCANNER',
    state: scannerState(),
    ...overrides,
  };
}

test('returns success status for completed action response', () => {
  expect(scannerActionResponseStatus(response({ message: 'scan done' }))).toEqual({
    message: 'scan done',
    tone: 'success',
  });
  expect(scannerActionResponseStatus(response({ message: undefined }))).toEqual({
    message: 'Scanner action completed',
    tone: 'success',
  });
});

test('returns error status for failed action response', () => {
  expect(scannerActionResponseStatus(response({
    ok: false,
    state: null,
    message: 'bad action',
  }))).toEqual({
    message: 'bad action',
    tone: 'error',
  });
  expect(scannerActionResponseStatus(response({
    ok: false,
    state: null,
    message: undefined,
  }))).toEqual({
    message: 'Scanner action failed',
    tone: 'error',
  });
});
