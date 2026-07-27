import React from 'react';
import { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import refreshLoopImage from '../../../assets/refresh-loop.png';
import refreshOnlyImage from '../../../assets/refresh-only.png';
// The instruction row keeps GridItem's grid-container + descendant styling
// (`.instructionItem` 5-col grid, `.instructionItem .optionsColumn`,
// `.instructionItem .instructionDetails` from the helper nodes, etc.). Importing
// the same CSS module keeps those scoped class names identical, so the design is
// preserved exactly without duplicating the grid rules.
import styles from '../../Griditem.module.scss';
import InstructionDragHandle from './InstructionDragHandle';
import ExecutionStateOverlay from './ExecutionStateOverlay';
import InlineNameEditor from './InlineNameEditor';
import BlockStatusToggle from './BlockStatusToggle';
import InstructionTypeBadge from './InstructionTypeBadge';
import MemoryAddButton from './MemoryAddButton';
import DeleteButton from './DeleteButton';
import CommandEditorButton from './CommandEditorButton';

export interface InstructionRowCapability {
  canMove?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
  reason?: string;
  deleteReason?: string;
}

export interface InstructionRowProps {
  instruction: BlockLoopInstructionLoadDTO;
  capability?: InstructionRowCapability;
  findText: string;
  // Native HTML5 drag (replaces react-beautiful-dnd; Memory List uses the same
  // pattern). The whole row is the drag source and a drop target; GridItem owns
  // the drag state and synthesizes the reorder result.
  onRowDragStart: (event: React.DragEvent) => void;
  onRowDragOver: (event: React.DragEvent) => void;
  onRowDrop: (event: React.DragEvent) => void;
  onRowDragEnd: (event: React.DragEvent) => void;
  dropdownOpen: boolean;
  isExecuting: boolean;
  executionState?: string;
  isEditing: boolean;
  instructionName: string;
  nameInputRef: React.RefObject<HTMLInputElement>;
  renderHighlighted: (text: string, query: string) => React.ReactNode;
  // Helper-rendered clusters (still produced by GridItem, passed as nodes).
  operations: React.ReactNode;
  deviceOptionsRow: React.ReactNode;
  editButton: React.ReactNode;
  moveButtons: React.ReactNode;
  testClick: React.ReactNode;
  onChangeName: (value: string) => void;
  onSaveName: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleStatus: () => void;
  onAddToMemory: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRemove: () => void;
  onOpenCommandEditor: () => void;
}

const CONDITIONAL_ACTIONS = ['IF', 'ELSEIF', 'ELSE', 'ENDIF'];

/**
 * One Bot Job Details instruction row. Composes the extracted row sub-components
 * (drag handle, status toggle, type badge, memory-add, delete, command-editor,
 * inline name editor, execution overlay) and places the GridItem helper outputs
 * (operations / device options / edit / move / test) into the grid. The rbd
 * `provided` is passed in by GridItem's <Draggable>; Phase 7 will swap that for
 * native drag props without changing this layout.
 */
const InstructionRow: React.FC<InstructionRowProps> = ({
  instruction,
  capability,
  findText,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
  dropdownOpen,
  isExecuting,
  executionState,
  isEditing,
  instructionName,
  nameInputRef,
  renderHighlighted,
  operations,
  deviceOptionsRow,
  editButton,
  moveButtons,
  testClick,
  onChangeName,
  onSaveName,
  onMoveUp,
  onMoveDown,
  onToggleStatus,
  onAddToMemory,
  onRemove,
  onOpenCommandEditor,
}) => {
  const findActive = findText.trim().length > 0;
  const dragDisabled = findActive || !capability?.canMove;
  const dragTitle = findActive
    ? 'Clear Find before moving instructions'
    : capability?.reason || 'Move instruction; Alt+Arrow keys move one position';
  const isConditional = CONDITIONAL_ACTIONS.includes(instruction.actions);

  return (
    <div
      draggable={!dragDisabled}
      onDragStart={onRowDragStart}
      onDragOver={onRowDragOver}
      onDrop={onRowDrop}
      onDragEnd={onRowDragEnd}
      className={`${styles.instructionItem} ${dropdownOpen ? styles.dropdownOpen : ''} ${
        isConditional ? styles.lightYellowBackground : ''
      }`}
    >
      <InstructionDragHandle
        disabled={dragDisabled}
        title={dragTitle}
        ariaLabel={`Move instruction ${instruction.instructionOrderNumber}`}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      {isExecuting && <ExecutionStateOverlay state={executionState} />}
      {isEditing ? (
        <InlineNameEditor
          value={instructionName}
          onChange={onChangeName}
          onSave={onSaveName}
          inputRef={nameInputRef}
        />
      ) : (
        <span className={styles.instructionLine}>
          <BlockStatusToggle active={instruction.instructionActive} onToggle={onToggleStatus} />
          <InstructionTypeBadge
            instruction={instruction}
            findText={findText}
            renderHighlighted={renderHighlighted}
          />
          <MemoryAddButton
            disabled={!capability?.canAdd}
            title={capability?.reason || 'Add step to memory list'}
            onClick={onAddToMemory}
          />
          {instruction.refreshLoop && (
            <img src={refreshLoopImage} alt="refresh" className={styles.refreshImage} />
          )}
          {instruction.loopOnly && (
            <img src={refreshOnlyImage} alt="refresh" className={styles.refreshImage} />
          )}
        </span>
      )}
      {operations}
      <div className={styles.optionsColumn}>
        {deviceOptionsRow}
        <div className={styles.moveButtons}>
          {editButton}
          {moveButtons}
          {testClick}
          <DeleteButton
            title={capability?.deleteReason || 'Delete instruction'}
            dimmed={!capability?.canDelete}
            onClick={onRemove}
          />
        </div>
      </div>
      <CommandEditorButton onClick={onOpenCommandEditor} />
    </div>
  );
};

export default InstructionRow;
