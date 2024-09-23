import React, { useState, useEffect } from 'react';
import { BlockLoopInstructionLoadDTO } from './instructionsMockData'; // Import the data model
import './griditem.scss'; // Import the Sass file

import setValueImage from '../assets/setValueBtn2.png';
import getValueImage from '../assets/getValueBtn2.png';
import checkImage from '../assets/check3.png';

import crossImage from '../assets/cross.png';
import editImage from '../assets/edit.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import garbageImage from '../assets/garbage.png';


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
  const [mockData, setMockData] = useState<boolean>(false);
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(data);
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);
  // Function to handle receiving data from JavaFX
  (window as any).receiveDataFromJava = function (jsonData: string) {
    const data: BlockLoopInstructionLoadDTO[] = JSON.parse(jsonData);
    if (data && data.length > 0) {
      setMockData(true);
      setIsDataReordered(false); // Reset this flag on new data load
      setInstructionsData(data);
    }
  };

  // Function to send data back to JavaFX
  const sendDataBackToJava = function (data: BlockLoopInstructionLoadDTO[]) {
    if ((window as any).javaBridge) {
      console.log("Send back to Java bridge.");
      (window as any).javaBridge.sendDataToJava(data);
    } else {
      console.error("Java bridge is not available.");

      // If Java bridge is not available, create and download a JSON file
      // downloadJsonFile(data, "blockLoopInstructionData");
    }
  };

  // Function to create and download a JSON file
  const downloadJsonFile = (data: any, fileName: string) => {
    const json = JSON.stringify(data, null, 2); // Convert data to JSON string
    const blob = new Blob([json], { type: "application/json" }); // Create a blob with JSON data
    const url = URL.createObjectURL(blob); // Create URL for the blob

    const a = document.createElement("a"); // Create a link element
    a.href = url;
    a.download = `${fileName}.json`; // Set the download file name
    document.body.appendChild(a); // Append the link to the body
    a.click(); // Programmatically click the link to start the download
    document.body.removeChild(a); // Remove the link after downloading
  };

  // Function to reassign order numbers
  // const reassignOrderNumbers = () => {
  //   console.log("reassignOrderNumbers");
  //   const reassignedData = reassignInstructionOrderNumbersByBlock(instructionsData);
  //   setInstructionsData(reassignedData);
  //   setIsDataReordered(true); // Mark the data as reordered
  // };

  useEffect(() => {
    if (!isDataReordered && instructionsData.length > 0) {
      console.log("useEffect - reassigning order numbers");

      // Use functional form to update instructionsData based on the previous value
      setInstructionsData((prevData) => {
        const reassignedData = reassignInstructionOrderNumbersByBlock([...prevData]);
        return reassignedData;
      });
      sendDataBackToJava(instructionsData);
    }
  }, [instructionsData, isDataReordered]); // This will only run when instructionsData or isDataReordered changes


  useEffect(() => {
    if (instructionsData.length > 0 && !isDataReordered) {
      console.log("Setting isDataReordered to true");
      setIsDataReordered(true); // Set this in a separate effect to avoid immediate blocking
    }
  }, [instructionsData]); // Only trigger when instructionsData changes



  // Function to move a block up by swapping blockOrderNumbers
  const handleMoveBlockUp = (blockId: number) => {
    console.log("handleMoveBlockUp");
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

    setInstructionsData([...updatedData]); // Make sure to use a copy
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again


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

    setInstructionsData([...updatedData]); // Make sure to use a copy
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
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
        setInstructionsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
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
        setInstructionsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
      }
    }
  };

  // Function to remove an instruction by its ID and reassign order numbers within each block
  const handleRemoveInstruction = (instructionId: number) => {
    const updatedData = instructionsData.filter(instruction => instruction.id !== instructionId);
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
  };

  // Function to remove a block by its blockId and reassign order numbers within each block
  const handleRemoveBlock = (blockId: number) => {
    const updatedData = instructionsData.filter(instruction => instruction.blockId !== blockId);
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
  };

  const getInstructionTypeElement = (instruction: BlockLoopInstructionLoadDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let isActionBold = false;

    // Determine the image source and text based on instruction type
    switch (instruction.instructionType) {
      case "SET":
        imageSrc = setValueImage;
        text = "SetValue";
        break;
      case "GET":
        imageSrc = getValueImage;
        text = "GetValue";
        break;
      case "CK":
        imageSrc = checkImage;
        text = "Check";
        break;
      default:
        imageSrc = null; // No image for other types
        text = instruction.actions || null;
        isActionBold = true; // Set bold for actions
    }

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return imageSrc ? (
      <div className="instruction-type">
        <img src={imageSrc} className="operations" />
        <span>{text}</span>
      </div>
    ) : (
      <span style={{ fontWeight: isActionBold ? 'bold' : 'normal' }}>
        {text}
      </span>
    );
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
              <span className="block-name">{blockData.blockName}</span>
              <span>
                ({blockData.instructions.length})
                {!mockData ? "-mock" : ""}
              </span>
              <div className="move-buttons">
                {/* Add the garbage button click handler */}
                <img
                  src={garbageImage}
                  className="garbage-button"
                  onClick={() => handleRemoveBlock(Number(blockId))}
                />
                <img src={upImage} className="move-button"
                  onClick={() => handleMoveBlockUp(Number(blockId))}
                />
                <img src={downImage} className="move-button"
                  onClick={() => handleMoveBlockDown(Number(blockId))}
                />
              </div>
            </div>
            <div className="instructions-list">
              {blockData.instructions.map((instruction) => (
                <div key={instruction.id} className="instruction-item">
                  {/* Instruction Type with conditional image */}
                  <span>{getInstructionTypeElement(instruction)}</span>

                  <span className="instruction-details">{instruction.name}</span>
                  <span className="instruction-details">{instruction.description}</span>
                  <div className="fourth-column">
                    <div className="move-buttons">
                      <img src={upImage} className="move-button"
                        onClick={() => handleMoveUp(instruction.id)}
                      />
                      <img
                        src={downImage}
                        className="move-button"
                        onClick={() => handleMoveDown(instruction.id)}
                      />
                      <img src={editImage} className="edit-button" />
                      {/* Add the cross button click handler */}
                      <img
                        src={crossImage}
                        className="cross-button"
                        onClick={() => handleRemoveInstruction(instruction.id)}
                      />
                    </div>
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
