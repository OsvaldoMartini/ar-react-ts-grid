import React from 'react';
import PagesOpenButton from '../PagesOpenButton';
import styles from './PageScannerWorkspaceHeader.module.scss';

interface PageScannerWorkspaceHeaderProps {
  botJobId: number | null;
  botJobName: string | null;
  connected: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  status?: string;
  statusTone?: 'neutral' | 'success' | 'warning' | 'error';
  closing?: boolean;
  webSocket?: WebSocket | null;
  messages?: readonly string[];
  sessionId?: string;
  onClose: () => void;
  onOpenPageMappings?: () => void;
}

const PageScannerWorkspaceHeader: React.FC<PageScannerWorkspaceHeaderProps> = ({
  botJobId,
  botJobName,
  connected,
  reconnectAttempts = 0,
  error,
  status,
  statusTone = 'neutral',
  closing = false,
  webSocket = null,
  messages = [],
  sessionId = '',
  onClose,
  onOpenPageMappings,
}) => {
  const resolvedStatus = error
    || status
    || (connected
      ? 'Page Scanner ready'
      : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`);
  const statusClass = error || statusTone === 'error'
    ? styles.statusError
    : !connected || statusTone === 'warning'
      ? styles.statusWarn
      : styles.statusOk;
  const subtitle = botJobName
    ? `${botJobName}${botJobId && botJobId > 0 ? ` - Bot Job ID ${botJobId}` : ''}`
    : 'Scan web elements for the current Bot Job';

  return (
    <header className={styles.topBar} data-floating-workspace-drag-handle>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Page Scanner</h1>
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
        {onOpenPageMappings && (
          <button
            type="button"
            className={styles.closeButton}
            title="Open Page Mappings history"
            disabled={!connected || !botJobId || botJobId <= 0}
            onClick={onOpenPageMappings}
          >
            Mappings
          </button>
        )}
        <button
          type="button"
          className={styles.closeButton}
          title="Close only this Page Scanner window"
          disabled={closing}
          onClick={onClose}
        >
          {closing ? 'Closing...' : 'Close'}
        </button>
      </div>
    </header>
  );
};

export default PageScannerWorkspaceHeader;
