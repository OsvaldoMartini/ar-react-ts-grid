import {
  executionRelationshipPreflight,
  type RunScope,
} from './executionRelationshipPreflight';
import {
  buildInstructionRelationshipGraph,
  type RelationshipBlockFact,
  type RelationshipInstructionFact,
  type RelationshipOwner,
  type RelationshipVariableFact,
} from './instructionRelationshipGraph';

const OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 5,
};

const instruction = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  actions: string,
  overrides: Partial<RelationshipInstructionFact> = {},
): RelationshipInstructionFact => ({
  owner: OWNER,
  id,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  actions,
  tagName: null,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  instructionActive: true,
  blockActive: true,
  ...overrides,
});

const block = (
  id: number,
  order: number,
  active = true,
): RelationshipBlockFact => ({
  owner: OWNER,
  id,
  order,
  active,
});

const variable = (
  id: number,
  ownerInstructionId: number | null,
): RelationshipVariableFact => ({
  owner: OWNER,
  id,
  type: '$String',
  ownerInstructionId,
});

const run = (
  instructions: RelationshipInstructionFact[],
  runScope: RunScope = { kind: 'ALL' },
  variables: RelationshipVariableFact[] = [],
  blocks: RelationshipBlockFact[] = [block(10, 1), block(20, 2)],
) => executionRelationshipPreflight(
  buildInstructionRelationshipGraph({
    owner: OWNER,
    instructions,
    variables,
    blocks,
  }),
  runScope,
);

const issueFor = (
  result: ReturnType<typeof executionRelationshipPreflight>,
  instructionId: number,
  code: string,
) => result.issues.find(issue =>
  issue.instructionId === instructionId && issue.code === code);

