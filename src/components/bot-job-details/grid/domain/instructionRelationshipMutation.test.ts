import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  buildInstructionRelationshipMutation,
  type InstructionRelationshipMutationResult,
} from './instructionRelationshipMutation';
import type {
  InstructionRelationshipEdge,
  RelationshipOwner,
  RelationshipTarget,
} from './instructionRelationshipGraph';

const OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 5,
};

const OTHER_OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 6,
};

const instruction = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  overrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 2,
  tagName: 'input',
  botJobId: 5,
  botJobName: 'Relationship mutation',
  id,
  instructionOrderNumber,
  name: `Instruction ${id}`,
  description: '',
  blockId,
  blockOrderNumber,
  blockName: `Block ${blockId}`,
  blockActive: true,
  blockWait: 0,
  actions: 'GET',
  operation: '',
  instructionActive: true,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  ...overrides,
});

const instructionsWithSource = (
  sourceOverrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO[] => [
  instruction(10, 10, 1, 1),
  instruction(20, 10, 1, 2, sourceOverrides),
  instruction(30, 20, 2, 1),
];

const COMPLETE_LAYOUT = [
  {
    instructionId: 10,
    blockId: 10,
    blockOrderNumber: 1,
    instructionOrderNumber: 1,
  },
  {
    instructionId: 20,
    blockId: 10,
    blockOrderNumber: 1,
    instructionOrderNumber: 2,
  },
  {
    instructionId: 30,
    blockId: 20,
    blockOrderNumber: 2,
    instructionOrderNumber: 1,
  },
];

const instructionTarget = (
  id: number,
  owner: RelationshipOwner = OWNER,
): RelationshipTarget => ({
  entity: 'INSTRUCTION',
  owner,
  id,
});

const variableTarget = (
  id: number,
  owner: RelationshipOwner = OWNER,
): RelationshipTarget => ({
  entity: 'VARIABLE',
  owner,
  id,
});

const edge = (
  kind: 'ELEMENT_TARGET' | 'VARIABLE_BINDING',
  target: RelationshipTarget | null,
  compatibleTargets: readonly RelationshipTarget[],
): InstructionRelationshipEdge => ({
  id: `${kind}:20`,
  kind,
  source: instructionTarget(20),
  target,
  state: target
    ? 'CONNECTED'
    : kind === 'ELEMENT_TARGET'
      ? 'RECONNECT_PARENT'
      : 'RECONNECT_VARIABLE',
  code: null,
  required: true,
  compatibleTargets,
});

const requireDraft = (result: InstructionRelationshipMutationResult) => {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.draft;
};

describe('buildInstructionRelationshipMutation', () => {
  it('builds ELEMENT_TARGET SET with the exact legacy expectation and complete unchanged layout', () => {
    const instructions = instructionsWithSource({
      parentId: 10,
      parentBlockId: null,
    });
    const nextTarget = instructionTarget(30);

    const draft = requireDraft(buildInstructionRelationshipMutation(
      edge(
        'ELEMENT_TARGET',
        instructionTarget(10),
        [nextTarget],
      ),
      { mode: 'CONNECT', target: nextTarget },
      instructions,
    ));

    expect(draft).toEqual({
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: COMPLETE_LAYOUT,
      instructionRelationPatches: [{
        instructionId: 20,
        relationKind: 'ELEMENT_TARGET',
        operation: 'SET',
        expected: {
          parentId: 10,
          parentBlockId: null,
        },
        replacement: {
          parentId: 30,
          parentBlockId: 20,
        },
      }],
      variableBindingPatches: [],
      variableOwnerPatches: [],
    });
  });

  it('builds ELEMENT_TARGET CLEAR with the exact current relationship', () => {
    const instructions = instructionsWithSource({
      parentId: 10,
      parentBlockId: 10,
    });

    const draft = requireDraft(buildInstructionRelationshipMutation(
      edge(
        'ELEMENT_TARGET',
        instructionTarget(10),
        [instructionTarget(30)],
      ),
      { mode: 'DISCONNECT' },
      instructions,
    ));

    expect(draft).toEqual({
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: COMPLETE_LAYOUT,
      instructionRelationPatches: [{
        instructionId: 20,
        relationKind: 'ELEMENT_TARGET',
        operation: 'CLEAR',
        expected: {
          parentId: 10,
          parentBlockId: 10,
        },
        replacement: {
          parentId: null,
          parentBlockId: null,
        },
      }],
      variableBindingPatches: [],
      variableOwnerPatches: [],
    });
  });

  it('builds VARIABLE_BINDING SET with a complete unchanged layout', () => {
    const instructions = instructionsWithSource({ variableId: 100 });
    const nextTarget = variableTarget(200);

    const draft = requireDraft(buildInstructionRelationshipMutation(
      edge(
        'VARIABLE_BINDING',
        variableTarget(100),
        [nextTarget],
      ),
      { mode: 'CONNECT', target: nextTarget },
      instructions,
    ));

    expect(draft).toEqual({
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: COMPLETE_LAYOUT,
      instructionRelationPatches: [],
      variableBindingPatches: [{
        instructionId: 20,
        operation: 'SET',
        expected: { value: 100 },
        replacement: { value: 200 },
      }],
      variableOwnerPatches: [],
    });
  });

  it('builds VARIABLE_BINDING CLEAR with the exact current binding', () => {
    const instructions = instructionsWithSource({ variableId: 100 });

    const draft = requireDraft(buildInstructionRelationshipMutation(
      edge(
        'VARIABLE_BINDING',
        variableTarget(100),
        [variableTarget(200)],
      ),
      { mode: 'DISCONNECT' },
      instructions,
    ));

    expect(draft).toEqual({
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: COMPLETE_LAYOUT,
      instructionRelationPatches: [],
      variableBindingPatches: [{
        instructionId: 20,
        operation: 'CLEAR',
        expected: { value: 100 },
        replacement: { value: null },
      }],
      variableOwnerPatches: [],
    });
  });

  it.each([
    {
      label: 'Web Element',
      kind: 'ELEMENT_TARGET' as const,
      compatible: instructionTarget(30),
      selected: instructionTarget(30, OTHER_OWNER),
    },
    {
      label: 'variable',
      kind: 'VARIABLE_BINDING' as const,
      compatible: variableTarget(200),
      selected: variableTarget(200, OTHER_OWNER),
    },
  ])('rejects a $label target whose owner is not an exact compatible match', ({
    kind,
    compatible,
    selected,
  }) => {
    const result = buildInstructionRelationshipMutation(
      edge(kind, null, [compatible]),
      { mode: 'CONNECT', target: selected },
      instructionsWithSource(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'UNKNOWN_TARGET',
    });
  });

  it('rejects exact current Web Element and variable selections as NO_CHANGE', () => {
    const elementTarget = instructionTarget(30);
    const elementResult = buildInstructionRelationshipMutation(
      edge('ELEMENT_TARGET', elementTarget, [elementTarget]),
      { mode: 'CONNECT', target: elementTarget },
      instructionsWithSource({
        parentId: 30,
        parentBlockId: 20,
      }),
    );

    const variable = variableTarget(200);
    const variableResult = buildInstructionRelationshipMutation(
      edge('VARIABLE_BINDING', variable, [variable]),
      { mode: 'CONNECT', target: variable },
      instructionsWithSource({ variableId: 200 }),
    );

    expect(elementResult).toMatchObject({
      ok: false,
      code: 'NO_CHANGE',
    });
    expect(variableResult).toMatchObject({
      ok: false,
      code: 'NO_CHANGE',
    });
  });
});
