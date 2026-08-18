import { groupByBlock, reassignInstructionOrderNumbersByBlock } from './grouping';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

const ins = (id: number, blockId: number, order: number, blockName = `Block ${blockId}`, exportFile?: string): BlockLoopInstructionLoadDTO =>
  ({ id, blockId, blockName, instructionOrderNumber: order, exportFile } as unknown as BlockLoopInstructionLoadDTO);

describe('groupByBlock', () => {
  it('groups by blockId and sorts each block by instructionOrderNumber', () => {
    const grouped = groupByBlock([ins(3, 10, 2), ins(1, 10, 1), ins(2, 20, 1)]);
    expect(Object.keys(grouped).map(Number).sort()).toEqual([10, 20]);
    expect(grouped[10].instructions.map((i) => i.id)).toEqual([1, 3]); // sorted by order
    expect(grouped[20].instructions.map((i) => i.id)).toEqual([2]);
  });

  it('defaults exportFile to the placeholder when missing', () => {
    const grouped = groupByBlock([ins(1, 10, 1)]);
    expect(grouped[10].exportFile).toBe('No Excel Export File');
  });

  it('keeps a provided exportFile', () => {
    const grouped = groupByBlock([ins(1, 10, 1, 'B', 'out.xlsx')]);
    expect(grouped[10].exportFile).toBe('out.xlsx');
  });
});

describe('reassignInstructionOrderNumbersByBlock', () => {
  it('renumbers instructionOrderNumber from 1 within each block', () => {
    const out = reassignInstructionOrderNumbersByBlock([ins(3, 10, 5), ins(1, 10, 2), ins(2, 20, 9)]);
    const byId = new Map(out.map((i) => [i.id, i.instructionOrderNumber]));
    expect(byId.get(1)).toBe(1);
    expect(byId.get(3)).toBe(2);
    expect(byId.get(2)).toBe(1); // first (only) in block 20
  });
});
