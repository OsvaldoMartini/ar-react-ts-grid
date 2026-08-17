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
  datasetRowCount: number;
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
  recoveryVerificationEnabled: boolean;
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

export type SmokeTestIntegrationForceStopRequest = SmokeTestIntegrationRefreshRequest;

export type SmokeTestIntegrationForceStopResult = {
  status: 'IDLE' | 'STOP_REQUESTED';
  pendingStartsCancelled: number;
  activeRunsInterrupted: number;
  message: string;
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
  recoveryVerificationEnabled: boolean;
  outcome: 'PASSED' | 'FAILED' | 'WARNING' | 'BYPASSED';
  disposition: 'PHYSICAL' | 'LOGICAL_ONLY' | 'INACTIVE' | 'UNSUPPORTED';
  message: string;
  code: string;
  replayed: boolean;
  runtimeWrites: readonly SmokeTestIntegrationRuntimeWrite[];
  recovery: SmokeTestLocatorRecovery | null;
};

export type LocatorMatchValue = boolean | null;

export type SmokeTestLocatorRecoveryCandidate = {
  recoveryCandidateId: string;
  registryCandidateId: number;
  savedCanonicalName: string;
  savedClientName: string;
  ocrMappedName: string;
  previousXPath: string;
  previousCustomXPath: string;
  previousCss: string;
  previousStableAttributes: Readonly<Record<string, string>>;
  newXPath: string;
  newCss: string;
  newStableAttributes: Readonly<Record<string, string>>;
  previousPageIdentity: string;
  currentPageIdentity: string;
  tag: string;
  type: string;
  role: string;
  expectedAction: 'CLICK' | 'INPUT' | 'OUTPUT';
  confidence: number;
  reasons: readonly string[];
  ambiguityWarnings: readonly string[];
  matches: Readonly<{
    xpath: LocatorMatchValue;
    customXPath: LocatorMatchValue;
    css: LocatorMatchValue;
    stableAttributes: LocatorMatchValue;
    frame: LocatorMatchValue;
    shadow: LocatorMatchValue;
  }>;
};

export type SmokeTestLocatorRecovery = {
  state: 'AWAITING_USER';
  candidates: readonly SmokeTestLocatorRecoveryCandidate[];
};

export type SmokeTestLocatorRecoveryDecision = 'USE_ONCE' | 'USE_AND_SAVE' | 'BYPASS' | 'CANCEL';
export type SmokeTestLocatorRecoveryAction = 'CLICK' | 'INPUT' | 'OUTPUT';

export type SmokeTestLocatorRecoveryScanResult = {
  recovery: SmokeTestLocatorRecovery;
  elementCount: number;
  message: string;
};

export type SmokeTestLocatorRecoveryTestResult = {
  recoveryCandidateId: string;
  action: 'CLICK' | 'INPUT';
  message: string;
};

export type SmokeTestLocatorRecoveryResult = {
  status: 'COMPLETED' | 'BYPASSED' | 'CANCELLED';
  message: string;
  locatorSaved: boolean;
};

