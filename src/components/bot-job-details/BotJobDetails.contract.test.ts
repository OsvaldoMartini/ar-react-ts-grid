import {
  parseBotJobDetailsEnvelope,
  parseBotJobExecutionPauseRequest,
  reduceBotJobDetailsState,
} from './BotJobDetails.contract';
import type { BotJobDetailsState } from './BotJobDetails.types';

const state = (revision: number): BotJobDetailsState => ({
  revision,
  metadataRevision: revision,
  botJobId: 42,
  name: `Job ${revision}`,
  description: '',
  projectType: 'Web App',
  active: true,
  homeBankingId: 7,
  organizationName: 'Bank',
  homeUrlId: 8,
  environmentName: 'TEST',
  environmentUrl: 'https://example.test',
  navigationTimeSeconds: 1,
  transferPathConfigured: true,
  environments: [],
  blocks: [],
  capabilities: {
    canUseWorkspaceActions: true,
    canEditMetadata: true,
    canUsePreScan: true,
    canShowComponents: true,
    canExecute: true,
    canLaunch: true,
    canUseFileActions: true,
    canOpenOrganizations: true,
  },
  executionState: 'IDLE',
  activeSurface: 'botJob',
  componentsVisible: false,
});

test('parses string and object bodies only for the bound session and job', () => {
  const body = { ok: true, botJobId: 42, state: state(1) };
  const stringEnvelope = JSON.stringify({
    sessionId: 'botJobTasks', operationId: 'botJobDetails.bootstrapResponse', body: JSON.stringify(body),
  });
  const objectEnvelope = JSON.stringify({
    sessionId: 'botJobTasks', operationId: 'botJobDetails.state', body,
  });

  expect(parseBotJobDetailsEnvelope(stringEnvelope, 'botJobTasks', 42)?.body.state?.revision).toBe(1);
  expect(parseBotJobDetailsEnvelope(objectEnvelope, 'botJobTasks', 42)?.body.state?.revision).toBe(1);
  expect(parseBotJobDetailsEnvelope(stringEnvelope, 'componentTasks', 42)).toBeNull();
  expect(parseBotJobDetailsEnvelope(stringEnvelope, 'botJobTasks', 43)).toBeNull();
});

test('ignores malformed messages and stale revisions', () => {
  expect(parseBotJobDetailsEnvelope('{', 'botJobTasks', 42)).toBeNull();
  expect(reduceBotJobDetailsState(state(3), state(2))).toEqual(state(3));
  expect(reduceBotJobDetailsState(state(3), state(3))).toEqual(state(3));
  expect(reduceBotJobDetailsState(state(3), state(4))).toEqual(state(4));
});

test('rejects an envelope whose nested state belongs to another job', () => {
  const envelope = JSON.stringify({
    sessionId: 'botJobTasks',
    operationId: 'botJobDetails.state',
    body: JSON.stringify({ ok: true, botJobId: 42, state: { ...state(4), botJobId: 99 } }),
  });

  expect(parseBotJobDetailsEnvelope(envelope, 'botJobTasks', 42)).toBeNull();
});

test('rejects incomplete state and malformed capabilities before Chrome can consume them', () => {
  const incompleteStateEnvelope = JSON.stringify({
    sessionId: 'botJobTasks',
    operationId: 'botJobDetails.bootstrapResponse',
    body: JSON.stringify({ ok: true, botJobId: 42, state: { revision: 1, botJobId: 42 } }),
  });
  const malformedCapabilitiesEnvelope = JSON.stringify({
    sessionId: 'botJobTasks',
    operationId: 'botJobDetails.bootstrapResponse',
    body: JSON.stringify({
      ok: true,
      botJobId: 42,
      state: { ...state(1), capabilities: { ...state(1).capabilities, canEditMetadata: 'yes' } },
    }),
  });

  expect(parseBotJobDetailsEnvelope(incompleteStateEnvelope, 'botJobTasks', 42)).toBeNull();
  expect(parseBotJobDetailsEnvelope(malformedCapabilitiesEnvelope, 'botJobTasks', 42)).toBeNull();
});

test('accepts only a fully correlated PAUSE request for the bound Bot Job session', () => {
  const pause = {
    requestId: 'pause-1', botJobId: 42, workspaceEpoch: 9, executionId: 17,
    executionAttemptId: 3, title: 'PAUSE BOT JOB', header: 'Paused at block',
    blockName: 'Login', instructionName: 'Review page', body: 'Keep the browser open.',
    continueLabel: 'Continue', stopLabel: 'Stop Run',
  };
  const envelope = JSON.stringify({
    sessionId: 'botJobTasks', operationId: 'botJobExecution.pause.request', body: JSON.stringify(pause),
  });

  expect(parseBotJobExecutionPauseRequest(envelope, 'botJobTasks', 42)).toEqual(pause);
  expect(parseBotJobExecutionPauseRequest(envelope, 'componentTasks', 42)).toBeNull();
  expect(parseBotJobExecutionPauseRequest(envelope, 'botJobTasks', 99)).toBeNull();
  expect(parseBotJobExecutionPauseRequest(JSON.stringify({
    sessionId: 'botJobTasks', operationId: 'botJobExecution.pause.request',
    body: JSON.stringify({ ...pause, executionId: 0 }),
  }), 'botJobTasks', 42)).toBeNull();
});
