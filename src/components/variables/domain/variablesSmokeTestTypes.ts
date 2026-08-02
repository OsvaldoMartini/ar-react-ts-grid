import type {
  VariablesExecutionFlowConnection,
  VariablesExecutionVariableFlow,
} from './variablesExecutionFlowReview';

export type VariablesSmokeTestStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'STOPPED';

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
  blockFilter: number | null;
  scopeLabel: string;
  blocks: readonly VariablesSmokeTestBlock[];
  steps: readonly VariablesSmokeTestStep[];
  variableFlows: readonly VariablesExecutionVariableFlow[];
};

export type VariablesSmokeTestLogTone = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type VariablesSmokeTestLogEntry = {
  id: string;
  timestamp: string;
  tone: VariablesSmokeTestLogTone;
  message: string;
};

export type VariablesSmokeTestCounters = {
  passed: number;
  bypassed: number;
  warning: number;
  failed: number;
};
