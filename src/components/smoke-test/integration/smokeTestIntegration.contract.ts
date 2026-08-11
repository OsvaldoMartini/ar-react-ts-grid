import type { ExcelDataMode } from '../../excel-data/ExcelDataModeToggle';
import type { VariablesSmokeTestPlan } from '../../variables/domain/variablesSmokeTestTypes';
import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';

export const SMOKE_TEST_INTEGRATION_CONTRACT_VERSION = 1 as const;

export type SmokeTestExecutionMode = 'SMOKE' | 'INTEGRATION';
export type SmokeTestIntegrationRuntimeMode = 'JAVA_V1' | 'TYPESCRIPT_PLAYWRIGHT_V2';
export type SmokeTestIntegrationPagePolicy = 'PRESERVE_ACTIVE' | 'RELOAD_SELECTED';

export type SmokeTestIntegrationStartRequest = {
  contractVersion: typeof SMOKE_TEST_INTEGRATION_CONTRACT_VERSION;
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  graphRevision: string;
  scope: {
    kind: 'BLOCKS';
    blockIds: readonly number[];
  };
  excelMode: ExcelDataMode;
  runtimeMode: SmokeTestIntegrationRuntimeMode;
  pagePolicy: SmokeTestIntegrationPagePolicy;
  durableRuntimeWrites: boolean;
};

export type SmokeTestIntegrationRun = {
  runId: string;
  integrationEpoch: number;
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  graphRevision: string;
  planRevision: string;
  datasetMode: ExcelDataMode;
  runtimeMode: SmokeTestIntegrationRuntimeMode;
  pagePolicy: SmokeTestIntegrationPagePolicy;
  datasetEpoch: number;
  datasetRevision: number;
  datasetContentRevision: string;
  durableRuntimeWrites: boolean;
  blockCount: number;
  instructionCount: number;
  runtimeSnapshot: SmokeTestIntegrationRuntimeSnapshot;
};

export type SmokeTestIntegrationFrozenRuntimeValue = {
  variableId: number;
  state: 'VALUE' | 'VOID';
  value: string;
  voidReason: string | null;
  entryRevision: number;
};

export type SmokeTestIntegrationRuntimeSnapshot = {
  revision: number;
  metadataAvailable: boolean;
  values: readonly SmokeTestIntegrationFrozenRuntimeValue[];
};

export type SmokeTestIntegrationStepRequest = {
  contractVersion: typeof SMOKE_TEST_INTEGRATION_CONTRACT_VERSION;
  requestId: string;
  runId: string;
  sequence: number;
  instructionId: number;
  excelRowIndex: number;
};

export type SmokeTestIntegrationRefreshRequest = {
  contractVersion: typeof SMOKE_TEST_INTEGRATION_CONTRACT_VERSION;
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  graphRevision: string;
};

export type SmokeTestIntegrationRuntimeWrite = {
  variableId: number;
  value: string;
};

export type SmokeTestIntegrationStepResult = {
  requestId: string;
  runId: string;
  integrationEpoch: number;
  sequence: number;
  instructionId: number;
  outcome: 'PASSED' | 'FAILED' | 'WARNING' | 'BYPASSED';
  disposition: 'PHYSICAL' | 'LOGICAL_ONLY' | 'INACTIVE' | 'UNSUPPORTED';
  message: string;
  replayed: boolean;
  runtimeWrites: readonly SmokeTestIntegrationRuntimeWrite[];
};

export type SmokeTestIntegrationTerminalResult = {
  status: 'STOPPED' | 'FINISHED' | 'FAILED';
  lastSequence: number;
  passed: number;
  warnings: number;
  failed: number;
  skipped: number;
  message: string;
};

type JsonObject = Record<string, unknown>;

