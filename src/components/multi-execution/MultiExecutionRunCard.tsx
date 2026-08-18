import React, { useMemo } from 'react';
import { buildVariablesExecutionFlowReview } from '../variables/domain/variablesExecutionFlowReview';
import VariablesSmokeTestPanel from '../variables/VariablesSmokeTestPanel';
import { useSmokeTestIntegrationRun } from '../smoke-test/integration/useSmokeTestIntegrationRun';
import type { VariablesSmokeTestStatus } from '../variables/domain/variablesSmokeTestTypes';
import type { MultiExecutionPreflightJob } from './useMultiExecutionPreflight';
import styles from './MultiBotJobExecutionWorkspace.module.scss';

type Props = {
  prepared: MultiExecutionPreflightJob;
  batchId: string;
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly unknown[];
  messageGeneration: number;
  startToken: number;
  stopToken: number;
  onStatusChange: (botJobId: number, status: VariablesSmokeTestStatus) => void;
};

const MultiExecutionRunCard: React.FC<Props> = ({
  prepared,
  batchId,
  webSocket,
  connected,
  messages,
  messageGeneration,
  startToken,
  stopToken,
  onStatusChange,
}) => {
  const snapshot = prepared.workspaceSnapshot;
  const startContext = useMemo(() => ({ multiBatchId: batchId }), [batchId]);
  const integration = useSmokeTestIntegrationRun({
    webSocket,
    connected,
    messages,
    messageGeneration,
    sessionId: 'mainDashboard',
    snapshot,
    startContext,
  });
  const review = useMemo(
    () => snapshot === null ? null : buildVariablesExecutionFlowReview(snapshot),
    [snapshot],
  );
  const blockIds = useMemo(
    () => snapshot?.blocks
      .filter(block => block.active !== false)
      .map(block => block.id) ?? [],
    [snapshot],
  );

  if (review === null || prepared.datasetSnapshot === null) {
    return <section className={styles.runCardError}>Prepared run state is unavailable.</section>;
  }

  return (
    <section className={styles.runCard} aria-label={`Execution for ${prepared.botJobName}`}>
      <VariablesSmokeTestPanel
        review={review}
        selectedBlockIds={blockIds}
        runtimeWriteAvailable={false}
        excelDataMode={prepared.excelMode}
        executionMode="INTEGRATION"
        integrationRuntimeMode="TYPESCRIPT_PLAYWRIGHT_V2"
        integrationPagePolicy="RELOAD_SELECTED"
        integration={integration}
        autoStartToken={startToken}
        autoStopToken={stopToken}
        onStatusChange={status => onStatusChange(prepared.botJobId, status)}
      />
    </section>
  );
};

export default MultiExecutionRunCard;
