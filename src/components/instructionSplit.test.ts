import { buildLaterBlockOrderUpdates } from './instructionSplit';
import type { BlockLoopInstructionLoadDTO } from './instructionsMockData';

const instruction = (blockId: number, blockOrderNumber: number): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 7,
  tagName: '',
  botJobId: 5,
  botJobName: 'Saldo Banca Stato',
  id: blockId * 10,
  instructionOrderNumber: 1,
  name: `Block ${blockId}`,
  description: '',
  blockId,
  blockOrderNumber,
  blockName: `Block ${blockId}`,
  blockActive: true,
  blockWait: 3,
  actions: 'C',
  instructionActive: true,
});

test('orders later split blocks by block order instead of numeric block id', () => {
  const blocks = {
    7: { blockName: 'First', instructions: [instruction(7, 1)] },
    8: { blockName: 'Fifth', instructions: [instruction(8, 6)] },
    44: { blockName: 'Fourth', instructions: [instruction(44, 5)] },
    45: { blockName: 'Third', instructions: [instruction(45, 4)] },
    242: { blockName: 'Second', instructions: [instruction(242, 3)] },
    999: { blockName: 'New split', instructions: [instruction(999, 2)] },
  };

  expect(buildLaterBlockOrderUpdates(blocks, 1, 999, 5)).toEqual([
    { blockId: 242, botJobId: 5, blockName: 'Second', blockOrderNumber: 3 },
    { blockId: 45, botJobId: 5, blockName: 'Third', blockOrderNumber: 4 },
    { blockId: 44, botJobId: 5, blockName: 'Fourth', blockOrderNumber: 5 },
    { blockId: 8, botJobId: 5, blockName: 'Fifth', blockOrderNumber: 6 },
  ]);
});
