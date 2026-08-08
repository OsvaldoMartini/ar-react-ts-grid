export type MemoryListRequestOperation = 'OPEN' | 'SYNC';

export type MemoryListRequestContext = Readonly<{
  sessionId: string;
  homeBankingId: number;
  botJobId: number;
  workspaceEpoch: number | null;
  ownerEpoch: string;
}>;

export type PendingMemoryListRequest = MemoryListRequestContext & Readonly<{
  requestId: string;
  operation: MemoryListRequestOperation;
}>;

export type MemoryListResponseDisposition =
  | 'IGNORE'
  | 'FAILURE'
  | 'SUCCESS'
  | 'INVALID_SUCCESS';

export const createPendingMemoryListRequest = (
  operation: MemoryListRequestOperation,
  requestId: string,
  context: MemoryListRequestContext,
): PendingMemoryListRequest => ({ operation, requestId, ...context });

export const createMemoryListRequestId = (
  operation: MemoryListRequestOperation,
  sequence: number,
  now = Date.now(),
): string => `memory-list-${now}-${sequence}-${operation.toLowerCase()}`;

const responseObject = (body: unknown): Record<string, unknown> | null => (
  body && typeof body === 'object' ? body as Record<string, unknown> : null
);

const responseText = (body: Record<string, unknown>, field: string): string => (
  typeof body[field] === 'string' ? String(body[field]).trim() : ''
);

const responsePositiveInteger = (
  body: Record<string, unknown>,
  field: string,
): number | null => {
  const value = Number(body[field]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

const sameContext = (
  pending: PendingMemoryListRequest,
  current: MemoryListRequestContext,
): boolean => pending.sessionId === current.sessionId
  && pending.homeBankingId === current.homeBankingId
  && pending.botJobId === current.botJobId
  && pending.workspaceEpoch === current.workspaceEpoch
  && pending.ownerEpoch === current.ownerEpoch;

const optionalFailureFieldMatches = (
  body: Record<string, unknown>,
  field: 'homeBankingId' | 'botJobId' | 'workspaceEpoch' | 'ownerEpoch',
  expected: string | number | null,
): boolean => {
  if (!(field in body)) return true;
  if (field === 'ownerEpoch') {
    return typeof expected === 'string'
      && Boolean(expected)
      && responseText(body, field) === expected;
  }
  return typeof expected === 'number'
    && expected > 0
    && responsePositiveInteger(body, field) === expected;
};

/**
 * Correlates one Memory List response without coupling UI state to transport parsing.
 * Exact-request failures settle immediately; only successful responses must prove the
 * complete current owner/workspace generation.
 */
export const classifyMemoryListResponse = (
  bodyValue: unknown,
  operation: MemoryListRequestOperation,
  pending: PendingMemoryListRequest | null,
  current: MemoryListRequestContext,
): MemoryListResponseDisposition => {
  const body = responseObject(bodyValue);
  if (
    !body
    || !pending
    || pending.operation !== operation
    || !sameContext(pending, current)
    || responseText(body, 'requestId') !== pending.requestId
  ) {
    return 'IGNORE';
  }

  if (body.ok === false) {
    return optionalFailureFieldMatches(body, 'homeBankingId', pending.homeBankingId)
      && optionalFailureFieldMatches(body, 'botJobId', pending.botJobId)
      && optionalFailureFieldMatches(body, 'workspaceEpoch', pending.workspaceEpoch)
      && optionalFailureFieldMatches(body, 'ownerEpoch', pending.ownerEpoch)
      ? 'FAILURE'
      : 'IGNORE';
  }
  if (body.ok !== true) return 'INVALID_SUCCESS';

  if (
    responsePositiveInteger(body, 'homeBankingId') !== pending.homeBankingId
    || responsePositiveInteger(body, 'botJobId') !== pending.botJobId
  ) {
    return 'INVALID_SUCCESS';
  }

  if (
    pending.workspaceEpoch !== null
    && responsePositiveInteger(body, 'workspaceEpoch') !== pending.workspaceEpoch
  ) {
    return 'INVALID_SUCCESS';
  }

  const responseOwnerEpoch = responseText(body, 'ownerEpoch');
  if (!responseOwnerEpoch || (pending.ownerEpoch && responseOwnerEpoch !== pending.ownerEpoch)) {
    return 'INVALID_SUCCESS';
  }
  return 'SUCCESS';
};
