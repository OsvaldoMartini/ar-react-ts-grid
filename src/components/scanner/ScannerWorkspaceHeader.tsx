import React from 'react';
import WorkspaceHeader from '../workspace/WorkspaceHeader';
import styles from './ScannerWorkspaceHeader.module.scss';

interface ScannerWorkspaceHeaderProps {
  botJobName: string | null;
  connected: boolean;
  reconnectAttempts?: number;
  error?: string | null;
}

const ScannerWorkspaceHeader: React.FC<ScannerWorkspaceHeaderProps> = ({
  botJobName,
  connected,
  reconnectAttempts = 0,
  error,
}) => (
  <div className={styles.wrapper}>
    <WorkspaceHeader
      eyebrow="Scanner"
      title="AR Web Factory"
      subtitle={botJobName || 'No Bot Job selected'}
      connected={connected}
      status={error || (connected ? 'Scanner workspace ready' : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`)}
      statusTone={error ? 'error' : connected ? 'success' : 'warning'}
      compact
    />
  </div>
);

export default ScannerWorkspaceHeader;
