import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import TemplateForm from './TemplateForm';
import styles from './ATemplate.module.scss';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const ATemplate: React.FC<Props> = ({ socketPort, sessionId }) => (
  <DetachedPageShell title="TEMP" testId="atemplate-page" onClose={undefined} showCloseButton={false}>
    <div className={styles.frame}>
      <TemplateForm socketPort={socketPort} sessionId={sessionId} showApplicationExit />
    </div>
  </DetachedPageShell>
);

export default ATemplate;
