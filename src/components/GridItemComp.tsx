import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BotJobData, ComplexMessage, ComponentsInstructionsDTO, ElementDTO, UpdatedBlock } from './instructionsMockData';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // Import from react-beautiful-dnd
import setValueImage from '../assets/setValueBtn3.png';
import getValueImage from '../assets/getValueBtn3.png';
import checkImage from '../assets/check4.png';

import crossImage from '../assets/cross.png';
import editImage from '../assets/edit.png';
import edit2Image from '../assets/edit2.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import rollBackImage from '../assets/rollback4.png';
import binImage from '../assets/bin.png';
import closeBrowserImage from '../assets/close-browser.png';
import menuDownImage from '../assets/menu-down.png';
import saveImage from "../assets/save.png";
import excelImage from "../assets/excel.png";
import screenImage from "../assets/screen.png";
import waitImage from "../assets/wait.png";
import gotoImage from "../assets/goto8.png";
import excelGotoImage from "../assets/excel_goto2.png";
import nextRowImage from "../assets/excel.png";
import ifElseImage from "../assets/ifElse.png";
import elseImage from "../assets/else6.png";
import endIfImage from "../assets/endIf4.png";
import pauseImage from "../assets/pause4.png";
import refreshOnlyImage from "../assets/refresh-only.png";
import refreshLoopImage from "../assets/refresh-loop.png";
import clickImage from "../assets/click.png";
import clickTestImage from "../assets/clickTest2.png";
import linkImage from "../assets/links-icon.png";
import inputImage from "../assets/input_field.png";
import outPutImage from "../assets/output1.png";
import constructionImage from '../assets/construction.png';
import forbiddenImage from '../assets/forbidden.png';
import warningRedImage from '../assets/warning_red.png';
import brickImage from '../assets/brick.png';
import hiddenImage from '../assets/hidden-black.png';
import activeImage from '../assets/active3.png';
import inactiveImage from '../assets/inactive2.png';
import ArrowLeft from '../assets/ArrowLeft.png';


import AlertModal from './AlertModal';
import CompForce from './CompForce';
import InstructionCommandPanel, { CommandDraft } from './InstructionCommandPanel';
import { useWebSocket } from './useWebSocket';
import styles from './Griditem.module.scss';


interface GridItemCompProps {
  homeBankingIdInitial: number;
  dataComp: ComponentsInstructionsDTO[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
}

// Helper function to reorder items in an array based on drag-and-drop actions
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Function to group data by blockId and sort instructions within each block
const groupByBlock = (data: ComponentsInstructionsDTO[]) => {
  const blocks = data.reduce((result, item) => {
    const { blockId, blockName, exportFile } = item;
    if (!result[blockId]) {
      result[blockId] = { blockName, instructions: [], exportFile: exportFile || "No Excel Export File" };  // Set exportFile
    }
    result[blockId].instructions.push(item);
    return result;
  }, {} as Record<number, { blockName: string; exportFile?: string; instructions: ComponentsInstructionsDTO[] }>);

  // Sort each block's instructions by instructionOrderNumber
  Object.values(blocks).forEach(block => {
    block.instructions.sort((a, b) => a.instructionOrderNumber - b.instructionOrderNumber);
  });


  return blocks;
};


// Helper function to reassign instructionOrderNumber starting from 1 within each block
const reassignInstructionOrderNumbersByBlock = (instructions: ComponentsInstructionsDTO[]) => {
  // Group instructions by blockId
  const grouped = groupByBlock(instructions);

  // Iterate over each block and reassign instructionOrderNumbers
  const updatedInstructions: ComponentsInstructionsDTO[] = [];
  Object.entries(grouped).forEach(([blockId, blockData]) => {
    const reassignedInstructions = blockData.instructions.map((instruction, index) => ({
      ...instruction,
      instructionOrderNumber: index + 1, // Reassign starting from 1 within each block
    }));
    updatedInstructions.push(...reassignedInstructions);
  });

  return updatedInstructions;
};

const GridItemComp: React.FC<GridItemCompProps> = ({ homeBankingIdInitial, dataComp, socketPort, sessionId, botJobIdInitial, botJobNameInitial }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [componentsData, setComponentsData] = useState<ComponentsInstructionsDTO[]>(dataComp);
  const [excelGotoInstruction, setExcelGotoInstruction] = useState<ComponentsInstructionsDTO | null>(null);

  // Use state to manage the instructions data
  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [blockId, setBlockId] = useState<number | null>(-1);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);

