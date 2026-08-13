import { integrationResultForStep } from './VariablesSmokeTestPanel';
import type { SmokeTestIntegrationStepResult } from '../smoke-test/integration/smokeTestIntegration.contract';
import type { VariablesSmokeTestStep } from './domain/variablesSmokeTestTypes';

test('preserves authoritative Integration GET writes for runtime publication', () => {
  const step = {
    blockId: 1,
    blockOrder: 1,
    blockName: 'Login',
    instructionId: 20,
    instructionOrder: 2,
    instructionName: 'Read balance',
    action: 'GET',
    variables: [{ variableId: 30, variableName: 'balance' }],
  } as VariablesSmokeTestStep;
  const result = {
    outcome: 'PASSED',
    disposition: 'PHYSICAL',
    message: 'GET captured the live value.',
    runtimeWrites: [{ variableId: 30, value: '125.00' }],
  } as SmokeTestIntegrationStepResult;

  expect(integrationResultForStep(step, result).runtimeWrites).toEqual([
    { variableId: 30, variableName: 'balance', value: '125.00' },
  ]);
});
