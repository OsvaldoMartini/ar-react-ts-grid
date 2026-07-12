import React from 'react';
import WorkspaceHeader, { type WorkspaceHeaderAction } from '../workspace/WorkspaceHeader';
import type { BotJobWorkspaceAction, BotJobWorkspaceStatusTone } from './BotJobDetails.types';
import styles from './ComponentWorkspaceHeader.module.scss';

interface ComponentWorkspaceHeaderProps {
  botJobName: string | null;
  connected: boolean;
  pendingAction?: BotJobWorkspaceAction | null;
  status?: string;
  statusTone?: BotJobWorkspaceStatusTone;
  onHide: () => void;
}

const ComponentWorkspaceHeader: React.FC<ComponentWorkspaceHeaderProps> = ({
  botJobName,
  connected,
  pendingAction = null,
  status = 'Ready',
  statusTone = 'neutral',
  onHide,
}) => {
  const actions: WorkspaceHeaderAction<'HIDE_COMPONENTS'>[] = [{
    id: 'HIDE_COMPONENTS',
    label: pendingAction === 'HIDE_COMPONENTS' ? 'Hiding…' : 'Hide Components',
    tone: 'primary',
    disabled: !connected || pendingAction !== null,
  }];

  return (
    <div className={styles.wrapper}>
      <WorkspaceHeader
        eyebrow="Reusable Library"
        title="Components"
        subtitle={botJobName ? `For ${botJobName}` : 'Shared instructions'}
        connected={connected}
        status={status}
        statusTone={statusTone}
        actions={actions}
        onAction={onHide}
        compact
      />
    </div>
  );
};

export default ComponentWorkspaceHeader;
