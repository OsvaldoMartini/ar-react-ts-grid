import type {
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import {
  planVariablesFreeMove,
  VARIABLES_REACT_AUTHORED_PROFILE,
} from './variablesFreeMove';

const REVISION = 'f'.repeat(64);

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
  fact(1, 10, 1, 1, 'CLICK'),
  fact(2, 10, 1, 2, 'GET', {
    parentId: 1,
    parentBlockId: 10,
    variableId: 9,
  }),
  fact(3, 10, 1, 3, 'CK', {
    variableId: 9,
  }),
  fact(4, 20, 2, 1, 'CLICK'),
];

const snapshot = (): VariableWorkspaceSnapshot => {
  const instructionFacts = facts();
  return {
    ok: true,
    message: 'Loaded',
    requestId: 'free-move',
    bindingEpoch: 'binding-free-move',
    workspaceEpoch: 3,
    graphRevision: REVISION,
    botJob: {
      id: 32,
      name: 'Free movement',
      homeBankingId: 2,
      organizationName: 'Bank',
    },
    summary: {
      variableCount: 0,
      producerCount: 0,
      consumerCount: 0,
      literalAssignmentCount: 0,
      warningCount: 0,
      unusedCount: 0,
    },
    blocks: [
      { id: 10, name: 'Source', order: 1, active: true },
      { id: 20, name: 'Destination', order: 2, active: true },
    ],
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
      reactAuthoredProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      graphVersion: 4,
      graphRevision: REVISION,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 32,
      },
      layoutRows: instructionFacts.map(row => ({
        instructionId: row.instructionId,
        blockId: row.blockId,
        blockOrderNumber: row.blockOrderNumber,
        instructionOrderNumber: row.instructionOrderNumber,
      })),
      instructionFacts,
      variableFacts: [{
        variableId: 9,
        ownerInstructionId: 1,
      }],
    },
  };
};

test('moves an already-disconnected instruction freely without inventing repairs', () => {
  const result = planVariablesFreeMove(snapshot(), {
    sourceInstructionId: 3,
    destinationBlockId: 10,
    destinationIndex: 0,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.draft.layoutRows
    .filter(row => row.blockId === 10)
    .map(row => row.instructionId)).toEqual([3, 1, 2]);
  expect(result.plan.clearedRelationships).toEqual([]);
  expect(result.plan.draft.instructionRelationPatches).toEqual([]);
  expect(result.plan.preservedVariableId).toBe(9);
});

test('normalizes malformed legacy links instead of allowing them to block a drag', () => {
  const current = snapshot();
  if (!current.mutationCapability) throw new Error('Missing capability');
  current.mutationCapability = {
    ...current.mutationCapability,
    instructionFacts: current.mutationCapability.instructionFacts.map(row =>
      row.instructionId === 3
        ? {
            ...row,
            parentId: null,
            parentBlockId: 10,
            variableId: 999,
          }
        : row),
  };

  const result = planVariablesFreeMove(current, {
    sourceInstructionId: 3,
    destinationBlockId: 10,
    destinationIndex: 0,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.draft.instructionRelationPatches).toEqual([{
    instructionId: 3,
    relationKind: 'ELEMENT_TARGET',
    operation: 'CLEAR',
    expected: { parentId: null, parentBlockId: 10 },
    replacement: { parentId: null, parentBlockId: null },
  }]);
  expect(result.plan.draft.variableBindingPatches).toEqual([{
    instructionId: 3,
    operation: 'CLEAR',
    expected: { value: 999 },
    replacement: { value: null },
  }]);
  expect(result.plan.preservedVariableId).toBeNull();
});

test('moves one connected instruction across Blocks and clears only the link invalidated by that move', () => {
  const result = planVariablesFreeMove(snapshot(), {
    sourceInstructionId: 2,
    destinationBlockId: 20,
    destinationIndex: 1,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.plan.draft.layoutRows
    .filter(row => row.blockId === 20)
    .map(row => row.instructionId)).toEqual([4, 2]);
  expect(result.plan.clearedRelationships).toEqual([
    expect.objectContaining({
      instructionId: 2,
      reason: 'PARENT_WRONG_BLOCK',
    }),
  ]);
  expect(result.plan.draft.instructionRelationPatches).toEqual([{
    instructionId: 2,
    relationKind: 'ELEMENT_TARGET',
    operation: 'CLEAR',
    expected: { parentId: 1, parentBlockId: 10 },
    replacement: { parentId: null, parentBlockId: null },
  }]);
  expect(result.plan.draft.variableBindingPatches).toEqual([]);
  expect(result.plan.preservedVariableId).toBe(9);
});
