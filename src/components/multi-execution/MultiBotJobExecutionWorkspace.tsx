import React, { useEffect } from 'react';
import { GripHorizontal, Layers3, Play, ShieldAlert, X } from 'lucide-react';
import FloatingWorkspaceFrame from '../workspace/FloatingWorkspaceFrame';
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
  onClose,
}) => {
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
        <ShieldAlert size={17} aria-hidden="true" />
        <span>
          Selection review is ready. Starting concurrent jobs remains disabled until the isolated
          TypeScript Playwright runtime is installed; the legacy global browser will not be used.
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Bot Job</th>
              <th>Organization</th>
              <th>Environment</th>
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
                  <span className={job.active && job.launchable !== false ? styles.ready : styles.unavailable}>
                    {job.launchable === false ? 'Mobile only' : job.active ? 'Selected' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={styles.footer}>
        <span>The checked-ID launch draft is frozen until this manager is closed.</span>
        <button type="button" disabled title="Isolated multi-run runtime is not installed yet">
          <Play size={15} fill="currentColor" aria-hidden="true" />
          Start Selected
        </button>
      </footer>
    </FloatingWorkspaceFrame>
  );
};

export default MultiBotJobExecutionWorkspace;
