import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from "@stomp/stompjs";
import { BlockLoopInstructionLoadDTO, UpdatedBlock } from './instructionsMockData';
import './griditem.scss';

import setValueImage from '../assets/setValueBtn3.png';
import getValueImage from '../assets/getValueBtn3.png';
import checkImage from '../assets/check4.png';

import crossImage from '../assets/cross.png';
import editImage from '../assets/edit.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import rollBackImage from '../assets/rollback4.png';
import garbageImage from '../assets/garbage.png';
import menuDownImage from '../assets/menu-down.png';


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
  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; instructions: BlockLoopInstructionLoadDTO[] } }>({});
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [updatedBlocks, setUpdatedBlocks] = useState<UpdatedBlock[]>([]);



  // Memoized function to handle outside clicks on the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpenDropdown(null); // Close the dropdown if clicked outside
    }
  }, [dropdownRef]);



  useEffect(() => {
    // Create a STOMP client
    const stompClient: Client = new Client({
      brokerURL: "ws://localhost:8080/websocket", // Your WebSocket URL
      reconnectDelay: 5000, // Try reconnecting after 5 seconds if the connection fails
      heartbeatIncoming: 4000, // Heartbeat configuration
      heartbeatOutgoing: 4000,
      debug: (str: string) => {
        console.log("STOMP: " + str);
      },
    });

    // Handle connection success
    stompClient.onConnect = (frame) => {
      console.log("Connected: " + frame);
      setConnected(true);

      // Subscribe to a topic (e.g., "/topic/messages")
      stompClient.subscribe("/topic/messages", (message: IMessage) => {
        if (message.body) {
          setMessages((prevMessages) => [...prevMessages, message.body]);
          console.log("Received message: ", message);
        }
      });
    };

    // Handle STOMP errors
    stompClient.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    // Activate the connection
    stompClient.activate();
    setClient(stompClient);

    // Cleanup when component unmounts
    return () => {
      stompClient.deactivate();
    };
  }, []);

  useEffect(() => {
    if (connected) {
      // Assuming correctBlockOrderNumbers sets updatedBlocks based on some logic
      const { updatedData, updatedBlocks } = correctBlockOrderNumbers(instructionsData);
      setInstructionsData(updatedData);
      setUpdatedBlocks(updatedBlocks);  // Trigger the `useEffect` to send WebSocket message
    }
  }, [connected]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log("Messages: " + messages);
    }

  }, [messages]);

  useEffect(() => {
    if (updatedBlocks.length > 0 && client && connected) {
      const message = {
        type: 'BLOCK_ORDER',
        updatedBlocks: updatedBlocks,
      };

      try {
        client.publish({
          destination: '/app/block/order', // WebSocket destination
          body: JSON.stringify(message),
        });
        console.log('Sent block order message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }, [updatedBlocks, client, connected]); // Triggered when updatedBlocks or connected changes

  useEffect(() => {
    if (!isDataReordered && instructionsData.length > 0) {
      console.log("Reassigning instruction order numbers");

      // Reassign the instruction order numbers
      const reassignedData = reassignInstructionOrderNumbersByBlock([...instructionsData]);

      // Update instructionsData first
      setInstructionsData(reassignedData);

      // Group the data and update groupedData
      const updatedGroupedData = groupByBlock(reassignedData);
      setGroupedData(updatedGroupedData);

      // Set the flag to true to indicate that the data has been reordered
      setIsDataReordered(true);
    }
  }, [instructionsData, isDataReordered]);


  // Add the event listener to detect clicks outside the dropdown
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null); // Close the dropdown if clicked outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);



  // Function to handle receiving data from JavaFX
  (window as any).receiveDataFromJava = function (jsonData: string) {
    const data: BlockLoopInstructionLoadDTO[] = JSON.parse(jsonData);
    if (data && data.length > 0) {
      setMockData(true);
      setIsDataReordered(false); // Reset this flag on new data load
      setInstructionsData(data);
    }
  };



  const correctBlockOrderNumbers = (data: any[]) => {
    console.log("Correcting blockOrderNumbers");

    const updatedData = [...data]; // Make a copy of the instructions data

    const uniqueBlocks = Array.from(new Set(updatedData.map(instruction => instruction.blockId)));

    const updatedBlocks: UpdatedBlock[] = []; // To track blocks with changed blockOrderNumber

    uniqueBlocks.forEach((blockId, index) => {
      const newOrderNumber = index + 1; // Start block order from 1

      updatedData.forEach(instruction => {
        if (instruction.blockId === blockId) {
          // Check if blockOrderNumber is changing
          if (instruction.blockOrderNumber !== newOrderNumber) {
            // Track the updated block
            updatedBlocks.push({
              botJobId: instruction.botJobId || null, // Assuming botJobId is part of the instruction
              blockId: instruction.blockId,
              blockOrderNumber: newOrderNumber,
            });
          }

          // Update the blockOrderNumber
          instruction.blockOrderNumber = newOrderNumber;
        }
      });
    });

    // Return updated data
    return { updatedData, updatedBlocks };
  };


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

    // Prepare the list of BlockOrderDetailDTO for updated blocks
    const updatedBlocks = [
      {
        blockId: blockId,
        botJobId: currentBlockInstructions[0].botJobId,
        blockOrderNumber: previousBlockOrderNumber,
        blockName: currentBlockInstructions[0].blockName,
      },
      {
        blockId: previousBlockInstructions.blockId,
        botJobId: previousBlockInstructions.botJobId,
        blockOrderNumber: currentBlockOrderNumber,
        blockName: previousBlockInstructions.blockName,
      },
    ];

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

    // Send WebSocket message with the block swap details
    if (client && connected) {
      const message = {
        type: 'BLOCK_MOVE',
        updatedBlocks: updatedBlocks,
      };

      try {
        client.publish({
          destination: '/app/block/move', // Update based on your WebSocket endpoint configuration
          body: JSON.stringify(message),
        });

        console.log('Sent block move message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  };



  const handleToggleDropdown = (instructionId: number) => {
    if (openDropdown === instructionId) {
      setOpenDropdown(null); // Close the menu if it's already open
    } else {
      setOpenDropdown(instructionId); // Open the menu for this specific instruction
    }
  };

  const handleInsertStepBefore = (instructionId: number) => {
    // Logic to insert a step before
    console.log("Insert Step Before for instruction", instructionId);
  };

  const handleInsertStepAfter = (instructionId: number) => {
    // Logic to insert a step after
    console.log("Insert Step After for instruction", instructionId);
  };

  const handleDeleteInstruction = (instructionId: number) => {
    handleRemoveInstruction(instructionId);
    console.log("Delete instruction", instructionId);
  };

  const handleSplitComponent = (
    instructionId: number,
    groupedData: { [blockId: string]: { blockName: string; instructions: BlockLoopInstructionLoadDTO[] } },
    setGroupedData: (data: { [blockId: string]: { blockName: string; instructions: BlockLoopInstructionLoadDTO[] } }) => void,
    instructionsData: BlockLoopInstructionLoadDTO[]
  ) => {
    // Find the block and instruction related to the instructionId
    const blockToSplit = Object.values(groupedData).find((blockData) =>
      blockData.instructions.some((instruction) => instruction.id === instructionId)
    );

    if (!blockToSplit) return;

    // Find the selected instruction and its index in the block
    const selectedInstructionIndex = blockToSplit.instructions.findIndex(
      (instruction) => instruction.id === instructionId
    );

    if (selectedInstructionIndex === -1) return;

    // Get the block order and blockId
    const blockOrderNumber = blockToSplit.instructions[0].blockOrderNumber;
    const blockId = blockToSplit.instructions[0].blockId;

    // Find all subsequent instructions in the same block
    const subsequentInstructions = blockToSplit.instructions.slice(selectedInstructionIndex + 1);

    if (subsequentInstructions.length === 0) {
      console.log("No instructions to split.");
      return;
    }

    // Create a new block with subsequent instructions, preserving the crescent order
    // Find the maximum blockId from the entire instructionsData
    const maxBlockId = Math.max(...instructionsData.map(instruction => instruction.blockId));
    const newBlockId = maxBlockId + 1; // Generate a unique block ID

    const newBlockOrderNumber = blockOrderNumber + 1; // Increment the current block's order number by 1
    // Assuming that all instructions in blockToSplit have the same botJobId
    const botJobId = blockToSplit.instructions[0]?.botJobId || null; // Retrieve botJobId from the first instruction

    const newBlock = {
      blockName: `${blockToSplit.blockName}`, // Same name as the current block
      blockOrderNumber: newBlockOrderNumber, // Assign the new block order number
      botJobId: botJobId, // Preserve the botJobId in the new instructions
      instructions: subsequentInstructions.map((instruction, index) => ({
        ...instruction,
        blockId: newBlockId, // Assign new block ID to the instructions
        blockOrderNumber: newBlockOrderNumber, // Assign new block order number to the instructions
        instructionOrderNumber: index + 1, // Reassign instructionOrderNumber starting from 1 within the new block
      })),
    };

    // Update the block data to remove these instructions from the original block, preserving the crescent order
    const updatedBlock = {
      ...blockToSplit,
      instructions: blockToSplit.instructions.slice(0, selectedInstructionIndex + 1).map((instruction, index) => ({
        ...instruction,
        instructionOrderNumber: index + 1, // Preserve original crescent order for remaining instructions in current block
      })),
    };

    // Prepare blockOrderNumber updates for blocks after the current one
    const updatedBlocks = Object.entries(groupedData).reduce((acc, [key, blockData]) => {
      if (blockData.instructions[0].blockOrderNumber > blockOrderNumber) {
        // Increment the block order number for blocks after the current one
        acc[key] = {
          ...blockData,
          instructions: blockData.instructions.map((instruction) => ({
            ...instruction,
            blockOrderNumber: instruction.blockOrderNumber + 1,
          })),
        };
      } else {
        acc[key] = blockData;
      }
      return acc;
    }, {} as { [blockId: string]: { blockName: string; instructions: BlockLoopInstructionLoadDTO[] } });

    // Add the new block to the updated data
    updatedBlocks[newBlockId] = newBlock;
    updatedBlocks[blockId] = updatedBlock;

    // Call setInstructionsData and setIsDataReordered BEFORE updating groupedData
    const updatedInstructions = Object.values(updatedBlocks).flatMap(block => block.instructions);
    setInstructionsData([...reassignInstructionOrderNumbersByBlock(updatedInstructions)]);
    setIsDataReordered(false); // Trigger reorder logic

    // Set the updated grouped data (or pass it to your state management)
    setGroupedData(updatedBlocks);

    console.log("Split component created with new block:", newBlock);

    // Send WebSocket message with block split details, including newBlock
    if (client && connected) {
      const blockSplitDetails = {
        originalBlock: {
          blockId: blockId,
          botJobId: botJobId,
          blockOrderNumber: blockOrderNumber,
          updatedInstructions: updatedBlock.instructions.map(instruction => ({
            instructionId: instruction.id,
            blockId: instruction.blockId,
            blockOrderNumber: blockOrderNumber,
            instructionOrderNumber: instruction.instructionOrderNumber
          })),
        },
        newBlock: {
          botJobId: botJobId,
          blockId: newBlockId,
          blockName: newBlock.blockName,
          blockOrderNumber: newBlock.blockOrderNumber,
          instructions: newBlock.instructions.map(instruction => ({
            instructionId: instruction.id,
            blockId: instruction.blockId,
            blockOrderNumber: newBlock.blockOrderNumber,
            instructionOrderNumber: instruction.instructionOrderNumber
          })),
        },
        // Filter only blocks that had blockOrderNumber modified, excluding the newBlock
        updatedBlocks: Object.values(updatedBlocks)
          .filter(block => block.instructions.length > 0
            && block.instructions[0].blockOrderNumber > blockOrderNumber
            && block.instructions[0].blockId !== newBlockId // Exclude the newBlock
          )
          .map(block => ({
            blockId: block.instructions[0].blockId,
            botJobId: botJobId,
            blockName: block.blockName,
            blockOrderNumber: block.instructions[0].blockOrderNumber
          }))

      };

      const message = {
        type: 'BLOCKS_SPLITTER',
        details: blockSplitDetails,
      };

      client.publish({
        destination: '/app/block/split', // Adjust the WebSocket destination if necessary
        body: JSON.stringify(message),
      });

      console.log('Sent block split message:', message);
    }

    setOpenDropdown(null);
  };


  // Function to move a block down by swapping blockOrderNumbers
  const handleMoveBlockDown = (blockId: number) => {
    const updatedData = [...instructionsData];

    // Find all instructions that belong to the current block
    const currentBlockInstructions = updatedData.filter(
      (instruction) => instruction.blockId === blockId
    );
    if (currentBlockInstructions.length === 0) return;

    const currentBlockOrderNumber = currentBlockInstructions[0].blockOrderNumber;

    // Find the closest block with a larger blockOrderNumber
    const nextBlockInstructions = updatedData
      .filter((instruction) => instruction.blockOrderNumber > currentBlockOrderNumber)
      .sort((a, b) => a.blockOrderNumber - b.blockOrderNumber)[0]; // Get the closest next block

    if (!nextBlockInstructions) return;

    const nextBlockOrderNumber = nextBlockInstructions.blockOrderNumber;

    // Prepare the list of BlockOrderDetailDTO for updated blocks
    const updatedBlocks = [
      {
        blockId: blockId,
        botJobId: currentBlockInstructions[0].botJobId,
        blockOrderNumber: nextBlockOrderNumber,
        blockName: currentBlockInstructions[0].blockName,
      },
      {
        blockId: nextBlockInstructions.blockId,
        botJobId: nextBlockInstructions.botJobId,
        blockOrderNumber: currentBlockOrderNumber,
        blockName: nextBlockInstructions.blockName,
      },
    ];

    // Update the blockOrderNumber for both current and next blocks in the local data
    updatedData.forEach((instruction) => {
      if (instruction.blockOrderNumber === currentBlockOrderNumber) {
        // Move current block down by assigning the next block's order number
        instruction.blockOrderNumber = nextBlockOrderNumber;
      } else if (instruction.blockOrderNumber === nextBlockOrderNumber) {
        // Move next block up by assigning the current block's order number
        instruction.blockOrderNumber = currentBlockOrderNumber;
      }
    });

    setInstructionsData([...updatedData]); // Update the state
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message with the updated blocks list
    if (client && connected) {
      const message = {
        type: 'BLOCK_MOVE',
        updatedBlocks: updatedBlocks,
      };

      try {
        client.publish({
          destination: '/app/block/move', // Update based on your WebSocket endpoint configuration
          body: JSON.stringify(message),
        });

        console.log('Sent block move message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  };





  // Function to move an instruction down considering blockOrderNumber
  const handleMoveRowDown = (instructionId: number) => {
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


        // Capture rowsSwaps for WebSocket message including blockId
        const updatedRows = [
          {
            blockId: currentInstruction.blockId, // Add the blockId of the instruction
            instructionId: currentInstruction.id,
            instructionOrderNumber: nextInstruction.instructionOrderNumber,
          },
          {
            blockId: currentInstruction.blockId, // Add the blockId of the instruction
            instructionId: nextInstruction.id,
            instructionOrderNumber: currentInstruction.instructionOrderNumber,
          },
        ];

        // Swap their instructionOrderNumbers
        const tempOrderNumber = currentInstruction.instructionOrderNumber;
        currentInstruction.instructionOrderNumber = nextInstruction.instructionOrderNumber;
        nextInstruction.instructionOrderNumber = tempOrderNumber;

        // Reassign the updatedData array and update the state
        setInstructionsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

        // Send WebSocket message with the row swap details
        if (client && connected) {
          const message = {
            type: 'ROW_MOVE',
            updatedRows: updatedRows,
          };

          try {
            client.publish({
              destination: '/app/row/move', // Update based on your WebSocket endpoint configuration
              body: JSON.stringify(message),
            });

            console.log('Sent row move message:', message);
          } catch (error) {
            console.error('Error sending WebSocket message:', error);
          }
        }
      }
    }
  };


  // Function to move an instruction up considering blockOrderNumber
  const handleMoveRowUp = (instructionId: number) => {
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

        // Capture rowsSwaps for WebSocket message including blockId
        const updatedRows = [
          {
            blockId: currentInstruction.blockId, // Add the blockId of the instruction
            instructionId: currentInstruction.id,
            instructionOrderNumber: previousInstruction.instructionOrderNumber,
          },
          {
            blockId: currentInstruction.blockId, // Add the blockId of the instruction
            instructionId: previousInstruction.id,
            instructionOrderNumber: currentInstruction.instructionOrderNumber,
          },
        ];

        // Swap their instructionOrderNumbers
        const tempOrderNumber = currentInstruction.instructionOrderNumber;
        currentInstruction.instructionOrderNumber = previousInstruction.instructionOrderNumber;
        previousInstruction.instructionOrderNumber = tempOrderNumber;

        // Reassign the updatedData array
        setInstructionsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

        // Send WebSocket message with the row swap details
        if (client && connected) {
          const message = {
            type: 'ROW_MOVE',
            updatedRows: updatedRows,
          };

          try {
            client.publish({
              destination: '/app/row/move', // Update based on your WebSocket endpoint configuration
              body: JSON.stringify(message),
            });

            console.log('Sent row move message:', message);
          } catch (error) {
            console.error('Error sending WebSocket message:', error);
          }
        }
      }
    }
  };


  // Function to remove an instruction by its ID and reassign order numbers within each block
  const handleRemoveInstruction = (instructionId: number) => {
    // Find the blockId associated with the instructionId
    const instructionToRemove = instructionsData.find(instruction => instruction.id === instructionId);

    // If the instruction is not found, return early
    if (!instructionToRemove) return;

    const botJobId = instructionToRemove.botJobId; // Get the blockId from the instruction
    const blockId = instructionToRemove.blockId; // Get the blockId from the instruction

    // Filter out the instruction to remove
    const updatedData = instructionsData.filter(instruction => instruction.id !== instructionId);
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message
    if (client && connected) { // Assuming `client` is your STOMP client and `connected` is a boolean indicating the connection state
      const message = {
        type: 'DELETE_INSTRUCTION',
        instructionId: instructionId,
        botJobId: botJobId, // Include the blockId in the message
        blockId: blockId, // Include the blockId in the message
      };

      // Publish the delete message to the WebSocket server
      client.publish({
        destination: '/app/instruction/delete', // Destination to which you want to send the message (configured on the server)
        body: JSON.stringify(message),
      });

      console.log(`Sent delete instruction message for instruction ID: ${instructionId} in block ID: ${blockId}`);
    }
  };


  // Function to remove a block by its blockId and reassign order numbers within each block
  const handleRemoveBlock = (blockId: number) => {

    // Find the botJobId and blockOrderNumber associated with the blockId
    const blockInstruction = instructionsData.find(instruction => instruction.blockId === blockId);
    const botJobId = blockInstruction ? blockInstruction.botJobId : null;
    const removedBlockOrderNumber = blockInstruction ? blockInstruction.blockOrderNumber : null;

    if (!botJobId || removedBlockOrderNumber === null) {
      console.error(`No botJobId or blockOrderNumber found for Block ID: ${blockId}`);
      return; // Exit if no botJobId or blockOrderNumber is found
    }

    // Remove the block from instructionsData
    const updatedData = instructionsData.filter(instruction => instruction.blockId !== blockId);

    // Update blockOrderNumber for blocks after the removed block
    const blocksToUpdateSet = new Set<number>();
    updatedData.forEach(instruction => {
      if (instruction.blockOrderNumber > removedBlockOrderNumber) {
        instruction.blockOrderNumber -= 1;
        blocksToUpdateSet.add(instruction.blockId);
      }
    });

    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Prepare list of updated blocks
    const blocksToUpdate = Array.from(blocksToUpdateSet).map(blockId => {
      const instructionsInBlock = reassignedData.filter(instr => instr.blockId === blockId);
      const blockOrderNumber = instructionsInBlock[0].blockOrderNumber; // Assuming all instructions in a block have the same blockOrderNumber
      const blockName = instructionsInBlock[0].blockName; // Assuming blockName is consistent within the block

      return {
        blockId: blockId,
        botJobId: botJobId,
        blockOrderNumber: blockOrderNumber,
        blockName: blockName,
      };
    });

    // Send WebSocket message
    if (client && connected) {
      const message = {
        type: 'DELETE_BLOCK',
        blockId: blockId,
        botJobId: botJobId,
        updatedBlocks: blocksToUpdate, // Include the list of updated blocks
      };

      client.publish({
        destination: '/app/block/delete',
        body: JSON.stringify(message),
      });

      console.log(`Sent delete block message for Block ID: ${blockId} with updated blocks:`, message);
    }
  };


  const handleRollbackBlock = (blockId: number) => {
    console.log(`Rollback action for block ID: ${blockId}`);

    // Get the first blockId after sorting
    const sortedBlocks = Object.entries(groupedData).sort(
      ([, aBlockData], [, bBlockData]) =>
        aBlockData.instructions[0].blockOrderNumber - bBlockData.instructions[0].blockOrderNumber
    );

    if (sortedBlocks.length === 0) {
      console.error('No blocks available for rollback.');
      return;
    }

    const firstBlockId = Number(sortedBlocks[0][0]);

    // Get the botJobId from the first instruction
    const firstInstruction = instructionsData.find(instr => instr.blockId === firstBlockId);
    const botJobId = firstInstruction ? firstInstruction.botJobId : null;

    if (!botJobId) {
      console.error(`No botJobId found for Block ID: ${firstBlockId}`);
      return; // Exit if no botJobId is found
    }

    // Update all instructions to have blockId of firstBlockId and blockOrderNumber 1
    const updatedData = instructionsData.map(instruction => ({
      ...instruction,
      blockId: firstBlockId,
      blockOrderNumber: 1,
    }));

    // Reassign instructionOrderNumbers sequentially starting from 1
    const reassignedData = updatedData.map((instruction, index) => ({
      ...instruction,
      instructionOrderNumber: index + 1,
    }));

    // Update the state
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message to inform about the rollback
    if (client && connected) {
      const message = {
        type: 'BLOCK_ROLLBACK',
        botJobId: botJobId,
        blockId: firstBlockId,
        instructions: reassignedData.map(instr => ({
          instructionId: instr.id,
          blockId: instr.blockId,
          blockOrderNumber: instr.blockOrderNumber,
          instructionOrderNumber: instr.instructionOrderNumber,
        })),
      };

      client.publish({
        destination: '/app/block/rollback',
        body: JSON.stringify(message),
      });

      console.log('Sent block rollback message:', message);
    }
  };


  const getInstructionTypeElement = (instruction: BlockLoopInstructionLoadDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let isActionBold = false;

    // Determine the image source and text based on instruction type
    switch (instruction.actions) {
      case "SET":
        imageSrc = setValueImage;
        text = instruction.name;
        break;
      case "GET":
        imageSrc = getValueImage;
        text = instruction.name;
        break;
      case "CK":
        imageSrc = checkImage;
        text = instruction.name;
        break;
      default:
        imageSrc = null; // No image for other types
        text = instruction.name || null;
        isActionBold = true; // Set bold for actions
    }

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return imageSrc ? (
      <div className="instruction-type">
        <img src={imageSrc} alt="" className="operations" />
        <span>{text}</span>
      </div>
    ) : (
      <span style={{ fontWeight: isActionBold ? 'bold' : 'normal' }}>
        {text}
      </span>
    );
  };

  return (
    <div className="grid-container">
      {Object.entries(groupedData)
        .sort(([, aBlockData], [, bBlockData]) => aBlockData.instructions[0].blockOrderNumber - bBlockData.instructions[0].blockOrderNumber)
        .map(([blockId, blockData], index) => (
          <div key={blockId} className="block">
            {/* Block header with garbage, up, and down buttons */}
            <div className="block-header">
              <span className="block-order-number">#{blockData.instructions[0].blockOrderNumber}</span>
              <span className="block-name">{blockData.blockName}</span>
              <span className="block-count">
                ({blockData.instructions.length})
                {!mockData ? "-Moock Data" : ""}
              </span>
              <div className="move-buttons">
                {index === 0 && (
                  <img
                    src={rollBackImage}
                    alt=""
                    className="rollback-button"
                    onClick={() => handleRollbackBlock(Number(blockId))}
                  />
                )}
                <img
                  src={garbageImage}
                  className="garbage-button"
                  alt=""
                  onClick={() => handleRemoveBlock(Number(blockId))}
                />
                <img src={upImage} alt="" className="move-button"
                  onClick={() => handleMoveBlockUp(Number(blockId))}
                />
                <img src={downImage} alt="" className="move-button"
                  onClick={() => handleMoveBlockDown(Number(blockId))}
                />
              </div>
            </div>
            <div className="instructions-list">
              {blockData.instructions.map((instruction, index) => {
                const isLastInstruction = index === blockData.instructions.length - 1;
                const isLastBlock = Number(blockId) === Object.keys(groupedData).length; // Check if this is the last block

                return (
                  <div key={instruction.id} className="instruction-item">
                    <span>{getInstructionTypeElement(instruction)}</span>
                    <span className="instruction-details">{instruction.description}</span>
                    <div className="options-column">
                      <div className="move-buttons">
                        <img src={upImage} alt="" className="move-button" onClick={() => handleMoveRowUp(instruction.id)} />
                        <img src={downImage} alt="" className="move-button" onClick={() => handleMoveRowDown(instruction.id)} />
                        <img src={editImage} alt="" className="edit-button" />
                        <img src={crossImage} alt="" className="cross-button" onClick={() => handleRemoveInstruction(instruction.id)} />
                      </div>
                    </div>

                    {/* New column for dropdown menu */}
                    <div className="dropdown-column">
                      <img
                        src={menuDownImage} /* Replace with your arrow down image */
                        className="dropdown-arrow"
                        alt=""
                        onClick={() => handleToggleDropdown(instruction.id)}
                      />

                      {/* Dropdown menu that shows/hides when the arrow is clicked */}
                      {openDropdown === instruction.id && (
                        <div
                          ref={dropdownRef}
                          className={`dropdown-menu ${isLastBlock ? 'dropdown-above' : ''}`} // Conditional class for last block
                        >
                          <div onClick={() => handleInsertStepBefore(instruction.id)}>Insert Step Before</div>
                          <div onClick={() => handleInsertStepAfter(instruction.id)}>Insert Step After</div>

                          {/* Conditionally render "Split Component" only if this is not the last instruction */}
                          {!isLastInstruction && (
                            <div onClick={() => handleSplitComponent(instruction.id, groupedData, setGroupedData, instructionsData)}>
                              Split Component
                            </div>
                          )}

                          <div onClick={() => handleDeleteInstruction(instruction.id)}>Delete</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ))}
    </div>
  );
};

export default GridItem;
