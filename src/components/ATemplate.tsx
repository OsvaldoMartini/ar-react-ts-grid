import React from 'react';
import ConfigManager from './ConfigManager';
import DetachedPageShell from './DetachedPageShell';
import styles from './ATemplate.module.scss';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const ATemplate: React.FC<Props> = ({ socketPort, sessionId, onClose }) => (
  <DetachedPageShell title="TEMP" testId="atemplate-page" onClose={onClose}>
    <div className={styles.frame}>
      <ConfigManager socketPort={socketPort} sessionId={sessionId} />
    </div>
  </DetachedPageShell>
);

export default ATemplate;
