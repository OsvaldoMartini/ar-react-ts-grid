import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import {
  buildVariablesCrossBlockMutationDraft,
  planVariablesCrossBlockMove,
  type VariablesCrossBlockMoveErrorCode,
} from './variablesCrossBlockMove';

const REVISION = 'c'.repeat(64);

const instruction = (
  id: number,
  action: string,
  blockId: number,
  blockOrder: number,
  instructionOrder: number,
  overrides: Partial<VariableCommandLink> = {},
): VariableCommandLink => ({
  id,
  name: `Instruction ${id}`,
  command: action,
  operation: '',
  blockId,
  blockName: `Block ${blockId}`,
  blockOrder,
  instructionOrder,
  parentId: 100,
  parentBlockId: 10,
  variableId: 1,
  active: true,
  blockActive: true,
  role: action === 'GET'
    ? 'PRODUCER'
    : action === 'SET'
      ? 'LITERAL_ASSIGNMENT'
      : 'CONSUMER',
  diagnostics: [],
  ...overrides,
});

const owner: VariableInstructionNode = {
  id: 100,
  name: 'Source Web Element',
  command: 'CLICK',
  operation: '',
  blockId: 10,
  blockName: 'Source',
  blockOrder: 1,
  instructionOrder: 1,
  parentId: null,
  parentBlockId: null,
  variableId: 1,
  active: true,
  blockActive: true,
};

const fact = (
  instructionId: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  action: string,
  overrides: Partial<VariablesInstructionFact> = {},
): VariablesInstructionFact => ({
  instructionId,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  action,
  relationKind: 'ELEMENT_TARGET',
  parentId: null,
  parentBlockId: null,
  variableId: null,
  ...overrides,
});

const baseFacts = (): VariablesInstructionFact[] => [
  fact(100, 10, 1, 1, 'CLICK', { variableId: 1 }),
  fact(101, 10, 1, 2, 'GET', {
    parentId: 100,
    parentBlockId: 10,
    variableId: 1,
  }),
  fact(102, 10, 1, 3, 'CK', {
    parentId: 100,
    parentBlockId: 10,
    variableId: 1,
  }),
  fact(201, 20, 2, 1, 'CLICK'),
  fact(202, 20, 2, 2, 'PAUSE'),
];

const variableFor = (
  producer: VariableCommandLink,
  consumer: VariableCommandLink,
): VariableGraphEntry => ({
  id: 1,
  name: 'Account number',
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner,
  commands: [producer, consumer],
  producers: producer.role === 'PRODUCER' ? [producer] : [],
  consumers: consumer.role === 'CONSUMER' ? [consumer] : [],
  literalAssignments: producer.role === 'LITERAL_ASSIGNMENT'
    ? [producer]
    : [],
  invalidLinks: [],
  diagnostics: [],
  unused: false,
  health: 'HEALTHY',
});

const snapshot = (
  facts: VariablesInstructionFact[] = baseFacts(),
  producer: VariableCommandLink = instruction(101, 'GET', 10, 1, 2),
  consumer: VariableCommandLink = instruction(102, 'CK', 10, 1, 3),
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'variables-cross',
  bindingEpoch: 'binding-cross',
  workspaceEpoch: 6,
  graphRevision: REVISION,
  botJob: {
    id: 5,
    name: 'Cross block variables',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 1,
    producerCount: 1,
    consumerCount: 1,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [
    {
      id: 10,
      name: 'Source',
      order: facts.find(row => row.blockId === 10)?.blockOrderNumber ?? null,
      active: true,
    },
    {
      id: 20,
      name: 'Destination',
      order: facts.find(row => row.blockId === 20)?.blockOrderNumber ?? null,
      active: true,
    },
  ],
  commands: [],
  variables: [variableFor(producer, consumer)],
  edges: [],
  diagnostics: [],
  runtimeMemory: { revision: 0, variables: [] },
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
    graphVersion: 9,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    },
    layoutRows: facts.map(({
      instructionId,
      blockId,
      blockOrderNumber,
      instructionOrderNumber,
    }) => ({
      instructionId,
      blockId,
      blockOrderNumber,
      instructionOrderNumber,
    })),
    instructionFacts: facts,
    variableFacts: [{
      variableId: 1,
      ownerInstructionId: 100,
    }],
  },
});

