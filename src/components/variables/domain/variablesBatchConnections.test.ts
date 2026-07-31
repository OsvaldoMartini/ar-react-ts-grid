import type {
  VariableGraphEntry,
  VariableInstructionNode,
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  buildVariablesBatchResolveMutation,
  isVariablesBatchConnectionsPlanStale,
  planVariablesBatchRelease,
  planVariablesBatchResolve,
  reviewVariablesBatchResolve,
  validateVariablesBatchConnectionsAuthority,
  type VariablesBatchResolveChoice,
} from './variablesBatchConnections';

const ownerNode = (
  id: number,
  blockId: number,
  blockOrder: number,
  instructionOrder: number,
  name = `Element ${id}`,
): VariableInstructionNode => ({
  id,
  name,
  command: 'O',
  operation: '',
  blockId,
  blockName: `Block ${blockId}`,
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  tagName: 'input',
  active: true,
  blockActive: true,
});

const variable = (
  id: number,
  owner: VariableInstructionNode | null,
): VariableGraphEntry => ({
  id,
  name: `Variable ${id}`,
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner,
  commands: [],
  producers: [],
  consumers: [],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: true,
  health: owner ? 'UNUSED' : 'WARNING',
});

const fact = (
  instructionId: number,
  action: string,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  overrides: Partial<VariablesInstructionFact> = {},
): VariablesInstructionFact => ({
  instructionId,
  action,
  relationKind: action === 'GOTO'
    ? 'BLOCK_TARGET'
    : action === 'LOOP'
      ? 'LOOP_ANCHOR'
      : action === 'IF' || action === 'ENDIF'
        ? 'CONDITIONAL_ROOT'
        : 'ELEMENT_TARGET',
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  tagName: action === 'O' ? 'input' : null,
  ...overrides,
});

const snapshot = (
  facts: readonly VariablesInstructionFact[],
  variables: readonly VariableGraphEntry[] = [],
): VariableWorkspaceSnapshot => {
  const commands: VariableInstructionNode[] = facts.map(row => ({
    id: row.instructionId,
    name: `${row.action} ${row.instructionId}`,
    command: row.action,
    operation: '',
    blockId: row.blockId,
    blockName: `Block ${row.blockId}`,
    blockOrder: row.blockOrderNumber,
    instructionOrder: row.instructionOrderNumber,
    parentId: row.parentId,
    parentBlockId: row.parentBlockId,
    variableId: row.variableId,
    tagName: row.tagName,
    active: true,
    blockActive: true,
  }));
  const blockIds = [...new Set(facts.map(row => row.blockId))];
  return {
    ok: true,
    message: 'ready',
    requestId: 'request-1',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 7,
    graphRevision: 'a'.repeat(64),
    botJob: {
      id: 30,
      name: 'Test',
      homeBankingId: 2,
      organizationName: 'Banca',
    },
    summary: {
      variableCount: variables.length,
      producerCount: 0,
      consumerCount: 0,
      literalAssignmentCount: 0,
      warningCount: 0,
      unusedCount: variables.length,
    },
    blocks: blockIds.map((id, index) => ({
      id,
      name: `Block ${id}`,
      order: index + 1,
      active: true,
    })),
    commands,
    variables: [...variables],
    edges: [],
    diagnostics: [],
    runtimeMemory: {
      revision: 0,
      variables: [],
    },
    mutationCapability: {
      enabled: true,
      contractVersion: 3,
      profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
      crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      graphVersion: 4,
      graphRevision: 'b'.repeat(64),
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 30,
      },
      layoutRows: facts.map(row => ({
        instructionId: row.instructionId,
        blockId: row.blockId,
        blockOrderNumber: row.blockOrderNumber,
        instructionOrderNumber: row.instructionOrderNumber,
      })),
      instructionFacts: facts.map(row => ({ ...row })),
      variableFacts: variables.map(entry => ({
        variableId: entry.id,
        ownerInstructionId: entry.owner?.id ?? null,
      })),
    },
  };
};

