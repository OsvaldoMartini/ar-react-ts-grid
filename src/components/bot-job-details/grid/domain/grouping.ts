import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

/** The grid's block → instructions grouping (keyed by blockId). */
export type GroupedData = Record<
  number,
  { blockName: string; exportFile?: string; instructions: BlockLoopInstructionLoadDTO[] }
>;

/**
 * Phase 6 — DOMAIN layer (pure). Group instructions by blockId and sort each
 * block's instructions by instructionOrderNumber. Extracted verbatim from GridItem;
 * shared by GridItem, its handlers, and the WS effect.
 */
export const groupByBlock = (data: BlockLoopInstructionLoadDTO[]): GroupedData => {
  const blocks = data.reduce((result, item) => {
    const { blockId, blockName, exportFile } = item;
    if (!result[blockId]) {
      result[blockId] = { blockName, instructions: [], exportFile: exportFile || "No Excel Export File" };  // Set exportFile
    }
    result[blockId].instructions.push(item);
    return result;
  }, {} as GroupedData);

  // Sort each block's instructions by instructionOrderNumber
  Object.values(blocks).forEach(block => {
    block.instructions.sort((a, b) => a.instructionOrderNumber - b.instructionOrderNumber);
  });

  return blocks;
};

/**
 * Reassign instructionOrderNumber starting from 1 within each block. Pure.
 */
export const reassignInstructionOrderNumbersByBlock = (
  instructions: BlockLoopInstructionLoadDTO[],
): BlockLoopInstructionLoadDTO[] => {
  // Group instructions by blockId
  const grouped = groupByBlock(instructions);

  // Iterate over each block and reassign instructionOrderNumbers
  const updatedInstructions: BlockLoopInstructionLoadDTO[] = [];
  Object.entries(grouped).forEach(([blockId, blockData]) => {
    const reassignedInstructions = blockData.instructions.map((instruction, index) => ({
      ...instruction,
      instructionOrderNumber: index + 1, // Reassign starting from 1 within each block
    }));
    updatedInstructions.push(...reassignedInstructions);
  });

  return updatedInstructions;
};
