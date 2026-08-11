import React from 'react';
import editImage from '../../../assets/edit.png';
import upImage from '../../../assets/up.png';
import downImage from '../../../assets/down.png';
import rollBackImage from '../../../assets/rollback4.png';
import saveImage from '../../../assets/save.png';
// Shares GridItem's block-header styling, including the descendant selectors
// `.blockHeader .blockName` / `.blockHeader .blockCount` / `.blockHeader .moveButtons`,
// so the design is preserved exactly with no duplication.
import styles from '../../Griditem.module.scss';
import BlockStatusToggle from './BlockStatusToggle';
import BlockCollapseToggle from './BlockCollapseToggle';
import InlineNameEditor from './InlineNameEditor';
import MemoryAddButton from './MemoryAddButton';
import DeleteButton from './DeleteButton';
import SelectedInstructionDeleteButton from './SelectedInstructionDeleteButton';

export interface BlockHeaderProps {
  blockActive: boolean;
  blockOrderNumber: number;
  blockName: string;
  instructionCount: number;
  collapsed: boolean;
  isEditing: boolean;
  editingName: string;
  nameInputRef: React.RefObject<HTMLInputElement>;
  findText: string;
  canAddToMemory: boolean;
  memoryAddTitle?: string;
  showCreateComponent?: boolean;
  isFirstBlock: boolean;
  blockSelected?: boolean;
  blockDeleteTitle?: string;
  blockDeleteDimmed?: boolean;
  selectedInstructionCount?: number;
  renderHighlighted: (text: string, query: string) => React.ReactNode;
  /** @deprecated Legacy Block-level ExcelWrite display; intentionally no longer rendered. */
  exportFileNode?: React.ReactNode;
  /** The Excel-GOTO badge cluster, built by GridItem when this block owns it. */
  excelGotoNode?: React.ReactNode;
  onToggleStatus: () => void;
  onToggleCollapse: () => void;
  onDeleteSelectedInstructions?: () => void;
  onChangeName: (value: string) => void;
  onSaveName: () => void;
  onAddToMemory: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRollback: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEditName: () => void;
  /** @deprecated ExcelWrite files are configured on each E instruction in Command Editor. */
  onExcelFile?: () => void;
  onCreateComponent: () => void;
  onBlockSelectionChange?: (checked: boolean) => void;
  onDeleteBlock: () => void;
}

/**
 * The header row of one Bot Job Details block: status/collapse toggles, order
 * number, name (view/edit), step count, add-to-memory, and the move/edit/save/delete
 * controls. ExcelWrite file ownership moved to each E instruction in Command Editor.
 */
const BlockHeader: React.FC<BlockHeaderProps> = ({
  blockActive,
  blockOrderNumber,
  blockName,
  instructionCount,
  collapsed,
  isEditing,
  editingName,
  nameInputRef,
  findText,
  canAddToMemory,
  memoryAddTitle,
  showCreateComponent = true,
  isFirstBlock,
  blockSelected = false,
  blockDeleteTitle,
  blockDeleteDimmed,
  selectedInstructionCount = 0,
  renderHighlighted,
  excelGotoNode,
  onToggleStatus,
  onToggleCollapse,
  onDeleteSelectedInstructions,
  onChangeName,
  onSaveName,
  onAddToMemory,
  onRollback,
  onMoveUp,
  onMoveDown,
  onEditName,
  onCreateComponent,
  onBlockSelectionChange,
  onDeleteBlock,
}) => (
  <div className={styles.blockHeader}>
    <BlockStatusToggle active={blockActive} onToggle={onToggleStatus} />
    <BlockCollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
    {onDeleteSelectedInstructions && (
      <SelectedInstructionDeleteButton
        count={selectedInstructionCount}
        onDelete={onDeleteSelectedInstructions}
      />
    )}
    <span className={styles.blockOrderNumber}>#{blockOrderNumber}</span>
    {isEditing ? (
      <InlineNameEditor
        value={editingName}
        onChange={onChangeName}
        onSave={onSaveName}
        inputRef={nameInputRef}
      />
    ) : (
      <span className={styles.blockName}>{renderHighlighted(blockName ?? '', findText)}</span>
    )}
    <span className={styles.blockCount}>({instructionCount})</span>
    <MemoryAddButton
      disabled={!canAddToMemory}
      title={memoryAddTitle || 'Add this complete connected block to Memory List'}
      onClick={onAddToMemory}
    />
    <div className={styles.moveButtons}>
      {isFirstBlock && (
        <img
          src={rollBackImage}
          alt="Rollback block"
          title="Move every instruction into this first block"
          className={styles.rollbackButton}
          onClick={onRollback}
        />
      )}
      {excelGotoNode}
      <img src={upImage} alt="" className={styles.moveButton} onClick={onMoveUp} />
      <img src={downImage} alt="" className={styles.moveButton} onClick={onMoveDown} />
      <img src={editImage} alt="edit" className={styles.editButton} onClick={onEditName} />
      {showCreateComponent && (
        <img src={saveImage} alt="save" className={styles.saveButton} onClick={onCreateComponent} />
      )}
      <input
        type="checkbox"
        aria-label={`Select block ${blockName}`}
        title="Select block"
        checked={blockSelected}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onChange={(event) => onBlockSelectionChange?.(event.target.checked)}
      />
      <DeleteButton
        title={blockDeleteTitle || 'Delete block'}
        dimmed={blockDeleteDimmed}
        onClick={onDeleteBlock}
      />
    </div>
  </div>
);

export default BlockHeader;
