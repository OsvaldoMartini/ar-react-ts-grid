import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import {
  planVariablesInstructionMove,
  type VariablesInstructionMoveErrorCode,
} from './variablesInstructionMove';

const REVISION = 'a'.repeat(64);

const owner = (
  id = 100,
  blockId = 10,
  blockOrder = 1,
  instructionOrder = 1,
): VariableInstructionNode => ({
  id,
  name: `Owner ${id}`,
  command: 'CLICK',
  operation: '',
  blockId,
  blockName: `Block ${blockId}`,
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
});

const command = (
  id: number,
  instructionOrder: number,
  role: VariableCommandLink['role'],
  action: string,
  overrides: Partial<VariableCommandLink> = {},
): VariableCommandLink => ({
  id,
  name: `Instruction ${id}`,
  command: action,
  operation: '',
  blockId: 10,
  blockName: 'Block 10',
  blockOrder: 1,
  instructionOrder,
  parentId: 100,
  parentBlockId: 10,
  variableId: 1,
  active: true,
  blockActive: true,
  role,
  diagnostics: [],
  ...overrides,
});

const variable = (
  commands: VariableCommandLink[],
): VariableGraphEntry => ({
  id: 1,
  name: 'Account number',
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner: owner(),
  commands,
  producers: commands.filter(row => row.role === 'PRODUCER'),
  consumers: commands.filter(row => row.role === 'CONSUMER'),
  literalAssignments: commands.filter(row => row.role === 'LITERAL_ASSIGNMENT'),
  invalidLinks: commands.filter(row => row.role === 'INVALID_LINK'),
  diagnostics: [],
  unused: commands.length === 0,
  health: 'HEALTHY',
});

const fact = (
  instructionId: number,
  instructionOrderNumber: number,
  overrides: Partial<VariablesInstructionFact> = {},
): VariablesInstructionFact => ({
  instructionId,
  blockId: 10,
  blockOrderNumber: 1,
  instructionOrderNumber,
  action: 'CLICK',
  relationKind: 'ELEMENT_TARGET',
  parentId: instructionId === 100 ? null : 100,
  parentBlockId: instructionId === 100 ? null : 10,
  variableId: instructionId === 100 ? null : 1,
  ...overrides,
});

const snapshot = (
  commands: VariableCommandLink[],
  facts: VariablesInstructionFact[] = [
    fact(100, 1),
    ...commands.map(row => fact(row.id as number, row.instructionOrder as number, {
      action: row.command,
      blockId: row.blockId as number,
      blockOrderNumber: row.blockOrder as number,
      parentId: row.parentId,
      parentBlockId: row.parentBlockId,
      variableId: row.variableId,
    })),
  ],
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'request-1',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 4,
  graphRevision: REVISION,
  botJob: {
    id: 5,
    name: 'Variables drag',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 1,
    producerCount: commands.filter(row => row.role === 'PRODUCER').length,
    consumerCount: commands.filter(row => row.role === 'CONSUMER').length,
    literalAssignmentCount: commands.filter(
      row => row.role === 'LITERAL_ASSIGNMENT',
    ).length,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [
    { id: 10, name: 'Block 10', order: 1, active: true },
    { id: 20, name: 'Block 20', order: 2, active: true },
  ],
  variables: [variable(commands)],
  edges: [],
  diagnostics: [],
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    graphVersion: 7,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    },
    layoutRows: facts.map(row => ({
      instructionId: row.instructionId,
      blockId: row.blockId,
      blockOrderNumber: row.blockOrderNumber,
      instructionOrderNumber: row.instructionOrderNumber,
    })),
    instructionFacts: facts,
  },
});

const orders = (
  result: ReturnType<typeof planVariablesInstructionMove>,
): Array<[number, number]> => {
  if (!result.ok) throw new Error(result.message);
  return result.plan.draft.layoutRows
    .filter(row => row.blockId === 10)
    .map(row => [row.instructionId, row.instructionOrderNumber]);
};

const expectRefusal = (
  result: ReturnType<typeof planVariablesInstructionMove>,
  code: VariablesInstructionMoveErrorCode,
) => {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.code).toBe(code);
};

test('moves exactly one variable command downward and preserves every relationship patch list', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
    command(103, 4, 'LITERAL_ASSIGNMENT', 'SET'),
  ];

  const result = planVariablesInstructionMove(
    snapshot(commands),
    102,
    103,
    'AFTER',
  );

  expect(orders(result)).toEqual([
    [100, 1],
    [101, 2],
    [103, 3],
    [102, 4],
  ]);
  if (!result.ok) return;
  expect(result.plan.draft.draggedInstructionId).toBe(102);
  expect(result.plan.draft.instructionRelationPatches).toEqual([]);
  expect(result.plan.draft.variableBindingPatches).toEqual([]);
  expect(result.plan.draft.variableOwnerPatches).toEqual([]);
});

