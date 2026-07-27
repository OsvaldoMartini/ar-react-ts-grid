import React from 'react';
import { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
// Shares GridItem's list styling (`.instructionsList`, valid/invalid drop-zone
// highlight) so the design is preserved exactly with no duplication.
import styles from '../../Griditem.module.scss';

export type InstructionListDropZone = 'none' | 'valid' | 'invalid';

export interface InstructionListProps {
  droppableId: string;
  instructions: BlockLoopInstructionLoadDTO[];
  blockName: string;
  findText: string;
  dropZone: InstructionListDropZone;
  instructionMatchesFind: (instruction: BlockLoopInstructionLoadDTO, query: string) => boolean;
  // Native drop zone for this block (dropping on empty space appends to the block).
  onListDragOver: (event: React.DragEvent) => void;
  onListDrop: (event: React.DragEvent) => void;
  renderRow: (instruction: BlockLoopInstructionLoadDTO, index: number) => React.ReactNode;
  emptyContent?: React.ReactNode;
}

/**
 * The per-block instruction list (native HTML5 drop zone; rbd removed in Phase 7).
 * Owns the drop-zone highlight, the row-level find-hide filter, and the
 * Excel-GOTO skip. GridItem builds each row through `renderRow` (which returns a
 * natively-draggable InstructionRow) and owns the drag state / reorder result.
 */
const InstructionList: React.FC<InstructionListProps> = ({
  droppableId,
  instructions,
  blockName,
  findText,
  dropZone,
  instructionMatchesFind,
  onListDragOver,
  onListDrop,
  renderRow,
  emptyContent,
}) => (
  <div
    data-droppable-id={droppableId}
    className={`${styles.instructionsList} ${
      dropZone === 'valid'
        ? styles.validDropZone
        : dropZone === 'invalid'
          ? styles.invalidDropZone
          : ''
    }`}
    onDragOver={onListDragOver}
    onDrop={onListDrop}
  >
    {instructions.length === 0 ? emptyContent : null}
    {instructions.map((instruction, index) => {
      if (instruction.actions === 'EXCEL GOTO') return null;

      // Row-level find: inside a kept block, hide rows that don't match —
      // unless the block itself matched by name (then the whole block stays).
      const findQuery = findText.trim().toLowerCase();
      if (
        findQuery
        && !(blockName ?? '').toLowerCase().includes(findQuery)
        && !instructionMatchesFind(instruction, findQuery)
      ) {
        return null;
      }

      return (
        <React.Fragment key={instruction.id}>{renderRow(instruction, index)}</React.Fragment>
      );
    })}
  </div>
);

export default InstructionList;
