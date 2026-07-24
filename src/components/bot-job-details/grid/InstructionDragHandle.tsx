import React from 'react';
import styles from './InstructionDragHandle.module.scss';

export interface InstructionDragHandleProps {
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * The ≡ handle for an instruction row: a visual drag grip plus Alt+Arrow keyboard
 * moves. The row itself is the native drag source (Phase 7), so this handle no
 * longer carries drag-library props. Move logic stays in GridItem via onMoveUp/Down.
 */
const InstructionDragHandle: React.FC<InstructionDragHandleProps> = ({
  disabled = false,
  title,
  ariaLabel,
  onMoveUp,
  onMoveDown,
}) => (
  <button
    type="button"
    className={styles.handle}
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
