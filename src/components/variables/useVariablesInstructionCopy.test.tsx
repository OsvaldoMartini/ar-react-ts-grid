import { act, renderHook } from '@testing-library/react';
import type { VariableWorkspaceSnapshot } from '../variablesWorkspace.contract';
import {
  useVariablesInstructionCopy,
  VARIABLES_INSTRUCTION_COPY_CONTRACT_VERSION,
  VARIABLES_INSTRUCTION_COPY_OPERATION,
  VARIABLES_INSTRUCTION_COPY_RESPONSE,
} from './useVariablesInstructionCopy';

const REVISION = 'a'.repeat(64);
const COMMITTED_REVISION = 'b'.repeat(64);

const snapshot = (
  overrides: Partial<VariableWorkspaceSnapshot> = {},
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'bootstrap-1',
  bindingEpoch: 'binding-copy',
  workspaceEpoch: 9,
  graphRevision: REVISION,
  botJob: {
    id: 30,
    name: 'Copy instructions',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 1,
    producerCount: 1,
    consumerCount: 1,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [
    { id: 10, name: 'Source', order: 1, active: true },
    { id: 20, name: 'Target', order: 2, active: true },
  ],
  commands: [],
  variables: [],
  edges: [],
  diagnostics: [],
  runtimeMemory: { revision: 1, variables: [] },
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: null,
    graphVersion: 12,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 30,
    },
    layoutRows: [
      {
        instructionId: 10,
        blockId: 10,
        blockOrderNumber: 1,
        instructionOrderNumber: 1,
      },
      {
        instructionId: 20,
        blockId: 10,
        blockOrderNumber: 1,
        instructionOrderNumber: 2,
      },
      {
        instructionId: 30,
        blockId: 10,
        blockOrderNumber: 1,
        instructionOrderNumber: 3,
      },
    ],
    instructionFacts: [10, 20, 30].map((instructionId, index) => ({
      instructionId,
      blockId: 10,
      blockOrderNumber: 1,
      instructionOrderNumber: index + 1,
      action: 'GET',
      relationKind: 'ELEMENT_TARGET' as const,
      parentId: null,
      parentBlockId: null,
      variableId: null,
      tagName: null,
    })),
  },
  ...overrides,
});

const responseEnvelope = (
  body: Record<string, unknown>,
  operationId: string = VARIABLES_INSTRUCTION_COPY_RESPONSE,
): string => JSON.stringify({
  sessionId: 'variablesManager',
  operationId,
  body: JSON.stringify(body),
});

test('sends exact ordered source IDs and allows only one pending copy', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId: string | null = null;
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'WITH_PARENTS',
      sourceInstructionIds: [10, 20, 30],
    });
  });

  expect(requestId).not.toBeNull();
  expect(result.current.pendingRequestId).toBe(requestId);
  expect(send).toHaveBeenCalledTimes(1);
  const envelope = JSON.parse(send.mock.calls[0][0]);
  expect(envelope.type).toBe(VARIABLES_INSTRUCTION_COPY_OPERATION);
  expect(envelope.sessionId).toBe('variablesManager');
  expect(JSON.parse(envelope.body)).toEqual({
    contractVersion: VARIABLES_INSTRUCTION_COPY_CONTRACT_VERSION,
    requestId,
    bindingEpoch: 'binding-copy',
    workspaceEpoch: 9,
    baseGraphVersion: 12,
    graphRevision: REVISION,
    targetBlockId: 20,
    selectedInstructionId: 30,
    scope: 'WITH_PARENTS',
    sourceInstructionIds: [10, 20, 30],
  });

  act(() => {
    expect(result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    })).toBeNull();
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(onResult).not.toHaveBeenCalled();
  unmount();
});

test('rejects malformed or duplicate source lists instead of rewriting them', () => {
  const send = jest.fn();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send,
  } as unknown as WebSocket;
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult: jest.fn(),
  }));

  act(() => {
    expect(result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'WITH_PARENTS',
      sourceInstructionIds: [10, 30, 10],
    })).toBeNull();
    expect(result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'WITH_PARENTS',
      sourceInstructionIds: [10, 20],
    })).toBeNull();
    expect(result.current.submit({
      targetBlockId: 999,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    })).toBeNull();
    expect(result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30, 20],
    })).toBeNull();
    expect(result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 999,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [999],
    })).toBeNull();
  });
  expect(send).not.toHaveBeenCalled();
  unmount();
});

