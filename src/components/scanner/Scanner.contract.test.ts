import { parseScannerEnvelope, reduceScannerState } from './Scanner.contract';
import type { ScannerState } from './Scanner.types';
import { scannerState } from './Scanner.testUtils';

const state = (revision: number): ScannerState => scannerState({ revision });

test('parses scanner envelopes and rejects wrong session or job', () => {
  const body = { ok: true, botJobId: 42, requestId: 'scanner-1', state: state(1) };
  const envelope = {
    sessionId: 'scannerGrid',
    operationId: 'scanner.bootstrapResponse',
    body: JSON.stringify(body),
  };

  expect(parseScannerEnvelope(JSON.stringify(envelope), 'scannerGrid', 42)?.body.state?.revision).toBe(1);
  expect(parseScannerEnvelope(JSON.stringify(envelope), 'preScannerGrid', 42)).toBeNull();
  expect(parseScannerEnvelope(JSON.stringify(envelope), 'scannerGrid', 43)).toBeNull();
});

test('scanner state reducer rejects stale revisions', () => {
  expect(reduceScannerState(state(3), state(2))).toEqual(state(3));
  expect(reduceScannerState(state(3), state(3))).toEqual(state(3));
  expect(reduceScannerState(state(3), state(4))).toEqual(state(4));
});

test('rejects malformed scanner state', () => {
  const malformed = {
    sessionId: 'scannerGrid',
    operationId: 'scanner.state',
    body: JSON.stringify({ ok: true, botJobId: 42, state: { ...state(1), capabilities: {} } }),
  };

  expect(parseScannerEnvelope(JSON.stringify(malformed), 'scannerGrid', 42)).toBeNull();
});

test('parses structured scanner failure without state', () => {
  const envelope = {
    sessionId: 'scannerGrid',
    operationId: 'scanner.actionResponse',
    body: JSON.stringify({
      ok: false,
      botJobId: 42,
      requestId: 'scanner-fail-1',
      errorCode: 'INVALID_SCANNER_REQUEST',
      message: 'Scanner request body is required',
    }),
  };

  const parsed = parseScannerEnvelope(JSON.stringify(envelope), 'scannerGrid', 42);

  expect(parsed?.body.ok).toBe(false);
  expect(parsed?.body.state).toBeUndefined();
  expect(parsed?.body.errorCode).toBe('INVALID_SCANNER_REQUEST');
});

test('rejects unknown scanner browser states', () => {
  const malformed = {
    sessionId: 'scannerGrid',
    operationId: 'scanner.state',
    body: JSON.stringify({
      ok: true,
      botJobId: 42,
      state: { ...state(1), browser: { ...state(1).browser, state: 'DRIFTED' } },
    }),
  };

  expect(parseScannerEnvelope(JSON.stringify(malformed), 'scannerGrid', 42)).toBeNull();
});
