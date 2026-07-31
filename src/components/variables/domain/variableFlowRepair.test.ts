import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';
import {
  buildVariableFlowRepairMutation,
  getVariableFlowGetCandidates,
  planVariableFlowRepair,
  reviewVariableFlowRepair,
  validateVariableFlowRepairAuthority,
} from './variableFlowRepair';

const REVISION = 'a'.repeat(64);

const workspaceSnapshot = (
  overrides: {
    ownerInstructionId?: number | null;
    getParentId?: number | null;
    getParentBlockId?: number | null;
    getVariableId?: number | null;
    graphRevision?: string;
    includeVariableFacts?: boolean;
  } = {},
): VariableWorkspaceSnapshot => {
  const ownerInstructionId = overrides.ownerInstructionId ?? null;
  const facts = [
    {
      instructionId: 10,
      blockId: 100,
      blockOrderNumber: 1,
      instructionOrderNumber: 1,
      action: 'C',
      relationKind: 'ELEMENT_TARGET',
      parentId: null,
      parentBlockId: null,
      variableId: null,
      tagName: 'input',
    },
    {
      instructionId: 11,
      blockId: 100,
      blockOrderNumber: 1,
      instructionOrderNumber: 2,
      action: 'GET',
      relationKind: 'ELEMENT_TARGET',
      parentId: overrides.getParentId ?? null,
      parentBlockId: overrides.getParentBlockId ?? null,
      variableId: overrides.getVariableId ?? null,
      tagName: null,
    },
    {
      instructionId: 12,
      blockId: 100,
      blockOrderNumber: 1,
      instructionOrderNumber: 3,
      action: 'E',
      relationKind: 'ELEMENT_TARGET',
      parentId: 10,
      parentBlockId: 100,
      variableId: 7,
      tagName: null,
    },
    {
      instructionId: 13,
      blockId: 100,
      blockOrderNumber: 1,
      instructionOrderNumber: 4,
      action: 'GET',
      relationKind: 'ELEMENT_TARGET',
      parentId: 10,
      parentBlockId: 100,
      variableId: 9,
      tagName: null,
    },
    {
      instructionId: 20,
      blockId: 200,
      blockOrderNumber: 2,
      instructionOrderNumber: 1,
      action: 'C',
      relationKind: 'ELEMENT_TARGET',
      parentId: null,
      parentBlockId: null,
      variableId: null,
      tagName: 'div',
    },
    {
      instructionId: 21,
      blockId: 200,
      blockOrderNumber: 2,
      instructionOrderNumber: 2,
      action: 'GET',
      relationKind: 'ELEMENT_TARGET',
      parentId: null,
      parentBlockId: null,
      variableId: null,
      tagName: null,
    },
  ] as const;
  const commands = facts.map(fact => ({
    id: fact.instructionId,
    name: fact.instructionId === 10
      ? 'Account field'
      : fact.instructionId === 20
        ? 'Balance field'
        : fact.action === 'GET'
          ? `GET ${fact.instructionId}`
          : `Command ${fact.instructionId}`,
    command: fact.action,
    operation: '',
    blockId: fact.blockId,
    blockName: fact.blockId === 100 ? 'Login' : 'Balance',
    blockOrder: fact.blockOrderNumber,
    instructionOrder: fact.instructionOrderNumber,
    parentId: fact.parentId,
    parentBlockId: fact.parentBlockId,
    variableId: fact.variableId,
    tagName: fact.tagName,
    active: fact.instructionId !== 21,
    blockActive: true,
  }));
  const capability = {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
    reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
    graphVersion: 4,
    graphRevision: overrides.graphRevision ?? REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 30,
    },
    layoutRows: facts.map(fact => ({
      instructionId: fact.instructionId,
      blockId: fact.blockId,
      blockOrderNumber: fact.blockOrderNumber,
      instructionOrderNumber: fact.instructionOrderNumber,
    })),
    instructionFacts: facts,
    ...(overrides.includeVariableFacts === false
      ? {}
      : {
          variableFacts: [
            { variableId: 7, ownerInstructionId },
            { variableId: 9, ownerInstructionId: 10 },
          ],
        }),
  };
  return {
    ok: true,
    message: 'loaded',
    requestId: 'request-1',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 1,
    graphRevision: overrides.graphRevision ?? REVISION,
    botJob: {
      id: 30,
      name: 'Test',
      homeBankingId: 2,
      organizationName: 'Banca',
    },
    summary: {
      variableCount: 2,
      producerCount: 1,
      consumerCount: 1,
      literalAssignmentCount: 0,
      warningCount: 1,
      unusedCount: 0,
    },
    blocks: [
      { id: 100, name: 'Login', order: 1, active: true },
      { id: 200, name: 'Balance', order: 2, active: true },
    ],
    commands,
    variables: [
      {
        id: 7,
        name: 'account_number',
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
        health: 'ERROR',
      },
      {
        id: 9,
        name: 'other_value',
        type: '$String',
        configuredValue: '',
        localFormat: '',
        delimiter: '',
        owner: commands[0],
        commands: [],
        producers: [],
        consumers: [],
        literalAssignments: [],
        invalidLinks: [],
        diagnostics: [],
        unused: false,
        health: 'HEALTHY',
      },
    ],
    edges: [],
    diagnostics: [],
    runtimeMemory: {
      revision: 1,
      variables: [],
    },
    mutationCapability: capability,
  } as unknown as VariableWorkspaceSnapshot;
};

