import React from 'react';
import ConfigManager from './ConfigManager';
import DetachedPageShell from './DetachedPageShell';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const ConfigPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => (
  <DetachedPageShell title="Config" testId="config-page" onClose={onClose}>
    <ConfigManager socketPort={socketPort} sessionId={sessionId} />
  </DetachedPageShell>
);

export default ConfigPage;
