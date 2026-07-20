import React from 'react';
import WorkspaceHeader, { type WorkspaceHeaderAction } from '../workspace/WorkspaceHeader';
import styles from './PageScannerWorkspaceHeader.module.scss';

type PageScannerHeaderAction = 'CLOSE_PAGE_SCANNER';

interface PageScannerWorkspaceHeaderProps {
  botJobId: number | null;
  botJobName: string | null;
  connected: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  status?: string;
  statusTone?: 'neutral' | 'success' | 'warning' | 'error';
  closing?: boolean;
  onClose: () => void;
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
  onClose,
}) => {
  const actions: WorkspaceHeaderAction<PageScannerHeaderAction>[] = [
    {
      id: 'CLOSE_PAGE_SCANNER',
      label: closing ? 'Closing...' : 'Close',
      title: 'Close only this Page Scanner window',
      tone: 'danger',
      disabled: closing,
    },
  ];
  const resolvedStatus = error
    || status
    || (connected
      ? 'Page Scanner ready'
      : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`);
  const resolvedTone = error ? 'error' : connected ? statusTone : 'warning';
  const subtitle = botJobId && botJobId > 0
    ? `Bot Job ID ${botJobId}`
    : 'Waiting for Bot Job details';

  return (
    <div className={styles.wrapper}>
      <WorkspaceHeader
        eyebrow="Page Scanner"
        title={botJobName || 'AR Web Factory'}
        subtitle={subtitle}
        connected={connected}
        status={resolvedStatus}
        statusTone={resolvedTone}
        actions={actions}
        onAction={onClose}
        compact
      />
    </div>
  );
};

export default PageScannerWorkspaceHeader;
