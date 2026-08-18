import React from 'react';
import styles from './InstructionSelectionCheckbox.module.scss';

export interface InstructionSelectionCheckboxProps {
  instructionId: number;
  instructionName: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Bot Job instruction-row selection; isolated from every existing grid checkbox. */
const InstructionSelectionCheckbox: React.FC<InstructionSelectionCheckboxProps> = ({
  instructionId,
  instructionName,
  checked,
  onChange,
}) => (
  <input
    type="checkbox"
    className={styles.checkbox}
    checked={checked}
    aria-label={`Select instruction ${instructionName || instructionId}`}
    title="Select this instruction row"
    onMouseDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()}
    onDragStart={(event) => {
      event.preventDefault();
      event.stopPropagation();
    }}
    onChange={(event) => onChange(event.target.checked)}
  />
);

export default InstructionSelectionCheckbox;
