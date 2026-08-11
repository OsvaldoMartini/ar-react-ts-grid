import React from 'react';
import { Trash2 } from 'lucide-react';
import styles from './SelectedInstructionDeleteButton.module.scss';

export interface SelectedInstructionDeleteButtonProps {
  count: number;
  onDelete: () => void;
}

/** Dynamic block-header action for checked instruction rows in this block. */
const SelectedInstructionDeleteButton: React.FC<SelectedInstructionDeleteButtonProps> = ({
  count,
  onDelete,
}) => {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={`Delete ${count} selected instruction row${count === 1 ? '' : 's'}`}
      title={`Delete ${count} selected instruction row${count === 1 ? '' : 's'}`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onDelete();
      }}
      onDragStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Trash2 size={14} aria-hidden="true" />
      <span>({count})</span>
    </button>
  );
};

export default SelectedInstructionDeleteButton;
