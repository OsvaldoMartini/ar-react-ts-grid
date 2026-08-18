import {
  classifyMemoryListCommandResponse,
  createPendingMemoryListCommand,
  memoryListCommandGeneration,
  sameMemoryListCommandGeneration,
  type MemoryListCommandGeneration,
} from './memoryList.commandCorrelation';

const generation: MemoryListCommandGeneration = {
  homeBankingId: 2,
  botJobId: 32,
  workspaceEpoch: 17,
  ownerEpoch: 'memory-owner-17',
};

const pending = createPendingMemoryListCommand('command-1', 'APPLY', generation);

test('extracts and compares the complete Memory List command generation', () => {
  expect(memoryListCommandGeneration(generation)).toEqual(generation);
  expect(memoryListCommandGeneration({ ...generation, workspaceEpoch: 0 })).toBeNull();
  expect(sameMemoryListCommandGeneration(generation, { ...generation })).toBe(true);
  expect(sameMemoryListCommandGeneration(generation, { ...generation, botJobId: 33 })).toBe(false);
});

test('settles an exact failure only while its owner generation remains active', () => {
  expect(classifyMemoryListCommandResponse(
    { ok: false, requestId: 'command-1', message: 'Refused.' },
    pending,
    generation,
  )).toBe('FAILURE');
  expect(classifyMemoryListCommandResponse(
    { ok: false, requestId: 'command-1' },
    pending,
    { ...generation, ownerEpoch: 'memory-owner-18' },
  )).toBe('IGNORE');
});

test('accepts a successful response only with the complete matching tuple', () => {
  const response = { ok: true, requestId: 'command-1', ...generation };
  expect(classifyMemoryListCommandResponse(response, pending, generation)).toBe('SUCCESS');
  expect(classifyMemoryListCommandResponse(
    { ...response, botJobId: 33 },
    pending,
    generation,
  )).toBe('INVALID_SUCCESS');
  const missingOwner = {
    ok: true,
    requestId: 'command-1',
    homeBankingId: 2,
    botJobId: 32,
    workspaceEpoch: 17,
  };
  expect(classifyMemoryListCommandResponse(missingOwner, pending, generation))
    .toBe('INVALID_SUCCESS');
});

test('ignores stale request IDs and failures carrying another generation', () => {
  expect(classifyMemoryListCommandResponse(
    { ok: true, requestId: 'command-2', ...generation },
    pending,
    generation,
  )).toBe('IGNORE');
  expect(classifyMemoryListCommandResponse(
    { ok: false, requestId: 'command-1', workspaceEpoch: 18 },
    pending,
    generation,
  )).toBe('IGNORE');
});
