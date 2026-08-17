import { act, renderHook } from '@testing-library/react';
import type { VariablesSmokeTestPlan } from '../../variables/domain/variablesSmokeTestTypes';
import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';
import {
  SmokeTestExternalRuntimeControlError,
  useSmokeTestIntegrationRun,
} from './useSmokeTestIntegrationRun';

const REVISION = 'a'.repeat(64);

const plan: VariablesSmokeTestPlan = {
  runId: 'local-smoke-plan',
  createdAt: '2026-08-06T00:00:00.000Z',
  homeBankingId: 2,
  botJobId: 32,
  botJobName: 'Saldo Banca Stato TEST',
  graphRevision: REVISION,
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

const snapshot = {
  bindingEpoch: 'binding-1',
  workspaceEpoch: 9,
  botJob: { id: 32, homeBankingId: 2 },
  graphRevision: REVISION,
} as unknown as VariableWorkspaceSnapshot;

const responseMessage = (operationId: string, body: Record<string, unknown>): string =>
  JSON.stringify({ operationId, body });

const requestBody = (send: jest.Mock, call: number): Record<string, unknown> => {
  const envelope = JSON.parse(String(send.mock.calls[call][0]));
  return JSON.parse(envelope.body);
};

const startResponse = (requestId: unknown) => ({
  ok: true,
  contractVersion: 1,
  requestId,
  runId: 'server-run-1',
  integrationEpoch: 4,
  status: 'STARTED',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 9,
  homeBankingId: 2,
  botJobId: 32,
  graphRevision: REVISION,
  planRevision: 'b'.repeat(64),
  datasetMode: 'REAL',
  runtimeMode: 'JAVA_V1',
  datasetEpoch: 3,
  datasetRevision: 0,
  datasetContentRevision: 'c'.repeat(64),
  datasetRowCount: 2,
  durableRuntimeWrites: false,
  blockCount: 1,
  instructionCount: 0,
  runtimeSnapshot: {
    revision: 7,
    metadataAvailable: true,
    values: {},
  },
  message: 'Integration started.',
});

const renderIntegrationHook = (send: jest.Mock) => {
  const socket = { readyState: 1, send } as unknown as WebSocket;
  return renderHook(
    ({ messages }: { messages: readonly string[] }) => useSmokeTestIntegrationRun({
      webSocket: socket,
      connected: true,
      messages,
      sessionId: 'smokeTestManager',
      snapshot,
    }),
    { initialProps: { messages: [] as readonly string[] } },
  );
};

test('releases the pending request immediately when WebSocket.send throws', async () => {
  const send = jest.fn();
  send.mockImplementationOnce(() => {
    throw new Error('socket closed during send');
  });
  const { result, rerender } = renderIntegrationHook(send);

  await act(async () => {
    await expect(result.current.start(plan, 'REAL', 'JAVA_V1', false))
      .rejects.toThrow('socket closed during send');
  });
  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();

  let retry!: ReturnType<typeof result.current.start>;
  act(() => {
    retry = result.current.start(plan, 'REAL', 'JAVA_V1', false);
  });
  const retryRequest = requestBody(send, 1);
  act(() => {
    rerender({
      messages: [responseMessage(
        'smokeTest.integration.startResponse',
        startResponse(retryRequest.requestId),
      )],
    });
  });
  await act(async () => {
    await retry;
  });

  expect(result.current.phase).toBe('READY');
  expect(result.current.activeRun?.runId).toBe('server-run-1');
});

test('accepts a bounded Java V1 start response arriving after thirty seconds', async () => {
  jest.useFakeTimers();
  try {
    const send = jest.fn();
    const { result, rerender } = renderIntegrationHook(send);

    let start!: ReturnType<typeof result.current.start>;
    act(() => {
      start = result.current.start(plan, 'REAL', 'JAVA_V1', false);
    });
    const observed = start.then(() => 'resolved', failure =>
      failure instanceof Error ? failure.message : String(failure));
    const startRequest = requestBody(send, 0);

    act(() => {
      jest.advanceTimersByTime(31_000);
      rerender({
        messages: [responseMessage(
          'smokeTest.integration.startResponse',
          startResponse(startRequest.requestId),
        )],
      });
    });

    await act(async () => {
      await expect(observed).resolves.toBe('resolved');
    });
    expect(result.current.activeRun?.runId).toBe('server-run-1');
  } finally {
    jest.useRealTimers();
  }
});

test('Emergency Stop supersedes a pending start before a run ID exists', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];

  let start!: ReturnType<typeof result.current.start>;
  let forceStop!: ReturnType<typeof result.current.forceStop>;
  act(() => {
    start = result.current.start(plan, 'REAL', 'JAVA_V1', false);
    forceStop = result.current.forceStop();
  });

  await act(async () => {
    await expect(start).rejects.toThrow('Emergency Stop cancelled');
  });
  expect(send).toHaveBeenCalledTimes(2);
  const forceRequest = requestBody(send, 1);
  expect(forceRequest).toMatchObject({
    bindingEpoch: 'binding-1',
    workspaceEpoch: 9,
    homeBankingId: 2,
    botJobId: 32,
    graphRevision: REVISION,
  });

  messages.push(responseMessage('smokeTest.integration.forceStopResponse', {
    ok: true,
    contractVersion: 1,
    requestId: forceRequest.requestId,
    bindingEpoch: 'binding-1',
    workspaceEpoch: 9,
    homeBankingId: 2,
    botJobId: 32,
    graphRevision: REVISION,
    status: 'STOP_REQUESTED',
    pendingStartsCancelled: 1,
    activeRunsInterrupted: 0,
    message: 'Emergency Stop interrupted the current Integration startup or run.',
  }));
  act(() => rerender({ messages: [...messages] }));

  await act(async () => {
    await expect(forceStop).resolves.toMatchObject({
      status: 'STOP_REQUESTED',
      pendingStartsCancelled: 1,
    });
  });
  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();
});

