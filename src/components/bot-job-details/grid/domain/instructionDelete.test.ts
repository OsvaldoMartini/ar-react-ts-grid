import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { InstructionVariableLink } from './instructionDependency';
import {
  planInstructionDeletion,
  planInstructionSelectionDeletion,
} from './instructionDelete';

const row = (
  id: number,
  instructionOrderNumber: number,
  actions = 'C',
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

const ids = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  selectedInstructionId: number,
  variableLinks: readonly InstructionVariableLink[] = [],
): number[] => {
  const result = planInstructionDeletion(rows, variableLinks, selectedInstructionId);
  expect(result.ok).toBe(true);
  return result.ok ? result.deleteInstructionIds : [];
};

describe('React-owned instruction deletion planning', () => {
  it('deletes only linked conditional boundaries and preserves every body row', () => {
    const rows = [
      row(1, 1, 'IF', { parentId: 1 }),
      row(2, 2, 'C', { parentId: 1 }),
      row(3, 3, 'ELSEIF', { parentId: 1 }),
      row(4, 4, 'H', { parentId: 3 }),
      row(5, 5, 'ELSE', { parentId: 1 }),
      row(6, 6, 'C'),
      row(7, 7, 'ENDIF', { parentId: 1 }),
    ];

    expect(ids(rows, 5)).toEqual([1, 3, 5, 7]);
  });

  it('deletes a LOOP anchor family through explicit links, never positional body rows', () => {
    const rows = [
      row(10, 1, 'O'),
      row(11, 2, 'C'),
      row(12, 3, 'H'),
      row(13, 4, 'REFRESH_LOOP', { parentId: 10 }),
      row(14, 5, 'C'),
      row(15, 6, 'GET', { parentId: 10 }),
      row(16, 7, 'CK', { parentId: 15 }),
    ];

    expect(ids(rows, 13)).toEqual([10, 13, 15, 16]);
  });

  it('deletes ordinary explicit dependent descendants without deleting an upstream parent', () => {
    const rows = [
      row(20, 1, 'O'),
      row(21, 2, 'GET', { parentId: 20 }),
      row(22, 3, 'CK', { parentId: 21 }),
      row(23, 4, 'C'),
    ];

    expect(ids(rows, 20)).toEqual([20, 21, 22]);
    expect(ids(rows, 21)).toEqual([21, 22]);
  });

  it('does not cross the selected owner or block and ignores navigation references', () => {
    const rows = [
      row(30, 1, 'O'),
      row(31, 2, 'C', { parentId: 30 }),
      row(32, 3, 'GOTO', { parentId: 30, parentBlockId: 20 }),
      row(33, 4, 'EXCEL GOTO', { parentId: 30, parentBlockId: 20 }),
      row(40, 1, 'C', {
        blockId: 20,
        blockOrderNumber: 2,
        blockName: 'Other Block',
        parentId: 30,
      }),
      row(50, 5, 'C', {
        homeBankingId: 3,
        botJobId: 8,
        parentId: 30,
      }),
    ];

    expect(ids(rows, 30)).toEqual([30, 31]);
    expect(ids(rows, 32)).toEqual([32]);
  });

  it('deletes variable consumers downstream of an owner but preserves the owner for consumer deletion', () => {
    const rows = [
      row(60, 1, 'O'),
      row(61, 2, 'GET', { parentId: 60, variableId: 500 }),
      row(62, 3, 'E', { parentId: 60, variableId: 500 }),
      row(63, 4, 'C', { parentId: 62 }),
      row(64, 1, 'CK', {
        blockId: 20,
        blockOrderNumber: 2,
        blockName: 'Other Block',
        variableId: 500,
      }),
    ];
    const variables = [{ id: 500, instructionId: 60 }];

    expect(ids(rows, 60, variables)).toEqual([60, 61, 62, 63, 64]);
    expect(ids(rows, 62, variables)).toEqual([62, 63]);
  });

  it('reports preserved rows whose explicit parent is a deleted structural boundary', () => {
    const rows = [
      row(70, 1, 'IF', { parentId: 70 }),
      row(71, 2, 'C', { parentId: 70 }),
      row(72, 3, 'ENDIF', { parentId: 70 }),
    ];

    const result = planInstructionDeletion(rows, [], 70);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deleteInstructionIds).toEqual([70, 72]);
    expect(result.survivingParentReferences).toEqual([
      { instructionId: 71, deletedParentId: 70 },
    ]);
  });

  it('deletes exactly the checked rows and repairs surviving parent references', () => {
    const rows = [
      row(80, 1, 'O'),
      row(81, 2, 'GET', { parentId: 80 }),
      row(82, 3, 'C', { parentId: 81 }),
    ];

    const result = planInstructionSelectionDeletion(rows, [80, 82], 'SELECTED_ONLY');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deleteInstructionIds).toEqual([80, 82]);
    expect(result.survivingParentReferences).toEqual([
      { instructionId: 81, deletedParentId: 80 },
    ]);
  });

  it('expands structural connections without cascading through variables', () => {
    const rows = [
      row(90, 1, 'O'),
      row(91, 2, 'GET', { parentId: 90, variableId: 700 }),
      row(92, 3, 'CK', {
        variableId: 700,
        blockId: 20,
        blockOrderNumber: 2,
      }),
    ];

    const result = planInstructionSelectionDeletion(rows, [90], 'INCLUDE_CONNECTED');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deleteInstructionIds).toEqual([90, 91]);
    expect(result.deleteInstructionIds).not.toContain(92);
  });
});
