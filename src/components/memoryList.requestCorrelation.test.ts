import {
  classifyMemoryListResponse,
  createMemoryListRequestId,
  createPendingMemoryListRequest,
  type MemoryListRequestContext,
} from './memoryList.requestCorrelation';

const context: MemoryListRequestContext = {
  sessionId: 'botJobTasks',
  homeBankingId: 2,
  botJobId: 32,
  workspaceEpoch: 17,
  ownerEpoch: 'memory-owner-17',
};

test.each(['OPEN', 'SYNC'] as const)(
  'settles an exact %s failure even when the response omits workspaceEpoch',
  (operation) => {
    const pending = createPendingMemoryListRequest(operation, 'request-1', context);
    expect(classifyMemoryListResponse(
      { ok: false, requestId: 'request-1', message: 'Refused.' },
      operation,
      pending,
      context,
    )).toBe('FAILURE');
  },
);

test('ignores an exact failure carrying another supplied owner generation', () => {
  const pending = createPendingMemoryListRequest('SYNC', 'request-1', context);
  expect(classifyMemoryListResponse(
    { ok: false, requestId: 'request-1', workspaceEpoch: 18 },
    'SYNC',
    pending,
    context,
  )).toBe('IGNORE');
});

test('adds a monotonic sequence so same-time requests remain unique', () => {
  expect(createMemoryListRequestId('SYNC', 1, 1000))
    .not.toBe(createMemoryListRequestId('SYNC', 2, 1000));
});

test('ignores a response after the active owner generation changes', () => {
  const pending = createPendingMemoryListRequest('SYNC', 'request-1', context);
  expect(classifyMemoryListResponse(
    { ok: false, requestId: 'request-1' },
    'SYNC',
    pending,
    { ...context, workspaceEpoch: 18 },
  )).toBe('IGNORE');
});

test('ignores a different request or operation', () => {
  const pending = createPendingMemoryListRequest('OPEN', 'request-1', context);
  expect(classifyMemoryListResponse(
    { ok: false, requestId: 'request-2' },
    'OPEN',
    pending,
    context,
  )).toBe('IGNORE');
  expect(classifyMemoryListResponse(
    { ok: false, requestId: 'request-1' },
    'SYNC',
    pending,
    context,
  )).toBe('IGNORE');
});

test('accepts only a successful response with the complete matching owner tuple', () => {
  const pending = createPendingMemoryListRequest('SYNC', 'request-1', context);
  const response = {
    ok: true,
    requestId: 'request-1',
    homeBankingId: 2,
    botJobId: 32,
    workspaceEpoch: 17,
    ownerEpoch: 'memory-owner-17',
  };
  expect(classifyMemoryListResponse(response, 'SYNC', pending, context)).toBe('SUCCESS');
  expect(classifyMemoryListResponse(
    { ...response, workspaceEpoch: 18 },
    'SYNC',
    pending,
    context,
  )).toBe('INVALID_SUCCESS');
  const missingEpoch = {
    ok: true,
    requestId: 'request-1',
    homeBankingId: 2,
    botJobId: 32,
    ownerEpoch: 'memory-owner-17',
  };
  expect(classifyMemoryListResponse(missingEpoch, 'SYNC', pending, context))
    .toBe('INVALID_SUCCESS');
});
