import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from "@stomp/stompjs";
import { BlockLoopInstructionLoadDTO, UpdatedBlock } from './instructionsMockData';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // Import from react-beautiful-dnd
import './griditem.scss';

import setValueImage from '../assets/setValueBtn3.png';
import getValueImage from '../assets/getValueBtn3.png';
import checkImage from '../assets/check4.png';

import crossImage from '../assets/cross.png';
import editImage from '../assets/edit.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import rollBackImage from '../assets/rollback4.png';
import binImage from '../assets/bin.png';
import menuDownImage from '../assets/menu-down.png';
import saveImage from "../assets/save.png";
import excelImage from "../assets/excel.png";
import screenImage from "../assets/screen.png";
import waitImage from "../assets/wait.png";
import gotoImage from "../assets/goto8.png";
import ifElseImage from "../assets/ifElse.png";
import elseImage from "../assets/else6.png";
import endIfImage from "../assets/endIf4.png";
import pauseImage from "../assets/pause4.png";
import refreshOnlyImage from "../assets/refresh-only.png";
import refreshLoopImage from "../assets/refresh-loop.png";
import clickImage from "../assets/click.png";
import inputImage from "../assets/input_field.png";
import outPutImage from "../assets/output1.png";
import constructionImage from '../assets/construction.png';
import forbiddenImage from '../assets/forbidden.png';
import brickImage from '../assets/brick.png';

import AlertModal from './AlertModal';


interface GridItemProps {
  data: BlockLoopInstructionLoadDTO[];
}

