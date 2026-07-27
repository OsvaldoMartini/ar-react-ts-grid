import {
  normalizeWorkspaceBlocks,
  mergeWorkspaceBlocks,
  workspaceBlocksFromInstructions,
} from './workspaceBlocks';
import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

describe('workspace block catalog', () => {
  test('normalizes authoritative blocks and keeps empty blocks in order', () => {
    expect(normalizeWorkspaceBlocks([
      { blockId: 22, blockOrderNumber: 2, blockName: 'Populated', blockActive: 1, blockWait: 3 },
      { blockId: 11, blockOrderNumber: 1, blockName: 'Empty', blockActive: 0, blockWait: 0 },
      { blockId: 0, blockOrderNumber: 3, blockName: 'Invalid' },
    ])).toEqual([
      { blockId: 11, blockOrderNumber: 1, blockName: 'Empty', blockActive: false, blockWait: 0 },
      { blockId: 22, blockOrderNumber: 2, blockName: 'Populated', blockActive: true, blockWait: 3 },
    ]);
  });

  test('deduplicates instruction-derived blocks without losing metadata', () => {
    const instructions = [
      {
        id: 1,
        blockId: 22,
        blockOrderNumber: 2,
        blockName: 'Second',
        blockActive: true,
        blockWait: 4,
        exportFile: 'results.xlsx',
      },
      {
        id: 2,
        blockId: 11,
        blockOrderNumber: 1,
        blockName: 'First',
        blockActive: false,
        blockWait: 0,
      },
      { id: 3, blockId: 22, blockOrderNumber: 2, blockName: 'Second' },
    ] as BlockLoopInstructionLoadDTO[];

    expect(workspaceBlocksFromInstructions(instructions)).toEqual([
      {
        blockId: 11,
        blockOrderNumber: 1,
        blockName: 'First',
        blockActive: false,
        blockWait: 0,
        exportFile: undefined,
      },
      {
        blockId: 22,
        blockOrderNumber: 2,
        blockName: 'Second',
        blockActive: true,
        blockWait: 4,
        exportFile: 'results.xlsx',
      },
    ]);
  });

  test('accepts Java BlockLoadDTO field names and preserves empty blocks across legacy arrays', () => {
    const catalog = normalizeWorkspaceBlocks([
      { id: 11, blockOrderNumber: 1, name: 'Empty', active: false, wait: 2 },
      { id: 22, blockOrderNumber: 2, name: 'Populated', active: true, wait: 0 },
    ]);
    const legacyArrayBlocks = normalizeWorkspaceBlocks([
      { blockId: 22, blockOrderNumber: 2, blockName: 'Updated', blockActive: true, blockWait: 0 },
    ]);

    expect(mergeWorkspaceBlocks(catalog, legacyArrayBlocks)).toEqual([
      { blockId: 11, blockOrderNumber: 1, blockName: 'Empty', blockActive: false, blockWait: 2 },
      { blockId: 22, blockOrderNumber: 2, blockName: 'Updated', blockActive: true, blockWait: 0 },
    ]);
  });
});