test('retires only the matching run after Runtime Instances control without sending another Stop', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];

  let start!: ReturnType<typeof result.current.start>;
  act(() => {
    start = result.current.start(plan, 'REAL', 'JAVA_V1', false);
  });
  const startRequest = requestBody(send, 0);
  messages.push(responseMessage(
    'smokeTest.integration.startResponse',
    startResponse(startRequest.requestId),
  ));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await start; });

  let step!: ReturnType<typeof result.current.executeStep>;
  let retired = false;
  act(() => {
    step = result.current.executeStep(1735, 0, true);
    retired = result.current.retireExternalRun('server-run-1', 'STOP');
  });

  expect(retired).toBe(true);
  await act(async () => {
    await expect(step).rejects.toBeInstanceOf(SmokeTestExternalRuntimeControlError);
  });
  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();
  expect(result.current.error).toBeNull();
  expect(send).toHaveBeenCalledTimes(2);
  expect(result.current.retireExternalRun('another-run', 'KILL')).toBe(false);
});

test('keeps the active run when Finish is refused and permits Stop cleanup retry', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];

  let start!: ReturnType<typeof result.current.start>;
  act(() => {
    start = result.current.start(plan, 'REAL', 'JAVA_V1', false);
  });
  const startRequest = requestBody(send, 0);
  messages.push(responseMessage(
    'smokeTest.integration.startResponse',
    startResponse(startRequest.requestId),
  ));
  act(() => {
    rerender({ messages: [...messages] });
  });
  await act(async () => {
    await start;
  });

  let finish!: ReturnType<typeof result.current.finish>;
  act(() => {
    finish = result.current.finish();
  });
  const finishRequest = requestBody(send, 1);
  messages.push(responseMessage('smokeTest.integration.finishResponse', {
    ok: false,
    contractVersion: 1,
    requestId: finishRequest.requestId,
    runId: 'server-run-1',
    code: 'INTEGRATION_BUSY',
    message: 'Integration termination is still busy.',
  }));
  act(() => {
    rerender({ messages: [...messages] });
  });
  await act(async () => {
    await expect(finish).rejects.toThrow('still busy');
  });

  expect(result.current.phase).toBe('CLEANUP_REQUIRED');
  expect(result.current.activeRun?.runId).toBe('server-run-1');

  let stop!: ReturnType<typeof result.current.stop>;
  act(() => {
    stop = result.current.stop('TEST_CLEANUP');
  });
  const stopRequest = requestBody(send, 2);
  messages.push(responseMessage('smokeTest.integration.stopResponse', {
    ok: true,
    contractVersion: 1,
    requestId: stopRequest.requestId,
    runId: 'server-run-1',
    integrationEpoch: 4,
    status: 'STOPPED',
    lastSequence: 0,
    passed: 0,
    warnings: 0,
    failed: 0,
    skipped: 0,
    message: 'Integration stopped.',
  }));
  act(() => {
    rerender({ messages: [...messages] });
  });
  await act(async () => {
    await stop;
  });

  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();
  expect(result.current.error).toBeNull();
});

