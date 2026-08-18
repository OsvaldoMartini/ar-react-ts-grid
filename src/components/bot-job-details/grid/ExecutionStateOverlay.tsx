import React from 'react';
import styles from './ExecutionStateOverlay.module.scss';

export interface ExecutionStateOverlayProps {
  state?: string | null;
}

const STATE_CLASS: Record<string, string> = {
  green: styles.green,
  red: styles.red,
  yellow: styles.yellow,
};

/**
 * Visual execution-state layer for one instruction row.
 * Whether a row is executing remains a GridItem concern.
 */
const ExecutionStateOverlay: React.FC<ExecutionStateOverlayProps> = ({ state }) => {
  const normalizedState = state?.toLowerCase() ?? '';
  const stateClass = STATE_CLASS[normalizedState] ?? '';

  return (
    <div
      className={`${styles.overlay} ${stateClass}`.trim()}
      data-execution-overlay="true"
      data-state={normalizedState || undefined}
    />
  );
};

export default ExecutionStateOverlay;