export type SmokeTestIntegrationExcelWriteArtifact = {
  outputFile: string;
  delimiter: ',' | '|';
  columns: readonly string[];
  instructionIds: readonly number[];
  artifactKind: 'CSV' | 'XLSX';
  contentBase64: string;
  byteLength: number;
  sha256: string;
  revision: number;
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

const textRecord = (value: unknown, name: string): Readonly<Record<string, string>> => {
  const source = objectValue(value, name);
  const result: Record<string, string> = {};
  Object.entries(source).forEach(([key, candidate]) => {
    result[key] = stringValue(candidate, `${name}.${key}`, true);
  });
  return Object.freeze(result);
};

const matchValue = (value: unknown, name: string): LocatorMatchValue => {
  if (value == null) return null;
  if (typeof value !== 'boolean') throw new Error(`${name} is invalid.`);
  return value;
};

const stringList = (value: unknown, name: string): readonly string[] => {
  if (!Array.isArray(value)) throw new Error(`${name} is invalid.`);
  return Object.freeze(value.map((candidate, index) =>
    stringValue(candidate, `${name} ${index + 1}`, true)));
};

const parseRecovery = (value: unknown): SmokeTestLocatorRecovery | null => {
  if (value == null) return null;
  const recovery = objectValue(value, 'Integration locator recovery');
  if (recovery.state !== 'AWAITING_USER' || !Array.isArray(recovery.candidates)) {
    throw new Error('Integration locator recovery is invalid.');
  }
  const candidates = recovery.candidates.map((raw, index) => {
    const candidate = objectValue(raw, `Recovery candidate ${index + 1}`);
    const expectedAction = stringValue(candidate.expectedAction, 'Recovery expected action');
    if (!['CLICK', 'INPUT', 'OUTPUT'].includes(expectedAction)) {
      throw new Error('Recovery expected action is invalid.');
    }
    const confidence = Number(candidate.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error('Recovery confidence is invalid.');
    }
    const matches = objectValue(candidate.matches, 'Recovery locator matches');
    return Object.freeze({
      recoveryCandidateId: revisionValue(candidate.recoveryCandidateId, 'Recovery candidate ID'),
      registryCandidateId: integerValue(candidate.registryCandidateId, 'Registry candidate ID', 1),
      savedCanonicalName: stringValue(candidate.savedCanonicalName, 'Saved canonical name', true),
      savedClientName: stringValue(candidate.savedClientName, 'Saved client name', true),
      ocrMappedName: stringValue(candidate.ocrMappedName, 'OCR mapped name', true),
      previousXPath: stringValue(candidate.previousXPath, 'Previous XPath', true),
      previousCustomXPath: stringValue(candidate.previousCustomXPath, 'Previous custom XPath', true),
      previousCss: stringValue(candidate.previousCss, 'Previous CSS', true),
      previousStableAttributes: textRecord(candidate.previousStableAttributes, 'Previous stable attributes'),
      newXPath: stringValue(candidate.newXPath, 'New XPath', true),
      newCss: stringValue(candidate.newCss, 'New CSS', true),
      newStableAttributes: textRecord(candidate.newStableAttributes, 'New stable attributes'),
      previousPageIdentity: stringValue(candidate.previousPageIdentity, 'Previous page identity'),
      currentPageIdentity: stringValue(candidate.currentPageIdentity, 'Current page identity'),
      tag: stringValue(candidate.tag, 'Recovery tag', true),
      type: stringValue(candidate.type, 'Recovery type', true),
      role: stringValue(candidate.role, 'Recovery role', true),
      expectedAction: expectedAction as SmokeTestLocatorRecoveryCandidate['expectedAction'],
      confidence,
      reasons: stringList(candidate.reasons, 'Recovery reasons'),
      ambiguityWarnings: stringList(candidate.ambiguityWarnings, 'Recovery warnings'),
      matches: Object.freeze({
        xpath: matchValue(matches.xpath, 'XPath match'),
        customXPath: matchValue(matches.customXPath, 'Custom XPath match'),
        css: matchValue(matches.css, 'CSS match'),
        stableAttributes: matchValue(matches.stableAttributes, 'Stable attributes match'),
        frame: matchValue(matches.frame, 'Frame match'),
        shadow: matchValue(matches.shadow, 'Shadow match'),
      }),
    });
  });
  return Object.freeze({ state: 'AWAITING_USER' as const, candidates: Object.freeze(candidates) });
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

export const buildSmokeTestIntegrationForceStopRequest = (
  requestId: string,
  snapshot: VariableWorkspaceSnapshot,
): SmokeTestIntegrationForceStopRequest =>
  buildSmokeTestIntegrationRefreshRequest(requestId, snapshot);

export const parseSmokeTestIntegrationForceStopResponse = (
  payload: unknown,
  expected: SmokeTestIntegrationForceStopRequest,
): SmokeTestIntegrationForceStopResult => {
  const body = contractBody(payload, 'Integration emergency stop');
  if (stringValue(body.requestId, 'Emergency Stop request ID') !== expected.requestId
      || stringValue(body.bindingEpoch, 'Emergency Stop binding epoch') !== expected.bindingEpoch
      || integerValue(body.workspaceEpoch, 'Emergency Stop workspace epoch', 1)
        !== expected.workspaceEpoch
      || integerValue(body.homeBankingId, 'Emergency Stop organization ID', 1)
        !== expected.homeBankingId
      || integerValue(body.botJobId, 'Emergency Stop Bot Job ID', 1)
        !== expected.botJobId
      || revisionValue(body.graphRevision, 'Emergency Stop graph revision')
        !== expected.graphRevision.toLocaleLowerCase()) {
    throw new Error('Emergency Stop response does not match this Smoke Test workspace.');
  }
  if (body.status !== 'IDLE' && body.status !== 'STOP_REQUESTED') {
    throw new Error('Emergency Stop returned an invalid state.');
  }
  return {
    status: body.status,
    pendingStartsCancelled: integerValue(
      body.pendingStartsCancelled,
      'Emergency Stop pending start count',
    ),
    activeRunsInterrupted: integerValue(
      body.activeRunsInterrupted,
      'Emergency Stop active run count',
    ),
    message: stringValue(body.message, 'Emergency Stop message'),
  };
};

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
    datasetRowCount: integerValue(body.datasetRowCount, 'Integration dataset row count'),
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
    'requestId' | 'runId' | 'sequence' | 'instructionId' | 'recoveryVerificationEnabled'>
    & { integrationEpoch: number },
): SmokeTestIntegrationStepResult => {
  const body = contractBody(payload, 'Integration step');
  if (stringValue(body.requestId, 'Integration step request ID') !== expected.requestId
      || stringValue(body.runId, 'Integration run ID') !== expected.runId
      || integerValue(body.integrationEpoch, 'Integration epoch', 1) !== expected.integrationEpoch
      || integerValue(body.sequence, 'Integration sequence', 1) !== expected.sequence
      || integerValue(body.instructionId, 'Integration instruction ID', 1) !== expected.instructionId
      || body.recoveryVerificationEnabled !== expected.recoveryVerificationEnabled) {
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
    recoveryVerificationEnabled: expected.recoveryVerificationEnabled,
    outcome: status === 'SKIPPED'
      ? 'BYPASSED'
      : status as SmokeTestIntegrationStepResult['outcome'],
    disposition: disposition as SmokeTestIntegrationStepResult['disposition'],
    message: stringValue(body.message, 'Integration step message'),
    code: stringValue(body.code, 'Integration step code', true),
    replayed: body.replayed === true,
    runtimeWrites,
    recovery: parseRecovery(body.recovery),
  };
};

export const parseSmokeTestLocatorRecoveryResponse = (
  payload: unknown,
  expected: Readonly<{
    requestId: string;
    runId: string;
    integrationEpoch: number;
    sequence: number;
    instructionId: number;
  }>,
): SmokeTestLocatorRecoveryResult => {
  const body = contractBody(payload, 'Locator recovery');
  if (stringValue(body.requestId, 'Recovery request ID') !== expected.requestId
      || stringValue(body.runId, 'Recovery run ID') !== expected.runId
      || integerValue(body.integrationEpoch, 'Recovery Integration epoch', 1)
        !== expected.integrationEpoch
      || integerValue(body.sequence, 'Recovery sequence', 1) !== expected.sequence
      || integerValue(body.instructionId, 'Recovery instruction ID', 1)
        !== expected.instructionId) {
    throw new Error('Locator recovery response does not match the paused instruction.');
  }
  if (body.status !== 'COMPLETED'
      && body.status !== 'BYPASSED'
      && body.status !== 'CANCELLED') {
    throw new Error(stringValue(body.message, 'Locator recovery message'));
  }
  return {
    status: body.status,
    message: stringValue(body.message, 'Locator recovery message'),
    locatorSaved: body.locatorSaved === true,
  };
};

const assertRecoveryCorrelation = (
  body: JsonObject,
  expected: Readonly<{
    requestId: string;
    runId: string;
    integrationEpoch: number;
    sequence: number;
    instructionId: number;
  }>,
) => {
  if (stringValue(body.requestId, 'Recovery request ID') !== expected.requestId
      || stringValue(body.runId, 'Recovery run ID') !== expected.runId
      || integerValue(body.integrationEpoch, 'Recovery Integration epoch', 1)
        !== expected.integrationEpoch
      || integerValue(body.sequence, 'Recovery sequence', 1) !== expected.sequence
      || integerValue(body.instructionId, 'Recovery instruction ID', 1)
        !== expected.instructionId) {
    throw new Error('Locator recovery response does not match the paused instruction.');
  }
};

export const parseSmokeTestLocatorRecoveryScanResponse = (
  payload: unknown,
  expected: Parameters<typeof assertRecoveryCorrelation>[1],
): SmokeTestLocatorRecoveryScanResult => {
  const body = contractBody(payload, 'Locator recovery Page Scanner');
  assertRecoveryCorrelation(body, expected);
  if (body.status !== 'COMPLETED') {
    throw new Error(stringValue(body.message, 'Recovery scan message'));
  }
  const recovery = parseRecovery(body.recovery);
  if (recovery === null) throw new Error('Recovery scan candidates are missing.');
  return {
    recovery,
    elementCount: integerValue(body.elementCount, 'Recovery scan element count'),
    message: stringValue(body.message, 'Recovery scan message'),
  };
};

export const parseSmokeTestLocatorRecoveryTestResponse = (
  payload: unknown,
  expected: Parameters<typeof assertRecoveryCorrelation>[1] & Readonly<{
    recoveryCandidateId: string;
    action: 'CLICK' | 'INPUT';
  }>,
): SmokeTestLocatorRecoveryTestResult => {
  const body = contractBody(payload, 'Locator recovery candidate test');
  assertRecoveryCorrelation(body, expected);
  if (body.status !== 'COMPLETED'
      || revisionValue(body.recoveryCandidateId, 'Recovery candidate ID')
        !== expected.recoveryCandidateId
      || body.action !== expected.action) {
    throw new Error(stringValue(body.message, 'Recovery candidate test message'));
  }
  return {
    recoveryCandidateId: expected.recoveryCandidateId,
    action: expected.action,
    message: stringValue(body.message, 'Recovery candidate test message'),
  };
};

export const parseSmokeTestIntegrationExcelWriteResponse = (
  payload: unknown,
  expectedRequestId: string,
  expectedRunId: string,
  expectedSha256: string,
): string => {
  const body = contractBody(payload, 'Integration ExcelWrite save');
  if (stringValue(body.requestId, 'ExcelWrite request ID') !== expectedRequestId
      || stringValue(body.runId, 'ExcelWrite run ID') !== expectedRunId
      || revisionValue(body.sha256, 'ExcelWrite checksum') !== expectedSha256) {
    throw new Error('ExcelWrite save response does not match this file revision.');
  }
  return stringValue(body.message, 'ExcelWrite save message');
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
