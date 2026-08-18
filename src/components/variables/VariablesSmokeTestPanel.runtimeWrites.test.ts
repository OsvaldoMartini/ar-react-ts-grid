import { integrationResultForStep } from './VariablesSmokeTestPanel';
import type { SmokeTestIntegrationStepResult } from '../smoke-test/integration/smokeTestIntegration.contract';
import type { VariablesSmokeTestStep } from './domain/variablesSmokeTestTypes';

test('preserves authoritative Integration GET writes for runtime publication', () => {
  const step = {
    key: 'step-20',
    blockId: 1,
    blockOrder: 1,
    blockName: 'Login',
    instructionId: 20,
    instructionOrder: 2,
    instructionName: 'Read balance',
    action: 'GET',
    operation: '',
    onHoldSeconds: null,
    active: true,
    comparisonOperator: null,
    comparisonFormatPolicy: '',
    variables: [{
      slot: 'PRIMARY',
      variableId: 30,
      variableName: 'balance',
      runtimeState: 'VOID',
      runtimeRawValue: '',
      displayValue: 'VOID',
    }],
    connections: [],
  } satisfies VariablesSmokeTestStep;
  const result = {
    requestId: 'step-request-1',
    runId: 'run-1',
    integrationEpoch: 1,
    sequence: 1,
    instructionId: 20,
    recoveryVerificationEnabled: true,
    outcome: 'PASSED',
    disposition: 'PHYSICAL',
    code: 'GET_VALUE_WRITTEN',
    message: 'GET captured the live value.',
    replayed: false,
    runtimeWrites: [{ variableId: 30, value: '125.00' }],
    recovery: null,
  } satisfies SmokeTestIntegrationStepResult;

  expect(integrationResultForStep(step, result).runtimeWrites).toEqual([
    { variableId: 30, variableName: 'balance', value: '125.00' },
  ]);
});
