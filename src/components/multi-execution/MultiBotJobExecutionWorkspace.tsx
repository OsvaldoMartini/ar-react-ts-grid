import React, { useEffect, useMemo, useState } from 'react';
import { GripHorizontal, Layers3, LoaderCircle, Play, RefreshCw, ShieldAlert, X } from 'lucide-react';
import FloatingWorkspaceFrame from '../workspace/FloatingWorkspaceFrame';
import {
  type MultiExecutionDataMode,
  useMultiExecutionPreflight,
} from './useMultiExecutionPreflight';
import styles from './MultiBotJobExecutionWorkspace.module.scss';

export interface MultiExecutionBotJob {
  id: number;
  name: string;
  homeBankingId?: number | null;
  homeUrlId?: number | null;
  organizationName?: string | null;
  environmentName?: string | null;
  environmentUrl?: string | null;
  active: boolean;
  launchable?: boolean;
}

interface MultiBotJobExecutionWorkspaceProps {
  selectedJobs: readonly MultiExecutionBotJob[];
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  messageGeneration?: number;
  onClose: () => void;
}

const initialPosition = () => {
  const width = Math.min(920, Math.max(320, window.innerWidth - 32));
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.min(72, window.innerHeight - 260)),
  };
};

const MultiBotJobExecutionWorkspace: React.FC<MultiBotJobExecutionWorkspaceProps> = ({
  selectedJobs,
  webSocket,
  connected,
  messages,
  messageGeneration = 0,
  onClose,
}) => {
  const [modes, setModes] = useState<ReadonlyMap<number, MultiExecutionDataMode>>(
    () => new Map(selectedJobs.map(job => [job.id, 'REAL'])),
  );
  const { state: preflight, runPreflight, invalidate } = useMultiExecutionPreflight({
    webSocket,
    connected,
    messages,
    messageGeneration,
    selectedJobs,
    modes,
  });
  const controllerInstalled = false;
  const startTitle = preflight.status !== 'READY'
    ? 'Run preflight before starting selected Bot Jobs'
    : 'The per-Bot-Job React Run controller is the next implementation checkpoint';
  const noticeText = useMemo(() => {
    if (preflight.status === 'CHECKING') return 'Validating exact database plans and V2 command coverage.';
    if (preflight.status === 'READY') {
      return 'Every selected plan passed preflight. Start remains locked until the per-Bot-Job React Run controller owns data, Runtime Variables, and ExcelWriter state.';
    }
    return preflight.message;
  }, [preflight.message, preflight.status]);

  const changeMode = (botJobId: number, mode: MultiExecutionDataMode) => {
    setModes(current => new Map(current).set(botJobId, mode));
    invalidate();
  };
  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  return (
    <FloatingWorkspaceFrame
      className={styles.panel}
      initialPosition={initialPosition}
      aria-label="Multi-Bot-Job Execution Manager"
      data-testid="multi-bot-job-execution-manager"
    >
      <header
        className={styles.header}
        data-floating-workspace-drag-handle
        data-testid="multi-bot-job-execution-drag-handle"
      >
        <div className={styles.heading}>
          <GripHorizontal size={18} aria-hidden="true" />
          <Layers3 size={21} aria-hidden="true" />
          <span>
            <h2>Multi-Bot-Job Execution Manager</h2>
            <small>{selectedJobs.length} checked Bot Job{selectedJobs.length === 1 ? '' : 's'}</small>
          </span>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          title="Close Multi-Bot-Job Execution Manager"
          aria-label="Close Multi-Bot-Job Execution Manager"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.notice} role="status">
        {preflight.status === 'CHECKING'
          ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
          : <ShieldAlert size={17} aria-hidden="true" />}
        <span>{noticeText}</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Bot Job</th>
              <th>Organization</th>
              <th>Environment</th>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {selectedJobs.map(job => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td><strong>{job.name}</strong></td>
                <td>{job.organizationName || 'Unavailable'}</td>
                <td>{job.environmentName || job.environmentUrl || 'Unavailable'}</td>
                <td>
                  <select
                    value={modes.get(job.id) ?? 'REAL'}
                    disabled={preflight.status === 'CHECKING'}
                    aria-label={`Execution data for ${job.name}`}
                    onChange={event => changeMode(job.id, event.target.value as MultiExecutionDataMode)}
                  >
                    <option value="REAL">Real</option>
                    <option value="SYNTHETIC">Synthetic</option>
                  </select>
                </td>
                <td title={preflight.jobs.get(job.id)?.message}>
                  <span className={preflight.jobs.get(job.id)?.ready ? styles.ready : styles.unavailable}>
                    {preflight.jobs.get(job.id)?.ready
                      ? `${preflight.jobs.get(job.id)?.instructionCount ?? 0} ready`
                      : preflight.jobs.get(job.id)?.unsupportedActions.length
                        ? `Unsupported: ${preflight.jobs.get(job.id)?.unsupportedActions.join(', ')}`
                        : job.launchable === false ? 'Mobile only' : job.active ? 'Needs preflight' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={styles.footer}>
        <span>The checked-ID launch draft is frozen until this manager is closed.</span>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.preflightButton}
            disabled={!connected || preflight.status === 'CHECKING'}
            onClick={runPreflight}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {preflight.status === 'CHECKING' ? 'Checking…' : 'Run Preflight'}
          </button>
          <button type="button" disabled={!controllerInstalled || preflight.status !== 'READY'} title={startTitle}>
            <Play size={15} fill="currentColor" aria-hidden="true" />
            Start Selected
          </button>
        </div>
      </footer>
    </FloatingWorkspaceFrame>
  );
};

export default MultiBotJobExecutionWorkspace;
