import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { BlockLoopInstructionLoadDTO, BotJobData, ComplexMessage, ElementDTO, UpdatedBlock } from './instructionsMockData';

import editImage from '../assets/edit.png';
import edit2Image from '../assets/edit2.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import binImage from '../assets/bin.png';
import excelGotoImage from "../assets/excel_goto2.png";
import clickTestImage from "../assets/clickTest2.png";
import constructionImage from '../assets/construction.png';
import forbiddenImage from '../assets/forbidden.png';
import warningRedImage from '../assets/warning_red.png';
import brickImage from '../assets/brick.png';
import ArrowLeft from '../assets/ArrowLeft.png';


import AlertModal from './AlertModal';
import CompForce from './CompForce';
import CreateNewBlock, { CreateBlockPosition } from './CreateNewBlock';
import ExcelExportPanel from './ExcelExportPanel';
import SaveComponentPanel, { SaveComponentContext } from './SaveComponentPanel';
import BotJobDetailsChrome from './bot-job-details/BotJobDetailsChrome';
import { useBotJobDetailsController } from './bot-job-details/useBotJobDetailsController';
import { useWebSocket } from './useWebSocket';
import { useInstructionDrag } from './useInstructionDrag';
import FindBar from './bot-job-details/grid/FindBar';
import DeleteButton from './bot-job-details/grid/DeleteButton';
import InstructionRow from './bot-job-details/grid/InstructionRow';
import InstructionList from './bot-job-details/grid/InstructionList';
import BlockHeader from './bot-job-details/grid/BlockHeader';
import BlockCard from './bot-job-details/grid/BlockCard';
import { useInstructionFind, instructionMatchesFind } from './bot-job-details/grid/hooks/useInstructionFind';
import { useBlockCollapse } from './bot-job-details/grid/hooks/useBlockCollapse';
import { useGridAlerts } from './bot-job-details/grid/hooks/useGridAlerts';
import { useExecutionState } from './bot-job-details/grid/hooks/useExecutionState';
import { useInstructionMemory } from './bot-job-details/grid/hooks/useInstructionMemory';
import { useExcelExport } from './bot-job-details/grid/hooks/useExcelExport';
import { useBlockReorder } from './bot-job-details/grid/hooks/useBlockReorder';
import {
  blockOptionsFromInstructions,
  normalizeBlockOptions,
  instructionMemoryItem,
} from './bot-job-details/grid/domain/memoryOptions';
import { instructionDisplayLabel } from './instructionDisplay';
import { buildLaterBlockOrderUpdates } from './instructionSplit';
import type { MemoryListSnapshot } from './memoryList.contract';
import {
  SCANNER_ELEMENT_PANE_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from './scanner/Scanner.sessions';
import styles from './Griditem.module.scss';


interface GridItemProps {
  homeBankingIdInitial: number;
  data: BlockLoopInstructionLoadDTO[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
}
type BlockDeleteCapability = { canDelete: boolean; reason: string; instructionCount: number; deleteRows: { id: number; name: string; action: string; order: number }[] };

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

const GridItem: React.FC<GridItemProps> = ({ homeBankingIdInitial, data, socketPort, sessionId, botJobIdInitial, botJobNameInitial, onSessionOpen, onDetachedClose }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(data);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const [excelGotoInstruction, setExcelGotoInstruction] = useState<BlockLoopInstructionLoadDTO | null>(null);
  // const [homeBanking, setHomeBanking] = useState<number>(homeBankingId);
  // const [botJobId, setBotJobId] = useState<number>(botJobId);
  // const [botJobName, setBotJobName] = useState<string>(botJobName);

  // Use state to manage the instructions data
  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [blockId, setBlockId] = useState<number | null>(-1);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);
  const botJobHeader = useBotJobDetailsController({
    webSocket, connected, messages, sessionId, homeBankingId, botJobId,
    onSurfaceOpen: (targetSession, nextBotJobId) => onSessionOpen(targetSession, socketPort, nextBotJobId),
  });

  useEffect(() => {
    if (!botJobHeader.state) return;
    setBotJobId(botJobHeader.state.botJobId);
    setBotJobName(botJobHeader.state.name);
    setHomeBankingId(botJobHeader.state.homeBankingId);
  }, [botJobHeader.state]);

  const instructionRef = useRef<HTMLInputElement>(null);
  const blockRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [mockData, setMockData] = useState<boolean>(false);
  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; exportFile?: string; instructions: BlockLoopInstructionLoadDTO[] } }>({});
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

  const {
    errorFlag, setErrorFlag,
    alertImage, setAlertImage,
    alertClass, setAlertClass,
    alertMessageHeader, setAlertMessageHeader,
    alertMessageBody, setAlertMessageBody,
    alertMessageFooter, setAlertMessageFooter,
    alertDismissed, setAlertDismissed,
    pendingDeleteBlockId, setPendingDeleteBlockId,
    alertOnConfirm, setAlertOnConfirm,
    handleClose,
  } = useGridAlerts();

  const { executionId, setExecutionId, executionState, setExecutionState } = useExecutionState();
  const { findText, setFindText, renderHighlighted } = useInstructionFind();
  const { collapsedBlocks, toggleBlockCollapsed } = useBlockCollapse();
  const {
    excelExportContext, setExcelExportContext,
    excelExportDirectory, setExcelExportDirectory,
    choosingExcelExportDirectory, setChoosingExcelExportDirectory,
    pendingExcelExportDirectoryRequestRef,
    handleExcelFileBlockName, submitExcelExport, chooseExcelExportDirectory, closeExcelExport,
  } = useExcelExport({
    webSocket, connected, sessionId, homeBankingId, botJobId, botJobName,
    alerts: {
      setAlertImage, setAlertClass, setErrorFlag,
      setAlertMessageHeader, setAlertMessageBody, setAlertMessageFooter,
    },
  });
  const pendingSplitRequestRef = useRef<string | null>(null);
  const pendingCommandEditorOpenRequestRef = useRef<string | null>(null);
  const processedMessagesRef = useRef(0);
  const [saveComponentContext, setSaveComponentContext] = useState<SaveComponentContext | null>(null);

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null || !gridScrollRef.current) return;
    gridScrollRef.current.scrollTop = pendingScrollTopRef.current;
    pendingScrollTopRef.current = null;
  }, [instructionsData]);

  // Memory list: steps hand-picked via the row "+" button, kept in insertion order.
  // Presentation lives in the one detached Memory List workspace.
  const {
    memorySteps, setMemorySteps,
    memoryTargetBlockId, setMemoryTargetBlockId,
    memoryBlockOptions, setMemoryBlockOptions,
    createBlockOpen, setCreateBlockOpen,
    memoryCapabilities, setMemoryCapabilities,
    pendingMemoryMove, setPendingMemoryMove,
    memoryMoveStatus, setMemoryMoveStatus,
    memoryListOpenVersion, setMemoryListOpenVersion,
    memoryListOpenRequestedRef, memoryListOpenedRef,
    memoryListOpenPendingRequestRef, memoryListOwnerEpochRef,
    requestMemoryListOpen,
    handleAddToMemory, handleAddBlockToMemory, handleRemoveFromMemory,
  } = useInstructionMemory(data);
  const [activeDraggedInstructionId, setActiveDraggedInstructionId] = useState<number | null>(null);
  const [pendingDragPreview, setPendingDragPreview] = useState<{ requestId: string; result: any } | null>(null);
  const [blockDeleteCapabilities, setBlockDeleteCapabilities] = useState<Map<number, BlockDeleteCapability>>(new Map());
  const [moveGraphRevision, setMoveGraphRevision] = useState('');
  const submitInstructionMove = useInstructionDrag({
    webSocket, connected, graphRevision: moveGraphRevision, botJobId, botJobName,
    homeBankingId, targetSessionId: 'botJobTasks',
  });
  // Memory-List state, refs and add/remove handlers now live in useInstructionMemory
  // (destructured above). The WS effects + handleApplyMemory below consume them.

  // Whole-block reordering (drag + up/down buttons) lives in useBlockReorder.
  const {
    dragBlockRef, commitBlockReorder,
    handleBlockDragStart, handleBlockDrop, handleBlockDragEnd,
    sortedBlockIndex, handleMoveBlockUp, handleMoveBlockDown,
  } = useBlockReorder({
    groupedData, instructionsData, setInstructionsData, setIsDataReordered,
    webSocket, connected, botJobId, botJobName, homeBankingId,
  });

  useEffect(() => {
    setMemoryBlockOptions((prev) => normalizeBlockOptions([
      ...prev,
      ...blockOptionsFromInstructions(instructionsData),
    ]));
  }, [instructionsData]);

  useEffect(() => {
    if (!webSocket || !connected || instructionsData.length === 0) return;
    webSocket.send(JSON.stringify({
      type: 'instructionEditor.memoryCapabilities',
      sessionId,
      homeBankingId,
      body: JSON.stringify({ targetSessionId: 'botJobTasks', botJobId, homeBankingId }),
    }));
  }, [webSocket, connected, instructionsData, botJobId, homeBankingId, sessionId]);

  useEffect(() => {
    if (!memoryListOpenRequestedRef.current && !memoryListOpenedRef.current) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !botJobId || botJobId <= 0) return;
    if (memoryListOpenRequestedRef.current && memoryListOpenPendingRequestRef.current) return;

    const snapshot: MemoryListSnapshot = {
      ownerEpoch: memoryListOwnerEpochRef.current,
      sourceKind: 'BOT_JOB',
      homeBankingId,
      botJobId,
      botJobName: botJobName || '',
      items: memorySteps.map(instructionMemoryItem),
      blocks: memoryBlockOptions,
      targetBlockId: memoryTargetBlockId,
      emptyMessage: 'Click "+" on a step to add it here.',
      status: memoryMoveStatus || (connected ? 'Memory List ready' : 'Memory List disconnected'),
      busy: pendingMemoryMove !== null,
      canApply: memoryTargetBlockId !== null
        && memorySteps.length > 0
        && pendingMemoryMove === null
        && memoryBlockOptions.some(block => block.blockId === memoryTargetBlockId),
    };
    const operation = memoryListOpenRequestedRef.current ? 'memoryList.open' : 'memoryList.sync';
    const requestId = `memory-list-${Date.now()}-${operation === 'memoryList.open' ? 'open' : 'sync'}`;

    try {
      webSocket.send(JSON.stringify({
        type: operation,
        sessionId,
        homeBankingId,
        botJobId,
        body: JSON.stringify({
          requestId,
          homeBankingId,
          botJobId,
          ownerEpoch: memoryListOwnerEpochRef.current,
          snapshot,
        }),
      }));
      if (operation === 'memoryList.open') {
        memoryListOpenPendingRequestRef.current = requestId;
      }
    } catch (memoryListError) {
      if (operation === 'memoryList.open') {
        memoryListOpenPendingRequestRef.current = null;
      }
      console.error('Could not synchronize detached Memory List:', memoryListError);
    }
  }, [
    botJobId,
    botJobName,
    connected,
    homeBankingId,
    memoryBlockOptions,
    memoryListOpenVersion,
    memoryMoveStatus,
    memorySteps,
    memoryTargetBlockId,
    pendingMemoryMove,
    sessionId,
    webSocket,
  ]);

  // Apply: move the memorized steps (in insertion order) to the end of the
  // selected block, then persist exactly like a drag & drop move (ROW_MOVE).
  const handleApplyMemory = (
    targetBlockIdOverride?: number | null,
    sourceItemKeys?: string[],
  ) => {
    const targetBlockId = targetBlockIdOverride === undefined
      ? memoryTargetBlockId
      : targetBlockIdOverride;
    if (targetBlockId === null || memorySteps.length === 0) return;

    const targetBlockOption = memoryBlockOptions.find((block) => block.blockId === targetBlockId);
    if (!targetBlockOption) return;

    const memoryStepBySourceKey = new Map(
      memorySteps.map(step => [String(step.id), step] as const),
    );
    const requestedSteps = sourceItemKeys === undefined
      ? memorySteps
      : sourceItemKeys
        .map((itemKey) => {
          const rawKey = String(itemKey).replace(/^BOT_JOB:/, '');
          return memoryStepBySourceKey.get(rawKey);
        })
        .filter((step): step is BlockLoopInstructionLoadDTO => Boolean(step));
    const movable = requestedSteps.filter(step => memoryCapabilities.get(step.id)?.canAdd);
    if (movable.length === 0) return;
    const movableIds = new Set(movable.map((step) => step.id));

    // Pull the live rows out of every block (the memory list holds snapshots).
    const movedById = new Map<number, BlockLoopInstructionLoadDTO>();
    const updatedGroupedData: typeof groupedData = {};
    Object.keys(groupedData).forEach((key) => {
      const currentBlockId = Number(key);
      const blockData = groupedData[currentBlockId];
      const kept = blockData.instructions.filter((ins) => {
        if (movableIds.has(ins.id)) {
          movedById.set(ins.id, ins);
          return false;
        }
        return true;
      });
      updatedGroupedData[currentBlockId] = { ...blockData, instructions: kept };
    });

    // Append to the target block, in memory-list insertion order.
    const blockId = targetBlockOption.blockId;
    const blockName = targetBlockOption.blockName;
    const blockOrderNumber = targetBlockOption.blockOrderNumber;
    const appended = movable
      .map((step) => movedById.get(step.id))
      .filter((ins): ins is BlockLoopInstructionLoadDTO => Boolean(ins))
      .map((ins) => ({ ...ins, blockId, blockName, blockOrderNumber }));
    const existingTargetBlock = updatedGroupedData[blockId] ?? {
      blockName,
      instructions: [],
      exportFile: "No Excel Export File",
    };
    updatedGroupedData[blockId] = {
      ...existingTargetBlock,
      instructions: [...existingTargetBlock.instructions, ...appended],
    };

    // Renumber every block and drop the ones the move emptied.
    let deleteBlockId = -1;
    Object.keys(updatedGroupedData).forEach((key) => {
      const currentBlockId = Number(key);
      const block = updatedGroupedData[currentBlockId];
      if (block.instructions.length === 0) {
        if (deleteBlockId === -1) deleteBlockId = currentBlockId;
        delete updatedGroupedData[currentBlockId];
        return;
      }
      block.instructions = block.instructions.map((ins, i) => ({
        ...ins,
        instructionOrderNumber: i + 1,
      }));
    });

    const updatedInstructionsData = Object.values(updatedGroupedData).flatMap(
      (block) => block.instructions
    );

    if (webSocket && connected) {
      const requestId = submitInstructionMove(updatedInstructionsData, deleteBlockId, 'memory');
      if (requestId) {
        setPendingMemoryMove({ requestId, ids: movableIds });
        setMemoryMoveStatus('Applying...');
      } else {
        setMemoryMoveStatus('Memory Apply could not be sent.');
      }
    }

  };

  // Java backend owns block creation and mints the new blockId. It refreshes the
  // grid through the existing updateInstructions socket path after BLOCK_CREATE.
  const handleCreateNewBlock = (newBlockName: string, position: CreateBlockPosition) => {
    const botJobId = instructionsData[0]?.botJobId ?? -1;

    const message = {
      type: 'BLOCK_CREATE',
      botJobId,
      botJobName,
      homeBankingId: homeBankingId,
      sessionId: `botJobTasks`,
      blockName: newBlockName,
      insertPosition: position.type === 'end' ? 'END' : 'BEFORE',
      beforeBlockId: position.type === 'before' ? position.blockId : -1,
      beforeBlockOrderNumber: position.type === 'before' ? position.blockOrderNumber : -1,
    };

    if (!webSocket || !connected) {
      console.log('Cannot send BLOCK_CREATE: WebSocket is not connected', message);
      return;
    }

    try {
      webSocket.send(JSON.stringify(message));
      console.log('Sent BLOCK_CREATE message:', message);
    } catch (err) {
      console.log('Error sending BLOCK_CREATE message:', err);
      return;
    }
  };

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
  const applyDragMove = (result: any, previewRows: { id: number }[]) => {
    const { source, destination, draggableId } = result;
    setActiveDraggedInstructionId(null);
    if (!destination) return;

    const sourceBlockId = Number(source.droppableId);
    const destinationBlockId = Number(destination.droppableId);
    const sourceBlock = groupedData[sourceBlockId];
    const destinationBlock = groupedData[destinationBlockId];
    if (!sourceBlock || !destinationBlock) return;

    const instructionId = Number(draggableId);
    const capability = memoryCapabilities.get(instructionId);
    const destinationId = destinationBlockId;
    if (!capability?.canMove || !capability.allowedBlockIds.includes(destinationId)) {
      setAlertImage(forbiddenImage);
      setAlertClass('construction-image');
      setAlertMessageHeader('Drag & Drop not Allowed');
      setAlertMessageBody(capability?.reason || 'The backend does not allow this movement.');
      setAlertMessageFooter('Select one of the highlighted destinations.');
      setErrorFlag(true);
      return;
    }

    const groupIds = new Set(previewRows.map(row => Number(row.id)));
    const movedInstructions = sourceBlock.instructions.filter(instruction => groupIds.has(instruction.id));
    const sourceInstructions = sourceBlock.instructions.filter(instruction => !groupIds.has(instruction.id));
    if (movedInstructions.length !== groupIds.size) return;
    let updatedGroupedData = { ...groupedData };
    let deleteBlockId = -1;

    if (sourceBlockId === destinationBlockId) {
      sourceInstructions.splice(destination.index, 0, ...movedInstructions);
      updatedGroupedData[sourceBlockId] = {
        ...sourceBlock,
        instructions: sourceInstructions.map((instruction, index) => ({
          ...instruction,
          instructionOrderNumber: index + 1,
        })),
      };
    } else {
      const destinationInstructions = [...destinationBlock.instructions];
      destinationInstructions.splice(destination.index, 0, ...movedInstructions);
      updatedGroupedData[sourceBlockId] = {
        ...sourceBlock,
        instructions: sourceInstructions.map((instruction, index) => ({
          ...instruction,
          instructionOrderNumber: index + 1,
        })),
      };
      updatedGroupedData[destinationBlockId] = {
        ...destinationBlock,
        instructions: destinationInstructions.map((instruction, index) => ({
          ...instruction,
          blockId: destinationId,
          blockName: destinationBlock.blockName,
          blockOrderNumber: destinationBlock.instructions[0]?.blockOrderNumber,
          instructionOrderNumber: index + 1,
        })),
      };
      if (sourceInstructions.length === 0) {
        deleteBlockId = sourceBlockId;
        delete updatedGroupedData[sourceBlockId];
      }
    }

    const updatedInstructionsData = Object.values(updatedGroupedData).flatMap(block => block.instructions);
    setGroupedData(updatedGroupedData);
    setInstructionsData(updatedInstructionsData);
    setIsDataReordered(false);
    submitInstructionMove(updatedInstructionsData, deleteBlockId, 'drag');
  };

  const onDragEnd = (result: any) => {
    setActiveDraggedInstructionId(null);
    if (!result.destination) return;
    if (
      result.source?.droppableId === result.destination.droppableId &&
      result.source?.index === result.destination.index
    ) {
      return;
    }
    if (!webSocket || !connected || !moveGraphRevision) return;
    const requestId = `${Date.now()}-botJobTasks-move-preview`;
    setPendingDragPreview({ requestId, result });
    webSocket.send(JSON.stringify({
      type: 'instructionGraph.previewMove',
      sessionId,
      homeBankingId,
      body: JSON.stringify({
        requestId,
        targetSessionId: 'botJobTasks',
        botJobId,
        homeBankingId,
        graphRevision: moveGraphRevision,
        instructionId: Number(result.draggableId),
        destinationBlockId: Number(result.destination.droppableId),
        destinationIndex: result.destination.index,
      }),
    }));
  };

  // ── Native HTML5 drag & drop (Phase 7; replaces react-beautiful-dnd) ────────
  // Only the drag *mechanism* changed: on drop we synthesize the exact same
  // result shape rbd produced and call onDragEnd() above unchanged (so the
  // backend preview-move round-trip is untouched). [Grid][drag] logs + the
  // window.__gridReorder hook make the pipeline observable/testable like Memory List.
  const dragSourceRef = useRef<{ droppableId: string; index: number; instructionId: number } | null>(null);

  const commitInstructionDrag = useCallback((destinationDroppableId: string, destinationIndex: number) => {
    const source = dragSourceRef.current;
    dragSourceRef.current = null;
    if (!source) return;
    const result = {
      draggableId: String(source.instructionId),
      source: { droppableId: source.droppableId, index: source.index },
      destination: { droppableId: destinationDroppableId, index: destinationIndex },
    };
    console.log('[Grid][drag] DROP -> synthesizing reorder result', result);
    onDragEnd(result);
  }, [onDragEnd]);

  const handleRowDragStart = (droppableId: string, index: number, instruction: BlockLoopInstructionLoadDTO) =>
    (event: React.DragEvent) => {
      if (findText.trim().length > 0 || !memoryCapabilities.get(instruction.id)?.canMove) {
        event.preventDefault();
        return;
      }
      dragSourceRef.current = { droppableId, index, instructionId: instruction.id };
      setActiveDraggedInstructionId(instruction.id);
      try {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(instruction.id));
      } catch {
        // dataTransfer may be restricted; the ref still carries the source.
      }
      console.log(`[Grid][drag] GRABBED instruction ${instruction.id} (block ${droppableId}, index ${index})`);
    };

  const handleGridDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleRowDrop = (droppableId: string, index: number) => (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    commitInstructionDrag(droppableId, index);
  };

  const handleListDrop = (droppableId: string, count: number) => (event: React.DragEvent) => {
    event.preventDefault();
    commitInstructionDrag(droppableId, count); // dropped on empty space -> append
  };

  const handleRowDragEnd = () => {
    if (dragSourceRef.current) {
      console.log('[Grid][drag] RELEASED with no valid drop target — no reorder');
    }
    dragSourceRef.current = null;
    setActiveDraggedInstructionId(null);
  };

  // Native block reorder (drag whole blocks + up/down buttons) now lives in
  // useBlockReorder (destructured above), including the window.__blockReorder hook.

  useEffect(() => {
    (window as any).__gridReorder = (
      instructionId: number,
      destinationDroppableId: string,
      destinationIndex: number,
    ) => {
      let sourceDroppableId = '';
      let sourceIndex = -1;
      for (const [key, block] of Object.entries(groupedData)) {
        const idx = block.instructions.findIndex(instruction => instruction.id === instructionId);
        if (idx >= 0) {
          sourceDroppableId = key;
          sourceIndex = idx;
          break;
        }
      }
      if (sourceIndex < 0) {
        console.warn('[Grid][drag] __gridReorder: instruction not found', instructionId);
        return;
      }
      onDragEnd({
        draggableId: String(instructionId),
        source: { droppableId: sourceDroppableId, index: sourceIndex },
        destination: { droppableId: destinationDroppableId, index: destinationIndex },
      });
    };
    return () => {
      delete (window as any).__gridReorder;
    };
  }, [groupedData, onDragEnd]);

  // Memoized function to handle outside clicks on the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpenDropdown(null); // Close the dropdown if clicked outside
    }
  }, [dropdownRef]);


  useEffect(() => {
    console.log("WebSocket Messages");

    if (processedMessagesRef.current > messages.length) {
      processedMessagesRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    pendingMessages.forEach((message) => {
      console.log('RECEIVED -> WebSocket message ', message);

      try {
        const parsedMessage = JSON.parse(message);
        if (typeof parsedMessage.homeBankingId === "number") {
          setHomeBankingId(parsedMessage.homeBankingId);
        }


        if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "memoryList.openResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (String(bodyData?.requestId || '') !== memoryListOpenPendingRequestRef.current) return;
          memoryListOpenPendingRequestRef.current = null;
          const ownerEpoch = String(bodyData?.ownerEpoch || '');
          if (bodyData?.ok === false || !ownerEpoch) {
            memoryListOpenedRef.current = false;
            memoryListOpenRequestedRef.current = false;
            memoryListOwnerEpochRef.current = '';
            setMemoryMoveStatus(String(
              bodyData?.message || bodyData?.error || 'Memory List workspace could not be opened.',
            ));
          } else {
            memoryListOwnerEpochRef.current = ownerEpoch;
            memoryListOpenedRef.current = true;
            memoryListOpenRequestedRef.current = false;
            setMemoryListOpenVersion(version => version + 1);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "memoryList.syncResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (
            bodyData?.ok === false
            && String(bodyData?.ownerEpoch || '') === memoryListOwnerEpochRef.current
          ) {
            memoryListOpenedRef.current = false;
            memoryListOwnerEpochRef.current = '';
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "memoryList.command") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          const command = String(bodyData?.command || bodyData?.action || '').toUpperCase();
          const payload = bodyData?.payload && typeof bodyData.payload === 'object'
            ? bodyData.payload
            : bodyData;
          if (Number(bodyData?.botJobId) !== Number(botJobId)) return;

          if (command === 'REMOVE') {
            const sourceItemKey = String(
              payload?.sourceItemKey
              ?? payload?.item?.sourceItemKey
              ?? payload?.itemKey
              ?? '',
            ).replace(/^BOT_JOB:/, '');
            const instructionId = Number(sourceItemKey);
            if (Number.isFinite(instructionId)) handleRemoveFromMemory(instructionId);
          } else if (command === 'CLEAR') {
            setMemorySteps([]);
          } else if (command === 'SELECT_TARGET_BLOCK') {
            const selectedBlockId = Number(payload?.blockId);
            setMemoryTargetBlockId(
              Number.isFinite(selectedBlockId) && selectedBlockId > 0 ? selectedBlockId : null,
            );
          } else if (command === 'APPLY') {
            const requestedTargetBlockId = Number(payload?.targetBlockId);
            const requestedSourceItemKeys = Array.isArray(payload?.sourceItemKeys)
              ? payload.sourceItemKeys.map((itemKey: unknown) => String(itemKey))
              : undefined;
            handleApplyMemory(
              Number.isFinite(requestedTargetBlockId) && requestedTargetBlockId > 0
                ? requestedTargetBlockId
                : null,
              requestedSourceItemKeys,
            );
          } else if (command === 'REORDER') {
            // The aggregate Memory List owns the mixed-source display order.
            // Producers apply the ordered sourceItemKeys routed with APPLY.
          } else if (command === 'CREATE_BLOCK') {
            const blockName = String(payload?.blockName || '').trim();
            if (!blockName) return;
            const rawPosition = payload?.position;
            const position: CreateBlockPosition = rawPosition?.type === 'before'
              ? {
                type: 'before',
                blockId: Number(rawPosition.blockId),
                blockOrderNumber: Number(rawPosition.blockOrderNumber),
                blockName: String(rawPosition.blockName || ''),
              }
              : { type: 'end' };
            handleCreateNewBlock(blockName, position);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "componentSave.applyResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          setAlertImage(bodyData?.ok === false ? warningRedImage : constructionImage);
          setAlertClass('construction-image'); setErrorFlag(bodyData?.ok === false);
          setAlertMessageHeader(bodyData?.ok === false ? 'Component Not Saved' : 'Component Saved');
          setAlertMessageBody(bodyData?.error || bodyData?.message || 'Component saved successfully.');
          setAlertMessageFooter(bodyData?.ok === false ? 'Review the component name and try again.' : 'The component grid was refreshed.');
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "excelExport.chooseDirectoryResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (!pendingExcelExportDirectoryRequestRef.current
              || bodyData?.requestId !== pendingExcelExportDirectoryRequestRef.current) {
            return;
          }
          pendingExcelExportDirectoryRequestRef.current = null;
          setChoosingExcelExportDirectory(false);
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage); setAlertClass('construction-image'); setErrorFlag(true);
            setAlertMessageHeader('Excel Export Folder Not Selected');
            setAlertMessageBody(bodyData?.error || 'The destination folder could not be selected.');
            setAlertMessageFooter('Keep the Excel Export page open and try Browse again.');
          } else if (bodyData?.cancelled !== true && typeof bodyData?.directory === 'string') {
            setExcelExportDirectory(bodyData.directory);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "excelExport.saveResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage); setAlertClass('construction-image'); setErrorFlag(true);
            setAlertMessageHeader('Excel Export Not Saved');
            setAlertMessageBody(bodyData?.error || 'The export configuration could not be saved.');
            setAlertMessageFooter('Review the path and filename, then try again.');
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "commandEditor.workspaceOpenResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          const responseRequestId = String(bodyData?.requestId || '');
          if (
            !pendingCommandEditorOpenRequestRef.current
            || !responseRequestId
            || responseRequestId !== pendingCommandEditorOpenRequestRef.current
          ) {
            return;
          }
          pendingCommandEditorOpenRequestRef.current = null;
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader('Command Editor Not Opened');
            setAlertMessageBody(bodyData?.error || 'The Command Editor workspace could not be opened.');
            setAlertMessageFooter('Refresh Bot Job Details and try again.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "license.statusChanged") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (bodyData?.active !== true) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader('License Activation Required');
            setAlertMessageBody(bodyData?.error || bodyData?.status || 'Protected job operations are unavailable.');
            setAlertMessageFooter('Open License Manager and activate this installation before continuing.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionGraph.previewMoveResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (pendingDragPreview && bodyData?.requestId === pendingDragPreview.requestId) {
            const pendingResult = pendingDragPreview.result;
            const groupRows = Array.isArray(bodyData?.groupRows) ? bodyData.groupRows : [];
            setPendingDragPreview(null);
            if (bodyData?.ok === false || groupRows.length === 0) {
              setAlertImage(forbiddenImage);
              setAlertClass('construction-image');
              setAlertMessageHeader('Move Preview Refused');
              setAlertMessageBody(bodyData?.error || 'The backend could not preview this movement.');
              setAlertMessageFooter('Refresh the grid and try again.');
              setErrorFlag(true);
              setAlertOnConfirm(undefined);
            } else if (groupRows.length === 1) {
              applyDragMove(pendingResult, groupRows);
            } else {
              const summary = groupRows.map((row: { order: number; name: string; action: string }) =>
                `#${row.order} ${row.name || row.action}`).join('\n');
              setAlertImage(constructionImage);
              setAlertClass('construction-image');
              setAlertMessageHeader(`Move ${groupRows.length} connected instructions?`);
              setAlertMessageBody(summary);
              setAlertMessageFooter('The complete connected group will move together.');
              setErrorFlag(false);
              setAlertOnConfirm(() => () => {
                handleClose();
                applyDragMove(pendingResult, groupRows);
              });
            }
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionGraph.applySplitResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (!pendingSplitRequestRef.current || bodyData?.requestId !== pendingSplitRequestRef.current) {
            return;
          }
          pendingSplitRequestRef.current = null;
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(bodyData?.errorTitle || 'Split Component Refused');
            setAlertMessageBody(bodyData?.error || 'The backend could not split this block.');
            setAlertMessageFooter(bodyData?.errorHeader || 'Refresh the grid and try again.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          } else {
            const authoritativeInstructions = Array.isArray(bodyData?.instructions) ? bodyData.instructions : [];
            if (authoritativeInstructions.length > 0) {
              pendingScrollTopRef.current = gridScrollRef.current?.scrollTop ?? null;
              setInstructionsData(authoritativeInstructions);
              setIsDataReordered(false);
            }
            if (Array.isArray(bodyData?.blocks)) {
              setMemoryBlockOptions(normalizeBlockOptions(bodyData.blocks.map((block: {
                id?: number; blockId?: number; name?: string; blockName?: string; blockOrderNumber?: number;
              }) => ({
                blockId: Number(block.blockId ?? block.id),
                blockName: String(block.blockName ?? block.name ?? ''),
                blockOrderNumber: Number(block.blockOrderNumber),
              }))));
            }
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionEditor.deleteResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(bodyData?.errorTitle || 'Delete Instruction Refused');
            setAlertMessageBody(bodyData?.error || 'The instruction could not be deleted.');
            setAlertMessageFooter(bodyData?.errorHeader || 'Refresh the grid and review attached steps.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionEditor.blockDeleteResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (bodyData?.ok === false) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(bodyData?.errorTitle || 'Delete Block Refused');
            setAlertMessageBody(bodyData?.error || 'The block could not be deleted.');
            setAlertMessageFooter(bodyData?.errorHeader || 'The grid was restored from the backend.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionEditor.rowMoveResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (pendingMemoryMove && bodyData?.requestId === pendingMemoryMove.requestId) {
            if (bodyData?.ok) {
              setMemorySteps(prev => prev.filter(step => !pendingMemoryMove.ids.has(step.id)));
              setMemoryMoveStatus('Applied.');
            } else {
              setMemoryMoveStatus(bodyData?.error || 'Memory Apply was refused.');
            }
            setPendingMemoryMove(null);
          } else if (bodyData?.ok === false) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader(bodyData?.errorTitle || 'Move Instruction Refused');
            setAlertMessageBody(bodyData?.error || 'The instruction move could not be applied.');
            setAlertMessageFooter(bodyData?.errorHeader || 'The grid was restored from the backend.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "instructionEditor.memoryCapabilitiesResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          const next = new Map<number, { canAdd: boolean; canMove: boolean; canDelete: boolean; deleteCount: number; reason: string; deleteReason: string; allowedBlockIds: number[]; deleteRows: { id: number; name: string; action: string; order: number }[] }>();
          if (Array.isArray(bodyData?.capabilities)) {
            bodyData.capabilities.forEach((capability: { instructionId: number; canAddToMemory: boolean; canMove: boolean; canDelete: boolean; deleteCount?: number; reason?: string; deleteReason?: string; allowedBlockIds?: number[]; deleteRows?: { id: number; name: string; action: string; order: number }[] }) => {
              next.set(capability.instructionId, { canAdd: capability.canAddToMemory === true, canMove: capability.canMove === true, canDelete: capability.canDelete === true, deleteCount: capability.deleteCount || 1, reason: capability.reason || '', deleteReason: capability.deleteReason || '', allowedBlockIds: Array.isArray(capability.allowedBlockIds) ? capability.allowedBlockIds : [], deleteRows: Array.isArray(capability.deleteRows) ? capability.deleteRows : [] });
            });
          }
          setMemoryCapabilities(next);
          const nextBlocks = new Map<number, BlockDeleteCapability>();
          if (Array.isArray(bodyData?.blockCapabilities)) {
            bodyData.blockCapabilities.forEach((capability: { blockId: number; canDelete: boolean; reason?: string; instructionCount?: number; deleteRows?: BlockDeleteCapability['deleteRows'] }) => {
              nextBlocks.set(capability.blockId, { canDelete: capability.canDelete === true, reason: capability.reason || '', instructionCount: capability.instructionCount || 0, deleteRows: Array.isArray(capability.deleteRows) ? capability.deleteRows : [] });
            });
          }
          setBlockDeleteCapabilities(nextBlocks);
          setMoveGraphRevision(typeof bodyData?.graphRevision === 'string' ? bodyData.graphRevision : '');
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "updateInstructions") {

          pendingScrollTopRef.current = gridScrollRef.current?.scrollTop ?? null;

          const bodyData = typeof parsedMessage.body === "string"
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;

          // ... handle updateInstructions ...
          // Ensure detailsData is always an array if possible
          const detailsData = Array.isArray(bodyData)
            ? bodyData
            : Array.isArray(bodyData.instructions)
              ? bodyData.instructions
              : [];
          const backendBlocks = !Array.isArray(bodyData) && Array.isArray(bodyData.blocks)
            ? bodyData.blocks
            : [];
          const createdBlockId = !Array.isArray(bodyData) ? Number(bodyData.createdBlockId) : -1;

          if (backendBlocks.length > 0) {
            setMemoryBlockOptions(normalizeBlockOptions(backendBlocks));
          }
          if (createdBlockId > 0) {
            setMemoryTargetBlockId(createdBlockId);
            setCreateBlockOpen(false);
          }

          // Check if detailsData is empty
          if (detailsData.length === 0) {
            // If empty, set elementDTO to an empty array
            setInstructionsData([]);
            setGroupedData({}); // Or set to your initial empty state
            setIsDataReordered(true); // Or false, depending on your logic
            if (bodyData.botJobId !== undefined) setBotJobId(bodyData.botJobId);
            if (bodyData.botJobName !== undefined) setBotJobName(bodyData.botJobName);
            if (bodyData.blockId !== undefined) setBlockId(bodyData.blockId);
          } else {
            // Otherwise, set elementDTO to detailsData

            if (typeof detailsData[0].botJobId === "number") {
              setBotJobId(detailsData[0].botJobId);
            }

            if (typeof detailsData[0].botJobName === "string") {
              setBotJobName(detailsData[0].botJobName);
            }
            setInstructionsData(detailsData);
            if (backendBlocks.length === 0) {
              setMemoryBlockOptions((prev) => normalizeBlockOptions([
                ...prev,
                ...blockOptionsFromInstructions(detailsData),
              ]));
            }


            setIsDataReordered(false); // To trigger reordering logic if needed

          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "rowStatus") {
          const bodyData = typeof parsedMessage.body === "string"
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;

          setExecutionId(bodyData.instructionId);
          setExecutionState(bodyData.color);
          // #fcba03  deep carmine yellow
          // #56dfc1 deep carmine green
          // #1d9c06 Neon green
          // #ba0f34 red
          // #FF3131 Neon Red
          // #a52a2a red

        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "react.session.open") {
          const bodyData = typeof parsedMessage.body === "string"
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;
          if (bodyData?.targetSession === 'mainDashboard') {
            if (onDetachedClose) {
              onDetachedClose();
            } else {
              try {
                window.close();
              } catch (closeError) {
                console.error('Could not close detached Bot Job window:', closeError);
              }
            }
          } else if (typeof bodyData?.targetSession === 'string' && typeof bodyData?.port === 'number') {
            onSessionOpen(bodyData.targetSession, bodyData.port, bodyData.botJobId);
          }
        }

      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
  }, [messages, onDetachedClose, onSessionOpen, pendingMemoryMove, pendingDragPreview, sessionId, socketPort]);


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
        sessionId: `botJobTasks`, //-${botJobId}`,
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
    console.log("Reassigning instruction order numbers");
    if (!isDataReordered && instructionsData.length > 0) {


      const reassignedData = reassignInstructionOrderNumbersByBlock([...instructionsData]);
      const { updatedData, updatedBlocks: nextUpdatedBlocks } = correctBlockOrderNumbers(reassignedData);

      const gotoInstructionAfterReorder = updatedData.find(
        (instruction) => instruction.actions === 'EXCEL GOTO'
      );

      setInstructionsData(updatedData);
      setExcelGotoInstruction(gotoInstructionAfterReorder || null);
      setGroupedData(groupByBlock(updatedData));

      if (JSON.stringify(updatedBlocks) !== JSON.stringify(nextUpdatedBlocks)) {
        setUpdatedBlocks(nextUpdatedBlocks);
      }

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
    // Ensure instructionsData is available
    if (!instructionsData || instructionsData.length === 0) {
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
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_UPDATE',
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: blockId,
        blockName: blockName, // Send the updated block name
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`, //-${botJobId}`,
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
    // Find the botJobId and current blockActive status from the instructionsData for the given blockId
    const block = instructionsData.find(instruction => instruction.blockId === blockId);

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

    // Update instructionsData with the new blockActive and instructionActive values
    const updatedInstructions = instructionsData.map((instruction) => {
      if (instruction.blockId === blockId) {
        return {
          ...instruction,
          blockActive: newBlockActive, // Toggle the blockActive value
          instructionActive: newBlockActive // Update instructionActive to match the new blockActive value
        };
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

    // Send WebSocket message for blockActive update
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_STATUS',
        botJobId: botJobId,
        botJobName: botJobName,
        blockId: blockId,
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`, //-${botJobId}`,
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

  const handleInstructionStatus = (instructionId: number, instructions: BlockLoopInstructionLoadDTO[]) => {
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

    // Update instructionsData with the new instructionActive value
    const updatedInstructions = instructionsData.map((item) => {
      if (item.id === instructionId) {
        return { ...item, instructionActive: newInstructionActive }; // Toggle instructionActive
      }

      if (shouldUpdateByParent && item.parentId === parentId) {
        // Update all instructions with the same parentId
        return { ...item, instructionActive: newInstructionActive };
      }

      return item;
    });

    // Update the instructionsData state
    setInstructionsData(updatedInstructions);

    // Recompute groupedData based on the updated instructionsData
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
        sessionId: `botJobTasks`, //-${botJobId}`,
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent instructionActive update message:', message);
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
  // ONE code path for every block reorder (up/down buttons AND drag & drop):

  const handleOpenCommandEditor = (instruction: BlockLoopInstructionLoadDTO) => {
    const instructionId = Number(instruction.id);
    const currentBotJobId = Number(botJobId);
    if (
      !webSocket
      || !connected
      || webSocket.readyState !== WebSocket.OPEN
      || !Number.isSafeInteger(instructionId)
      || instructionId <= 0
      || !Number.isSafeInteger(currentBotJobId)
      || currentBotJobId <= 0
    ) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader('Command Editor Not Opened');
      setAlertMessageBody('Bot Job Details is not ready to open this instruction.');
      setAlertMessageFooter('Wait for the grid to finish loading and try again.');
      setErrorFlag(true);
      setAlertOnConfirm(undefined);
      return;
    }

    const requestId = `${Date.now()}-command-editor-${instructionId}`;
    pendingCommandEditorOpenRequestRef.current = requestId;
    try {
      webSocket.send(JSON.stringify({
        type: 'commandEditor.workspaceOpen',
        sessionId,
        homeBankingId,
        body: JSON.stringify({
          requestId,
          targetSessionId: 'botJobTasks',
          homeBankingId,
          botJobId: currentBotJobId,
          instructionId,
        }),
      }));
    } catch (openError) {
      pendingCommandEditorOpenRequestRef.current = null;
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader('Command Editor Not Opened');
      setAlertMessageBody('The Command Editor request could not be sent.');
      setAlertMessageFooter('Check the backend connection and try again.');
      setErrorFlag(true);
      setAlertOnConfirm(undefined);
    }
  };


  const closeAlert = () => {
    setAlertMessageHeader(null);
    setErrorFlag(false);
    setAlertMessageBody([]);
    setAlertMessageFooter(null);
  };

  const handleCreateComponent = (blockGroupId: number) => {
    // Access groupedData, setGroupedData, instructionsData, and preComponent from the component's scope
    const blockCompent = groupedData[blockGroupId]; // Get the block directly by its blockId

    if (!blockCompent) return; // Ensure the block exists

    // Get the block order
    const blockOrderNumber = blockCompent.instructions[0].blockOrderNumber;

    const botJobId = blockCompent.instructions[0]?.botJobId || -1; // Retrieve botJobId from the first instruction

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

    setSaveComponentContext({ blockId: newBlock.id, blockName: newBlock.blockName,
      blockOrderNumber: newBlock.blockOrderNumber, instructions: newBlock.instructions.map(instruction => ({
        instructionId: instruction.id, blockId: newBlock.id, blockOrderNumber: newBlock.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
      })) });

    setOpenDropdown(null);
  };


  const isBetweenCondition = (
    currentOrderNumber: number,
    instructions: BlockLoopInstructionLoadDTO[]
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
    instructions: BlockLoopInstructionLoadDTO[]
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
    // const matchingResults: BlockLoopInstructionLoadDTO[] = [];

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
    instructions: BlockLoopInstructionLoadDTO[]
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


  const isBetweenIfAndElse = (currentOrderNumber: number, instructions: BlockLoopInstructionLoadDTO[]) => {
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
    groupedData: { [blockId: string]: { blockName: string; instructions: BlockLoopInstructionLoadDTO[] } },
    instructionsData: BlockLoopInstructionLoadDTO[],
    isLastInstruction: boolean,
    graphRevision: string
  ) => {
    if (!botJobId) return;

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
    const currentInstruction = instructionsData.find((instruction) => instruction.id === instructionId);

    const betweenLoops = getInstructionsLoops(blockId, instructionsData);

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
    // Find the maximum blockId from the entire instructionsData
    const maxBlockId = Math.max(...instructionsData.map(instruction => instruction.blockId));
    const newBlockId = maxBlockId + 1; // Generate a unique block ID

    const newBlockOrderNumber = blockOrderNumber + 1; // Increment the current block's order number by 1
    // Assuming that all instructions in blockToSplit have the same botJobId


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

    console.log("Split component requested with new block:", newBlock);

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
        updatedBlocks: buildLaterBlockOrderUpdates(
          updatedBlocks,
          blockOrderNumber,
          newBlockId,
          botJobId,
        ),
      };

      const splitRequestId = `${Date.now()}-split-${adjustedInstructionId}`;
      const message = {
        type: 'BLOCKS_SPLITTER',
        requestId: splitRequestId,
        instructionId: adjustedInstructionId,
        graphRevision,
        botJobId: botJobId,
        botJobName: botJobName,
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`, //-${botJobId}`,
        details: blockSplitDetails,
      };

      pendingSplitRequestRef.current = splitRequestId;
      webSocket.send(
        JSON.stringify(message),
      );

      console.log('Sent block split message:', message);
    }

    setOpenDropdown(null);
  };


  // Function to move a block down by swapping blockOrderNumbers



  // Function to move an instruction down considering blockOrderNumber
  const handleMoveRowDown = (instructionId: number) => {
    const instruction = instructionsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const blockInstructions = instructionsData
      .filter(row => row.blockId === instruction.blockId)
      .sort((left, right) => left.instructionOrderNumber - right.instructionOrderNumber);
    const sourceIndex = blockInstructions.findIndex(row => row.id === instructionId);
    const destinationIndex = sourceIndex + (1);
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= blockInstructions.length) return;
    onDragEnd({
      draggableId: String(instructionId),
      source: { droppableId: String(instruction.blockId), index: sourceIndex },
      destination: { droppableId: String(instruction.blockId), index: destinationIndex },
    });
  };

  const handleMoveRowUp = (instructionId: number) => {
    const instruction = instructionsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const blockInstructions = instructionsData
      .filter(row => row.blockId === instruction.blockId)
      .sort((left, right) => left.instructionOrderNumber - right.instructionOrderNumber);
    const sourceIndex = blockInstructions.findIndex(row => row.id === instructionId);
    const destinationIndex = sourceIndex + (-1);
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= blockInstructions.length) return;
    onDragEnd({
      draggableId: String(instructionId),
      source: { droppableId: String(instruction.blockId), index: sourceIndex },
      destination: { droppableId: String(instruction.blockId), index: destinationIndex },
    });
  };

  const handleRowSelectedClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    instruction: BlockLoopInstructionLoadDTO,
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
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }
    const sessionDestine = action === "HOVERED_ROW"
      ? SCANNER_TOOL_SESSION_ID
      : SCANNER_ELEMENT_PANE_SESSION_ID;

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
      console.log("📤 Sent element DTO:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
    }
  };


  const handleRemoveInstruction = (instructionId: number) => {
    if (!moveGraphRevision || !memoryCapabilities.get(instructionId)?.canDelete) return;
    const instruction = instructionsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const familyDelete = ["IF", "ELSEIF", "ELSE", "ENDIF"].includes(instruction.actions);
    const loopDelete = ["LOOP", "REFRESH_LOOP"].includes(instruction.actions);
    const capability = memoryCapabilities.get(instructionId);
    const deleteCount = capability?.deleteCount || 1;
    const deleteRows = capability?.deleteRows || [];
    setAlertImage(warningRedImage);
    setAlertClass('construction-image');
    setAlertMessageHeader(loopDelete ? 'Delete Loop Group' : instruction.actions === 'ELSEIF' ? 'Delete ElseIf Branch' : familyDelete ? 'Delete Conditional Family' : 'Delete Instruction');
    setAlertMessageBody(deleteRows.length > 0 ? deleteRows.map(row => ({
      parentNameWithId: `#${row.order} (${row.id}) ${row.name}`,
      connectionLabel: 'Action',
      actions: row.action,
    })) : [{ parentNameWithId: `(${instruction.id}) ${instruction.name}`, connectionLabel: 'Action', actions: instruction.actions }]);
    setAlertMessageFooter(`Delete ${deleteCount} row(s). Java will verify graph integrity before deletion.`);
    setErrorFlag(true);
    setAlertOnConfirm(() => () => executeRemoveInstruction(instructionId));
  };

  const executeRemoveInstruction = (instructionId: number) => {
    handleClose();
    // Find the instruction to remove
    const instructionToRemove = instructionsData.find(instruction => instruction.id === instructionId);

    if (!instructionToRemove) return;

    const { botJobId, botJobName, blockId, actions, parentId, id } = instructionToRemove;

    // Send WebSocket message if connected
    if (webSocket && connected) {
      const message = {
        type: "DELETE_INSTRUCTION",
        requestId: `${Date.now()}-bot-instruction-delete-${instructionId}`,
        graphRevision: moveGraphRevision,
        instructionId,
        actions,
        parentId,
        botJobId,
        botJobName,
        blockId,
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`, //-${botJobId}`,
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
    const capability = blockDeleteCapabilities.get(blockId);
    if (!moveGraphRevision || !capability?.canDelete) return;

    // Find the botJobId and blockOrderNumber associated with the blockId
    const blockInstruction = instructionsData.find(instruction => instruction.blockId === blockId);
    const blockDisplayName = blockInstruction?.blockName || `Block ${blockId}`;

    // Show confirmation dialog using AlertModal
    setAlertImage(warningRedImage);
    setAlertClass('construction-image');
    setAlertMessageHeader('Delete Block');
    setAlertMessageBody(capability.deleteRows.map(row => ({ parentNameWithId: `#${row.order} (${row.id}) ${row.name}`, connectionLabel: 'Action', actions: row.action })));
    setAlertMessageFooter(`Delete "${blockDisplayName}" and ${capability.instructionCount} instruction(s). This action cannot be undone.`);
    setErrorFlag(true);
    setAlertOnConfirm(() => () => executeRemoveBlock(blockId));
    return;
  };

  const executeRemoveBlock = (blockId: number) => {
    // Clear the confirmation dialog
    handleClose();

    const blockInstruction = instructionsData.find(instruction => instruction.blockId === blockId);
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
    if (webSocket && connected) {
      const message = {
        type: 'DELETE_BLOCK',
        requestId: `${Date.now()}-bot-block-delete-${blockId}`,
        graphRevision: moveGraphRevision,
        blockId: blockId,
        botJobId: botJobId,
        botJobName: botJobName,
        updatedBlocks: blocksToUpdate, // Include the list of updated blocks
        homeBankingId: homeBankingId,
        sessionId: `botJobTasks`, //-${botJobId}`,
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log(`Sent delete block message for Block ID: ${blockId} with updated blocks:`, message);
    }
  };

  const handleRollbackBlock = (blockId: number) => {
    // Get the botJobId and blockName from the first instruction
    const firstInstruction = instructionsData.find(instr => instr.blockId === blockId);
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
    const updatedData = instructionsData.map(instruction => ({
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
    setInstructionsData([...reassignedData]);
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
        sessionId: `botJobTasks`, //-${botJobId}`,
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





  const editableSpecialOperations = (actionType: string) => {
    if (["SET", "GET", "CK", "Q", "E", "P", "H", "GOTO", "PAUSE", "REFRESH", "LOOP", "REFRESH_LOOP", "NEXT_ENTER", "SWIPE_UP", "SWIPE_DOWN", "EXCEL GOTO", "NEXT ROW", "CSV CHECK", "PDF CHECK"].includes(actionType)) {
      return true;
    } else {
      return false;
    }
  }


  const allSpecialOperations = (actionType: string) => {
    if (["SET", "GET", "CK", "Q", "E", "P", "H", "GOTO", "IF", "ELSEIF", "ELSE", "ENDIF", "PAUSE", "REFRESH", "LOOP", "REFRESH_LOOP", "NEXT_ENTER", "SWIPE_UP", "SWIPE_DOWN", "EXCEL GOTO", "NEXT ROW", "CSV CHECK", "PDF CHECK"].includes(actionType)) {
      return true;
    } else {
      return false;
    }
  }


  const renderEditButton = (actionType: string, editImage: string, instruction: BlockLoopInstructionLoadDTO) => {
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
    const instruction = instructionsData.find(x => x.id === instructionId);
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
        sessionId: "botJobTasks",
      };
      webSocket.send(JSON.stringify(message));
    }

    // ✅ pure state update
    setInstructionsData(prev =>
      prev.map(x => (x.id === instructionId ? { ...x, actions: newActions } : x))
    );
  };

  // ── force_coordinates flag toggles (F / E / T / N / S) ─────────────────────
  // UI lives in CompForce. This handler persists the change: WebSocket push to
  // the backend (FORCE_COORDINATES_UPDATE) + local state update so the badge
  // flips immediately.
  const handleInstructionForceChange = (instructionId: number, nextForceCoordinates: string) => {
    const instruction = instructionsData.find(x => x.id === instructionId);
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
        sessionId: "botJobTasks",
      };
      webSocket.send(JSON.stringify(message));
    }

    setInstructionsData(prev =>
      prev.map(x => (x.id === instructionId ? { ...x, forceCoordinates: nextForceCoordinates } : x))
    );
  };

  const renderDeviceOptionsRow = (instruction: BlockLoopInstructionLoadDTO) => {
    if (allSpecialOperations(instruction.actions)) {
      return <span className="edit-button-space">&nbsp;</span>;
    }
    return <CompForce item={instruction} onChange={handleInstructionForceChange} />;
  };

  // Function to render the move buttons based on the action type
  const renderMoveButtons = (instructionId: number) => {
    if (!memoryCapabilities.get(instructionId)?.canMove) return null;

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
  const renderTestClick = (actionType: string, instruction: BlockLoopInstructionLoadDTO) => {
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


  const handleEditInstruction = (instruction: BlockLoopInstructionLoadDTO) => {
    setEditingInstructionId(instruction.id);
    // Roadmap 3 Phase 3d: edit field rebinds to clientNamed (display-only override).
    // The original `instruction.name` stays the canonical key the backend matches on.
    setInstructionName(
      (instruction.clientNamed && instruction.clientNamed.length > 0)
        ? instruction.clientNamed
        : instruction.name
    );
  };

  const handleSaveInstruction = (instructionId: number) => {
    // Find the instruction to get blockId and botJobId
    const instructionToUpdate = instructionsData.find(instruction => instruction.id === instructionId);

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

    // Roadmap 3 Phase 3d: write the user's edit to clientNamed only; never mutate `name`.
    // If the typed value matches the canonical name, clear clientNamed (null = no override).
    const updatedInstructions = instructionsData.map((instruction) => {
      if (instruction.id !== instructionId) return instruction;

      const typed = (instructionName ?? "").trim();
      const nextClientNamed = (typed.length === 0 || typed === instruction.name) ? null : typed;

      // updateInputActionName previously rebuilt the I:<name> action token from the typed value.
      // With Phase 3d the canonical name does not change, so action tokens stay locked to it.
      return { ...instruction, clientNamed: nextClientNamed };
    });

    setInstructionsData(updatedInstructions);
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
        sessionId: `botJobTasks`, //-${botJobId}`,
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
    instruction: BlockLoopInstructionLoadDTO,
    allInstructions: BlockLoopInstructionLoadDTO[]
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
    if ((instruction.actions === "SWIPE_UP" || instruction.actions === "SWIPE_DOWN") && instruction.operation) {

      return (
        <span className={styles.instructionDetails}>
          <span style={{ color: "#0b5394" }}>Times</span>{" "}
          <span style={{ color: "#FFA500" }}>{instruction.operation}x</span> {" "}
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

  const submitSaveComponent = (name: string, description: string) => {
    if (!saveComponentContext || !webSocket || !connected || !botJobId) return;
    webSocket.send(JSON.stringify({
      type: 'componentSave.apply', sessionId, homeBankingId,
      body: JSON.stringify({ ...saveComponentContext, name, description,
        requestId: `${Date.now()}-component-${saveComponentContext.blockId}`,
        sessionId, botJobId, botJobName, homeBankingId }),
    }));
    setSaveComponentContext(null);
  };

  return (
    <div className={styles.gridContainer}>
      <BotJobDetailsChrome
        fallbackBotJobId={botJobId}
        fallbackBotJobName={botJobName}
        fallbackSurface="botJob"
        connected={connected}
        webSocket={webSocket}
        messages={messages}
        sessionId={sessionId}
        controller={{
          ...botJobHeader,
          sendAction: (action: Parameters<typeof botJobHeader.sendAction>[0]) => {
            if (action === 'CLOSE') {
              if (onDetachedClose) {
                onDetachedClose();
              } else {
                try {
                  window.close();
                } catch (closeError) {
                  console.error('Could not close detached Bot Job window:', closeError);
                }
              }
            }
            botJobHeader.sendAction(action);
          },
        }}
      />
      {excelExportContext && <ExcelExportPanel
        context={excelExportContext}
        onSubmit={submitExcelExport}
        onClose={closeExcelExport}
        onChooseDirectory={chooseExcelExportDirectory}
        selectedDirectory={excelExportDirectory}
        choosingDirectory={choosingExcelExportDirectory}
      />}
      {saveComponentContext && <SaveComponentPanel context={saveComponentContext} onSubmit={submitSaveComponent} onClose={() => setSaveComponentContext(null)}/>}
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
        <FindBar
          value={findText}
          onChange={setFindText}
          memoryCount={memorySteps.length}
          onOpenMemory={requestMemoryListOpen}
        />
      </div>
      {createBlockOpen && (
        <CreateNewBlock
          blocks={memoryBlockOptions}
          onCreate={handleCreateNewBlock}
          onClose={() => setCreateBlockOpen(false)}
        />
      )}
      <div ref={gridScrollRef} className={styles.gridScroll}>
        <div className={styles.gridContent}>
            {
              Object.keys(groupedData).length === 0 ? (
                // Render default block if groupedData is empty
                // <div className={styles.block}>
                //   <div className={styles.blockHeader}>
                //     <span className={styles.blockName}>BotJob: {botJobName}</span>
                //     <span className={styles.blockName}>No Blocks were created yet</span>
                //   </div>
                //   <div className={styles.instructionsList}>
                //     {/* Add an empty line */}
                //     <div
                //       id={`dropdown-${1}`} // Use unique ID for each dropdown
                //       ref={dropdownRef}
                //       className={`${styles.dropdownMenu} ${dropdownPosition === 'above'
                //         ? styles.dropdownAbove
                //         : ''
                //         }`}
                //     >
                //       <div
                //         onClick={() =>
                //         }
                //       >
                //         Insert New Step
                //       </div>
                //     </div>
                //     <div className={styles.instructionItem}> </div>
                //     <div className={styles.block}>
                //       <div className={styles.noDataMessage}>No data found</div>
                //     </div>
                //   </div>
                // </div>
                // Render default block if groupedData is empty
                <div className={styles.block}>
                  <div className={`${styles.blockHeader}`}>
                    <span className={styles.blockName}>{botJobName}</span>
                    <span className={styles.blockOrderNumber}>(AR Web) No Blocks were created yet</span>
                  </div>
                  <div className={styles.instructionsList}>
                    {/* Add an empty line */}
                    <div
                      id={`dropdown-${1}`} // Use unique ID for each dropdown
                      ref={dropdownRef}
                      className={`${styles.dropdownMenu} ${dropdownPosition === 'above'
                        ? styles.dropdownAbove
                        : ''
                        }`}
                    >
                      <div onClick={() => setCreateBlockOpen(true)}>Create New Block</div>
                    </div>
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
                    <BlockCard
                      key={blockGroupIndex}
                      blockDraggable={findText.trim().length === 0}
                      onBlockDragStart={handleBlockDragStart(index, Number(blockData.instructions[0].blockId))}
                      onBlockDragOver={handleGridDragOver}
                      onBlockDrop={handleBlockDrop(index)}
                      onBlockDragEnd={handleBlockDragEnd}
                      collapsed={collapsedBlocks.has(Number(blockData.instructions[0].blockId))}
                      header={<BlockHeader
                        blockActive={blockData.instructions[0].blockActive}
                        blockOrderNumber={blockData.instructions[0].blockOrderNumber}
                        blockName={blockData.blockName ?? ""}
                        instructionCount={blockData.instructions.length}
                        collapsed={collapsedBlocks.has(Number(blockData.instructions[0].blockId))}
                        isEditing={editingBlockId === Number(blockGroupIndex)}
                        editingName={blockName}
                        nameInputRef={blockRef}
                        findText={findText}
                        canAddToMemory={blockData.instructions.some(instruction => memoryCapabilities.get(instruction.id)?.canAdd)}
                        isFirstBlock={index === 0}
                        blockDeleteTitle={blockDeleteCapabilities.get(Number(blockData.instructions[0].blockId))?.reason}
                        blockDeleteDimmed={!blockDeleteCapabilities.get(Number(blockData.instructions[0].blockId))?.canDelete}
                        renderHighlighted={renderHighlighted}
                        exportFileNode={renderExportFile(String(blockData.exportFile))}
                        excelGotoNode={excelGotoInstruction &&
                          blockData.instructions[0].blockOrderNumber === excelGotoInstruction.blockOrderNumber ? (
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
                              title="Open Command Editor"
                              onClick={() => handleOpenCommandEditor(excelGotoInstruction)}
                            />
                            <DeleteButton
                              title={memoryCapabilities.get(Number(excelGotoInstruction.id))?.deleteReason || 'Delete instruction'}
                              dimmed={!memoryCapabilities.get(Number(excelGotoInstruction.id))?.canDelete}
                              onClick={() => handleRemoveInstruction(Number(excelGotoInstruction.id))}
                            />
                          </div>
                        ) : null}
                        onToggleStatus={() => handleBlockStatus(blockData.instructions[0].blockId)}
                        onToggleCollapse={() => toggleBlockCollapsed(Number(blockData.instructions[0].blockId))}
                        onChangeName={setBlockName}
                        onSaveName={() => handleSaveBlockName(Number(blockData.instructions[0].blockId))}
                        onAddToMemory={(e) => { e.stopPropagation(); handleAddBlockToMemory(blockData.instructions); }}
                        onRollback={() => handleRollbackBlock(Number(blockData.instructions[0].blockId))}
                        onMoveUp={() => handleMoveBlockUp(Number(blockData.instructions[0].blockId))}
                        onMoveDown={() => handleMoveBlockDown(Number(blockData.instructions[0].blockId))}
                        onEditName={() => handleEditBlock(Number(blockData.instructions[0].blockId), blockData.blockName)}
                        onExcelFile={() => handleExcelFileBlockName(Number(blockData.instructions[0].blockId), blockData.blockName, Number(blockData.instructions[0].blockOrderNumber), blockData.exportFile)}
                        onCreateComponent={() => handleCreateComponent(Number(blockData.instructions[0].blockId))}
                        onDeleteBlock={() => handleRemoveBlock(Number(blockData.instructions[0].blockId))}
                      />}
                      list={<InstructionList
                        droppableId={blockGroupIndex}
                        instructions={blockData.instructions}
                        blockName={blockData.blockName ?? ""}
                        findText={findText}
                        dropZone={activeDraggedInstructionId === null ? 'none' : (memoryCapabilities.get(activeDraggedInstructionId)?.allowedBlockIds.includes(Number(blockData.instructions[0].blockId)) ? 'valid' : 'invalid')}
                        instructionMatchesFind={instructionMatchesFind}
                        onListDragOver={handleGridDragOver}
                        onListDrop={handleListDrop(blockGroupIndex, blockData.instructions.length)}
                        renderRow={(instruction, index) => (
                          <InstructionRow
                            instruction={instruction}
                            onRowDragStart={handleRowDragStart(blockGroupIndex, index, instruction)}
                            onRowDragOver={handleGridDragOver}
                            onRowDrop={handleRowDrop(blockGroupIndex, index)}
                            onRowDragEnd={handleRowDragEnd}
                            capability={memoryCapabilities.get(instruction.id)}
                            findText={findText}
                            dropdownOpen={openDropdown === instruction.id}
                            isExecuting={instruction.id === executionId}
                            executionState={executionState}
                            isEditing={editingInstructionId === instruction.id}
                            instructionName={instructionName}
                            nameInputRef={instructionRef}
                            renderHighlighted={renderHighlighted}
                            operations={renderOperations(instruction, instructionsData)}
                            deviceOptionsRow={renderDeviceOptionsRow(instruction)}
                            editButton={renderEditButton(instruction.actions, editImage, instruction)}
                            moveButtons={renderMoveButtons(instruction.id)}
                            testClick={renderTestClick(instruction.actions, instruction)}
                            onChangeName={setInstructionName}
                            onSaveName={() => handleSaveInstruction(instruction.id)}
                            onMoveUp={() => handleMoveRowUp(instruction.id)}
                            onMoveDown={() => handleMoveRowDown(instruction.id)}
                            onToggleStatus={() => handleInstructionStatus(instruction.id, blockData.instructions)}
                            onAddToMemory={(e) => { e.stopPropagation(); handleAddToMemory(instruction); }}
                            onRemove={() => handleRemoveInstruction(instruction.id)}
                            onOpenCommandEditor={() => handleOpenCommandEditor(instruction)}
                          />
                        )}
                      />}
                    />
                  ))
              )}
        </div >
      </div>
    </div >
  );

};

export default GridItem;
