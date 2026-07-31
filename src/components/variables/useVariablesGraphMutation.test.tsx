import { act, renderHook } from '@testing-library/react';
import type {
  BotJobGraphMutationDraft,
  BotJobGraphMutationResponse,
} from '../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';
import {
  useVariablesGraphMutation,
  VARIABLES_GRAPH_MUTATION_RESPONSE,
  VARIABLES_GRAPH_MUTATION_TYPE,
} from './useVariablesGraphMutation';

const REVISION = 'a'.repeat(64);

const snapshot = (
  overrides: Partial<VariableWorkspaceSnapshot> = {},
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'bootstrap-1',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 4,
  graphRevision: REVISION,
  botJob: {
    id: 5,
    name: 'Variables transport',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 0,
    producerCount: 0,
    consumerCount: 0,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [{ id: 10, name: 'Main', order: 1, active: true }],
  commands: [],
  variables: [],
  edges: [],
  diagnostics: [],
  runtimeMemory: { revision: 0, variables: [] },
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: null,
    graphVersion: 7,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    },
    layoutRows: [{
      instructionId: 101,
      blockId: 10,
      blockOrderNumber: 1,
      instructionOrderNumber: 1,
    }],
    instructionFacts: [{
      instructionId: 101,
      blockId: 10,
      blockOrderNumber: 1,
      instructionOrderNumber: 1,
      action: 'CLICK',
      relationKind: 'ELEMENT_TARGET',
      parentId: null,
      parentBlockId: null,
      variableId: null,
    }],
    variableFacts: [],
  },
  ...overrides,
});

const draft: BotJobGraphMutationDraft = {
  mutationKind: 'ROW_MOVE',
  draggedInstructionId: 101,
  layoutRows: [{
    instructionId: 101,
    blockId: 10,
    blockOrderNumber: 1,
    instructionOrderNumber: 1,
  }],
  instructionRelationPatches: [],
  variableBindingPatches: [],
  variableOwnerPatches: [],
};

const responseEnvelope = (
  response: BotJobGraphMutationResponse,
  overrides: Record<string, unknown> = {},
) => JSON.stringify({
  sessionId: 'variablesManager',
  operationId: VARIABLES_GRAPH_MUTATION_RESPONSE,
  body: JSON.stringify(response),
  ...overrides,
});

const success = (
  requestId: string,
  committedGraphVersion = 8,
): BotJobGraphMutationResponse => ({
  ok: true,
  contractVersion: 3,
  requestId,
  workspaceEpoch: 4,
  ownerAssertion: {
    workspaceKind: 'BOT_JOB',
    homeBankingId: 2,
    botJobId: 5,
  },
  committedGraphVersion,
  graphRevision: 'b'.repeat(64),
  message: 'Saved',
});

test('sends one Variables-owned v3 request and accepts only its correlated response', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const committed = jest.fn();
  const refused = jest.fn();
  const { result } = renderHook(() => useVariablesGraphMutation({
    webSocket,
    connected: true,
    snapshot: snapshot(),
  }));

  let requestId: string | null = null;
  act(() => {
    requestId = result.current.submit(draft, { committed, refused });
  });
  expect(requestId).not.toBeNull();
  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  const body = JSON.parse(envelope.body);
  expect(envelope).toMatchObject({
    type: VARIABLES_GRAPH_MUTATION_TYPE,
    sessionId: 'variablesManager',
  });
  expect(body).toMatchObject({
    requestId,
    bindingEpoch: 'binding-1',
    baseGraphVersion: 7,
    graphRevision: REVISION,
    workspaceEpoch: 4,
    draggedInstructionId: 101,
  });

  act(() => {
    expect(result.current.submit(draft, { committed, refused })).toBeNull();
  });
  expect(send).toHaveBeenCalledTimes(1);

  act(() => {
    expect(result.current.handleMessage(responseEnvelope(
      success('another-request'),
    ))).toBe(false);
  });
  expect(committed).not.toHaveBeenCalled();

  act(() => {
    expect(result.current.handleMessage(responseEnvelope(
      success(requestId as string),
    ))).toBe(true);
  });
  expect(committed).toHaveBeenCalledTimes(1);
  expect(refused).not.toHaveBeenCalled();
  expect(result.current.pendingRequestId).toBeNull();

  act(() => {
    expect(result.current.handleMessage(responseEnvelope(
      success(requestId as string),
    ))).toBe(false);
  });
  expect(committed).toHaveBeenCalledTimes(1);
});

