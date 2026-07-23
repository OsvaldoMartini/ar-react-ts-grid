import React from 'react';
import CloneJobManager from './CloneJobManager';
import DetachedPageShell from './DetachedPageShell';

type Props = {
  socketPort: number;
  sessionId: string;
  sourceBotJobId: number;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
  onClose?: () => void;
};

const CloneJobPage: React.FC<Props> = ({ socketPort, sessionId, sourceBotJobId, onSessionOpen, onClose }) => (
  <DetachedPageShell title="Clone Job" testId="clone-job-page" onClose={onClose}>
    <CloneJobManager
      socketPort={socketPort}
      sessionId={sessionId}
      sourceBotJobId={sourceBotJobId}
      onSessionOpen={onSessionOpen}
      onClose={onClose}
    />
  </DetachedPageShell>
);

export default CloneJobPage;
