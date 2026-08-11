import { act, renderHook } from '@testing-library/react';
import type { VariablesSmokeTestPlan } from '../../variables/domain/variablesSmokeTestTypes';
import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';
import { useSmokeTestIntegrationRun } from './useSmokeTestIntegrationRun';

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
  datasetEpoch: 3,
  datasetRevision: 0,
  datasetContentRevision: 'c'.repeat(64),
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
    await expect(result.current.start(plan, 'REAL', false))
      .rejects.toThrow('socket closed during send');
  });
  expect(result.current.phase).toBe('IDLE');
  expect(result.current.activeRun).toBeNull();

  let retry!: ReturnType<typeof result.current.start>;
  act(() => {
    retry = result.current.start(plan, 'REAL', false);
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

test('keeps the active run when Finish is refused and permits Stop cleanup retry', async () => {
  const send = jest.fn();
  const { result, rerender } = renderIntegrationHook(send);
  const messages: string[] = [];

  let start!: ReturnType<typeof result.current.start>;
  act(() => {
    start = result.current.start(plan, 'REAL', false);
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
    start = result.current.start(plan, 'REAL', false);
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
    step = result.current.executeStep(1735, 0);
    firstStop = result.current.stop('USER_REQUEST');
    duplicateStop = result.current.stop('STEP_REQUEST_FAILED');
  });

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