test('accepts one scope-matched response and exposes created IDs', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: true,
      committed: true,
      requestId,
      bindingEpoch: 'binding-copy',
      workspaceEpoch: 9,
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
      message: 'Instruction copied.',
      createdInstructionIds: [101],
      committedGraphVersion: 13,
      graphRevision: COMMITTED_REVISION,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledWith({
    ok: true,
    requestId,
    message: 'Instruction copied.',
    error: '',
    createdInstructionIds: [101],
    committedGraphVersion: 13,
    graphRevision: COMMITTED_REVISION,
  });
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test('rejects a response from another workspace scope', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: true,
      requestId,
      bindingEpoch: 'other-binding',
      workspaceEpoch: 9,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    error: expect.stringContaining('obsolete Variables workspace'),
  }));
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test('keeps a pending copy correlated when a newer graph snapshot arrives first', () => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const initial = snapshot();
  const { result, rerender, unmount } = renderHook(
    ({ currentSnapshot }) => useVariablesInstructionCopy({
      webSocket,
      connected: true,
      sessionId: 'variablesManager',
      snapshot: currentSnapshot,
      onResult,
    }),
    { initialProps: { currentSnapshot: initial } },
  );

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
  });
  rerender({
    currentSnapshot: snapshot({
      mutationCapability: {
        ...(initial.mutationCapability!),
        graphVersion: 13,
        graphRevision: COMMITTED_REVISION,
      },
    }),
  });

  expect(onResult).not.toHaveBeenCalled();
  expect(result.current.pendingRequestId).toBe(requestId);

  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: true,
      committed: true,
      requestId,
      bindingEpoch: 'binding-copy',
      workspaceEpoch: 9,
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
      message: 'Instruction copied.',
      createdInstructionIds: [101],
      committedGraphVersion: 13,
      graphRevision: COMMITTED_REVISION,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: true,
    requestId,
    createdInstructionIds: [101],
  }));
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test('cancels a pending copy when the WebSocket transport instance changes', () => {
  const firstSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const secondSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, rerender, unmount } = renderHook(
    ({ webSocket }) => useVariablesInstructionCopy({
      webSocket,
      connected: true,
      sessionId: 'variablesManager',
      snapshot: snapshot(),
      onResult,
    }),
    { initialProps: { webSocket: firstSocket } },
  );

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
  });
  rerender({ webSocket: secondSocket });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    error: expect.stringContaining('workspace connection changed'),
  }));
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
});

test.each([
  {
    name: 'non-incremented graph version',
    createdInstructionIds: [101],
    committedGraphVersion: 12,
  },
  {
    name: 'wrong generated ID count',
    createdInstructionIds: [101, 102],
    committedGraphVersion: 13,
  },
])('rejects an invalid success receipt: $name', ({
  createdInstructionIds,
  committedGraphVersion,
}) => {
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
  });
  act(() => {
    expect(result.current.handleMessage(responseEnvelope({
      ok: true,
      committed: true,
      requestId,
      bindingEpoch: 'binding-copy',
      workspaceEpoch: 9,
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
      createdInstructionIds,
      committedGraphVersion,
      graphRevision: COMMITTED_REVISION,
    }))).toBe(true);
  });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    error: expect.stringContaining('invalid commit receipt'),
  }));
  unmount();
});

test('times out one pending copy and keeps the last snapshot visible', () => {
  jest.useFakeTimers();
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket;
  const onResult = jest.fn();
  const { result, unmount } = renderHook(() => useVariablesInstructionCopy({
    webSocket,
    connected: true,
    sessionId: 'variablesManager',
    snapshot: snapshot(),
    onResult,
    timeoutMs: 20,
  }));

  let requestId = '';
  act(() => {
    requestId = result.current.submit({
      targetBlockId: 20,
      selectedInstructionId: 30,
      scope: 'ONLY_INSTRUCTION',
      sourceInstructionIds: [30],
    }) ?? '';
    jest.advanceTimersByTime(20);
  });

  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
    ok: false,
    requestId,
    error: expect.stringContaining('timed out'),
  }));
  expect(result.current.pendingRequestId).toBeNull();
  unmount();
  jest.useRealTimers();
});
