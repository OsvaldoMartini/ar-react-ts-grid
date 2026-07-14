import React from 'react';
import type { ScannerAction, ScannerActionPayload, ScannerState } from './Scanner.types';
import styles from './ScannerWorkspaceHeader.module.scss';

interface ScannerExecutionPanelProps {
  connected: boolean;
  loading?: boolean;
  pendingAction?: ScannerAction | null;
  scannerState?: ScannerState | null;
  onAction?: (action: ScannerAction, payload?: ScannerActionPayload) => void;
}

const EXECUTION_ACTIVE_STATES = new Set(['STARTING', 'RUNNING', 'STOPPING']);

const ScannerExecutionPanel: React.FC<ScannerExecutionPanelProps> = ({
  connected,
  loading = false,
  pendingAction = null,
  scannerState,
  onAction,
}) => {
  const busy = loading || pendingAction !== null;
  const executionActive = EXECUTION_ACTIVE_STATES.has(scannerState?.executionState || '');
  const canExecute = Boolean(scannerState?.capabilities.canExecute);
  const preLaunchDisabled = !connected || busy || executionActive || !canExecute;
  const stopDisabled = !connected || loading || pendingAction === 'STOP_PRE_LAUNCH' || !canExecute;

  return (
    <>
      <button
        type="button"
        className={styles.preLaunchButton}
        disabled={preLaunchDisabled}
        title="Run scanner Pre-Launch"
        onClick={() => onAction?.('PRE_LAUNCH')}
      >
        Pre-Launch
      </button>
      <button
        type="button"
        className={styles.stopButton}
        disabled={stopDisabled}
        title="Stop scanner Pre-Launch"
        onClick={() => onAction?.('STOP_PRE_LAUNCH')}
      >
        STOP
      </button>
    </>
  );
};

export default ScannerExecutionPanel;
