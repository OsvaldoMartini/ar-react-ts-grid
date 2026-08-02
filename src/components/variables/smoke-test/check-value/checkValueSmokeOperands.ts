import type {
  VariablesSmokeTestRuntimeValue,
  VariablesSmokeTestStep,
} from '../../domain/variablesSmokeTestTypes';
import type { CheckValueSmokeOperandResolution } from './checkValueSmoke.types';

const runtimeValue = (
  step: VariablesSmokeTestStep,
  index: number,
  values: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): VariablesSmokeTestRuntimeValue | null => {
  const variable = step.variables[index];
  if (!variable || variable.variableId === null) return null;
  return values.get(variable.variableId) ?? {
    state: variable.runtimeState,
    value: variable.runtimeRawValue,
  };
};

const displayValue = (value: VariablesSmokeTestRuntimeValue | null): string => {
  if (value === null || value.state === 'VOID') return 'VOID';
  return value.value === '' ? 'EMPTY' : value.value;
};

export const resolveCheckValueSmokeOperands = (
  step: VariablesSmokeTestStep,
  values: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): CheckValueSmokeOperandResolution => {
  const leftVariable = step.variables[0];
  const rightVariable = step.variables[1];
  const left = runtimeValue(step, 0, values);
  const right = runtimeValue(step, 1, values);
  const operator = step.comparisonOperator?.trim() ?? '';
  const expression = [
    `${leftVariable?.variableName ?? 'Left variable'}=${displayValue(left)}`,
    operator || '?',
    `${rightVariable?.variableName ?? 'Right variable'}=${displayValue(right)}`,
  ].join(' ');

  if (!operator) {
    return { ok: false, evaluation: {
      status: 'WARNING', expression, reason: 'typed comparison operator is missing',
    } };
  }
  if (left === null || right === null) {
    return { ok: false, evaluation: {
      status: 'WARNING', expression, reason: 'both variable bindings are required',
    } };
  }
  if (left.state === 'VOID' || right.state === 'VOID') {
    return { ok: false, evaluation: {
      status: 'WARNING', expression, reason: 'a comparison operand is VOID',
    } };
  }
  return { ok: true, operands: {
    expression,
    operator,
    formatPolicy: step.comparisonFormatPolicy.trim().toLocaleUpperCase(),
    leftRawValue: left.value,
    rightRawValue: right.value,
  } };
};