test('keeps Stop single-flight when it cancels an in-flight step', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];

  let start!: ReturnType<typeof result.current.start>;
  act(() => {
    start = result.current.start(plan, 'REAL', 'JAVA_V1', false);
  });
  const startRequest = requestBody(send, 0);
  messages.push(responseMessage(
    'smokeTest.integration.startResponse',
    startResponse(startRequest.requestId),
  ));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await start; });

  let step!: ReturnType<typeof result.current.executeStep>;
  let firstStop!: ReturnType<typeof result.current.stop>;
  let duplicateStop!: ReturnType<typeof result.current.stop>;
  act(() => {
    step = result.current.executeStep(1735, 0, false);
    firstStop = result.current.stop('USER_REQUEST');
    duplicateStop = result.current.stop('STEP_REQUEST_FAILED');
  });

  expect(requestBody(send, 1).recoveryVerificationEnabled).toBe(false);

  await act(async () => {
    await expect(step).rejects.toThrow('cancelled the pending step');
    await duplicateStop;
  });
  expect(send).toHaveBeenCalledTimes(3);

  const stopRequest = requestBody(send, 2);
  messages.push(responseMessage('smokeTest.integration.stopResponse', {
    ok: true,
    contractVersion: 1,
    requestId: stopRequest.requestId,
    runId: 'server-run-1',
    integrationEpoch: 4,
    status: 'STOPPED',
    lastSequence: 0,
    passed: 0,
    warnings: 0,
    failed: 0,
    skipped: 0,
    message: 'Integration stopped.',
  }));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await firstStop; });

  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();
  expect(result.current.error).toBeNull();
});

test('correlates recovery scan, candidate test, and user-selected action requests', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];
  let start!: ReturnType<typeof result.current.start>;
  act(() => { start = result.current.start(plan, 'REAL', 'JAVA_V1', false); });
  const startRequest = requestBody(send, 0);
  messages.push(responseMessage('smokeTest.integration.startResponse', startResponse(startRequest.requestId)));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await start; });

  let scan!: ReturnType<typeof result.current.scanRecovery>;
  act(() => { scan = result.current.scanRecovery(1, 1735); });
  const scanRequest = requestBody(send, 1);
  expect(scanRequest).toMatchObject({ sequence: 1, instructionId: 1735 });
  messages.push(responseMessage('smokeTest.integration.recoveryScanResponse', {
    ok: true,
    contractVersion: 1,
    requestId: scanRequest.requestId,
    runId: 'server-run-1',
    integrationEpoch: 4,
    sequence: 1,
    instructionId: 1735,
    status: 'COMPLETED',
    message: 'Page Scanner completed.',
    elementCount: 239,
    recovery: { state: 'AWAITING_USER', candidates: [] },
  }));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await scan; });

  const candidateId = 'a'.repeat(64);
  let testCandidate!: ReturnType<typeof result.current.testRecoveryCandidate>;
  act(() => { testCandidate = result.current.testRecoveryCandidate(1, 1735, candidateId, 'INPUT'); });
  const testRequest = requestBody(send, 2);
  expect(testRequest).toMatchObject({ recoveryCandidateId: candidateId, action: 'INPUT' });
  messages.push(responseMessage('smokeTest.integration.recoveryTestResponse', {
    ok: true,
    contractVersion: 1,
    requestId: testRequest.requestId,
    runId: 'server-run-1',
    integrationEpoch: 4,
    sequence: 1,
    instructionId: 1735,
    recoveryCandidateId: candidateId,
    action: 'INPUT',
    status: 'COMPLETED',
    message: 'Test Input completed.',
  }));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await testCandidate; });

  let recover!: ReturnType<typeof result.current.recoverStep>;
  act(() => { recover = result.current.recoverStep(1, 1735, candidateId, 'USE_ONCE', 'OUTPUT'); });
  const recoverRequest = requestBody(send, 3);
  expect(recoverRequest).toMatchObject({
    recoveryCandidateId: candidateId,
    decision: 'USE_ONCE',
    action: 'OUTPUT',
  });
  messages.push(responseMessage('smokeTest.integration.recoverResponse', {
    ok: true,
    contractVersion: 1,
    requestId: recoverRequest.requestId,
    runId: 'server-run-1',
    integrationEpoch: 4,
    sequence: 1,
    instructionId: 1735,
    status: 'COMPLETED',
    message: 'Recovery completed.',
    locatorSaved: false,
  }));
  act(() => rerender({ messages: [...messages] }));
  await act(async () => { await recover; });
});
