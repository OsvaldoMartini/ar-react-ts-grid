import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  BlockLoopInstructionLoadDTO,
  ComplexMessage,
  ElementDTO,
} from '../../../instructionsMockData';
import { CreateBlockOption, CreateBlockPosition } from '../../../CreateNewBlock';
import { SaveComponentContext } from '../../../SaveComponentPanel';
import { useInstructionDrag } from '../../../useInstructionDrag';
import { useComponentInstructionDrag } from '../../../useComponentInstructionDrag';
import {
  blockOptionsFromInstructions,
  normalizeBlockOptions,
  instructionMemoryItem,
  projectMemorySelections,
} from '../domain/memoryOptions';
import type { InstructionVariableLink } from '../domain/instructionDependency';
import { computeInstructionGraphRevision } from '../domain/instructionGraphRevision';
import {
  groupByBlock,
  reassignInstructionOrderNumbersByBlock,
} from '../domain/grouping';
import {
  normalizeWorkspaceBlocks,
  mergeWorkspaceBlocks,
  workspaceBlocksFromInstructions,
  type WorkspaceBlock,
} from '../domain/workspaceBlocks';
import { buildLaterBlockOrderUpdates } from '../../../instructionSplit';
import type { MemoryListSnapshot } from '../../../memoryList.contract';
import {
  SCANNER_ELEMENT_PANE_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from '../../../scanner/Scanner.sessions';
import type { MemoryCapability, PendingMemoryMove } from './useInstructionMemory';
import type {
  ComponentMemoryListPayload,
  MemoryListItem,
} from '../../../memoryList.contract';
import type { InstructionGridWorkspacePolicy } from '../instructionGrid.policy';
import constructionImage from '../../../../assets/construction.png';
import forbiddenImage from '../../../../assets/forbidden.png';
import warningRedImage from '../../../../assets/warning_red.png';

type BlockDeleteCapability = {
  canDelete: boolean;
  reason: string;
  instructionCount: number;
  deleteRows: { id: number; name: string; action: string; order: number }[];
  canAddToMemory?: boolean;
  addReason?: string;
  memoryGroupKey?: string;
  memoryGroupRows?: MemoryCapability['memoryGroupRows'];
  memoryGroupBlocks?: MemoryCapability['memoryGroupBlocks'];
};

export type GridActionNotice = {
  title: string;
  message: string;
  action: string;
};

export interface UseGridDataDeps {
  // Props
  data: BlockLoopInstructionLoadDTO[];
  initialBlocks?: WorkspaceBlock[];
  homeBankingIdInitial: number;
  botJobIdInitial: number;
  sessionId: string;
  socketPort: number;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
  workspacePolicy: InstructionGridWorkspacePolicy;
  // useWebSocket
  webSocket: WebSocket | null;
  connected: boolean;
  messages: string[];
  // Identity state + setters
  homeBankingId: number;
  botJobId: number | null;
  botJobName: string | null;
  setHomeBankingId: React.Dispatch<React.SetStateAction<number>>;
  setBotJobId: React.Dispatch<React.SetStateAction<number | null>>;
  setBotJobName: React.Dispatch<React.SetStateAction<string | null>>;
  setBlockId: React.Dispatch<React.SetStateAction<number | null>>;
  // UI wiring that stays in GridItem
  gridScrollRef: React.RefObject<HTMLDivElement>;
  setOpenDropdown: React.Dispatch<React.SetStateAction<number | null>>;
  saveComponentContext: SaveComponentContext | null;
  setSaveComponentContext: React.Dispatch<React.SetStateAction<SaveComponentContext | null>>;
  // useGridAlerts setters
  setErrorFlag: React.Dispatch<React.SetStateAction<boolean>>;
  setAlertImage: React.Dispatch<React.SetStateAction<string>>;
  setAlertClass: React.Dispatch<React.SetStateAction<string>>;
  setAlertMessageHeader: React.Dispatch<React.SetStateAction<string | null>>;
  setAlertMessageBody: React.Dispatch<React.SetStateAction<string | ComplexMessage[]>>;
  setAlertMessageFooter: React.Dispatch<React.SetStateAction<string | null>>;
  setAlertOnConfirm: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  handleClose: () => void;
  // useExecutionState setters
  setExecutionId: React.Dispatch<React.SetStateAction<number>>;
  setExecutionState: React.Dispatch<React.SetStateAction<string | undefined>>;
  // useInstructionFind
  findText: string;
  // useInstructionMemory surface
  memorySteps: BlockLoopInstructionLoadDTO[];
  componentMemoryItems: MemoryListItem<ComponentMemoryListPayload>[];
  memoryTargetBlockId: number | null;
  memoryBlockOptions: CreateBlockOption[];
  memoryCapabilities: Map<number, MemoryCapability>;
  pendingMemoryMove: PendingMemoryMove;
  memoryMoveStatus: string;
  memoryListOpenVersion: number;
  setMemorySteps: React.Dispatch<React.SetStateAction<BlockLoopInstructionLoadDTO[]>>;
  setComponentMemoryItems: React.Dispatch<React.SetStateAction<MemoryListItem<ComponentMemoryListPayload>[]>>;
  setMemoryTargetBlockId: React.Dispatch<React.SetStateAction<number | null>>;
  setMemoryBlockOptions: React.Dispatch<React.SetStateAction<CreateBlockOption[]>>;
  setMemoryCapabilities: React.Dispatch<React.SetStateAction<Map<number, MemoryCapability>>>;
  setPendingMemoryMove: React.Dispatch<React.SetStateAction<PendingMemoryMove>>;
  setMemoryMoveStatus: React.Dispatch<React.SetStateAction<string>>;
  setMemoryListOpenVersion: React.Dispatch<React.SetStateAction<number>>;
  setCreateBlockOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleRemoveFromMemory: (id: number) => void;
  handleRemoveComponentMemoryItem: (sourceItemKey: string) => void;
  memoryListOpenRequestedRef: React.MutableRefObject<boolean>;
  memoryListOpenedRef: React.MutableRefObject<boolean>;
  memoryListOpenPendingRequestRef: React.MutableRefObject<string | null>;
  memoryListOwnerEpochRef: React.MutableRefObject<string>;
  // useExcelExport surface
  pendingExcelExportDirectoryRequestRef: React.MutableRefObject<string | null>;
  setChoosingExcelExportDirectory: React.Dispatch<React.SetStateAction<boolean>>;
  setExcelExportDirectory: React.Dispatch<React.SetStateAction<string | undefined>>;
}

/**
 * Phase 6, step 9 — the Bot Job Details grid DATA LAYER. Owns the core grid state
 * (instructionsData/groupedData + reorder bookkeeping), the drag state + the
 * useInstructionDrag submit, the data-layer refs, every WebSocket-driven effect
 * (including the big `messages` router), and all mutation/drag handlers. Extracted
 * VERBATIM from GridItem; the only change is that closure values that are NOT part
 * of the data layer arrive through `deps` (destructured below with identical names,
 * so every moved body is byte-for-byte the original). No behavior change.
 *
 * GridItem keeps the JSX, render helpers, UI-only state, the identity state, the
 * other extracted hooks, and the focus / click-outside effects — it feeds their
 * state/setters in as deps and renders the handlers this hook returns.
 */
export function useGridData(deps: UseGridDataDeps) {
  const {
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
  } = deps;
  const {
    kind: workspaceKind,
    targetSessionId,
    updateOperation,
    rowMoveVerb,
    commandEditorTargetSessionId,
  } = workspacePolicy;

  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(data);
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>(
    () => {
      const authoritative = normalizeWorkspaceBlocks(initialBlocks ?? []);
      return authoritative.length > 0 ? authoritative : workspaceBlocksFromInstructions(data);
    },
  );
  const pendingScrollTopRef = useRef<number | null>(null);
  const [excelGotoInstruction, setExcelGotoInstruction] = useState<BlockLoopInstructionLoadDTO | null>(null);

  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; exportFile?: string; instructions: BlockLoopInstructionLoadDTO[] } }>({});
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);

  const [dropdownPosition, setDropdownPosition] = useState('below'); // Default to 'below'
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionName, setInstructionName] = useState<string>('');
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockName, setBlockName] = useState<string>('');

  const pendingSplitRequestRef = useRef<string | null>(null);
  const pendingCommandEditorOpenRequestRef = useRef<string | null>(null);
  const processedMessagesRef = useRef(0);
  const capabilityRequestCounterRef = useRef(0);
  const pendingCapabilityRequestRef = useRef<{
    requestId: string;
    targetSessionId: string;
    homeBankingId: number;
    botJobId: number | null;
  } | null>(null);

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null || !gridScrollRef.current) return;
    gridScrollRef.current.scrollTop = pendingScrollTopRef.current;
    pendingScrollTopRef.current = null;
  }, [instructionsData]);

  const [activeDraggedInstructionId, setActiveDraggedInstructionId] = useState<number | null>(null);
  const [pendingDragPreview, setPendingDragPreview] = useState<{ requestId: string; result: any } | null>(null);
  const [blockDeleteCapabilities, setBlockDeleteCapabilities] = useState<Map<number, BlockDeleteCapability>>(new Map());
  const [moveGraphRevision, setMoveGraphRevision] = useState('');
  const [gridActionNotice, setGridActionNotice] = useState<GridActionNotice | null>(null);
  const dismissGridActionNotice = useCallback(() => setGridActionNotice(null), []);
  const propIdentityRef = useRef(
    `${workspaceKind}:${homeBankingIdInitial}:${botJobIdInitial}`,
  );
  const propHomeBankingIdRef = useRef(homeBankingIdInitial);
  const propBotJobIdRef = useRef(botJobIdInitial);
  const initialBlocksSignature = (initialBlocks ?? [])
    .map(block => [
      block.blockId,
      block.blockOrderNumber,
      block.blockName,
      block.blockActive,
      block.blockWait,
      block.exportFile ?? '',
    ].join(':'))
    .join('|');
  const initialDataSignature = JSON.stringify(data);
  const initialBlocksSignatureRef = useRef(initialBlocksSignature);
  const initialDataSignatureRef = useRef(initialDataSignature);
  useEffect(() => {
    // Only immutable input props can identify a parent-driven workspace replacement.
    // Mutable socket/controller identity changes are normal during bootstrap and must not
    // reset a live authoritative grid back to stale/empty initial props.
    const nextIdentity = `${workspaceKind}:${homeBankingIdInitial}:${botJobIdInitial}`;
    const identityChanged = propIdentityRef.current !== nextIdentity;
    const initialBlockCatalogChanged =
      initialBlocksSignatureRef.current !== initialBlocksSignature;
    const initialDataChanged =
      initialDataSignatureRef.current !== initialDataSignature;
    if (!identityChanged && !initialBlockCatalogChanged && !initialDataChanged) return;
    const bootstrapIdentityResolution = identityChanged
      && (propHomeBankingIdRef.current <= 0 || propBotJobIdRef.current <= 0)
      && homeBankingIdInitial > 0
      && botJobIdInitial > 0
      && !initialBlockCatalogChanged
      && !initialDataChanged
      && (homeBankingId <= 0 || homeBankingId === homeBankingIdInitial)
      && (botJobId == null || botJobId <= 0 || botJobId === botJobIdInitial);
    propIdentityRef.current = nextIdentity;
    propHomeBankingIdRef.current = homeBankingIdInitial;
    propBotJobIdRef.current = botJobIdInitial;
    initialBlocksSignatureRef.current = initialBlocksSignature;
    initialDataSignatureRef.current = initialDataSignature;
    // A 0 -> valid route/bootstrap transition identifies the authoritative rows
    // already received over the socket; empty unchanged props must not erase them.
    if (bootstrapIdentityResolution) return;
    setInstructionsData(data);
    const authoritative = normalizeWorkspaceBlocks(initialBlocks ?? []);
    setWorkspaceBlocks(
      authoritative.length > 0 ? authoritative : workspaceBlocksFromInstructions(data),
    );
    setGroupedData(groupByBlock(data));
    setMoveGraphRevision('');
    setMemoryCapabilities(new Map());
    setBlockDeleteCapabilities(new Map());
    pendingCapabilityRequestRef.current = null;
    setIsDataReordered(data.length === 0);
  // Prop changes are the synchronization trigger; optimistic row edits must not retrigger it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    initialBlocks,
    initialDataSignature,
    initialBlocksSignature,
    workspaceKind,
    homeBankingIdInitial,
    botJobIdInitial,
  ]);
  const submitBotJobInstructionMove = useInstructionDrag({
    webSocket, connected, graphRevision: moveGraphRevision, botJobId, botJobName,
    homeBankingId, targetSessionId, moveType: rowMoveVerb,
  });
  const submitComponentInstructionMove = useComponentInstructionDrag({
    webSocket, connected, graphRevision: moveGraphRevision, botJobId, botJobName,
    homeBankingId,
  });
  // Keep the mutation transports private to their owning workspaces. In particular,
  // Components never falls through the generic Bot Job ROW_MOVE sender.
  const submitInstructionMove = workspaceKind === 'COMPONENT'
    ? submitComponentInstructionMove
    : submitBotJobInstructionMove;

  useEffect(() => {
    if (workspaceKind === 'COMPONENT') return;
    setMemoryBlockOptions((prev) => normalizeBlockOptions([
      ...prev,
      ...blockOptionsFromInstructions(instructionsData),
    ]));
  }, [instructionsData, workspaceKind]);

  useEffect(() => {
    if (!webSocket || !connected
      || (instructionsData.length === 0 && workspaceBlocks.length === 0)
      || !Number.isSafeInteger(homeBankingId)
      || homeBankingId <= 0
      || botJobId == null
      || !Number.isSafeInteger(Number(botJobId))
      || Number(botJobId) <= 0) return;
    const requestId = `${Date.now()}-${targetSessionId}-capabilities-${++capabilityRequestCounterRef.current}`;
    pendingCapabilityRequestRef.current = {
      requestId,
      targetSessionId,
      homeBankingId,
      botJobId: botJobId == null ? null : Number(botJobId),
    };
    setMoveGraphRevision('');
    setMemoryCapabilities(new Map());
    setBlockDeleteCapabilities(new Map());
    webSocket.send(JSON.stringify({
      type: 'instructionEditor.memoryCapabilities',
      sessionId,
      homeBankingId,
      body: JSON.stringify({ requestId, targetSessionId, botJobId, homeBankingId }),
    }));
  }, [webSocket, connected, instructionsData, workspaceBlocks, botJobId, homeBankingId,
    sessionId, targetSessionId]);

  useEffect(() => {
    if (!memoryListOpenRequestedRef.current && !memoryListOpenedRef.current) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !botJobId || botJobId <= 0) return;
    if (memoryListOpenRequestedRef.current && memoryListOpenPendingRequestRef.current) return;

    const componentWorkspace = workspaceKind === 'COMPONENT';
    const snapshot: MemoryListSnapshot = {
      ownerEpoch: memoryListOwnerEpochRef.current,
      sourceKind: componentWorkspace ? 'COMPONENT' : 'BOT_JOB',
      homeBankingId,
      botJobId,
      botJobName: botJobName || '',
      items: componentWorkspace
        ? componentMemoryItems
        : memorySteps.map((step) => instructionMemoryItem(
          step,
          (step as typeof step & { dependencyGroupKey?: string }).dependencyGroupKey,
          (step as typeof step & { sourceRevision?: string }).sourceRevision || '',
          (step as typeof step & {
            dependencySelectionScope?: 'FULL' | 'DIRECT';
          }).dependencySelectionScope || 'FULL',
        )),
      // Component blocks are reusable sources, never Bot Job destinations.
      blocks: componentWorkspace ? [] : memoryBlockOptions,
      targetBlockId: componentWorkspace ? null : memoryTargetBlockId,
      emptyMessage: componentWorkspace
        ? 'Click "+" on a component instruction or block.'
        : 'Click "+" on a step to add it here.',
      status: memoryMoveStatus || (connected ? 'Memory List ready' : 'Memory List disconnected'),
      busy: componentWorkspace ? false : pendingMemoryMove !== null,
      canApply: componentWorkspace
        ? componentMemoryItems.length > 0
        : memoryTargetBlockId !== null
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
    componentMemoryItems,
    homeBankingId,
    memoryBlockOptions,
    memoryListOpenVersion,
    memoryMoveStatus,
    memorySteps,
    memoryTargetBlockId,
    pendingMemoryMove,
    sessionId,
    webSocket,
    workspaceKind,
  ]);

  // Memory Apply is owned exclusively by the aggregate Java transaction, which clones selected
  // Bot Job rows with fresh IDs. A stale or forged producer command must never reinterpret Apply
  // as ROW_MOVE and remove the live source rows.
  const rejectLegacyMemoryApply = () => {
    console.warn('Ignored legacy producer-side Memory Apply; the backend owns this transaction.');
  };

  // Java backend owns block creation and mints the new blockId. It refreshes the
  // grid through the existing updateInstructions socket path after BLOCK_CREATE.
  const handleCreateNewBlock = (newBlockName: string, position: CreateBlockPosition) => {
    const targetBotJobId = botJobId ?? -1;

    const message = {
      type: 'BLOCK_CREATE',
      requestId: `${Date.now()}-${targetSessionId}-block-create`,
      graphRevision: moveGraphRevision,
      botJobId: targetBotJobId,
      botJobName,
      homeBankingId: homeBankingId,
      sessionId: targetSessionId,
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

  // Drag-and-drop event handler
  const applyDragMove = (result: any, previewRows: { id: number }[]) => {
    const { source, destination, draggableId } = result;
    setActiveDraggedInstructionId(null);
    if (!destination) return;

    const sourceBlockId = Number(source.droppableId);
    const destinationBlockId = Number(destination.droppableId);
    const sourceBlock = groupedData[sourceBlockId];
    const destinationWorkspaceBlock =
      workspaceBlocks.find(block => block.blockId === destinationBlockId);
    const destinationBlock = groupedData[destinationBlockId]
      ?? (destinationWorkspaceBlock
        ? {
            blockName: destinationWorkspaceBlock.blockName,
            exportFile: destinationWorkspaceBlock.exportFile,
            instructions: [] as BlockLoopInstructionLoadDTO[],
          }
        : undefined);
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
    const previewOrder = new Map(
      previewRows.map((row, index) => [Number(row.id), index]),
    );
    const movedInstructions = sourceBlock.instructions
      .filter(instruction => groupIds.has(instruction.id))
      .sort((left, right) => (
        (previewOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER)
        - (previewOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      ));
    const sourceInstructions = sourceBlock.instructions.filter(instruction => !groupIds.has(instruction.id));
    if (movedInstructions.length !== groupIds.size) return;
    let updatedGroupedData = { ...groupedData };
    let deleteBlockId = -1;

    if (sourceBlockId === destinationBlockId) {
      if (workspaceKind === 'COMPONENT') {
        const targetInstruction = sourceBlock.instructions[destination.index];
        // Dropping on any row already carried by the authoritative family is a no-op.
        if (targetInstruction && groupIds.has(targetInstruction.id)) return;

        let insertionIndex = sourceInstructions.length;
        if (targetInstruction) {
          const targetCapability = memoryCapabilities.get(targetInstruction.id);
          const targetUnitIds = new Set(
            (targetCapability?.memoryGroupRows ?? [{ id: targetInstruction.id }])
              .map(row => Number(row.id)),
          );
          const targetIndexes = sourceInstructions
            .map((instruction, index) => (
              targetUnitIds.has(instruction.id) ? index : -1
            ))
            .filter(index => index >= 0);
          if (targetIndexes.length > 0) {
            const sourceFirstIndex = sourceBlock.instructions.findIndex(
              instruction => groupIds.has(instruction.id),
            );
            insertionIndex = sourceFirstIndex < destination.index
              ? Math.max(...targetIndexes) + 1
              : Math.min(...targetIndexes);
          }
        }
        sourceInstructions.splice(insertionIndex, 0, ...movedInstructions);
      } else {
        // Accepted Bot Job behavior remains unchanged during the Components-first pass.
        sourceInstructions.splice(destination.index, 0, ...movedInstructions);
      }
      updatedGroupedData[sourceBlockId] = {
        ...sourceBlock,
        instructions: sourceInstructions.map((instruction, index) => ({
          ...instruction,
          instructionOrderNumber: index + 1,
        })),
      };
    } else {
      const destinationInstructions = [...destinationBlock.instructions];
      let insertionIndex = destination.index;
      if (workspaceKind === 'COMPONENT' && destinationInstructions[destination.index]) {
        const targetInstruction = destinationInstructions[destination.index];
        const targetCapability = memoryCapabilities.get(targetInstruction.id);
        const targetUnitIds = new Set(
          (targetCapability?.memoryGroupRows ?? [{ id: targetInstruction.id }])
            .map(row => Number(row.id)),
        );
        const targetIndexes = destinationInstructions
          .map((instruction, index) => (
            targetUnitIds.has(instruction.id) ? index : -1
          ))
          .filter(index => index >= 0);
        if (targetIndexes.length > 0) insertionIndex = Math.min(...targetIndexes);
      }
      destinationInstructions.splice(insertionIndex, 0, ...movedInstructions);
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
          blockOrderNumber: destinationBlock.instructions[0]?.blockOrderNumber
            ?? destinationWorkspaceBlock?.blockOrderNumber
            ?? instruction.blockOrderNumber,
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
    if (
      workspaceKind === 'COMPONENT'
      && result.source?.droppableId === result.destination.droppableId
    ) {
      const instructionId = Number(result.draggableId);
      const targetInstruction = groupedData[Number(result.destination.droppableId)]
        ?.instructions[result.destination.index];
      const sourceGroupIds = new Set(
        (memoryCapabilities.get(instructionId)?.memoryGroupRows ?? [{ id: instructionId }])
          .map(row => Number(row.id)),
      );
      if (targetInstruction && sourceGroupIds.has(targetInstruction.id)) return;
    }
    if (!webSocket || !connected || !moveGraphRevision) return;
    const requestId = `${Date.now()}-${targetSessionId}-move-preview`;
    setPendingDragPreview({ requestId, result });
    webSocket.send(JSON.stringify({
      type: 'instructionGraph.previewMove',
      sessionId,
      homeBankingId,
      body: JSON.stringify({
        requestId,
        targetSessionId,
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

  useEffect(() => {
    const diagnosticHookName = workspaceKind === 'COMPONENT'
      ? '__componentGridReorder'
      : '__gridReorder';
    const diagnosticReorder = (
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
    (window as any)[diagnosticHookName] = diagnosticReorder;
    return () => {
      if ((window as any)[diagnosticHookName] === diagnosticReorder) {
        delete (window as any)[diagnosticHookName];
      }
    };
  }, [groupedData, onDragEnd, workspaceKind]);

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
            );
            if (workspaceKind === 'COMPONENT') {
              handleRemoveComponentMemoryItem(sourceItemKey.replace(/^COMPONENT:/, ''));
            } else {
              const instructionId = Number(sourceItemKey.replace(/^BOT_JOB:/, ''));
              if (Number.isFinite(instructionId)) handleRemoveFromMemory(instructionId);
            }
          } else if (command === 'CLEAR') {
            if (workspaceKind === 'COMPONENT') setComponentMemoryItems([]);
            else setMemorySteps([]);
          } else if (command === 'SELECT_TARGET_BLOCK') {
            if (workspaceKind === 'COMPONENT') return;
            const selectedBlockId = Number(payload?.blockId);
            setMemoryTargetBlockId(
              Number.isFinite(selectedBlockId) && selectedBlockId > 0 ? selectedBlockId : null,
            );
          } else if (command === 'APPLY') {
            rejectLegacyMemoryApply();
          } else if (command === 'REORDER') {
            // The aggregate Memory List owns the mixed-source display order.
            // Producers apply the ordered sourceItemKeys routed with APPLY.
          } else if (command === 'CREATE_BLOCK') {
            if (workspaceKind === 'COMPONENT') return;
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
            if (workspaceKind !== 'COMPONENT' && Array.isArray(bodyData?.blocks)) {
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
          const pending = pendingCapabilityRequestRef.current;
          const responseBotJobId = bodyData?.botJobId == null ? null : Number(bodyData.botJobId);
          if (!pending
            || bodyData?.requestId !== pending.requestId
            || bodyData?.targetSessionId !== pending.targetSessionId
            || Number(bodyData?.homeBankingId) !== pending.homeBankingId
            || responseBotJobId !== pending.botJobId) {
            return;
          }
          pendingCapabilityRequestRef.current = null;
          if (bodyData?.ok === false) {
            setMoveGraphRevision('');
            setMemoryCapabilities(new Map());
            setBlockDeleteCapabilities(new Map());
            setGridActionNotice({
              title: 'Grid Actions Unavailable',
              message: bodyData?.error
                || 'The backend could not authorize the current instruction grid.',
              action: 'The last valid rows remain visible. Refresh this workspace before changing rows or blocks.',
            });
            return;
          }
          setGridActionNotice(null);
          const variableLinks: InstructionVariableLink[] = Array.isArray(bodyData?.variableLinks)
            ? bodyData.variableLinks.map((candidate: {
                id?: unknown;
                instructionId?: unknown;
              } | null) => ({
                id: Number(candidate?.id),
                instructionId: candidate?.instructionId == null
                  ? null
                  : Number(candidate.instructionId),
              }))
            : [];
          const localMemorySelections = projectMemorySelections(
            instructionsData,
            variableLinks,
            workspaceKind === 'COMPONENT' ? 'COMPONENT_COPY' : 'BOT_JOB_COPY',
          );
          const serverCapabilities = new Map<number, {
            instructionId: number;
            canMove: boolean;
            canDelete: boolean;
            deleteCount?: number;
            reason?: string;
            deleteReason?: string;
            allowedBlockIds?: number[];
            deleteRows?: MemoryCapability['deleteRows'];
          }>();
          if (Array.isArray(bodyData?.capabilities)) {
            bodyData.capabilities.forEach((capability: {
              instructionId: number;
              canMove: boolean;
              canDelete: boolean;
              deleteCount?: number;
              reason?: string;
              deleteReason?: string;
              allowedBlockIds?: number[];
              deleteRows?: MemoryCapability['deleteRows'];
            }) => {
              serverCapabilities.set(Number(capability.instructionId), capability);
            });
          }
          const renderedInstructionIds = new Set(
            instructionsData.map(instruction => instruction.id),
          );
          const backendGraphRevision = typeof bodyData?.graphRevision === 'string'
            ? bodyData.graphRevision.trim().toLowerCase()
            : '';
          const renderedGraphRevision = computeInstructionGraphRevision(
            instructionsData,
            variableLinks,
          );
          const memoryGraphSynchronized =
            renderedInstructionIds.size === instructionsData.length
            && serverCapabilities.size === renderedInstructionIds.size
            && [...renderedInstructionIds].every(
              instructionId => serverCapabilities.has(instructionId),
            )
            && /^[a-f0-9]{64}$/.test(backendGraphRevision)
            // Components are reusable source rows. Their presentation model may be
            // locally normalized before this correlated response arrives, while the
            // server revision still identifies the authoritative database graph.
            // Exact ID coverage prevents an unrelated/stale Component snapshot from
            // enabling Memory actions; ComponentMemoryApplyService revalidates the
            // supplied server revision transactionally before it copies anything.
            && (
              workspaceKind === 'COMPONENT'
              || renderedGraphRevision === backendGraphRevision
            );
          const staleMemoryReason =
            'The instruction graph changed. Refresh this workspace before adding rows or blocks to Memory List.';
          const next = new Map<number, MemoryCapability>();
          instructionsData.forEach((instruction) => {
            const capability = serverCapabilities.get(instruction.id);
            const memorySelection = localMemorySelections.instructions.get(instruction.id);
            next.set(instruction.id, {
              canAdd: memoryGraphSynchronized
                && capability != null
                && memorySelection?.canAdd === true,
              canMove: capability?.canMove === true,
              canDelete: capability?.canDelete === true,
              deleteCount: capability?.deleteCount || 1,
              reason: capability?.reason || '',
              addReason: !memoryGraphSynchronized || capability == null
                ? staleMemoryReason
                : memorySelection?.addReason || '',
              deleteReason: capability?.deleteReason || '',
              allowedBlockIds: Array.isArray(capability?.allowedBlockIds)
                ? capability?.allowedBlockIds ?? []
                : [],
              deleteRows: Array.isArray(capability?.deleteRows)
                ? capability?.deleteRows ?? []
                : [],
              memoryGroupKey: memorySelection?.memoryGroupKey,
              memoryGroupRows: memorySelection?.memoryGroupRows,
              memoryGroupBlocks: memorySelection?.memoryGroupBlocks,
              directMemorySelection: memorySelection?.directMemorySelection,
            });
          });
          setMemoryCapabilities(next);
          const nextBlocks = new Map<number, BlockDeleteCapability>();
          if (Array.isArray(bodyData?.blockCapabilities)) {
            bodyData.blockCapabilities.forEach((capability: {
              blockId: number;
              canDelete: boolean;
              reason?: string;
              instructionCount?: number;
              deleteRows?: BlockDeleteCapability['deleteRows'];
            }) => {
              nextBlocks.set(capability.blockId, {
                canDelete: capability.canDelete === true,
                reason: capability.reason || '',
                instructionCount: capability.instructionCount || 0,
                deleteRows: Array.isArray(capability.deleteRows) ? capability.deleteRows : [],
              });
            });
          }
          localMemorySelections.blocks.forEach((memorySelection, blockId) => {
            const existing = nextBlocks.get(blockId) ?? {
              canDelete: false,
              reason: 'Refresh this workspace before deleting this block.',
              instructionCount: instructionsData.filter(
                (instruction) => instruction.blockId === blockId,
              ).length,
              deleteRows: [],
            };
            nextBlocks.set(blockId, {
              ...existing,
              canAddToMemory: memoryGraphSynchronized && memorySelection.canAdd,
              addReason: memoryGraphSynchronized
                ? memorySelection.addReason
                : staleMemoryReason,
              memoryGroupKey: memorySelection.memoryGroupKey,
              memoryGroupRows: memorySelection.memoryGroupRows,
              memoryGroupBlocks: memorySelection.memoryGroupBlocks,
            });
          });
          setBlockDeleteCapabilities(nextBlocks);
          setMoveGraphRevision(typeof bodyData?.graphRevision === 'string' ? bodyData.graphRevision : '');
        } else if (
          sessionId === parsedMessage.sessionId
          && parsedMessage.operationId === 'instructionEditor.resyncRequired'
        ) {
          const bodyData = typeof parsedMessage.body === 'string'
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;
          pendingCapabilityRequestRef.current = null;
          setMoveGraphRevision('');
          setMemoryCapabilities(new Map());
          setBlockDeleteCapabilities(new Map());
          setGridActionNotice({
            title: 'Components Refresh Required',
            message: bodyData?.error
              || 'The change was saved, but the Components grid could not be refreshed.',
            action: bodyData?.action
              || 'The last valid rows remain visible. Refresh Components before making another change.',
          });
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === updateOperation) {
          const bodyData = typeof parsedMessage.body === "string"
            ? JSON.parse(parsedMessage.body)
            : parsedMessage.body;

          // Only an explicit instruction array is an authoritative grid snapshot. Error,
          // focus, and partial response objects must never erase the last usable client view.
          const hasInstructionSnapshot = Array.isArray(bodyData)
            || (
              bodyData !== null
              && typeof bodyData === 'object'
              && Array.isArray(bodyData.instructions)
            );
          const structuredComponentSnapshot = workspaceKind === 'COMPONENT'
            && !Array.isArray(bodyData);
          const snapshotExplicitlyFailed = !Array.isArray(bodyData)
            && bodyData?.ok === false;
          const snapshotHomeBankingId = Number(
            bodyData?.homeBankingId ?? parsedMessage.homeBankingId,
          );
          const snapshotBotJobId = Number(bodyData?.botJobId);
          const componentSnapshotIdentityValid = workspaceKind !== 'COMPONENT'
            || (
              Number.isSafeInteger(snapshotHomeBankingId)
              && snapshotHomeBankingId > 0
              && (!Number.isSafeInteger(homeBankingId)
                || homeBankingId <= 0
                || snapshotHomeBankingId === homeBankingId)
              && (
                Array.isArray(bodyData)
                || (
                  Number.isSafeInteger(snapshotBotJobId)
                  && snapshotBotJobId > 0
                  && (botJobId == null
                    || Number(botJobId) <= 0
                    || snapshotBotJobId === Number(botJobId))
                )
              )
            );
          const componentSnapshotShapeValid = !structuredComponentSnapshot
            || Array.isArray(bodyData?.blocks);
          if (
            snapshotExplicitlyFailed
            || !hasInstructionSnapshot
            || !componentSnapshotIdentityValid
            || !componentSnapshotShapeValid
          ) {
            pendingCapabilityRequestRef.current = null;
            setMoveGraphRevision('');
            setMemoryCapabilities(new Map());
            setBlockDeleteCapabilities(new Map());
            setGridActionNotice({
              title: 'Grid Refresh Ignored',
              message: bodyData?.error
                || bodyData?.message
                || 'The backend returned an incomplete or stale grid update.',
              action: 'The last valid rows remain visible. Refresh this workspace to request a complete snapshot.',
            });
            return;
          }

          pendingCapabilityRequestRef.current = null;
          setMoveGraphRevision('');
          setMemoryCapabilities(new Map());
          setBlockDeleteCapabilities(new Map());
          pendingScrollTopRef.current = gridScrollRef.current?.scrollTop ?? null;
          setGridActionNotice(null);
          if (workspaceKind === 'COMPONENT') {
            setHomeBankingId(snapshotHomeBankingId);
            if (!Array.isArray(bodyData)) setBotJobId(snapshotBotJobId);
          }

          const detailsData = Array.isArray(bodyData)
            ? bodyData
            : bodyData.instructions;
          const backendBlocks = !Array.isArray(bodyData) && Array.isArray(bodyData.blocks)
            ? bodyData.blocks
            : [];
          const createdBlockId = !Array.isArray(bodyData) ? Number(bodyData.createdBlockId) : -1;

          if (!Array.isArray(bodyData)) {
            const authoritativeBlocks = normalizeWorkspaceBlocks(backendBlocks);
            setWorkspaceBlocks(authoritativeBlocks);
            if (typeof bodyData.botJobId === 'number') {
              setBotJobId(bodyData.botJobId);
            }
            if (typeof bodyData.botJobName === 'string') {
              setBotJobName(bodyData.botJobName);
            }
            if (workspaceKind !== 'COMPONENT') {
              setMemoryBlockOptions(normalizeBlockOptions(authoritativeBlocks));
            }
          }
          if (createdBlockId > 0) {
            setCreateBlockOpen(false);
            if (workspaceKind !== 'COMPONENT') setMemoryTargetBlockId(createdBlockId);
          }

          // Check if detailsData is empty
          if (detailsData.length === 0) {
            // If empty, set elementDTO to an empty array
            setInstructionsData([]);
            setGroupedData({}); // Or set to your initial empty state
            setIsDataReordered(true); // Or false, depending on your logic
            if (workspaceKind !== 'COMPONENT' && bodyData.botJobId !== undefined) {
              setBotJobId(bodyData.botJobId);
            }
            if (workspaceKind !== 'COMPONENT' && bodyData.botJobName !== undefined) {
              setBotJobName(bodyData.botJobName);
            }
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
              setWorkspaceBlocks(current => mergeWorkspaceBlocks(
                current,
                workspaceBlocksFromInstructions(detailsData),
              ));
            }
            if (workspaceKind !== 'COMPONENT' && backendBlocks.length === 0) {
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
  }, [
    messages, onDetachedClose, onSessionOpen, pendingMemoryMove, pendingDragPreview,
    sessionId, socketPort, updateOperation, workspaceKind,
  ]);

  useEffect(() => {
    console.log("Reassigning instruction order numbers");
    if (!isDataReordered && instructionsData.length > 0) {


      const reassignedData = reassignInstructionOrderNumbersByBlock([...instructionsData]);
      const updatedData = reassignedData;

      const gotoInstructionAfterReorder = updatedData.find(
        (instruction) => instruction.actions === 'EXCEL GOTO'
      );

      setInstructionsData(updatedData);
      setExcelGotoInstruction(gotoInstructionAfterReorder || null);
      setGroupedData(groupByBlock(updatedData));

      setIsDataReordered(true);
    }
  }, [instructionsData, isDataReordered, workspaceKind]);

  // Start editing block name
  const handleEditBlock = (blockId: number, currentBlockName: string) => {
    setEditingBlockId(blockId);
    setBlockName(currentBlockName);
  };

  const handleSaveBlockName = (blockId: number) => {
    const workspaceBlock = workspaceBlocks.find(block => block.blockId === blockId);
    if ((!instructionsData || instructionsData.length === 0) && !workspaceBlock) {
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
    setWorkspaceBlocks(current => current.map(block =>
      block.blockId === blockId ? { ...block, blockName } : block
    ));

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
        sessionId: targetSessionId,
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
    const workspaceBlock = workspaceBlocks.find(candidate => candidate.blockId === blockId);

    const currentBlockActive = block?.blockActive ?? workspaceBlock?.blockActive ?? true;

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
    setWorkspaceBlocks(current => current.map(candidate =>
      candidate.blockId === blockId
        ? { ...candidate, blockActive: newBlockActive }
        : candidate
    ));

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
        sessionId: targetSessionId,
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
        sessionId: targetSessionId,
      };

      try {
        webSocket.send(JSON.stringify(message));
        console.log('Sent instructionActive update message:', message);
      } catch (error) {
        console.log('Error sending WebSocket message:', error);
      }
    }
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
          targetSessionId: commandEditorTargetSessionId,
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

  const handleCreateComponent = (blockGroupId: number) => {
    // A reusable component cannot be saved as another component through the
    // Bot Job-only componentSave protocol. The component UI also hides this.
    if (workspaceKind === 'COMPONENT') return;
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
        sessionId: targetSessionId,
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
    let destinationIndex = sourceIndex + 1;
    if (workspaceKind === 'COMPONENT') {
      const groupIds = new Set(
        (memoryCapabilities.get(instructionId)?.memoryGroupRows ?? [{ id: instructionId }])
          .map(row => Number(row.id)),
      );
      const lastGroupIndex = blockInstructions.reduce(
        (last, row, index) => (groupIds.has(row.id) ? index : last),
        -1,
      );
      destinationIndex = blockInstructions.findIndex(
        (row, index) => index > lastGroupIndex && !groupIds.has(row.id),
      );
    }
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
    let destinationIndex = sourceIndex - 1;
    if (workspaceKind === 'COMPONENT') {
      const groupIds = new Set(
        (memoryCapabilities.get(instructionId)?.memoryGroupRows ?? [{ id: instructionId }])
          .map(row => Number(row.id)),
      );
      const firstGroupIndex = blockInstructions.findIndex(row => groupIds.has(row.id));
      destinationIndex = -1;
      for (let index = firstGroupIndex - 1; index >= 0; index -= 1) {
        if (!groupIds.has(blockInstructions[index].id)) {
          destinationIndex = index;
          break;
        }
      }
    }
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
      autoEnter: "",
      defaultValue: instruction.defaultValue,
      blockId: instruction.blockId,
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
      sourceSessionId: targetSessionId,
      operationId: "TEST_STEP",
      instructionId: elementDTO.id,
      blockId: elementDTO.blockId,
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
        sessionId: targetSessionId,
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
    const blockDisplayName = blockInstruction?.blockName
      ?? workspaceBlocks.find(block => block.blockId === blockId)?.blockName
      ?? `Block ${blockId}`;

    // Show confirmation dialog using AlertModal
    setAlertImage(warningRedImage);
    setAlertClass('construction-image');
    setAlertMessageHeader('Delete Block');
    const instructionCount = Math.max(
      capability.instructionCount,
      capability.deleteRows.length,
    );
    setAlertMessageBody(instructionCount > 5
      ? `All ${instructionCount} instructions/steps in "${blockDisplayName}" will be deleted.`
      : capability.deleteRows.length > 0
        ? capability.deleteRows.map(row => ({
            parentNameWithId: `#${row.order} (${row.id}) ${row.name}`,
            connectionLabel: 'Action',
            actions: row.action,
          }))
        : `Delete empty block "${blockDisplayName}"?`);
    setAlertMessageFooter(`Delete "${blockDisplayName}" and ${instructionCount} instruction(s). This action cannot be undone.`);
    setErrorFlag(true);
    setAlertOnConfirm(() => () => executeRemoveBlock(blockId));
    return;
  };

  const executeRemoveBlock = (blockId: number) => {
    // Clear the confirmation dialog
    handleClose();

    const blockInstruction = instructionsData.find(instruction => instruction.blockId === blockId);
    const workspaceBlock = workspaceBlocks.find(block => block.blockId === blockId);
    const ownerBotJobId = blockInstruction?.botJobId ?? botJobId;
    const removedBlockOrderNumber =
      blockInstruction?.blockOrderNumber ?? workspaceBlock?.blockOrderNumber ?? null;

    if (!ownerBotJobId || removedBlockOrderNumber === null) {
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
    const nextWorkspaceBlocks = workspaceBlocks
      .filter(block => block.blockId !== blockId)
      .map(block => block.blockOrderNumber > removedBlockOrderNumber
        ? { ...block, blockOrderNumber: block.blockOrderNumber - 1 }
        : block);
    const updatedData = instructionsData
      .filter(instruction => instruction.blockId !== blockId)
      .map(instruction => instruction.blockOrderNumber > removedBlockOrderNumber
        ? { ...instruction, blockOrderNumber: instruction.blockOrderNumber - 1 }
        : instruction);

    const reassignedData = reassignInstructionOrderNumbersByBlock(updatedData);
    setInstructionsData(reassignedData);
    setWorkspaceBlocks(nextWorkspaceBlocks);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Prepare list of updated blocks
    const blocksToUpdate = nextWorkspaceBlocks.map(block => ({
      blockId: block.blockId,
      botJobId: ownerBotJobId,
      blockOrderNumber: block.blockOrderNumber,
      blockName: block.blockName,
    }));

    // Send WebSocket message
    if (webSocket && connected) {
      const message = {
        type: 'DELETE_BLOCK',
        requestId: `${Date.now()}-${targetSessionId}-block-delete-${blockId}`,
        graphRevision: moveGraphRevision,
        blockId: blockId,
        botJobId: ownerBotJobId,
        botJobName: botJobName,
        updatedBlocks: blocksToUpdate, // Include the list of updated blocks
        homeBankingId: homeBankingId,
        sessionId: targetSessionId,
      };

      webSocket.send(
        JSON.stringify(message),
      );

      console.log(`Sent delete block message for Block ID: ${blockId} with updated blocks:`, message);
    }
  };

  const handleRollbackBlock = (blockId: number) => {
    if (!moveGraphRevision.trim()) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader('Grid Refresh Required');
      setAlertMessageBody(
        'Wait for the authoritative grid revision, then retry the rollback.',
      );
      setErrorFlag(true);
      return;
    }

    // Get the botJobId and blockName from the first instruction
    const firstInstruction = instructionsData.find(instr => instr.blockId === blockId);
    const workspaceBlock = workspaceBlocks.find(block => block.blockId === blockId);
    const ownerBotJobId = firstInstruction?.botJobId ?? botJobId;
    const firstBlockName =
      firstInstruction?.blockName ?? workspaceBlock?.blockName ?? 'Unknown Block';

    if (!ownerBotJobId) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Bot Job not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`No botJobId found for Block ID: ${blockId}`);
      return; // Exit if no botJobId is found
    }

    // Preserve the complete authoritative block catalog before applying the optimistic
    // one-block view. The backend validates this snapshot inside the same transaction
    // that performs the destructive rollback, so a newly-created/reordered empty block
    // cannot be silently deleted by a stale browser request.
    const expectedBlocks = workspaceBlocks.map(block => ({
      blockId: block.blockId,
      botJobId: ownerBotJobId,
      homeBankId: homeBankingId,
      blockOrderNumber: block.blockOrderNumber,
      blockName: block.blockName,
      blockActive: block.blockActive,
      blockWait: block.blockWait,
      exportFile: block.exportFile,
    }));

    // Update all instructions to have blockId  and blockOrderNumber 1
    const updatedData = instructionsData.map(instruction => ({
      ...instruction,
      blockId: blockId,
      blockOrderNumber: 1,
      blockName: firstBlockName,
    }));

    // Reassign instructionOrderNumbers sequentially starting from 1
    const reassignedData = updatedData.map((instruction, index) => ({
      ...instruction,
      instructionOrderNumber: index + 1,
    }));

    // Update the state
    setInstructionsData([...reassignedData]);
    setWorkspaceBlocks([{
      blockId,
      blockOrderNumber: 1,
      blockName: firstBlockName,
      blockActive: workspaceBlock?.blockActive ?? firstInstruction?.blockActive ?? true,
      blockWait: workspaceBlock?.blockWait ?? firstInstruction?.blockWait ?? 0,
      exportFile: workspaceBlock?.exportFile ?? firstInstruction?.exportFile,
    }]);
    setIsDataReordered(false); // Set this to false to trigger the reassignment logic again

    // Send WebSocket message to inform about the rollback
    if (webSocket && connected) {
      const message = {
        type: 'BLOCK_ROLLBACK',
        requestId: `${Date.now()}-${targetSessionId}-block-rollback`,
        graphRevision: moveGraphRevision,
        botJobId: ownerBotJobId,
        blockId: blockId,
        botJobName: botJobName,
        blockName: firstBlockName, // Pass the block name here
        homeBankingId: homeBankingId,
        sessionId: targetSessionId,
        updatedBlocks: expectedBlocks,
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
        sessionId: targetSessionId,
      };
      webSocket.send(JSON.stringify(message));
    }

    setInstructionsData(prev =>
      prev.map(x => (x.id === instructionId ? { ...x, forceCoordinates: nextForceCoordinates } : x))
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
        sessionId: targetSessionId,
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

  const submitSaveComponent = (name: string, description: string) => {
    if (
      workspaceKind === 'COMPONENT'
      || !saveComponentContext
      || !webSocket
      || !connected
      || !botJobId
    ) return;
    webSocket.send(JSON.stringify({
      type: 'componentSave.apply', sessionId, homeBankingId,
      body: JSON.stringify({ ...saveComponentContext, name, description,
        requestId: `${Date.now()}-component-${saveComponentContext.blockId}`,
        sessionId, botJobId, botJobName, homeBankingId }),
    }));
    setSaveComponentContext(null);
  };

  return {
    // core state
    instructionsData,
    setInstructionsData,
    workspaceBlocks,
    setWorkspaceBlocks,
    groupedData,
    setGroupedData,
    isDataReordered,
    setIsDataReordered,
    excelGotoInstruction,
    dropdownPosition,
    editingInstructionId,
    instructionName,
    setInstructionName,
    editingBlockId,
    blockName,
    setBlockName,
    // drag / capability state
    activeDraggedInstructionId,
    moveGraphRevision,
    blockDeleteCapabilities,
    gridActionNotice,
    dismissGridActionNotice,
    // mutation handlers
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
    // drag handlers
    handleGridDragOver,
    handleListDrop,
    handleRowDragStart,
    handleRowDrop,
    handleRowDragEnd,
  };
}
