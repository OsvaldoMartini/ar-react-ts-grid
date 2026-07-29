import {
  buildInstructionRelationshipGraph,
  type InstructionRelationshipEdge,
  type InstructionRelationshipKind,
  type RelationshipBlockFact,
  type RelationshipInstructionFact,
  type RelationshipOwner,
  type RelationshipVariableFact,
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

const COMPONENT_OWNER: RelationshipOwner = {
  workspaceKind: 'COMPONENT',
  homeBankingId: 2,
};

const OTHER_COMPONENT_OWNER: RelationshipOwner = {
  workspaceKind: 'COMPONENT',
  homeBankingId: 3,
};

const instruction = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  actions: string,
  overrides: Partial<RelationshipInstructionFact> = {},
): RelationshipInstructionFact => ({
  owner: OWNER,
  id,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  actions,
  tagName: null,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  instructionActive: true,
  blockActive: true,
  ...overrides,
});

const block = (
  id: number,
  order: number,
  owner: RelationshipOwner = OWNER,
): RelationshipBlockFact => ({
  owner,
  id,
  order,
  active: true,
});

const variable = (
  id: number,
  ownerInstructionId: number | null,
  overrides: Partial<RelationshipVariableFact> = {},
): RelationshipVariableFact => ({
  owner: OWNER,
  id,
  type: '$String',
  ownerInstructionId,
  ...overrides,
});

const build = (
  instructions: RelationshipInstructionFact[],
  variables: RelationshipVariableFact[] = [],
  blocks: RelationshipBlockFact[] = [block(10, 1), block(20, 2)],
  owner = OWNER,
) => buildInstructionRelationshipGraph({
  owner,
  instructions,
  variables,
  blocks,
});

const edgeFor = (
  edges: readonly InstructionRelationshipEdge[],
  kind: InstructionRelationshipKind,
  sourceId: number,
): InstructionRelationshipEdge => {
  const found = edges.find(item =>
    item.kind === kind && item.source.id === sourceId);
  if (!found) throw new Error(`Missing ${kind} edge for ${sourceId}`);
  return found;
};

