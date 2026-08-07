import React from 'react';
import VariablesSmokeTestPanel from '../variables/VariablesSmokeTestPanel';
import type { VariablesExecutionFlowReview } from '../variables/domain/variablesExecutionFlowReview';
import type {
  VariablesSmokeTestPosition,
  VariablesSmokeTestStatus,
} from '../variables/domain/variablesSmokeTestTypes';
import type { CommandRemainingByInstructionId } from '../variables/Engine/controlFlowCommand.types';
import styles from './SmokeTestSimulationWorkspace.module.scss';
import type { ExcelDataMode } from '../excel-data/ExcelDataModeToggle';
import type { SmokeTestIntegrationController } from './integration/useSmokeTestIntegrationRun';
import type { SmokeTestExecutionMode } from './integration/smokeTestIntegration.contract';

type Props = {
  review: VariablesExecutionFlowReview;
  selectedBlockIds: readonly number[];
  runtimeWriteAvailable: boolean;
  onCommitRuntimeValue: (variableId: number, value: string) => boolean;
  onActivePositionChange: (position: VariablesSmokeTestPosition | null) => void;
  onExecutionTraceChange: (positions: readonly VariablesSmokeTestPosition[]) => void;
  onCommandRemainingChange: (remaining: CommandRemainingByInstructionId) => void;
  onRunStart: () => void;
  excelDataMode: ExcelDataMode;
  onExcelDataModeChange: (mode: ExcelDataMode) => void;
  executionMode: SmokeTestExecutionMode;
  integration: SmokeTestIntegrationController;
  onStatusChange: (status: VariablesSmokeTestStatus) => void;
};

const SmokeTestSimulationWorkspace: React.FC<Props> = ({
  review,
  selectedBlockIds,
  runtimeWriteAvailable,
  onCommitRuntimeValue,
  onActivePositionChange,
  onExecutionTraceChange,
  onCommandRemainingChange,
  onRunStart,
  excelDataMode,
  onExcelDataModeChange,
  executionMode,
  integration,
  onStatusChange,
}) => (
  <section className={styles.workspace} aria-label="Simulation workspace Smoke Tests">
    <VariablesSmokeTestPanel
      review={review}
      selectedBlockIds={selectedBlockIds}
      runtimeWriteAvailable={runtimeWriteAvailable}
      onCommitRuntimeValue={onCommitRuntimeValue}
      onActivePositionChange={onActivePositionChange}
      onExecutionTraceChange={onExecutionTraceChange}
      onCommandRemainingChange={onCommandRemainingChange}
      onRunStart={onRunStart}
      excelDataMode={excelDataMode}
      onExcelDataModeChange={onExcelDataModeChange}
      executionMode={executionMode}
      integration={integration}
      onStatusChange={onStatusChange}
    />
  </section>
);

export default SmokeTestSimulationWorkspace;
