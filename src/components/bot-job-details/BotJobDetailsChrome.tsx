import React from 'react';
import BotJobDetailsHeader from './BotJobDetailsHeader';
import type { BotJobDetailsControllerState } from './useBotJobDetailsController';
import type { BotJobWorkspaceSurface } from './BotJobDetails.types';
import styles from './BotJobDetailsChrome.module.scss';

interface BotJobDetailsChromeProps {
  fallbackBotJobId: number | null;
  fallbackBotJobName: string | null;
  fallbackSurface: BotJobWorkspaceSurface;
  connected: boolean;
  controller: BotJobDetailsControllerState;
}

const BotJobDetailsChrome: React.FC<BotJobDetailsChromeProps> = ({
  fallbackBotJobId,
  fallbackBotJobName,
  fallbackSurface,
  connected,
  controller,
}) => {
  const state = controller.state;
  const operationBusy = Boolean(
    controller.pendingAction || controller.pendingToolbarAction || controller.savingMetadata,
  );
  const executionActive = ['STARTING', 'RUNNING', 'STOPPING'].includes(
    state?.executionState ?? '',
  );
  const workspaceBusy = operationBusy || executionActive;
  return (
    <div className={styles.chrome}>
      <BotJobDetailsHeader
        botJobId={state?.botJobId ?? fallbackBotJobId}
        botJobName={state?.name ?? fallbackBotJobName}
        activeSurface={state?.activeSurface ?? fallbackSurface}
        connected={connected}
        pendingAction={controller.pendingAction}
        busy={workspaceBusy}
        status={controller.status}
        statusTone={controller.statusTone}
        onAction={controller.sendAction}
        compact
        canUseWorkspaceActions={state?.capabilities.canUseWorkspaceActions === true}
        canUsePreScan={state?.capabilities.canUsePreScan === true}
        canShowComponents={state?.capabilities.canShowComponents === true}
        jobState={state}
        pendingToolbarAction={controller.pendingToolbarAction}
        operationBusy={operationBusy}
        transferBusy={workspaceBusy}
        transferPath={controller.transferPath}
        onToolbarAction={controller.sendToolbarAction}
      />
    </div>
  );
};

export default BotJobDetailsChrome;
