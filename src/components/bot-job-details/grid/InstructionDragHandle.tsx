import React from 'react';
import type { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import styles from './InstructionDragHandle.module.scss';

export interface InstructionDragHandleProps {
  /**
   * The current drag library's handle props, spread onto the button. Today this
   * is react-beautiful-dnd's `provided.dragHandleProps`; Phase 7 (native drag)
   * will change what the parent passes here without touching this component's
   * keyboard-move behavior.
   */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * The ≡ handle for an instruction row: drag grip plus Alt+Arrow keyboard moves.
 * Extracted verbatim from GridItem. Presentational; move logic stays in GridItem
 * and is invoked through onMoveUp/onMoveDown.
 */
const InstructionDragHandle: React.FC<InstructionDragHandleProps> = ({
  dragHandleProps,
  disabled = false,
  title,
  ariaLabel,
  onMoveUp,
  onMoveDown,
}) => (
  <button
    type="button"
    className={styles.handle}
    {...(dragHandleProps ?? {})}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel}
    onKeyUp={event => {
      if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault();
        onMoveUp();
      } else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        onMoveDown();
      }
    }}
  >
    ≡
  </button>
);

export default InstructionDragHandle;