test('moves exactly one variable command upward', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
    command(103, 4, 'LITERAL_ASSIGNMENT', 'SET'),
  ];

  const result = planVariablesInstructionMove(
    snapshot(commands),
    103,
    102,
    'BEFORE',
  );

  expect(orders(result)).toEqual([
    [100, 1],
    [101, 2],
    [103, 3],
    [102, 4],
  ]);
});

test('preserves the relative order of ordinary rows hidden from the Variables lane', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 5, 'LITERAL_ASSIGNMENT', 'SET'),
  ];
  const facts = [
    fact(100, 1),
    fact(101, 2, { action: 'GET' }),
    fact(901, 3, {
      action: 'PAUSE',
      parentId: null,
      parentBlockId: null,
      variableId: null,
    }),
    fact(902, 4, {
      action: 'CLICK',
      parentId: null,
      parentBlockId: null,
      variableId: null,
    }),
    fact(102, 5, { action: 'SET' }),
  ];

  const result = planVariablesInstructionMove(
    snapshot(commands, facts),
    102,
    101,
    'BEFORE',
  );

  expect(orders(result)).toEqual([
    [100, 1],
    [102, 2],
    [101, 3],
    [901, 4],
    [902, 5],
  ]);
});

test('refuses a no-op drop without producing a mutation draft', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands), 102, 101, 'AFTER'),
    'NO_CHANGE',
  );
});

test('refuses an invalid-link command as a drag source', () => {
  const commands = [
    command(101, 2, 'INVALID_LINK', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands), 101, 102, 'AFTER'),
    'INVALID_SOURCE',
  );
});

test('allows a move that repairs an existing consumer-before-writer error', () => {
  const commands = [
    command(102, 2, 'CONSUMER', 'CK'),
    command(101, 3, 'PRODUCER', 'GET'),
  ];

  const result = planVariablesInstructionMove(
    snapshot(commands),
    101,
    102,
    'BEFORE',
  );

  expect(orders(result)).toEqual([
    [100, 1],
    [101, 2],
    [102, 3],
  ]);
});

test('refuses a cross-block command drop', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(201, 1, 'CONSUMER', 'CK', {
      blockId: 20,
      blockName: 'Block 20',
      blockOrder: 2,
      parentBlockId: 20,
    }),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands), 101, 201, 'BEFORE'),
    'CROSS_BLOCK_NOT_READY',
  );
});

test('refuses crossing a structural instruction between source and target', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 4, 'CONSUMER', 'CK'),
  ];
  const facts = [
    fact(100, 1),
    fact(101, 2),
    fact(999, 3, {
      action: 'LOOP',
      relationKind: 'LOOP_ANCHOR',
      variableId: null,
    }),
    fact(102, 4),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands, facts), 102, 101, 'AFTER'),
    'STRUCTURAL_BOUNDARY',
  );
});

test('refuses a drop that crosses the structural target boundary itself', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
    command(999, 4, 'INVALID_LINK', 'LOOP'),
  ];
  const facts = [
    fact(100, 1),
    fact(101, 2),
    fact(102, 3),
    fact(999, 4, { action: 'LOOP', relationKind: 'LOOP_ANCHOR' }),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands, facts), 102, 999, 'AFTER'),
    'STRUCTURAL_BOUNDARY',
  );
});

test('refuses a new consumer-before-writer relationship error', () => {
  const commands = [
    command(101, 2, 'PRODUCER', 'GET'),
    command(102, 3, 'CONSUMER', 'CK'),
  ];

  expectRefusal(
    planVariablesInstructionMove(snapshot(commands), 101, 102, 'AFTER'),
    'RELATIONSHIP_ORDER',
  );
});

test.each(['PDF CHECK', 'CSV CHECK'])(
  'does not invent runtime writer ordering for %s output validation',
  action => {
    const commands = [
      command(101, 2, 'PRODUCER', 'GET'),
      command(102, 3, 'CONSUMER', action),
    ];

    const result = planVariablesInstructionMove(
      snapshot(commands),
      101,
      102,
      'AFTER',
    );

    expect(orders(result)).toEqual([
      [100, 1],
      [102, 2],
      [101, 3],
    ]);
  },
);
