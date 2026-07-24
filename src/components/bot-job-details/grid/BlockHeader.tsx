import React from 'react';
import editImage from '../../../assets/edit.png';
import upImage from '../../../assets/up.png';
import downImage from '../../../assets/down.png';
import rollBackImage from '../../../assets/rollback4.png';
import saveImage from '../../../assets/save.png';
import excelImage from '../../../assets/excel.png';
// Shares GridItem's block-header styling, including the descendant selectors
// `.blockHeader .blockName` / `.blockHeader .blockCount` / `.blockHeader .moveButtons`,
// so the design is preserved exactly with no duplication.
import styles from '../../GridItem.module.scss';
import BlockStatusToggle from './BlockStatusToggle';
import BlockCollapseToggle from './BlockCollapseToggle';
import InlineNameEditor from './InlineNameEditor';
import MemoryAddButton from './MemoryAddButton';
import DeleteButton from './DeleteButton';

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
  isFirstBlock: boolean;
  blockDeleteTitle?: string;
  blockDeleteDimmed?: boolean;
  renderHighlighted: (text: string, query: string) => React.ReactNode;
  exportFileNode: React.ReactNode;
  /** The Excel-GOTO badge cluster, built by GridItem when this block owns it. */
  excelGotoNode?: React.ReactNode;
  onToggleStatus: () => void;
  onToggleCollapse: () => void;
  onChangeName: (value: string) => void;
  onSaveName: () => void;
  onAddToMemory: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRollback: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEditName: () => void;
  onExcelFile: () => void;
  onCreateComponent: () => void;
  onDeleteBlock: () => void;
}

/**
 * The header row of one Bot Job Details block: status/collapse toggles, order
 * number, name (view/edit), step count, add-to-memory, export file, and the
 * move/edit/excel/save/delete controls. Extracted verbatim from GridItem; the
 * Excel-GOTO cluster and export-file label are passed in as nodes so their
 * GridItem-owned logic stays put.
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
  isFirstBlock,
  blockDeleteTitle,
  blockDeleteDimmed,
  renderHighlighted,
  exportFileNode,
  excelGotoNode,
  onToggleStatus,
  onToggleCollapse,
  onChangeName,
  onSaveName,
  onAddToMemory,
  onRollback,
  onMoveUp,
  onMoveDown,
  onEditName,
  onExcelFile,
  onCreateComponent,
  onDeleteBlock,
}) => (
  <div className={styles.blockHeader}>
    <BlockStatusToggle active={blockActive} onToggle={onToggleStatus} />
    <BlockCollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
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
      title="Add eligible steps in this block to memory list"
      onClick={onAddToMemory}
    />
    <span className={styles.blockExportFile}>{exportFileNode}</span>
    <div className={styles.moveButtons}>
      {isFirstBlock && (
        <img src={rollBackImage} alt="" className={styles.rollbackButton} onClick={onRollback} />
      )}
      {excelGotoNode}
      <img src={upImage} alt="" className={styles.moveButton} onClick={onMoveUp} />
      <img src={downImage} alt="" className={styles.moveButton} onClick={onMoveDown} />
      <img src={editImage} alt="edit" className={styles.editButton} onClick={onEditName} />
      <img src={excelImage} alt="excel" className={styles.excelButton} onClick={onExcelFile} />
      <img src={saveImage} alt="save" className={styles.saveButton} onClick={onCreateComponent} />
      <DeleteButton
        title={blockDeleteTitle || 'Delete block'}
        dimmed={blockDeleteDimmed}
        onClick={onDeleteBlock}
      />
    </div>
  </div>
);

export default BlockHeader;
