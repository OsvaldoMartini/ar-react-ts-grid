import React from 'react';
import { SquarePen } from 'lucide-react';
import styles from './BotJobAddCommandButton.module.scss';

interface Props {
  disabled?: boolean;
  disabledReason?: string;
  onAdd: () => void;
}

const BotJobAddCommandButton: React.FC<Props> = ({
  disabled = false,
  disabledReason,
  onAdd,
}) => (
  <button
    type="button"
    className={styles.button}
    disabled={disabled}
    onClick={onAdd}
    title={disabled ? disabledReason : 'Add a disconnected command to this Bot Job'}
    aria-label="Add a disconnected command to this Bot Job"
  >
    <SquarePen size={14} aria-hidden="true" />
    <span>ADD</span>
  </button>
);

export default BotJobAddCommandButton;