const expectRefusal = (
  result: ReturnType<typeof planVariablesCrossBlockMove>,
  code: VariablesCrossBlockMoveErrorCode,
) => {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.code).toBe(code);
};

test('plans one exact cross-block consumer layout without inferring a parent', () => {
  const result = planVariablesCrossBlockMove(
    snapshot(),
    102,
    201,
    'AFTER',
  );

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.layoutRows).toEqual([
    {
      instructionId: 100,
      blockId: 10,
      blockOrderNumber: 1,
      instructionOrderNumber: 1,
    },
    {
      instructionId: 101,
      blockId: 10,
      blockOrderNumber: 1,
      instructionOrderNumber: 2,
    },
    {
      instructionId: 201,
      blockId: 20,
      blockOrderNumber: 2,
      instructionOrderNumber: 1,
    },
    {
      instructionId: 102,
      blockId: 20,
      blockOrderNumber: 2,
      instructionOrderNumber: 2,
    },
    {
      instructionId: 202,
      blockId: 20,
      blockOrderNumber: 2,
      instructionOrderNumber: 3,
    },
  ]);
  expect(result.plan.edge.state).toBe('RECONNECT_PARENT');
  expect(result.plan.compatibleTargets.map(option => option.target.id))
    .toEqual([201]);
  expect(result.plan.destinationLabel).toBe(
    'After instruction #1 in Block #2 Destination (block ID 20)',
  );
});

test('builds only the explicit disconnect or exact reconnect relationship patch', () => {
  const result = planVariablesCrossBlockMove(
    snapshot(),
    102,
    201,
    'AFTER',
  );
  if (!result.ok) throw new Error(result.message);

  expect(buildVariablesCrossBlockMutationDraft(
    result.plan,
    { mode: 'DISCONNECT' },
  )).toMatchObject({
    mutationKind: 'ROW_MOVE',
    draggedInstructionId: 102,
    instructionRelationPatches: [{
      instructionId: 102,
      relationKind: 'ELEMENT_TARGET',
      operation: 'CLEAR',
      expected: { parentId: 100, parentBlockId: 10 },
      replacement: { parentId: null, parentBlockId: null },
    }],
    variableBindingPatches: [],
    variableOwnerPatches: [],
  });
  expect(buildVariablesCrossBlockMutationDraft(
    result.plan,
    { mode: 'RECONNECT', targetInstructionId: 201 },
  )).toMatchObject({
    draggedInstructionId: 102,
    instructionRelationPatches: [{
      instructionId: 102,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: { parentId: 100, parentBlockId: 10 },
      replacement: { parentId: 201, parentBlockId: 20 },
    }],
  });
  expect(buildVariablesCrossBlockMutationDraft(
    result.plan,
    { mode: 'RECONNECT', targetInstructionId: 202 },
  )).toBeNull();
});

test('still offers explicit disconnect when the destination has no parent candidate', () => {
  const facts = baseFacts().map(row => row.instructionId === 201
    ? { ...row, action: 'PAUSE' }
    : row);
  const result = planVariablesCrossBlockMove(
    snapshot(facts),
    102,
    202,
    'AFTER',
  );

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.compatibleTargets).toEqual([]);
  expect(buildVariablesCrossBlockMutationDraft(
    result.plan,
    { mode: 'DISCONNECT' },
  )?.instructionRelationPatches).toHaveLength(1);
});

