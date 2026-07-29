import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SaveComponentContext } from '../../../SaveComponentPanel';
import { useBotJobDetailsController } from '../../useBotJobDetailsController';
import { useWebSocket } from '../../../useWebSocket';
import { useInstructionFind } from './useInstructionFind';
import { useBlockCollapse } from './useBlockCollapse';
import { useInstructionFocus } from './useInstructionFocus';
import { useGridAlerts } from './useGridAlerts';
import { useExecutionState } from './useExecutionState';
import { useInstructionMemory } from './useInstructionMemory';
import { useExcelExport } from './useExcelExport';
import { useBlockReorder } from './useBlockReorder';
import { useGridData } from './useGridData';
import type { UseInstructionGridProps } from '../types/instructionGrid.types';
import type {
  MemoryInstructionGroupBlock,
  MemoryInstructionGroupRow,
} from '../../../memoryList.contract';
import {
  BOT_JOB_INSTRUCTION_GRID_POLICY,
  COMPONENT_INSTRUCTION_GRID_POLICY,
} from '../instructionGrid.policy';
import { buildInstructionRelationshipGraph } from '../domain/instructionRelationshipGraph';
import type { InstructionRelationshipEdge } from '../domain/instructionRelationshipGraph';
import { buildBotJobRelationshipFacts } from '../domain/instructionRelationshipFacts';

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
  workspaceEpochInitial = 0,
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
    alertAlternateAction, setAlertAlternateAction,
    handleClose,
  } = useGridAlerts();

  const { executionId, setExecutionId, executionState, setExecutionState } = useExecutionState();
  const { findText, setFindText, renderHighlighted } = useInstructionFind();
  const { collapsedBlocks, expandBlock, toggleBlockCollapsed } = useBlockCollapse();
  const focusInstructionTarget = useInstructionFocus({
    containerRef: gridScrollRef,
    expandBlock,
    clearFind: () => setFindText(''),
  });
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
    handleAddToMemory, handleAddConnectedGroupToMemory: stageConnectedGroupToMemory,
    handleAddBlockToMemory: stageBotJobBlockToMemory,
    handleStageComponentBlock: stageComponentBlockToMemory,
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
    variableLinks,
    relationshipChipsV1,
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
    workspaceEpoch: workspaceEpochInitial,
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

  const relationshipEdgesByInstruction = useMemo(() => {
    const edgesByInstruction = new Map<number, InstructionRelationshipEdge[]>();
    if (
      workspacePolicy.kind !== 'BOT_JOB'
      || !relationshipChipsV1
      || !moveGraphRevision
      || !Number.isSafeInteger(homeBankingId)
      || homeBankingId <= 0
      || botJobId == null
      || !Number.isSafeInteger(botJobId)
      || botJobId <= 0
    ) {
      return edgesByInstruction;
    }

    const facts = buildBotJobRelationshipFacts({
      homeBankingId,
      botJobId,
      instructions: instructionsData,
      blocks: workspaceBlocks,
      variables: variableLinks,
    });
    if (!facts) return edgesByInstruction;

    const append = (
      instructionId: number,
      edge: InstructionRelationshipEdge,
    ) => {
      const current = edgesByInstruction.get(instructionId) ?? [];
      current.push(edge);
      edgesByInstruction.set(instructionId, current);
    };

    buildInstructionRelationshipGraph(facts).edges.forEach((edge) => {
      if (edge.source.entity === 'INSTRUCTION') {
        append(edge.source.id, edge);
        return;
      }
      if (edge.source.entity !== 'VARIABLE') return;
      instructionsData.forEach((instruction) => {
        if (instruction.variableId === edge.source.id) {
          append(instruction.id, edge);
        }
      });
    });

    return edgesByInstruction;
  }, [
    workspacePolicy.kind,
    relationshipChipsV1,
    moveGraphRevision,
    homeBankingId,
    botJobId,
    instructionsData,
    workspaceBlocks,
    variableLinks,
  ]);

  /*
   * Confirmation dialogs outlive the render that opened them. Keep an
   * identity snapshot of the latest authoritative graph so a realtime refresh
   * cannot make an old confirmation callback stage an obsolete closure.
   */
  const memoryStageContextRef = useRef({
    instructionsData,
    memoryCapabilities,
    blockDeleteCapabilities,
    moveGraphRevision,
  });
  memoryStageContextRef.current = {
    instructionsData,
    memoryCapabilities,
    blockDeleteCapabilities,
    moveGraphRevision,
  };

  const showMemoryStageFailure = (reason: string) => {
    setAlertMessageHeader('Memory List Selection Refused');
    setAlertMessageBody(reason);
    setAlertMessageFooter('Refresh this workspace before selecting the instruction again.');
    setErrorFlag(true);
    setAlertOnConfirm(undefined);
    setAlertAlternateAction(undefined);
  };

  const handleAddConnectedGroupToMemory = (
    instruction: (typeof instructionsData)[number],
  ) => {
    const capability = memoryCapabilities.get(instruction.id);
    if (!capability?.canAdd) {
      showMemoryStageFailure(
        capability?.addReason || capability?.reason
          || 'This instruction cannot be added to Memory List.',
      );
      return;
    }
    const groupRows = capability.memoryGroupRows ?? [];
    const groupBlocks = capability.memoryGroupBlocks ?? [];
    const stageContext = memoryStageContextRef.current;
    const stage = (selectionScope: 'FULL' | 'DIRECT') => {
      handleClose();
      const latest = memoryStageContextRef.current;
      if (
        latest.instructionsData !== stageContext.instructionsData
        || latest.memoryCapabilities !== stageContext.memoryCapabilities
        || latest.moveGraphRevision !== stageContext.moveGraphRevision
      ) {
        showMemoryStageFailure(
          'The connected instruction graph changed while confirmation was open.',
        );
        return;
      }
      const result = stageConnectedGroupToMemory(
        instruction,
        stageContext.instructionsData,
        stageContext.moveGraphRevision,
        selectionScope,
      );
      if (!result.ok) showMemoryStageFailure(result.reason);
    };
    if (groupRows.length <= 1 && groupBlocks.length === 0) {
      stage('FULL');
      return;
    }

    const visibleRows = groupRows.slice(0, 5).map(
      (row) => `#${row.order} ${row.name || row.action}`,
    );
    if (groupRows.length > visibleRows.length) {
      visibleRows.push(`+ ${groupRows.length - visibleRows.length} more connected instruction(s)`);
    }
    groupBlocks.forEach((block) => {
      visibleRows.push(
        `Complete Block #${block.blockOrderNumber ?? block.blockId} `
          + `${block.blockName || block.blockId}`,
      );
    });
    const directSelection = capability.directMemorySelection;
    const directRows = directSelection?.memoryGroupRows ?? [];
    const directBlocks = directSelection?.memoryGroupBlocks ?? [];
    const fullRowIds = new Set(groupRows.map((row) => row.id));
    const fullBlockIds = new Set(groupBlocks.map((block) => block.blockId));
    const sameSelectionMembers = fullRowIds.size === directRows.length
      && fullBlockIds.size === directBlocks.length
      && directRows.every((row) => fullRowIds.has(row.id))
      && directBlocks.every((block) => fullBlockIds.has(block.blockId));
    const directAvailable = directSelection?.canAdd === true
      && directRows.length > 0
      && !sameSelectionMembers;
    if (directAvailable) {
      visibleRows.push('');
      visibleRows.push(
        `Direct steps option (${directRows.length} instruction`
          + `${directRows.length === 1 ? '' : 's'}):`,
      );
      directRows.slice(0, 5).forEach((row) => {
        visibleRows.push(`#${row.order} ${row.name || row.action}`);
      });
      if (directRows.length > 5) {
        visibleRows.push(`+ ${directRows.length - 5} more direct instruction(s)`);
      }
      directBlocks.forEach((block) => {
        visibleRows.push(
          `Required Block #${block.blockOrderNumber ?? block.blockId} `
            + `${block.blockName || block.blockId}`,
        );
      });
    }
    setAlertMessageHeader(
      `Add ${groupRows.length} connected instruction${groupRows.length === 1 ? '' : 's'} to Memory List?`,
    );
    setAlertMessageBody(visibleRows.join('\n'));
    setAlertMessageFooter(
      'The complete connected group will be staged together. '
        + 'Parent, child, Block, and Variable links will be preserved. '
        + (directAvailable
          ? 'Choose GET IT + PARENTS for the displayed direct steps, '
            + 'or GET ALL BETWEEN for the complete connected group.'
          : ''),
    );
    setErrorFlag(false);
    setAlertOnConfirm(() => () => stage('FULL'));
    setAlertAlternateAction(
      directAvailable
        ? {
            label: 'GET IT + PARENTS',
            onAction: () => stage('DIRECT'),
            title: 'Stage only the parent/direct ID-connected instructions shown above',
          }
        : undefined,
    );
  };

  const handleAddBlockToMemory = (
    blockInstructions: (typeof instructionsData),
  ) => {
    const first = blockInstructions[0];
    if (!first || workspacePolicy.kind !== 'BOT_JOB') {
      showMemoryStageFailure('This Bot Job Block cannot be added to Memory List.');
      return;
    }

    const selectedIds = new Set(blockInstructions.map((instruction) => instruction.id));
    const groupRows = new Map<number, MemoryInstructionGroupRow>();
    const groupBlocks = new Map<number, MemoryInstructionGroupBlock>();
    for (const instruction of blockInstructions) {
      const capability = memoryCapabilities.get(instruction.id);
      if (
        capability?.canAdd !== true
        || !capability.memoryGroupKey?.trim()
        || !Array.isArray(capability.memoryGroupRows)
      ) {
        showMemoryStageFailure(
          capability?.addReason || capability?.reason
            || 'A connected instruction capability is stale.',
        );
        return;
      }
      capability.memoryGroupRows.forEach((row) => groupRows.set(row.id, row));
      (capability.memoryGroupBlocks ?? []).forEach(
        (block) => groupBlocks.set(block.blockId, block),
      );
    }
    for (const row of groupRows.values()) {
      const capability = memoryCapabilities.get(row.id);
      if (
        capability?.canAdd !== true
        || !capability.memoryGroupKey?.trim()
        || !Array.isArray(capability.memoryGroupRows)
      ) {
        showMemoryStageFailure(
          'A connected instruction capability is stale. Refresh the instruction grid.',
        );
        return;
      }
    }

    const stageContext = memoryStageContextRef.current;
    const stage = () => {
      handleClose();
      const latest = memoryStageContextRef.current;
      if (
        latest.instructionsData !== stageContext.instructionsData
        || latest.memoryCapabilities !== stageContext.memoryCapabilities
        || latest.moveGraphRevision !== stageContext.moveGraphRevision
      ) {
        showMemoryStageFailure(
          'The connected Bot Job Block changed while confirmation was open.',
        );
        return;
      }
      const result = stageBotJobBlockToMemory(
        blockInstructions,
        stageContext.instructionsData,
        stageContext.moveGraphRevision,
      );
      if (!result.ok) showMemoryStageFailure(result.reason);
    };

    const externalRows = [...groupRows.values()].filter(
      (row) => !selectedIds.has(row.id),
    );
    const externalBlocks = [...groupBlocks.values()].filter(
      (block) => block.blockId !== first.blockId,
    );
    if (externalRows.length === 0 && externalBlocks.length === 0) {
      stage();
      return;
    }

    const details = externalRows.slice(0, 5).map(
      (row) => `#${row.order} ${row.name || row.action}`,
    );
    if (externalRows.length > details.length) {
      details.push(`+ ${externalRows.length - details.length} more connected instruction(s)`);
    }
    externalBlocks.forEach((block) => details.push(
      `Complete Block #${block.blockOrderNumber ?? block.blockId} `
        + `${block.blockName || block.blockId}`,
    ));
    setAlertMessageHeader('Add the complete connected Bot Job Block to Memory List?');
    setAlertMessageBody(details.join('\n'));
    setAlertMessageFooter(
      'The complete dependency group will be staged atomically and kept together.',
    );
    setErrorFlag(false);
    setAlertOnConfirm(() => stage);
    setAlertAlternateAction(undefined);
  };

  const handleStageComponentBlock = (
    blockInstructions: (typeof instructionsData),
    sourceRevision: string,
  ) => {
    const first = blockInstructions[0];
    const capability = first
      ? blockDeleteCapabilities.get(first.blockId)
      : undefined;
    if (!first || capability?.canAddToMemory !== true) {
      showMemoryStageFailure(
        capability?.addReason || 'This connected Component Block cannot be added to Memory List.',
      );
      return;
    }
    const stageContext = memoryStageContextRef.current;
    const stage = () => {
      handleClose();
      const latest = memoryStageContextRef.current;
      if (
        latest.instructionsData !== stageContext.instructionsData
        || latest.blockDeleteCapabilities !== stageContext.blockDeleteCapabilities
        || latest.moveGraphRevision !== stageContext.moveGraphRevision
        || latest.moveGraphRevision !== sourceRevision
      ) {
        showMemoryStageFailure(
          'The connected Component Block changed while confirmation was open.',
        );
        return;
      }
      const result = stageComponentBlockToMemory(
        blockInstructions,
        instructionsData,
        sourceRevision,
        capability,
      );
      if (!result.ok) showMemoryStageFailure(result.reason);
    };
    const externalRows = (capability.memoryGroupRows ?? []).filter(
      (row) => row.blockId !== first.blockId,
    );
    const requiredBlocks = (capability.memoryGroupBlocks ?? []).filter(
      (block) => block.blockId !== first.blockId,
    );
    if (externalRows.length === 0 && requiredBlocks.length === 0) {
      stage();
      return;
    }

    const details = externalRows.slice(0, 5).map(
      (row) => `#${row.order} ${row.name || row.action}`,
    );
    if (externalRows.length > details.length) {
      details.push(`+ ${externalRows.length - details.length} more connected instruction(s)`);
    }
    requiredBlocks.forEach((block) => details.push(
      `Complete Block #${block.blockOrderNumber ?? block.blockId} `
        + `${block.blockName || block.blockId}`,
    ));
    setAlertMessageHeader('Add the complete connected Component Block to Memory List?');
    setAlertMessageBody(details.join('\n'));
    setAlertMessageFooter(
      'External parent, Variable, and GOTO dependencies will be staged with this Block.',
    );
    setErrorFlag(false);
    setAlertOnConfirm(() => stage);
    setAlertAlternateAction(undefined);
  };

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
    alertOnConfirm, alertAlternateAction, handleClose,
    // useExecutionState
    executionId, executionState,
    // useInstructionFind
    findText, setFindText, renderHighlighted,
    // useBlockCollapse
    collapsedBlocks, expandBlock, toggleBlockCollapsed, focusInstructionTarget,
    // useExcelExport
    excelExportContext, excelExportDirectory, choosingExcelExportDirectory,
    handleExcelFileBlockName, submitExcelExport, chooseExcelExportDirectory, closeExcelExport,
    // useInstructionMemory
    memorySteps, memoryItemCount, memoryBlockOptions, createBlockOpen, setCreateBlockOpen,
    memoryCapabilities, requestMemoryListOpen,
    handleAddToMemory, handleAddConnectedGroupToMemory,
    handleAddBlockToMemory, handleStageComponentBlock,
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
    relationshipEdgesByInstruction,
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
