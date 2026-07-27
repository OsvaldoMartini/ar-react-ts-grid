import React from 'react';
import PagesOpenButton from '../PagesOpenButton';
import type { BotJobWorkspaceStatusTone } from './BotJobDetails.types';
import styles from './ComponentWorkspaceHeader.module.scss';

interface ComponentWorkspaceHeaderProps {
  botJobId: number | null;
  botJobName: string | null;
  connected: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  status?: string;
  statusTone?: BotJobWorkspaceStatusTone;
  webSocket?: WebSocket | null;
  messages?: readonly string[];
  sessionId?: string;
  onRetry?: () => void;
  onClose: () => void;
}

const ComponentWorkspaceHeader: React.FC<ComponentWorkspaceHeaderProps> = ({
  botJobId,
  botJobName,
  connected,
  reconnectAttempts = 0,
  error,
  status,
  statusTone = 'neutral',
  webSocket = null,
  messages = [],
  sessionId = '',
  onRetry,
  onClose,
}) => {
  const resolvedStatus = error
    || status
    || (connected
      ? 'Components loaded'
      : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`);
  const statusClass = error || statusTone === 'error'
    ? styles.statusError
    : !connected || statusTone === 'warning'
      ? styles.statusWarn
      : styles.statusOk;
  const subtitle = botJobName
    ? `${botJobName}${botJobId && botJobId > 0 ? ` - Bot Job ID ${botJobId}` : ''}`
    : 'Reusable instructions for the current Bot Job';

  return (
    <header className={styles.topBar} data-floating-workspace-drag-handle>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Components</h1>
        <p className={styles.subtitle} title={subtitle}>{subtitle}</p>
      </div>
      <div className={styles.topBarRight} data-floating-drag-ignore="true">
        <div className={`${styles.status} ${statusClass}`} role="status">
          {resolvedStatus}
        </div>
        {sessionId && (
          <PagesOpenButton
            webSocket={webSocket}
            connected={connected}
            messages={messages}
            sessionId={sessionId}
          />
        )}
        {onRetry && (
          <button
            type="button"
            className={styles.refreshButton}
            title="Reload Components from the authoritative database"
            onClick={onRetry}
          >
            Refresh
          </button>
        )}
        <button
          type="button"
          className={styles.closeButton}
          title="Close only this Components window"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </header>
  );
};

export default ComponentWorkspaceHeader;
