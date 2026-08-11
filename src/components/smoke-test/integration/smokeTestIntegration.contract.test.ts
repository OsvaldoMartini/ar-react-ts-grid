import type { VariablesSmokeTestPlan } from '../../variables/domain/variablesSmokeTestTypes';
import {
  buildSmokeTestIntegrationStartRequest,
  parseSmokeTestIntegrationStartResponse,
  parseSmokeTestIntegrationStepResponse,
  parseSmokeTestIntegrationTerminalResponse,
} from './smokeTestIntegration.contract';

const plan: VariablesSmokeTestPlan = {
  runId: 'local-smoke-plan',
  createdAt: '2026-08-06T00:00:00.000Z',
  homeBankingId: 2,
  botJobId: 32,
  botJobName: 'Saldo Banca Stato TEST',
  graphRevision: 'a'.repeat(64),
  runtimeMemoryRevision: 7,
  selectedBlockIds: [223],
  scopeLabel: 'Block #1',
  blocks: [{
    blockId: 223,
    blockName: 'Login',
    blockOrder: 1,
    active: true,
    steps: [],
  }],
  steps: [],
  variableFlows: [],
};

test('builds a small Integration start request without browser execution facts', () => {
  const request = buildSmokeTestIntegrationStartRequest(
    'start-1',
    plan,
    'binding-1',
    9,
    'REAL',
    true,
  );

  expect(request).toEqual({
    contractVersion: 1,
    requestId: 'start-1',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 9,
    homeBankingId: 2,
    botJobId: 32,
    graphRevision: 'a'.repeat(64),
    scope: { kind: 'BLOCKS', blockIds: [223] },
    excelMode: 'REAL',
    pagePolicy: 'PRESERVE_ACTIVE',
    durableRuntimeWrites: true,
  });
  expect(request).not.toHaveProperty('instructions');
  expect(request).not.toHaveProperty('locators');
  expect(request).not.toHaveProperty('runtimeValues');
});

test('accepts the backend-authored frozen run identity', () => {
  expect(parseSmokeTestIntegrationStartResponse({
    ok: true,
    contractVersion: 1,
    requestId: 'start-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    status: 'STARTED',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 9,
    homeBankingId: 2,
    botJobId: 32,
    graphRevision: 'a'.repeat(64),
    planRevision: 'b'.repeat(64),
    datasetMode: 'REAL',
    datasetEpoch: 3,
    datasetRevision: 4,
    datasetContentRevision: 'c'.repeat(64),
    durableRuntimeWrites: true,
    blockCount: 1,
    instructionCount: 5,
    runtimeSnapshot: {
      revision: 7,
      metadataAvailable: true,
      values: {
        30: {
          state: 'VALUE',
          value: '',
          entryRevision: 3,
        },
        31: {
          state: 'VOID',
          voidReason: 'NO_PRODUCER_YET',
          entryRevision: 4,
        },
      },
    },
    code: 'STARTED',
    message: 'Integration started.',
  }, 'start-1')).toMatchObject({
    runId: 'server-run-1',
    integrationEpoch: 1,
    datasetMode: 'REAL',
    datasetEpoch: 3,
    datasetRevision: 4,
    runtimeSnapshot: {
      revision: 7,
      metadataAvailable: true,
      values: [
        {
          variableId: 30,
          state: 'VALUE',
          value: '',
          voidReason: null,
          entryRevision: 3,
        },
        {
          variableId: 31,
          state: 'VOID',
          value: '',
          voidReason: 'NO_PRODUCER_YET',
          entryRevision: 4,
        },
      ],
    },
  });
});

test('keeps an empty GET result distinct from VOID', () => {
  const result = parseSmokeTestIntegrationStepResponse({
    ok: true,
    contractVersion: 1,
    requestId: 'step-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    sequence: 1,
    instructionId: 1727,
    status: 'PASSED',
    disposition: 'PHYSICAL',
    code: 'GET_APPLIED',
    message: 'GET read the authoritative Web Element.',
    replayed: false,
    runtimeUpdate: { variableId: 30, state: 'VALUE', value: '' },
  }, {
    requestId: 'step-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    sequence: 1,
    instructionId: 1727,
  });

  expect(result.runtimeWrites).toEqual([{ variableId: 30, value: '' }]);
  expect(result.outcome).toBe('PASSED');
});

test('rejects ambiguous backend runtime snapshot values', () => {
  const response = {
    ok: true,
    contractVersion: 1,
    requestId: 'start-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    status: 'STARTED',
    bindingEpoch: 'binding-1',
    workspaceEpoch: 9,
    homeBankingId: 2,
    botJobId: 32,
    graphRevision: 'a'.repeat(64),
    planRevision: 'b'.repeat(64),
    datasetMode: 'REAL',
    datasetEpoch: 3,
    datasetRevision: 4,
    datasetContentRevision: 'c'.repeat(64),
    durableRuntimeWrites: true,
    blockCount: 1,
    instructionCount: 5,
    runtimeSnapshot: {
      revision: 7,
      metadataAvailable: true,
      values: {
        30: { state: 'VOID', entryRevision: 3 },
      },
    },
  };

  expect(() => parseSmokeTestIntegrationStartResponse(response, 'start-1'))
    .toThrow('requires a valid VOID reason');
});

test('rejects a response for another instruction and a refused terminal operation', () => {
  expect(() => parseSmokeTestIntegrationStepResponse({
    ok: true,
    contractVersion: 1,
    requestId: 'step-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    sequence: 1,
    instructionId: 99,
    status: 'PASSED',
    disposition: 'LOGICAL_ONLY',
    message: 'Acknowledged.',
  }, {
    requestId: 'step-1',
    runId: 'server-run-1',
    integrationEpoch: 1,
    sequence: 1,
    instructionId: 1727,
  })).toThrow('does not match');

  expect(() => parseSmokeTestIntegrationTerminalResponse({
    ok: false,
    contractVersion: 1,
    requestId: 'finish-1',
    runId: 'server-run-1',
    status: 'REJECTED',
    code: 'STALE_RUN',
    message: 'The Integration run is no longer active.',
  }, 'finish', 'finish-1', 'server-run-1', 1)).toThrow('no longer active');
});