test('RELEASE clears parent and variable binding once while preserving layout and owners', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'LOOP', 10, 1, 3, {
      parentId: 1,
      parentBlockId: 10,
    }),
  ], [variable(100, ownerNode(1, 10, 1, 1))]);

  const result = planVariablesBatchRelease(current, [2, 2]);
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  expect(result.plan.visibleInstructionIds).toEqual([2]);
  expect(result.plan.changedInstructionIds).toEqual([2]);
  expect(result.plan.draft.layoutRows).toEqual(
    current.mutationCapability?.layoutRows,
  );
  expect(result.plan.draft.instructionRelationPatches).toEqual([{
    instructionId: 2,
    relationKind: 'ELEMENT_TARGET',
    operation: 'CLEAR',
    expected: { parentId: 1, parentBlockId: 10 },
    replacement: { parentId: null, parentBlockId: null },
  }]);
  expect(result.plan.draft.variableBindingPatches).toEqual([{
    instructionId: 2,
    operation: 'CLEAR',
    expected: { value: 100 },
    replacement: { value: null },
  }]);
  expect(result.plan.draft.variableOwnerPatches).toEqual([]);
  expect(result.plan.draft.instructionRelationPatches).toHaveLength(1);
});

test('RESOLVE projects the unique parent before deriving variable compatibility', () => {
  const element = ownerNode(1, 10, 1, 1);
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2),
  ], [variable(100, element)]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;

  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: '2:ELEMENT_TARGET',
      resolution: 'AUTO',
      selectedTarget: expect.objectContaining({ entity: 'INSTRUCTION', id: 1 }),
    }),
    expect.objectContaining({
      reviewId: '2:VARIABLE_BINDING',
      resolution: 'AUTO',
      selectedTarget: expect.objectContaining({ entity: 'VARIABLE', id: 100 }),
    }),
  ]));

  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.instructionRelationPatches).toEqual([{
    instructionId: 2,
    relationKind: 'ELEMENT_TARGET',
    operation: 'SET',
    expected: { parentId: null, parentBlockId: null },
    replacement: { parentId: 1, parentBlockId: 10 },
  }]);
  expect(built.mutation.draft.variableBindingPatches).toEqual([{
    instructionId: 2,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 100 },
  }]);
  expect(built.mutation.draft.variableOwnerPatches).toEqual([]);
  expect(built.mutation.draft.layoutRows).toEqual(
    current.mutationCapability?.layoutRows,
  );
});

test('RESOLVE never guesses an ambiguous parent and refreshes variable choices after review', () => {
  const ownerOne = ownerNode(1, 10, 1, 1);
  const ownerTwo = ownerNode(2, 10, 1, 2);
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'O', 10, 1, 2),
    fact(3, 'GET', 10, 1, 3),
  ], [
    variable(100, ownerOne),
    variable(200, ownerTwo),
  ]);

  const planned = planVariablesBatchResolve(current, [3]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;

  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: '3:ELEMENT_TARGET',
      resolution: 'REVIEW_REQUIRED',
      compatibleTargets: [
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ],
    }),
    expect.objectContaining({
      reviewId: '3:VARIABLE_BINDING',
      resolution: 'BLOCKED',
      blockedByReviewId: '3:ELEMENT_TARGET',
    }),
  ]));
  const incomplete = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(incomplete).toEqual(expect.objectContaining({
    ok: false,
    code: 'REVIEW_REQUIRED',
  }));

  const parentTarget = planned.plan.reviewItems
    .find(item => item.reviewId === '3:ELEMENT_TARGET')
    ?.compatibleTargets.find(target => target.id === 2);
  expect(parentTarget).toBeDefined();
  const choices: VariablesBatchResolveChoice[] = [{
    reviewId: '3:ELEMENT_TARGET',
    mode: 'CONNECT',
    target: parentTarget!,
  }];
  const reviewed = reviewVariablesBatchResolve(planned.plan, choices);
  expect(reviewed.ok).toBe(true);
  if (!reviewed.ok) return;
  expect(reviewed.review.items).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: '3:VARIABLE_BINDING',
      resolution: 'AUTO',
      compatibleTargets: [
        expect.objectContaining({ entity: 'VARIABLE', id: 200 }),
      ],
    }),
  ]));

  const built = buildVariablesBatchResolveMutation(planned.plan, choices);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.instructionRelationPatches[0])
    .toEqual(expect.objectContaining({
      instructionId: 3,
      replacement: { parentId: 2, parentBlockId: 10 },
    }));
  expect(built.mutation.draft.variableBindingPatches[0])
    .toEqual(expect.objectContaining({
      instructionId: 3,
      replacement: { value: 200 },
    }));
});