test.each([
  ['GET', 'PRODUCER'],
  ['SET', 'LITERAL_ASSIGNMENT'],
] as const)(
  'refuses %s as the independent cross-block source',
  (action, role) => {
    const producer = instruction(102, action, 10, 1, 3, { role });
    const consumer = instruction(101, 'CK', 10, 1, 2);
    const facts = baseFacts().map(row => row.instructionId === 102
      ? { ...row, action }
      : row);

    expectRefusal(
      planVariablesCrossBlockMove(
        snapshot(facts, producer, consumer),
        102,
        201,
        'AFTER',
      ),
      'INVALID_SOURCE',
    );
  },
);

test('refuses a disconnected source and a source with direct dependants', () => {
  const disconnected = baseFacts().map(row => row.instructionId === 102
    ? { ...row, parentId: null, parentBlockId: null }
    : row);
  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot(disconnected),
      102,
      201,
      'AFTER',
    ),
    'INVALID_SOURCE',
  );

  const dependant = fact(103, 10, 1, 4, 'CLICK', {
    parentId: 102,
    parentBlockId: 10,
  });
  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot([...baseFacts(), dependant]),
      102,
      201,
      'AFTER',
    ),
    'SOURCE_HAS_DEPENDANTS',
  );
});

test('refuses structural source or destination blocks', () => {
  const structuralSource = baseFacts().map(row => row.instructionId === 101
    ? { ...row, action: 'LOOP', relationKind: 'LOOP_ANCHOR' as const }
    : row);
  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot(structuralSource),
      102,
      201,
      'AFTER',
    ),
    'STRUCTURAL_SOURCE_BLOCK',
  );

  const structuralDestination = baseFacts().map(
    row => row.instructionId === 202
      ? { ...row, action: 'GOTO', relationKind: 'BLOCK_TARGET' as const }
      : row,
  );
  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot(structuralDestination),
      102,
      201,
      'AFTER',
    ),
    'STRUCTURAL_DESTINATION_BLOCK',
  );
});

test('enforces writer order only for runtime consumers defined by policy', () => {
  const reorderedFacts = baseFacts().map(row => {
    const blockOrderNumber = row.blockId === 10 ? 2 : 1;
    return { ...row, blockOrderNumber };
  });
  const producer = instruction(101, 'GET', 10, 2, 2);
  const runtimeConsumer = instruction(102, 'CK', 10, 2, 3);
  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot(reorderedFacts, producer, runtimeConsumer),
      102,
      201,
      'AFTER',
    ),
    'WRITER_ORDER',
  );

  const outputFacts = reorderedFacts.map(row => row.instructionId === 102
    ? { ...row, action: 'PDF CHECK' }
    : row);
  const outputConsumer = instruction(
    102,
    'PDF CHECK',
    10,
    2,
    3,
  );
  const result = planVariablesCrossBlockMove(
    snapshot(outputFacts, producer, outputConsumer),
    102,
    201,
    'AFTER',
  );
  expect(result.ok).toBe(true);
});

test('fails closed when the dedicated cross-block capability is absent', () => {
  const current = snapshot();
  if (!current.mutationCapability) throw new Error('Missing capability');
  current.mutationCapability = {
    ...current.mutationCapability,
    crossBlockProfile: null,
  };

  expectRefusal(
    planVariablesCrossBlockMove(current, 102, 201, 'AFTER'),
    'CROSS_BLOCK_UNAVAILABLE',
  );
});

test('refuses a gapped authoritative layout instead of silently normalizing it', () => {
  const gapped = baseFacts().map(row => row.instructionId === 102
    ? { ...row, instructionOrderNumber: 4 }
    : row);

  expectRefusal(
    planVariablesCrossBlockMove(
      snapshot(
        gapped,
        instruction(101, 'GET', 10, 1, 2),
        instruction(102, 'CK', 10, 1, 4),
      ),
      102,
      201,
      'AFTER',
    ),
    'LAYOUT_INVALID',
  );
});
