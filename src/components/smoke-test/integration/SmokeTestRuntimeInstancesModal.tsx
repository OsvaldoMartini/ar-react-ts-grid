import React, { useEffect, useRef } from 'react';
import { Activity, RefreshCw, ServerCog, Square, X, Zap } from 'lucide-react';
import type { V2RuntimeState } from './SmokeTestV2RuntimeToggle';
import styles from './SmokeTestRuntimeInstancesModal.module.scss';

export type SmokeTestRuntimeInstance = Readonly<{
  runId: string;
  integrationEpoch: number;
  runtimeMode: 'JAVA_V1' | 'TYPESCRIPT_PLAYWRIGHT_V2';
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  status: string;
  stepPending: boolean;
  terminalPending: boolean;
  currentInstructionId: number;
  currentRequestId: string;
  startedAt: string;
  browserSession: string;
}>;

type Props = {
  instances: readonly SmokeTestRuntimeInstance[];
  loading: boolean;
  pendingRunId: string | null;
  serverState?: V2RuntimeState;
  serverPending?: boolean;
  onServerToggle?: () => void;
  onRefresh: () => void;
  onControl: (runId: string, action: 'STOP' | 'KILL') => void;
  onClose: () => void;
};

const SmokeTestRuntimeInstancesModal: React.FC<Props> = ({
  instances,
  loading,
  pendingRunId,
  serverState = 'UNKNOWN',
  serverPending = false,
  onServerToggle,
  onRefresh,
  onControl,
  onClose,
}) => {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const serverReady = serverState === 'READY' || serverState === 'READY_EXTERNAL';

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="runtime-instances-title">
        <header>
          <span className={styles.headingIcon}><Activity size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="runtime-instances-title">Runtime Instances</h2>
            <p>Live Java V1 and TypeScript V2 execution memory</p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close Runtime Instances" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.toolbar}>
          {onServerToggle && (
            <button type="button" className={styles.server} data-ready={serverReady}
              disabled={serverPending || serverState === 'READY_EXTERNAL'} onClick={onServerToggle}>
              <ServerCog size={15} aria-hidden="true" />
              {serverPending ? 'WAIT' : serverReady ? 'STOP V2 SERVER' : 'START V2 SERVER'}
            </button>
          )}
          <button type="button" className={styles.refresh} disabled={loading} onClick={onRefresh}>
            <RefreshCw size={15} aria-hidden="true" /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          <span>{instances.length} active</span>
        </div>

        <div className={styles.body}>
          {instances.length === 0 ? (
            <div className={styles.empty}><Activity size={28} aria-hidden="true" />No Integration runtime instance is active.</div>
          ) : instances.map(instance => {
            const busy = pendingRunId === instance.runId;
            return (
              <article key={instance.runId} className={styles.instance} data-mode={instance.runtimeMode}>
                <div className={styles.summary}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  <div>
                    <strong>Bot Job #{instance.botJobId} · {instance.botJobName}</strong>
                    <small>{instance.runtimeMode === 'JAVA_V1' ? 'Java V1 · shared Playwright' : 'V2 · isolated Playwright'}</small>
                  </div>
                  <b>{instance.status}</b>
                </div>
                <dl>
                  <div><dt>Run</dt><dd title={instance.runId}>{instance.runId}</dd></div>
                  <div><dt>Current</dt><dd>{instance.currentInstructionId > 0 ? `Instruction #${instance.currentInstructionId}` : 'Idle between instructions'}</dd></div>
                  <div><dt>Session</dt><dd>{instance.browserSession}</dd></div>
                  <div><dt>Started</dt><dd>{new Date(instance.startedAt).toLocaleString()}</dd></div>
                </dl>
                <div className={styles.actions}>
                  <button type="button" className={styles.stop} disabled={busy}
                    aria-label={`Stop run ${instance.runId}`} onClick={() => onControl(instance.runId, 'STOP')}>
                    <Square size={14} aria-hidden="true" /> Stop Run
                  </button>
                  <button type="button" className={styles.kill} disabled={busy}
                    aria-label={`Kill instance ${instance.runId}`} onClick={() => onControl(instance.runId, 'KILL')}>
                    <Zap size={14} aria-hidden="true" /> Kill Instance
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default SmokeTestRuntimeInstancesModal;
