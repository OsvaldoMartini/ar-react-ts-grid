import type { VariablesSmokeTestRuntimeValue } from './variablesSmokeTestSimulation';
import type { VariablesSmokeTestStep } from './variablesSmokeTestTypes';

export type VariablesSmokeComparisonResult =
  | { status: 'PASS'; expression: string }
  | { status: 'FAIL'; expression: string }
  | { status: 'WARNING'; expression: string; reason: string };

const CHECK_ACTIONS = new Set(['CK', 'CHECKVALUE', 'CSV CHECK', 'PDF CHECK']);

const currentValue = (
  step: VariablesSmokeTestStep,
  index: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): VariablesSmokeTestRuntimeValue | null => {
  const variable = step.variables[index];
  if (!variable || variable.variableId === null) return null;
  return runtimeValues.get(variable.variableId) ?? {
    state: variable.runtimeState,
    value: variable.runtimeRawValue,
  };
};

const displayValue = (value: VariablesSmokeTestRuntimeValue | null): string => {
  if (value === null || value.state === 'VOID') return 'VOID';
  return value.value === '' ? 'EMPTY' : value.value;
};

const normalizedLocaleNumber = (raw: string): number | null => {
  const compact = raw.trim()
    .replace(/[\s'’]/g, '')
    .replace(/[^0-9+\-.,]/g, '');
  if (!compact || !/[0-9]/.test(compact)) return null;
  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');
  let normalized = compact;
  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const groupingSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = normalized.replaceAll(groupingSeparator, '');
    if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
  } else if (lastComma >= 0) {
    normalized = normalized.replaceAll('.', '').replace(',', '.');
  } else {
    normalized = normalized.replaceAll(',', '');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const textOperands = (
  left: string,
  right: string,
  formatPolicy: string,
): readonly [string, string] => formatPolicy.toLocaleUpperCase() === 'CASE_INSENSITIVE_TEXT'
  ? [left.toLocaleLowerCase(), right.toLocaleLowerCase()]
  : [left, right];

export const evaluateVariablesSmokeComparison = (
  step: VariablesSmokeTestStep,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): VariablesSmokeComparisonResult | null => {
  const action = step.action.trim().toLocaleUpperCase();
  if (!CHECK_ACTIONS.has(action)) return null;

  const leftVariable = step.variables[0];
  const rightVariable = step.variables[1];
  const left = currentValue(step, 0, runtimeValues);
  const right = currentValue(step, 1, runtimeValues);
  const operator = step.comparisonOperator?.trim() ?? '';
  const expression = [
    `${leftVariable?.variableName ?? 'Left variable'}=${displayValue(left)}`,
    operator || '?',
    `${rightVariable?.variableName ?? 'Right variable'}=${displayValue(right)}`,
  ].join(' ');

  if (!operator) {
    return { status: 'WARNING', expression, reason: 'typed comparison operator is missing' };
  }
  if (left === null || right === null) {
    return { status: 'WARNING', expression, reason: 'both variable bindings are required' };
  }
  if (left.state === 'VOID' || right.state === 'VOID') {
    return { status: 'WARNING', expression, reason: 'a comparison operand is VOID' };
  }

  const formatPolicy = step.comparisonFormatPolicy.trim().toLocaleUpperCase();
  const [leftText, rightText] = textOperands(left.value, right.value, formatPolicy);
  let passed: boolean;

  switch (operator) {
    case '=': {
      if (formatPolicy === 'LOCALE_NUMBER') {
        const leftNumber = normalizedLocaleNumber(left.value);
        const rightNumber = normalizedLocaleNumber(right.value);
        if (leftNumber === null || rightNumber === null) {
          return {
            status: 'WARNING',
            expression,
            reason: 'numeric equality requires two numeric values',
          };
        }
        passed = leftNumber === rightNumber;
      } else {
        passed = leftText === rightText;
      }
      break;
    }
    case '!=': {
      if (formatPolicy === 'LOCALE_NUMBER') {
        const leftNumber = normalizedLocaleNumber(left.value);
        const rightNumber = normalizedLocaleNumber(right.value);
        if (leftNumber === null || rightNumber === null) {
          return {
            status: 'WARNING',
            expression,
            reason: 'numeric inequality requires two numeric values',
          };
        }
        passed = leftNumber !== rightNumber;
      } else {
        passed = leftText !== rightText;
      }
      break;
    }
    case '>':
    case '<':
    case '>=':
    case '<=': {
      const leftNumber = normalizedLocaleNumber(left.value);
      const rightNumber = normalizedLocaleNumber(right.value);
      if (leftNumber === null || rightNumber === null) {
        return {
          status: 'WARNING',
          expression,
          reason: `operator ${operator} requires two numeric values`,
        };
      }
      passed = operator === '>'
        ? leftNumber > rightNumber
        : operator === '<'
          ? leftNumber < rightNumber
          : operator === '>='
            ? leftNumber >= rightNumber
            : leftNumber <= rightNumber;
      break;
    }
    case 'contains':
      passed = leftText.includes(rightText);
      break;
    case 'startsWith':
      passed = leftText.startsWith(rightText);
      break;
    case 'endsWith':
      passed = leftText.endsWith(rightText);
      break;
    case 'isEmpty':
      passed = left.value === '';
      break;
    case 'isNotEmpty':
      passed = left.value !== '';
      break;
    default:
      return { status: 'WARNING', expression, reason: `operator ${operator} is unsupported` };
  }

  return { status: passed ? 'PASS' : 'FAIL', expression };
};
