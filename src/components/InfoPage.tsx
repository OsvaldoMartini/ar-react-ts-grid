import React from 'react';
import AboutPanel from './AboutPanel';
import DetachedPageShell from './DetachedPageShell';

type Props = {
  socketPort: number;
  sessionId: string;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
  onClose?: () => void;
};

const InfoPage: React.FC<Props> = ({ socketPort, sessionId, onSessionOpen, onClose }) => (
  <DetachedPageShell title="Info" testId="info-page" onClose={onClose}>
    <AboutPanel socketPort={socketPort} sessionId={sessionId} onSessionOpen={onSessionOpen} />
  </DetachedPageShell>
);

export default InfoPage;