  const instructionRef = useRef<HTMLInputElement>(null);
  const blockRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [mockData, setMockData] = useState<boolean>(false);
  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; exportFile?: string; instructions: ComponentsInstructionsDTO[] } }>({});
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);

  // const [client, setClient] = useState<Client | null>(null);
  // const [connected, setConnected] = useState(false);
  // const [lastMessages, setLastMessages] = useState<any[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState('below'); // Default to 'below'
  const [updatedBlocks, setUpdatedBlocks] = useState<UpdatedBlock[]>([]);
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionName, setInstructionName] = useState<string>('');
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockName, setBlockName] = useState<string>('');

  const [errorFlag, setErrorFlag] = useState<boolean>(false)
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [findText, setFindText] = useState<string>('');

  //  const [executionId, setExecutionId] = useState<number>(0);
  //  const [executionState, setExecutionState] = useState<string>();


  type ActionFlag = "E" | "S";

  const parseActions = (actions?: string | null) =>
    (actions ?? "")
      .split(":")
      .map(t => t.trim())
      .filter(Boolean);

  const buildActions = (tokens: string[]) => tokens.join(":");

  const isFlag = (t: string) => {
    const u = t.toUpperCase();
    return u === "E" || u === "S";
  };

  function updateInputActionName(actions: string, newName: string) {
    if (!actions || !actions.startsWith("I")) return actions;

    // Only apply to inputs:
    // "I" or "I:..." (covers "I:" too)
    if (actions !== "I" && !actions.startsWith("I:")) return actions;

    const parts = actions
      .split(":")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Ensure base is exactly "I"
    const base = "I";

    // Collect flags from everything except base and the tail-name if present
    // We treat any non-flag token after I as "name" candidate, but we ultimately set it to newName.
    const middle = parts.slice(1);
    const flags = middle.filter(isFlag);

    // Stable order (S then E)
    const normalizedFlags: string[] = [];
    if (flags.includes("S")) normalizedFlags.push("S");
    if (flags.includes("E")) normalizedFlags.push("E");

    // Always: I[:S][:E]:newName  (so the LAST token is always the name)
    return [base, ...normalizedFlags, newName].join(":");
  }

  // choose a consistent flag order (CHANGE if you prefer S before E)
  const FLAG_ORDER: ActionFlag[] = ["E", "S"];

  const toggleActionFlag = (
    actions: string | null | undefined,
    flag: ActionFlag,
    origName?: string
  ) => {
    const tokens = parseActions(actions);
    const upper = tokens.map(t => t.toUpperCase());

    // Special case: I:... (inputs)
    if (upper[0] === "I") {
      let name = tokens[tokens.length - 1] ?? "";

      // If last token is a flag, then there is no name yet
      if (isFlag(name.toUpperCase())) {
        name = origName ?? "";
      }

      // If origName provided and different → enforce it
      if (origName && name !== origName) {
        name = origName;
      }

      // Extract base + flags (exclude last token)
      const head = tokens.slice(0, tokens.length - 1);
      const headUpper = head.map(t => t.toUpperCase());

      const base = "I";
      const existingFlags = headUpper.filter(isFlag) as ActionFlag[];

      const has = existingFlags.includes(flag);
      const nextFlags = has
        ? existingFlags.filter(f => f !== flag)
        : [...existingFlags, flag];

      // Stable order
      const orderedFlags = FLAG_ORDER.filter(f => nextFlags.includes(f));

      return buildActions([base, ...orderedFlags, name]);
    }

    // Default (non-I)
    const flagUpper = flag.toUpperCase();
    const idx = upper.indexOf(flagUpper);

    if (idx >= 0) {
      const out = tokens.slice(0, idx).concat(tokens.slice(idx + 1));
      return buildActions(out);
    }

    return buildActions([...tokens, flag]);
  };

  const hasActionFlag = (actions: string | null | undefined, flag: ActionFlag) => {
    const tokens = parseActions(actions).map(t => t.toUpperCase());
    return tokens.includes(flag);
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
    let deleteBlockId = -1; // Default value for deleted blockId
    // Retrieve botJobId from the first instruction in the source block
    const botJobId = groupedData[destinationBlockId].instructions?.[0]?.botJobId;

    if (sourceBlockId === destinationBlockId) {

      // Moving instruction to a different block
      const sourceInstructions = Array.from(groupedData[sourceBlockId].instructions);

      const instructionToMove = sourceInstructions[source.index];


      if (instructionToMove.actions === "IF" || instructionToMove.actions === "ELSEIF" || instructionToMove.actions === "ELSE" || instructionToMove.actions === "ENDIF") {

        // Find all the instructions whose parentId matches instructionToMove.parentId
        const matchingInstructions = sourceInstructions
          .map((instruction, index) => ({ index, instruction })) // Add index to each instruction
          .filter(({ instruction }) => instruction.parentId === instructionToMove.parentId); // Filter by parentId matching

        // Map to get a final list with the index and action (or any other data you need)
        const parentList = matchingInstructions.map(({ index, instruction }) => ({
          index,
          action: instruction.actions, // Adjust this to any property you need
        }));

        // Check for invalid moves involving "IF", "ELSE", and "ENDIF"
        if (instructionToMove.actions === "IF") {
          // Prevent "IF" from being moved after "ELSE" or "ENDIF"
          const isMoveForbidden = parentList.some(parent =>
            (parent.action === "ELSEIF" || parent.action === "ELSE" || parent.action === "ENDIF") && destination.index >= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              `It cannot be placed after "ELSEIF", "ELSE" or "ENDIF"`
            );
            return;
          }
        }

        if (instructionToMove.actions === "ELSEIF") {
          // Prevent "ELSE" from being moved after its corresponding "ENDIF"
          const isMoveForbidden = parentList.some(parent =>
            (parent.action === "ELSE" || parent.action === "ENDIF") && destination.index >= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              `It cannot be placed after "ELSE" OR "ENDIF"`
            );
            return;
          }
        }

        if (instructionToMove.actions === "ELSEIF") {
          // Prevent "ELSE" from being moved after its corresponding "ENDIF"
          const isMoveForbidden = parentList.some(parent =>
            parent.action === "IF" && destination.index <= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              `It cannot be placed before "IF"`
            );
            return;
          }
        }


        if (instructionToMove.actions === "ELSE") {
          // Prevent "ELSE" from being moved after its corresponding "ENDIF"
          const isMoveForbidden = parentList.some(parent =>
            parent.action === "ENDIF" && destination.index >= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              `It cannot be placed after "ENDIF"`
            );
            return;
          }
        }



        if (instructionToMove.actions === "ELSE") {
          // Prevent "ENDIF" or "ELSE" from being moved before "IF" or another "ELSE"
          const isMoveForbidden = parentList.some(parent =>
            (parent.action === "IF" || parent.action === "ELSEIF") && destination.index <= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              ` It cannot be placed before "IF" or "ELSEIF"`
            );
            return;
          }
        }


        if (instructionToMove.actions === "ENDIF") {
          // Prevent "ENDIF" or "ELSE" from being moved before "IF" or another "ELSE"
          const isMoveForbidden = parentList.some(parent =>
            (parent.action === "IF" || parent.action === "ELSE") && destination.index <= parent.index
          );

          if (isMoveForbidden) {
            setAlertImage(forbiddenImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(
              `Drag & Drop not Allowed`
            );
            setErrorFlag(true);
            setAlertMessageBody(
              `Moving "${instructionToMove.actions}" is not allowed!"`
            );
            setAlertMessageFooter(
              `It cannot be placed before "IF" or "ELSE"`
            );
            return;
          }
        }


      }

      if (instructionToMove.refreshLoop || instructionToMove.loopOnly) {

        // Find all the instructions whose parentId matches instructionToMove.id
        const matchingInstructions = sourceInstructions
          .map((instruction, index) => ({ index, instruction })) // Add index to each instruction
          .filter(({ instruction }) => instruction.parentId === instructionToMove.id); // Filter by parentId matching

        // Map to get a final list with the index and action (or any other data you need)
        const parentList = matchingInstructions.map(({ index, instruction }) => ({
          index,
          action: instruction.actions, // Adjust this to any property you need
        }));

        // Check for invalid moves involving "refreshLoop" and "loopOnly"
        // Prevent "IF" from being moved after "ELSE" or "ENDIF"
        const isMoveForbidden = parentList.some(parent =>
          (parent.action === "REFRESH_LOOP" || parent.action === "LOOP") && destination.index >= parent.index
        );

        if (isMoveForbidden) {
          setAlertImage(forbiddenImage);
          setAlertClass('construction-image');
          setAlertMessageHeader(
            `Drag & Drop not Allowed`
          );
          setErrorFlag(true);
          setAlertMessageBody(
            `Moving "${instructionToMove.name}" is not allowed!"`
          );
          setAlertMessageFooter(
            `It cannot be placed after "REFRESH_LOOP" or "LOOP"`
          );
          return;
        }
      }


      if (instructionToMove.actions === "REFRESH_LOOP" || instructionToMove.actions === "LOOP") {
        // Find all the instructions whose id matches instructionToMove.parentId
        const matchingInstructions = sourceInstructions
          .map((instruction, index) => ({ index, instruction })) // Add index to each instruction
          .filter(({ instruction }) => instruction.id === instructionToMove.parentId); // Filter by parentId matching

        // Map to get a final list with the index, action, and additional properties
        const parentList = matchingInstructions.map(({ index, instruction }) => ({
          index,
          name: instruction.name,
          refreshLoop: instruction.refreshLoop, // Include refreshLoop
          loopOnly: instruction.loopOnly,       // Include loopOnly
        }));

        // Check for invalid moves involving "refreshLoop" and "loopOnly"
        const forbiddenInstruction = parentList.find(parent =>
          (parent.refreshLoop || parent.loopOnly) && destination.index <= parent.index
        );

        const isMoveForbidden = !!forbiddenInstruction; // Convert to boolean

        if (isMoveForbidden) {
          setAlertImage(forbiddenImage);
          setAlertClass('construction-image');
          setAlertMessageHeader(
            `Drag & Drop not Allowed`
          );
          setErrorFlag(true);
          setAlertMessageBody(
            `Moving "${instructionToMove.name}" is not allowed!"`
          );
          setAlertMessageFooter(
            `It cannot be placed before "${forbiddenInstruction?.name}"`
          );

          return { isMoveForbidden, forbiddenInstruction }; // Return both values if needed
        }

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
      // Handle moving between different blocks
      const sourceInstructions = Array.from(groupedData[sourceBlockId].instructions);
      const destinationInstructions = Array.from(groupedData[destinationBlockId].instructions);

      // Remove the dragged instruction from source block
      const [movedInstruction] = sourceInstructions.splice(source.index, 1);

      if (movedInstruction.actions === "REFRESH_LOOP" || movedInstruction.actions === "LOOP" || movedInstruction.actions === "IF" || movedInstruction.actions === "ELSEIF" || movedInstruction.actions === "ELSE" || movedInstruction.actions === "ENDIF") {
        setAlertImage(forbiddenImage);
        setAlertClass('construction-image');
        setAlertMessageHeader(
          `Drag & Drop not Allowed`
        );
        setErrorFlag(true);
        setAlertMessageBody(`Moving "${movedInstruction.actions}"!`);
        setAlertMessageFooter(
          `Is not allowed Outside of a Block"`
        );
        return;
      }

      if (movedInstruction.refreshLoop || movedInstruction.loopOnly) {

        setAlertImage(forbiddenImage);
        setAlertClass('construction-image');
        setAlertMessageHeader(
          `Drag & Drop not Allowed`
        );
        setErrorFlag(true);
        setAlertMessageBody(`Moving "${movedInstruction.name}" is not allowed!`);
        setAlertMessageFooter(
          `It's attached to "REFRESH_LOOP" or "LOOP"!"`
        );
        return;

      }


      // Update the blockId of the moved instruction
      movedInstruction.blockId = parseInt(destinationBlockId, 10);

      // Insert the moved instruction into destination block at the specified position
      destinationInstructions.splice(destination.index, 0, movedInstruction);

      // Check if sourceInstructions is empty and movedInstruction.blockOrderNumber is 1
      if (sourceInstructions.length === 0 && movedInstruction.blockOrderNumber === 1) {
        // Set all destination instructions' blockOrderNumber to 1
        destinationInstructions.forEach(instruction => {
          instruction.blockOrderNumber = 1;
        });
      }

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
        deleteBlockId = parseInt(sourceBlockId, 10); // Track the blockId to delete
        delete updatedGroupedData[sourceBlockId];
      }
    }

    // Update state with the new grouped data, ensuring no empty blocks
    setGroupedData(updatedGroupedData);

    // Flatten updatedGroupedData into componentsData array, excluding empty blocks
    const updatedInstructionsData = Object.values(updatedGroupedData)
      .flatMap(block => block.instructions);

    // Update componentsData state
    setComponentsData(updatedInstructionsData);

    setIsDataReordered(false); // To trigger reordering logic if needed

    // Send WebSocket message with the updated instructions
    if (webSocket && connected) {
      const updatedRows = updatedInstructionsData.map(instruction => ({
        blockId: instruction.blockId,
        instructionId: instruction.id,
        instructionOrderNumber: instruction.instructionOrderNumber,
      }));

      const message = {
        type: 'ROW_MOVE',
        botJobId,
        botJobName,
        deleteBlockId,
        homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        updatedRows,
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent row move message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
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
    console.log("WebSocket Messages");

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('RECEIVED -> Last WebSocket message ', lastMessage);

      try {
        const parsedMessage = JSON.parse(lastMessage);
        if (typeof parsedMessage.homeBankingId === "number") {
          setHomeBankingId(parsedMessage.homeBankingId);
        }


        if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "componentsUpdate") {

          const bodyData = typeof parsedMessage.body === "string"
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;

          // ... handle updateInstructions ...
          // Ensure detailsData is always an array if possible
          const detailsData = Array.isArray(bodyData) ? bodyData : [];

          // Check if detailsData is empty
          if (detailsData.length === 0) {
            // If empty, set elementDTO to an empty array
            setComponentsData([]);
            setGroupedData({}); // Or set to your initial empty state
            setIsDataReordered(true); // Or false, depending on your logic
            setBotJobId(bodyData.botJobId);
            setBotJobName(bodyData.botJobName);
            setBlockId(bodyData.blockId);
          } else {
            // Otherwise, set elementDTO to detailsData

            if (typeof detailsData[0].botJobId === "number") {
              setBotJobId(detailsData[0].botJobId);
            }

            if (typeof detailsData[0].botJobName === "string") {
              setBotJobName(detailsData[0].botJobName);
            }

            setComponentsData(detailsData);
            setIsDataReordered(false); // To trigger reordering logic if needed

          }
        }

      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [messages]);


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
    console.log("Update Blocks");

    if (updatedBlocks.length > 0 && webSocket && connected) {
      const message = {
        type: 'BLOCK_ORDER',
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        updatedBlocks: updatedBlocks,
      };

      if (webSocket.readyState === WebSocket.OPEN) {
        try {
          webSocket.send(JSON.stringify(message));
          console.log('Sent block order message:', message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    }
  }, [updatedBlocks]); // Remove unnecessary dependencies

  useEffect(() => {
    if (!isDataReordered && componentsData.length > 0) {
      console.log("Reassigning instruction order numbers");

      const reassignedData = reassignInstructionOrderNumbersByBlock([...componentsData]);
      const { updatedData, updatedBlocks } = correctBlockOrderNumbers(reassignedData);


      const gotoInstructionAfterReorder = reassignedData.find(
        (instruction) => instruction.actions === 'EXCEL GOTO'
      );

      setComponentsData(updatedData);
      setExcelGotoInstruction(gotoInstructionAfterReorder || null);
      setGroupedData(groupByBlock(reassignedData));

      if (JSON.stringify(updatedBlocks) !== JSON.stringify(updatedBlocks)) {
        setUpdatedBlocks(updatedBlocks);
      }

      setIsDataReordered(true);
    }
  }, [componentsData, isDataReordered]);


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

  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
    setAlertOnConfirm(undefined);
  };

  const handleSaveBlockName = (blockId: number) => {
    // Ensure componentsData is available
    if (!componentsData || componentsData.length === 0) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Save Block Name`
      );
      setErrorFlag(true);
      setAlertMessageBody('Instructions data is empty or not available.');
      return;
    }


    // Check if botJobId is found, if not handle the error
    if (!botJobId) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Bot Job not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`botJobId not found for blockId: ${blockId}`);
      return;
    }

    // Update componentsData with the new block name
    const updatedInstructions = componentsData.map((instruction) => {
      if (instruction.blockId === blockId) {
        return { ...instruction, blockName: blockName }; // Update the block name
      }
      return instruction;
    });

    // Update the componentsData state
    setComponentsData(updatedInstructions);

    // Recompute groupedData based on the updated componentsData
    const updatedGroupedData = groupByBlock(updatedInstructions);
    setGroupedData(updatedGroupedData);

    // Exit edit mode
    setEditingBlockId(null);

    // Send WebSocket message for block name update
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_UPDATE',
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: blockId,
        blockName: blockName, // Send the updated block name
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent block name update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    } else {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Socket`
      );
      setErrorFlag(true);
      setAlertMessageBody('WebSocket client is not connected or available.');
    }
  };


  const handleBlockStatus = (blockId: number) => {
    // Find the botJobId and current blockActive status from the componentsData for the given blockId
    const block = componentsData.find(instruction => instruction.blockId === blockId);

    const currentBlockActive = block?.blockActive;

    // Check if botJobId is found, if not handle the error
    if (!botJobId) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(`Error Bot Job not found`);
      setErrorFlag(true);
      setAlertMessageBody(`botJobId not found for blockId: ${blockId}`);
      return;
    }

    // Determine the new blockActive value (toggle)
    const newBlockActive = !currentBlockActive;

    // Update componentsData with the new blockActive and instructionActive values
    const updatedInstructions = componentsData.map((instruction) => {
      if (instruction.blockId === blockId) {
        return {
          ...instruction,
          blockActive: newBlockActive, // Toggle the blockActive value
          instructionActive: newBlockActive // Update instructionActive to match the new blockActive value
        };
      }
      return instruction;
    });

    // Update the componentsData state
    setComponentsData(updatedInstructions);

    // Recompute groupedData based on the updated componentsData
    const updatedGroupedData = groupByBlock(updatedInstructions);
    setGroupedData(updatedGroupedData);

    // Exit edit mode
    setEditingBlockId(null);

    // Send WebSocket message for blockActive update
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_STATUS',
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: blockId,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        blockActive: newBlockActive, // Send the toggled blockActive value
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent blockActive update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
  };

  const handleInstructionStatus = (instructionId: number, instructions: ComponentsInstructionsDTO[]) => {
    // Find the instruction by ID
    const instruction = instructions.find(item => item.id === instructionId);

    // Validate the instruction exists
    if (!instruction) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader('Error Instruction not found');
      setErrorFlag(true);
      setAlertMessageBody(`Instruction not found for instructionId: ${instructionId}`);
      setAlertMessageFooter(`Instruction not found`);
      return;
    }

    // Destructure properties from the found instruction
    const { botJobId, instructionActive, actions, parentId } = instruction;

    // Determine if the actions require updating by parentId
    const conditionalActions = ["IF", "ELSEIF", "ELSE", "ENDIF"];
    const shouldUpdateByParent = conditionalActions.includes(actions);

    const currentInstructionActive = instructionActive; // Default to false if undefined


    // Determine the new instructionActive value (toggle)
    const newInstructionActive = !currentInstructionActive;

    // Update componentsData with the new instructionActive value
    const updatedInstructions = componentsData.map((item) => {
      if (item.id === instructionId) {
        return { ...item, instructionActive: newInstructionActive }; // Toggle instructionActive
      }

      if (shouldUpdateByParent && item.parentId === parentId) {
        // Update all instructions with the same parentId
        return { ...item, instructionActive: newInstructionActive };
      }

      return item;
    });

    // Update the componentsData state
    setComponentsData(updatedInstructions);

    // Recompute groupedData based on the updated componentsData
    const updatedGroupedData = groupByBlock(updatedInstructions);
    setGroupedData(updatedGroupedData);

    // Exit edit mode (if applicable)
    setEditingBlockId(null);

    // Send WebSocket message for instructionActive update
    if (webSocket && connected) {
      const message = {
        type: 'INSTRUCTION_STATUS',
        botJobId: botJobId,
        blockId: instruction.blockId,
        botJobName: botJobName,
        instructionId,
        instructionActive: newInstructionActive, // Send the toggled instructionActive value
        parentId: parentId,
        actions: actions,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent instructionActive update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
  };

  const handleComponentInjection = (blockGroupId: number) => {
    // Access groupedData, setGroupedData, instructionsData, and preComponent from the component's scope
    const blockCompent = groupedData[blockGroupId]; // Get the block directly by its blockId

    if (!blockCompent) return; // Ensure the block exists

    // Get the block order
    const blockOrderNumber = blockCompent.instructions[0].blockOrderNumber;

    const newBlock = {
      homeBankingId: homeBankingId,
      id: blockGroupId,
      blockName: `${blockCompent.blockName}`, // Same name as the current block
      blockOrderNumber: blockOrderNumber, // Assign the new block order number
      botJobId: botJobId, // Preserve the botJobId in the new instructions
      instructions: blockCompent.instructions.map((instruction, index) => ({
        ...instruction,
        blockId: blockGroupId, // Assign new block ID to the instructions
        blockOrderNumber: -1, // Assign new block order number to the instructions
        instructionOrderNumber: index + 1, // Reassign instructionOrderNumber starting from 1 within the new block
      })),
    };

    // Send WebSocket message with block split details
    if (webSocket && connected) {
      const blockComponent = {
        newBlock: {
          homeBankingId: homeBankingId,
          botJobId: botJobId,
          blockId: newBlock.id,
          blockName: newBlock.blockName,
          blockOrderNumber: newBlock.blockOrderNumber,
          instructions: newBlock.instructions.map(instruction => ({
            id: instruction.id,
            blockId: newBlock.id,
            blockOrderNumber: newBlock.blockOrderNumber,
            instructionOrderNumber: instruction.instructionOrderNumber,
          })),
        },
      };

      const message = {
        type: "COMPONENT_INJECT",
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`,  //-${botJobId}`,
        details: blockComponent,
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent create component:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
    setOpenDropdown(null);
  };


  const handleExcelFileBlockName = (blockId: number, blockName: string, blockOrderNumber: number, exportFile?: string) => {



    // Check if botJobId is found, if not handle the error
    if (!botJobId) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Bot Job not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`botJobId not found for blockId: ${blockId}`);
      return;
    }

    // Send WebSocket message for block name update
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_EXCEL_FILE',
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: blockId,
        blockName: blockName, // Send the updated block name
        blockOrderNumber: blockOrderNumber,
        exportFile: exportFile,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent block name update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
  };


  const correctBlockOrderNumbers = (data: any[]) => {
    console.log("Correcting blockOrderNumbers");

    const updatedData = [...data]; // Make a copy of the instructions data

    // Create a map of blockId -> instructions to avoid nested loops
    const blockMap = new Map<number, any[]>();

    updatedData
      .sort((a, b) => a.blockOrderNumber - b.blockOrderNumber) // Sort by blockOrderNumber
      .forEach(instruction => {
        if (!blockMap.has(instruction.blockId)) {
          blockMap.set(instruction.blockId, []);
        }
        blockMap.get(instruction.blockId)?.push(instruction);
      });

    const updatedBlocks: UpdatedBlock[] = []; // To track blocks with changed blockOrderNumber

    // Iterate over the block map
    Array.from(blockMap.keys()).forEach((blockId, index) => {
      const newOrderNumber = index + 1; // Start block order from 1

      blockMap.get(blockId)?.forEach(instruction => {
        if (instruction.blockOrderNumber !== newOrderNumber) {
          updatedBlocks.push({
            botJobId: instruction.botJobId || -1,
            blockId: instruction.blockId,
            blockName: instruction.blockName,
            blockOrderNumber: newOrderNumber,
          });
        }
        instruction.blockOrderNumber = newOrderNumber;
      });
    });

    return { updatedData, updatedBlocks };
  };



  // Function to move a block up by swapping blockOrderNumbers
  const handleMoveBlockUp = (blockId: number) => {
    console.log("handleMoveBlockUp");
    const updatedData = [...componentsData];

    // Find all instructions that belong to the current block
    const currentBlockInstructions = updatedData.filter(instruction => instruction.blockId === blockId);
    if (currentBlockInstructions.length === 0) return;

    const currentBlockOrderNumber = currentBlockInstructions[0].blockOrderNumber;

    // Find the closest block with a smaller blockOrderNumber
    const previousBlockInstructions = updatedData
      .filter(instruction => instruction.blockOrderNumber < currentBlockOrderNumber)
      .sort((a, b) => b.blockOrderNumber - a.blockOrderNumber)[0]; // Get the closest previous block

    if (!previousBlockInstructions) return;

    const botJobId = previousBlockInstructions.botJobId;

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

    setComponentsData([...updatedData]); // Make sure to use a copy
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message with the block swap details
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_MOVE',
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        updatedBlocks: updatedBlocks,
      };

      try {
        webSocket.send(JSON.stringify(message));

        console.log('Sent block move message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
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


  const handleInsertStepBefore = (type: string, destination: string, instructionId: number, instructions: ComponentsInstructionsDTO[]) => {
    // Find the instruction based on the instructionId
    const instruction = instructions.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const isBetween = isBetweenIfAndEndIf(instruction.instructionOrderNumber, instructions);

      const botJobId = instruction.botJobId || -1;

      const message = {
        type: type,
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: instruction.blockId,
        blockName: instruction.blockName,
        isBetween: isBetween,
        homeBankingId: homeBankingId,
        sessionId: destination, // or `botJobTasks-${botJobId}`

        // InstructionDTO fields (flattened)
        instructionId: instruction.id,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
        instructionName: instruction.name,
        operation: instruction.operation,
        actions: instruction.actions,
        parentId: instruction.parentId
      };


      // Send WebSocket message
      if (webSocket && connected) {
        try {
          webSocket.send(JSON.stringify(message));

          console.log('Sent insert before message:', message);
        } catch (error) {
          console.log('Error sending WebSocket message:', error);
        }
      }
    } else {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Instruction not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Instruction with ID ${instructionId} not found.`);
    }
    setOpenDropdown(null);
  };

  const handleNewStepAfter = (instructionId: number) => {
    const message = {
      type: 'INSERT_NEW',
      homeBankingId: homeBankingId,
      sessionId: `componentTasks`, // or `botJobTasks-${botJobId}`
      botJobId: botJobId,
      botJobName: botJobName,
      blockId: blockId,
      blockName: "Default Block",
      blockOrderNumber: 1,

      // InstructionDTO fields (flattened)
      instructionId: instructionId,
      instructionName: "New Instruction",
      instructionOrderNumber: 1,

      isBetween: null,

      operation: null,
      actions: null,
      variableId: null,
      parentId: null,
      parentBlockId: null
    };


    // Send WebSocket message
    if (webSocket && connected) {
      try {
        webSocket.send(JSON.stringify(message));

        console.log('Sent insert after message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
    setOpenDropdown(null);
  };



  const handleEditSpecialOper = (instructionId: number, instructions: ComponentsInstructionsDTO[]) => {
    // Find the instruction based on the instructionId
    const instruction = instructions.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const isBetween = isBetweenIfAndEndIf(instruction.instructionOrderNumber, instructions);

      const botJobId = instruction.botJobId || -1;

      const message = {
        type: 'EDIT_OPERATION',
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, // or `botJobTasks-${botJobId}`
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: instruction.blockId,
        blockName: "Default Block",
        blockOrderNumber: 1,

        // InstructionDTO fields (flattened)
        instructionId: instruction.id,
        instructionName: instruction.name,
        instructionOrderNumber: instruction.instructionOrderNumber,

        isBetween: isBetween,

        operation: instruction.operation,
        actions: instruction.actions,
        variableId: instruction.variableId,
        parentId: instruction.parentId,
        parentBlockId: instruction.parentBlockId
      };


      // Send WebSocket message
      if (webSocket && connected) {
        try {

          webSocket.send(JSON.stringify(message));

          console.log('Edit Operation message:', message);
        } catch (error) {
          console.log('Error sending WebSocket message:', error);
        }
      }
    } else {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Instruction not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Instruction with ID ${instructionId} not found.`);
    }

    setOpenDropdown(null);
  };


  const handleInsertElseIf = (instructionId: number, instructions: ComponentsInstructionsDTO[]) => {
    // Find the instruction based on the instructionId
    const instruction = instructions.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const { isBetween, parentId } = isBetweenCondition(instruction.instructionOrderNumber, instructions);

      const botJobId = instruction.botJobId || -1;

      // If the instruction is found, use its name for the alert message
      // setErrorFlag(true);
      // setAlertMessageBody(`Inserting step before instruction: ${instruction.name}`);

      const typeInsert = instruction.actions === "ELSE" ? "INSERT_BEFORE_ELSEIF" : "INSERT_AFTER_ELSEIF";

      const message = {
        type: typeInsert,
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: instruction.blockId,
        blockName: instruction.blockName,
        isBetween: isBetween,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, // or `botJobTasks-${botJobId}`

        // InstructionDTO fields (flattened)
        instructionId: instruction.id,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
        instructionName: "ELSEIF",
        operation: "ELSEIF",
        actions: "ELSEIF",
        parentId: instruction.parentId
      };

      // Send WebSocket message
      if (webSocket && connected) {
        try {
          webSocket.send(JSON.stringify(message));

          console.log('Sent insert after message:', message);
        } catch (error) {
          console.log('Error sending WebSocket message:', error);
        }
      }
    } else {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Instruction not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Instruction with ID ${instructionId} not found.`);
    }

    setOpenDropdown(null);
  };


  const handleInsertStepAfter = (instructionId: number, instructions: ComponentsInstructionsDTO[]) => {
    // Find the instruction based on the instructionId
    const instruction = instructions.find(instruction => instruction.id === instructionId);

    if (instruction) {

      const isBetween = isBetweenIfAndEndIf(instruction.instructionOrderNumber, instructions);

      const botJobId = instruction.botJobId || -1;

      const message = {
        type: 'INSERT_AFTER',
        sessionId: `componentTasks`, // or `botJobTasks-${botJobId}`
        homeBankingId: homeBankingId,
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: instruction.blockId,
        blockName: instruction.blockName,
        isBetween: isBetween,

        // InstructionDTO fields (flattened)
        instructionId: instruction.id,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
        instructionName: instruction.name,
        operation: instruction.operation,
        actions: instruction.actions,
        parentId: instruction.parentId
      };

      // Send WebSocket message
      if (webSocket && connected) {
        try {
          webSocket.send(JSON.stringify(message));

          console.log('Sent insert after message:', message);
        } catch (error) {
          console.log('Error sending WebSocket message:', error);
        }
      }
    } else {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Instruction not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Instruction with ID ${instructionId} not found.`);
    }

    setOpenDropdown(null);
  };

  const closeAlert = () => {
    setAlertMessageHeader(null);
    setErrorFlag(false);
    setAlertMessageBody([]);
    setAlertMessageFooter(null);
  };

  const isBetweenIfAndEndIf = (currentOrderNumber: number, instructions: ComponentsInstructionsDTO[]) => {
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


  const isBetweenCondition = (
    currentOrderNumber: number,
    instructions: ComponentsInstructionsDTO[]
  ): { isBetween: boolean; parentId: number | null } => {
    let ifFound = false;
    let parentId: number | null = null;

    for (const instr of instructions) {
      if (instr.actions === "IF") {
        ifFound = true;
        parentId = instr.parentId !== undefined ? instr.parentId : null; // Convert undefined to null
      }
      if (instr.instructionOrderNumber === currentOrderNumber && ifFound) {
        return { isBetween: true, parentId }; // Return the result and the parentId
      }
      if (instr.actions === "ENDIF" && ifFound) {
        ifFound = false; // Reset once ENDIF is encountered
        parentId = null; // Reset parentId
      }
    }
    return { isBetween: false, parentId: null }; // Return false if not between IF and ENDIF
  };



  const getInstructionsLoops = (blockId: number,
    instructions: ComponentsInstructionsDTO[]
  ): any[] => {
    // Use getLoopsWithParents to get matching instructions
    const matchingInstructions = getLoopsWithParents(blockId, instructions);

    // Flatten all children into a single list with parent information
    const allLoopBoundaries = matchingInstructions.flatMap(({ parentId, parentName, parentOrderNumber, parentRefreshLoop, parentloopOnly, children }) =>
      children.map((child) => ({
        parentId,
        parentName,
        parentOrderNumber,
        parentRefreshLoop,
        parentloopOnly,
        childId: child.id,
        childAction: child.action,
        childOrderNumber: instructions.find((instr) => instr.id === child.id)?.instructionOrderNumber || -1,
      }))
    );

    // // Initialize the results array
    // const matchingResults: ComponentsInstructionsDTO[] = [];

    // for (const { parentId, childOrderNumber } of allLoopBoundaries) {
    //   // Get the parent's instructionOrderNumber
    //   const parentInstruction = instructions.find((instr) => instr.id === parentId);
    //   if (!parentInstruction) continue;

    //   const parentOrderNumber = parentInstruction.instructionOrderNumber;

    //   // If the current order number is within the range, collect the matching instructions
    //   if (
    //     parentOrderNumber <= currentOrderNumber &&
    //     currentOrderNumber <= childOrderNumber
    //   ) {
    //     // Add the parent instruction
    //     matchingResults.push(parentInstruction);

    //     // Add the child instructions
    //     const childInstruction = instructions.find(
    //       (instr) => instr.instructionOrderNumber === childOrderNumber
    //     );
    //     if (childInstruction) {
    //       matchingResults.push(childInstruction);
    //     }
    //   }
    // }

    return allLoopBoundaries; // Return all matching instructions
  };



  const getLoopsWithParents = (blockId: number,
    instructions: ComponentsInstructionsDTO[]
  ) => {
    // Find all instructions where `refreshLoop` or `loopOnly` is true
    const parentInstructions = instructions.filter(
      (instr) => instr.blockId === blockId && (instr.refreshLoop || instr.loopOnly)
    );

    // Find associated "REFRESH_LOOP" or "LOOP" instructions and map them to their parent
    const loopInstructions = parentInstructions.map((parent) => {
      // Find child instructions with `REFRESH_LOOP` or `LOOP` whose parentId matches the parent's id
      const children = instructions.filter(
        (instr) =>
          (instr.actions === "REFRESH_LOOP" ||
            instr.actions === "LOOP") &&
          instr.parentId === parent.id
      );

      return {
        parentId: parent.id,
        parentName: parent.name,
        parentOrderNumber: parent.instructionOrderNumber,
        parentRefreshLoop: parent.refreshLoop,
        parentloopOnly: parent.loopOnly,
        parentBlockId: parent.blockId,
        children: children.map((child) => ({
          id: child.id,
          name: child.name,
          action: child.actions,
        })),
      };
    });

    return loopInstructions;
  };


  const isBetweenIfAndElseExcluded = (currentOrderNumber: number, instructions: ComponentsInstructionsDTO[]) => {
    let ifFound = false;

    for (const instr of instructions) {
      if (instr.actions === "IF") {
        ifFound = true;
        continue; // Skip further checks for the current "IF" instruction
      }

      if (ifFound && instr.actions === "ELSE") {
        ifFound = false; // Reset when "ELSE" is found
        continue; // Skip further checks for the current "ELSE" instruction
      }

      if (ifFound && instr.instructionOrderNumber === currentOrderNumber) {
        return true; // The instruction is between IF and ELSE, excluding them
      }
    }
    return false;
  };



  const isBetweenIfAndElse = (currentOrderNumber: number, instructions: ComponentsInstructionsDTO[]) => {
    let ifFound = false;

    for (const instr of instructions) {
      if (instr.actions === "IF") {
        ifFound = true;
      }
      if (instr.instructionOrderNumber === currentOrderNumber && ifFound) {
        return true; // The instruction is between IF and ENDIF
      }
      if (instr.actions === "ELSE" && ifFound) {
        ifFound = false; // Reset once ENDIF is encountered
      }
    }
    return false;
  }

  const getInstructionsBetweenIfAndEndIf = (currentOrderNumber: number, instructions: any[]): (number | null)[] => {
    let ifFound = false;
    let firstInstructionId: number | null = null;
    let lastInstructionId: number | null = null;

    for (const instr of instructions) {
      if (instr.actions === "IF") {
        ifFound = true; // Mark the start of the block
      }

      if (ifFound) {
        // Track the first instruction inside the IF block
        if (firstInstructionId === null) {
          firstInstructionId = instr.instructionId;
        }

        lastInstructionId = instr.instructionId; // Keep updating the lastInstructionId

        if (instr.instructionOrderNumber === currentOrderNumber) {
          return [firstInstructionId, lastInstructionId]; // Return once currentOrderNumber is found
        }
      }

      if (instr.actions === "ENDIF" && ifFound) {
        return [firstInstructionId, lastInstructionId]; // Return once ENDIF is encountered
      }
    }

    return [null, null]; // No instructions found between IF and ENDIF
  };



  const handleSplitComponent = (
    instructionId: number,
    groupedData: { [blockId: string]: { blockName: string; instructions: ComponentsInstructionsDTO[] } },
    setGroupedData: (data: { [blockId: string]: { blockName: string; instructions: ComponentsInstructionsDTO[] } }) => void,
    componentsData: ComponentsInstructionsDTO[],
    isLastInstruction: boolean
  ) => {

    // Find the block and instruction related to the instructionId
    const blockToSplit = Object.values(groupedData).find((blockData) =>
      blockData.instructions.some((instruction) => instruction.id === instructionId)
    );

    if (!blockToSplit) return;

    // If splitting at the last instruction, adjust instructionId to the previous instruction
    const adjustedInstructionId = isLastInstruction
      ? blockToSplit.instructions[blockToSplit.instructions.length - 2]?.id
      : instructionId;

    if (!adjustedInstructionId) {
      console.log("Cannot determine the instruction to split at");
      return;
    }

    // Find the selected instruction and its index in the block
    const selectedInstructionIndex = blockToSplit.instructions.findIndex(
      (instruction) => instruction.id === adjustedInstructionId
    );

    if (selectedInstructionIndex === -1) return;

    // Get the block order and blockId
    const blockOrderNumber = blockToSplit.instructions[0].blockOrderNumber;
    const blockId = blockToSplit.instructions[0].blockId;




    // Find all subsequent instructions in the same block
    const subsequentInstructions = blockToSplit.instructions.slice(selectedInstructionIndex + 1);

    if (subsequentInstructions.length === 0) {
      console.log("No instructions to split");
      return;
    }


    // Find the current instruction
    const currentInstruction = componentsData.find((instruction) => instruction.id === instructionId);

    const betweenLoops = getInstructionsLoops(blockId, componentsData);

    if (betweenLoops.length > 0) {

      // Map to track parentName and its corresponding actions
      const parentActionsMap: { [key: string]: { parentId: number, actions: string[] } } = {};

      // Loop through betweenLoops
      betweenLoops.forEach(({ parentOrderNumber, childOrderNumber, parentName, childAction, parentId }) => {
        // Check if currentInstruction's order number is between parent and child order numbers
        if (currentInstruction!.instructionOrderNumber >= parentOrderNumber && currentInstruction!.instructionOrderNumber <= childOrderNumber) {
          // If the parentName is not already in the map, add it with the parentId and childAction
          if (!parentActionsMap[parentName]) {
            parentActionsMap[parentName] = { parentId, actions: [childAction] };
          } else {
            // If it's already there, add the childAction to the list if not already included
            if (!parentActionsMap[parentName].actions.includes(childAction)) {
              parentActionsMap[parentName].actions.push(childAction);
            }
          }
        }
      });

      // Construct the final output array
      const results: ComplexMessage[] = [];

      for (const [parentName, { parentId, actions }] of Object.entries(parentActionsMap)) {
        const actionsString = actions.join(',');

        // Push the formatted data into the results array as a ConnectionInfo object
        results.push({
          parentNameWithId: `(${parentId})${parentName}`,
          connectionLabel: "Connected to:",
          actions: actionsString,
        });
      }

      if (results.length > 0) {
        setAlertImage(forbiddenImage);
        setAlertClass('construction-image');
        setAlertMessageHeader(
          `Error Split Component`
        );
        setErrorFlag(true);
        setAlertMessageBody(
          results
        );
        setAlertMessageFooter(
          `Split Component is not allowed!"`
        );
        return;
      }

    }


    // Create a new block with subsequent instructions, preserving the crescent order
    // Find the maximum blockId from the entire componentsData
    const maxBlockId = Math.max(...componentsData.map(instruction => instruction.blockId));
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
    }, {} as { [blockId: string]: { blockName: string; instructions: ComponentsInstructionsDTO[] } });

    // Add the new block to the updated data
    updatedBlocks[newBlockId] = newBlock;
    updatedBlocks[blockId] = updatedBlock;

    // Call setComponentsData and setIsDataReordered BEFORE updating groupedData
    const updatedInstructions = Object.values(updatedBlocks).flatMap(block => block.instructions);
    setComponentsData([...reassignInstructionOrderNumbersByBlock(updatedInstructions)]);
    setIsDataReordered(false); // Trigger reorder logic

    // Set the updated grouped data (or pass it to your state management)
    setGroupedData(updatedBlocks);

    console.log("Split component created with new block:", newBlock);

    // Send WebSocket message with block split details, including newBlock
    if (webSocket && connected) {
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
          active: true,
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
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        details: blockSplitDetails,
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log('Sent block split message:', message);
    }

    setOpenDropdown(null);
  };


  // Function to move a block down by swapping blockOrderNumbers
  const handleMoveBlockDown = (blockId: number) => {
    const updatedData = [...componentsData];

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

    setComponentsData([...updatedData]); // Update the state
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message with the updated blocks list
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_MOVE',
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        updatedBlocks: updatedBlocks,
      };

      try {
        webSocket.send(
          JSON.stringify(message));

        console.log('Sent block move message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
  };



  // Function to move an instruction down considering blockOrderNumber
  const handleMoveRowDown = (instructionId: number) => {
    const updatedData = [...componentsData];
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
        setComponentsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

        // Send WebSocket message with the row swap details
        if (webSocket && connected) {
          const message = {
            type: 'ROW_MOVE',
            botJobId: currentInstruction.botJobId,
            botJobName: botJobName,
            homeBankingId: homeBankingId,
            sessionId: `componentTasks`, //-${botJobId}`,
            updatedRows: updatedRows,
          };

          try {
            webSocket.send(JSON.stringify(message),
            );

            console.log('Sent row move message:', message);
          } catch (error) {
            console.log('Error sending WebSocket message:', error);
          }
        }
      }
    }
  };


  // Function to move an instruction up considering blockOrderNumber
  const handleMoveRowUp = (instructionId: number) => {
    const updatedData = [...componentsData];
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
        setComponentsData([...reassignInstructionOrderNumbersByBlock(updatedData)]);
        setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

        // Send WebSocket message with the row swap details
        if (webSocket && connected) {
          const message = {
            type: 'ROW_MOVE',
            botJobId: currentInstruction.botJobId,
            botJobName: botJobName,
            homeBankingId: homeBankingId,
            sessionId: `componentTasks`, //-${botJobId}`,
            updatedRows: updatedRows,
          };

          try {
            webSocket.send(JSON.stringify(message),
            );

            console.log('Sent row move message:', message);
          } catch (error) {
            console.log('Error sending WebSocket message:', error);
          }
        }
      }
    }
  };

  const handleRowSelectedClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    instruction: ComponentsInstructionsDTO,
    action: string
  ) => {
    event.stopPropagation();

    // Example filled object
    const clickElement: ElementDTO = {
      id: instruction.id,
      typeElement: instruction.tagName,
      tagName: instruction.tagName,
      xPath: "",
      someText: "",
      attribId: "",
      attribName: "",
      coordinates: "",
      attributeData: [],
      customXPath: "",
      iFrameXPath: "",
      attributeValue: "",
      attributeType: "",
      autoScroll: "",
      autoEnter: ""
    };

    sendWebSocketMessage(clickElement, action);

  };

  const sendWebSocketMessage = (elementDTO: ElementDTO, action: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("?? WebSocket is not connected. Cannot send message.");
      return;
    }
    // const sessionDestine = action === "HOVERED_ROW"
    //   ? `scannerTool-${homeBankingId}`
    //   : `scanner-element-pane-${homeBankingId}`;

    const sessionDestine = action === "HOVERED_ROW"
      ? `scannerTool`
      : `scanner-element-pane`;

    const message = {
      type: action,
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      sessionId: sessionDestine,
      operationId: "TEST_STEP",
      elementDetails: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("?? Sent element DTO:", message);
    } catch (error) {
      console.error("? Error sending WebSocket message:", error);
    }
  };


  const handleRemoveInstruction = (instructionId: number) => {
    // Find the instruction to remove
    const instructionToRemove = componentsData.find(instruction => instruction.id === instructionId);

    if (!instructionToRemove) return;

    const { botJobId, botJobName, blockId, actions, parentId, id } = instructionToRemove;

    // Filter componentsData
    const updatedData = actions === "IF" || actions === "ELSE" || actions === "ENDIF"
      ? componentsData.filter(
        instruction =>
          instruction.parentId !== parentId)
      : componentsData.filter(instruction => instruction.id !== instructionId);

    // Reassign order numbers
    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setComponentsData([...reassignedData]);

    // Update groupedData based on the reassigned componentsData
    const newGroupedData = reassignedData.reduce((acc, instruction) => {
      if (!acc[instruction.blockId]) {
        acc[instruction.blockId] = {
          blockName: instruction.blockName,
          exportFile: instruction.exportFile,
          instructions: [],
        };
      }
      acc[instruction.blockId].instructions.push(instruction);
      return acc;
    }, {} as { [blockId: number]: { blockName: string; exportFile?: string; instructions: ComponentsInstructionsDTO[] } });

    setGroupedData(newGroupedData);

    setIsDataReordered(false); // Allow for potential reordering logic

    // Send WebSocket message if connected
    if (webSocket && connected) {
      const message = {
        type: "DELETE_INSTRUCTION",
        instructionId,
        actions,
        parentId,
        botJobId,
        botJobName,
        blockId,
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log(`Sent delete instruction message for instruction ID: ${instructionId} in block ID: ${blockId}`);
    }

    // Close the dropdown
    setOpenDropdown(null);
  };



  // Function to remove a block by its blockId and reassign order numbers within each block
  const handleRemoveBlock = (blockId: number) => {

    // Find the botJobId and blockOrderNumber associated with the blockId
    const blockInstruction = componentsData.find(instruction => instruction.blockId === blockId);
    const blockDisplayName = blockInstruction?.blockName || `Block ${blockId}`;

    // Show confirmation dialog using AlertModal
    setAlertImage(warningRedImage);
    setAlertClass('construction-image');
    setAlertMessageHeader('Delete Block');
    setAlertMessageBody(`Are you sure you want to delete "${blockDisplayName}"?`);
    setAlertMessageFooter('This action cannot be undone.');
    setErrorFlag(true);
    setAlertOnConfirm(() => () => executeRemoveBlock(blockId));
    return;
  };

  const executeRemoveBlock = (blockId: number) => {
    // Clear the confirmation dialog
    handleClose();

    const blockInstruction = componentsData.find(instruction => instruction.blockId === blockId);
    const botJobId = blockInstruction ? blockInstruction.botJobId : null;
    const removedBlockOrderNumber = blockInstruction ? blockInstruction.blockOrderNumber : null;

    if (!botJobId || removedBlockOrderNumber === null) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Bot Job or Block Order Number`
      );
      setErrorFlag(true);
      setAlertMessageBody(`No botJobId or blockOrderNumber found for Block ID: ${blockId}`);
      return; // Exit if no botJobId or blockOrderNumber is found
    }

    // Remove the block from componentsData
    const updatedData = componentsData.filter(instruction => instruction.blockId !== blockId);

    // Update blockOrderNumber for blocks after the removed block
    const blocksToUpdateSet = new Set<number>();
    updatedData.forEach(instruction => {
      if (instruction.blockOrderNumber > removedBlockOrderNumber) {
        instruction.blockOrderNumber -= 1;
        blocksToUpdateSet.add(instruction.blockId);
      }
    });

    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setComponentsData([...reassignedData]);
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
    if (webSocket && connected) {
      const message = {
        type: 'DELETE_BLOCK',
        blockId: blockId,
        botJobId: botJobId,
        botJobName: botJobName,
        updatedBlocks: blocksToUpdate, // Include the list of updated blocks
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log(`Sent delete block message for Block ID: ${blockId} with updated blocks:`, message);
    }
  };

  const handleRollbackBlock = (blockId: number) => {
    // Get the botJobId and blockName from the first instruction
    const firstInstruction = componentsData.find(instr => instr.blockId === blockId);
    const botJobId = firstInstruction ? firstInstruction.botJobId : null;
    const firstBlockName = firstInstruction ? firstInstruction.blockName : 'Unknown Block'; // Default to 'Unknown Block' if not found

    if (!botJobId) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Bot Job not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`No botJobId found for Block ID: ${blockId}`);
      return; // Exit if no botJobId is found
    }

    // Update all instructions to have blockId  and blockOrderNumber 1
    const updatedData = componentsData.map(instruction => ({
      ...instruction,
      blockId: blockId,
      blockOrderNumber: 1,
    }));

    // Reassign instructionOrderNumbers sequentially starting from 1
    const reassignedData = updatedData.map((instruction, index) => ({
      ...instruction,
      instructionOrderNumber: index + 1,
    }));

    // Update the state
    setComponentsData([...reassignedData]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message to inform about the rollback
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_ROLLBACK',
        botJobId: botJobId,
        blockId: blockId,
        botJobName: botJobName,
        blockName: firstBlockName, // Pass the block name here
        homeBankingId: homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        updatedRows: reassignedData.map(instr => ({
          instructionId: instr.id,
          blockId: instr.blockId,
          blockOrderNumber: instr.blockOrderNumber,
          instructionOrderNumber: instr.instructionOrderNumber,
          parentId: instr.parentId,
          parentBlockId: instr.parentBlockId
        })),
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log('Sent block rollback message:', message);
    }
  };


  const getInstructionTypeElement = (instruction: ComponentsInstructionsDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let isActionBold = false;
    let imageClass : string = styles.operations; // Default class for images
    let hiddenField: boolean = false;

    // Roadmap 3 Phase 3d: prefer the user-set display label when present.
    // `instruction.name` is the canonical key the backend uses for matching/recovery
    // and must never be mutated by the FE.
    const displayName = (instruction.clientNamed && instruction.clientNamed.length > 0)
      ? instruction.clientNamed
      : instruction.name;

    // Determine the image source and text based on instruction type
    if (instruction.actions.startsWith("I:")) {
      const actionParts: string[] = instruction.actions.split(":");
      imageSrc = inputImage;
      text = `(${instruction.id})${displayName}`;
      imageClass = styles.inputImage;

      // Check if the third part is 'hidden'
      if (actionParts.length === 3 && actionParts[2] === "hidden") {
        hiddenField = true;
      }
    } else if (instruction.tagName == "a") {
      imageSrc = linkImage;
      text = `(${instruction.id})${displayName}`;
      imageClass = styles.linkImage;
    } else if (instruction.actions.startsWith("O:")) {
      imageSrc = outPutImage;
      text = `(${instruction.id})${displayName}`;
      imageClass = styles.outputImage;
    } else {
      switch (instruction.actions) {
        case "SET":
          imageSrc = setValueImage;
          text = displayName;
          break;
        case "GET":
          imageSrc = getValueImage;
          text = displayName;
          break;
        case "CK":
          imageSrc = checkImage;
          text = displayName;
          break;
        case "CSV CHECK":
          imageSrc = excelGotoImage;
          text = displayName;
          // imageClass = styles.excelgotoImage;
          break;
        case "PDF CHECK":
          imageSrc = excelGotoImage;
          text = displayName;
          // imageClass = styles.excelgotoImage;
          break;
        case "E":
          imageSrc = excelImage;
          text = displayName;
          break;
        case "P":
          imageSrc = screenImage;
          text = displayName;
          imageClass = styles.screenImage;
          break;
        case "Q":
          imageSrc = closeBrowserImage;
          text = displayName;
          imageClass = styles.closeImage;
          break;
        case "C":
          imageSrc = clickImage;
          text = `(${instruction.id})${displayName}`;
          imageClass = styles.clickImage;
          break;
        case "H":
          imageSrc = waitImage;
          text = displayName;
          imageClass = styles.waitImage;
          break;
        case "IF":
          imageSrc = ifElseImage;
          text = displayName;
          imageClass = styles.ifelseImage;
          break;
        case "REFRESH":
          imageSrc = refreshOnlyImage;
          text = displayName;
          imageClass = styles.refreshImage;
          break;
        case "LOOP":
          imageSrc = refreshOnlyImage;
          text = displayName;
          imageClass = styles.refreshImage;
          break;
        case "REFRESH_LOOP":
          imageSrc = refreshLoopImage;
          text = displayName;
          imageClass = styles.refreshImage;
          break;
        case "GOTO":
          imageSrc = gotoImage;
          text = displayName;
          imageClass = styles.gotoImage;
          break;
        case "EXCEL GOTO":
          imageSrc = excelGotoImage;
          text = displayName;
          // imageClass = styles.excelgotoImage;
          break;
        case "NEXT ROW":
          imageSrc = nextRowImage;
          text = "Excel Data Next Row"; //instruction.name;
          // imageClass = styles.excelgotoImage;
          break;
        case "ELSEIF":
          imageSrc = ifElseImage;
          text = displayName;
          imageClass = styles.ifelseImage;
          break;
        case "ELSE":
          imageSrc = elseImage;
          text = displayName;
          imageClass = styles.elseImage;
          break;
        case "ENDIF":
          imageSrc = endIfImage;
          text = displayName;
          imageClass = styles.endifImage;
          break;
        case "PAUSE":
          imageSrc = pauseImage;
          text = displayName;
          imageClass = styles.pauseImage;
          break;
        default:
          imageSrc = null; // No image for other types
          text = `(${instruction.id})${displayName}` || null;
          isActionBold = true; // Set bold for actions
      }
    }

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return (
      <div className={styles.instructionType}>
        {imageSrc && (
          <>
            <img src={imageSrc} alt="" className={imageClass} />
            {hiddenField && (
              <img src={hiddenImage} alt="hidden" className={styles.hiddenImage} />
            )}
            <span>{text ? renderHighlighted(text, findText) : null}</span>
          </>
        )}
        {!imageSrc && (
          <span style={{ fontWeight: isActionBold ? 'bold' : 'normal' }}>
            {text ? renderHighlighted(text, findText) : null}
          </span>
        )}
      </div>
    );

  };



  const editableSpecialOperations = (actionType: string) => {
    if (["SET", "GET", "CK", "Q", "E", "P", "H", "GOTO", "PAUSE", "REFRESH", "LOOP", "REFRESH_LOOP", "EXCEL GOTO", "NEXT ROW", "CSV CHECK", "PDF CHECK"].includes(actionType)) {
      return true;
    } else {
      return false;
    }
  }


  const allSpecialOperations = (actionType: string) => {
    if (["SET", "GET", "CK", "Q", "E", "P", "H", "GOTO", "IF", "ELSEIF", "ELSE", "ENDIF", "PAUSE", "REFRESH", "LOOP", "REFRESH_LOOP", "EXCEL GOTO", "NEXT ROW", "CSV CHECK", "PDF CHECK"].includes(actionType)) {
      return true;
    } else {
      return false;
    }
  }


  const renderEditButton = (actionType: string, editImage: string, instruction: ComponentsInstructionsDTO) => {
    if (allSpecialOperations(actionType)) {
      return <span className="edit-button-space">&nbsp;</span>; // Render a space or an empty element
    }

    return (
      <img
        src={editImage}
        alt="edit"
        className={styles.editButton}
        onClick={() => handleEditInstruction(instruction)}  // Trigger edit mode
      />
    );
  };


  const updateInstructionActions = (instructionId: number, flag: ActionFlag) => {
    const instruction = componentsData.find(x => x.id === instructionId);
    if (!instruction) return;

    const newActions = toggleActionFlag(instruction.actions, flag, instruction.name);

    // ✅ side-effect OUTSIDE setState
    if (webSocket && connected) {
      const message = {
        type: "ACTIONS_UPDATE",
        botJobId: instruction.botJobId,
        blockId: instruction.blockId,
        botJobName,
        instructionId,
        parentId: instruction.parentId,
        actions: newActions,
        homeBankingId,
        sessionId: "componentTasks", // or `botJobTasks-${botJobId}`
      };
      webSocket.send(JSON.stringify(message));
    }

    // ✅ pure state update
    setComponentsData(prev =>
      prev.map(x => (x.id === instructionId ? { ...x, actions: newActions } : x))
    );
  };

  // ── force_coordinates flag toggles (F / E / T / N / S) ─────────────────────
  // UI lives in CompForce. This handler persists the change: WebSocket push to
  // the backend (FORCE_COORDINATES_UPDATE on componentTasks session) + local
  // state update so the badge flips immediately.
  const handleInstructionForceChange = (instructionId: number, nextForceCoordinates: string) => {
    const instruction = componentsData.find(x => x.id === instructionId);
    if (!instruction) return;

    if (webSocket && connected) {
      const message = {
        type: "FORCE_COORDINATES_UPDATE",
        botJobId: instruction.botJobId,
        blockId: instruction.blockId,
        botJobName,
        instructionId,
        parentId: instruction.parentId,
        forceCoordinates: nextForceCoordinates,
        homeBankingId,
        sessionId: "componentTasks",
      };
      webSocket.send(JSON.stringify(message));
    }

    setComponentsData(prev =>
      prev.map(x => (x.id === instructionId ? { ...x, forceCoordinates: nextForceCoordinates } : x))
    );
  };

  const renderDeviceOptionsRow = (instruction: ComponentsInstructionsDTO) => {
    if (allSpecialOperations(instruction.actions)) {
      return <span className="edit-button-space">&nbsp;</span>;
    }
    return <CompForce item={instruction} onChange={handleInstructionForceChange} />;
  };


  // Function to render the move buttons based on the action type
  const renderMoveButtons = (actionType: string, instructionId: number) => {
    if (["IF", "ELSEIF", "ELSE", "ENDIF"].includes(actionType)) {
      return null; // Don't render buttons for these action types
    }

    return (
      <>
        <img
          src={upImage}
          alt="Move Up"
          className={styles.moveButton}
          onClick={() => handleMoveRowUp(instructionId)}
        />
        <img
          src={downImage}
          alt="Move Down"
          className={styles.moveButton}
          onClick={() => handleMoveRowDown(instructionId)}
        />
      </>
    );
  };

  // Function to render the move buttons based on the action type
  const renderTestClick = (actionType: string, instruction: ComponentsInstructionsDTO) => {
    if (allSpecialOperations(actionType)) {
      return null; // Don't render buttons for these action types
    }

    return (
      <>
        <img src={clickTestImage}
          alt=""
          className={styles.testButton}
          onClick={(event) => handleRowSelectedClick(event, instruction, "TEST_CLICK_DTO")} />
      </>
    );
  };


  const handleEditInstruction = (instruction: ComponentsInstructionsDTO) => {
    setEditingInstructionId(instruction.id);
    // Roadmap 3 Phase 3d: edit field rebinds to clientNamed (display-only override).
    setInstructionName(
      (instruction.clientNamed && instruction.clientNamed.length > 0)
        ? instruction.clientNamed
        : instruction.name
    );
  };

  const handleSaveInstruction = (instructionId: number) => {
    // Find the instruction to get blockId and botJobId
    const instructionToUpdate = componentsData.find(instruction => instruction.id === instructionId);

    if (!instructionToUpdate) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Instruction not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Instruction with ID ${instructionId} not found`);
      return;
    }

    const { blockId, blockName, blockOrderNumber, botJobId, instructionOrderNumber } = instructionToUpdate;

    // Roadmap 3 Phase 3d: write the user's edit to clientNamed only; never mutate `name`
    // or the I:<name> action token (the backend keys recovery on the canonical name).
    const updatedInstructions = componentsData.map((instruction) => {
      if (instruction.id === instructionId) {
        const typed = (instructionName ?? "").trim();
        const nextClientNamed = (typed.length === 0 || typed === instruction.name) ? null : typed;
        return { ...instruction, clientNamed: nextClientNamed };
      }
      return instruction;
    });

    setComponentsData(updatedInstructions);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again
    setEditingInstructionId(null); // Exit edit mode

    const updatedInstruction = updatedInstructions.find(instruction => instruction.id === instructionId);

    // Send WebSocket message with the updated instruction
    if (webSocket && connected && updatedInstruction) {
      const message = {
        type: 'ROW_UPDATE',
        botJobId,
        blockId,
        blockName,
        homeBankingId,
        sessionId: `componentTasks`, //-${botJobId}`,
        instructionId,
        instructionOrderNumber,
        blockOrderNumber,
        // Roadmap 3 Phase 3d: instructionName always carries the canonical (immutable) name;
        // clientNamed carries the display-only override (null = clear).
        instructionName: instructionToUpdate.name,
        clientNamed: updatedInstruction.clientNamed ?? null,
        actions: updatedInstruction.actions,
      };

      try {
        webSocket.send(
          JSON.stringify(message));

        console.log('Sent instruction update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
  };

  const getBlockDetails = (blockId: number): [number | null, string] => {
    const blockData = groupedData[blockId];
    if (blockData) {
      return [blockData.instructions[0]?.blockOrderNumber ?? null, blockData.blockName];
    }
    return [null, "Unknown"]; // Fallback values if blockId is not found
  };


  const renderOperations = (
    instruction: ComponentsInstructionsDTO,
    allInstructions: ComponentsInstructionsDTO[]
  ) => {
    const validActions = ["SET", "GET"];

    // Handle CK / CSV CHECK / PDF CHECK actions with special formatting
    if (
      (instruction.actions === "CK" ||
        instruction.actions === "CSV CHECK" ||
        instruction.actions === "PDF CHECK") &&
      instruction.operation
    ) {
      const [left, middle, right] = instruction.operation
        .split(":")
        .map((part) => part.trim());

      if (middle === "=" || middle === ">" || middle === "<" || middle === "!=" || middle === "contains") {

        const rightLabel =
          instruction.actions === "CSV CHECK"
            ? "CSV VALUES"
            : instruction.actions === "PDF CHECK"
              ? "PDF VALUES"
              : right;

        const rightDisplay = middle === "contains" ? `( ${rightLabel} )` : rightLabel;

        return (
          <span className={styles.instructionDetails}>
            <span style={{ color: "#FFA500" }}>
              ({instruction.variableId}){left}
            </span>
            {" "}
            <span style={{ color: "#0b5394" }}>{middle}</span>
            {" "}
            <span style={{ color: "#FFA500" }}>{rightDisplay}</span>
          </span>
        );
      }
    }

    // Special case for "GOTO" action - render only the operation without parentId or colon
    if (instruction.actions === "GOTO" && instruction.operation) {

      // Guard against null parentId
      const parentBlockId = instruction.parentBlockId;
      const [blockOrderNumber, blockName] = parentBlockId
        ? getBlockDetails(parentBlockId)
        : ["N/A", "Unknown"]; // Fallback values if parentId is null

      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#0b5394" }}>Block:</span>{" "}
          <span style={{ color: "#b163ff" }}>#{blockOrderNumber} {blockName}</span>{" "}
          <span style={{ color: "blue" }}>Limit:</span>{" "}
          <span style={{ color: "#b163ff" }}>{instruction.operation}</span>
        </span>
      );

    }



    // Handle "REFRESH_LOOP" operation with simplified details
    if (instruction.actions === "REFRESH_LOOP" && instruction.operation) {
      const parts = instruction.operation.split(":").map((part) => part.trim());
      const [refreshValue, loopValue] = parts;

      // Retrieve parentValue from allInstructions
      const parentInstruction = allInstructions.find((item) => item.id === instruction.parentId);

      // Validate parentInstruction
      if (
        parentInstruction &&
        (parentInstruction.blockId !== instruction.blockId ||
          parentInstruction.instructionOrderNumber >= instruction.instructionOrderNumber)
      ) {
        console.log(
          `Invalid parent instruction for REFRESH_LOOP. Parent ID: ${instruction.parentId}, ` +
          `Block ID: ${parentInstruction?.blockId}, Instruction Order Number: ${parentInstruction?.instructionOrderNumber}`
        );
        return null;
      }

      const parentValue = parentInstruction?.name || "Unknown";

      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#0b5394" }}>Refresh</span>{" "}
          <span style={{ color: "#FFA500" }}>{refreshValue}s</span> {" "}
          <span style={{ color: "#0b5394" }}>Loop</span>{" "}
          <span style={{ color: "#FFA500" }}>{loopValue} times</span> {" "}
          <span style={{ color: "#0b5394" }}>Jump To Parent</span>{" "}
          <span style={{ color: "#b163ff" }}>({instruction.parentId}){parentValue}</span>
        </span>
      );
    }

    // Handle "LOOP" operation with simplified details
    if (instruction.actions === "LOOP" && instruction.operation) {
      const parts = instruction.operation.split(":").map((part) => part.trim());
      const [refreshValue, loopValue] = parts;

      // Retrieve parentValue from allInstructions
      const parentInstruction = allInstructions.find((item) => item.id === instruction.parentId);

      // Validate parentInstruction
      if (
        parentInstruction &&
        (parentInstruction.blockId !== instruction.blockId ||
          parentInstruction.instructionOrderNumber >= instruction.instructionOrderNumber)
      ) {
        console.log(
          `Invalid parent instruction for LOOP. Parent ID: ${instruction.parentId}, ` +
          `Block ID: ${parentInstruction?.blockId}, Instruction Order Number: ${parentInstruction?.instructionOrderNumber}`
        );
        return null;
      }

      const parentValue = parentInstruction?.name || "Unknown";

      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#0b5394" }}>Time</span>{" "}
          <span style={{ color: "#FFA500" }}>{refreshValue}s</span> {" "}
          <span style={{ color: "#0b5394" }}>Loop</span>{" "}
          <span style={{ color: "#FFA500" }}>{loopValue} times</span> {" "}
          <span style={{ color: "#0b5394" }}>Jump To Parent</span>{" "}
          <span style={{ color: "#b163ff" }}>({instruction.parentId}){parentValue}</span>
        </span>
      );
    }

    // Handle operation for other actions (SET, GET)
    if (validActions.includes(instruction.actions) && instruction.operation) {
      const [left, right] = instruction.operation.split(":");

      // Retrieve parentValue from allInstructions
      const parentInstruction = allInstructions.find((item) => item.id === instruction.parentId);

      // Validate parentInstruction
      if (
        parentInstruction &&
        (parentInstruction.blockId !== instruction.blockId ||
          parentInstruction.instructionOrderNumber >= instruction.instructionOrderNumber)
      ) {
        console.log(
          `Invalid parent instruction for LOOP. Parent ID: ${instruction.parentId}, ` +
          `Block ID: ${parentInstruction?.blockId}, Instruction Order Number: ${parentInstruction?.instructionOrderNumber}`
        );
        return null;
      }

      const parentValue = parentInstruction?.name || "Unknown";

      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#0b5394" }}>({instruction.parentId}){parentValue}</span>:
          <span style={{ color: "#FFA500" }}>{right}</span>
        </span>
      );
    }

    // Handle operation for other actions (E - Excel Write)
    if (instruction.actions === "E" && instruction.operation) {
      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#FFA500" }}>({instruction.variableId}){instruction.operation}</span>
        </span>
      );
    }

    // Render the action if it is valid but has no operation
    if (validActions.includes(instruction.actions)) {
      return <span className={styles.instructionDetails}>{instruction.actions}</span>;
    }

    // Return a blank span with a non-breaking space to maintain alignment
    return <span className={styles.instructionDetails}>&nbsp;</span>;
  };

  // Same rule everywhere: match the label the grid displays (clientNamed wins
  // over the canonical backend name), but keep matching `name` too so searching
  // by the backend key still works.
  const instructionMatchesFind = (ins: ComponentsInstructionsDTO, q: string): boolean => {
    const shownLabel = (ins.clientNamed && ins.clientNamed.length > 0)
      ? ins.clientNamed
      : ins.name;
    return (shownLabel ?? "").toLowerCase().includes(q)
      || (ins.name ?? "").toLowerCase().includes(q);
  };

  const renderHighlighted = (text: string, query: string) => {
    const q = query.trim();
    if (!q) return text;

    const lowerText = text.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lowerText.indexOf(lowerQ);

    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);

    return (
      <>
        {before}
        <mark className={styles.findHighlight}>{match}</mark>
        {after}
      </>
    );
  };

  const renderExportFile = (input: string) => {
    const lastChar = input.slice(-1);
    const path = input.slice(0, -2); // remove ":," or ":|" from the end

    // If path is "No Excel Export File", render only the path
    if (path.includes("No Excel Export")) {
      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#FFA500" }}>No Excel Export File</span>
        </span>
      );
    }

    let delimiterName = '';
    switch (lastChar) {
      case ',':
        delimiterName = 'Comma';
        break;
      case '|':
        delimiterName = 'Pipe';
        break;
      default:
        delimiterName = 'Comma';
    }

    return (
      <span className={styles.instructionDetails}>
        <span style={{ color: "#FFA500" }}>{path}</span>{'  '}
        <span style={{ color: "#FFA500" }}>({delimiterName})</span>
      </span>
    );
  };

  const applyCommandFromPanel = (instruction: ComponentsInstructionsDTO, draft: CommandDraft) => {
    if (!webSocket || !connected) return;
    const payload = {
      ...draft,
      requestId: `${Date.now()}-${instruction.id}`,
      targetSessionId: 'componentTasks',
      homeBankingId,
      botJobId,
      botJobName,
      blockId: instruction.blockId,
      blockName: instruction.blockName,
      blockOrderNumber: instruction.blockOrderNumber,
      instructionId: instruction.id,
      instructionName: instruction.name,
      instructionOrderNumber: instruction.instructionOrderNumber,
      variableId: draft.variableId ?? instruction.variableId,
      parentId: draft.parentId ?? instruction.parentId,
      parentBlockId: draft.parentBlockId ?? instruction.parentBlockId,
    };
    webSocket.send(JSON.stringify({
      type: 'commandEditor.apply',
      sessionId,
      homeBankingId,
      body: JSON.stringify(payload),
    }));
    setOpenDropdown(null);
  };

  return (
    <div className={styles.gridContainer}>
      {alertMessageBody && alertMessageBody.length > 0 && (
        <AlertModal
          header={alertMessageHeader || ''}
          body={alertMessageBody || ''}
          extraMsg={alertMessageFooter || ''}
          onClose={handleClose}
          onConfirm={alertOnConfirm}
          imageSrc={alertImage}
          imageClass={alertClass}
          error={errorFlag}
        />
      )}

      <div className={styles.gridFindRow}>
        <span className={styles.gridFindLabel}>Find:</span>
        <input
          className={styles.gridFindInput}
          type="text"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Type to find…"
        />
      </div>
      <div className={styles.gridScroll}>
        <div className={styles.gridContent}>
          <DragDropContext onDragEnd={onDragEnd} // Define the onDragEnd handler to update the state when the dragging stops
          >
            {
              Object.keys(groupedData).length === 0 ? (
                // Render default block if groupedData is empty
                <div className={styles.block}>
                  <div className={`${styles.blockHeader} ${styles.colorComponent2}`}>
                    <span className={styles.blockName}>{botJobName}</span>
                    <span className={styles.blockOrderNumber}>(AR Web) No components were created yet</span>
                  </div>
                  <div className={styles.instructionsList}>
                    {/* Add an empty line */}
                    <div className={styles.instructionItem}> </div>
                    <div className={styles.block}>
                      <div className={styles.noDataMessage}>No data found</div>
                    </div>
                  </div>
                </div>

              ) : (
                Object.entries(groupedData)
                  .filter(([, blockData]) => {
                    const q = findText.trim().toLowerCase();
                    if (!q) return true;

                    const blockMatch = (blockData.blockName ?? "").toLowerCase().includes(q);

                    const instructionMatch = (blockData.instructions ?? []).some(
                      (ins) => instructionMatchesFind(ins, q)
                    );

                    return blockMatch || instructionMatch;
                  })
                  .sort(
                    ([, aBlockData], [, bBlockData]) =>
                      aBlockData.instructions[0].blockOrderNumber -
                      bBlockData.instructions[0].blockOrderNumber
                  )
                  .map(([blockGroupIndex, blockData], index) => (
                    <div key={blockGroupIndex} className={styles.block}>
                      {/* Block header with garbage, up, and down buttons */}
                      <div className={`${styles.blockHeader} ${componentsData && componentsData.length > 0 ? styles.colorComponent1 : styles.colorComponent2}`}>
                        {blockData.instructions[0].blockActive ? (
                          <img src={activeImage}
                            alt="Active"
                            className={styles.activeButton}
                            onClick={() =>
                              handleBlockStatus(blockData.instructions[0].blockId)
                            } />
                        ) : (
                          <img src={inactiveImage}
                            alt="Inactive"
                            className={styles.inactiveButton}
                            onClick={() =>
                              handleBlockStatus(blockData.instructions[0].blockId)
                            } />
                        )}

                        <img src={ArrowLeft}
                          alt="ArrowLeft"
                          className={styles.arrowLeftButton}
                          onClick={() =>
                            handleComponentInjection(Number(blockData.instructions[0].blockId))}
                        />

                        <span className={styles.blockOrderNumber}>
                          #{blockData.instructions[0].blockOrderNumber}
                        </span>
                        {editingBlockId === Number(blockGroupIndex) ? (
                          <div className={styles.editContainer}>
                            <input
                              type="text"
                              value={blockName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveBlockName(Number(blockData.instructions[0].blockId)); // Trigger save when "Enter" is pressed
                                }
                              }}
                              onChange={(e) => {
                                console.log(e.target.value);
                                setBlockName(e.target.value);
                              }}
                              ref={blockRef} // Associate the ref with the input element
                              className={styles.editTextbox}
                            />
                            {/* <span className={styles.blockOrderNumber}>
                          (Id:   {blockData.instructions[0].blockId})
                        </span> */}
                            <img
                              src={saveImage}
                              alt="save"
                              className={styles.saveButton}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveBlockName(Number(blockData.instructions[0].blockId));
                                }
                              }}
                              onClick={() => handleSaveBlockName(Number(blockData.instructions[0].blockId))}
                            />
                          </div>
                        ) : (
                          <span className={styles.blockName}>
                            {renderHighlighted(blockData.blockName ?? "", findText)}
                          </span>
                          //<span className={styles.blockName}>{blockData.blockName} (Id:   {blockData.instructions[0].blockId})</span>
                        )}

                        <span className={styles.blockCount}>
                          ({blockData.instructions.length})
                          {/* {mockData ? "-Moock Data" : ""} */}
                        </span>
                        {/* Show the export file or "No Export File" */}
                        <span className={styles.blockExportFile}>
                          {renderExportFile(String(blockData.exportFile))}
                        </span>
                        <div className={styles.moveButtons}>
                          {index === 0 && (
                            <img
                              src={rollBackImage}
                              alt=""
                              className={styles.rollbackButton}
                              onClick={() => handleRollbackBlock(Number(blockData.instructions[0].blockId))}
                            />
                          )}
                          {excelGotoInstruction &&
                            blockData.instructions[0].blockOrderNumber === excelGotoInstruction.blockOrderNumber && (
                              <div className={styles.excelGotoContainer}>
                                <img
                                  src={excelGotoImage}
                                  alt=""
                                  className={styles.excelgotoImage}
                                  title="This block contains the Excel GOTO instruction"
                                />
                                <span className={styles.excelgotoText}>Row to Return</span>
                                <img
                                  src={edit2Image}
                                  alt=""
                                  className={styles.editButton}
                                  onClick={() => handleEditSpecialOper(Number(excelGotoInstruction.id), componentsData)}
                                />
                                <img
                                  src={crossImage}
                                  alt=""
                                  className={styles.crossButton}
                                  onClick={() => handleRemoveInstruction(Number(excelGotoInstruction.id))}
                                />
                              </div>
                            )}
                          <img
                            src={upImage}
                            alt=""
                            className={styles.moveButton}
                            onClick={() => handleMoveBlockUp(Number(blockData.instructions[0].blockId))}
                          />
                          <img
                            src={downImage}
                            alt=""
                            className={styles.moveButton}
                            onClick={() => handleMoveBlockDown(Number(blockData.instructions[0].blockId))}
                          />
                          {/* Edit Block Name Button */}
                          <img
                            src={editImage}
                            alt="edit"
                            className={styles.editButton}
                            onClick={() => handleEditBlock(Number(blockData.instructions[0].blockId), blockData.blockName)} // Edit block logic
                          />
                          {/* Edit Block Name Button */}
                          <img
                            src={excelImage}
                            alt="excel"
                            className={styles.excelButton}
                            onClick={() => handleExcelFileBlockName(Number(blockData.instructions[0].blockId), blockData.blockName, Number(blockData.instructions[0].blockOrderNumber), blockData.exportFile)} // Edit block logic
                          />
                          <img
                            src={crossImage}
                            alt=""
                            className={styles.crossButton}
                            onClick={() => handleRemoveBlock(Number(blockData.instructions[0].blockId))}
                          />


                        </div>
                      </div>
                      <Droppable droppableId={blockGroupIndex} key={blockData.instructions[0].blockId}>
                        {(provided) => (
                          <div
                            className={styles.instructionsList}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {blockData.instructions.map((instruction, index) => {
                              if (instruction.actions === "EXCEL GOTO") return null;

                              // Row-level find: inside a kept block, hide rows that don't
                              // match — unless the block itself matched by name (then the
                              // whole block stays visible).
                              const findQuery = findText.trim().toLowerCase();
                              if (
                                findQuery &&
                                !(blockData.blockName ?? "").toLowerCase().includes(findQuery) &&
                                !instructionMatchesFind(instruction, findQuery)
                              ) {
                                return null;
                              }

                              const isLastInstruction =
                                index === blockData.instructions.length - 1;
                              const isJustOne = blockData.instructions.length === 1;
                              const isLastBlock =
                                Number(blockGroupIndex) === Object.keys(groupedData).length; // Check if this is the last block

                              return (
                                <Draggable
                                  key={instruction.id}
                                  draggableId={instruction.id.toString()}
                                  index={index}
                                  isDragDisabled={findText.trim().length > 0}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`${styles.instructionItem} ${openDropdown === instruction.id ? styles.dropdownOpen : ''
                                        } ${instruction.actions === 'IF' || instruction.actions === 'ELSEIF' || instruction.actions === 'ELSE' || instruction.actions === 'ENDIF'
                                          ? styles.lightYellowBackground
                                          : ''
                                        }`}
                                    // data-executing={instruction.id === executionId}
                                    >
                                      {editingInstructionId === instruction.id ? (
                                        <div className={styles.editContainer}>
                                          <input
                                            type="text"
                                            value={instructionName}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleSaveInstruction(instruction.id); // Trigger save when "Enter" is pressed
                                              }
                                            }}
                                            onChange={(e) => {
                                              console.log(e.target.value);
                                              setInstructionName(e.target.value);
                                            }}
                                            ref={instructionRef} // Associate the ref with the input element
                                            className={styles.editTextbox}
                                          />
                                          <img
                                            src={saveImage}
                                            alt="save"
                                            className={styles.saveButton}
                                            onClick={() =>
                                              handleSaveInstruction(instruction.id)
                                            } // Save instruction logic
                                          />
                                        </div>
                                      ) : (
                                        <span className={styles.instructionLine}>
                                          {/* <span>({instruction.id})</span> */}
                                          {instruction.instructionActive ? (
                                            <img src={activeImage}
                                              alt="Active"
                                              className={styles.activeButton}
                                              onClick={() =>
                                                handleInstructionStatus(instruction.id, blockData.instructions)
                                              } />
                                          ) : (
                                            <img src={inactiveImage}
                                              alt="Inactive"
                                              className={styles.inactiveButton}
                                              onClick={() =>
                                                handleInstructionStatus(instruction.id, blockData.instructions)
                                              } />
                                          )}
                                          {getInstructionTypeElement(instruction)}
                                          {instruction.refreshLoop && (
                                            <img
                                              src={refreshLoopImage}
                                              alt="refresh"
                                              className={styles.refreshImage}
                                            />
                                          )}
                                          {instruction.loopOnly && (
                                            <img
                                              src={refreshOnlyImage}
                                              alt="refresh"
                                              className={styles.refreshImage}
                                            />
                                          )}

                                        </span>


                                      )}
                                      {renderOperations(instruction, componentsData)}
                                      <div className={styles.optionsColumn}>
                                        {renderDeviceOptionsRow(
                                          instruction
                                        )}
                                        <div className={styles.moveButtons}>
                                          {renderEditButton(
                                            instruction.actions,
                                            editImage,
                                            instruction
                                          )}
                                          {renderMoveButtons(instruction.actions, instruction.id)}
                                          {renderTestClick(instruction.actions, instruction)}
                                          <img
                                            src={crossImage}
                                            alt=""
                                            className={styles.crossButton}
                                            onClick={() =>
                                              handleRemoveInstruction(instruction.id)
                                            }
                                          />
                                        </div>
                                      </div>
                                      {/* New column for dropdown menu */}
                                      <div className={styles.dropdownColumn}>
                                        <img
                                          src={menuDownImage}
                                          className={styles.dropdownArrow}
                                          alt=""
                                          onClick={() =>
                                            handleToggleDropdown(instruction.id)
                                          }
                                        />

                                        {openDropdown === instruction.id && (
                                          <InstructionCommandPanel
                                            instruction={instruction}
                                            allowSplit={false}
                                            allowElseIf={["IF", "ELSEIF"].includes(instruction.actions) || isBetweenIfAndElseExcluded(instruction.instructionOrderNumber, blockData.instructions)}
                                            onClose={() => setOpenDropdown(null)}
                                            onInsertElseIf={() => {
                                              webSocket?.send(JSON.stringify({
                                                type: 'commandEditor.insertElseIf',
                                                sessionId,
                                                homeBankingId,
                                                body: JSON.stringify({
                                                  requestId: `${Date.now()}-elseif-${instruction.id}`,
                                                  targetSessionId: 'componentTasks',
                                                  homeBankingId,
                                                  botJobId,
                                                  botJobName,
                                                  blockId: instruction.blockId,
                                                  blockName: instruction.blockName,
                                                  blockOrderNumber: instruction.blockOrderNumber,
                                                  instructionId: instruction.id,
                                                }),
                                              }));
                                              setOpenDropdown(null);
                                            }}
                                            onApplyCommand={(draft) => applyCommandFromPanel(instruction, draft)}
                                            messages={messages}
                                            context={{ sessionId, targetSessionId: 'componentTasks', homeBankingId, botJobId, botJobName }}
                                            onSocketCommand={(type, body) => webSocket?.send(JSON.stringify({ type, sessionId, homeBankingId, body: JSON.stringify(body) }))}
                                          />
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
                    </div >
                  ))
              )}
          </DragDropContext >
        </div >
      </div >
    </div >
  );

};

export default GridItemComp;
