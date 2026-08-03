import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { planIfFamilyAutoRepair } from './ifFamilyAutoRepair';

const REVISION = 'a'.repeat(64);

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

const snapshot = (
  instructionFacts: VariablesInstructionFact[],
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'if-family-auto-repair-test',
  bindingEpoch: 'binding-repair',
  workspaceEpoch: 7,
  graphRevision: REVISION,
  botJob: { id: 32, name: 'Bot Job 32', homeBankingId: 2, organizationName: 'Bank' },
  summary: {
    variableCount: 0,
    producerCount: 0,
    consumerCount: 0,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [{ id: 10, name: 'Conditional', order: 1, active: true }],
  commands: [],
  variables: [],
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
});

test('a family created without any wiring gets every deterministic patch', () => {
  // The 2026-08-03 screenshot case: IF 1710, ELSE 1711, ENDIF 1712, no parents.
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(1710, 10, 1, 1, 'IF'),
    fact(1711, 10, 1, 2, 'ELSE'),
    fact(1712, 10, 1, 3, 'ENDIF'),
  ]));
  expect(plan).not.toBeNull();
  expect(plan?.repairedInstructionIds).toEqual([1710, 1711, 1712]);
  expect(plan?.rootInstructionIds).toEqual([1710]);
  expect(plan?.draft.instructionRelationPatches).toEqual([
    expect.objectContaining({
      instructionId: 1710,
      relationKind: 'CONDITIONAL_ROOT',
      operation: 'SET',
      expected: { parentId: null, parentBlockId: null },
      replacement: { parentId: 1710, parentBlockId: 10 },
    }),
    expect.objectContaining({
      instructionId: 1711,
      replacement: { parentId: 1710, parentBlockId: 10 },
    }),
    expect.objectContaining({
      instructionId: 1712,
      replacement: { parentId: 1710, parentBlockId: 10 },
    }),
  ]);
});

test('a correctly wired family produces no plan', () => {
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(1710, 10, 1, 1, 'IF', { parentId: 1710, parentBlockId: 10 }),
    fact(1711, 10, 1, 2, 'ELSE', { parentId: 1710, parentBlockId: 10 }),
    fact(1712, 10, 1, 3, 'ENDIF', { parentId: 1710, parentBlockId: 10 }),
  ]));
  expect(plan).toBeNull();
});

test('only the broken boundary is patched in a partially wired family', () => {
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(1710, 10, 1, 1, 'IF', { parentId: 1710, parentBlockId: 10 }),
    fact(1711, 10, 1, 2, 'ELSE', { parentId: null, parentBlockId: null }),
    fact(1712, 10, 1, 3, 'ENDIF', { parentId: 1710, parentBlockId: 10 }),
  ]));
  expect(plan?.repairedInstructionIds).toEqual([1711]);
});

test('a Block with two IF roots is ambiguous and never auto-repaired', () => {
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(1710, 10, 1, 1, 'IF'),
    fact(1713, 10, 1, 2, 'IF'),
    fact(1711, 10, 1, 3, 'ELSE'),
    fact(1712, 10, 1, 4, 'ENDIF'),
  ]));
  expect(plan).toBeNull();
});

test('orphan boundaries without any IF root are left for the explicit flow', () => {
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(1711, 10, 1, 1, 'ELSE'),
    fact(1712, 10, 1, 2, 'ENDIF'),
  ]));
  expect(plan).toBeNull();
});

test('non-conditional commands never produce patches', () => {
  const plan = planIfFamilyAutoRepair(snapshot([
    fact(500, 10, 1, 1, 'CLICK'),
    fact(501, 10, 1, 2, 'GET', { parentId: 500 }),
  ]));
  expect(plan).toBeNull();
});
