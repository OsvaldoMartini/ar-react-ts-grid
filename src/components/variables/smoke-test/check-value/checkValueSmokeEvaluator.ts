import { parseCheckValueSmokeNumber } from './checkValueSmokeNumber';
import type { CheckValueSmokeEvaluation, CheckValueSmokeOperands } from './checkValueSmoke.types';

const normalizedText = (raw: string, formatPolicy: string): string =>
  formatPolicy === 'CASE_INSENSITIVE_TEXT' ? raw.toLocaleLowerCase() : raw;

const numericPair = (
  operands: CheckValueSmokeOperands,
): readonly [number, number] | null => {
  const left = parseCheckValueSmokeNumber(operands.leftRawValue);
  const right = parseCheckValueSmokeNumber(operands.rightRawValue);
  return left === null || right === null ? null : [left, right];
};

const warning = (
  operands: CheckValueSmokeOperands,
  reason: string,
): CheckValueSmokeEvaluation => ({ status: 'WARNING', expression: operands.expression, reason });

export const evaluateCheckValueSmokeOperands = (
  operands: CheckValueSmokeOperands,
): CheckValueSmokeEvaluation => {
  const leftText = normalizedText(operands.leftRawValue, operands.formatPolicy);
  const rightText = normalizedText(operands.rightRawValue, operands.formatPolicy);
  let passed: boolean;
  switch (operands.operator) {
    case '=':
    case '!=': {
      if (operands.formatPolicy === 'LOCALE_NUMBER') {
        const numbers = numericPair(operands);
        if (numbers === null) return warning(operands, 'numeric equality requires two numeric values');
        passed = operands.operator === '=' ? numbers[0] === numbers[1] : numbers[0] !== numbers[1];
      } else {
        passed = operands.operator === '=' ? leftText === rightText : leftText !== rightText;
      }
      break;
    }
    case '>':
    case '<':
    case '>=':
    case '<=': {
      const numbers = numericPair(operands);
      if (numbers === null) {
        return warning(operands, `operator ${operands.operator} requires two numeric values`);
      }
      passed = operands.operator === '>' ? numbers[0] > numbers[1]
        : operands.operator === '<' ? numbers[0] < numbers[1]
          : operands.operator === '>=' ? numbers[0] >= numbers[1]
            : numbers[0] <= numbers[1];
      break;
    }
    case 'contains': passed = leftText.includes(rightText); break;
    case 'startsWith': passed = leftText.startsWith(rightText); break;
    case 'endsWith': passed = leftText.endsWith(rightText); break;
    case 'isEmpty': passed = operands.leftRawValue === ''; break;
    case 'isNotEmpty': passed = operands.leftRawValue !== ''; break;
    default: return warning(operands, `operator ${operands.operator} is unsupported`);
  }
  return { status: passed ? 'PASS' : 'FAIL', expression: operands.expression };
};
