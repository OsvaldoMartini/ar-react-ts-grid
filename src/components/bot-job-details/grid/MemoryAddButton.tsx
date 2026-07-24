import React from 'react';
import styles from './MemoryAddButton.module.scss';

export interface MemoryAddButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: string;
}

/**
 * The circular "+" that adds eligible steps to the Memory List. Shared by block
 * headers (whole block) and instruction rows (single step). Presentational; the
 * caller decides what "+" does and passes the title/disabled state.
 */
const MemoryAddButton: React.FC<MemoryAddButtonProps> = ({ onClick, disabled = false, title }) => (
  <button
    type="button"
    className={styles.button}
    disabled={disabled}
    title={title}
    onClick={onClick}
  >
    +
  </button>
);

export default MemoryAddButton;
