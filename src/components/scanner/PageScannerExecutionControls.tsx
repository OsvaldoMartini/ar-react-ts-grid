import React, { useEffect, useMemo, useState } from 'react';
import { Play, RefreshCw, Square } from 'lucide-react';
import QuestionsCard from '../QuestionsCard';
import type {
  BotJobDetailsState,
  BotJobToolbarAction,
  BotJobToolbarPayload,
} from '../bot-job-details/BotJobDetails.types';
import { useSharedBotJobExecutionSelection } from '../bot-job-details/useSharedBotJobExecutionSelection';
import styles from '../bot-job-details/BotJobExecutionControls.module.scss';

interface PageScannerExecutionControlsProps {
  connected: boolean;
  jobState: BotJobDetailsState | null;
  pendingToolbarAction?: BotJobToolbarAction | null;
  operationBusy?: boolean;
  onToolbarAction: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

const ACTIVE_EXECUTION_STATES = new Set(['STARTING', 'RUNNING', 'STOPPING']);

const PageScannerExecutionControls: React.FC<PageScannerExecutionControlsProps> = ({
  connected,
  jobState,
  pendingToolbarAction = null,
  operationBusy = false,
  onToolbarAction,
}) => {
  const [stopConfirmationOpen, setStopConfirmationOpen] = useState(false);
  const blocks = useMemo(() => jobState?.blocks ?? [], [jobState?.blocks]);
  const {
    selectedBlockId,
    mode,
    selectBlock,
    toggleMode,
  } = useSharedBotJobExecutionSelection(jobState?.botJobId, blocks);

  const executionActive = ACTIVE_EXECUTION_STATES.has(jobState?.executionState ?? 'UNKNOWN');
  const testRunStarting = pendingToolbarAction === 'TEST_RUN';
  const executionBusy = operationBusy || pendingToolbarAction !== null;
  const canExecute = Boolean(connected && jobState?.capabilities.canExecute);
  const canRefreshBlocks = Boolean(connected && jobState?.capabilities.canUseWorkspaceActions);
  const stopDisabled = !connected
    || (executionBusy && !testRunStarting)
    || (!executionActive && !testRunStarting)
    || jobState?.executionState === 'STOPPING';

  useEffect(() => {
    if (stopDisabled) setStopConfirmationOpen(false);
  }, [stopDisabled]);

  const startTestRun = () => {
    onToolbarAction('TEST_RUN', {
      executionMode: mode,
      blockId: selectedBlockId === 'all' ? 0 : selectedBlockId,
    });
  };

  return (
    <>
      <div className={styles.inlineControls} aria-label="Page Scanner test execution">
        <div className={styles.inlineField}>
          <select
            id="page-scanner-execution-block"
            aria-label="Page Scanner starting block"
            value={selectedBlockId}
            disabled={!canExecute || executionBusy || executionActive}
            onChange={(event) => {
              const value = event.target.value;
              selectBlock(value === 'all' ? 'all' : Number(value));
            }}
          >
            <option value="all">Execute All</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.order} - {block.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Reload Page Scanner blocks"
          title="Reload blocks"
          disabled={!canRefreshBlocks || executionBusy || executionActive}
          onClick={() => onToolbarAction('REFRESH_BLOCKS')}
        >
          <RefreshCw size={15} aria-hidden="true" />
        </button>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={mode === 'ALL' ? styles.modeAll : styles.modeOne}
            aria-label={`Page Scanner execution mode: ${mode}`}
            aria-pressed={mode === 'ONE'}
            title={selectedBlockId === 'all'
              ? 'Execute All always uses ALL mode'
              : `Switch to ${mode === 'ALL' ? 'ONE' : 'ALL'}`}
            disabled={!canExecute || executionBusy || executionActive || selectedBlockId === 'all'}
            onClick={toggleMode}
          >
            {mode}
          </button>
          <button
            type="button"
            className={styles.testButton}
            disabled={!canExecute || executionBusy || executionActive || blocks.length === 0}
            onClick={startTestRun}
          >
            <Play size={17} fill="currentColor" aria-hidden="true" />
            Test run
          </button>
          <button
            type="button"
            className={styles.stopButton}
            disabled={stopDisabled}
            onClick={() => setStopConfirmationOpen(true)}
          >
            <Square size={15} fill="currentColor" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>
      {stopConfirmationOpen && (
        <QuestionsCard
          mode="confirm"
          header="Stop Test Run"
          body="Do you want to stop the execution?"
          okLabel="Stop"
          cancelLabel="Cancel"
          destructive
          error
          onCancel={() => setStopConfirmationOpen(false)}
          onSubmit={() => {
            setStopConfirmationOpen(false);
            if (!stopDisabled) onToolbarAction('STOP_TEST_RUN');
          }}
        />
      )}
    </>
  );
};

export default PageScannerExecutionControls;
