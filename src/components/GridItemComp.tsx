import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ComponentsInstructionsDTO, ElementDTO, UpdatedBlock } from './instructionsMockData';
import setValueImage from '../assets/setValueBtn3.png';
import getValueImage from '../assets/getValueBtn3.png';
import checkImage from '../assets/check4.png';

import crossImage from '../assets/cross.png';
import editImage from '../assets/edit.png';
import edit2Image from '../assets/edit2.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import rollBackImage from '../assets/rollback4.png';
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
import hiddenImage from '../assets/hidden-black.png';
import activeImage from '../assets/active3.png';
import inactiveImage from '../assets/inactive2.png';
import ArrowLeft from '../assets/ArrowLeft.png';


import AlertModal from './AlertModal';
import CompForce from './CompForce';
import InstructionCommandPanel, { CommandDraft } from './InstructionCommandPanel';
import ExcelExportPanel from './ExcelExportPanel';
import ComponentWorkspaceHeader from './bot-job-details/ComponentWorkspaceHeader';
import { useBotJobDetailsController } from './bot-job-details/useBotJobDetailsController';
import { useWebSocket } from './useWebSocket';
import { useInstructionDrag } from './useInstructionDrag';
import { useExcelExport } from './bot-job-details/grid/hooks/useExcelExport';
import { useGridAlerts } from './bot-job-details/grid/hooks/useGridAlerts';
import { useInstructionFind } from './bot-job-details/grid/hooks/useInstructionFind';
import { useBlockReorder } from './bot-job-details/grid/hooks/useBlockReorder';
import { instructionDisplayLabel } from './instructionDisplay';
import { canStartCommandApply, resolveCommandApplyResponse } from './commandApplyResponse';
import {
  SCANNER_ELEMENT_PANE_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from './scanner/Scanner.sessions';
import styles from './Griditem.module.scss';


export interface GridItemCompProps {
  homeBankingIdInitial: number;
  dataComp: ComponentsInstructionsDTO[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
}
type BlockDeleteCapability = { canDelete: boolean; reason: string; instructionCount: number; deleteRows: { id: number; name: string; action: string; order: number }[] };

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

const GridItemComp: React.FC<GridItemCompProps> = ({ homeBankingIdInitial, dataComp, socketPort, sessionId, botJobIdInitial, botJobNameInitial, onSessionOpen, onDetachedClose }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [componentsData, setComponentsData] = useState<ComponentsInstructionsDTO[]>(dataComp);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const [excelGotoInstruction, setExcelGotoInstruction] = useState<ComponentsInstructionsDTO | null>(null);

  // Use state to manage the instructions data
  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [, setBlockId] = useState<number | null>(-1);
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
  const [groupedData, setGroupedData] = useState<{ [blockId: number]: { blockName: string; exportFile?: string; instructions: ComponentsInstructionsDTO[] } }>({});
  const [isDataReordered, setIsDataReordered] = useState<boolean>(false);

  // Whole-block reorder (up/down buttons) — shared with the Bot Job grid via the
  // generic useBlockReorder, routed to the Component workspace. It renumbers every
  // block 1..N and sends ONE full-ordered BLOCK_MOVE (backend derives component_block
  // / home_banking_id from targetSessionId), replacing the old 2-block swap.
  const { handleMoveBlockUp, handleMoveBlockDown } = useBlockReorder({
    groupedData,
    instructionsData: componentsData,
    setInstructionsData: setComponentsData,
    setIsDataReordered,
    webSocket, connected, botJobId, botJobName, homeBankingId,
    targetSessionId: 'componentTasks',
  });

  // const [client, setClient] = useState<Client | null>(null);
  // const [connected, setConnected] = useState(false);
  // const [lastMessages, setLastMessages] = useState<any[]>([]);
  const [, setDropdownPosition] = useState('below'); // Default to 'below'
  const [updatedBlocks, setUpdatedBlocks] = useState<UpdatedBlock[]>([]);
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const [instructionName, setInstructionName] = useState<string>('');
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockName, setBlockName] = useState<string>('');

  // Alert / confirmation modal state — shared with the Bot Job grid (pure UI, no
  // session/table coupling). Step 12: adopt useGridAlerts, drop the duplicate.
  const {
    errorFlag, setErrorFlag,
    alertImage, setAlertImage,
    alertClass, setAlertClass,
    alertMessageHeader, setAlertMessageHeader,
    alertMessageBody, setAlertMessageBody,
    alertMessageFooter, setAlertMessageFooter,
    alertOnConfirm, setAlertOnConfirm,
    handleClose,
  } = useGridAlerts();
  // "Find" state — shared with the Bot Job grid. findText + the (string-typed,
  // same-SCSS) renderHighlighted come from useInstructionFind; instructionMatchesFind
  // stays local below (it's ComponentsInstructionsDTO-typed).
  const { findText, setFindText, renderHighlighted } = useInstructionFind();
  const [moveCapabilities, setMoveCapabilities] = useState<Map<number, { canMove: boolean; canDelete: boolean; deleteCount: number; reason: string; deleteReason: string; allowedBlockIds: number[]; deleteRows: { id: number; name: string; action: string; order: number }[] }>>(new Map());
  const [activeDraggedInstructionId, setActiveDraggedInstructionId] = useState<number | null>(null);
  const [pendingDragPreview, setPendingDragPreview] = useState<{ requestId: string; result: any } | null>(null);
  const [blockDeleteCapabilities, setBlockDeleteCapabilities] = useState<Map<number, BlockDeleteCapability>>(new Map());
  const [moveGraphRevision, setMoveGraphRevision] = useState('');
  // Excel Export panel — shared with the Bot Job grid (routes on this grid's own
  // sessionId prop = 'componentTasks'). Step 12: adopt useExcelExport, drop the duplicate.
  const {
    excelExportContext,
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
  const pendingCommandApplyRequestRef = useRef<string | null>(null);
  const processedMessagesRef = useRef(0);

  useEffect(() => {
    if (!connected) pendingCommandApplyRequestRef.current = null;
  }, [connected]);

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null || !gridScrollRef.current) return;
    gridScrollRef.current.scrollTop = pendingScrollTopRef.current;
    pendingScrollTopRef.current = null;
  }, [componentsData]);
  const submitInstructionMove = useInstructionDrag({
    webSocket, connected, graphRevision: moveGraphRevision, botJobId, botJobName,
    homeBankingId, targetSessionId: 'componentTasks',
  });

  //  const [executionId, setExecutionId] = useState<number>(0);
  //  const [executionState, setExecutionState] = useState<string>();


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
    const capability = moveCapabilities.get(instructionId);
    const destinationId = destinationBlockId;
    if (!capability?.canMove || !capability.allowedBlockIds.includes(destinationId)) {
      console.warn('[CompGrid] applyDragMove REFUSED', {
        instructionId, destinationId,
        canMove: capability?.canMove, allowed: capability?.allowedBlockIds, reason: capability?.reason,
      });
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
    setComponentsData(updatedInstructionsData);
    setIsDataReordered(false);
    console.log('[CompGrid] ROW_MOVE ->', { moved: movedInstructions.length, from: sourceBlockId, to: destinationBlockId, deleteBlockId });
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
    if (!webSocket || !connected || !moveGraphRevision) {
      // [CompGrid] permanent move/drag trace — filter the console for "[CompGrid]"
      console.warn('[CompGrid] move BLOCKED at onDragEnd', {
        hasSocket: !!webSocket, connected, moveGraphRevision,
        capabilities: moveCapabilities.size,
      });
      return;
    }
    const requestId = `${Date.now()}-componentTasks-move-preview`;
    console.log('[CompGrid] previewMove ->', {
      instructionId: Number(result.draggableId),
      from: `${result.source?.droppableId}#${result.source?.index}`,
      to: `${result.destination.droppableId}#${result.destination.index}`,
      requestId,
    });
    setPendingDragPreview({ requestId, result });
    webSocket.send(JSON.stringify({
      type: 'instructionGraph.previewMove',
      sessionId,
      homeBankingId,
      body: JSON.stringify({
        requestId,
        targetSessionId: 'componentTasks',
        botJobId,
        homeBankingId,
        graphRevision: moveGraphRevision,
        instructionId: Number(result.draggableId),
        destinationBlockId: Number(result.destination.droppableId),
        destinationIndex: result.destination.index,
      }),
    }));
  };

  // ── Native HTML5 drag & drop (replaces react-beautiful-dnd) ────────────────
  // Same mechanism as GridItem: on drop we synthesize the exact rbd result shape
  // and call the unchanged onDragEnd() (backend preview-move round-trip intact).
  const dragSourceRef = useRef<{ droppableId: string; index: number; instructionId: number } | null>(null);

  const commitInstructionDrag = useCallback((destinationDroppableId: string, destinationIndex: number) => {
    const source = dragSourceRef.current;
    dragSourceRef.current = null;
    if (!source) return;
    onDragEnd({
      draggableId: String(source.instructionId),
      source: { droppableId: source.droppableId, index: source.index },
      destination: { droppableId: destinationDroppableId, index: destinationIndex },
    });
  }, [onDragEnd]);

  const handleRowDragStart = (droppableId: string, index: number, instruction: ComponentsInstructionsDTO) =>
    (event: React.DragEvent) => {
      if (findText.trim().length > 0 || !moveCapabilities.get(instruction.id)?.canMove) {
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
    commitInstructionDrag(droppableId, count);
  };

  const handleRowDragEnd = () => {
    dragSourceRef.current = null;
    setActiveDraggedInstructionId(null);
  };

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


        if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "excelExport.chooseDirectoryResponse") {
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
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "commandEditor.applyResponse") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          const resolution = resolveCommandApplyResponse(pendingCommandApplyRequestRef.current, bodyData);
          if (resolution.kind === 'ignore') return;
          pendingCommandApplyRequestRef.current = null;
          if (resolution.kind === 'failure') {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader('Command Not Saved');
            setAlertMessageBody(resolution.error);
            setAlertMessageFooter('Review the command fields and try again.');
            setErrorFlag(true);
            setAlertOnConfirm(undefined);
          } else {
            const authoritativeInstructions = resolution.instructions as ComponentsInstructionsDTO[];
            if (authoritativeInstructions.length > 0) {
              pendingScrollTopRef.current = gridScrollRef.current?.scrollTop ?? null;
              setComponentsData(authoritativeInstructions);
              setIsDataReordered(false);
            }
            setOpenDropdown(null);
          }
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "license.statusChanged") {
          const bodyData = typeof parsedMessage.body === "string" ? JSON.parse(parsedMessage.body) : parsedMessage.body;
          if (bodyData?.active !== true) {
            setAlertImage(warningRedImage);
            setAlertClass('construction-image');
            setAlertMessageHeader('License Activation Required');
            setAlertMessageBody(bodyData?.error || bodyData?.status || 'Protected component operations are unavailable.');
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
            console.log('[CompGrid] previewMove <-', { ok: bodyData?.ok, error: bodyData?.error, groupRows: groupRows.length });
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
          console.log('[CompGrid] ROW_MOVE <-', { ok: bodyData?.ok, error: bodyData?.error || bodyData?.errorHeader });
          if (bodyData?.ok === false) {
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
          const next = new Map<number, { canMove: boolean; canDelete: boolean; deleteCount: number; reason: string; deleteReason: string; allowedBlockIds: number[]; deleteRows: { id: number; name: string; action: string; order: number }[] }>();
          if (Array.isArray(bodyData?.capabilities)) {
            bodyData.capabilities.forEach((capability: { instructionId: number; canMove: boolean; canDelete: boolean; deleteCount?: number; reason?: string; deleteReason?: string; allowedBlockIds?: number[]; deleteRows?: { id: number; name: string; action: string; order: number }[] }) => {
              next.set(capability.instructionId, { canMove: capability.canMove === true, canDelete: capability.canDelete === true, deleteCount: capability.deleteCount || 1, reason: capability.reason || '', deleteReason: capability.deleteReason || '', allowedBlockIds: Array.isArray(capability.allowedBlockIds) ? capability.allowedBlockIds : [], deleteRows: Array.isArray(capability.deleteRows) ? capability.deleteRows : [] });
            });
          }
          setMoveCapabilities(next);
          const nextBlocks = new Map<number, BlockDeleteCapability>();
          if (Array.isArray(bodyData?.blockCapabilities)) {
            bodyData.blockCapabilities.forEach((capability: { blockId: number; canDelete: boolean; reason?: string; instructionCount?: number; deleteRows?: BlockDeleteCapability['deleteRows'] }) => {
              nextBlocks.set(capability.blockId, { canDelete: capability.canDelete === true, reason: capability.reason || '', instructionCount: capability.instructionCount || 0, deleteRows: Array.isArray(capability.deleteRows) ? capability.deleteRows : [] });
            });
          }
          setBlockDeleteCapabilities(nextBlocks);
          setMoveGraphRevision(typeof bodyData?.graphRevision === 'string' ? bodyData.graphRevision : '');
          // [CompGrid] capabilities are the master gate for row up/down + drag.
          console.log('[CompGrid] capabilities <-', {
            ok: bodyData?.ok,
            error: bodyData?.error,
            rows: next.size,
            canMove: Array.from(next.values()).filter(c => c.canMove).length,
            graphRevision: typeof bodyData?.graphRevision === 'string' ? bodyData.graphRevision : '(EMPTY!)',
          });
        } else if (sessionId === parsedMessage.sessionId && parsedMessage.operationId === "componentsUpdate") {

          pendingScrollTopRef.current = gridScrollRef.current?.scrollTop ?? null;

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
    });
  }, [messages, pendingDragPreview]);

  useEffect(() => {
    // Send the move-capabilities request as soon as rows load — like the Bot Job grid
    // (useGridData). The Components workspace is bank-agnostic and legitimately runs with
    // homeBankingId = 0, so do NOT guard on homeBankingId > 0 (that would permanently
    // suppress the request → empty moveCapabilities/moveGraphRevision → instruction up/down
    // and drag dead). The backend scopes by targetSessionId: 'componentTasks'.
    if (!webSocket || !connected || componentsData.length === 0) return;
    webSocket.send(JSON.stringify({
      type: 'instructionEditor.memoryCapabilities',
      sessionId,
      homeBankingId,
      body: JSON.stringify({ targetSessionId: 'componentTasks', botJobId, homeBankingId }),
    }));
  }, [webSocket, connected, componentsData, botJobId, homeBankingId, sessionId]);


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
      const { updatedData, updatedBlocks: nextUpdatedBlocks } = correctBlockOrderNumbers(reassignedData);


      const gotoInstructionAfterReorder = updatedData.find(
        (instruction) => instruction.actions === 'EXCEL GOTO'
      );

      setComponentsData(updatedData);
      setExcelGotoInstruction(gotoInstructionAfterReorder || null);
      setGroupedData(groupByBlock(updatedData));

      if (JSON.stringify(updatedBlocks) !== JSON.stringify(nextUpdatedBlocks)) {
        setUpdatedBlocks(nextUpdatedBlocks);
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

    if (webSocket && connected) {
      const message = { type: "COMPONENT_INJECT", botJobId, botJobName, homeBankingId, sessionId: 'botJobTasks',
        details: { newBlock: { homeBankingId, botJobId, blockId: newBlock.id, blockName: newBlock.blockName,
          blockOrderNumber: newBlock.blockOrderNumber, instructions: newBlock.instructions.map(instruction => ({
            id: instruction.id, blockId: newBlock.id, blockOrderNumber: newBlock.blockOrderNumber,
            instructionOrderNumber: instruction.instructionOrderNumber,
          })) } } };
      webSocket.send(JSON.stringify(message));
    }
    setOpenDropdown(null);
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


  // Function to move an instruction down considering blockOrderNumber
  const handleMoveRowDown = (instructionId: number) => {
    const instruction = componentsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const blockInstructions = componentsData
      .filter(row => row.blockId === instruction.blockId)
      .sort((left, right) => left.instructionOrderNumber - right.instructionOrderNumber);
    const sourceIndex = blockInstructions.findIndex(row => row.id === instructionId);
    const destinationIndex = sourceIndex + (1);
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= blockInstructions.length) return;
    console.log('[CompGrid] row DOWN clicked', { instructionId, blockId: instruction.blockId, sourceIndex, destinationIndex });
    onDragEnd({
      draggableId: String(instructionId),
      source: { droppableId: String(instruction.blockId), index: sourceIndex },
      destination: { droppableId: String(instruction.blockId), index: destinationIndex },
    });
  };

  const handleMoveRowUp = (instructionId: number) => {
    const instruction = componentsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const blockInstructions = componentsData
      .filter(row => row.blockId === instruction.blockId)
      .sort((left, right) => left.instructionOrderNumber - right.instructionOrderNumber);
    const sourceIndex = blockInstructions.findIndex(row => row.id === instructionId);
    const destinationIndex = sourceIndex + (-1);
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= blockInstructions.length) return;
    console.log('[CompGrid] row UP clicked', { instructionId, blockId: instruction.blockId, sourceIndex, destinationIndex });
    onDragEnd({
      draggableId: String(instructionId),
      source: { droppableId: String(instruction.blockId), index: sourceIndex },
      destination: { droppableId: String(instruction.blockId), index: destinationIndex },
    });
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
      console.log("?? Sent element DTO:", message);
    } catch (error) {
      console.error("? Error sending WebSocket message:", error);
    }
  };


  const handleRemoveInstruction = (instructionId: number) => {
    if (!moveGraphRevision || !moveCapabilities.get(instructionId)?.canDelete) return;
    const instruction = componentsData.find(row => row.id === instructionId);
    if (!instruction) return;
    const familyDelete = ["IF", "ELSEIF", "ELSE", "ENDIF"].includes(instruction.actions);
    const loopDelete = ["LOOP", "REFRESH_LOOP"].includes(instruction.actions);
    const capability = moveCapabilities.get(instructionId);
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
    const instructionToRemove = componentsData.find(instruction => instruction.id === instructionId);

    if (!instructionToRemove) return;

    const { botJobId, botJobName, blockId, actions, parentId } = instructionToRemove;

    // Send WebSocket message if connected
    if (webSocket && connected) {
      const message = {
        type: "DELETE_INSTRUCTION",
        requestId: `${Date.now()}-component-instruction-delete-${instructionId}`,
        graphRevision: moveGraphRevision,
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
    const capability = blockDeleteCapabilities.get(blockId);
    if (!moveGraphRevision || !capability?.canDelete) return;

    // Find the botJobId and blockOrderNumber associated with the blockId
    const blockInstruction = componentsData.find(instruction => instruction.blockId === blockId);
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
        requestId: `${Date.now()}-component-block-delete-${blockId}`,
        graphRevision: moveGraphRevision,
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
    const displayName = instructionDisplayLabel(instruction);

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
        case "HOLD":
        case "WAIT":
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
  const renderMoveButtons = (instructionId: number) => {
    if (!moveCapabilities.get(instructionId)?.canMove) return null;

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
      const [, right] = instruction.operation.split(":");

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
    const shownLabel = instructionDisplayLabel(ins);
    return (shownLabel ?? "").toLowerCase().includes(q)
      || (ins.name ?? "").toLowerCase().includes(q);
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
    if (!webSocket || !connected || !canStartCommandApply(pendingCommandApplyRequestRef.current)) return;
    const requestId = `${Date.now()}-${instruction.id}`;
    const payload = {
      ...draft,
      requestId,
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
      variableId: draft.variableId,
      parentId: draft.parentId,
      parentBlockId: draft.parentBlockId,
    };
    pendingCommandApplyRequestRef.current = requestId;
    webSocket.send(JSON.stringify({
      type: 'commandEditor.apply',
      sessionId,
      homeBankingId,
      body: JSON.stringify(payload),
    }));
  };

  return (
    <div className={styles.gridContainer}>
      <ComponentWorkspaceHeader
        botJobId={botJobHeader.state?.botJobId ?? botJobId}
        botJobName={botJobHeader.state?.name ?? botJobName}
        connected={connected}
        reconnectAttempts={reconnectAttempts}
        error={error}
        status={botJobHeader.status}
        statusTone={botJobHeader.statusTone}
        webSocket={webSocket}
        messages={messages}
        sessionId={sessionId}
        onClose={() => {
          if (onDetachedClose) {
            onDetachedClose();
            return;
          }
          try {
            window.close();
          } catch (closeError) {
            console.error('Could not close detached Components window:', closeError);
          }
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
      <div ref={gridScrollRef} className={styles.gridScroll}>
        <div className={styles.gridContent}>
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
                                  onClick={() => setOpenDropdown(Number(excelGotoInstruction.id))}
                                />
                                <img
                                  src={crossImage}
                                  alt=""
                                  className={styles.crossButton}
                                  title={moveCapabilities.get(Number(excelGotoInstruction.id))?.deleteReason || 'Delete instruction'}
                                  style={{ opacity: moveCapabilities.get(Number(excelGotoInstruction.id))?.canDelete ? 1 : 0.35 }}
                                  onClick={() => handleRemoveInstruction(Number(excelGotoInstruction.id))}
                                />
                                {openDropdown === excelGotoInstruction.id && (
                                  <InstructionCommandPanel
                                    instruction={excelGotoInstruction}
                                    onClose={() => setOpenDropdown(null)}
                                    onApplyCommand={(draft) => applyCommandFromPanel(excelGotoInstruction, draft)}
                                    messages={messages}
                                    context={{ sessionId, targetSessionId: 'componentTasks', homeBankingId, botJobId, botJobName }}
                                    onSocketCommand={(type, body) => webSocket?.send(JSON.stringify({ type, sessionId, homeBankingId, body: JSON.stringify(body) }))}
                                  />
                                )}
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
                            title={blockDeleteCapabilities.get(Number(blockData.instructions[0].blockId))?.reason || 'Delete block'}
                            style={{ opacity: blockDeleteCapabilities.get(Number(blockData.instructions[0].blockId))?.canDelete ? 1 : 0.35 }}
                            onClick={() => handleRemoveBlock(Number(blockData.instructions[0].blockId))}
                          />


                        </div>
                      </div>
                      <div
                        data-droppable-id={blockGroupIndex}
                        className={`${styles.instructionsList} ${activeDraggedInstructionId === null ? '' : moveCapabilities.get(activeDraggedInstructionId)?.allowedBlockIds.includes(Number(blockData.instructions[0].blockId)) ? styles.validDropZone : styles.invalidDropZone}`}
                        onDragOver={handleGridDragOver}
                        onDrop={handleListDrop(blockGroupIndex, blockData.instructions.length)}
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

                              return (
                                    <div
                                      key={instruction.id}
                                      draggable={!(findText.trim().length > 0 || !moveCapabilities.get(instruction.id)?.canMove)}
                                      onDragStart={handleRowDragStart(blockGroupIndex, index, instruction)}
                                      onDragOver={handleGridDragOver}
                                      onDrop={handleRowDrop(blockGroupIndex, index)}
                                      onDragEnd={handleRowDragEnd}
                                      className={`${styles.instructionItem} ${openDropdown === instruction.id ? styles.dropdownOpen : ''
                                        } ${instruction.actions === 'IF' || instruction.actions === 'ELSEIF' || instruction.actions === 'ELSE' || instruction.actions === 'ENDIF'
                                          ? styles.lightYellowBackground
                                          : ''
                                        }`}
                                    >
                                      <button
                                        type="button"
                                        className={styles.dragHandle}
                                        disabled={findText.trim().length > 0 || !moveCapabilities.get(instruction.id)?.canMove}
                                        title={findText.trim().length > 0 ? 'Clear Find before moving instructions' : moveCapabilities.get(instruction.id)?.reason || 'Move instruction; Alt+Arrow keys move one position'}
                                        aria-label={`Move instruction ${instruction.instructionOrderNumber}`}
                                        onKeyUp={(event) => {
                                          if (event.altKey && event.key === 'ArrowUp') {
                                            event.preventDefault();
                                            handleMoveRowUp(instruction.id);
                                          } else if (event.altKey && event.key === 'ArrowDown') {
                                            event.preventDefault();
                                            handleMoveRowDown(instruction.id);
                                          }
                                        }}
                                      >≡</button>
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
                                          {renderMoveButtons(instruction.id)}
                                          {renderTestClick(instruction.actions, instruction)}
                                          <img
                                            src={crossImage}
                                            alt=""
                                            className={styles.crossButton}
                                            title={moveCapabilities.get(instruction.id)?.deleteReason || 'Delete instruction'}
                                            style={{ opacity: moveCapabilities.get(instruction.id)?.canDelete ? 1 : 0.35 }}
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
                                            onClose={() => setOpenDropdown(null)}
                                            onInsertElseIf={(graphRevision) => {
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
                                                  graphRevision,
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
                              );
                            })}
                      </div>
                    </div >
                  ))
              )}
        </div >
      </div >
    </div >
  );

};

export default GridItemComp;
