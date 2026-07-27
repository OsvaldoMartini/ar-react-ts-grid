import { useState, useEffect, useRef, useCallback } from 'react';
import { SaveComponentContext } from '../../../SaveComponentPanel';
import { useBotJobDetailsController } from '../../useBotJobDetailsController';
import { useWebSocket } from '../../../useWebSocket';
import { useInstructionFind } from './useInstructionFind';
import { useBlockCollapse } from './useBlockCollapse';
import { useGridAlerts } from './useGridAlerts';
import { useExecutionState } from './useExecutionState';
import { useInstructionMemory } from './useInstructionMemory';
import { useExcelExport } from './useExcelExport';
import { useBlockReorder } from './useBlockReorder';
import { useGridData } from './useGridData';
import type { UseInstructionGridProps } from '../types/instructionGrid.types';
import {
  BOT_JOB_INSTRUCTION_GRID_POLICY,
  COMPONENT_INSTRUCTION_GRID_POLICY,
} from '../instructionGrid.policy';

// Phase 6, step 10 — the composition-root hook. GridItem's hook wiring
// (WebSocket, identity state, controller, every sub-hook, the UI refs/state,
// and the non-render effects) is relocated here VERBATIM; no behavior change.
// GridItem consumes the returned bag and stays purely presentational.
export function useInstructionGrid({
  homeBankingIdInitial,
  data,
  initialBlocks,
  socketPort,
  sessionId,
  botJobIdInitial,
  botJobNameInitial,
  onSessionOpen,
  onDetachedClose,
  workspaceMode = 'BOT_JOB',
}: UseInstructionGridProps) {
  const workspacePolicy = workspaceMode === 'COMPONENT'
    ? COMPONENT_INSTRUCTION_GRID_POLICY
    : BOT_JOB_INSTRUCTION_GRID_POLICY;
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const gridScrollRef = useRef<HTMLDivElement>(null);
  // const [homeBanking, setHomeBanking] = useState<number>(homeBankingId);
  // const [botJobId, setBotJobId] = useState<number>(botJobId);
  // const [botJobName, setBotJobName] = useState<string>(botJobName);

  // Use state to manage the instructions data
  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [blockId, setBlockId] = useState<number | null>(-1);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);
  useEffect(() => {
    setHomeBankingId(homeBankingIdInitial);
    setBotJobId(botJobIdInitial);
    setBotJobName(botJobNameInitial);
    setBlockId(-1);
  }, [homeBankingIdInitial, botJobIdInitial, botJobNameInitial]);
  const botJobHeader = useBotJobDetailsController({
    webSocket, connected, messages, sessionId, homeBankingId, botJobId,
    // Components needs the same post-connect bootstrap handshake. The backend
    // responds first, then publishes the correct grid payload for componentTasks.
    enabled: true,
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
  const [saveComponentContext, setSaveComponentContext] = useState<SaveComponentContext | null>(null);

  // Memory list: steps hand-picked via the row "+" button, kept in insertion order.
  // Presentation lives in the one detached Memory List workspace.
  const {
    memorySteps, setMemorySteps,
    componentMemoryItems, setComponentMemoryItems, memoryItemCount,
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
    handleAddToMemory, handleAddBlockToMemory,
    handleRemoveFromMemory, handleRemoveComponentMemoryItem,
  } = useInstructionMemory(data, workspacePolicy);
  // Phase 6, step 9 — the grid DATA LAYER (core grid state, drag state, refs, the
  // WebSocket-driven effects, and every mutation/drag handler) lives in useGridData.
  // GridItem feeds it the identity state, alert/execution/find/memory/excel surfaces,
  // and renders the handlers it returns. Extracted verbatim; no behavior change.
  const {
    instructionsData, setInstructionsData,
    workspaceBlocks, setWorkspaceBlocks,
    groupedData,
    setIsDataReordered,
    excelGotoInstruction,
    dropdownPosition,
    editingInstructionId, instructionName, setInstructionName,
    editingBlockId, blockName, setBlockName,
    activeDraggedInstructionId,
    moveGraphRevision,
    blockDeleteCapabilities,
    gridActionNotice,
    dismissGridActionNotice,
    handleCreateNewBlock,
    handleBlockStatus,
    handleSaveBlockName,
    handleEditBlock,
    handleRollbackBlock,
    handleCreateComponent,
    handleRemoveBlock,
    handleOpenCommandEditor,
    handleRemoveInstruction,
    handleInstructionStatus,
    handleInstructionForceChange,
    handleEditInstruction,
    handleSaveInstruction,
    handleMoveRowUp,
    handleMoveRowDown,
    handleRowSelectedClick,
    submitSaveComponent,
    handleGridDragOver,
    handleListDrop,
    handleRowDragStart,
    handleRowDrop,
    handleRowDragEnd,
  } = useGridData({
    data, initialBlocks, homeBankingIdInitial, botJobIdInitial,
    sessionId, socketPort, onSessionOpen, onDetachedClose, workspacePolicy,
    webSocket, connected, messages,
    homeBankingId, botJobId, botJobName,
    setHomeBankingId, setBotJobId, setBotJobName, setBlockId,
    gridScrollRef, setOpenDropdown,
    saveComponentContext, setSaveComponentContext,
    setErrorFlag, setAlertImage, setAlertClass,
    setAlertMessageHeader, setAlertMessageBody, setAlertMessageFooter, setAlertOnConfirm, handleClose,
    setExecutionId, setExecutionState,
    findText,
    memorySteps, componentMemoryItems, memoryTargetBlockId, memoryBlockOptions, memoryCapabilities,
    pendingMemoryMove, memoryMoveStatus, memoryListOpenVersion,
    setMemorySteps, setComponentMemoryItems, setMemoryTargetBlockId, setMemoryBlockOptions, setMemoryCapabilities,
    setPendingMemoryMove, setMemoryMoveStatus, setMemoryListOpenVersion, setCreateBlockOpen,
    handleRemoveFromMemory, handleRemoveComponentMemoryItem,
    memoryListOpenRequestedRef, memoryListOpenedRef, memoryListOpenPendingRequestRef, memoryListOwnerEpochRef,
    pendingExcelExportDirectoryRequestRef, setChoosingExcelExportDirectory, setExcelExportDirectory,
  });

  // Whole-block reordering (drag + up/down buttons) lives in useBlockReorder.
  const {
    dragBlockRef, commitBlockReorder,
    handleBlockDragStart, handleBlockDrop, handleBlockDragEnd,
    sortedBlockIndex, handleMoveBlockUp, handleMoveBlockDown,
  } = useBlockReorder({
    groupedData, instructionsData, setInstructionsData, setIsDataReordered,
    workspaceBlocks, setWorkspaceBlocks,
    webSocket, connected, botJobId, botJobName, homeBankingId,
    targetSessionId: workspacePolicy.targetSessionId,
  });

  // Native block reorder (drag whole blocks + up/down buttons) now lives in
  // useBlockReorder (destructured above), including the window.__blockReorder hook.

  // Memoized function to handle outside clicks on the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpenDropdown(null); // Close the dropdown if clicked outside
    }
  }, [dropdownRef]);


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

  return {
    // useWebSocket
    webSocket, connected, reconnectAttempts, messages, error,
    workspacePolicy,
    // identity state
    homeBankingId, botJobId, botJobName,
    // UI refs
    gridScrollRef, instructionRef, blockRef, dropdownRef,
    // UI state
    openDropdown,
    saveComponentContext, setSaveComponentContext,
    // bot job header controller
    botJobHeader,
    // useGridAlerts
    errorFlag, setErrorFlag,
    alertImage, alertClass,
    alertMessageHeader, setAlertMessageHeader,
    alertMessageBody, setAlertMessageBody,
    alertMessageFooter, setAlertMessageFooter,
    alertOnConfirm, handleClose,
    // useExecutionState
    executionId, executionState,
    // useInstructionFind
    findText, setFindText, renderHighlighted,
    // useBlockCollapse
    collapsedBlocks, toggleBlockCollapsed,
    // useExcelExport
    excelExportContext, excelExportDirectory, choosingExcelExportDirectory,
    handleExcelFileBlockName, submitExcelExport, chooseExcelExportDirectory, closeExcelExport,
    // useInstructionMemory
    memorySteps, memoryItemCount, memoryBlockOptions, createBlockOpen, setCreateBlockOpen,
    memoryCapabilities, requestMemoryListOpen,
    handleAddToMemory, handleAddBlockToMemory,
    // useGridData
    instructionsData, setInstructionsData,
    workspaceBlocks,
    groupedData,
    excelGotoInstruction,
    dropdownPosition,
    editingInstructionId, instructionName, setInstructionName,
    editingBlockId, blockName, setBlockName,
    activeDraggedInstructionId,
    moveGraphRevision,
    blockDeleteCapabilities,
    gridActionNotice,
    dismissGridActionNotice,
    handleCreateNewBlock,
    handleBlockStatus,
    handleSaveBlockName,
    handleEditBlock,
    handleRollbackBlock,
    handleCreateComponent,
    handleRemoveBlock,
    handleOpenCommandEditor,
    handleRemoveInstruction,
    handleInstructionStatus,
    handleInstructionForceChange,
    handleEditInstruction,
    handleSaveInstruction,
    handleMoveRowUp,
    handleMoveRowDown,
    handleRowSelectedClick,
    submitSaveComponent,
    handleGridDragOver,
    handleListDrop,
    handleRowDragStart,
    handleRowDrop,
    handleRowDragEnd,
    // useBlockReorder
    handleBlockDragStart, handleBlockDrop, handleBlockDragEnd,
    handleMoveBlockUp, handleMoveBlockDown,
  };
}
