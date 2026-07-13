import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Play, RefreshCw, Rocket, Square } from 'lucide-react';
import WorkspaceHeader, { type WorkspaceHeaderAction } from '../workspace/WorkspaceHeader';
import BotJobDataActions from './BotJobDataActions';
import BotJobFileActions from './BotJobFileActions';
import type {
  BotJobDetailsState,
  BotJobExecutionMode,
  BotJobToolbarAction,
  BotJobToolbarPayload,
  BotJobWorkspaceAction,
  BotJobWorkspaceStatusTone,
  BotJobWorkspaceSurface,
} from './BotJobDetails.types';
import styles from './BotJobDetailsHeader.module.scss';
import execStyles from './BotJobExecutionControls.module.scss';

interface BotJobDetailsHeaderProps {
  botJobId: number | null;
  botJobName: string | null;
  activeSurface: BotJobWorkspaceSurface;
  connected: boolean;
  pendingAction?: BotJobWorkspaceAction | null;
  busy?: boolean;
  status?: string;
  statusTone?: BotJobWorkspaceStatusTone;
  onAction: (action: BotJobWorkspaceAction) => void;
  compact?: boolean;
  canUseWorkspaceActions?: boolean;
  canUsePreScan?: boolean;
  canShowComponents?: boolean;
  jobState?: BotJobDetailsState | null;
  pendingToolbarAction?: BotJobToolbarAction | null;
  operationBusy?: boolean;
  transferBusy?: boolean;
  transferPath?: string;
  onToolbarAction?: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

const activeExecutionStates = new Set(['STARTING', 'RUNNING', 'STOPPING']);

const BotJobDetailsHeader: React.FC<BotJobDetailsHeaderProps> = ({
  botJobId,
  botJobName,
  activeSurface,
  connected,
  pendingAction = null,
  busy = false,
  status = 'Ready',
  statusTone = 'neutral',
  onAction,
  compact = false,
  canUseWorkspaceActions = true,
  canUsePreScan = true,
  canShowComponents = true,
  jobState = null,
  pendingToolbarAction = null,
  operationBusy = false,
  transferBusy = false,
  transferPath = '',
  onToolbarAction,
}) => {
  const actions = useMemo<WorkspaceHeaderAction<BotJobWorkspaceAction>[]>(() => {
    const pending = busy || pendingAction !== null;
    const unavailable = !connected || !botJobId || botJobId <= 0;
    return [
      { id: 'REFRESH', label: pendingAction === 'REFRESH' ? 'Refreshing…' : 'Refresh', disabled: pending || unavailable || !canUseWorkspaceActions },
      { id: 'SHOW_BOT_JOB', label: 'Bot Job', tone: 'primary', active: activeSurface === 'botJob', disabled: pending || unavailable || !canUseWorkspaceActions || activeSurface === 'botJob' },
      {
        id: activeSurface === 'components' ? 'HIDE_COMPONENTS' : 'SHOW_COMPONENTS',
        label: activeSurface === 'components' ? 'Hide Components' : 'Components',
        tone: 'primary',
        active: activeSurface === 'components',
        disabled: pending || unavailable || !canShowComponents,
      },
      { id: 'SHOW_PRE_SCAN', label: 'Pre Scan', tone: 'success', active: activeSurface === 'preScan', disabled: pending || unavailable || !canUsePreScan || activeSurface === 'preScan' },
      { id: 'CLOSE', label: 'Close', tone: 'danger', disabled: false },
    ];
  }, [activeSurface, botJobId, busy, canShowComponents, canUsePreScan, canUseWorkspaceActions, connected, pendingAction]);

  // --- Execution state (moved from BotJobExecutionControls) ---
  const [selectedBlockId, setSelectedBlockId] = useState<'all' | number>('all');
  const [mode, setMode] = useState<BotJobExecutionMode>('ALL');
  const [navigationTime, setNavigationTime] = useState(0);
  const blocks = useMemo(() => jobState?.blocks ?? [], [jobState?.blocks]);

  useEffect(() => {
    setNavigationTime(jobState?.navigationTimeSeconds ?? 0);
  }, [jobState?.navigationTimeSeconds]);

  useEffect(() => {
    setSelectedBlockId((current) => (
      current === 'all' || blocks.some((block) => block.id === current) ? current : 'all'
    ));
  }, [blocks]);

  useEffect(() => {
    if (selectedBlockId === 'all') setMode('ALL');
  }, [selectedBlockId]);

  const executionActive = activeExecutionStates.has(jobState?.executionState ?? 'UNKNOWN');
  const testRunStarting = pendingToolbarAction === 'TEST_RUN';
  const executionBusy = operationBusy || pendingToolbarAction !== null;
  const canExecute = Boolean(connected && jobState?.capabilities.canExecute);
  const canLaunch = Boolean(connected && jobState?.capabilities.canLaunch);
  const canConfigure = Boolean(connected && jobState?.capabilities.canUseWorkspaceActions);
  const hasBlocks = blocks.length > 0;

  const cycleNavigationTime = () => {
    const next = navigationTime >= 10 ? 0 : navigationTime + 1;
    setNavigationTime(next);
    onToolbarAction?.('SET_NAVIGATION_TIME', { navigationTimeSeconds: next });
  };

  const navigationTimeTone = (seconds: number): string => {
    if (seconds <= 1) return execStyles.navTimeGreen;
    if (seconds <= 6) return execStyles.navTimeOrangeLight;
    return execStyles.navTimeOrangeDark;
  };

  const startTestRun = () => {
    onToolbarAction?.('TEST_RUN', {
      executionMode: mode,
      blockId: selectedBlockId === 'all' ? 0 : selectedBlockId,
    });
  };

  return (
    <div className={styles.wrapper}>
      <WorkspaceHeader
        eyebrow="Bot Job Details"
        title={botJobName || 'Unnamed Bot Job'}
        subtitle={botJobId ? `Bot Job ID ${botJobId}` : 'Bot Job ID unavailable'}
        connected={connected}
        status={status}
        statusTone={statusTone}
        actions={actions}
        onAction={onAction}
        compact={compact}
        className={styles.keepButtonsOnTop}
        extraActionsBeforeId="CLOSE"
        extraActions={onToolbarAction && (
          <BotJobDataActions
            state={jobState}
            connected={connected}
            pendingAction={pendingToolbarAction}
            busy={transferBusy}
            onAction={onToolbarAction}
          />
        )}
      />
      <WorkspaceHeader
        eyebrow="Execution"
        title={botJobName || 'Unnamed Bot Job'}
        subtitle={jobState?.executionState ?? 'UNKNOWN'}
        connected={connected}
        status={status}
        statusTone={statusTone}
        compact={compact}
        className={styles.keepButtonsOnTop}
        extraActions={onToolbarAction && (
          <>
            <div className={execStyles.inlineField}>
              <select
                id="bot-job-execution-block"
                aria-label="Starting block"
                value={selectedBlockId}
                disabled={!canExecute || executionBusy || executionActive}
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
                className={execStyles.iconButton}
                aria-label="Reload blocks"
                title="Reload blocks"
                disabled={!canConfigure || executionBusy || executionActive}
                onClick={() => onToolbarAction('REFRESH_BLOCKS')}
              >
                <RefreshCw size={17} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className={`${execStyles.navTimeToggle} ${navigationTimeTone(navigationTime)}`}
              aria-label={`Navigation time: ${navigationTime} seconds`}
              title="Click to cycle 0-10 seconds; saves automatically"
              disabled={!canConfigure || executionBusy || executionActive}
              onClick={cycleNavigationTime}
            >
              <Clock size={16} aria-hidden="true" />
              {navigationTime}s
            </button>
            <div className={execStyles.actionRow}>
              <button
                type="button"
                className={mode === 'ALL' ? execStyles.modeAll : execStyles.modeOne}
                aria-label={'Execution mode: ' + mode}
                aria-pressed={mode === 'ONE'}
                title={selectedBlockId === 'all'
                  ? 'Execute All always uses ALL mode'
                  : 'Switch to ' + (mode === 'ALL' ? 'ONE' : 'ALL')}
                disabled={!canExecute || executionBusy || executionActive || selectedBlockId === 'all'}
                onClick={() => setMode((current) => (current === 'ALL' ? 'ONE' : 'ALL'))}
              >
                {mode}
              </button>
              <button
                type="button"
                className={execStyles.launchButton}
                disabled={!canLaunch || executionBusy || executionActive}
                onClick={() => onToolbarAction('LAUNCH')}
              >
                <Rocket size={17} aria-hidden="true" />
                Launch
              </button>
              <button
                type="button"
                className={execStyles.testButton}
                disabled={!canExecute || executionBusy || executionActive || !hasBlocks}
                onClick={startTestRun}
              >
                <Play size={17} fill="currentColor" aria-hidden="true" />
                Test run
              </button>
              <button
                type="button"
                className={execStyles.stopButton}
                disabled={!connected
                  || (executionBusy && !testRunStarting)
                  || (!executionActive && !testRunStarting)
                  || jobState?.executionState === 'STOPPING'}
                onClick={() => onToolbarAction('STOP_TEST_RUN')}
              >
                <Square size={15} fill="currentColor" aria-hidden="true" />
                Stop
              </button>
            </div>
            <BotJobFileActions
              state={jobState}
              connected={connected}
              pendingAction={pendingToolbarAction}
              busy={transferBusy}
              transferPath={transferPath}
              onAction={onToolbarAction}
            />
          </>
        )}
      />
    </div>
  );
};

export default BotJobDetailsHeader;
