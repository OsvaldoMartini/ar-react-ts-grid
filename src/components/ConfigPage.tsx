import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import TemplateForm from './TemplateForm';
import styles from './ConfigPage.module.scss';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const ConfigPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => (
  <DetachedPageShell title="Config" testId="config-page" onClose={undefined} showCloseButton={false}>
    <div className={styles.frame}>
      <TemplateForm
        socketPort={socketPort}
        sessionId={sessionId}
        showCloseAction
        onClose={onClose}
      />
    </div>
  </DetachedPageShell>
);

export default ConfigPage;