test('RESOLVE repairs FIX_ORDER while leaving positional scope derived-only', () => {
  const current = snapshot([
    fact(1, 'GET', 10, 1, 1, {
      parentId: 2,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(2, 'O', 10, 1, 2),
    fact(3, 'E', 10, 1, 3, {
      parentId: 2,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, ownerNode(2, 10, 1, 2))]);

  const planned = planVariablesBatchResolve(current, [1, 3]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual([
    expect.objectContaining({
      reviewId: '1:ELEMENT_TARGET',
      sourceInstructionId: 1,
      state: 'FIX_ORDER',
      resolution: 'AUTO',
      selectedTarget: expect.objectContaining({ id: 2 }),
    }),
  ]);
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.mutationKind).toBe('ROW_MOVE');
  expect(built.mutation.draft.draggedInstructionId).toBe(1);
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([2, 1, 3]);
  expect(built.mutation.draft.instructionRelationPatches).toEqual([]);
});

test('RESOLVE moves a variable reader after its reviewed runtime writer', () => {
  const owner = ownerNode(1, 10, 1, 1);
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'E', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'GET', 10, 1, 3, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, owner)]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual([
    expect.objectContaining({
      reviewId: '2:VARIABLE_ORDER',
      kind: 'VARIABLE_ORDER',
      state: 'FIX_ORDER',
      resolution: 'AUTO',
      selectedTarget: expect.objectContaining({ id: 3 }),
    }),
  ]);
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([1, 3, 2]);
});

test('RESOLVE repairs a dangling variable owner with an exact owner patch', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, null)]);
  current.mutationCapability!.variableFacts = [{
    variableId: 100,
    ownerInstructionId: 999,
  }];

  const planned = planVariablesBatchResolve(current, [1, 2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      sourceEntity: 'VARIABLE',
      sourceVariableId: 100,
      kind: 'VARIABLE_OWNER',
      currentTarget: expect.objectContaining({ id: 999 }),
      selectedTarget: expect.objectContaining({ id: 1 }),
    }),
  ]));
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'SET',
    expected: { value: 999 },
    replacement: { value: 1 },
  }]);
});

test('RESOLVE offers ownership for a visible bound command with a null owner', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, null)]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      sourceVariableId: 100,
      state: 'MEMORY_ONLY',
      selectedTarget: expect.objectContaining({ id: 1 }),
    }),
  ]));
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 1 },
  }]);
});

test('RELEASE clears only variable owners whose owner row is visible', () => {
  const owner = ownerNode(1, 10, 1, 1);
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, owner)]);

  const hiddenOwner = planVariablesBatchRelease(current, [2]);
  expect(hiddenOwner.ok).toBe(true);
  if (!hiddenOwner.ok) return;
  expect(hiddenOwner.plan.draft.variableOwnerPatches).toEqual([]);

  const visibleOwner = planVariablesBatchRelease(current, [1]);
  expect(visibleOwner.ok).toBe(true);
  if (!visibleOwner.ok) return;
  expect(visibleOwner.plan.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'CLEAR',
    expected: { value: 1 },
    replacement: { value: null },
  }]);
});

test('RELEASE clears a dangling owner when a visible command uses its variable', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, null)]);
  current.mutationCapability!.variableFacts = [{
    variableId: 100,
    ownerInstructionId: 999,
  }];

  const release = planVariablesBatchRelease(current, [2]);
  expect(release.ok).toBe(true);
  if (!release.ok) return;
  expect(release.plan.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'CLEAR',
    expected: { value: 999 },
    replacement: { value: null },
  }]);
});

test('RESOLVE excludes Web Elements already owned by another variable', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'O', 10, 1, 2),
    fact(3, 'GET', 10, 1, 3, {
      parentId: 2,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [
    variable(100, null),
    variable(200, ownerNode(1, 10, 1, 1)),
  ]);

  const planned = planVariablesBatchResolve(current, [3]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      compatibleTargets: [expect.objectContaining({ id: 2 })],
      selectedTarget: expect.objectContaining({ id: 2 }),
      resolution: 'AUTO',
    }),
  ]));

  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 2 },
  }]);
});

test('RESOLVE reserves an automatically selected owner for only one variable', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'GET', 10, 1, 3, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 200,
    }),
  ], [variable(100, null), variable(200, null)]);

  const planned = planVariablesBatchResolve(current, [2, 3]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      selectedTarget: expect.objectContaining({ id: 1 }),
      resolution: 'AUTO',
    }),
    expect.objectContaining({
      reviewId: 'VARIABLE:200:VARIABLE_OWNER',
      compatibleTargets: [],
      selectedTarget: null,
      resolution: 'UNAVAILABLE',
    }),
  ]));

  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 1 },
  }]);
});