describe('buildInstructionRelationshipGraph', () => {
  it('classifies valid element and variable targets without mutating input facts', () => {
    const rows = [
      instruction(1, 10, 1, 1, 'O:Account', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
    ];
    const variables = [variable(100, 1)];
    const rowsBefore = JSON.stringify(rows);
    const variablesBefore = JSON.stringify(variables);

    const graph = build(rows, variables);

    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 2)).toMatchObject({
      state: 'CONNECTED',
      code: null,
      target: { entity: 'INSTRUCTION', id: 1 },
    });
    expect(edgeFor(graph.edges, 'VARIABLE_BINDING', 2)).toMatchObject({
      state: 'CONNECTED',
      code: null,
      target: { entity: 'VARIABLE', id: 100 },
    });
    expect(JSON.stringify(rows)).toBe(rowsBefore);
    expect(JSON.stringify(variables)).toBe(variablesBefore);
  });

  it.each([
    {
      label: 'missing',
      parentId: null,
      expected: 'MISSING_ELEMENT_TARGET',
    },
    {
      label: 'dangling',
      parentId: 999,
      expected: 'DANGLING_ELEMENT_TARGET',
    },
    {
      label: 'wrong role',
      parentId: 3,
      expected: 'INCOMPATIBLE_ELEMENT_TARGET',
    },
    {
      label: 'wrong Block',
      parentId: 4,
      expected: 'ELEMENT_TARGET_WRONG_BLOCK',
    },
    {
      label: 'after the command',
      parentId: 5,
      expected: 'ELEMENT_TARGET_ORDER',
    },
  ])('reports a $label element relationship', ({ parentId, expected }) => {
    const graph = build([
      instruction(1, 10, 1, 1, 'GET', {
        parentId,
        variableId: 100,
      }),
      instruction(3, 10, 1, 2, 'PAUSE'),
      instruction(5, 10, 1, 3, 'O', { tagName: 'input' }),
      instruction(4, 20, 2, 1, 'O', { tagName: 'input' }),
    ], [variable(100, null)]);

    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 1)).toMatchObject({
      state: expected === 'ELEMENT_TARGET_ORDER'
        ? 'FIX_ORDER'
        : 'RECONNECT_PARENT',
      code: expected,
      target: expected === 'ELEMENT_TARGET_ORDER'
        ? expect.objectContaining({ id: 5 })
        : null,
    });
  });

  it.each([
    {
      label: 'missing',
      variableId: null,
      variableType: '$String',
      ownerInstructionId: 1,
      expected: 'MISSING_VARIABLE_BINDING',
    },
    {
      label: 'dangling',
      variableId: 999,
      variableType: '$String',
      ownerInstructionId: 1,
      expected: 'DANGLING_VARIABLE_BINDING',
    },
    {
      label: 'incompatible type',
      variableId: 100,
      variableType: '@Unsupported',
      ownerInstructionId: 1,
      expected: 'INCOMPATIBLE_VARIABLE_TYPE',
    },
    {
      label: 'owner/parent mismatch',
      variableId: 100,
      variableType: '$String',
      ownerInstructionId: 2,
      expected: 'VARIABLE_OWNER_PARENT_MISMATCH',
    },
  ])('reports a $label variable binding', ({
    variableId,
    variableType,
    ownerInstructionId,
    expected,
  }) => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'O', { tagName: 'input' }),
      instruction(3, 10, 1, 3, 'GET', {
        parentId: 1,
        variableId,
      }),
    ], [
      variable(100, ownerInstructionId, { type: variableType }),
    ]);

    expect(edgeFor(graph.edges, 'VARIABLE_BINDING', 3)).toMatchObject({
      state: 'RECONNECT_VARIABLE',
      code: expected,
      target: null,
    });
  });

  it('allows an ownerless compatible variable binding', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
    ], [variable(100, null)]);

    expect(edgeFor(graph.edges, 'VARIABLE_BINDING', 2)).toMatchObject({
      state: 'CONNECTED',
      code: null,
      target: { entity: 'VARIABLE', id: 100 },
    });
  });

  it('enforces SET tag compatibility without adding a writer-order dependency', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O', { tagName: 'button' }),
      instruction(2, 10, 1, 2, 'O', { tagName: 'input' }),
      instruction(3, 10, 1, 3, 'SET', {
        parentId: 1,
        variableId: 100,
      }),
    ], [variable(100, 2)]);

    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 3)).toMatchObject({
      state: 'RECONNECT_PARENT',
      code: 'INCOMPATIBLE_ELEMENT_TARGET',
    });
    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 3).compatibleTargets)
      .toEqual([expect.objectContaining({ entity: 'INSTRUCTION', id: 2 })]);
    expect(graph.edges.some(item =>
      item.kind === 'VARIABLE_ORDER' && item.source.id === 3)).toBe(false);
  });

  it('classifies LOOP anchors and positional bodies independently', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'C'),
      instruction(3, 10, 1, 3, 'LOOP', { parentId: 1 }),
      instruction(4, 20, 2, 2, 'REFRESH_LOOP', { parentId: 1 }),
    ]);

    expect(edgeFor(graph.edges, 'LOOP_ANCHOR', 3)).toMatchObject({
      state: 'CONNECTED',
      target: { entity: 'INSTRUCTION', id: 1 },
    });
    expect(edgeFor(graph.edges, 'LOOP_ANCHOR', 4)).toMatchObject({
      state: 'RECONNECT_LOOP',
      code: 'LOOP_ANCHOR_WRONG_BLOCK',
    });
    expect(graph.edges).toContainEqual(expect.objectContaining({
      kind: 'POSITIONAL_SCOPE',
      source: expect.objectContaining({ id: 2 }),
      target: expect.objectContaining({ id: 3 }),
      required: false,
    }));
  });

  it.each([
    {
      label: 'missing',
      parentId: null,
      expectedCode: 'MISSING_LOOP_ANCHOR',
    },
    {
      label: 'dangling',
      parentId: 999,
      expectedCode: 'DANGLING_LOOP_ANCHOR',
    },
  ])('reports a $label LOOP anchor', ({ parentId, expectedCode }) => {
    const graph = build([
      instruction(1, 10, 1, 1, 'LOOP', { parentId }),
    ]);

    expect(edgeFor(graph.edges, 'LOOP_ANCHOR', 1)).toMatchObject({
      state: 'RECONNECT_LOOP',
      code: expectedCode,
      target: null,
    });
  });

  it('classifies an existing late LOOP anchor as FIX_ORDER', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'LOOP', { parentId: 2 }),
      instruction(2, 10, 1, 2, 'O'),
    ]);

    expect(edgeFor(graph.edges, 'LOOP_ANCHOR', 1)).toMatchObject({
      state: 'FIX_ORDER',
      code: 'LOOP_ANCHOR_ORDER',
      target: { entity: 'INSTRUCTION', id: 2 },
    });
  });

  it('classifies complete and malformed conditional families', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'IF', { parentId: 1 }),
      instruction(2, 10, 1, 2, 'C'),
      instruction(3, 10, 1, 3, 'ELSE', { parentId: 1 }),
      instruction(4, 10, 1, 4, 'ELSEIF', { parentId: 1 }),
      instruction(5, 10, 1, 5, 'ELSE', { parentId: 1 }),
      instruction(6, 10, 1, 6, 'ENDIF', { parentId: 1 }),
      instruction(20, 20, 2, 1, 'IF', { parentId: 20 }),
      instruction(21, 20, 2, 2, 'C'),
      instruction(30, 20, 2, 3, 'ENDIF', { parentId: 999 }),
    ]);

    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 1)).toMatchObject({
      state: 'CONNECTED',
      target: { id: 1 },
    });
    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 3).state).toBe('CONNECTED');
    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 4)).toMatchObject({
      state: 'REPAIR_CONDITIONAL',
      code: 'ELSEIF_AFTER_ELSE',
    });
    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 5)).toMatchObject({
      state: 'REPAIR_CONDITIONAL',
      code: 'DUPLICATE_ELSE',
    });
    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 20)).toMatchObject({
      state: 'REPAIR_CONDITIONAL',
      code: 'MISSING_ENDIF',
    });
    expect(edgeFor(graph.edges, 'CONDITIONAL_ROOT', 30)).toMatchObject({
      state: 'REPAIR_CONDITIONAL',
      code: 'CONDITIONAL_ROOT_MISMATCH',
    });
    expect(graph.edges).toContainEqual(expect.objectContaining({
      kind: 'POSITIONAL_SCOPE',
      source: expect.objectContaining({ id: 2 }),
      target: expect.objectContaining({ id: 1 }),
      required: false,
    }));
  });

  it('uses parentBlockId only for navigation destinations', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'GOTO', {
        parentId: 20,
        parentBlockId: 20,
      }),
      instruction(20, 10, 1, 2, 'O'),
      instruction(2, 10, 1, 3, 'EXCEL GOTO', {
        parentBlockId: 999,
      }),
    ]);

    expect(edgeFor(graph.edges, 'BLOCK_TARGET', 1)).toMatchObject({
      state: 'CONNECTED',
      target: { entity: 'BLOCK', id: 20 },
    });
    expect(edgeFor(graph.edges, 'BLOCK_TARGET', 2)).toMatchObject({
      state: 'RECONNECT_BLOCK',
      code: 'DANGLING_BLOCK_TARGET',
      target: null,
    });
  });

  it.each(['GOTO', 'EXCEL GOTO'])(
    'rejects a %s destination equal to its containing Block',
    (actions) => {
      const graph = build([
        instruction(1, 10, 1, 1, actions, {
          parentBlockId: 10,
        }),
      ]);

      expect(edgeFor(graph.edges, 'BLOCK_TARGET', 1)).toMatchObject({
        state: 'RECONNECT_BLOCK',
        code: 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
        target: null,
        compatibleTargets: [
          { entity: 'BLOCK', id: 20 },
        ],
      });
    },
  );

  it('keeps ownerless memory separate from dangling or incompatible owners', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'PAUSE'),
      instruction(3, 10, 1, 3, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
    ], [
      variable(100, null),
      variable(101, 999),
      variable(102, 2),
    ]);

    expect(edgeFor(graph.edges, 'VARIABLE_OWNER', 100)).toMatchObject({
      state: 'MEMORY_ONLY',
      code: null,
      target: null,
    });
    expect(edgeFor(graph.edges, 'VARIABLE_OWNER', 101)).toMatchObject({
      state: 'RECONNECT_PARENT',
      code: 'DANGLING_VARIABLE_OWNER',
    });
    expect(edgeFor(graph.edges, 'VARIABLE_OWNER', 102)).toMatchObject({
      state: 'RECONNECT_PARENT',
      code: 'INCOMPATIBLE_VARIABLE_OWNER',
    });
    expect(edgeFor(graph.edges, 'VARIABLE_BINDING', 3).state).toBe('CONNECTED');
  });

  it('requires an earlier active GET or SET for E/CK runtime readers', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O', { tagName: 'input' }),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(3, 10, 1, 3, 'E', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(4, 10, 1, 4, 'SET', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(5, 10, 1, 5, 'CK', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(6, 10, 1, 6, 'E', {
        parentId: 1,
        variableId: 200,
      }),
      instruction(7, 10, 1, 7, 'GET', {
        parentId: 1,
        variableId: 200,
      }),
      instruction(8, 10, 1, 8, 'GET', {
        parentId: 1,
        variableId: 300,
        instructionActive: false,
      }),
      instruction(9, 10, 1, 9, 'CK', {
        parentId: 1,
        variableId: 300,
      }),
    ], [
      variable(100, 1),
      variable(200, 1),
      variable(300, 1),
    ]);

    expect(edgeFor(graph.edges, 'VARIABLE_ORDER', 3).target)
      .toEqual(expect.objectContaining({ id: 2 }));
    expect(edgeFor(graph.edges, 'VARIABLE_ORDER', 5).target)
      .toEqual(expect.objectContaining({ id: 4 }));
    expect(edgeFor(graph.edges, 'VARIABLE_ORDER', 6)).toMatchObject({
      state: 'FIX_ORDER',
      code: 'RUNTIME_VALUE_WRITER_AFTER_READER',
    });
    expect(edgeFor(graph.edges, 'VARIABLE_ORDER', 9)).toMatchObject({
      state: 'FIX_ORDER',
      code: 'MISSING_RUNTIME_VALUE_WRITER',
    });
  });

  it('does not invent GET ordering for PDF/CSV validation metadata', () => {
    const graph = build([
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'PDF CHECK', {
        parentId: 1,
        variableId: 100,
      }),
      instruction(3, 10, 1, 3, 'CSV CHECK', {
        parentId: 1,
        variableId: 100,
      }),
    ], [variable(100, 1)]);

    expect(graph.edges.filter(item =>
      item.kind === 'VARIABLE_ORDER'
      && (item.source.id === 2 || item.source.id === 3))).toEqual([]);
  });

  it('isolates identical numeric IDs by complete workspace owner', () => {
    const graph = buildInstructionRelationshipGraph({
      owner: OWNER,
      instructions: [
        instruction(1, 10, 1, 1, 'O'),
        instruction(2, 10, 1, 2, 'GET', {
          parentId: 1,
          variableId: 100,
        }),
        instruction(1, 10, 1, 1, 'PAUSE', { owner: OTHER_OWNER }),
        instruction(2, 10, 1, 2, 'GET', {
          owner: COMPONENT_OWNER,
          parentId: 1,
          variableId: 100,
        }),
      ],
      blocks: [
        block(10, 1),
        block(10, 1, OTHER_OWNER),
        block(10, 1, COMPONENT_OWNER),
      ],
      variables: [
        variable(100, 1),
        variable(100, null, { owner: OTHER_OWNER }),
        variable(100, null, { owner: COMPONENT_OWNER }),
      ],
    });

    expect(graph.instructions).toHaveLength(2);
    expect(graph.variables).toHaveLength(1);
    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 2).state).toBe('CONNECTED');
    expect(graph.edges.every(item =>
      item.source.owner.workspaceKind === 'BOT_JOB'
      && item.source.owner.botJobId === 5)).toBe(true);
  });

  it('isolates Component candidates by workspace and homeBankingId', () => {
    const componentInstruction = (
      id: number,
      order: number,
      actions: string,
      owner: RelationshipOwner,
      overrides: Partial<RelationshipInstructionFact> = {},
    ): RelationshipInstructionFact => instruction(
      id,
      10,
      1,
      order,
      actions,
      { owner, ...overrides },
    );

    const graph = buildInstructionRelationshipGraph({
      owner: COMPONENT_OWNER,
      instructions: [
        componentInstruction(1, 1, 'O', COMPONENT_OWNER),
        componentInstruction(2, 2, 'GET', COMPONENT_OWNER, {
          parentId: 1,
          variableId: 100,
        }),
        componentInstruction(1, 1, 'PAUSE', OTHER_COMPONENT_OWNER),
        componentInstruction(2, 2, 'GET', OTHER_COMPONENT_OWNER, {
          parentId: 1,
          variableId: 100,
        }),
      ],
      blocks: [
        block(10, 1, COMPONENT_OWNER),
        block(10, 1, OTHER_COMPONENT_OWNER),
      ],
      variables: [
        variable(100, 1, { owner: COMPONENT_OWNER }),
        variable(100, null, { owner: OTHER_COMPONENT_OWNER }),
      ],
    });

    expect(graph.instructions).toHaveLength(2);
    expect(graph.variables).toHaveLength(1);
    expect(edgeFor(graph.edges, 'ELEMENT_TARGET', 2).state).toBe('CONNECTED');
    expect(graph.edges.every(item =>
      item.source.owner.workspaceKind === 'COMPONENT'
      && item.source.owner.homeBankingId === 2)).toBe(true);
  });

  it('returns deterministic sorted output for shuffled input facts', () => {
    const rows = [
      instruction(3, 20, 2, 1, 'GOTO', { parentBlockId: 10 }),
      instruction(1, 10, 1, 1, 'O'),
      instruction(2, 10, 1, 2, 'GET', {
        parentId: 1,
        variableId: 100,
      }),
    ];
    const variables = [variable(101, null), variable(100, 1)];
    const blocks = [block(20, 2), block(10, 1)];

    const left = build(rows, variables, blocks);
    const right = build(
      [...rows].reverse(),
      [...variables].reverse(),
      [...blocks].reverse(),
    );

    expect(right).toEqual(left);
  });
});
