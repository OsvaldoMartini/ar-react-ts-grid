import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Play, RefreshCw, Rocket, Square } from 'lucide-react';
import type {
  BotJobDetailsState,
  BotJobExecutionMode,
  BotJobToolbarAction,
  BotJobToolbarPayload,
} from './BotJobDetails.types';
import styles from './BotJobExecutionControls.module.scss';

interface BotJobExecutionControlsProps {
  state: BotJobDetailsState | null;
  connected: boolean;
  pendingAction: BotJobToolbarAction | null;
  busy?: boolean;
  onAction: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

const activeExecutionStates = new Set(['STARTING', 'RUNNING', 'STOPPING']);

const BotJobExecutionControls: React.FC<BotJobExecutionControlsProps> = ({
  state,
  connected,
  pendingAction,
  busy: operationBusy = false,
  onAction,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<'all' | number>('all');
  const [mode, setMode] = useState<BotJobExecutionMode>('ALL');
  const [navigationTime, setNavigationTime] = useState(0);
  const blocks = useMemo(() => state?.blocks ?? [], [state?.blocks]);

  useEffect(() => {
    setNavigationTime(state?.navigationTimeSeconds ?? 0);
  }, [state?.navigationTimeSeconds]);

  useEffect(() => {
    setSelectedBlockId((current) => (
      current === 'all' || blocks.some((block) => block.id === current) ? current : 'all'
    ));
  }, [blocks]);

  useEffect(() => {
    if (selectedBlockId === 'all') setMode('ALL');
  }, [selectedBlockId]);

  const executionActive = activeExecutionStates.has(state?.executionState ?? 'UNKNOWN');
  const testRunStarting = pendingAction === 'TEST_RUN';
  const busy = operationBusy || pendingAction !== null;
  const canExecute = Boolean(connected && state?.capabilities.canExecute);
  const canLaunch = Boolean(connected && state?.capabilities.canLaunch);
  const canConfigure = Boolean(connected && state?.capabilities.canUseWorkspaceActions);
  const hasBlocks = blocks.length > 0;
  const selectedLabel = useMemo(() => {
    if (selectedBlockId === 'all') return 'the complete job';
    return blocks.find((block) => block.id === selectedBlockId)?.name ?? 'the selected block';
  }, [blocks, selectedBlockId]);

  const cycleNavigationTime = () => {
    const next = navigationTime >= 10 ? 0 : navigationTime + 1;
    setNavigationTime(next);
    onAction('SET_NAVIGATION_TIME', { navigationTimeSeconds: next });
  };

  const navigationTimeTone = (seconds: number): string => {
    if (seconds <= 1) return styles.navTimeGreen;
    if (seconds <= 6) return styles.navTimeOrangeLight;
    return styles.navTimeOrangeDark;
  };

  const startTestRun = () => {
    onAction('TEST_RUN', {
      executionMode: mode,
      blockId: selectedBlockId === 'all' ? 0 : selectedBlockId,
    });
  };

  return (
    <section className={styles.panel} aria-labelledby="execution-controls-title">
      <div className={styles.heading} title="Launch the Engine or validate this job locally with a test run.">
        <h2 id="execution-controls-title">Execution</h2>
        <span className={styles.state}>{state?.executionState ?? 'UNKNOWN'}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.navigationForm}>
          <span className={styles.fieldLabel}>Navigation time</span>
          <button
            type="button"
            className={`${styles.navTimeToggle} ${navigationTimeTone(navigationTime)}`}
            aria-label={`Navigation time: ${navigationTime} seconds`}
            title="Click to cycle 0-10 seconds; saves automatically"
            disabled={!canConfigure || busy || executionActive}
            onClick={cycleNavigationTime}
          >
            <Clock size={16} aria-hidden="true" />
            {navigationTime}s
          </button>
        </div>

        <div className={styles.scopeField}>
          <label htmlFor="bot-job-execution-block">Starting block</label>
          <div className={styles.inlineField}>
            <select
              id="bot-job-execution-block"
              value={selectedBlockId}
              disabled={!canExecute || busy || executionActive}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedBlockId(value === 'all' ? 'all' : Number(value));
              }}
            >
              <option value="all">Execute All</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.order} - {block.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Reload blocks"
              title="Reload blocks"
              disabled={!canConfigure || busy || executionActive}
              onClick={() => onAction('REFRESH_BLOCKS')}
            >
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={styles.runActions}>
          <span className={styles.fieldLabel}>Run scope</span>
          <div className={styles.actionRow}>
            <button
              type="button"
              className={mode === 'ALL' ? styles.modeAll : styles.modeOne}
              aria-label={'Execution mode: ' + mode}
              aria-pressed={mode === 'ONE'}
              title={selectedBlockId === 'all'
                ? 'Execute All always uses ALL mode'
                : 'Switch to ' + (mode === 'ALL' ? 'ONE' : 'ALL')}
              disabled={!canExecute || busy || executionActive || selectedBlockId === 'all'}
              onClick={() => setMode((current) => (current === 'ALL' ? 'ONE' : 'ALL'))}
            >
              {mode}
            </button>
            <button
              type="button"
              className={styles.launchButton}
              disabled={!canLaunch || busy || executionActive}
              onClick={() => onAction('LAUNCH')}
            >
              <Rocket size={17} aria-hidden="true" />
              Launch
            </button>
            <button
              type="button"
              className={styles.testButton}
              disabled={!canExecute || busy || executionActive || !hasBlocks}
              onClick={startTestRun}
            >
              <Play size={17} fill="currentColor" aria-hidden="true" />
              Test run
            </button>
            <button
              type="button"
              className={styles.stopButton}
              disabled={!connected
                || (busy && !testRunStarting)
                || (!executionActive && !testRunStarting)
                || state?.executionState === 'STOPPING'}
              onClick={() => onAction('STOP_TEST_RUN')}
            >
              <Square size={15} fill="currentColor" aria-hidden="true" />
              Stop
            </button>
          </div>
          <span className={styles.scopeHint}>
            {mode === 'ONE'
              ? 'Run only ' + selectedLabel + '.'
              : 'Run from ' + selectedLabel + ' and continue.'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default BotJobExecutionControls;
