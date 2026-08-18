import React, { useCallback, useState } from 'react';
import warningRedImage from '../../assets/warning_red.png';
import AlertModal from '../AlertModal';
import QuestionsCard from '../QuestionsCard';
import BotJobDetailsHeader from './BotJobDetailsHeader';
import BotJobDetailsPageTitle from './BotJobDetailsPageTitle';
import BotJobMetadataPanel from './BotJobMetadataPanel';
import ExecutionPreflightDialog from './execution/ExecutionPreflightDialog';
import type { BotJobDetailsControllerState } from './useBotJobDetailsController';
import type {
  BotJobWorkspaceSurface,
  BotJobRuntimeMemoryPolicy,
  BotJobToolbarAction,
  BotJobToolbarPayload,
  ExecutionPreflightIssue,
} from './BotJobDetails.types';
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
  onFocusPreflightIssue?: (issue: ExecutionPreflightIssue) => void;
}

type PendingExecutionStart = {
  action: Extract<BotJobToolbarAction, 'TEST_RUN' | 'LAUNCH'>;
  payload: BotJobToolbarPayload;
};

const BotJobDetailsChrome: React.FC<BotJobDetailsChromeProps> = ({
  fallbackBotJobId,
  fallbackBotJobName,
  fallbackSurface,
  connected,
  webSocket,
  messages,
  sessionId,
  controller,
  onFocusPreflightIssue,
}) => {
  const [pendingExecutionStart, setPendingExecutionStart] =
    useState<PendingExecutionStart | null>(null);
  const state = controller.state;
  const operationBusy = Boolean(
    controller.pendingAction || controller.pendingToolbarAction || controller.savingMetadata,
  );
  const executionActive = ['STARTING', 'RUNNING', 'STOPPING'].includes(
    state?.executionState ?? '',
  );
  const workspaceBusy =
    operationBusy || executionActive || pendingExecutionStart !== null;
  const requestToolbarAction = useCallback((
    action: BotJobToolbarAction,
    payload: BotJobToolbarPayload = {},
  ) => {
    if (action === 'TEST_RUN' || action === 'LAUNCH') {
      setPendingExecutionStart({ action, payload });
      return;
    }
    controller.sendToolbarAction(action, payload);
  }, [controller]);

  const startWithRuntimeMemoryPolicy = useCallback((
    runtimeMemoryPolicy: BotJobRuntimeMemoryPolicy,
  ) => {
    const pending = pendingExecutionStart;
    if (!pending) return;
    setPendingExecutionStart(null);
    controller.sendToolbarAction(pending.action, {
      ...pending.payload,
      runtimeMemoryPolicy,
    });
  }, [controller, pendingExecutionStart]);

  const executionLabel = pendingExecutionStart?.action === 'LAUNCH'
    ? 'Launch'
    : 'Test Run';
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
        transferBusy={workspaceBusy}
        transferPath={controller.transferPath}
        onToolbarAction={requestToolbarAction}
        operationBusy={operationBusy || pendingExecutionStart !== null}
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
      {controller.executionPreflight && !controller.executionPause && (
        <ExecutionPreflightDialog
          action={controller.executionPreflight.action}
          report={controller.executionPreflight.report}
          onClose={controller.dismissExecutionPreflight}
          onFocusIssue={onFocusPreflightIssue}
        />
      )}
      {pendingExecutionStart && !controller.executionPause && (
        <AlertModal
          header={`${executionLabel} Variable Values`}
          body="Choose whether this execution keeps the current Bot Job variable values or resets every value to VOID before starting."
          extraMsg="Run with Current Values is recommended. Reset Values & Run preserves variable definitions and relationships."
          onClose={() => setPendingExecutionStart(null)}
          onConfirm={() => startWithRuntimeMemoryPolicy('KEEP')}
          alternateAction={{
            label: 'Reset Values & Run',
            title: 'Atomically reset all runtime values to VOID, then start',
            onAction: () => startWithRuntimeMemoryPolicy('RESET'),
            confirmLabel: 'Run with Current Values',
            confirmTitle: 'Keep the current runtime values and start',
          }}
          imageSrc={warningRedImage}
          imageClass="construction-image"
          error={false}
        />
      )}
    </div>
  );
};

export default BotJobDetailsChrome;
