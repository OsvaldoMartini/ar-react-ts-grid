import React, { useState, useEffect } from 'react';
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
  console.log("reassignInstructionOrderNumbersByBlock: ");
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

  // Use useEffect to reassign instructionOrderNumbers on initial render
  // Use useEffect to reassign instructionOrderNumbers on initial render
  useEffect(() => {
    // Reassign the instruction order numbers when the component first mounts
    const reassignedData = reassignInstructionOrderNumbersByBlock(data);
    setInstructionsData(reassignedData);
  }, []);

  // Function to move a block up by swapping blockOrderNumbers
  const handleMoveBlockUp = (blockId: number) => {
    const updatedData = [...instructionsData];

    // Find all instructions that belong to the current block
    const currentBlockInstructions = updatedData.filter(instruction => instruction.blockId === blockId);
    if (currentBlockInstructions.length === 0) return;

    const currentBlockOrderNumber = currentBlockInstructions[0].blockOrderNumber;

    // Find the closest block with a smaller blockOrderNumber
    const previousBlockInstructions = updatedData
      .filter(instruction => instruction.blockOrderNumber < currentBlockOrderNumber)
      .sort((a, b) => b.blockOrderNumber - a.blockOrderNumber)[0]; // Get the closest previous block

    if (!previousBlockInstructions) return;

    const previousBlockOrderNumber = previousBlockInstructions.blockOrderNumber;

    // Update the blockOrderNumber for both current and previous blocks
    updatedData.forEach(instruction => {
      if (instruction.blockOrderNumber === currentBlockOrderNumber) {
        // Move current block up by assigning the previous block's order number
        instruction.blockOrderNumber = previousBlockOrderNumber;
      } else if (instruction.blockOrderNumber === previousBlockOrderNumber) {
        // Move previous block down by assigning the current block's order number
        instruction.blockOrderNumber = currentBlockOrderNumber;
      }
    });

    // Reassign the updated data array to maintain consistency
    setInstructionsData(updatedData);
  };


  // Function to move a block down by swapping blockOrderNumbers
  const handleMoveBlockDown = (blockId: number) => {
    const updatedData = [...instructionsData];

    // Find all instructions that belong to the current block
    const currentBlockInstructions = updatedData.filter(instruction => instruction.blockId === blockId);
    if (currentBlockInstructions.length === 0) return;

    const currentBlockOrderNumber = currentBlockInstructions[0].blockOrderNumber;

    // Find the closest block with a larger blockOrderNumber
    const nextBlockInstructions = updatedData
      .filter(instruction => instruction.blockOrderNumber > currentBlockOrderNumber)
      .sort((a, b) => a.blockOrderNumber - b.blockOrderNumber)[0]; // Get the closest next block

    if (!nextBlockInstructions) return;

    const nextBlockOrderNumber = nextBlockInstructions.blockOrderNumber;

    // Update the blockOrderNumber for both current and next blocks
    updatedData.forEach(instruction => {
      if (instruction.blockOrderNumber === currentBlockOrderNumber) {
        // Move current block down by assigning the next block's order number
        instruction.blockOrderNumber = nextBlockOrderNumber;
      } else if (instruction.blockOrderNumber === nextBlockOrderNumber) {
        // Move next block up by assigning the current block's order number
        instruction.blockOrderNumber = currentBlockOrderNumber;
      }
    });

    // Reassign the updated data array to maintain consistency
    setInstructionsData(updatedData);
  };



  // Function to move an instruction down considering blockOrderNumber
  const handleMoveDown = (instructionId: number) => {
    const updatedData = [...instructionsData];
    const instructionIndex = updatedData.findIndex(instruction => instruction.id === instructionId);

    // Ensure that the instruction exists
    if (instructionIndex !== -1) {
      const currentInstruction = updatedData[instructionIndex];

      // Find all instructions within the same block (determined by blockOrderNumber)
      const blockInstructions = updatedData.filter(
        instruction => instruction.blockId === currentInstruction.blockId && instruction.blockOrderNumber === currentInstruction.blockOrderNumber
      );

      // Find the index of the current instruction within its block
      const blockInstructionIndex = blockInstructions.findIndex(instruction => instruction.id === instructionId);

      // Ensure that the instruction isn't already the last one within its block
      if (blockInstructionIndex < blockInstructions.length - 1) {
        const nextInstruction = blockInstructions[blockInstructionIndex + 1];

        // Swap their instructionOrderNumbers
        const tempOrderNumber = currentInstruction.instructionOrderNumber;
        currentInstruction.instructionOrderNumber = nextInstruction.instructionOrderNumber;
        nextInstruction.instructionOrderNumber = tempOrderNumber;

        // Reassign the updatedData array
        setInstructionsData(reassignInstructionOrderNumbersByBlock(updatedData));
      }
    }
  };


  // Function to move an instruction up
  // Function to move an instruction up considering blockOrderNumber
  const handleMoveUp = (instructionId: number) => {
    const updatedData = [...instructionsData];
    const instructionIndex = updatedData.findIndex(instruction => instruction.id === instructionId);

    // Ensure that the instruction exists
    if (instructionIndex !== -1) {
      const currentInstruction = updatedData[instructionIndex];

      // Find all instructions within the same block (determined by blockId and blockOrderNumber)
      const blockInstructions = updatedData.filter(
        instruction => instruction.blockId === currentInstruction.blockId && instruction.blockOrderNumber === currentInstruction.blockOrderNumber
      );

      // Find the index of the current instruction within its block
      const blockInstructionIndex = blockInstructions.findIndex(instruction => instruction.id === instructionId);

      // Ensure that the instruction isn't already the first one within its block
      if (blockInstructionIndex > 0) {
        const previousInstruction = blockInstructions[blockInstructionIndex - 1];

        // Swap their instructionOrderNumbers
        const tempOrderNumber = currentInstruction.instructionOrderNumber;
        currentInstruction.instructionOrderNumber = previousInstruction.instructionOrderNumber;
        previousInstruction.instructionOrderNumber = tempOrderNumber;

        // Reassign the updatedData array
        setInstructionsData(reassignInstructionOrderNumbersByBlock(updatedData));
      }
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


  const getInstructionTypeElement = (instruction: BlockLoopInstructionLoadDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;

    // Determine the image source based on instruction type
    switch (instruction.instructionType) {
      case "SET":
        imageSrc = "../setValueBtn2.png";
        break;
      case "GET":
        imageSrc = "../getValueBtn2.png";
        break;
      case "CK":
        imageSrc = "../check3.png";
        break;
      default:
        imageSrc = null; // No image for other types
    }

    // Return image element if imageSrc exists, otherwise return the instruction type text or null
    return imageSrc ? <img src={imageSrc} className="operations" /> : instruction.name || null;
  };

  const groupedData = groupByBlock(instructionsData);



  return (
    <div className="grid-container">
      {Object.entries(groupedData)
        // Sort by blockOrderNumber instead of blockId
        .sort(([, aBlockData], [, bBlockData]) => aBlockData.instructions[0].blockOrderNumber - bBlockData.instructions[0].blockOrderNumber)
        .map(([blockId, blockData]) => (
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
                <img src="../up.png" className="move-button"
                  onClick={() => handleMoveBlockUp(Number(blockId))}
                />
                <img src="../down.png" className="move-button"
                  onClick={() => handleMoveBlockDown(Number(blockId))}
                />
              </div>
            </div>
            <div className="instructions-list">
              {blockData.instructions.map((instruction) => (
                <div key={instruction.id} className="instruction-item">
                  <span>{instruction.id}</span>
                  <span>{instruction.instructionOrderNumber}</span>
                  {/* Instruction Type with conditional image */}
                  <span>{getInstructionTypeElement(instruction)}</span>

                  <span>{instruction.name}</span>
                  <span>{instruction.description}</span>
                  <div className="move-buttons">
                    <img src="../up.png" className="move-button"
                      onClick={() => handleMoveUp(instruction.id)}
                    />
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