describe('executionRelationshipPreflight', () => {
  it('returns exact active row IDs for a valid owner-scoped execution graph', () => {
    const result = run([
      instruction(1, 10, 1, 1, 'O', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(3, 10, 1, 3, 'E', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(4, 10, 1, 4, 'SET', {
        parentId: 1,
        variableId: 101,
      }),
      instruction(5, 10, 1, 5, 'CK', {
        parentId: 1,
        variableId: 101,
      }),
      instruction(6, 10, 1, 6, 'IF', { parentId: 6 }),
      instruction(7, 10, 1, 7, 'ENDIF', { parentId: 6 }),
      instruction(8, 10, 1, 8, 'LOOP', { parentId: 1 }),
      instruction(9, 10, 1, 9, 'GOTO', { parentBlockId: 20 }),
      instruction(10, 20, 2, 1, 'O'),
    ], { kind: 'ALL' }, [
      variable(100, 1),
      variable(101, null),
    ]);

    expect(result).toMatchObject({
      status: 'READY',
      ready: true,
      owner: OWNER,
      reachableBlockIds: [10, 20],
      reachableInstructionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      issues: [],
    });
  });

  it('ignores broken inactive instructions and instructions in inactive Blocks', () => {
    const result = run([
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'GET', {
        instructionActive: false,
      }),
      instruction(3, 20, 2, 1, 'LOOP', {
        blockActive: false,
      }),
    ], { kind: 'ALL' }, [], [
      block(10, 1),
      block(20, 2, false),
    ]);

    expect(result.ready).toBe(true);
    expect(result.reachableBlockIds).toEqual([10]);
    expect(result.reachableInstructionIds).toEqual([1]);
  });

  it('applies ONE, FROM_BLOCK, and ALL to only the requested active rows', () => {
    const rows = [
      instruction(11, 10, 1, 1, 'GET', { variableId: 100 }),
      instruction(21, 20, 2, 1, 'O'),
      instruction(31, 30, 3, 1, 'LOOP'),
    ];
    const blocks = [block(10, 1), block(20, 2), block(30, 3)];
    const variables = [variable(100, null)];

    const one = run(rows, { kind: 'ONE', selectedBlockId: 20 }, variables, blocks);
    const from = run(
      rows,
      { kind: 'FROM_BLOCK', selectedBlockId: 20 },
      variables,
      blocks,
    );
    const all = run(rows, { kind: 'ALL' }, variables, blocks);

    expect(one.ready).toBe(true);
    expect(one.reachableInstructionIds).toEqual([21]);
    expect(from.reachableBlockIds).toEqual([20, 30]);
    expect(issueFor(from, 31, 'MISSING_LOOP_ANCHOR')).toBeDefined();
    expect(from.issues.some(issue => issue.instructionId === 11)).toBe(false);
    expect(issueFor(all, 11, 'MISSING_ELEMENT_TARGET')).toBeDefined();
    expect(issueFor(all, 31, 'MISSING_LOOP_ANCHOR')).toBeDefined();
  });

  it('blocks GOTO and EXCEL GOTO targets equal to their containing Block', () => {
    const result = run([
      instruction(1, 10, 1, 1, 'GOTO', { parentBlockId: 10 }),
      instruction(2, 20, 2, 1, 'EXCEL GOTO', { parentBlockId: 20 }),
    ]);

    expect(issueFor(
      result,
      1,
      'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
    )).toMatchObject({
      kind: 'BLOCK_TARGET',
      blockId: 10,
      message: 'GOTO Instruction #1 destination must differ from containing Block #10.',
    });
    expect(issueFor(
      result,
      2,
      'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
    )).toBeDefined();
  });

  it('adds a valid GOTO destination to ONE scope before validating it', () => {
    const result = run([
      instruction(11, 10, 1, 1, 'LOOP'),
      instruction(21, 20, 2, 1, 'GOTO', { parentBlockId: 10 }),
    ], { kind: 'ONE', selectedBlockId: 20 });

    expect(result.reachableBlockIds).toEqual([10, 20]);
    expect(issueFor(result, 11, 'MISSING_LOOP_ANCHOR')).toBeDefined();
  });

  it('uses the existing LOOP relationship edge and exact parentId rules', () => {
    const result = run([
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'LOOP', { parentId: 1 }),
      instruction(3, 10, 1, 3, 'REFRESH_LOOP'),
    ]);

    expect(result.issues.some(issue => issue.instructionId === 2)).toBe(false);
    expect(issueFor(result, 3, 'MISSING_LOOP_ANCHOR')).toMatchObject({
      instructionId: 3,
      kind: 'LOOP_ANCHOR',
    });
  });

  it('requires a reachable active GET or SET writer before E and CK', () => {
    const rows = [
      instruction(1, 10, 1, 1, 'O', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(3, 20, 2, 1, 'O'),
      instruction(4, 20, 2, 2, 'E', {
        parentId: 3,
        variableId: 100,
      }),
      instruction(5, 20, 2, 3, 'CK', {
        parentId: 3,
        variableId: 101,
      }),
      instruction(6, 20, 2, 4, 'SET', {
        parentId: 1,
        variableId: 101,
      }),
      instruction(7, 20, 2, 5, 'E', {
        parentId: 3,
        variableId: 102,
      }),
    ];
    const variables = [
      variable(100, 1),
      variable(101, 1),
      variable(102, null),
    ];

    const one = run(
      rows,
      { kind: 'ONE', selectedBlockId: 20 },
      variables,
    );
    const all = run(rows, { kind: 'ALL' }, variables);

    expect(issueFor(
      one,
      4,
      'RUNTIME_VALUE_WRITER_OUTSIDE_SCOPE',
    )).toBeDefined();
    expect(issueFor(
      one,
      5,
      'RUNTIME_VALUE_WRITER_AFTER_READER',
    )).toBeDefined();
    expect(issueFor(
      one,
      7,
      'MISSING_RUNTIME_VALUE_WRITER',
    )).toBeDefined();
    expect(issueFor(
      all,
      4,
      'RUNTIME_VALUE_WRITER_OUTSIDE_SCOPE',
    )).toBeUndefined();
  });

  it('recomputes conditional grammar from active scoped rows', () => {
    const result = run([
      instruction(1, 10, 1, 1, 'IF', { parentId: 1 }),
      instruction(2, 10, 1, 2, 'ENDIF', {
        parentId: 1,
        instructionActive: false,
      }),
    ]);

    expect(issueFor(result, 1, 'MISSING_ENDIF')).toMatchObject({
      kind: 'CONDITIONAL_ROOT',
      instructionId: 1,
    });
    expect(result.issues.some(issue => issue.instructionId === 2)).toBe(false);
  });

  it('returns a stable scope issue for an unowned selected Block', () => {
    const result = run(
      [instruction(1, 10, 1, 1, 'O')],
      { kind: 'ONE', selectedBlockId: 999 },
    );

    expect(result).toMatchObject({
      status: 'BLOCKED',
      ready: false,
      reachableBlockIds: [],
      reachableInstructionIds: [],
    });
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'SELECTED_BLOCK_NOT_FOUND',
        blockId: 999,
        instructionId: null,
      }),
    ]);
  });

  it('does not mutate the supplied relationship graph', () => {
    const graph = buildInstructionRelationshipGraph({
      owner: OWNER,
      instructions: [instruction(1, 10, 1, 1, 'O')],
      variables: [],
      blocks: [block(10, 1)],
    });
    const before = JSON.stringify(graph);

    const result = executionRelationshipPreflight(graph, { kind: 'ALL' });

    expect(JSON.stringify(graph)).toBe(before);
    expect(Object.isFrozen(result.reachableInstructionIds)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
  });
});