test('RESOLVE rejects reviewed owner choices that collide in one draft', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'O', 10, 1, 2),
    fact(3, 'E', 10, 1, 3, {
      parentId: 1,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(4, 'E', 10, 1, 4, {
      parentId: 2,
      parentBlockId: 10,
      variableId: 200,
    }),
  ], [variable(100, null), variable(200, null)]);

  const planned = planVariablesBatchResolve(current, [3, 4]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const firstTarget = planned.plan.reviewItems
    .find(item => item.reviewId === 'VARIABLE:100:VARIABLE_OWNER')
    ?.compatibleTargets.find(target => target.id === 1);
  const secondTarget = planned.plan.reviewItems
    .find(item => item.reviewId === 'VARIABLE:200:VARIABLE_OWNER')
    ?.compatibleTargets.find(target => target.id === 1);
  expect(firstTarget).toBeDefined();
  expect(secondTarget).toBeDefined();

  const choices: VariablesBatchResolveChoice[] = [
    {
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      mode: 'CONNECT',
      target: firstTarget!,
    },
    {
      reviewId: 'VARIABLE:200:VARIABLE_OWNER',
      mode: 'CONNECT',
      target: secondTarget!,
    },
  ];
  expect(reviewVariablesBatchResolve(planned.plan, choices)).toEqual(
    expect.objectContaining({
      ok: false,
      code: 'INCOMPATIBLE_REVIEW_TARGET',
    }),
  );
});

test('RESOLVE repairs a newly bound ownerless variable in the same draft', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
    fact(2, 'GET', 10, 1, 2),
  ], [variable(100, null)]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: '2:ELEMENT_TARGET',
      selectedTarget: expect.objectContaining({ id: 1 }),
    }),
    expect.objectContaining({
      reviewId: '2:VARIABLE_BINDING',
      selectedTarget: expect.objectContaining({ id: 100 }),
    }),
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      compatibleTargets: [expect.objectContaining({ id: 1 })],
      selectedTarget: expect.objectContaining({ id: 1 }),
    }),
  ]));

  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.variableBindingPatches).toEqual([{
    instructionId: 2,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 100 },
  }]);
  expect(built.mutation.draft.variableOwnerPatches).toEqual([{
    variableId: 100,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 1 },
  }]);
});

