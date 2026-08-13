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
import type { ExcelWriteManagerState } from '../excel-write-manager/domain/excelWriteManager';
import type { SmokeTestIntegrationController } from './integration/useSmokeTestIntegrationRun';
import type {
  SmokeTestExecutionMode,
  SmokeTestIntegrationPagePolicy,
  SmokeTestIntegrationRuntimeMode,
} from './integration/smokeTestIntegration.contract';

type Props = {
  review: VariablesExecutionFlowReview;
  selectedBlockIds: readonly number[];
  runtimeWriteAvailable: boolean;
  onCommitRuntimeValue: (variableId: number, value: string) => boolean;
  onActivePositionChange: (position: VariablesSmokeTestPosition | null) => void;
  onExecutionTraceChange: (positions: readonly VariablesSmokeTestPosition[]) => void;
  onCommandRemainingChange: (remaining: CommandRemainingByInstructionId) => void;
  onRunStart: () => void | Promise<void>;
  onOpenExcelWriterManager: () => void;
  excelWriterMessages: readonly string[];
  excelWriterMessageGeneration: number;
  onPublishExcelWriterState: (
    state: ExcelWriteManagerState,
    busy: boolean,
    policyLocked: boolean,
  ) => boolean;
  excelDataMode: ExcelDataMode;
  excelDataModePending: boolean;
  onExcelDataModeChange: (mode: ExcelDataMode) => void;
  executionMode: SmokeTestExecutionMode;
  integrationRuntimeMode: SmokeTestIntegrationRuntimeMode;
  integrationPagePolicy: SmokeTestIntegrationPagePolicy;
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
  onOpenExcelWriterManager,
  excelWriterMessages,
  excelWriterMessageGeneration,
  onPublishExcelWriterState,
  excelDataMode,
  excelDataModePending,
  onExcelDataModeChange,
  executionMode,
  integrationRuntimeMode,
  integrationPagePolicy,
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
      onOpenExcelWriterManager={onOpenExcelWriterManager}
      excelWriterMessages={excelWriterMessages}
      excelWriterMessageGeneration={excelWriterMessageGeneration}
      onPublishExcelWriterState={onPublishExcelWriterState}
      excelDataMode={excelDataMode}
      excelDataModePending={excelDataModePending}
      onExcelDataModeChange={onExcelDataModeChange}
      executionMode={executionMode}
      integrationRuntimeMode={integrationRuntimeMode}
      integrationPagePolicy={integrationPagePolicy}
      integration={integration}
      onStatusChange={onStatusChange}
    />
  </section>
);

export default SmokeTestSimulationWorkspace;
