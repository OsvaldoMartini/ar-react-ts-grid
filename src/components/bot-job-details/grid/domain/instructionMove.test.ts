import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  planInstructionMove,
  resolveInstructionDragGroup,
} from './instructionMove';
import type { WorkspaceBlock } from './workspaceBlocks';

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
  blockId: 10,
  blockOrderNumber: 1,
  blockName: 'Block 10',
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

describe('React-owned instruction move planning', () => {
  it('inserts an unrelated instruction between a Web Field and LOOP', () => {
    const rows = [
      row(917, 1, 'C'),
      row(918, 2, 'LOOP', { parentId: 917, parentBlockId: 10 }),
      row(919, 3, 'PAUSE'),
    ];

    const plan = planInstructionMove(rows, [], 919, 10, 1, [block(10, 1)]);

    expect(plan.ok).toBe(true);
    expect(plan.changed).toBe(true);
    expect(plan.group.map(candidate => candidate.id)).toEqual([919]);
    expect(idsIn(plan.rows, 10)).toEqual([917, 919, 918]);
  });

  it('inserts an unrelated instruction directly inside an IF body', () => {
    const rows = [
      row(1, 1, 'IF', { parentId: 1, parentBlockId: 10 }),
      row(2, 2, 'ENDIF', { parentId: 1, parentBlockId: 10 }),
      row(3, 3, 'PAUSE'),
    ];

    const plan = planInstructionMove(rows, [], 3, 10, 1, [block(10, 1)]);

    expect(plan.ok).toBe(true);
    expect(idsIn(plan.rows, 10)).toEqual([1, 3, 2]);
  });

  it('keeps an ordinary loop-body row independently movable', () => {
    const rows = [
      row(10, 1, 'C'),
      row(11, 2, 'PAUSE'),
      row(12, 3, 'LOOP', { parentId: 10, parentBlockId: 10 }),
      row(13, 4, 'PAUSE'),
    ];

    expect(resolveInstructionDragGroup(rows, 11).map(candidate => candidate.id))
      .toEqual([11]);
    const plan = planInstructionMove(rows, [], 11, 10, 3, [block(10, 1)]);
    expect(plan.ok).toBe(true);
    expect(idsIn(plan.rows, 10)).toEqual([10, 12, 13, 11]);
  });

  it('moves only the smallest selected nested conditional family', () => {
    const rows = [
      row(1, 1, 'IF', { parentId: 1, parentBlockId: 10 }),
      row(2, 2, 'IF', { parentId: 2, parentBlockId: 10 }),
      row(3, 3, 'PAUSE'),
      row(4, 4, 'ENDIF', { parentId: 2, parentBlockId: 10 }),
      row(5, 5, 'ENDIF', { parentId: 1, parentBlockId: 10 }),
      row(6, 6, 'PAUSE'),
    ];

    expect(resolveInstructionDragGroup(rows, 2).map(candidate => candidate.id))
      .toEqual([2, 3, 4]);
  });

  it('moves a complete loop family into an empty catalog block', () => {
    const rows = [
      row(10, 1, 'C'),
      row(11, 2, 'PAUSE'),
      row(12, 3, 'LOOP', { parentId: 10, parentBlockId: 10 }),
      row(13, 4, 'PAUSE'),
    ];
    const blocks = [block(10, 1), block(20, 2, 'Empty Destination')];

    const plan = planInstructionMove(rows, [], 12, 20, 0, blocks);

    expect(plan.ok).toBe(true);
    expect(plan.group.map(candidate => candidate.id)).toEqual([10, 11, 12]);
    expect(idsIn(plan.rows, 10)).toEqual([13]);
    expect(idsIn(plan.rows, 20)).toEqual([10, 11, 12]);
    expect(plan.rows.find(candidate => candidate.id === 10)).toMatchObject({
      blockId: 20,
      blockOrderNumber: 2,
      blockName: 'Empty Destination',
    });
    expect(plan.rows.find(candidate => candidate.id === 12)?.parentBlockId)
      .toBe(20);
  });

  it('moves a hard parent family and remaps its parent block', () => {
    const rows = [
      row(1, 1, 'C'),
      row(2, 2, 'GET', { parentId: 1, parentBlockId: 10 }),
      row(3, 3, 'PAUSE'),
    ];
    const blocks = [block(10, 1), block(20, 2)];

    const plan = planInstructionMove(rows, [], 2, 20, 0, blocks);

    expect(plan.ok).toBe(true);
    expect(plan.group.map(candidate => candidate.id)).toEqual([1, 2]);
    expect(plan.rows.find(candidate => candidate.id === 2)?.parentBlockId)
      .toBe(20);
  });

  it('preserves cross-block GOTO targets even when an instruction ID collides', () => {
    const rows = [
      row(1, 1, 'GOTO', { parentId: 2, parentBlockId: 20 }),
      row(2, 2, 'PAUSE'),
      row(3, 3, 'PAUSE'),
    ];
    const blocks = [block(10, 1), block(20, 2), block(30, 3)];

    const plan = planInstructionMove(rows, [], 1, 30, 0, blocks);

    expect(plan.ok).toBe(true);
    expect(plan.rows.find(candidate => candidate.id === 1)?.parentBlockId)
      .toBe(20);
  });

  it('treats a same-block GOTO target as a block reference, not an instruction family', () => {
    const rows = [
      row(1, 1, 'GOTO', { parentId: 2, parentBlockId: 10 }),
      row(2, 2, 'PAUSE'),
      row(3, 3, 'PAUSE'),
    ];

    const plan = planInstructionMove(rows, [], 1, 10, 2, [block(10, 1)]);

    expect(plan.ok).toBe(true);
    expect(plan.group.map(candidate => candidate.id)).toEqual([1]);
    expect(idsIn(plan.rows, 10)).toEqual([2, 3, 1]);
    expect(plan.rows.find(candidate => candidate.id === 1)?.parentBlockId)
      .toBe(10);
  });

  it('rejects a newly-created consumer-before-GET variable order', () => {
    const rows = [
      row(1, 1, 'GET', { variableId: 7 }),
      row(2, 2, 'E', { variableId: 7 }),
      row(3, 3, 'PAUSE'),
    ];

    const plan = planInstructionMove(
      rows,
      [{ id: 7, instructionId: 1 }],
      1,
      10,
      2,
      [block(10, 1)],
    );

    expect(plan.ok).toBe(false);
    expect(plan.error).toContain('GET must run before');
  });

  it('treats a drop onto the dragged family as a no-op', () => {
    const rows = [
      row(1, 1, 'C'),
      row(2, 2, 'GET', { parentId: 1, parentBlockId: 10 }),
      row(3, 3, 'PAUSE'),
    ];

    const plan = planInstructionMove(rows, [], 1, 10, 1, [block(10, 1)]);

    expect(plan.ok).toBe(true);
    expect(plan.changed).toBe(false);
  });
});
