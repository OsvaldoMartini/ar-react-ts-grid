import {
  LoaderCircle,
  MousePointerClick,
  Power,
  TextCursorInput,
} from 'lucide-react';
import type { GridItemTestAction } from '../bot-job-details/grid/hooks/useGridItemTestAction';
import styles from './SmokeTestInstructionActions.module.scss';

type Props = {
  instructionName: string;
  active: boolean;
  testable: boolean;
  disabled: boolean;
  pendingAction: GridItemTestAction | null;
  statusPending: boolean;
  onTest: (action: GridItemTestAction) => void;
  onToggleStatus: () => void;
};

const SmokeTestInstructionActions: React.FC<Props> = ({
  instructionName,
  active,
  testable,
  disabled,
  pendingAction,
  statusPending,
  onTest,
  onToggleStatus,
}) => {
  const testPending = pendingAction !== null;
  const controlsBusy = disabled || testPending || statusPending;

  return (
    <div className={styles.actions} aria-label={`Actions for ${instructionName}`}>
      <button
        type="button"
        className={`${styles.statusButton} ${active ? styles.active : styles.inactive}`}
        aria-pressed={active}
        disabled={controlsBusy}
        title={statusPending
          ? 'Saving command status...'
          : `${active ? 'Deactivate' : 'Activate'} ${instructionName}`}
        onClick={onToggleStatus}
      >
        {statusPending
          ? <LoaderCircle className={styles.spin} size={15} aria-hidden="true" />
          : <Power size={15} aria-hidden="true" />}
        <span>
          <strong>{active ? 'Active' : 'Inactive'}</strong>
          <small>Command</small>
        </span>
      </button>

      {testable && (
        <div className={styles.testActions}>
          <button
            type="button"
            className={`${styles.testButton} ${styles.inputButton}`}
            disabled={controlsBusy}
            title={pendingAction === 'INPUT'
              ? 'Testing input...'
              : `Test Input on ${instructionName}`}
            onClick={() => onTest('INPUT')}
          >
            {pendingAction === 'INPUT'
              ? <LoaderCircle className={styles.spin} size={15} aria-hidden="true" />
              : <TextCursorInput size={15} aria-hidden="true" />}
            <span><strong>Test</strong><small>Input</small></span>
          </button>
          <button
            type="button"
            className={`${styles.testButton} ${styles.clickButton}`}
            disabled={controlsBusy}
            title={pendingAction === 'CLICK'
              ? 'Testing click...'
              : `Test Click on ${instructionName}`}
            onClick={() => onTest('CLICK')}
          >
            {pendingAction === 'CLICK'
              ? <LoaderCircle className={styles.spin} size={15} aria-hidden="true" />
              : <MousePointerClick size={15} aria-hidden="true" />}
            <span><strong>Test</strong><small>Click</small></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SmokeTestInstructionActions;
