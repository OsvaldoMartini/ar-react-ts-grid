import React from 'react';
import BotJobDetailsHeader from './BotJobDetailsHeader';
import BotJobMetadataEditor from './BotJobMetadataEditor';
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
  return (
    <div className={styles.chrome}>
      <BotJobDetailsHeader
        botJobId={state?.botJobId ?? fallbackBotJobId}
        botJobName={state?.name ?? fallbackBotJobName}
        activeSurface={state?.activeSurface ?? fallbackSurface}
        connected={connected}
        pendingAction={controller.pendingAction}
        status={controller.status}
        statusTone={controller.statusTone}
        onAction={controller.sendAction}
        canUseWorkspaceActions={state?.capabilities.canUseWorkspaceActions === true}
        canUsePreScan={state?.capabilities.canUsePreScan === true}
        canShowComponents={state?.capabilities.canShowComponents === true}
      />
      <BotJobMetadataEditor
        state={state}
        loading={controller.loadingState}
        connected={connected}
        saving={controller.savingMetadata}
        fieldErrors={controller.fieldErrors}
        metadataSavedRevision={controller.metadataSavedRevision}
        onSave={controller.saveMetadata}
        onRefreshEnvironments={controller.refreshEnvironments}
        onOpenOrganizations={() => controller.sendAction('OPEN_ORGANIZATIONS')}
        onRetry={controller.retryBootstrap}
      />
    </div>
  );
};

export default BotJobDetailsChrome;
