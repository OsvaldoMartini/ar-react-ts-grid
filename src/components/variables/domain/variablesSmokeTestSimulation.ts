import type {
  VariablesSmokeTestBlock,
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogTone,
  VariablesSmokeTestStep,
} from './variablesSmokeTestTypes';

export const variablesSmokeTestBlockKey = (
  block: Pick<VariablesSmokeTestBlock, 'blockId' | 'blockOrder' | 'blockName'>,
): string => `${block.blockOrder ?? 'NONE'}:${block.blockId ?? 'NONE'}:${block.blockName}`;

export type VariablesSmokeTestCounter = keyof VariablesSmokeTestCounters;

export type VariablesSmokeTestStepResult = {
  tone: VariablesSmokeTestLogTone;
  counter: VariablesSmokeTestCounter;
  message: string;
};

const commandDescription = (
  step: VariablesSmokeTestStep,
  sequence: number,
): string => {
  const action = step.action.trim().toLocaleUpperCase();

  if (['I', 'INPUT', 'INPUT FIELD'].includes(action)) {
    return `simulated input value TEST_${sequence}`;
  }
  if (['H', 'HOLD', 'WAIT'].includes(action)) {
    return `validated wait settings${step.operation ? ` (${step.operation})` : ''}`;
  }
  if (['C', 'CLICK'].includes(action)) return 'simulated Web Element click';
  if (['GET', 'GETVALUE', 'SET', 'SETVALUE'].includes(action)) {
    return 'validated the Web Element and variable flow';
  }
  if (['E', 'EXCELWRITE', 'CK', 'CHECKVALUE', 'CSV CHECK', 'PDF CHECK'].includes(action)) {
    return 'validated the variable operation flow';
  }
  if (['LOOP', 'REFRESH_LOOP', 'GOTO', 'EXCEL GOTO', 'IF', 'ELSEIF', 'ELSE', 'ENDIF'].includes(action)) {
    return 'validated the control-flow command';
  }
  return `simulated ${step.instructionName || step.action || 'command'}`;
};

export const simulateVariablesSmokeTestStep = (
  step: VariablesSmokeTestStep,
  sequence: number,
): VariablesSmokeTestStepResult => {
  const position = `Block #${step.blockOrder ?? step.blockId ?? '?'} ${step.blockName} - #${step.instructionOrder ?? '?'} ${step.instructionName}`;

  if (!step.active) {
    return {
      tone: 'WARNING',
      counter: 'bypassed',
      message: `${position}: bypassed because the command is inactive.`,
    };
  }
  if (step.instructionId === null) {
    return {
      tone: 'ERROR',
      counter: 'failed',
      message: `${position}: failed because the instruction ID is missing.`,
    };
  }

  const unresolved = step.connections.filter(connection =>
    connection.required
    && connection.state !== 'CONNECTED'
    && connection.state !== 'MEMORY_ONLY');
  const simulatedAction = commandDescription(step, sequence);

  if (unresolved.length > 0) {
    return {
      tone: 'WARNING',
      counter: 'warning',
      message: `${position}: ${simulatedAction}; continued with ${unresolved.length} unresolved required connection(s).`,
    };
  }

  return {
    tone: 'SUCCESS',
    counter: 'passed',
    message: `${position}: ${simulatedAction}.`,
  };
};