test('consumes a correlated success that failed to advance the graph version as a refusal', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const committed = jest.fn();
  const refused = jest.fn();
  const { result } = renderHook(() => useVariablesGraphMutation({
    webSocket,
    connected: true,
    snapshot: snapshot(),
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit(draft, { committed, refused }) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope(
      success(requestId, 7),
    ))).toBe(true);
  });
  expect(committed).not.toHaveBeenCalled();
  expect(refused).toHaveBeenCalledTimes(1);
  expect(refused).toHaveBeenCalledWith(null, 'INVALID_COMMIT_VERSION');
  expect(result.current.pendingRequestId).toBeNull();
});

test('cancels one pending request when its authoritative binding changes', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const committed = jest.fn();
  const refused = jest.fn();
  const { result, rerender } = renderHook(
    ({ currentSnapshot }) => useVariablesGraphMutation({
      webSocket,
      connected: true,
      snapshot: currentSnapshot,
    }),
    { initialProps: { currentSnapshot: snapshot() } },
  );

  act(() => {
    result.current.submit(draft, { committed, refused });
  });
  expect(result.current.pendingRequestId).not.toBeNull();

  rerender({
    currentSnapshot: snapshot({ bindingEpoch: 'binding-2' }),
  });
  expect(refused).toHaveBeenCalledWith(null, 'WORKSPACE_CHANGED');
  expect(committed).not.toHaveBeenCalled();
  expect(result.current.pendingRequestId).toBeNull();
});

test('cancels one pending request when a newer authoritative graph arrives', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const committed = jest.fn();
  const refused = jest.fn();
  const { result, rerender } = renderHook(
    ({ currentSnapshot }) => useVariablesGraphMutation({
      webSocket,
      connected: true,
      snapshot: currentSnapshot,
    }),
    { initialProps: { currentSnapshot: snapshot() } },
  );

  act(() => {
    result.current.submit(draft, { committed, refused });
  });
  expect(result.current.pendingRequestId).not.toBeNull();

  rerender({
    currentSnapshot: snapshot({
      graphRevision: 'b'.repeat(64),
      mutationCapability: {
        ...(snapshot().mutationCapability as NonNullable<
          VariableWorkspaceSnapshot['mutationCapability']
        >),
        graphVersion: 8,
        graphRevision: 'b'.repeat(64),
      },
    }),
  });

  expect(refused).toHaveBeenCalledWith(null, 'WORKSPACE_CHANGED');
  expect(committed).not.toHaveBeenCalled();
  expect(result.current.pendingRequestId).toBeNull();
});

test('sends the separately advertised cross-block profile outside the v3 request core', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const crossSnapshot = snapshot();
  if (!crossSnapshot.mutationCapability) {
    throw new Error('Missing mutation capability');
  }
  crossSnapshot.mutationCapability = {
    ...crossSnapshot.mutationCapability,
    crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
  };
  const { result } = renderHook(() => useVariablesGraphMutation({
    webSocket,
    connected: true,
    snapshot: crossSnapshot,
  }));

  act(() => {
    expect(result.current.submit(
      draft,
      { committed: jest.fn(), refused: jest.fn() },
      'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
    )).not.toBeNull();
  });

  const envelope = JSON.parse(send.mock.calls[0][0]);
  const body = JSON.parse(envelope.body);
  expect(body.mutationProfile).toBe(
    'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
  );
  expect(body.contractVersion).toBe(3);
  expect(body.draggedInstructionId).toBe(101);
});
