import type {
  ScannerEnvelope,
  ScannerResponse,
  ScannerState,
} from './Scanner.types';
import {
  SCANNER_ACTION_RESPONSE,
  SCANNER_BOOTSTRAP_RESPONSE,
  SCANNER_OPERATIONS,
} from './Scanner.operations';

const EXECUTION_STATES = new Set([
  'UNKNOWN', 'IDLE', 'STARTING', 'RUNNING', 'STOPPING', 'PASSED', 'FAILED', 'INTERRUPTED',
]);

const BROWSER_STATES = new Set(['UNKNOWN', 'OPEN', 'CLOSED']);

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInteger(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum;
}

function hasBooleanFields(value: unknown, fields: string[]): boolean {
  return isRecord(value) && fields.every((field) => typeof value[field] === 'boolean');
}

function parseJsonObject(value: unknown): Record<string, any> | null {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(value) ? value : null;
}

function isBlock(value: unknown): boolean {
  return isRecord(value)
    && isInteger(value.id, 1)
    && isInteger(value.order, 0)
    && typeof value.name === 'string'
    && typeof value.active === 'boolean';
}

function isScannerState(value: unknown, expectedBotJobId: number): value is ScannerState {
  if (!isRecord(value)) return false;
  return isInteger(value.revision, 1)
    && isInteger(value.botJobId, 1)
    && value.botJobId === expectedBotJobId
    && typeof value.botJobName === 'string'
    && isInteger(value.homeBankingId, 1)
    && typeof value.environmentUrl === 'string'
    && Array.isArray(value.blocks)
    && value.blocks.every(isBlock)
    && isRecord(value.browser)
    && typeof value.browser.state === 'string'
    && BROWSER_STATES.has(value.browser.state)
    && typeof value.browser.activeUrl === 'string'
    && typeof value.browser.activeTitle === 'string'
    && isInteger(value.browser.openTabs, 0)
    && typeof value.browser.scannable === 'boolean'
    && isRecord(value.focus)
    && typeof value.focus.profile === 'string'
    && Array.isArray(value.focus.searchTerms)
    && value.focus.searchTerms.every((term: unknown) => typeof term === 'string')
    && isRecord(value.ocr)
    && typeof value.ocr.available === 'boolean'
    && typeof value.ocr.status === 'string'
    && hasBooleanFields(value.capabilities, [
      'canRefreshState',
      'canUsePageScanner',
      'canUseOcr',
      'canExecute',
      'canApplyElements',
    ])
    && typeof value.executionState === 'string'
    && EXECUTION_STATES.has(value.executionState);
}

export function parseScannerEnvelope(
  raw: string,
  expectedSessionId: string,
  expectedBotJobId: number,
): ScannerEnvelope | null {
  const outer = parseJsonObject(raw);
  if (!outer || outer.sessionId !== expectedSessionId) return null;
  const operationId = typeof outer.operationId === 'string' ? outer.operationId : '';
  if (!SCANNER_OPERATIONS.has(operationId)) return null;
  const body = parseJsonObject(outer.body) as ScannerResponse | null;
  if (!body || typeof body.botJobId !== 'number' || !Number.isInteger(body.botJobId)) return null;
  const responseFailure = operationId === SCANNER_BOOTSTRAP_RESPONSE || operationId === SCANNER_ACTION_RESPONSE;
  const failureWithoutState = responseFailure && body.ok === false && body.state == null && body.botJobId === -1;
  if (!failureWithoutState && (!isInteger(body.botJobId, 1) || body.botJobId !== expectedBotJobId)) return null;
  if (body.state != null && !isScannerState(body.state, expectedBotJobId)) return null;
  return {
    sessionId: expectedSessionId,
    operationId,
    homeBankingId: typeof outer.homeBankingId === 'number' ? outer.homeBankingId : undefined,
    body,
  };
}

export function reduceScannerState(
  current: ScannerState | null,
  incoming: ScannerState | null | undefined,
): ScannerState | null {
  if (!incoming || !isScannerState(incoming, incoming.botJobId)) return current;
  if (current && incoming.botJobId !== current.botJobId) return current;
  if (current && incoming.revision <= current.revision) return current;
  return incoming;
}
