import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  componentBlockMemoryItem,
  componentInstructionMemoryItem,
} from './memoryOptions';

const instruction: BlockLoopInstructionLoadDTO = {
  homeBankingId: 2,
  tagName: 'button',
  botJobId: 5,
  botJobName: 'Target Bot Job',
  id: 101,
  instructionOrderNumber: 1,
  name: 'Continue',
  description: '',
  blockId: 44,
  blockOrderNumber: 3,
  blockName: 'Reusable Login',
  blockActive: true,
  blockWait: 0,
  actions: 'CLICK',
  instructionActive: true,
};

test('component instruction memory item uses a collision-safe key and authoritative ids', () => {
  expect(componentInstructionMemoryItem(instruction, 'revision-7')).toEqual(
    expect.objectContaining({
      key: 'COMPONENT:INSTRUCTION:2:44:101',
      sourceKind: 'COMPONENT',
      sourceItemKey: 'INSTRUCTION:2:44:101',
      payload: {
        kind: 'INSTRUCTION',
        componentInstructionId: 101,
        componentBlockId: 44,
        sourceRevision: 'revision-7',
      },
    }),
  );
});

test('whole component block memory item is distinct from its instruction items', () => {
  expect(componentBlockMemoryItem([instruction], 'revision-8')).toEqual(
    expect.objectContaining({
      key: 'COMPONENT:BLOCK:2:44',
      sourceKind: 'COMPONENT',
      sourceItemKey: 'BLOCK:2:44',
      payload: {
        kind: 'BLOCK',
        componentBlockId: 44,
        sourceRevision: 'revision-8',
      },
    }),
  );
});
