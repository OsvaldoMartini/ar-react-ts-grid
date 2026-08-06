import React from 'react';
import VariablesSmokeTestPanel from '../variables/VariablesSmokeTestPanel';
import type { VariablesExecutionFlowReview } from '../variables/domain/variablesExecutionFlowReview';
import styles from './SmokeTestSimulationWorkspace.module.scss';

type Props = {
  review: VariablesExecutionFlowReview;
  selectedBlockIds: readonly number[];
  runtimeWriteAvailable: boolean;
  onCommitRuntimeValue: (variableId: number, value: string) => boolean;
};

const SmokeTestSimulationWorkspace: React.FC<Props> = ({
  review,
  selectedBlockIds,
  runtimeWriteAvailable,
  onCommitRuntimeValue,
}) => (
  <section className={styles.workspace} aria-label="Simulation workspace Smoke Tests">
    <VariablesSmokeTestPanel
      review={review}
      selectedBlockIds={selectedBlockIds}
      runtimeWriteAvailable={runtimeWriteAvailable}
      onCommitRuntimeValue={onCommitRuntimeValue}
    />
  </section>
);

export default SmokeTestSimulationWorkspace;
