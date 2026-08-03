import React from 'react';
import { SquarePen } from 'lucide-react';
import styles from './VariablesAddCommandButton.module.scss';

export interface VariablesAddCommandButtonProps {
  disabled?: boolean;
  onAdd: () => void;
}

const VariablesAddCommandButton: React.FC<VariablesAddCommandButtonProps> = ({
  disabled = false,
  onAdd,
}) => (
  <button
    type="button"
    className={styles.button}
    disabled={disabled}
    onClick={onAdd}
    title="Add a new command to this Bot Job"
  >
    <SquarePen size={14} aria-hidden="true" />
    <span>ADD</span>
  </button>
);

export default VariablesAddCommandButton;
