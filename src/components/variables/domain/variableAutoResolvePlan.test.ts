import type {
  VariableGraphEntry,
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { planVariableAutoResolve } from './variableAutoResolvePlan';

const REVISION = 'b'.repeat(64);

const node = (
  id: number,
  command: string,
  overrides: Partial<VariableInstructionNode> = {},
): VariableInstructionNode => ({
  id,
  name: `Instruction ${id}`,
  command,
  operation: '',
  blockId: 10,
  blockName: 'Block',
  blockOrder: 1,
  instructionOrder: id,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
  ...overrides,
});

const variable = (
  id: number,
  name: string,
): VariableGraphEntry => ({
  id,
  name,
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner: null,
  commands: [],
  producers: [],
  consumers: [],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: false,
  health: 'HEALTHY',
});

const snapshot = (
  commands: VariableInstructionNode[],
  variables: VariableGraphEntry[],
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'auto-resolve-plan-test',
  bindingEpoch: 'binding-resolve',
  workspaceEpoch: 7,
  graphRevision: REVISION,
  botJob: { id: 32, name: 'Bot Job 32', homeBankingId: 2, organizationName: 'Bank' },
  summary: {
    variableCount: variables.length,
    producerCount: 0,
    consumerCount: 0,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [{ id: 10, name: 'Block', order: 1, active: true }],
  commands,
  variables,
  edges: [],
  diagnostics: [],
  runtimeMemory: { revision: 0, variables: [] },
  mutationCapability: null,
});

test('rule 5: a GET without a variable connects the OLDEST existing variable', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'GET')],
    [variable(7, 'Younger'), variable(3, 'Oldest')],
  ));
  expect(plan.creations).toEqual([]);
  expect(plan.bindings).toEqual([
    { instructionId: 1, variableId: 3, pendingName: null },
  ]);
});

test('rule 5: no variables at all creates sequential Variable_N and connects it', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'GET'), node(2, 'SET')],
    [],
  ));
  expect(plan.creations).toEqual([
    { name: 'Variable_1', slot: 'MAIN', instructionId: 1 },
    { name: 'Variable_2', slot: 'MAIN', instructionId: 2 },
  ]);
  expect(plan.bindings).toEqual([
    { instructionId: 1, variableId: null, pendingName: 'Variable_1' },
    { instructionId: 2, variableId: null, pendingName: 'Variable_2' },
  ]);
});

test('rule 5: Variable_N sequencing continues after the highest existing number', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'GET'), node(2, 'E')],
    [variable(9, 'Variable_4')],
  ));
  // A variable exists, so both commands connect it - no creation needed.
  expect(plan.creations).toEqual([]);
  expect(plan.bindings).toEqual([
    { instructionId: 1, variableId: 9, pendingName: null },
    { instructionId: 2, variableId: 9, pendingName: null },
  ]);
});

test('rule 5: existing bindings are never overwritten', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'GET', { variableId: 5 })],
    [variable(3, 'Oldest'), variable(5, 'Bound')],
  ));
  expect(plan.creations).toEqual([]);
  expect(plan.bindings).toEqual([]);
});

test('rule 6: CK takes oldest as LEFT and next-oldest as RIGHT', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'CK')],
    [variable(3, 'Oldest'), variable(7, 'Second')],
  ));
  expect(plan.bindings).toEqual([
    { instructionId: 1, variableId: 3, pendingName: null },
  ]);
  expect(plan.rightOperands).toEqual([
    { instructionId: 1, variableId: 7, pendingName: null },
  ]);
  expect(plan.creations).toEqual([]);
});

test('rule 6: CK with no variables creates Left_Operand and Right_Operand', () => {
  const plan = planVariableAutoResolve(snapshot([node(1, 'CK')], []));
  expect(plan.creations).toEqual([
    { name: 'Left_Operand', slot: 'LEFT', instructionId: 1 },
    { name: 'Right_Operand', slot: 'RIGHT', instructionId: 1 },
  ]);
  expect(plan.bindings).toEqual([
    { instructionId: 1, variableId: null, pendingName: 'Left_Operand' },
  ]);
  expect(plan.rightOperands).toEqual([
    { instructionId: 1, variableId: null, pendingName: 'Right_Operand' },
  ]);
});

test('rule 6: operand names collide into suffixed names', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'CK', { variableId: 4 })],
    [variable(4, 'Left_Operand'), variable(9, 'Right_Operand')],
  ));
  // Left is bound; right uses the existing other variable - no creation.
  expect(plan.rightOperands).toEqual([
    { instructionId: 1, variableId: 9, pendingName: null },
  ]);

  const second = planVariableAutoResolve(snapshot(
    [node(1, 'CK', { variableId: 4 })],
    [variable(4, 'Right_Operand')],
  ));
  // Only the left-bound variable exists; the right operand must be created and
  // "Right_Operand" is taken, so the name gets a suffix.
  expect(second.creations).toEqual([
    { name: 'Right_Operand_2', slot: 'RIGHT', instructionId: 1 },
  ]);
});

test('rule 6: a configured VARIABLE right operand is never overwritten', () => {
  const configured = node(1, 'CK', {
    variableId: 4,
    commandConfiguration: {
      commandType: 'CK',
      conditionSource: '',
      leftVariableId: null,
      operandKind: 'VARIABLE',
      comparisonOperator: '==',
      operandRawValue: '',
      operandVariableId: 9,
      outputKey: '',
      outputColumn: '',
      outputFile: '',
      externalSourceKey: '',
      formatPolicy: '',
    },
  });
  const plan = planVariableAutoResolve(snapshot(
    [configured],
    [variable(4, 'Left'), variable(9, 'Right')],
  ));
  expect(plan.bindings).toEqual([]);
  expect(plan.rightOperands).toEqual([]);
  expect(plan.creations).toEqual([]);
});

test('commands without a variable requirement are never touched', () => {
  const plan = planVariableAutoResolve(snapshot(
    [node(1, 'CLICK'), node(2, 'H'), node(3, 'IF')],
    [],
  ));
  expect(plan.creations).toEqual([]);
  expect(plan.bindings).toEqual([]);
  expect(plan.rightOperands).toEqual([]);
});
