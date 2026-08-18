import type {
  VariableGraphEntry,
  VariableInstructionNode,
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { planVariablesCommandDelete } from './variablesCommandDelete';

const REVISION = 'e'.repeat(64);

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
  blockName: blockId === 10 ? 'Conditional' : 'Other',
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
  ...overrides,
});

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

// Block 10: CLICK, IF(501 self-ref), CK body(502 → parent 501), ELSEIF(503),
// ELSE(504), ENDIF(505). Block 20: CLICK(601).
const familyFacts = (rootParent: number | null = 501): VariablesInstructionFact[] => [
  fact(500, 10, 1, 1, 'CLICK'),
  fact(501, 10, 1, 2, 'IF', { parentId: rootParent, parentBlockId: 10 }),
  fact(502, 10, 1, 3, 'CK', { parentId: 501, parentBlockId: 10 }),
  fact(503, 10, 1, 4, 'ELSEIF', { parentId: rootParent, parentBlockId: 10 }),
  fact(504, 10, 1, 5, 'ELSE', { parentId: rootParent, parentBlockId: 10 }),
  fact(505, 10, 1, 6, 'ENDIF', { parentId: rootParent, parentBlockId: 10 }),
  fact(601, 20, 2, 1, 'CLICK'),
];

const commands = (rootParent: number | null = 501): VariableInstructionNode[] => [
  node(500, 'CLICK', 10, 1, 1),
  node(501, 'IF', 10, 1, 2, { parentId: rootParent, parentBlockId: 10 }),
  node(502, 'CK', 10, 1, 3, { parentId: 501, parentBlockId: 10 }),
  node(503, 'ELSEIF', 10, 1, 4, { parentId: rootParent, parentBlockId: 10 }),
  node(504, 'ELSE', 10, 1, 5, { parentId: rootParent, parentBlockId: 10 }),
  node(505, 'ENDIF', 10, 1, 6, { parentId: rootParent, parentBlockId: 10 }),
  node(601, 'CLICK', 20, 2, 1),
];

const variableOwnedByRoot: VariableGraphEntry = {
  id: 41,
  name: 'Owned',
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner: node(501, 'IF', 10, 1, 2, { parentId: 501, parentBlockId: 10 }),
  commands: [],
  producers: [],
  consumers: [],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: false,
  health: 'HEALTHY',
};

const snapshot = (rootParent: number | null = 501): VariableWorkspaceSnapshot => {
  const instructionFacts = familyFacts(rootParent);
  return {
    ok: true,
    message: 'Loaded',
    requestId: 'variables-delete-test',
    bindingEpoch: 'binding-delete',
    workspaceEpoch: 7,
    graphRevision: REVISION,
    botJob: { id: 32, name: 'Bot Job 32', homeBankingId: 2, organizationName: 'Bank' },
    summary: {
      variableCount: 1,
      producerCount: 0,
      consumerCount: 0,
      literalAssignmentCount: 0,
      warningCount: 0,
      unusedCount: 0,
    },
    blocks: [
      { id: 10, name: 'Conditional', order: 1, active: true },
      { id: 20, name: 'Other', order: 2, active: true },
    ],
    commands: commands(rootParent),
    variables: [variableOwnedByRoot],
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
      ownerAssertion: { workspaceKind: 'BOT_JOB', homeBankingId: 2, botJobId: 32 },
      layoutRows: instructionFacts.map(({
        instructionId,
        blockId,
        blockOrderNumber,
        instructionOrderNumber,
      }) => ({
        instructionId, blockId, blockOrderNumber, instructionOrderNumber,
      })),
      instructionFacts,
    },
  };
};

test('selecting a child ELSE expands the delete plan to the complete IF family', () => {
  const plan = planVariablesCommandDelete(snapshot(), 504);
  expect(plan).not.toBeNull();
  expect(plan?.instruction.id).toBe(504);
  expect(plan?.familyDeleteInstructionIds).toEqual([501, 503, 505]);
});

test('selecting the ELSEIF child also expands to the complete family', () => {
  const plan = planVariablesCommandDelete(snapshot(), 503);
  expect(plan?.familyDeleteInstructionIds).toEqual([501, 504, 505]);
});

test('selecting the IF root expands to all boundaries', () => {
  const plan = planVariablesCommandDelete(snapshot(), 501);
  expect(plan?.familyDeleteInstructionIds).toEqual([503, 504, 505]);
});

test('positional body commands are never part of the family delete', () => {
  const plan = planVariablesCommandDelete(snapshot(), 501);
  expect(plan?.familyDeleteInstructionIds).not.toContain(502);
});

test('body command parented to the deleted root is repaired, not deleted', () => {
  const plan = planVariablesCommandDelete(snapshot(), 504);
  expect(plan?.parentRepairInstructionIds).toEqual([502]);
});

test('variables owned by any deleted boundary are released', () => {
  const plan = planVariablesCommandDelete(snapshot(), 505);
  expect(plan?.variableOwnerIds).toEqual([41]);
});

test('non-family command keeps the single-delete contract', () => {
  const plan = planVariablesCommandDelete(snapshot(), 500);
  expect(plan?.familyDeleteInstructionIds).toEqual([]);
  expect(plan?.parentRepairInstructionIds).toEqual([]);
});

test('broken family (missing root) still deletes the selected boundary alone', () => {
  const plan = planVariablesCommandDelete(snapshot(999), 504);
  expect(plan).not.toBeNull();
  expect(plan?.familyDeleteInstructionIds).toEqual([]);
});