// Helper function to reorder items in an array based on drag-and-drop actions
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Function to group data by blockId and sort instructions within each block
const groupByBlock = (data: BlockLoopInstructionLoadDTO[]) => {
  const blocks = data.reduce((result, item) => {
    const { blockId, blockName, exportFile } = item;
    if (!result[blockId]) {
      result[blockId] = { blockName, instructions: [], exportFile: exportFile || "No Excel Export File" };  // Set exportFile
    }
    result[blockId].instructions.push(item);
    return result;
  }, {} as Record<number, { blockName: string; exportFile?: string; instructions: BlockLoopInstructionLoadDTO[] }>);

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
  const instructionRef = useRef<HTMLInputElement>(null);
  const blockRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [mockData, setMockData] = useState<boolean>(false);
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(data);
  const [socketPort, setSocketPort] = useState<number>(8080);
  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; exportFile?: string; instructions: BlockLoopInstructionLoadDTO[] } }>({});
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState('below'); // Default to 'below'
  const [updatedBlocks, setUpdatedBlocks] = useState<UpdatedBlock[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionName, setInstructionName] = useState<string>('');
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [blockName, setBlockName] = useState<string>('');
  const [showFilePickerModal, setShowFilePickerModal] = useState(false);

  // Function to handle receiving data from JavaFX
  (window as any).receiveDataFromJava = function (jsonData: string, socketPort: number) {
    const data: BlockLoopInstructionLoadDTO[] = JSON.parse(jsonData);
    if (data && data.length > 0) {
      setMockData(true);
      setIsDataReordered(false); // Reset this flag on new data load
      setInstructionsData(data);
    }
    setSocketPort(socketPort);
    // setAlertMessage("receiveDataFromJava Socket " + socketPort);
  };


  // Drag-and-drop event handler
  const onDragEnd = (result: any) => {
    const { destination, source } = result;

    // No destination (dropped outside a droppable area)
    if (!destination) {
      return;
    }

    const sourceBlockId = source.droppableId;
    const destinationBlockId = destination.droppableId;

    // Check if source and destination blocks exist
    if (!groupedData[sourceBlockId] || !groupedData[destinationBlockId]) {
      return;
    }

    let updatedGroupedData = { ...groupedData };

    if (sourceBlockId === destinationBlockId) {

      // Moving instruction to a different block
      const sourceInstructions = Array.from(groupedData[sourceBlockId].instructions);

      const instructionToMove = sourceInstructions[source.index];


      if (instructionToMove.name === "IF" || instructionToMove.name === "ELSE" || instructionToMove.name === "ENDIF") {
        setAlertMessage('Moving "IF" or "ELSE or "ENDIF" is Not Allowed!   Move the nested instructions instead!');
        setAlertImage(forbiddenImage);
        return;

      }

      // Remove the dragged instruction from source block
      const [movedInstruction] = sourceInstructions.splice(source.index, 1);

      // Reordering within the same block
      const updatedBlockData = reorder(
        groupedData[sourceBlockId].instructions,
        source.index,
        destination.index
      );

      // Reassign instructionOrderNumbers within the block
      const updatedInstructions = updatedBlockData.map((instruction, index) => ({
        ...instruction,
        instructionOrderNumber: index + 1, // Reassign order numbers
      }));

      updatedGroupedData = {
        ...groupedData,
        [sourceBlockId]: {
          ...groupedData[sourceBlockId],
          instructions: updatedInstructions,
        },
      };
    } else {
      // Moving instruction to a different block
      const sourceInstructions = Array.from(groupedData[sourceBlockId].instructions);
      const destinationInstructions = Array.from(groupedData[destinationBlockId].instructions);

      // Remove the dragged instruction from source block
      const [movedInstruction] = sourceInstructions.splice(source.index, 1);

      if (movedInstruction.name === "IF" || movedInstruction.name === "ELSE" || movedInstruction.name === "ENDIF") {
        setAlertMessage('Moving "IF" or "ELSE" or "ENDIF" is Not Allowed Out Side from their Block!');
        setAlertImage(forbiddenImage);
        setAlertClass('construction-image');
        return;
      }

      // Update the blockId of the moved instruction
      movedInstruction.blockId = parseInt(destinationBlockId, 10);

      // Insert the moved instruction into destination block at the specified position
      destinationInstructions.splice(destination.index, 0, movedInstruction);

      // Reassign instructionOrderNumbers in source block
      const updatedSourceInstructions = sourceInstructions.map((instruction, index) => ({
        ...instruction,
        instructionOrderNumber: index + 1,
      }));

      const { blockId, blockName, blockOrderNumber } = groupedData[destinationBlockId].instructions[0] || {};

      // Reassign instructionOrderNumbers in destination block
      const updatedDestinationInstructions = destinationInstructions.map((instruction, index) => ({
        ...instruction,
        instructionOrderNumber: index + 1,
        blockId: blockId,
        blockName: blockName,
        blockOrderNumber: blockOrderNumber
      }));

      updatedGroupedData = {
        ...groupedData,
        [sourceBlockId]: {
          ...groupedData[sourceBlockId],
          instructions: updatedSourceInstructions,
        },
        [destinationBlockId]: {
          ...groupedData[destinationBlockId],
          instructions: updatedDestinationInstructions,
        },
      };


      // Remove the block from `groupedData` if it has no instructions left
      if (updatedSourceInstructions.length === 0) {
        delete updatedGroupedData[sourceBlockId];

        // Reorder blockOrderNumbers for remaining blocks in groupedData
        let blockOrder = 1; // Start from 1, or adjust as needed
        Object.keys(updatedGroupedData).forEach((blockKey) => {
          const blockId = Number(blockKey); // Convert string key to number
          const block = updatedGroupedData[blockId];
          if (block) {
            // Only update blockOrderNumber for each instruction inside this block
            const updatedInstructions = block.instructions.map((instruction: any) => {
              return {
                ...instruction,
                blockOrderNumber: blockOrder,  // Update blockOrderNumber in instruction
              };
            });

            // Add the updated block with updated instructions to newUpdatedGroupedData
            updatedGroupedData[blockId] = {
              ...block,
              instructions: updatedInstructions, // Replace the instructions with updated ones
            };

            blockOrder++; // Increment blockOrder for the next block
          }
        });

      }
    }

    // Update state with the new grouped data, ensuring no empty blocks
    setGroupedData(updatedGroupedData);

    // Flatten updatedGroupedData into instructionsData array, excluding empty blocks
    const updatedInstructionsData = Object.values(updatedGroupedData)
      .flatMap(block => block.instructions);

    // Update instructionsData state
    setInstructionsData(updatedInstructionsData);

    setIsDataReordered(false); // To trigger reordering logic if needed

    // Send WebSocket message with the updated instructions
    if (client && connected) {
      const updatedRows = updatedInstructionsData.map(instruction => ({
        blockId: instruction.blockId,
        instructionId: instruction.id,
        instructionOrderNumber: instruction.instructionOrderNumber,
      }));

      const message = {
        type: 'ROW_MOVE',
        updatedRows,
      };

      try {
        client.publish({
          destination: '/app/row/move',
          body: JSON.stringify(message),
        });
        console.log('Sent row move message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  };


  // Memoized function to handle outside clicks on the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpenDropdown(null); // Close the dropdown if clicked outside
    }
  }, [dropdownRef]);



  useEffect(() => {
    // setAlertMessage("useEffect Socket " + socketPort);
    // Create a STOMP client
    //console.log("UseEffect -> socketPort");
    const stompClient: Client = new Client({
      brokerURL: `ws://localhost:${socketPort}/websocket`, // Your WebSocket URL
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
  }, [socketPort]);

  useEffect(() => {
    //console.log("UseEffect -> editingInstructionId");
    if (editingInstructionId && instructionRef.current) {
      instructionRef.current.focus();
    }
  }, [editingInstructionId]);

  useEffect(() => {
    //console.log("UseEffect -> editingBlockId");
    if (editingBlockId && blockRef.current) {
      blockRef.current.focus();
    }
  }, [editingBlockId]);

  useEffect(() => {
    //console.log("UseEffect -> connected");
    if (connected) {
      // Assuming correctBlockOrderNumbers sets updatedBlocks based on some logic
      const { updatedData, updatedBlocks } = correctBlockOrderNumbers(instructionsData);
      setInstructionsData(updatedData);
      setUpdatedBlocks(updatedBlocks);  // Trigger the `useEffect` to send WebSocket message
    }
  }, [connected]);

  useEffect(() => {
    //console.log("UseEffect -> messages");Splir
    if (messages && messages.length > 0) {
      console.log("Messages: " + messages);
    }

  }, [messages]);

  useEffect(() => {
    //console.log("UseEffect -> updatedBlocks, client, connected");
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
    //console.log("UseEffect -> instructionsData, isDataReordered");
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
    //console.log("UseEffect -> handleClickOutside");
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    //console.log("UseEffect -> openDropdown");
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

  // Start editing block name
  const handleEditBlock = (blockId: number, currentBlockName: string) => {
    setEditingBlockId(blockId);
    setBlockName(currentBlockName);
  };

  const handleSaveBlockName = (blockId: number) => {
    // Find the botJobId from the instructionsData for the given blockId
    const botJobId = instructionsData.find(instruction => instruction.blockId === blockId)?.botJobId;

    // Check if botJobId is found, if not handle the error
    if (!botJobId) {
      console.error(`botJobId not found for blockId: ${blockId}`);
      return;
    }

    // Update instructionsData with the new block name
    const updatedInstructions = instructionsData.map((instruction) => {
      if (instruction.blockId === blockId) {
        return { ...instruction, blockName: blockName }; // Update the block name
      }
      return instruction;
    });

    // Update the instructionsData state
    setInstructionsData(updatedInstructions);

    // Recompute groupedData based on the updated instructionsData
    const updatedGroupedData = groupByBlock(updatedInstructions);
    setGroupedData(updatedGroupedData);

    // Exit edit mode
    setEditingBlockId(null);

    // Send WebSocket message for block name update
    if (client && connected) {
      const message = {
        type: 'BLOCK_UPDATE',
        botJobId: botJobId,  // Include the botJobId in the message
        blockId: blockId,
        blockName: blockName, // Send the updated block name
      };

      try {
        client.publish({
          destination: '/app/block/update',
          body: JSON.stringify(message),
        });
        console.log('Sent block name update message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  };



  const handleExcelFileBlockName = (blockId: number, blockName: string, exportFile?: string) => {
    // Find the botJobId from the instructionsData for the given blockId
    const botJobId = instructionsData.find(instruction => instruction.blockId === blockId)?.botJobId;

    // Check if botJobId is found, if not handle the error
    if (!botJobId) {
      console.error(`botJobId not found for blockId: ${blockId}`);
      return;
    }

    // Send WebSocket message for block name update
    if (client && connected) {
      const message = {
        type: 'BLOCK_EXCEL_FILE',
        botJobId: botJobId,  // Include the botJobId in the message
        blockId: blockId,
        blockName: blockName, // Send the updated block name
        exportFile: exportFile
      };

      try {
        client.publish({
          destination: '/app/block/excel',
          body: JSON.stringify(message),
        });
        console.log('Sent block name update message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
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
              blockName: instruction.blockName,
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
    setOpenDropdown(openDropdown === instructionId ? null : instructionId);

    // Use a small delay to allow the dropdown to be rendered before calculating position
    setTimeout(() => {
      const dropdown = document.getElementById(`dropdown-${instructionId}`);
      if (dropdown) {
        const rect = dropdown.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate space above and below the clicked element
        const spaceAbove = rect.top;
        const spaceBelow = windowHeight - rect.bottom;

        // Approximate dropdown height
        const dropdownHeight = dropdown.offsetHeight;

        // Check if we have enough space above or below
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          setDropdownPosition('above'); // Render above if not enough space below
        } else {
          setDropdownPosition('below'); // Render below if enough space
        }
      }
    }, 0); // Delay just enough to let the dropdown render
  };


  const handleInsertStepBefore = (instructionId: number) => {
    // Find the instruction based on the instructionId
    const instruction = instructionsData.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const botJobId = instruction.botJobId || null;

      // If the instruction is found, use its name for the alert message
      // setAlertMessage(`Inserting step before instruction: ${instruction.name}`);

      // Create the InstructionDTO object with necessary details
      const instructionDTO = {
        botJobId: botJobId,
        instructionId: instruction.id,
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
        instructionName: instruction.name,
        operation: instruction.operation,
        actions: instruction.actions,
        parentId: instruction.parentId
      };

      // WebSocket message for "INSERT_BEFORE" with the selected instruction's details
      const message = {
        type: 'INSERT_BEFORE',
        botJobId: botJobId,
        blockId: instruction.blockId,
        blockName: instruction.blockName,
        updatedRows: [instructionDTO], // Wrap the instructionDTO in an array
      };

      // Send WebSocket message
      if (client && connected) {
        try {
          client.publish({
            destination: '/app/row/insert-before', // Update based on your WebSocket endpoint configuration
            body: JSON.stringify(message),
          });

          console.log('Sent insert before message:', message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    } else {
      console.error(`Instruction with ID ${instructionId} not found.`);
    }
    setOpenDropdown(null);
  };




  const handleInsertStepAfter = (instructionId: number) => {
    // Find the instruction based on the instructionId
    const instruction = instructionsData.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const botJobId = instruction.botJobId || null;

      // If the instruction is found, use its name for the alert message
      // setAlertMessage(`Inserting step after instruction: ${instruction.name}`);

      // Create the InstructionDTO object with necessary details
      const instructionDTO = {
        botJobId: botJobId,
        instructionId: instruction.id,
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
        instructionName: instruction.name,
        operation: instruction.operation,
        actions: instruction.actions,
        parentId: instruction.parentId
      };

      // WebSocket message for "INSERT_AFTER" with the selected instruction's details
      const message = {
        type: 'INSERT_AFTER',
        botJobId: botJobId,
        blockId: instruction.blockId,
        blockName: instruction.blockName,
        updatedRows: [instructionDTO], // Wrap the instructionDTO in an array
      };

      // Send WebSocket message
      if (client && connected) {
        try {
          client.publish({
            destination: '/app/row/insert-after', // Update based on your WebSocket endpoint configuration
            body: JSON.stringify(message),
          });

          console.log('Sent insert after message:', message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    } else {
      console.error(`Instruction with ID ${instructionId} not found.`);
    }

    setOpenDropdown(null);
  };

  const closeAlert = () => {
    setAlertMessage(null);
  };

  const handleCreateComponent = (blockId: number) => {
    // Access groupedData, setGroupedData, instructionsData, and preComponent from the component's scope
    const blockToSplit = groupedData[blockId]; // Get the block directly by its blockId

    if (!blockToSplit) return; // Ensure the block exists

    // Get the block order
    const blockOrderNumber = blockToSplit.instructions[0].blockOrderNumber;

    const botJobId = blockToSplit.instructions[0]?.botJobId || null; // Retrieve botJobId from the first instruction

    const newBlock = {
      id: blockId,
      blockName: `${blockToSplit.blockName}`, // Same name as the current block
      blockOrderNumber: blockOrderNumber, // Assign the new block order number
      botJobId: botJobId, // Preserve the botJobId in the new instructions
      instructions: blockToSplit.instructions.map((instruction, index) => ({
        ...instruction,
        blockId: blockId, // Assign new block ID to the instructions
        blockOrderNumber: -1, // Assign new block order number to the instructions
        instructionOrderNumber: index + 1, // Reassign instructionOrderNumber starting from 1 within the new block
      })),
    };

    // Send WebSocket message with block split details
    if (client && connected) {
      const blockSplitDetails = {
        newBlock: {
          botJobId: botJobId,
          blockId: newBlock.id,
          blockName: newBlock.blockName,
          blockOrderNumber: newBlock.blockOrderNumber,
          instructions: newBlock.instructions.map(instruction => ({
            instructionId: instruction.id,
            blockId: blockId, // Use newBlockId here
            blockOrderNumber: newBlock.blockOrderNumber,
            instructionOrderNumber: instruction.instructionOrderNumber,
          })),
        },
      };

      const message = {
        type: 'BLOCKS_COMPONENT',
        details: blockSplitDetails,
      };

      client.publish({
        destination: '/app/block/component', // Adjust the WebSocket destination if necessary
        body: JSON.stringify(message),
      });

      console.log('Sent block split message:', message);
    }

    setOpenDropdown(null);
  };



  const isBetweenIfAndEndIf = (currentOrderNumber: number, instructions: BlockLoopInstructionLoadDTO[]) => {
    let ifFound = false;

    for (const instr of instructions) {
      if (instr.actions === "IF") {
        ifFound = true;
      }
      if (instr.instructionOrderNumber === currentOrderNumber && ifFound) {
        return true; // The instruction is between IF and ENDIF
      }
      if (instr.actions === "ENDIF" && ifFound) {
        ifFound = false; // Reset once ENDIF is encountered
      }
    }
    return false;
  }

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
        instructionOrderNumber: index + 1 // Reassign instructionOrderNumber starting from 1 within the new block
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
            botJobId: currentInstruction.botJobId,
            blockId: currentInstruction.blockId,
            blockName: currentInstruction.blockName,
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

    const { botJobId, blockId, actions, parentId } = instructionToRemove;

    // Define filtering logic based on actions type
    const updatedData =
      actions === "IF" || actions === "ELSE" || actions === "ENDIF"
        ? instructionsData.filter(
          (instruction) =>
            instruction.blockId !== blockId ||
            // instruction.id !== instructionId ||
            (instruction.actions !== "IF" &&
              instruction.actions !== "ELSE" &&
              instruction.actions !== "ENDIF")
        )
        : instructionsData.filter(
          (instruction) => instruction.id !== instructionId
        );

    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message
    if (client && connected) { // Assuming `client` is your STOMP client and `connected` is a boolean indicating the connection state
      const message = {
        type: 'DELETE_INSTRUCTION',
        instructionId: instructionId,
        actions: actions,
        parentId: parentId,
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
    setOpenDropdown(null);
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

    // Get the botJobId and blockName from the first instruction
    const firstInstruction = instructionsData.find(instr => instr.blockId === firstBlockId);
    const botJobId = firstInstruction ? firstInstruction.botJobId : null;
    const firstBlockName = firstInstruction ? firstInstruction.blockName : 'Unknown Block'; // Default to 'Unknown Block' if not found

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
        blockName: firstBlockName, // Pass the block name here
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
    let imageClass = "operations"; // Default class for images

    // Determine the image source and text based on instruction type
    if (instruction.actions.startsWith("I:")) {
      imageSrc = inputImage;
      text = `(${instruction.id})${instruction.name}`;
      imageClass = "input-image"; // Use the new class for waitImage
    } else if (instruction.actions.startsWith("O:")) {
      imageSrc = outPutImage;
      text = `(${instruction.id})${instruction.name}`;
      imageClass = "output-image"; // Use the new class for waitImage
    } else {
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
        case "E":
          imageSrc = excelImage;
          text = instruction.name;
          break;
        case "P":
          imageSrc = screenImage;
          text = instruction.name;
          break;
        case "C":
          imageSrc = clickImage;
          text = instruction.name;
          imageClass = "click-image"; // Use the new class for waitImage
          break;
        case "H":
          imageSrc = waitImage;
          text = instruction.name;
          imageClass = "wait-image"; // Use the new class for waitImage
          break;
        case "IF":
          imageSrc = ifElseImage;
          text = instruction.name;
          imageClass = "ifelse-image"; // Use the new class for waitImage
          break;
        case "REFRESH":
          imageSrc = refreshOnlyImage;
          text = instruction.name;
          imageClass = "refresh-image"; // Use the new class for waitImage
          break;
        case "REFRESH_LOOP":
          imageSrc = refreshLoopImage;
          text = instruction.name;
          imageClass = "refresh-image"; // Use the new class for waitImage
          break;
        case "GOTO":
          imageSrc = gotoImage;
          text = instruction.name;
          imageClass = "goto-image"; // Use the new class for waitImage
          break;
        case "ELSE":
          imageSrc = elseImage;
          text = instruction.name;
          imageClass = "else-image"; // Use the new class for waitImage
          break;
        case "ENDIF":
          imageSrc = endIfImage;
          text = instruction.name;
          imageClass = "endif-image"; // Use the new class for waitImage
          break;
        case "PAUSE":
          imageSrc = pauseImage;
          text = instruction.name;
          imageClass = "pause-image"; // Use the new class for waitImage
          break;
        default:
          imageSrc = null; // No image for other types
          text = instruction.id + "-" + instruction.name || null;
          isActionBold = true; // Set bold for actions
      }
    }

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return imageSrc ? (
      <div className="instruction-type">
        <img src={imageSrc} alt="" className={imageClass} />
        <span>{text}</span>
      </div>
    ) : (
      <span style={{ fontWeight: isActionBold ? 'bold' : 'normal' }}>
        {text}
      </span>
    );
  };


  const renderEditButton = (actionType: string, editImage: string, instruction: BlockLoopInstructionLoadDTO) => {
    if (["SET", "GET", "CK", "Q", "E", "P", "H", "GOTO", "IF", "ELSE", "ENDIF", "PAUSE", "REFRESH", "REFRESH_LOOP"].includes(actionType)) {
      return <span className="edit-button-space">&nbsp;</span>; // Render a space or an empty element
    }

    return (
      <img
        src={editImage}
        alt="edit"
        className="edit-button"
        onClick={() => handleEditInstruction(instruction)}  // Trigger edit mode
      />
    );
  };

  // Function to render the move buttons based on the action type
  const renderMoveButtons = (actionType: string, instructionId: number) => {
    if (["IF", "ELSE", "ENDIF"].includes(actionType)) {
      return null; // Don't render buttons for these action types
    }

    return (
      <>
        <img
          src={upImage}
          alt="Move Up"
          className="move-button"
          onClick={() => handleMoveRowUp(instructionId)}
        />
        <img
          src={downImage}
          alt="Move Down"
          className="move-button"
          onClick={() => handleMoveRowDown(instructionId)}
        />
      </>
    );
  };


  const handleEditInstruction = (instruction: BlockLoopInstructionLoadDTO) => {
    setEditingInstructionId(instruction.id);
    setInstructionName(instruction.name);
  };

  const handleSaveInstruction = (instructionId: number) => {
    // Find the instruction to get blockId and botJobId
    const instructionToUpdate = instructionsData.find(instruction => instruction.id === instructionId);

    if (!instructionToUpdate) {
      console.error(`Instruction with ID ${instructionId} not found`);
      return;
    }

    const { blockId, blockName, blockOrderNumber, botJobId, instructionOrderNumber } = instructionToUpdate;

    // Update the instruction's name
    const updatedInstructions = instructionsData.map((instruction) => {
      if (instruction.id === instructionId) {
        return { ...instruction, name: instructionName }; // Update the name
      }
      return instruction;
    });

    setInstructionsData(updatedInstructions);
    setEditingInstructionId(null); // Exit edit mode

    const instructionUpdated = instructionsData.find(instruction => instruction.id === instructionId);
    // Send WebSocket message with the updated instruction
    if (client && connected) {
      const message = {
        type: 'ROW_UPDATE',
        botJobId: botJobId,
        blockId: blockId,
        blockName: blockName,
        updatedRows: [{
          instructionId: instructionId,
          instructionOrderNumber: instructionOrderNumber,
          blockId: blockId,
          blockOrderNumber: blockOrderNumber,
          botJobId: botJobId,
          instructionName: instructionName, // The updated name
        }]
      };

      instructionToUpdate.name = instructionName;


      // const message = {
      //   type: 'ROW_UPDATE',
      //   botJobId: botJobId,
      //   updatedRows: [instructionToUpdate], // Wrap the instructionDTO in an array
      // };

      try {
        client.publish({
          destination: '/app/instruction/update', // WebSocket destination
          body: JSON.stringify(message),
        });

        console.log('Sent instruction update message:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  };



  const renderOperations = (
    instruction: BlockLoopInstructionLoadDTO,
    allInstructions: BlockLoopInstructionLoadDTO[]
  ) => {
    const validActions = ["SET", "GET", "CK", "E", "GOTO", "REFRESH_LOOP"];

    // Handle the "CK" action with special formatting for operation
    if (instruction.actions === "CK" && instruction.operation) {
      const [left, middle, right] = instruction.operation.split(":").map((part) => part.trim());

      if (middle === "=") {
        return (
          <span className="instruction-details">
            <span style={{ color: "#0b5394" }}>({instruction.parentId}){left}</span>
            <span style={{ color: "#0b5394" }}>{middle}</span>
            <span style={{ color: "#FFA500" }}>{right}</span>
          </span>
        );
      }
    }

    // Special case for "GOTO" action - render only the operation without parentId or colon
    if (instruction.actions === "GOTO" && instruction.operation) {
      return (
        <span className="instruction-details">
          <span style={{ color: "#b163ff" }}>{instruction.operation}</span>
        </span>
      );
    }

    // Handle "REFRESH_LOOP" operation with extended details
    if (instruction.actions === "REFRESH_LOOP" && instruction.operation) {
      const parts = instruction.operation.split(":").map((part) => part.trim());
      const [refreshLabel, refreshValue, loopLabel, loopValue, parentLabel, parentValue] = parts;

      return (
        <span className="instruction-details">
          <span style={{ color: "#0b5394" }}>{refreshLabel}</span>{" "}
          <span style={{ color: "#FFA500" }}>{refreshValue}s</span> :{" "}
          <span style={{ color: "#0b5394" }}>{loopLabel}</span>{" "}
          <span style={{ color: "#FFA500" }}>{loopValue} times</span> :{" "}
          <span style={{ color: "#0b5394" }}>{parentLabel}</span>{" "}
          <span style={{ color: "#FFA500" }}>({instruction.parentId}){parentValue}</span>
        </span>
      );
    }

    // Handle operation for other actions (SET, GET, E)
    if (instruction.operation && validActions.includes(instruction.actions)) {
      const [left, right] = instruction.operation.split(":");

      return (
        <span className="instruction-details">
          <span style={{ color: "#0b5394" }}>({instruction.parentId}){left}</span>:
          <span style={{ color: "#FFA500" }}>{right}</span>
        </span>
      );
    }

    // Render the action if it is valid but has no operation
    if (validActions.includes(instruction.actions)) {
      return <span className="instruction-details">{instruction.actions}</span>;
    }

    // Return a blank span with a non-breaking space to maintain alignment
    return <span className="instruction-details">&nbsp;</span>;
  };


  return (
    <div className="grid-container">
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={closeAlert}
          imageSrc={alertImage}          // Pass the image source
          imageClass={alertClass}
        />
      )}
      <DragDropContext
        onDragEnd={onDragEnd} // Define the onDragEnd handler to update the state when the dragging stops
      >
        {Object.entries(groupedData)
          .sort(
            ([, aBlockData], [, bBlockData]) =>
              aBlockData.instructions[0].blockOrderNumber -
              bBlockData.instructions[0].blockOrderNumber
          )
          .map(([blockId, blockData], index) => (
            <div key={blockId} className="block">
              {/* Block header with garbage, up, and down buttons */}
              <div className="block-header">
                <span className="block-order-number">
                  #{blockData.instructions[0].blockOrderNumber}
                </span>
                {editingBlockId === Number(blockId) ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveBlockName(Number(blockId)); // Trigger save when "Enter" is pressed
                        }
                      }}
                      ref={blockRef} // Associate the ref with the input element
                      className="edit-textbox"
                    />
                    <img
                      src={saveImage}
                      alt="save"
                      className="save-button"
                      onClick={() => handleSaveBlockName(Number(blockId))}
                    />
                  </div>
                ) : (
                  <span className="block-name">{blockData.blockName}</span>
                )}

                <span className="block-count">
                  ({blockData.instructions.length})
                  {!mockData ? "-Moock Data" : ""}
                </span>
                {/* Show the export file or "No Export File" */}
                <span className="block-export-file">
                  {blockData.exportFile}
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
                    src={upImage}
                    alt=""
                    className="move-button"
                    onClick={() => handleMoveBlockUp(Number(blockId))}
                  />
                  <img
                    src={downImage}
                    alt=""
                    className="move-button"
                    onClick={() => handleMoveBlockDown(Number(blockId))}
                  />
                  {/* Edit Block Name Button */}
                  <img
                    src={editImage}
                    alt="edit"
                    className="edit-button"
                    onClick={() => handleEditBlock(Number(blockId), blockData.blockName)} // Edit block logic
                  />
                  {/* Edit Block Name Button */}
                  <img
                    src={excelImage}
                    alt="excel"
                    className="excel-button"
                    onClick={() => handleExcelFileBlockName(Number(blockId), blockData.blockName, blockData.exportFile)} // Edit block logic
                  />
                  <img
                    src={saveImage}
                    alt="save"
                    className="save-button"
                    onClick={() => handleCreateComponent(Number(blockId))}
                  />
                  {index !== 0 && (
                    <img
                      src={crossImage}
                      alt=""
                      className="cross-button"
                      onClick={() => handleRemoveBlock(Number(blockId))}
                    />
                  )}

                </div>
              </div>
              <Droppable droppableId={blockId} key={blockId}>
                {(provided) => (
                  <div
                    className="instructions-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {blockData.instructions.map((instruction, index) => {
                      const isLastInstruction =
                        index === blockData.instructions.length - 1;
                      const isLastBlock =
                        Number(blockId) === Object.keys(groupedData).length; // Check if this is the last block

                      return (
                        <Draggable
                          key={instruction.id}
                          draggableId={instruction.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`instruction-item ${openDropdown === instruction.id ? 'dropdown-open' : ''
                                } ${instruction.actions === 'IF' || instruction.actions === 'ELSE' || instruction.actions === 'ENDIF'
                                  ? 'light-yellow-background'
                                  : ''
                                }`}
                            >
                              {editingInstructionId === instruction.id ? (
                                <div className="edit-container">
                                  <input
                                    type="text"
                                    value={instructionName}
                                    onChange={(e) =>
                                      setInstructionName(e.target.value)
                                    }
                                    ref={instructionRef} // Associate the ref with the input element
                                    className="edit-textbox"
                                  />
                                  <img
                                    src={saveImage}
                                    alt="save"
                                    className="save-button"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveBlockName(Number(blockId)); // Trigger save when "Enter" is pressed
                                      }
                                    }}
                                    onClick={() =>
                                      handleSaveInstruction(instruction.id)
                                    } // Save instruction logic
                                  />
                                </div>
                              ) : (
                                <span>
                                  {getInstructionTypeElement(instruction)}
                                </span>
                              )}
                              {renderOperations(instruction, instructionsData)}
                              <div className="options-column">
                                <div className="move-buttons">
                                  {renderEditButton(
                                    instruction.actions,
                                    editImage,
                                    instruction
                                  )}
                                  {renderMoveButtons(instruction.actions, instruction.id)}
                                  <img
                                    src={crossImage}
                                    alt=""
                                    className="cross-button"
                                    onClick={() =>
                                      handleRemoveInstruction(instruction.id)
                                    }
                                  />
                                </div>
                              </div>

                              {/* New column for dropdown menu */}
                              <div className="dropdown-column">
                                <img
                                  src={menuDownImage}
                                  className="dropdown-arrow"
                                  alt=""
                                  onClick={() =>
                                    handleToggleDropdown(instruction.id)
                                  }
                                />

                                {openDropdown === instruction.id && (
                                  <div
                                    id={`dropdown-${instruction.id}`} // Use unique ID for each dropdown
                                    ref={dropdownRef}
                                    className={`dropdown-menu ${dropdownPosition === 'above'
                                      ? 'dropdown-above'
                                      : ''
                                      }`}
                                  >
                                    <div
                                      onClick={() =>
                                        handleInsertStepBefore(instruction.id)
                                      }
                                    >
                                      Insert Step Before
                                    </div>
                                    <div
                                      onClick={() =>
                                        handleInsertStepAfter(instruction.id)
                                      }
                                    >
                                      Insert Step After
                                    </div>

                                    {!isLastInstruction &&
                                      (instruction.actions === "ENDIF" ||
                                        (!["IF", "ELSE"].includes(instruction.actions) &&
                                          !isBetweenIfAndEndIf(instruction.instructionOrderNumber, blockData.instructions))) && (
                                        <div
                                          onClick={() =>
                                            handleSplitComponent(
                                              instruction.id,
                                              groupedData,
                                              setGroupedData,
                                              instructionsData
                                            )
                                          }
                                        >
                                          Split Component
                                        </div>
                                      )
                                    }


                                    <div
                                      onClick={() =>
                                        handleRemoveInstruction(instruction.id)
                                      }
                                    >
                                      Delete
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
      </DragDropContext>
    </div>
  );

};

export default GridItem;
