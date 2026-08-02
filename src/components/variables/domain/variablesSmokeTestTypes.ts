import type {
  VariablesExecutionFlowConnection,
  VariablesExecutionStepVariable,
  VariablesExecutionVariableFlow,
} from './variablesExecutionFlowReview';

export type VariablesSmokeTestStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'STOPPED';

export type VariablesSmokeTestRuntimeValue = {
  state: 'VALUE' | 'VOID';
  value: string;
};

export type VariablesSmokeTestStep = {
  key: string;
  instructionId: number | null;
  instructionName: string;
  action: string;
  operation: string;
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  instructionOrder: number | null;
  active: boolean;
  comparisonOperator: string | null;
  comparisonFormatPolicy: string;
  variables: readonly VariablesExecutionStepVariable[];
  connections: readonly VariablesExecutionFlowConnection[];
};

export type VariablesSmokeTestBlock = {
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  active: boolean;
  steps: readonly VariablesSmokeTestStep[];
};

export type VariablesSmokeTestPlan = {
  runId: string;
  createdAt: string;
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  graphRevision: string;
  runtimeMemoryRevision: number;
  selectedBlockIds: readonly number[];
  scopeLabel: string;
  blocks: readonly VariablesSmokeTestBlock[];
  steps: readonly VariablesSmokeTestStep[];
  variableFlows: readonly VariablesExecutionVariableFlow[];
};

export type VariablesSmokeTestLogTone = 'INFO' | 'SUCCESS' | 'WARNING' | 'FAIL' | 'ERROR';

export type VariablesSmokeTestLogEntry = {
  id: string;
  sequence: number;
  timestamp: string;
  tone: VariablesSmokeTestLogTone;
  counter: keyof VariablesSmokeTestCounters | null;
  message: string;
};

export type VariablesSmokeTestCounters = {
  passed: number;
  bypassed: number;
  warning: number;
  failed: number;
};

export type VariablesSmokeTestPosition = {
  blockKey: string;
  stepKey: string | null;
};
