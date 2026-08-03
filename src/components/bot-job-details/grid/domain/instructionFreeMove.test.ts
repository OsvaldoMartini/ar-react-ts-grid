import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { WorkspaceBlock } from './workspaceBlocks';
import {
  planBotJobConditionalFreeMove,
  planBotJobInstructionFreeMove,
} from './instructionFreeMove';

const block = (
  blockId: number,
  blockOrderNumber: number,
  blockName = `Block ${blockId}`,
): WorkspaceBlock => ({
  blockId,
  blockOrderNumber,
  blockName,
  blockActive: true,
  blockWait: 0,
});

const row = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  actions = 'PAUSE',
  overrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 2,
  tagName: '',
  botJobId: 5,
  botJobName: 'Job',
  id,
  instructionOrderNumber,
  name: `${actions} ${id}`,
  description: '',
  blockId,
  blockOrderNumber,
  blockName: `Block ${blockId}`,
  blockActive: true,
  blockWait: 0,
  actions,
  instructionActive: true,
  ...overrides,
});

const idsIn = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  blockId: number,
): number[] => rows
  .filter(candidate => candidate.blockId === blockId)
  .sort((left, right) =>
    left.instructionOrderNumber - right.instructionOrderNumber)
  .map(candidate => candidate.id);

describe('Bot Job single-row free-move planning', () => {
  it('moves exactly one parent-linked row and proposes an explicit disconnect', () => {
    const rows = [
      row(10, 10, 1, 1, 'C'),
      row(11, 10, 1, 2, 'GET', {
        parentId: 10,
        parentBlockId: 10,
        variableId: 700,
      }),
      row(12, 10, 1, 3, 'E', {
        parentId: 10,
        parentBlockId: 10,
        variableId: 700,
      }),
    ];

    const plan = planBotJobInstructionFreeMove(
      rows,
      11,
      10,
      0,
      [block(10, 1)],
    );

    expect(plan.ok).toBe(true);
    expect(idsIn(plan.layoutRows, 10)).toEqual([11, 10, 12]);
    expect(plan.layoutRows.find(candidate => candidate.id === 11)).toMatchObject({
      parentId: 10,
      parentBlockId: 10,
      variableId: 700,
    });
    expect(plan.relationshipImpacts).toEqual([
      expect.objectContaining({
        instructionId: 11,
        relationKind: 'ELEMENT_TARGET',
        state: 'CHOICE_REQUIRED',
        reasonCode: 'ELEMENT_TARGET_ORDER',
        keepPatch: null,
        disconnectPatch: expect.objectContaining({
          operation: 'CLEAR',
          newParentId: null,
          newParentBlockId: null,
        }),
      }),
    ]);
    expect(plan.requiresRelationshipChoice).toBe(true);
    expect(plan.deferredDiagnostics).toEqual([
      {
        instructionId: 11,
        kind: 'VARIABLE_ORDER',
        code: 'VARIABLE_ORDER_REQUIRES_GRAPH_REVIEW',
      },
    ]);
  });

  it('preserves a valid parentId when its legacy parentBlockId projection is missing', () => {
    const rows = [
      row(14, 10, 1, 1, 'C'),
      row(15, 10, 1, 2, 'GET', { parentId: 14, parentBlockId: null }),
      row(16, 10, 1, 3),
    ];

    const plan = planBotJobInstructionFreeMove(
      rows,
      15,
      10,
      2,
      [block(10, 1)],
    );

    expect(plan.relationshipImpacts[0]).toMatchObject({
      instructionId: 15,
      state: 'PRESERVED',
      reasonCode: null,
      keepPatch: {
        operation: 'KEEP',
        expectedParentId: 14,
        expectedParentBlockId: null,
        newParentId: 14,
        newParentBlockId: null,
      },
    });
  });

  it('requires an explicit repair when parentBlockId is mismatched', () => {
    const parentBlockId = 99;
    const rows = [
      row(14, 10, 1, 1, 'C'),
      row(15, 10, 1, 2, 'GET', { parentId: 14, parentBlockId }),
      row(16, 10, 1, 3),
    ];

      const plan = planBotJobInstructionFreeMove(
        rows,
        15,
        10,
        2,
        [block(10, 1)],
      );

      expect(plan.relationshipImpacts[0]).toMatchObject({
        instructionId: 15,
        state: 'CHOICE_REQUIRED',
        reasonCode: 'ELEMENT_TARGET_BLOCK_PROJECTION',
        keepPatch: null,
        disconnectPatch: {
          operation: 'CLEAR',
          expectedParentId: 14,
          expectedParentBlockId: parentBlockId,
          newParentId: null,
          newParentBlockId: null,
        },
      });
      expect(plan.relationshipImpacts[0].reconnectOptions).toEqual([
        expect.objectContaining({
          targetId: 14,
          patch: expect.objectContaining({
            operation: 'SET',
            expectedParentId: 14,
            expectedParentBlockId: parentBlockId,
            newParentId: 14,
            newParentBlockId: 10,
          }),
        }),
      ]);
  });

  it('moves only LOOP across Blocks, preserves variable data, and offers destination anchors', () => {
    const rows = [
      row(20, 10, 1, 1, 'C'),
      row(21, 10, 1, 2, 'PAUSE'),
      row(22, 10, 1, 3, 'LOOP', {
        parentId: 20,
        parentBlockId: 10,
        variableId: 801,
      }),
      row(30, 20, 2, 1, 'C', { name: 'Destination field' }),
    ];

    const plan = planBotJobInstructionFreeMove(
      rows,
      22,
      20,
      1,
      [block(10, 1), block(20, 2)],
    );

    expect(idsIn(plan.layoutRows, 10)).toEqual([20, 21]);
    expect(idsIn(plan.layoutRows, 20)).toEqual([30, 22]);
    expect(plan.layoutRows.find(candidate => candidate.id === 22)).toMatchObject({
      parentId: 20,
      parentBlockId: 10,
      variableId: 801,
    });
    const impact = plan.relationshipImpacts[0];
    expect(impact).toMatchObject({
      instructionId: 22,
      relationKind: 'LOOP_ANCHOR',
      state: 'CHOICE_REQUIRED',
      reasonCode: 'LOOP_ANCHOR_WRONG_BLOCK',
    });
    expect(impact.reconnectOptions).toEqual([
      expect.objectContaining({
        targetType: 'INSTRUCTION',
        targetId: 30,
        patch: expect.objectContaining({
          operation: 'SET',
          newParentId: 30,
          newParentBlockId: 20,
        }),
      }),
    ]);
  });

  it('reports dependants that lose a parent when only the parent moves', () => {
    const rows = [
      row(40, 10, 1, 1, 'C'),
      row(41, 10, 1, 2, 'GET', { parentId: 40, parentBlockId: 10 }),
      row(42, 10, 1, 3, 'LOOP', { parentId: 40, parentBlockId: 10 }),
    ];

    const plan = planBotJobInstructionFreeMove(
      rows,
      40,
      20,
      0,
      [block(10, 1), block(20, 2)],
    );

    expect(idsIn(plan.layoutRows, 10)).toEqual([41, 42]);
    expect(idsIn(plan.layoutRows, 20)).toEqual([40]);
    expect(plan.relationshipImpacts.map(impact => [
      impact.instructionId,
      impact.relationKind,
      impact.reasonCode,
    ])).toEqual([
      [41, 'ELEMENT_TARGET', 'ELEMENT_TARGET_WRONG_BLOCK'],
      [42, 'LOOP_ANCHOR', 'LOOP_ANCHOR_WRONG_BLOCK'],
    ]);
  });

  it('preserves a GOTO destination when moving to a different Block', () => {
    const rows = [
      row(50, 10, 1, 1, 'GOTO', { parentBlockId: 20 }),
      row(51, 10, 1, 2),
    ];
    const blocks = [block(10, 1), block(20, 2), block(30, 3)];

    const plan = planBotJobInstructionFreeMove(rows, 50, 30, 0, blocks);

    expect(plan.layoutRows.find(candidate => candidate.id === 50)?.parentBlockId)
      .toBe(20);
    expect(plan.relationshipImpacts).toEqual([
      expect.objectContaining({
        instructionId: 50,
        relationKind: 'BLOCK_TARGET',
        state: 'PRESERVED',
        reasonCode: null,
        keepPatch: expect.objectContaining({
          operation: 'KEEP',
          newParentBlockId: 20,
        }),
      }),
    ]);
    expect(plan.requiresRelationshipChoice).toBe(false);
  });

  it.each(['GOTO', 'EXCEL GOTO'])(
    'requires explicit CLEAR or SET when %s is moved into its destination Block',
    (actions) => {
      const rows = [
        row(60, 10, 1, 1, actions, { parentBlockId: 20 }),
        row(61, 10, 1, 2),
      ];
      const blocks = [block(10, 1), block(20, 2), block(30, 3)];

      const plan = planBotJobInstructionFreeMove(rows, 60, 20, 0, blocks);
      const impact = plan.relationshipImpacts[0];

      expect(impact).toMatchObject({
        instructionId: 60,
        relationKind: 'BLOCK_TARGET',
        state: 'CHOICE_REQUIRED',
        reasonCode: 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
        keepPatch: null,
        disconnectPatch: expect.objectContaining({
          operation: 'CLEAR',
          newParentBlockId: null,
        }),
      });
      expect(impact.reconnectOptions.map(option => option.targetId))
        .toEqual([10, 30]);
      expect(plan.requiresRelationshipChoice).toBe(true);
    },
  );

  it('preserves an empty source Block instead of requesting implicit deletion', () => {
    const rows = [row(70, 10, 1, 1)];

    const plan = planBotJobInstructionFreeMove(
      rows,
      70,
      20,
      0,
      [block(10, 1), block(20, 2)],
    );

    expect(plan.deleteBlockId).toBe(-1);
    expect(plan.emptySourceBlockId).toBe(10);
    expect(idsIn(plan.layoutRows, 10)).toEqual([]);
    expect(idsIn(plan.layoutRows, 20)).toEqual([70]);
  });

  it('renumbers source and destination deterministically without mutating input', () => {
    const rows = [
      row(80, 10, 1, 1),
      row(81, 10, 1, 2),
      row(90, 20, 2, 1),
      row(91, 20, 2, 2),
    ];
    const snapshot = JSON.stringify(rows);

    const first = planBotJobInstructionFreeMove(
      rows,
      81,
      20,
      1,
      [block(10, 1), block(20, 2)],
    );
    const second = planBotJobInstructionFreeMove(
      rows,
      81,
      20,
      1,
      [block(10, 1), block(20, 2)],
    );

    expect(idsIn(first.layoutRows, 10)).toEqual([80]);
    expect(idsIn(first.layoutRows, 20)).toEqual([90, 81, 91]);
    expect(first).toEqual(second);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });

  it.each([Number.NaN, 1.5, -1])(
    'refuses an invalid destination index %s',
    (destinationIndex) => {
      const plan = planBotJobInstructionFreeMove(
        [row(100, 10, 41, 1)],
        100,
        20,
        destinationIndex,
        [block(10, 1), block(20, 2)],
      );

      expect(plan).toMatchObject({
        ok: false,
        changed: false,
        error: 'The destination index must be a non-negative safe integer.',
      });
    },
  );

  it('normalizes every submitted block order from the workspace catalog', () => {
    const rows = [
      row(110, 10, 91, 1),
      row(120, 20, 92, 1),
      row(130, 30, 93, 1),
    ];

    const plan = planBotJobInstructionFreeMove(
      rows,
      110,
      20,
      1,
      [block(10, 1), block(20, 2), block(30, 3)],
    );

    expect(plan.ok).toBe(true);
    expect(plan.layoutRows.map(candidate => [
      candidate.id,
      candidate.blockId,
      candidate.blockOrderNumber,
    ])).toEqual([
      [120, 20, 2],
      [110, 20, 2],
      [130, 30, 3],
    ]);
    expect(rows.map(candidate => candidate.blockOrderNumber)).toEqual([91, 92, 93]);
  });

  describe('GridItem IF-family free movement', () => {
    const conditionalRows = (): BlockLoopInstructionLoadDTO[] => [
      row(101, 10, 1, 1, 'IF', { parentId: 101, parentBlockId: 10 }),
      row(102, 10, 1, 2, 'PAUSE'),
      row(103, 10, 1, 3, 'ELSEIF', { parentId: 101, parentBlockId: 10 }),
      row(104, 10, 1, 4, 'PAUSE'),
      row(105, 10, 1, 5, 'ELSE', { parentId: 101, parentBlockId: 10 }),
      row(106, 10, 1, 6, 'PAUSE'),
      row(107, 10, 1, 7, 'ENDIF', { parentId: 101, parentBlockId: 10 }),
    ];

    it('moves only the selected boundary and leaves positional body commands independent', () => {
      const plan = planBotJobConditionalFreeMove(
        conditionalRows(),
        103,
        10,
        3,
        [block(10, 1)],
      );

      expect(plan.ok).toBe(true);
      expect(plan.changed).toBe(true);
      expect(idsIn(plan.layoutRows, 10)).toEqual([
        101, 102, 104, 103, 105, 106, 107,
      ]);
      expect(idsIn(plan.layoutRows, 10).filter(id => [102, 104, 106].includes(id)))
        .toEqual([102, 104, 106]);
      expect(plan.deferredDiagnostics).toEqual([]);
    });

    it('refuses a move that changes IF -> ELSEIF(s) -> ELSE -> ENDIF order', () => {
      const plan = planBotJobConditionalFreeMove(
        conditionalRows(),
        105,
        10,
        0,
        [block(10, 1)],
      );

      expect(plan).toMatchObject({
        ok: false,
        changed: false,
        error: 'Keep the conditional order IF -> ELSEIF(s) -> ELSE -> ENDIF.',
      });
    });

    it('refuses an individual IF boundary move to another Block', () => {
      const plan = planBotJobConditionalFreeMove(
        conditionalRows(),
        107,
        20,
        0,
        [block(10, 1), block(20, 2)],
      );

      expect(plan).toMatchObject({
        ok: false,
        changed: false,
        error: expect.stringContaining('must change Blocks together'),
      });
    });

    it('refuses an invalid or disconnected IF family before planning movement', () => {
      const malformed = conditionalRows().map(candidate =>
        candidate.id === 105 ? { ...candidate, parentId: null } : candidate);
      const plan = planBotJobConditionalFreeMove(
        malformed,
        105,
        10,
        3,
        [block(10, 1)],
      );

      expect(plan).toMatchObject({
        ok: false,
        changed: false,
        error: expect.stringContaining('has no IF root'),
      });
    });
  });
});
