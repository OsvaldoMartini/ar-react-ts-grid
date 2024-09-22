import React, { useState } from 'react';
import { BlockLoopInstructionLoadDTO } from './instructionsMockData'; // Import the data model
import './griditem.scss'; // Import the Sass file

interface GridItemProps {
  data: BlockLoopInstructionLoadDTO[];
}

// Function to group data by blockId and sort instructions within each block
const groupByBlock = (data: BlockLoopInstructionLoadDTO[]) => {
  const blocks = data.reduce((result, item) => {
    const { blockId, blockName } = item;
    if (!result[blockId]) {
      result[blockId] = { blockName, instructions: [] };
    }
    result[blockId].instructions.push(item);
    return result;
  }, {} as Record<number, { blockName: string; instructions: BlockLoopInstructionLoadDTO[] }>);

  // Sort each block's instructions by instructionOrderNumber
  Object.values(blocks).forEach(block => {
    block.instructions.sort((a, b) => a.instructionOrderNumber - b.instructionOrderNumber);
  });

  return blocks;
};

// Helper function to reassign instructionOrderNumber starting from 1 within each block
const reassignInstructionOrderNumbersByBlock = (instructions: BlockLoopInstructionLoadDTO[]) => {
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

const GridItem: React.FC<GridItemProps> = ({ data }) => {
  // Use state to manage the instructions data
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(data);

  // Function to move an instruction down
  const handleMoveDown = (instructionId: number) => {
    const updatedData = [...instructionsData];
    const instructionIndex = updatedData.findIndex(instruction => instruction.id === instructionId);

    // Ensure that the instruction exists and isn't already the last one
    if (instructionIndex !== -1 && instructionIndex < updatedData.length - 1) {
      // Swap the instructionOrderNumber with the one below it
      const currentInstruction = updatedData[instructionIndex];
      const nextInstruction = updatedData[instructionIndex + 1];

      // Swap their instructionOrderNumbers
      const tempOrderNumber = currentInstruction.instructionOrderNumber;
      currentInstruction.instructionOrderNumber = nextInstruction.instructionOrderNumber;
      nextInstruction.instructionOrderNumber = tempOrderNumber;

      // Reassign the updatedData array
      setInstructionsData(reassignInstructionOrderNumbersByBlock(updatedData));
    }
  };

  // Function to remove an instruction by its ID and reassign order numbers within each block
  const handleRemoveInstruction = (instructionId: number) => {
    const updatedData = instructionsData.filter(instruction => instruction.id !== instructionId);
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData(reassignedData);
  };

  // Function to remove a block by its blockId and reassign order numbers within each block
  const handleRemoveBlock = (blockId: number) => {
    const updatedData = instructionsData.filter(instruction => instruction.blockId !== blockId);
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData(reassignedData);
  };

  const groupedData = groupByBlock(instructionsData);

  return (
    <div className="grid-container">
      {Object.entries(groupedData).sort(([aId], [bId]) => parseInt(aId) - parseInt(bId)).map(([blockId, blockData]) => (
        <div key={blockId} className="block">
          {/* Block header with garbage, up, and down buttons */}
          <div className="block-header">
            <span>{blockId}</span>
            <span>{blockData.blockName}</span>
            <span>Instruction Count: {blockData.instructions.length}</span>
            <div className="move-buttons">
              {/* Add the garbage button click handler */}
              <img
                src="../garbage.png"
                className="garbage-button"
                onClick={() => handleRemoveBlock(Number(blockId))}
              />
              <img src="../up.png" className="move-button" />
              <img src="../down.png" className="move-button" />
            </div>
          </div>
          <div className="instructions-list">
            {blockData.instructions.map((instruction) => (
              <div key={instruction.id} className="instruction-item">
                <span>{instruction.id}</span>
                <span>{instruction.instructionOrderNumber}</span>
                <span>{instruction.instructionType}</span>
                <span>{instruction.name}</span>
                <span>{instruction.description}</span>
                <div className="move-buttons">
                  <img src="../up.png" className="move-button" />
                  <img
                    src="../down.png"
                    className="move-button"
                    onClick={() => handleMoveDown(instruction.id)}
                  />
                  <img src="../edit.png" className="edit-button" />
                  {/* Add the cross button click handler */}
                  <img
                    src="../cross.png"
                    className="cross-button"
                    onClick={() => handleRemoveInstruction(instruction.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridItem;
