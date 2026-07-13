import React, { useMemo } from 'react';
import WorkspaceHeader, { type WorkspaceHeaderAction } from '../workspace/WorkspaceHeader';
import BotJobDataActions from './BotJobDataActions';
import type {
  BotJobDetailsState,
  BotJobToolbarAction,
  BotJobToolbarPayload,
  BotJobWorkspaceAction,
  BotJobWorkspaceStatusTone,
  BotJobWorkspaceSurface,
} from './BotJobDetails.types';
import styles from './BotJobDetailsHeader.module.scss';

interface BotJobDetailsHeaderProps {
  botJobId: number | null;
  botJobName: string | null;
  activeSurface: BotJobWorkspaceSurface;
  connected: boolean;
  pendingAction?: BotJobWorkspaceAction | null;
  busy?: boolean;
  status?: string;
  statusTone?: BotJobWorkspaceStatusTone;
  onAction: (action: BotJobWorkspaceAction) => void;
  compact?: boolean;
  canUseWorkspaceActions?: boolean;
  canUsePreScan?: boolean;
  canShowComponents?: boolean;
  fileState?: BotJobDetailsState | null;
  filePendingAction?: BotJobToolbarAction | null;
  fileBusy?: boolean;
  onFileAction?: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

const BotJobDetailsHeader: React.FC<BotJobDetailsHeaderProps> = ({
  botJobId,
  botJobName,
  activeSurface,
  connected,
  pendingAction = null,
  busy = false,
  status = 'Ready',
  statusTone = 'neutral',
  onAction,
  compact = false,
  canUseWorkspaceActions = true,
  canUsePreScan = true,
  canShowComponents = true,
  fileState = null,
  filePendingAction = null,
  fileBusy = false,
  onFileAction,
}) => {
  const actions = useMemo<WorkspaceHeaderAction<BotJobWorkspaceAction>[]>(() => {
    const pending = busy || pendingAction !== null;
    const unavailable = !connected || !botJobId || botJobId <= 0;
    return [
      { id: 'REFRESH', label: pendingAction === 'REFRESH' ? 'Refreshing…' : 'Refresh', disabled: pending || unavailable || !canUseWorkspaceActions },
      { id: 'SHOW_BOT_JOB', label: 'Bot Job', tone: 'primary', active: activeSurface === 'botJob', disabled: pending || unavailable || !canUseWorkspaceActions || activeSurface === 'botJob' },
      {
        id: activeSurface === 'components' ? 'HIDE_COMPONENTS' : 'SHOW_COMPONENTS',
        label: activeSurface === 'components' ? 'Hide Components' : 'Components',
        tone: 'primary',
        active: activeSurface === 'components',
        disabled: pending || unavailable || !canShowComponents,
      },
      { id: 'SHOW_PRE_SCAN', label: 'Pre Scan', tone: 'success', active: activeSurface === 'preScan', disabled: pending || unavailable || !canUsePreScan || activeSurface === 'preScan' },
      { id: 'CLOSE', label: 'Close', tone: 'danger', disabled: false },
    ];
  }, [activeSurface, botJobId, busy, canShowComponents, canUsePreScan, canUseWorkspaceActions, connected, pendingAction]);

  return (
    <div className={styles.wrapper}>
      <WorkspaceHeader
        eyebrow="Bot Job Details"
        title={botJobName || 'Unnamed Bot Job'}
        subtitle={botJobId ? `Bot Job ID ${botJobId}` : 'Bot Job ID unavailable'}
        connected={connected}
        status={status}
        statusTone={statusTone}
        actions={actions}
        onAction={onAction}
        compact={compact}
        className={styles.keepButtonsOnTop}
        extraActionsBeforeId="CLOSE"
        extraActions={onFileAction && (
          <BotJobDataActions
            state={fileState}
            connected={connected}
            pendingAction={filePendingAction}
            busy={fileBusy}
            onAction={onFileAction}
          />
        )}
      />
    </div>
  );
};

export default BotJobDetailsHeader;