test('RESOLVE preserves a hidden reader dependency during order repair', () => {
  const current = snapshot([
    fact(1, 'GET', 10, 1, 1, {
      parentId: 3,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(2, 'E', 10, 1, 2, {
      parentId: 3,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'O', 10, 1, 3),
  ], [variable(100, ownerNode(3, 10, 1, 3))]);

  const planned = planVariablesBatchResolve(current, [1]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([3, 1, 2]);
});

test('RESOLVE preserves the exact hidden writer with multiple producers', () => {
  const current = snapshot([
    fact(10, 'O', 10, 1, 1),
    fact(1, 'GET', 10, 1, 2, {
      parentId: 3,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(2, 'GET', 10, 1, 3, {
      parentId: 10,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'O', 10, 1, 4),
    fact(4, 'E', 10, 1, 5, {
      parentId: 10,
      parentBlockId: 10,
      variableId: 100,
    }),
  ], [variable(100, null)]);

  const planned = planVariablesBatchResolve(current, [1]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.plan.reviewItems).toEqual(expect.arrayContaining([
    expect.objectContaining({
      reviewId: 'VARIABLE:100:VARIABLE_OWNER',
      resolution: 'UNAVAILABLE',
    }),
  ]));
  const lateElement = planned.plan.reviewItems
    .find(item => item.reviewId === '1:ELEMENT_TARGET')
    ?.compatibleTargets.find(target => target.id === 3);
  expect(lateElement).toBeDefined();
  const built = buildVariablesBatchResolveMutation(planned.plan, [{
    reviewId: '1:ELEMENT_TARGET',
    mode: 'CONNECT',
    target: lateElement!,
  }]);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([10, 3, 1, 2, 4]);
});

test('RESOLVE preserves a cross-Block reader exact writer', () => {
  const current = snapshot([
    fact(10, 'O', 10, 1, 1),
    fact(1, 'GET', 10, 1, 2, {
      parentId: 3,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(2, 'GET', 10, 1, 3, {
      parentId: 10,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'O', 10, 1, 4),
    fact(20, 'O', 20, 2, 1),
    fact(4, 'E', 20, 2, 2, {
      parentId: 20,
      parentBlockId: 20,
      variableId: 100,
    }),
  ], [variable(100, null)]);

  const planned = planVariablesBatchResolve(current, [1]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const lateElement = planned.plan.reviewItems
    .find(item => item.reviewId === '1:ELEMENT_TARGET')
    ?.compatibleTargets.find(target => target.id === 3);
  expect(lateElement).toBeDefined();
  const built = buildVariablesBatchResolveMutation(planned.plan, [{
    reviewId: '1:ELEMENT_TARGET',
    mode: 'CONNECT',
    target: lateElement!,
  }]);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([10, 3, 1, 2, 20, 4]);
});

test('RESOLVE still repairs a selected late LOOP anchor', () => {
  const current = snapshot([
    fact(1, 'H', 10, 1, 1),
    fact(2, 'LOOP', 10, 1, 2, {
      parentId: 3,
      parentBlockId: 10,
    }),
    fact(3, 'O', 10, 1, 3),
  ]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([1, 3, 2]);
});

test('RESOLVE refuses an automatic order repair that enters an IF scope', () => {
  const current = snapshot([
    fact(1, 'GET', 10, 1, 1, {
      parentId: 3,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(2, 'IF', 10, 1, 2, {
      parentId: 2,
      parentBlockId: 10,
    }),
    fact(3, 'O', 10, 1, 3),
    fact(4, 'ENDIF', 10, 1, 4, {
      parentId: 2,
      parentBlockId: 10,
    }),
  ], [variable(100, ownerNode(3, 10, 1, 3))]);

  const planned = planVariablesBatchResolve(current, [1]);
  expect(planned).toEqual(expect.objectContaining({
    ok: false,
    code: 'ORDER_REPAIR_CONFLICT',
  }),
  );
});

test('RESOLVE repairs order within one IF scope without changing the scope', () => {
  const current = snapshot([
    fact(1, 'IF', 10, 1, 1, {
      parentId: 1,
      parentBlockId: 10,
    }),
    fact(2, 'GET', 10, 1, 2, {
      parentId: 4,
      parentBlockId: 10,
      variableId: 100,
    }),
    fact(3, 'H', 10, 1, 3),
    fact(4, 'O', 10, 1, 4),
    fact(5, 'ENDIF', 10, 1, 5, {
      parentId: 1,
      parentBlockId: 10,
    }),
  ], [variable(100, ownerNode(4, 10, 1, 4))]);

  const planned = planVariablesBatchResolve(current, [2]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const built = buildVariablesBatchResolveMutation(planned.plan, []);
  expect(built.ok).toBe(true);
  if (!built.ok) return;
  expect(built.mutation.draft.layoutRows.map(row => row.instructionId))
    .toEqual([1, 3, 4, 2, 5]);
});

test('authority validator rejects any changed frozen graph authority', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
  ]);
  const planned = planVariablesBatchRelease(current, [1]);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(validateVariablesBatchConnectionsAuthority(
    planned.plan.authorityKey,
    current,
  )).toBe(true);
  expect(isVariablesBatchConnectionsPlanStale(planned.plan, current)).toBe(false);

  const changed: VariableWorkspaceSnapshot = {
    ...current,
    mutationCapability: {
      ...current.mutationCapability!,
      graphVersion: current.mutationCapability!.graphVersion + 1,
    },
  };
  expect(validateVariablesBatchConnectionsAuthority(
    planned.plan.authorityKey,
    changed,
  )).toBe(false);
  expect(isVariablesBatchConnectionsPlanStale(planned.plan, changed)).toBe(true);
});

test('planning refuses stale or foreign visible instruction IDs', () => {
  const current = snapshot([
    fact(1, 'O', 10, 1, 1),
  ]);
  expect(planVariablesBatchRelease(current, [999])).toEqual(
    expect.objectContaining({
      ok: false,
      code: 'INVALID_VISIBLE_INSTRUCTION',
    }),
  );
  expect(planVariablesBatchResolve(current, [0])).toEqual(
    expect.objectContaining({
      ok: false,
      code: 'INVALID_VISIBLE_INSTRUCTION',
    }),
  );
});
