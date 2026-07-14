import { parseScannerEnvelope, reduceScannerState } from './Scanner.contract';
import type { ScannerState } from './Scanner.types';

const state = (revision: number): ScannerState => ({
  revision,
  botJobId: 42,
  botJobName: 'Apre Acconto',
  homeBankingId: 2,
  environmentUrl: 'https://bank.example',
  blocks: [{ id: 100, order: 1, name: 'Login', active: true }],
  browser: { state: 'UNKNOWN', activeUrl: '', activeTitle: '', openTabs: 0, scannable: false },
  focus: { profile: 'default', searchTerms: [] },
  ocr: { available: true, status: 'IDLE' },
  capabilities: {
    canRefreshState: true,
    canUsePageScanner: true,
    canUseOcr: true,
    canExecute: true,
    canApplyElements: true,
  },
  executionState: 'IDLE',
});

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
