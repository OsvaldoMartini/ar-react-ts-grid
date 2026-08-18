import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import OrganizationManager from './OrganizationManager';
import styles from './OrganizationPage.module.scss';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const OrganizationPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => (
  <DetachedPageShell
    title="Organizations"
    testId="organization-page"
    onClose={undefined}
    showCloseButton={false}
  >
    <div className={styles.frame}>
      <OrganizationManager
        socketPort={socketPort}
        sessionId={sessionId}
        showCloseAction
        onClose={onClose}
      />
    </div>
  </DetachedPageShell>
);

export default OrganizationPage;
