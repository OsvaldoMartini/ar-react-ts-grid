import React from 'react';
import { Draggable, Droppable, type DraggableProvided } from 'react-beautiful-dnd';
import { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
// Shares GridItem's list styling (`.instructionsList`, valid/invalid drop-zone
// highlight) so the design is preserved exactly with no duplication.
import styles from '../../GridItem.module.scss';

export type InstructionListDropZone = 'none' | 'valid' | 'invalid';

export interface InstructionListProps {
  droppableId: string;
  droppableKey: React.Key;
  instructions: BlockLoopInstructionLoadDTO[];
  blockName: string;
  findText: string;
  dropDisabled: boolean;
  dropZone: InstructionListDropZone;
  instructionMatchesFind: (instruction: BlockLoopInstructionLoadDTO, query: string) => boolean;
  isRowDragDisabled: (instruction: BlockLoopInstructionLoadDTO) => boolean;
  renderRow: (
    instruction: BlockLoopInstructionLoadDTO,
    index: number,
    provided: DraggableProvided,
  ) => React.ReactNode;
}

/**
 * The per-block instruction list (react-beautiful-dnd Droppable). Owns the
 * drop-zone highlight, the row-level find-hide filter, the Excel-GOTO skip, the
 * Draggable wrapper, and the placeholder. GridItem builds each row through
 * `renderRow` (it still owns the row's ~24 state-derived props). Phase 7 will
 * replace the rbd Droppable/Draggable here with native drag.
 */
const InstructionList: React.FC<InstructionListProps> = ({
  droppableId,
  droppableKey,
  instructions,
  blockName,
  findText,
  dropDisabled,
  dropZone,
  instructionMatchesFind,
  isRowDragDisabled,
  renderRow,
}) => (
  <Droppable droppableId={droppableId} key={droppableKey} isDropDisabled={dropDisabled}>
    {(provided) => (
      <div
        className={`${styles.instructionsList} ${
          dropZone === 'valid'
            ? styles.validDropZone
            : dropZone === 'invalid'
              ? styles.invalidDropZone
              : ''
        }`}
        ref={provided.innerRef}
        {...provided.droppableProps}
      >
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
            <Draggable
              key={instruction.id}
              draggableId={instruction.id.toString()}
              index={index}
              isDragDisabled={isRowDragDisabled(instruction)}
            >
              {(dragProvided) => renderRow(instruction, index, dragProvided)}
            </Draggable>
          );
        })}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

export default InstructionList;
