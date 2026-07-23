import React from 'react';
import QuestionsCard from '../QuestionsCard';
import BotJobDetailsHeader from './BotJobDetailsHeader';
import BotJobDetailsPageTitle from './BotJobDetailsPageTitle';
import BotJobMetadataPanel from './BotJobMetadataPanel';
import type { BotJobDetailsControllerState } from './useBotJobDetailsController';
import type { BotJobWorkspaceSurface } from './BotJobDetails.types';
import styles from './BotJobDetailsChrome.module.scss';

interface BotJobDetailsChromeProps {
  fallbackBotJobId: number | null;
  fallbackBotJobName: string | null;
  fallbackSurface: BotJobWorkspaceSurface;
  connected: boolean;
  webSocket?: WebSocket | null;
  messages?: readonly string[];
  sessionId?: string;
  controller: BotJobDetailsControllerState;
}

const BotJobDetailsChrome: React.FC<BotJobDetailsChromeProps> = ({
  fallbackBotJobId,
  fallbackBotJobName,
  fallbackSurface,
  connected,
  webSocket,
  messages,
  sessionId,
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
      {fallbackSurface === 'botJob' && (
        <BotJobDetailsPageTitle
          botJobId={state?.botJobId ?? fallbackBotJobId}
          botJobName={state?.name ?? fallbackBotJobName}
          connected={connected}
          status={controller.status}
          statusTone={controller.statusTone}
          webSocket={webSocket}
          messages={messages}
          sessionId={sessionId}
          onClose={() => controller.sendAction('CLOSE')}
        />
      )}
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
      <BotJobMetadataPanel
        state={state}
        saving={controller.savingMetadata}
        fieldErrors={controller.fieldErrors}
        onSave={controller.saveMetadata}
        onRefresh={controller.refreshEnvironments}
      />
      {controller.executionPause && (
        <QuestionsCard
          mode="confirm"
          header={controller.executionPause.title || 'PAUSE BOT JOB'}
          body={[
            `${controller.executionPause.header}: ${controller.executionPause.blockName}`,
            controller.executionPause.instructionName
              ? `Instruction: ${controller.executionPause.instructionName}`
              : '',
            controller.executionPause.body,
          ].filter(Boolean).join('\n')}
          okLabel={controller.executionPause.continueLabel || 'Continue'}
          cancelLabel={controller.executionPause.stopLabel || 'Stop Run'}
          onSubmit={() => controller.resolveExecutionPause('CONTINUE')}
          onCancel={() => controller.resolveExecutionPause('STOP')}
        />
      )}
    </div>
  );
};

export default BotJobDetailsChrome;