test('plans searchable Web Element and active GET candidates from frozen facts', () => {
  const result = planVariableFlowRepair(workspaceSnapshot(), 7);
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  expect(result.plan.currentOwnerInstructionId).toBeNull();
  expect(result.plan.webElementCandidates.map(item => item.instructionId))
    .toEqual([10, 20]);
  expect(result.plan.getCandidates.map(item => item.instructionId))
    .toEqual([11, 13]);
  expect(getVariableFlowGetCandidates(result.plan, 10).map(item =>
    item.instructionId)).toEqual([11, 13]);
  expect(getVariableFlowGetCandidates(result.plan, 20)).toEqual([]);
  expect(result.plan.webElementCandidates[0].existingVariableIds).toEqual([9]);
});

test('requires explicit compatible Web Element and GET choices', () => {
  const result = planVariableFlowRepair(workspaceSnapshot(), 7);
  if (!result.ok) throw new Error(result.message);

  expect(reviewVariableFlowRepair(result.plan, {})).toMatchObject({
    ok: false,
    code: 'WEB_ELEMENT_REQUIRED',
  });
  expect(reviewVariableFlowRepair(result.plan, {
    webElementInstructionId: 10,
  })).toMatchObject({
    ok: false,
    code: 'GET_REQUIRED',
  });
  expect(reviewVariableFlowRepair(result.plan, {
    webElementInstructionId: 20,
    getInstructionId: 11,
  })).toMatchObject({
    ok: false,
    code: 'INCOMPATIBLE_GET',
  });
});

test('builds one atomic owner, GET parent, and GET variable-binding draft', () => {
  const result = planVariableFlowRepair(workspaceSnapshot({
    ownerInstructionId: 999,
  }), 7);
  if (!result.ok) throw new Error(result.message);

  const built = buildVariableFlowRepairMutation(result.plan, {
    webElementInstructionId: 10,
    getInstructionId: 11,
  });
  expect(built.ok).toBe(true);
  if (!built.ok) return;

  expect(built.draft.mutationKind).toBe('RELATIONSHIP_UPDATE');
  expect(built.draft.draggedInstructionId).toBeNull();
  expect(built.draft.layoutRows).toEqual(
    result.plan.unchangedLayout,
  );
  expect(built.draft.instructionRelationPatches).toEqual([{
    instructionId: 11,
    relationKind: 'ELEMENT_TARGET',
    operation: 'SET',
    expected: { parentId: null, parentBlockId: null },
    replacement: { parentId: 10, parentBlockId: 100 },
  }]);
  expect(built.draft.variableBindingPatches).toEqual([{
    instructionId: 11,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 7 },
  }]);
  expect(built.draft.variableOwnerPatches).toEqual([{
    variableId: 7,
    operation: 'SET',
    expected: { value: 999 },
    replacement: { value: 10 },
  }]);
});

test('reviews reassignment, duplicate ownership, and remaining execution order', () => {
  const result = planVariableFlowRepair(workspaceSnapshot(), 7);
  if (!result.ok) throw new Error(result.message);

  const reviewed = reviewVariableFlowRepair(result.plan, {
    webElementInstructionId: 10,
    getInstructionId: 13,
  });
  expect(reviewed).toMatchObject({
    ok: true,
    review: {
      reassignedVariableId: 9,
      duplicateOwnerVariableIds: [9],
      executionOrderIssueInstructionIds: [12],
    },
  });
});

test('refuses owner repair without exact authoritative variable-owner facts', () => {
  const result = planVariableFlowRepair(workspaceSnapshot({
    includeVariableFacts: false,
  }), 7);
  expect(result).toMatchObject({
    ok: false,
    code: 'VARIABLE_OWNER_FACTS_UNAVAILABLE',
  });
});

test('detects a stale frozen flow plan before submission', () => {
  const result = planVariableFlowRepair(workspaceSnapshot(), 7);
  if (!result.ok) throw new Error(result.message);

  expect(validateVariableFlowRepairAuthority(
    result.plan,
    workspaceSnapshot(),
  )).toBe(true);
  expect(validateVariableFlowRepairAuthority(
    result.plan,
    workspaceSnapshot({ graphRevision: 'b'.repeat(64) }),
  )).toBe(false);
});

test('does not submit an already-connected flow', () => {
  const result = planVariableFlowRepair(workspaceSnapshot({
    ownerInstructionId: 10,
    getParentId: 10,
    getParentBlockId: 100,
    getVariableId: 7,
  }), 7);
  if (!result.ok) throw new Error(result.message);

  expect(buildVariableFlowRepairMutation(result.plan, {
    webElementInstructionId: 10,
    getInstructionId: 11,
  })).toMatchObject({
    ok: false,
    code: 'NO_CHANGES',
  });
});
