import type {
  VariablesSmokeTestRuntimeValue,
  VariablesSmokeTestStep,
} from '../../domain/variablesSmokeTestTypes';
import { evaluateCheckValueSmokeOperands } from './checkValueSmokeEvaluator';
import { resolveCheckValueSmokeOperands } from './checkValueSmokeOperands';
import type { CheckValueSmokeEvaluation } from './checkValueSmoke.types';

const CHECK_VALUE_ACTIONS = new Set(['CK', 'CHECKVALUE']);

/** React/TypeScript-only regular CheckValue Smoke service. */
export const evaluateCheckValueSmokeStep = (
  step: VariablesSmokeTestStep,
  values: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>,
): CheckValueSmokeEvaluation | null => {
  if (!CHECK_VALUE_ACTIONS.has(step.action.trim().toLocaleUpperCase())) return null;
  const resolution = resolveCheckValueSmokeOperands(step, values);
  return resolution.ok
    ? evaluateCheckValueSmokeOperands(resolution.operands)
    : resolution.evaluation;
};
