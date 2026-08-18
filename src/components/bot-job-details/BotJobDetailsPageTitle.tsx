import React from 'react';
import PagesOpenButton from '../PagesOpenButton';
import type { BotJobWorkspaceStatusTone } from './BotJobDetails.types';
import styles from './BotJobDetailsPageTitle.module.scss';

interface BotJobDetailsPageTitleProps {
  botJobId: number | null;
  botJobName: string | null;
  connected: boolean;
  status?: string;
  statusTone?: BotJobWorkspaceStatusTone;
  webSocket?: WebSocket | null;
  messages?: readonly string[];
  sessionId?: string;
  onClose: () => void;
}

const BotJobDetailsPageTitle: React.FC<BotJobDetailsPageTitleProps> = ({
  botJobId,
  botJobName,
  connected,
  status,
  statusTone = 'neutral',
  webSocket = null,
  messages = [],
  sessionId = '',
  onClose,
}) => {
  const statusClass = statusTone === 'error'
    ? styles.statusError
    : statusTone === 'warning' || !connected
      ? styles.statusWarn
      : styles.statusOk;
  const statusText = status
    || (connected ? 'Bot Job Details loaded' : 'Connecting to Bot Job Details...');
  const subtitle = botJobName
    ? `${botJobName}${botJobId ? ` - Bot Job ID ${botJobId}` : ''}`
    : 'Automation job instructions and execution';

  return (
    <header className={styles.topBar} data-floating-workspace-drag-handle>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Bot Job Details</h1>
        <p className={styles.subtitle} title={subtitle}>{subtitle}</p>
      </div>
      <div className={styles.topBarRight} data-floating-drag-ignore="true">
        <div className={`${styles.status} ${statusClass}`} role="status">
          {statusText}
        </div>
        {sessionId && (
          <PagesOpenButton
            webSocket={webSocket}
            connected={connected}
            messages={messages}
            sessionId={sessionId}
          />
        )}
        <button
          type="button"
          className={styles.closeButton}
          title="Close only this Bot Job Details window"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </header>
  );
};

export default BotJobDetailsPageTitle;