const objectValue = (value: unknown, name: string): JsonObject => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} is not an object.`);
  }
  return value as JsonObject;
};

const stringValue = (value: unknown, name: string, allowEmpty = false): string => {
  if (typeof value !== 'string' || (!allowEmpty && value.trim().length === 0)) {
    throw new Error(`${name} is missing.`);
  }
  return allowEmpty ? value : value.trim();
};

const integerValue = (value: unknown, name: string, minimum = 0): number => {
  if (!Number.isInteger(value) || Number(value) < minimum) {
    throw new Error(`${name} is invalid.`);
  }
  return Number(value);
};

const revisionValue = (value: unknown, name: string): string => {
  const revision = stringValue(value, name);
  if (!/^[0-9a-f]{64}$/i.test(revision)) throw new Error(`${name} is invalid.`);
  return revision.toLocaleLowerCase();
};

const contractBody = (payload: unknown, operation: string): JsonObject => {
  const body = objectValue(payload, `${operation} response`);
  if (body.ok !== true) {
    const message = typeof body.error === 'string'
      ? body.error
      : typeof body.message === 'string'
        ? body.message
        : `${operation} was refused.`;
    throw new Error(message);
  }
  if (body.contractVersion !== SMOKE_TEST_INTEGRATION_CONTRACT_VERSION) {
    throw new Error(`${operation} returned an unsupported contract version.`);
  }
  return body;
};

export const buildSmokeTestIntegrationStartRequest = (
  requestId: string,
  plan: VariablesSmokeTestPlan,
  bindingEpoch: string,
  workspaceEpoch: number,
  excelMode: ExcelDataMode,
  runtimeMode: SmokeTestIntegrationRuntimeMode,
  runtimeWrites: boolean,
  pagePolicy: SmokeTestIntegrationPagePolicy = 'PRESERVE_ACTIVE',
): SmokeTestIntegrationStartRequest => {
  const activeBlockIds = plan.blocks.flatMap(block => (
    block.active && block.blockId !== null ? [block.blockId] : []
  ));
  if (activeBlockIds.length === 0) {
    throw new Error('Select at least one active Block before starting Integration.');
  }
  return {
    contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
    requestId,
    bindingEpoch,
    workspaceEpoch,
    homeBankingId: plan.homeBankingId,
    botJobId: plan.botJobId,
    graphRevision: plan.graphRevision,
    scope: {
      kind: 'BLOCKS',
      blockIds: activeBlockIds,
    },
    excelMode,
    runtimeMode,
    pagePolicy,
    durableRuntimeWrites: runtimeWrites,
  };
};

export const buildSmokeTestIntegrationRefreshRequest = (
  requestId: string,
  snapshot: VariableWorkspaceSnapshot,
): SmokeTestIntegrationRefreshRequest => ({
  contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
  requestId,
  bindingEpoch: snapshot.bindingEpoch,
  workspaceEpoch: snapshot.workspaceEpoch,
  homeBankingId: snapshot.botJob.homeBankingId,
  botJobId: snapshot.botJob.id,
  graphRevision: snapshot.graphRevision,
});

export const parseSmokeTestIntegrationRefreshResponse = (
  payload: unknown,
  expected: SmokeTestIntegrationRefreshRequest,
): string => {
  const body = contractBody(payload, 'Playwright page refresh');
  if (stringValue(body.requestId, 'Playwright refresh request ID') !== expected.requestId
      || stringValue(body.bindingEpoch, 'Playwright refresh binding epoch') !== expected.bindingEpoch
      || integerValue(body.workspaceEpoch, 'Playwright refresh workspace epoch', 1)
        !== expected.workspaceEpoch
      || integerValue(body.homeBankingId, 'Playwright refresh organization ID', 1)
        !== expected.homeBankingId
      || integerValue(body.botJobId, 'Playwright refresh Bot Job ID', 1)
        !== expected.botJobId
      || revisionValue(body.graphRevision, 'Playwright refresh graph revision')
        !== expected.graphRevision.toLocaleLowerCase()) {
    throw new Error('Playwright page refresh response does not match this Smoke Test workspace.');
  }
  if (body.status !== 'REFRESHED') {
    throw new Error('Playwright page refresh returned an invalid state.');
  }
  return stringValue(body.message, 'Playwright refresh message');
};

export const parseSmokeTestIntegrationStartResponse = (
  payload: unknown,
  expectedRequestId: string,
): SmokeTestIntegrationRun => {
  const body = contractBody(payload, 'Integration start');
  if (stringValue(body.requestId, 'Integration start request ID') !== expectedRequestId) {
    throw new Error('Integration start response does not match this run.');
  }
  if (body.status !== 'STARTED') throw new Error('Integration did not enter STARTED state.');
  const datasetMode = stringValue(body.datasetMode, 'Integration Excel mode');
  if (datasetMode !== 'REAL' && datasetMode !== 'SYNTHETIC') {
    throw new Error('Integration start returned an invalid Excel mode.');
  }
  const runtimeMode = stringValue(body.runtimeMode, 'Integration runtime mode');
  if (runtimeMode !== 'JAVA_V1' && runtimeMode !== 'TYPESCRIPT_PLAYWRIGHT_V2') {
    throw new Error('Integration start returned an invalid runtime mode.');
  }
  const pagePolicy = body.pagePolicy === undefined
    ? 'PRESERVE_ACTIVE'
    : stringValue(body.pagePolicy, 'Integration page policy');
  if (pagePolicy !== 'PRESERVE_ACTIVE' && pagePolicy !== 'RELOAD_SELECTED') {
    throw new Error('Integration start returned an invalid page policy.');
  }
  const runtimeSnapshot = objectValue(
    body.runtimeSnapshot,
    'Integration runtime snapshot',
  );
  const runtimeValues = objectValue(
    runtimeSnapshot.values,
    'Integration runtime snapshot values',
  );
  if (typeof runtimeSnapshot.metadataAvailable !== 'boolean') {
    throw new Error('Integration runtime metadata availability is invalid.');
  }
  const runtimeVoidReasons = new Set([
    'NO_PRODUCER_YET',
    'MISSING_BINDING',
    'MISSING_PARENT',
    'PRODUCER_FAILED',
    'EVALUATION_FAILED',
    'METADATA_UNAVAILABLE',
  ]);
  const parsedRuntimeValues = Object.entries(runtimeValues).map(([rawId, candidate]) => {
    if (!/^[1-9][0-9]*$/.test(rawId)) {
      throw new Error('Integration runtime snapshot contains an invalid variable ID.');
    }
    const variableId = integerValue(Number(rawId), 'Integration runtime variable ID', 1);
    const value = objectValue(candidate, `Integration runtime variable ${variableId}`);
    if (value.state !== 'VALUE' && value.state !== 'VOID') {
      throw new Error(`Integration runtime variable ${variableId} has an invalid state.`);
    }
    const state = value.state;
    const rawValue = state === 'VALUE'
      ? stringValue(value.value, `Integration runtime variable ${variableId} value`, true)
      : '';
    if (state === 'VOID' && value.value != null) {
      throw new Error(`Integration runtime variable ${variableId} cannot contain a VOID value.`);
    }
    const voidReason = value.voidReason == null
      ? null
      : stringValue(value.voidReason, `Integration runtime variable ${variableId} VOID reason`);
    if (state === 'VALUE' && voidReason !== null) {
      throw new Error(`Integration runtime variable ${variableId} cannot contain a VOID reason.`);
    }
    if (state === 'VOID' && (voidReason === null || !runtimeVoidReasons.has(voidReason))) {
      throw new Error(`Integration runtime variable ${variableId} requires a valid VOID reason.`);
    }
    return Object.freeze({
      variableId,
      state,
      value: rawValue,
      voidReason,
      entryRevision: integerValue(
        value.entryRevision,
        `Integration runtime variable ${variableId} revision`,
      ),
    });
  });
  return {
    runId: stringValue(body.runId, 'Integration run ID'),
    integrationEpoch: integerValue(body.integrationEpoch, 'Integration epoch', 1),
    bindingEpoch: stringValue(body.bindingEpoch, 'Integration binding epoch'),
    workspaceEpoch: integerValue(body.workspaceEpoch, 'Integration workspace epoch', 1),
    homeBankingId: integerValue(body.homeBankingId, 'Integration organization ID', 1),
    botJobId: integerValue(body.botJobId, 'Integration Bot Job ID', 1),
    graphRevision: revisionValue(body.graphRevision, 'Integration graph revision'),
    planRevision: revisionValue(body.planRevision, 'Integration plan revision'),
    datasetMode,
    runtimeMode,
    pagePolicy,
    datasetEpoch: integerValue(body.datasetEpoch, 'Integration dataset epoch', 1),
    datasetRevision: integerValue(body.datasetRevision, 'Integration dataset revision'),
    datasetContentRevision: revisionValue(
      body.datasetContentRevision,
      'Integration dataset content revision',
    ),
    durableRuntimeWrites: body.durableRuntimeWrites === true,
    blockCount: integerValue(body.blockCount, 'Integration block count'),
    instructionCount: integerValue(body.instructionCount, 'Integration instruction count'),
    runtimeSnapshot: Object.freeze({
      revision: integerValue(runtimeSnapshot.revision, 'Integration runtime revision'),
      metadataAvailable: runtimeSnapshot.metadataAvailable,
      values: Object.freeze(parsedRuntimeValues),
    }),
  };
};

export const parseSmokeTestIntegrationStepResponse = (
  payload: unknown,
  expected: Pick<SmokeTestIntegrationStepRequest,
    'requestId' | 'runId' | 'sequence' | 'instructionId'> & { integrationEpoch: number },
): SmokeTestIntegrationStepResult => {
  const body = contractBody(payload, 'Integration step');
  if (stringValue(body.requestId, 'Integration step request ID') !== expected.requestId
      || stringValue(body.runId, 'Integration run ID') !== expected.runId
      || integerValue(body.integrationEpoch, 'Integration epoch', 1) !== expected.integrationEpoch
      || integerValue(body.sequence, 'Integration sequence', 1) !== expected.sequence
      || integerValue(body.instructionId, 'Integration instruction ID', 1) !== expected.instructionId) {
    throw new Error('Integration step response does not match the pending instruction.');
  }
  const status = stringValue(body.status, 'Integration status');
  if (!['PASSED', 'FAILED', 'WARNING', 'SKIPPED'].includes(status)) {
    throw new Error('Integration step returned an invalid outcome.');
  }
  const disposition = stringValue(body.disposition, 'Integration disposition');
  if (!['PHYSICAL', 'LOGICAL_ONLY', 'INACTIVE', 'UNSUPPORTED'].includes(disposition)) {
    throw new Error('Integration step returned an invalid disposition.');
  }
  const writes = body.runtimeUpdate == null ? [] : [body.runtimeUpdate];
  const runtimeWrites = writes.map((candidate, index) => {
    const write = objectValue(candidate, `Integration runtime write ${index + 1}`);
    if (write.state !== 'VALUE') {
      throw new Error('Integration runtime write must contain an exact VALUE.');
    }
    return {
      variableId: integerValue(write.variableId, 'Integration variable ID', 1),
      value: stringValue(write.value, 'Integration runtime value', true),
    };
  });
  return {
    requestId: expected.requestId,
    runId: expected.runId,
    integrationEpoch: expected.integrationEpoch,
    sequence: expected.sequence,
    instructionId: expected.instructionId,
    outcome: status === 'SKIPPED'
      ? 'BYPASSED'
      : status as SmokeTestIntegrationStepResult['outcome'],
    disposition: disposition as SmokeTestIntegrationStepResult['disposition'],
    message: stringValue(body.message, 'Integration step message'),
    replayed: body.replayed === true,
    runtimeWrites,
  };
};

export const parseSmokeTestIntegrationTerminalResponse = (
  payload: unknown,
  operation: 'stop' | 'finish',
  expectedRequestId: string,
  expectedRunId: string,
  expectedIntegrationEpoch: number,
): SmokeTestIntegrationTerminalResult => {
  const body = contractBody(payload, `Integration ${operation}`);
  if (stringValue(body.requestId, `Integration ${operation} request ID`) !== expectedRequestId
      || stringValue(body.runId, 'Integration run ID') !== expectedRunId
      || integerValue(body.integrationEpoch, 'Integration epoch', 1) !== expectedIntegrationEpoch) {
    throw new Error(`Integration ${operation} response does not match this run.`);
  }
  const status = stringValue(body.status, `Integration ${operation} status`);
  const accepted = operation === 'stop'
    ? status === 'STOPPED'
    : status === 'FINISHED' || status === 'FAILED';
  if (!accepted) {
    throw new Error(`Integration ${operation} returned an invalid terminal state.`);
  }
  return {
    status: status as SmokeTestIntegrationTerminalResult['status'],
    lastSequence: integerValue(body.lastSequence, 'Integration last sequence'),
    passed: integerValue(body.passed, 'Integration passed count'),
    warnings: integerValue(body.warnings, 'Integration warning count'),
    failed: integerValue(body.failed, 'Integration failed count'),
    skipped: integerValue(body.skipped, 'Integration skipped count'),
    message: stringValue(body.message, `Integration ${operation} message`),
  };
};
