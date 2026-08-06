import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import styles from './RuntimeVariablesPage.module.scss';

export const RUNTIME_VARIABLES_SESSION_ID = 'runtimeVariablesManager';

interface RuntimeVariablesPageProps {
  socketPort: number;
  sessionId: string;
  sourceBotJobId?: number;
  onClose?: () => void;
}

const RuntimeVariablesPage: React.FC<RuntimeVariablesPageProps> = ({
  sourceBotJobId,
  onClose,
}) => (
  <DetachedPageShell
    title="Runtime Variables"
    testId="runtime-variables-page"
    onClose={undefined}
    showCloseButton={false}
  >
    <main className={styles.shell}>
      <section className={styles.window}>
        <header className={styles.topBar} data-floating-workspace-drag-handle>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Runtime Variables</h1>
            <p className={styles.subtitle}>
              {sourceBotJobId && sourceBotJobId > 0
                ? `Bot Job #${sourceBotJobId} · live memory mirror`
                : 'Live Bot Job memory mirror'}
            </p>
          </div>
          <div className={styles.topBarRight} data-floating-drag-ignore="true">
            <div className={`${styles.status} ${styles.statusWarn}`} role="status">
              Waiting for runtime memory
            </div>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <section className={styles.content} aria-label="Runtime variable memory">
          <div className={styles.emptyState}>
            <strong>Runtime memory is ready for integration</strong>
            <span>
              This isolated page will display the selected Bot Job variables and receive
              read-only updates during Test Run and Smoke Test execution.
            </span>
          </div>
        </section>
      </section>
    </main>
  </DetachedPageShell>
);

export default RuntimeVariablesPage;
