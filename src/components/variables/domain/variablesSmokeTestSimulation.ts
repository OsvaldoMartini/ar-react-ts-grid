import type {
  VariablesSmokeTestBlock,
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogTone,
  VariablesSmokeTestStep,
} from './variablesSmokeTestTypes';
import { evaluateVariablesSmokeComparison } from './variablesSmokeTestComparison';

export const variablesSmokeTestBlockKey = (
  block: Pick<VariablesSmokeTestBlock, 'blockId' | 'blockOrder' | 'blockName'>,
): string => `${block.blockOrder ?? 'NONE'}:${block.blockId ?? 'NONE'}:${block.blockName}`;

export type VariablesSmokeTestCounter = keyof VariablesSmokeTestCounters;

export type VariablesSmokeTestStepResult = {
  tone: VariablesSmokeTestLogTone;
  counter: VariablesSmokeTestCounter;
  message: string;
  runtimeWrites: readonly VariablesSmokeTestRuntimeWrite[];
};

export type VariablesSmokeTestRuntimeValue = {
  state: 'VALUE' | 'VOID';
  value: string;
};

export type VariablesSmokeTestRuntimeWrite = {
  variableId: number;
  variableName: string;
  value: string;
};

const currentVariableValue = (
  step: VariablesSmokeTestStep,
  index: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): VariablesSmokeTestRuntimeValue => {
  const variable = step.variables[index];
  if (!variable || variable.variableId === null) return { state: 'VOID', value: '' };
  return runtimeValues.get(variable.variableId) ?? {
    state: variable.runtimeState,
    value: variable.runtimeRawValue,
  };
};

const variableValueLabel = (
  step: VariablesSmokeTestStep,
  index: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): string => {
  const variable = step.variables[index];
  const current = currentVariableValue(step, index, runtimeValues);
  const value = current.state === 'VOID'
    ? 'VOID'
    : current.value === ''
      ? 'EMPTY'
      : current.value;
  return `${variable?.variableName ?? 'Variable not connected'}=${value}`;
};

const commandDescription = (
  step: VariablesSmokeTestStep,
  sequence: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): { message: string; writes: readonly VariablesSmokeTestRuntimeWrite[]; voidRead: boolean } => {
  const action = step.action.trim().toLocaleUpperCase();

  if (['I', 'INPUT', 'INPUT FIELD'].includes(action)) {
    return { message: `simulated input value TEST_${sequence}`, writes: [], voidRead: false };
  }
  if (['H', 'HOLD', 'WAIT'].includes(action)) {
    return { message: `validated wait settings${step.operation ? ` (${step.operation})` : ''}`, writes: [], voidRead: false };
  }
  if (['C', 'CLICK'].includes(action)) {
    return { message: 'simulated Web Element click', writes: [], voidRead: false };
  }
  if (['GET', 'GETVALUE'].includes(action)) {
    const variable = step.variables[0];
    const current = currentVariableValue(step, 0, runtimeValues);
    if (variable && variable.variableId !== null && current.state === 'VOID') {
      const value = `TEST_${sequence}`;
      return {
        message: `simulated Web Element read and generated ${variable.variableName}=${value}`,
        writes: [{ variableId: variable.variableId, variableName: variable.variableName, value }],
        voidRead: false,
      };
    }
    return {
      message: `simulated Web Element read using current ${variableValueLabel(step, 0, runtimeValues)}`,
      writes: [],
      voidRead: false,
    };
  }
  if (['SET', 'SETVALUE'].includes(action)) {
    const current = currentVariableValue(step, 0, runtimeValues);
    return {
      message: `simulated writing ${variableValueLabel(step, 0, runtimeValues)} to the connected Web Element`,
      writes: [],
      voidRead: current.state === 'VOID',
    };
  }
  if (['E', 'EXCELWRITE'].includes(action)) {
    const current = currentVariableValue(step, 0, runtimeValues);
    return {
      message: `simulated Excel/CSV output from ${variableValueLabel(step, 0, runtimeValues)}`,
      writes: [],
      voidRead: current.state === 'VOID',
    };
  }
  if (['CK', 'CHECKVALUE', 'CSV CHECK', 'PDF CHECK'].includes(action)) {
    const values = step.variables.map((_, index) =>
      variableValueLabel(step, index, runtimeValues));
    const voidRead = step.variables.some((_, index) =>
      currentVariableValue(step, index, runtimeValues).state === 'VOID');
    return {
      message: `simulated variable comparison ${values.join(' against ')}`,
      writes: [],
      voidRead,
    };
  }
  if (['LOOP', 'REFRESH_LOOP', 'GOTO', 'EXCEL GOTO', 'IF', 'ELSEIF', 'ELSE', 'ENDIF'].includes(action)) {
    return { message: 'validated the control-flow command', writes: [], voidRead: false };
  }
  return { message: `simulated ${step.instructionName || step.action || 'command'}`, writes: [], voidRead: false };
};

export const simulateVariablesSmokeTestStep = (
  step: VariablesSmokeTestStep,
  sequence: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue> = new Map(),
): VariablesSmokeTestStepResult => {
  const position = `Block #${step.blockOrder ?? step.blockId ?? '?'} ${step.blockName} - #${step.instructionOrder ?? '?'} ${step.instructionName}`;

  if (!step.active) {
    return {
      tone: 'WARNING',
      counter: 'bypassed',
      message: `${position}: bypassed because the command is inactive.`,
      runtimeWrites: [],
    };
  }
  if (step.instructionId === null) {
    return {
      tone: 'ERROR',
      counter: 'failed',
      message: `${position}: failed because the instruction ID is missing.`,
      runtimeWrites: [],
    };
  }

  const unresolved = step.connections.filter(connection =>
    connection.required
    && connection.state !== 'CONNECTED'
    && connection.state !== 'MEMORY_ONLY');
  const simulatedAction = commandDescription(step, sequence, runtimeValues);

  if (unresolved.length > 0) {
    return {
      tone: 'WARNING',
      counter: 'warning',
      message: `${position}: ${simulatedAction.message}; continued with ${unresolved.length} unresolved required connection(s).`,
      runtimeWrites: simulatedAction.writes,
    };
  }

  const comparison = evaluateVariablesSmokeComparison(step, runtimeValues);
  if (comparison?.status === 'WARNING') {
    return {
      tone: 'WARNING',
      counter: 'warning',
      message: `${position}: comparison could not be evaluated (${comparison.expression}); ${comparison.reason}.`,
      runtimeWrites: simulatedAction.writes,
    };
  }
  if (comparison?.status === 'FAIL') {
    return {
      tone: 'ERROR',
      counter: 'failed',
      message: `${position}: comparison failed (${comparison.expression}).`,
      runtimeWrites: simulatedAction.writes,
    };
  }
  if (comparison?.status === 'PASS') {
    return {
      tone: 'SUCCESS',
      counter: 'passed',
      message: `${position}: comparison passed (${comparison.expression}).`,
      runtimeWrites: simulatedAction.writes,
    };
  }

  if (simulatedAction.voidRead) {
    return {
      tone: 'WARNING',
      counter: 'warning',
      message: `${position}: ${simulatedAction.message}; continued with VOID because no runtime value is available.`,
      runtimeWrites: simulatedAction.writes,
    };
  }

  return {
    tone: 'SUCCESS',
    counter: 'passed',
    message: `${position}: ${simulatedAction.message}.`,
    runtimeWrites: simulatedAction.writes,
  };
};
