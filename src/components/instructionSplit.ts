import type { BlockLoopInstructionLoadDTO } from './instructionsMockData';

export type InstructionBlockGroup = {
  blockName: string;
  instructions: BlockLoopInstructionLoadDTO[];
};

export type LaterBlockOrderUpdate = {
  blockId: number;
  botJobId: number;
  blockName: string;
  blockOrderNumber: number;
};

export function buildLaterBlockOrderUpdates(
  blocks: Record<string, InstructionBlockGroup>,
  splitBlockOrder: number,
  newBlockId: number,
  botJobId: number,
): LaterBlockOrderUpdate[] {
  return Object.values(blocks)
    .filter(block => block.instructions.length > 0)
    .filter(block => block.instructions[0].blockOrderNumber > splitBlockOrder)
    .filter(block => block.instructions[0].blockId !== newBlockId)
    .sort((left, right) => (
      left.instructions[0].blockOrderNumber - right.instructions[0].blockOrderNumber
    ))
    .map(block => ({
      blockId: block.instructions[0].blockId,
      botJobId,
      blockName: block.blockName,
      blockOrderNumber: block.instructions[0].blockOrderNumber,
    }));
}
