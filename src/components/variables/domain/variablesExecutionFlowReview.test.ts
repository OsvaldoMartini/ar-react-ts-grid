import type {
  VariableGraphEntry,
  VariableInstructionNode,
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  buildVariablesExecutionFlowReview,
  variablesExecutionFlowReviewAuthorityKey,
} from './variablesExecutionFlowReview';

const node = (
  id: number,
  action: string,
  blockId: number,
  blockOrder: number,
  instructionOrder: number,
  overrides: Partial<VariableInstructionNode> = {},
): VariableInstructionNode => ({
  id,
  name: `${action} ${id}`,
  command: action,
  operation: '',
  blockId,
  blockName: `Block ${blockId}`,
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  tagName: action === 'O' ? 'input' : null,
  active: true,
  blockActive: true,
  ...overrides,
});

const fact = (
  instruction: VariableInstructionNode,
): VariablesInstructionFact => ({
  instructionId: instruction.id!,
  action: instruction.command,
  relationKind: instruction.command === 'GOTO'
    ? 'BLOCK_TARGET'
    : instruction.command === 'LOOP'
      ? 'LOOP_ANCHOR'
      : 'ELEMENT_TARGET',
  blockId: instruction.blockId!,
  blockOrderNumber: instruction.blockOrder!,
  instructionOrderNumber: instruction.instructionOrder!,
  parentId: instruction.parentId,
  parentBlockId: instruction.parentBlockId,
  variableId: instruction.variableId,
  tagName: instruction.tagName,
});

const makeSnapshot = (): VariableWorkspaceSnapshot => {
  const commands = [
    node(30, 'PAUSE', 20, 2, 1),
    node(10, 'O', 10, 1, 1),
    node(11, 'GET', 10, 1, 2, {
      parentId: 10,
      parentBlockId: 10,
      variableId: 100,
    }),
    node(12, 'CK', 10, 1, 3, {
      parentId: 10,
      parentBlockId: 10,
      variableId: 100,
    }),
  ];
  const variable: VariableGraphEntry = {
    id: 100,
    name: 'account_number',
    type: '$String',
    configuredValue: '',
    localFormat: '',
    delimiter: '',
    owner: commands[1],
    commands: [],
    producers: [],
    consumers: [],
    literalAssignments: [],
    invalidLinks: [],
    diagnostics: [],
    unused: false,
    health: 'HEALTHY',
  };
  return {
    ok: true,
    message: 'ready',
    requestId: 'request-1',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 8,
    graphRevision: 'a'.repeat(64),
    botJob: {
      id: 32,
      name: 'Flow Review',
      homeBankingId: 2,
      organizationName: 'Banca',
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
      { id: 20, name: 'Second', order: 2, active: true },
      { id: 10, name: 'First', order: 1, active: true },
      { id: 40, name: 'Empty', order: 3, active: true },
    ],
    commands,
    variables: [variable],
    edges: [],
    diagnostics: [],
    runtimeMemory: {
      revision: 1,
      variables: [{
        variableId: 100,
        name: 'account_number',
        type: '$String',
        state: 'VALUE',
        value: '001,25',
        voidReason: null,
        entryRevision: 1,
        source: 'EXECUTION',
      }],
    },
    mutationCapability: {
      enabled: true,
      contractVersion: 3,
      profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
      crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      graphVersion: 2,
      graphRevision: 'b'.repeat(64),
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 32,
      },
      layoutRows: commands.map(command => ({
        instructionId: command.id!,
        blockId: command.blockId!,
        blockOrderNumber: command.blockOrder!,
        instructionOrderNumber: command.instructionOrder!,
      })),
      instructionFacts: commands.map(fact),
      variableFacts: [{ variableId: 100, ownerInstructionId: 10 }],
    },
  };
};

test('builds a complete read-only sequence in Block then instruction order', () => {
  const review = buildVariablesExecutionFlowReview(makeSnapshot());
  expect(review).not.toBeNull();
  expect(review?.steps.map(step => step.instructionId)).toEqual([
    10, 11, 12, 30,
  ]);
  expect(review?.steps.find(step => step.instructionId === 30)?.connections)
    .toEqual([]);
  expect(review?.steps.find(step => step.instructionId === 11)?.connections)
    .toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'ELEMENT_TARGET', state: 'CONNECTED' }),
      expect.objectContaining({ kind: 'VARIABLE_BINDING', state: 'CONNECTED' }),
    ]));
  expect(review?.connectionCount).toBeGreaterThan(0);
  expect(review?.issueCount).toBe(0);
  expect(review?.blocks).toEqual([
    expect.objectContaining({ blockId: 10, steps: expect.any(Array) }),
    expect.objectContaining({ blockId: 20, steps: expect.any(Array) }),
    expect.objectContaining({ blockId: 40, steps: [] }),
  ]);
  expect(review?.variableFlows).toEqual([
    expect.objectContaining({
      variableId: 100,
      ownerInstructionId: 10,
      variableType: '$String',
      runtimeState: 'VALUE',
      runtimeRawValue: '001,25',
      producerInstructionIds: [11],
      readerInstructionIds: [12],
    }),
  ]);
});

test('retains actual workspace diagnostics for read-only inspection', () => {
  const current = makeSnapshot();
  current.diagnostics = [{
    code: 'TEST_DIAGNOSTIC',
    message: 'Keep this exact diagnostic visible.',
    severity: 'WARNING',
    variableId: 100,
    instructionId: null,
  }];
  const review = buildVariablesExecutionFlowReview(current);
  expect(review?.diagnostics).toEqual(expect.arrayContaining([
    expect.objectContaining({
      code: 'TEST_DIAGNOSTIC',
      message: 'Keep this exact diagnostic visible.',
      severity: 'WARNING',
    }),
  ]));
});

test('builds a partial review without mutation capability', () => {
  const current = makeSnapshot();
  current.mutationCapability = null;
  current.runtimeMemory.variables[0] = {
    ...current.runtimeMemory.variables[0],
    state: 'VALUE',
    value: '',
  };
  const review = buildVariablesExecutionFlowReview(current);
  expect(review.relationshipsAvailable).toBe(false);
  expect(review.steps).toHaveLength(current.commands.length);
  expect(review.blocks.find(block => block.blockId === 40)?.steps).toEqual([]);
  expect(review.variableFlows[0]).toEqual(expect.objectContaining({
    runtimeState: 'VALUE',
    runtimeRawValue: '',
  }));
});

test('sorts orphan Blocks into execution order and keeps unassigned last', () => {
  const current = makeSnapshot();
  current.commands.push(
    node(50, 'PAUSE', 50, 2.5, 1),
    node(60, 'PAUSE', 60, 4, 1, {
      blockId: null,
      blockName: 'Unassigned commands',
      blockOrder: null,
    }),
  );
  const review = buildVariablesExecutionFlowReview(current);
  expect(review.blocks.map(block => block.blockId)).toEqual([
    10, 20, 50, 40, null,
  ]);
});

test('semantic review authority changes for another Bot Job even with a lower epoch', () => {
  const current = makeSnapshot();
  const other = {
    ...current,
    workspaceEpoch: 1,
    botJob: { ...current.botJob, id: 33 },
  };
  expect(variablesExecutionFlowReviewAuthorityKey(other))
    .not.toBe(variablesExecutionFlowReviewAuthorityKey(current));
});
