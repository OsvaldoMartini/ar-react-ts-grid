import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  planVariablesBlockMove,
  selectVariablesBlockTransferSources,
} from './variablesBlockTransfer';

const REVISION = 'd'.repeat(64);

const node = (
  id: number,
  command: string,
  blockId: number,
  blockOrder: number,
  instructionOrder: number,
  overrides: Partial<VariableInstructionNode> = {},
): VariableInstructionNode => ({
  id,
  name: `Instruction ${id}`,
  command,
  operation: '',
  blockId,
  blockName: blockId === 10 ? 'Source' : 'Target',
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
  ...overrides,
});

const linkedCommand = (
  id: number,
  role: VariableCommandLink['role'],
  command: string,
  instructionOrder: number,
): VariableCommandLink => ({
  ...node(id, command, 10, 1, instructionOrder, {
    parentId: 100,
    parentBlockId: 10,
    variableId: 1,
  }),
  role,
  diagnostics: [],
});

const owner = node(100, 'O', 10, 1, 1, { variableId: 1 });
const producer = linkedCommand(101, 'PRODUCER', 'GET', 2);
const consumer = linkedCommand(102, 'CONSUMER', 'CK', 3);

const variable: VariableGraphEntry = {
  id: 1,
  name: 'Account',
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner,
  commands: [producer, consumer],
  producers: [producer],
  consumers: [consumer],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: false,
  health: 'HEALTHY',
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

const facts = (): VariablesInstructionFact[] => [
  fact(100, 10, 1, 1, 'O', { variableId: 1 }),
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
  fact(104, 10, 1, 4, 'CLICK', {
    parentId: 102,
    parentBlockId: 10,
  }),
  fact(300, 10, 1, 5, 'GOTO', {
    relationKind: 'BLOCK_TARGET',
    parentBlockId: 20,
  }),
  fact(201, 20, 2, 1, 'CLICK'),
];

const snapshot = (): VariableWorkspaceSnapshot => {
  const instructionFacts = facts();
  return {
    ok: true,
    message: 'Loaded',
    requestId: 'variables-transfer',
    bindingEpoch: 'binding-transfer',
    workspaceEpoch: 7,
    graphRevision: REVISION,
    botJob: {
      id: 30,
      name: 'Variables transfer',
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
      { id: 10, name: 'Source', order: 1, active: true },
      { id: 20, name: 'Target', order: 2, active: true },
      { id: 30, name: 'Empty', order: 3, active: false },
    ],
    commands: [
      owner,
      producer,
      consumer,
      node(104, 'CLICK', 10, 1, 4, {
        parentId: 102,
        parentBlockId: 10,
      }),
      node(300, 'GOTO', 10, 1, 5, { parentBlockId: 20 }),
      node(201, 'CLICK', 20, 2, 1),
    ],
    variables: [variable],
    edges: [],
    diagnostics: [],
    runtimeMemory: { revision: 0, variables: [] },
    mutationCapability: {
      enabled: true,
      contractVersion: 3,
      profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
      crossBlockProfile: null,
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      graphVersion: 12,
      graphRevision: REVISION,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 30,
      },
      layoutRows: instructionFacts.map(({
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
      instructionFacts,
      variableFacts: [{
        variableId: 1,
        ownerInstructionId: 100,
      }],
    },
  };
};

test('selects the exact instruction alone when only-instruction is chosen', () => {
  expect(selectVariablesBlockTransferSources(
    snapshot(),
    102,
    'ONLY_INSTRUCTION',
  )).toEqual({
    ok: true,
    selection: {
      selectedInstructionId: 102,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [102],
    },
  });
});

test('selects explicit parent and variable producers but never children or positional rows', () => {
  const result = selectVariablesBlockTransferSources(
    snapshot(),
    102,
    'WITH_PARENTS',
  );

  expect(result).toEqual({
    ok: true,
    selection: {
      selectedInstructionId: 102,
      scope: 'WITH_PARENTS',
      sourceInstructionIds: [100, 101, 102],
    },
  });
});

test('does not treat the external target of GOTO as an instruction parent', () => {
  const result = selectVariablesBlockTransferSources(
    snapshot(),
    300,
    'WITH_PARENTS',
  );

  expect(result).toEqual({
    ok: true,
    selection: {
      selectedInstructionId: 300,
      scope: 'WITH_PARENTS',
      sourceInstructionIds: [300],
    },
  });
});

test('moves the exact dependency group to the target end and reprojects internal parents', () => {
  const result = planVariablesBlockMove(snapshot(), 102, 20, 'WITH_PARENTS');

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.sourceInstructionIds).toEqual([100, 101, 102]);
  expect(result.plan.draft.layoutRows.map(row => [
    row.instructionId,
    row.blockId,
    row.instructionOrderNumber,
  ])).toEqual([
    [104, 10, 1],
    [300, 10, 2],
    [201, 20, 1],
    [100, 20, 2],
    [101, 20, 3],
    [102, 20, 4],
  ]);
  expect(result.plan.draft.instructionRelationPatches).toEqual([
    {
      instructionId: 101,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: { parentId: 100, parentBlockId: 10 },
      replacement: { parentId: 100, parentBlockId: 20 },
    },
    {
      instructionId: 102,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: { parentId: 100, parentBlockId: 10 },
      replacement: { parentId: 100, parentBlockId: 20 },
    },
    {
      instructionId: 104,
      relationKind: 'ELEMENT_TARGET',
      operation: 'CLEAR',
      expected: { parentId: 102, parentBlockId: 10 },
      replacement: { parentId: null, parentBlockId: null },
    },
  ]);
});
