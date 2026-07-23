import React from 'react';
import NewBotJobManager from './NewBotJobManager';
import DetachedPageShell from './DetachedPageShell';

type Props = {
  socketPort: number;
  sessionId: string;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
  onClose?: () => void;
};

const NewBotJobPage: React.FC<Props> = ({ socketPort, sessionId, onSessionOpen, onClose }) => (
  <DetachedPageShell title="New Bot Job" testId="new-bot-job-page" onClose={onClose} showCloseButton={false}>
    <NewBotJobManager socketPort={socketPort} sessionId={sessionId} onSessionOpen={onSessionOpen} />
  </DetachedPageShell>
);

export default NewBotJobPage;
