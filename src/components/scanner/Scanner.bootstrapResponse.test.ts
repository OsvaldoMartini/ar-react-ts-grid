import {
  isMatchingScannerBootstrapResponse,
  scannerBootstrapResponseStatus,
} from './Scanner.bootstrapResponse';
import { scannerState } from './Scanner.testUtils';
import type { ScannerResponse } from './Scanner.types';

function response(overrides: Partial<ScannerResponse> = {}): ScannerResponse {
  return {
    ok: true,
    botJobId: 42,
    requestId: 'bootstrap-1',
    state: scannerState(),
    ...overrides,
  };
}

test('matches bootstrap response by current request id', () => {
  expect(isMatchingScannerBootstrapResponse(response(), 'bootstrap-1')).toBe(true);
  expect(isMatchingScannerBootstrapResponse(response(), 'old-bootstrap')).toBe(false);
  expect(isMatchingScannerBootstrapResponse(response(), null)).toBe(false);
});

test('returns success status for loaded scanner state', () => {
  expect(scannerBootstrapResponseStatus(response({ message: 'loaded' }))).toEqual({
    message: 'loaded',
    tone: 'success',
  });
  expect(scannerBootstrapResponseStatus(response({ message: undefined }))).toEqual({
    message: 'Scanner state loaded',
    tone: 'success',
  });
});

test('returns error status for failed bootstrap response', () => {
  expect(scannerBootstrapResponseStatus(response({
    ok: false,
    state: null,
    message: 'bad request',
  }))).toEqual({
    message: 'bad request',
    tone: 'error',
  });
  expect(scannerBootstrapResponseStatus(response({
    ok: false,
    state: null,
    message: undefined,
  }))).toEqual({
    message: 'Could not load scanner state',
    tone: 'error',
  });
});
