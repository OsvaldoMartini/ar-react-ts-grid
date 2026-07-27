import {
  memoryListRequiresTargetBlock,
  type MemoryListItem,
} from './memoryList.contract';

const componentBlock = (blockId: number): MemoryListItem => ({
  key: `COMPONENT:BLOCK:2:${blockId}`,
  sourceKind: 'COMPONENT',
  sourceItemKey: `BLOCK:2:${blockId}`,
  label: `Block ${blockId}`,
  payload: {
    kind: 'BLOCK',
    componentBlockId: blockId,
    sourceRevision: 'revision-1',
  },
});

const componentInstruction = (instructionId: number, blockId: number): MemoryListItem => ({
  key: `COMPONENT:INSTRUCTION:2:${blockId}:${instructionId}`,
  sourceKind: 'COMPONENT',
  sourceItemKey: `INSTRUCTION:2:${blockId}:${instructionId}`,
  label: `Instruction ${instructionId}`,
  payload: {
    kind: 'INSTRUCTION',
    componentInstructionId: instructionId,
    componentBlockId: blockId,
    sourceRevision: 'revision-1',
  },
});

describe('memoryListRequiresTargetBlock', () => {
  test('whole component blocks create their own destination', () => {
    expect(memoryListRequiresTargetBlock([componentBlock(44)])).toBe(false);
  });

  test('an individual component row requires a selected Bot Job block', () => {
    expect(memoryListRequiresTargetBlock([componentInstruction(101, 44)])).toBe(true);
  });

  test('a row covered by a selected whole block is deduplicated without a target', () => {
    expect(memoryListRequiresTargetBlock([
      componentInstruction(101, 44),
      componentBlock(44),
    ])).toBe(false);
  });

  test('mixed or malformed rows still require a target', () => {
    expect(memoryListRequiresTargetBlock([
      componentBlock(44),
      {
        key: 'BOT_JOB:101',
        sourceKind: 'BOT_JOB',
        sourceItemKey: '101',
        label: 'Existing instruction',
        payload: { instructionId: 101 },
      },
    ])).toBe(true);
    expect(memoryListRequiresTargetBlock([{
      key: 'COMPONENT:INVALID',
      sourceKind: 'COMPONENT',
      sourceItemKey: 'INVALID',
      label: 'Invalid',
    }])).toBe(true);
  });
});
