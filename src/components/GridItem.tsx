import React from 'react';
import { SquarePen } from 'lucide-react';
import { BlockLoopInstructionLoadDTO } from './instructionsMockData';

import editImage from '../assets/edit.png';
import edit2Image from '../assets/edit2.png';
import upImage from '../assets/up.png';
import downImage from '../assets/down.png';
import excelGotoImage from "../assets/excel_goto2.png";
import clickTestImage from "../assets/clickTest2.png";


import AlertModal from './AlertModal';
import CompForce from './CompForce';
import CreateNewBlock from './CreateNewBlock';
import ExcelExportPanel from './ExcelExportPanel';
import SaveComponentPanel from './SaveComponentPanel';
import BotJobDetailsChrome from './bot-job-details/BotJobDetailsChrome';
import ComponentWorkspaceHeader from './bot-job-details/ComponentWorkspaceHeader';
import FindBar from './bot-job-details/grid/FindBar';
import BotJobAddCommandButton from './bot-job-details/grid/BotJobAddCommandButton';
import DeleteButton from './bot-job-details/grid/DeleteButton';
import InstructionRow from './bot-job-details/grid/InstructionRow';
import InstructionList from './bot-job-details/grid/InstructionList';
import InstructionRelationshipDetails from './bot-job-details/grid/InstructionRelationshipDetails';
import ReconnectWebElement, {
  type ReconnectWebElementOption,
} from './ReconnectWebElement';
import BlockHeader from './bot-job-details/grid/BlockHeader';
import BlockCard from './bot-job-details/grid/BlockCard';
import type {
  InstructionRelationshipEdge,
  RelationshipTarget,
} from './bot-job-details/grid/domain/instructionRelationshipGraph';
import type {
  InstructionVariableLink,
} from './bot-job-details/grid/domain/instructionDependency';
import type {
  WorkspaceBlock,
} from './bot-job-details/grid/domain/workspaceBlocks';
import { instructionMatchesFind } from './bot-job-details/grid/hooks/useInstructionFind';
import { useInstructionGrid } from './bot-job-details/grid/hooks/useInstructionGrid';
import { useMemoryListSummary } from './bot-job-details/grid/hooks/useMemoryListSummary';
import type { UseInstructionGridProps } from './bot-job-details/grid/types/instructionGrid.types';
import styles from './Griditem.module.scss';
import { RulesCard } from './RulesCard';
import { instructionRelationshipPolicy } from './bot-job-details/grid/domain/instructionRelationshipPolicy';

const reconnectOption = (
  target: RelationshipTarget,
  instructions: readonly BlockLoopInstructionLoadDTO[],
  blocks: readonly WorkspaceBlock[],
  variables: readonly InstructionVariableLink[],
): ReconnectWebElementOption => {
  if (target.entity === 'INSTRUCTION') {
    const instruction = instructions.find(candidate => candidate.id === target.id);
    const label = instruction
      ? `#${instruction.instructionOrderNumber} ${instruction.name || instruction.actions} · ID ${instruction.id}`
      : `Instruction ID ${target.id}`;
    return {
      target,
      label,
      sublabel: instruction
        ? `Block #${instruction.blockOrderNumber} ${instruction.blockName}`
        : 'Web Element instruction',
      keywords: instruction
        ? [
            instruction.id,
            instruction.name,
            instruction.actions,
            instruction.tagName,
            instruction.blockName,
          ].join(' ')
        : String(target.id),
    };
  }
  if (target.entity === 'BLOCK') {
    const block = blocks.find(candidate => candidate.blockId === target.id);
    return {
      target,
      label: block
        ? `#${block.blockOrderNumber} ${block.blockName} · ID ${block.blockId}`
        : `Block ID ${target.id}`,
      sublabel: 'Bot Job Block',
      keywords: block
        ? `${block.blockId} ${block.blockOrderNumber} ${block.blockName}`
        : String(target.id),
    };
  }
  const variable = variables.find(candidate => candidate.id === target.id);
  const owner = variable?.instructionId == null
    ? null
    : instructions.find(candidate => candidate.id === variable.instructionId);
  return {
    target,
    label: variable?.name?.trim()
      ? `${variable.name.trim()} · Variable ID ${target.id}`
      : `Variable ID ${target.id}`,
    sublabel: [
      variable?.type || 'Variable',
      owner ? `Owner: ${owner.name || `Instruction ${owner.id}`}` : null,
    ].filter(Boolean).join(' · '),
    keywords: [
      target.id,
      variable?.type,
      owner?.name,
      owner?.actions,
    ].filter(Boolean).join(' '),
  };
};

const reconnectTargetLabel = (
  target: RelationshipTarget | null,
  instructions: readonly BlockLoopInstructionLoadDTO[],
  blocks: readonly WorkspaceBlock[],
  variables: readonly InstructionVariableLink[],
): string | null => target
  ? reconnectOption(target, instructions, blocks, variables).label
  : null;


// Function to group data by blockId and sort instructions within each block
const GridItem: React.FC<UseInstructionGridProps> = ({
  homeBankingIdInitial,
  data,
  initialBlocks,
  socketPort,
  sessionId,
  botJobIdInitial,
  botJobNameInitial,
  workspaceEpochInitial,
  onSessionOpen,
  onDetachedClose,
  workspaceMode,
}) => {
  React.useEffect(() => {
    document.title = 'Bot Jobs';
  }, []);
  // Phase 6, step 10 — hook composition + non-render wiring now lives in the
  // composition-root hook useInstructionGrid. GridItem stays purely presentational,
  // destructuring the same names its render helpers / JSX / dead code already use.
  const grid = useInstructionGrid({
    homeBankingIdInitial, data, initialBlocks, socketPort, sessionId,
    botJobIdInitial, botJobNameInitial, workspaceEpochInitial,
    onSessionOpen, onDetachedClose, workspaceMode,
  });
  const [reconnectPreview, setReconnectPreview] = React.useState<{
    edge: InstructionRelationshipEdge;
    authorityKey: string | null;
  } | null>(null);
  const {
    webSocket, connected, reconnectAttempts, messages, error,
    workspacePolicy,
    homeBankingId, botJobId, botJobName,
    gridScrollRef, instructionRef, blockRef, dropdownRef,
    openDropdown, selectedBlockIds,
    saveComponentContext, setSaveComponentContext,
    botJobHeader,
    errorFlag,
    alertImage, alertClass,
    alertMessageHeader,
    alertMessageBody,
    alertMessageFooter,
    alertOnConfirm, alertAlternateAction, handleClose,
    executionId, executionState,
    findText, setFindText, renderHighlighted,
    collapsedBlocks, toggleBlockCollapsed, focusInstructionTarget,
    excelExportContext, excelExportDirectory, choosingExcelExportDirectory,
    handleExcelFileBlockName, submitExcelExport, chooseExcelExportDirectory, closeExcelExport,
    memoryBlockOptions, createBlockOpen, setCreateBlockOpen,
    memoryCapabilities, requestMemoryListOpen,
    handleAddConnectedGroupToMemory,
    handleAddBlockToMemory, handleStageComponentBlock,
    instructionsData,
    workspaceBlocks,
    groupedData,
    excelGotoInstruction,
    dropdownPosition,
    editingInstructionId, instructionName, setInstructionName,
    editingBlockId, blockName, setBlockName,
    activeDraggedInstructionId,
    moveGraphRevision,
    botJobGraphMutationCapability,
    variableLinks,
    commandConfigurations,
    relationshipEdgesByInstruction,
    botJobRelationshipMutationAuthorityKey,
    botJobRelationshipMutationPending,
    blockDeleteCapabilities,
    gridActionNotice,
    dismissGridActionNotice,
    handleCreateNewBlock,
    handleBlockStatus,
    handleSaveBlockName,
    handleEditBlock,
    handleRollbackBlock,
    handleCreateComponent,
    handleBlockSelectionChange,
    handleBlockDelete,
    handleOpenCommandEditor,
    handleOpenCommandEditorCreate,
    handleRemoveInstruction,
    handleInstructionStatus,
    handleInstructionForceChange,
    handleEditInstruction,
    handleSaveInstruction,
    submitInstructionRelationshipMutation,
    submitCheckOperand,
    submitCheckOperatorUpdate,
    handleMoveRowUp,
    handleMoveRowDown,
    handleRowSelectedClick,
    submitSaveComponent,
    handleGridDragOver,
    handleListDrop,
    handleRowDragStart,
    handleRowDrop,
    handleRowDragEnd,
    handleBlockDragStart, handleBlockDrop, handleBlockDragEnd,
    handleMoveBlockUp, handleMoveBlockDown,
  } = grid;
  const componentWorkspace = workspacePolicy.kind === 'COMPONENT';
  const createCommandTargetBlockId = React.useMemo(() => {
    const firstBlock = workspaceBlocks.slice().sort(
      (left, right) => left.blockOrderNumber - right.blockOrderNumber
        || left.blockId - right.blockId,
    )[0];
    return firstBlock?.blockId ?? null;
  }, [workspaceBlocks]);
  const addCommandAvailable = Boolean(
    !componentWorkspace
    && connected
    && webSocket?.readyState === WebSocket.OPEN
    && Number.isSafeInteger(Number(botJobId))
    && Number(botJobId) > 0
    && botJobGraphMutationCapability
    && botJobGraphMutationCapability.ownerAssertion.botJobId === Number(botJobId)
    && botJobGraphMutationCapability.ownerAssertion.homeBankingId === Number(homeBankingId),
  );
  const canonicalMemoryItemCount = useMemoryListSummary({
    webSocket,
    connected,
    messages,
    sessionId,
    homeBankingId: botJobGraphMutationCapability?.ownerAssertion.homeBankingId
      ?? homeBankingIdInitial,
    botJobId: Number.isSafeInteger(Number(botJobId)) && Number(botJobId) > 0
      ? Number(botJobId)
      : null,
  });
  const gridInstructionMatchesFind = React.useCallback((
    instruction: BlockLoopInstructionLoadDTO,
    query: string,
  ) => {
    if (instructionMatchesFind(instruction, query)) return true;
    const variableIds = new Set<number>();
    if (instruction.variableId != null) variableIds.add(instruction.variableId);
    const configuredRightId = commandConfigurations
      .get(instruction.id)?.operandVariableId;
    if (configuredRightId != null) variableIds.add(configuredRightId);
    variableLinks.forEach(variable => {
      if (variable.instructionId === instruction.id && variable.id != null) {
        variableIds.add(variable.id);
      }
    });
    return variableLinks.some(variable => variable.id != null
      && variableIds.has(variable.id)
      && (`${variable.name ?? ''} ${variable.id}`).toLowerCase().includes(query));
  }, [commandConfigurations, variableLinks]);
  const openGridCommandEditor = React.useCallback((
    instruction: BlockLoopInstructionLoadDTO,
  ) => {
    if (componentWorkspace) return;
    handleOpenCommandEditor(instruction);
  }, [componentWorkspace, handleOpenCommandEditor]);
  const reconnectPreviewEdge = reconnectPreview?.edge ?? null;
  const openReconnectPreview = React.useCallback((
    edge: InstructionRelationshipEdge,
  ) => {
    setReconnectPreview({
      edge,
      authorityKey: botJobRelationshipMutationAuthorityKey,
    });
  }, [botJobRelationshipMutationAuthorityKey]);
  const [secondOperandPreview, setSecondOperandPreview] = React.useState<{
    instructionId: number;
    authorityKey: string;
  } | null>(null);
  const secondOperandInstruction = secondOperandPreview
    ? instructionsData.find(
        instruction => instruction.id === secondOperandPreview.instructionId,
      ) ?? null
    : null;
  const secondOperandConfiguration = secondOperandInstruction
    ? commandConfigurations.get(secondOperandInstruction.id) ?? null
    : null;
  const secondOperandCurrentId =
    typeof secondOperandConfiguration?.operandVariableId === 'number'
    && Number.isSafeInteger(secondOperandConfiguration.operandVariableId)
    && secondOperandConfiguration.operandVariableId > 0
      ? secondOperandConfiguration.operandVariableId
      : null;
  const secondOperandOwner = {
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: homeBankingIdInitial ?? -1,
    botJobId: botJobId ?? -1,
  };
  const secondOperandEdge: InstructionRelationshipEdge | null =
    secondOperandInstruction
      ? {
          id: `second-operand:${secondOperandInstruction.id}`,
          kind: 'VARIABLE_BINDING',
          source: {
            entity: 'INSTRUCTION',
            owner: secondOperandOwner,
            id: secondOperandInstruction.id,
          },
          target: secondOperandCurrentId === null
            ? null
            : {
                entity: 'VARIABLE',
                owner: secondOperandOwner,
                id: secondOperandCurrentId,
              },
          state: secondOperandCurrentId === null
            ? 'RECONNECT_VARIABLE'
            : 'CONNECTED',
          code: null,
          required: true,
          compatibleTargets: variableLinks
            .filter(variable =>
              typeof variable.id === 'number' && variable.id > 0)
            .map(variable => ({
              entity: 'VARIABLE' as const,
              owner: secondOperandOwner,
              id: variable.id as number,
            })),
        }
      : null;
  const reconnectPreviewInstruction =
    reconnectPreviewEdge?.source.entity === 'INSTRUCTION'
      ? instructionsData.find(
          instruction => instruction.id === reconnectPreviewEdge.source.id,
        ) ?? null
      : null;
  const reconnectPreviewOptions = reconnectPreviewEdge
    ? reconnectPreviewEdge.compatibleTargets.map(target =>
        reconnectOption(target, instructionsData, workspaceBlocks, variableLinks))
    : [];
  const reconnectPreviewSourceLabel = reconnectPreviewInstruction
    ? `#${reconnectPreviewInstruction.instructionOrderNumber} ${
        reconnectPreviewInstruction.name || reconnectPreviewInstruction.actions
      } · ID ${reconnectPreviewInstruction.id}`
    : reconnectPreviewEdge
      ? `${reconnectPreviewEdge.source.entity} ID ${reconnectPreviewEdge.source.id}`
      : '';
  const reconnectPreviewCurrentTarget = reconnectPreviewEdge
    ? reconnectTargetLabel(
        reconnectPreviewEdge.target,
        instructionsData,
        workspaceBlocks,
        variableLinks,
      )
    : null;
  const createBlockOptions = componentWorkspace
    ? workspaceBlocks.map(({ blockId, blockOrderNumber, blockName }) => ({
        blockId, blockOrderNumber, blockName,
      }))
    : memoryBlockOptions;
  const emptyWorkspaceBlocks = workspaceBlocks
    .filter(block => !groupedData[block.blockId])
    .filter(block => block.blockName.toLowerCase().includes(findText.trim().toLowerCase()));
  const workspaceBlockIndex = (blockId: number, fallback: number) => {
    const index = workspaceBlocks.findIndex(block => block.blockId === blockId);
    return index >= 0 ? index : fallback;
  };

  const closeDetachedWorkspace = (workspaceName: string) => {
    if (onDetachedClose) {
      onDetachedClose();
      return;
    }
    try {
      window.close();
    } catch (closeError) {
      console.error(`Could not close detached ${workspaceName} window:`, closeError);
    }
  };

  // Native block reorder (drag whole blocks + up/down buttons) now lives in
  // useBlockReorder (destructured above), including the window.__blockReorder hook.

  // Data-layer handlers (moves, delete/rollback) now live in useGridData.





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

  return (
    <div className={styles.gridContainer}>
      {componentWorkspace ? (
        <ComponentWorkspaceHeader
          botJobId={botJobId}
          botJobName={botJobName ?? ''}
          connected={connected}
          reconnectAttempts={reconnectAttempts}
          error={error}
          status={botJobHeader.status}
          statusTone={botJobHeader.statusTone}
          webSocket={webSocket}
          messages={messages}
          sessionId={sessionId}
          onRetry={botJobHeader.retryBootstrap}
          onClose={() => closeDetachedWorkspace('Components')}
        />
      ) : (
        <BotJobDetailsChrome
        fallbackBotJobId={botJobId}
        fallbackBotJobName={botJobName}
        fallbackSurface="botJob"
        connected={connected}
        webSocket={webSocket}
        messages={messages}
        sessionId={sessionId}
        onFocusPreflightIssue={(issue) => {
          if (issue.blockId === null) return;
          focusInstructionTarget({
            blockId: issue.blockId,
            instructionId: issue.instructionId,
          });
        }}
        controller={{
          ...botJobHeader,
          sendAction: (action: Parameters<typeof botJobHeader.sendAction>[0]) => {
            if (action === 'CLOSE') {
              closeDetachedWorkspace('Bot Job');
            }
            botJobHeader.sendAction(action);
          },
        }}
        />
      )}
      {excelExportContext && <ExcelExportPanel
        context={excelExportContext}
        onSubmit={submitExcelExport}
        onClose={closeExcelExport}
        onChooseDirectory={chooseExcelExportDirectory}
        selectedDirectory={excelExportDirectory}
        choosingDirectory={choosingExcelExportDirectory}
      />}
      {!componentWorkspace && saveComponentContext && (
        <SaveComponentPanel
          context={saveComponentContext}
          onSubmit={submitSaveComponent}
          onClose={() => setSaveComponentContext(null)}
        />
      )}
      {alertMessageBody && alertMessageBody.length > 0 && (
        <AlertModal
          header={alertMessageHeader || ''}
          body={alertMessageBody || ''}
          extraMsg={alertMessageFooter || ''}
          onClose={handleClose}
          onConfirm={alertOnConfirm}
          alternateAction={alertAlternateAction}
          imageSrc={alertImage}
          imageClass={alertClass}
          error={errorFlag}
        />
      )}
      {reconnectPreviewEdge && (
        <ReconnectWebElement
          edge={reconnectPreviewEdge}
          sourceLabel={reconnectPreviewSourceLabel}
          currentTargetLabel={reconnectPreviewCurrentTarget}
          compatibleTargets={reconnectPreviewOptions}
          pending={botJobRelationshipMutationPending}
          actionsEnabled
          actionDisabledTitle={
            componentWorkspace
              ? 'Component relationship persistence is not available from this Bot Job dialog.'
              : 'Refresh this workspace before changing the relationship.'
          }
          onDisconnect={() => {
            if (!reconnectPreview?.authorityKey) return;
            submitInstructionRelationshipMutation(
              reconnectPreview.edge,
              null,
              reconnectPreview.authorityKey,
              { settled: () => setReconnectPreview(null) },
            );
          }}
          onConnect={(target) => {
            if (!reconnectPreview?.authorityKey) return;
            submitInstructionRelationshipMutation(
              reconnectPreview.edge,
              target,
              reconnectPreview.authorityKey,
              { settled: () => setReconnectPreview(null) },
            );
          }}
          onCancel={() => setReconnectPreview(null)}
        />
      )}
      {secondOperandEdge && secondOperandInstruction && (
        <ReconnectWebElement
          edge={secondOperandEdge}
          sourceLabel={`#${secondOperandInstruction.instructionOrderNumber} ${
            secondOperandInstruction.name || secondOperandInstruction.actions
          } · ID ${secondOperandInstruction.id} · second comparison variable`}
          currentTargetLabel={secondOperandEdge.target
            ? reconnectTargetLabel(
                secondOperandEdge.target,
                instructionsData,
                workspaceBlocks,
                variableLinks,
              )
            : null}
          compatibleTargets={secondOperandEdge.compatibleTargets.map(target =>
            reconnectOption(target, instructionsData, workspaceBlocks, variableLinks))}
          pending={false}
          actionsEnabled
          actionDisabledTitle="Refresh this workspace before changing the relationship."
          onDisconnect={() => {
            if (submitCheckOperand(
              secondOperandInstruction.id,
              secondOperandEdge.target?.id ?? null,
              null,
            )) {
              setSecondOperandPreview(null);
            }
          }}
          onConnect={(target) => {
            if (submitCheckOperand(
              secondOperandInstruction.id,
              secondOperandEdge.target?.id ?? null,
              target.id,
            )) {
              setSecondOperandPreview(null);
            }
          }}
          onCancel={() => setSecondOperandPreview(null)}
        />
      )}
      {gridActionNotice && (
        <div className={styles.gridActionNotice} role="status">
          <div className={styles.gridActionNoticeText}>
            <strong>{gridActionNotice.title}</strong>
            <span>{gridActionNotice.message}</span>
            <small>{gridActionNotice.action}</small>
          </div>
          <button
            type="button"
            className={styles.gridActionNoticeDismiss}
            title="Dismiss grid notice"
            aria-label="Dismiss grid notice"
            onClick={dismissGridActionNotice}
          >
            ×
          </button>
        </div>
      )}
      <div className={styles.gridFindRow}>
        <FindBar
          value={findText}
          onChange={setFindText}
          memoryCount={canonicalMemoryItemCount}
          onOpenMemory={requestMemoryListOpen}
          beforeMemory={!componentWorkspace ? (
            <BotJobAddCommandButton
              disabled={!addCommandAvailable}
              disabledReason="Wait for the Bot Job graph to finish loading."
              onAdd={() => handleOpenCommandEditorCreate(createCommandTargetBlockId)}
            />
          ) : undefined}
        />
      </div>
      {createBlockOpen && (
        <CreateNewBlock
          blocks={createBlockOptions}
          onCreate={handleCreateNewBlock}
          onClose={() => setCreateBlockOpen(false)}
        />
      )}
      <div ref={gridScrollRef} className={styles.gridScroll}>
        <div className={styles.gridContent}>
            {
              Object.keys(groupedData).length === 0 && emptyWorkspaceBlocks.length === 0 ? (
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
                    <span className={styles.blockOrderNumber}>
                      (AR Web) {workspacePolicy.emptyBlockLabel}
                    </span>
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
                <>
                {[
                  ...Object.entries(groupedData)
                  .filter(([, blockData]) => {
                    const q = findText.trim().toLowerCase();
                    if (!q) return true;

                    const blockMatch = (blockData.blockName ?? "").toLowerCase().includes(q);

                    const instructionMatch = (blockData.instructions ?? []).some(
                      (ins) => gridInstructionMatchesFind(ins, q)
                    );

                    return blockMatch || instructionMatch;
                  })
                  .sort(
                    ([, aBlockData], [, bBlockData]) =>
                      workspaceBlockIndex(
                        aBlockData.instructions[0].blockId,
                        aBlockData.instructions[0].blockOrderNumber - 1,
                      ) -
                      workspaceBlockIndex(
                        bBlockData.instructions[0].blockId,
                        bBlockData.instructions[0].blockOrderNumber - 1,
                      )
                  )
                  .map(([blockGroupIndex, blockData], index) => {
                    const blockId = Number(blockData.instructions[0].blockId);
                    const authoritativeIndex = workspaceBlockIndex(blockId, index);
                    const displayOrder = authoritativeIndex + 1;
                    const blockCapability = blockDeleteCapabilities.get(blockId);
                    const isFirstBlock = authoritativeIndex === 0;
                    return (
                    <BlockCard
                      key={blockGroupIndex}
                      blockId={blockId}
                      displayOrder={displayOrder}
                      blockDraggable={findText.trim().length === 0}
                      onBlockDragStart={handleBlockDragStart(authoritativeIndex, blockId)}
                      onBlockDragOver={handleGridDragOver}
                      onBlockDrop={handleBlockDrop(authoritativeIndex)}
                      onBlockDragEnd={handleBlockDragEnd}
                      collapsed={collapsedBlocks.has(blockId)}
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
                        canAddToMemory={blockCapability?.canAddToMemory === true}
                        memoryAddTitle={blockCapability?.addReason}
                        showCreateComponent={!componentWorkspace}
                        isFirstBlock={isFirstBlock}
                        blockSelected={selectedBlockIds.has(blockId)}
                        blockDeleteTitle={isFirstBlock
                          ? selectedBlockIds.size > 0
                            ? `Delete ${selectedBlockIds.size} checked block(s)`
                            : 'Delete checked blocks'
                          : 'Delete block'}
                        blockDeleteDimmed={false}
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
                              onClick={() => openGridCommandEditor(excelGotoInstruction)}
                            />
                            <DeleteButton
                              title="Delete instruction"
                              onClick={() => handleRemoveInstruction(Number(excelGotoInstruction.id))}
                            />
                          </div>
                        ) : null}
                        onToggleStatus={() => handleBlockStatus(blockData.instructions[0].blockId)}
                        onToggleCollapse={() => toggleBlockCollapsed(Number(blockData.instructions[0].blockId))}
                        onChangeName={setBlockName}
                        onSaveName={() => handleSaveBlockName(Number(blockData.instructions[0].blockId))}
                        onAddToMemory={(e) => {
                          e.stopPropagation();
                          if (componentWorkspace) {
                            if (!moveGraphRevision) return;
                            handleStageComponentBlock(blockData.instructions, moveGraphRevision);
                            return;
                          }
                          handleAddBlockToMemory(blockData.instructions);
                        }}
                        onRollback={() => handleRollbackBlock(Number(blockData.instructions[0].blockId))}
                        onMoveUp={() => handleMoveBlockUp(Number(blockData.instructions[0].blockId))}
                        onMoveDown={() => handleMoveBlockDown(Number(blockData.instructions[0].blockId))}
                        onEditName={() => handleEditBlock(Number(blockData.instructions[0].blockId), blockData.blockName)}
                        onExcelFile={() => handleExcelFileBlockName(Number(blockData.instructions[0].blockId), blockData.blockName, Number(blockData.instructions[0].blockOrderNumber), blockData.exportFile)}
                        onCreateComponent={() => handleCreateComponent(Number(blockData.instructions[0].blockId))}
                        onBlockSelectionChange={(checked) =>
                          handleBlockSelectionChange(blockId, checked)}
                        onDeleteBlock={() => handleBlockDelete(blockId)}
                      />}
                      list={<InstructionList
                        droppableId={blockGroupIndex}
                        instructions={blockData.instructions}
                        blockName={blockData.blockName ?? ""}
                        findText={findText}
                        dropZone={activeDraggedInstructionId === null ? 'none' : (memoryCapabilities.get(activeDraggedInstructionId)?.allowedBlockIds.includes(Number(blockData.instructions[0].blockId)) ? 'valid' : 'invalid')}
                        instructionMatchesFind={gridInstructionMatchesFind}
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
                            operations={(
                              <InstructionRelationshipDetails
                                instruction={instruction}
                                allInstructions={instructionsData}
                                workspaceBlocks={workspaceBlocks}
                                relationshipEdges={
                                  relationshipEdgesByInstruction.get(instruction.id) ?? []
                                }
                                variableLinks={variableLinks}
                                commandConfiguration={
                                  commandConfigurations.get(instruction.id) ?? null
                                }
                                onReconnect={openReconnectPreview}
                                onEditCommand={() => openGridCommandEditor(instruction)}
                                onReconnectSecondVariable={componentWorkspace
                                  ? undefined
                                  : () => setSecondOperandPreview({
                                      instructionId: instruction.id,
                                      authorityKey:
                                        botJobRelationshipMutationAuthorityKey ?? '',
                                    })}
                                onChangeCheckOperator={componentWorkspace
                                  ? undefined
                                  : (comparisonOperator) =>
                                      submitCheckOperatorUpdate(instruction.id, comparisonOperator)}
                              />
                            )}
                            deviceOptionsRow={renderDeviceOptionsRow(instruction)}
                            editButton={renderEditButton(instruction.actions, editImage, instruction)}
                            commandEditButton={
                              !componentWorkspace ? (
                                <span className={styles.commandEditRuleCard}>
                                  <RulesCard
                                    event={{ color: 'green', rules: 'Edit', ts: 0 }}
                                    ariaLabel={`Edit ${instruction.name || instruction.actions}`}
                                    title={instructionRelationshipPolicy(instruction.actions).role === 'WEB_ELEMENT'
                                      ? 'Edit this Web Element placement'
                                      : 'Edit this command'}
                                    iconNode={<SquarePen size={14} aria-hidden="true" />}
                                    animate={false}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openGridCommandEditor(instruction);
                                    }}
                                  />
                                </span>
                              ) : null
                            }
                            moveButtons={renderMoveButtons(instruction.id)}
                            testClick={renderTestClick(instruction.actions, instruction)}
                            onChangeName={setInstructionName}
                            onSaveName={() => handleSaveInstruction(instruction.id)}
                            onMoveUp={() => handleMoveRowUp(instruction.id)}
                            onMoveDown={() => handleMoveRowDown(instruction.id)}
                            onToggleStatus={() => handleInstructionStatus(instruction.id, blockData.instructions)}
                            onAddToMemory={(e) => {
                              e.stopPropagation();
                              handleAddConnectedGroupToMemory(instruction);
                            }}
                            onRemove={() => handleRemoveInstruction(instruction.id)}
                          />
                        )}
                      />}
                    />
                    );
                  }),
                  ...emptyWorkspaceBlocks.map((block) => {
                  const index = workspaceBlockIndex(block.blockId, block.blockOrderNumber - 1);
                  const capability = blockDeleteCapabilities.get(block.blockId);
                  const isFirstBlock = index === 0;
                  return (
                    <BlockCard
                      key={`empty-${block.blockId}`}
                      blockId={block.blockId}
                      displayOrder={index + 1}
                      blockDraggable={findText.trim().length === 0}
                      onBlockDragStart={handleBlockDragStart(index, block.blockId)}
                      onBlockDragOver={handleGridDragOver}
                      onBlockDrop={handleBlockDrop(index)}
                      onBlockDragEnd={handleBlockDragEnd}
                      collapsed={collapsedBlocks.has(block.blockId)}
                      header={<BlockHeader
                        blockActive={block.blockActive}
                        blockOrderNumber={block.blockOrderNumber}
                        blockName={block.blockName}
                        instructionCount={0}
                        collapsed={collapsedBlocks.has(block.blockId)}
                        isEditing={editingBlockId === block.blockId}
                        editingName={blockName}
                        nameInputRef={blockRef}
                        findText={findText}
                        canAddToMemory={false}
                        memoryAddTitle={capability?.addReason}
                        showCreateComponent={!componentWorkspace}
                        isFirstBlock={isFirstBlock}
                        blockSelected={selectedBlockIds.has(block.blockId)}
                        blockDeleteTitle={isFirstBlock
                          ? selectedBlockIds.size > 0
                            ? `Delete ${selectedBlockIds.size} checked block(s)`
                            : 'Delete checked blocks'
                          : 'Delete block'}
                        blockDeleteDimmed={false}
                        renderHighlighted={renderHighlighted}
                        exportFileNode={renderExportFile(block.exportFile || 'No Excel Export File')}
                        onToggleStatus={() => handleBlockStatus(block.blockId)}
                        onToggleCollapse={() => toggleBlockCollapsed(block.blockId)}
                        onChangeName={setBlockName}
                        onSaveName={() => handleSaveBlockName(block.blockId)}
                        onAddToMemory={(event) => event.stopPropagation()}
                        onRollback={() => handleRollbackBlock(block.blockId)}
                        onMoveUp={() => handleMoveBlockUp(block.blockId)}
                        onMoveDown={() => handleMoveBlockDown(block.blockId)}
                        onEditName={() => handleEditBlock(block.blockId, block.blockName)}
                        onExcelFile={() => handleExcelFileBlockName(
                          block.blockId,
                          block.blockName,
                          block.blockOrderNumber,
                          block.exportFile,
                        )}
                        onCreateComponent={() => handleCreateComponent(block.blockId)}
                        onBlockSelectionChange={(checked) =>
                          handleBlockSelectionChange(block.blockId, checked)}
                        onDeleteBlock={() => handleBlockDelete(block.blockId)}
                      />}
                      list={<InstructionList
                        droppableId={String(block.blockId)}
                        instructions={[]}
                        blockName={block.blockName}
                        findText={findText}
                        dropZone={activeDraggedInstructionId === null
                          ? 'none'
                          : memoryCapabilities
                              .get(activeDraggedInstructionId)
                              ?.allowedBlockIds.includes(block.blockId)
                            ? 'valid'
                            : 'invalid'}
                        instructionMatchesFind={gridInstructionMatchesFind}
                        onListDragOver={handleGridDragOver}
                        onListDrop={handleListDrop(String(block.blockId), 0)}
                        renderRow={() => null}
                        emptyContent={
                          <div className={styles.noDataMessage}>
                            No instructions in this block
                          </div>
                        }
                      />}
                    />
                  );
                  }),
                ].sort(
                  (left, right) =>
                    Number(left.props.displayOrder) - Number(right.props.displayOrder),
                )}
                </>
              )}
        </div >
      </div>
    </div >
  );

};

export default GridItem;
