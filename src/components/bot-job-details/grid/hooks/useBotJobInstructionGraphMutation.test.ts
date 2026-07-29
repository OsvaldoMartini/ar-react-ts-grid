import { act, renderHook } from '@testing-library/react';
import {
  BOT_JOB_GRAPH_MUTATION_RESPONSE,
  INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
} from '../domain/instructionGraphMutation.contract';
import { useBotJobInstructionGraphMutation } from './useBotJobInstructionGraphMutation';

const capability = {
  enabled: true,
  contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
  workspaceEpoch: 8,
  graphVersion: 11,
  graphRevision: 'revision-11',
  ownerAssertion: {
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: 2,
    botJobId: 5,
  },
};

const draft = {
  mutationKind: 'ROW_MOVE' as const,
  draggedInstructionId: 21,
  layoutRows: [{
    instructionId: 21,
    blockId: 7,
    blockOrderNumber: 1,
    instructionOrderNumber: 1,
  }],
  instructionRelationPatches: [],
  variableBindingPatches: [],
  variableOwnerPatches: [],
};

const socket = () => ({
  readyState: WebSocket.OPEN,
  send: jest.fn(),
}) as unknown as WebSocket;

const envelope = (body: Record<string, unknown>): string => JSON.stringify({
  sessionId: 'botJobTasks',
  operationId: BOT_JOB_GRAPH_MUTATION_RESPONSE,
  body: JSON.stringify(body),
});

const successResponse = (
  requestId: string,
  body: Record<string, unknown> = {},
): string => envelope({
    contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
    requestId,
    workspaceEpoch: capability.workspaceEpoch,
    ownerAssertion: capability.ownerAssertion,
    ok: true,
    committedGraphVersion: 12,
    graphRevision: 'revision-12',
    ...body,
});

const errorResponse = (
  requestId: string,
  body: Record<string, unknown> = {},
): string => envelope({
  contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
  requestId,
  workspaceEpoch: capability.workspaceEpoch,
  ownerAssertion: capability.ownerAssertion,
  ok: false,
  errorCode: 'STALE',
  message: 'The mutation was refused.',
  ...body,
});

describe('useBotJobInstructionGraphMutation', () => {
  it('is inert without the exact advertised v3 capability', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability: null,
      }));

    expect(result.current.submitMutation(draft, { rollback })).toBeNull();
    expect(webSocket.send).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
  });

  it('sends one private Bot Job request and commits only its correlated response', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const committed = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
      }));

    let requestId: string | null = null;
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, committed },
      );
    });
    expect(requestId).not.toBeNull();
    const sent = JSON.parse(
      (webSocket.send as jest.Mock).mock.calls[0][0],
    );
    expect(sent).toMatchObject({
      type: 'BOT_JOB_GRAPH_MUTATION',
      sessionId: 'botJobTasks',
      contractVersion: 3,
      requestId,
      baseGraphVersion: 11,
      workspaceEpoch: 8,
      ownerAssertion: capability.ownerAssertion,
    });

    act(() => {
      expect(result.current.handleMutationMessage(
        successResponse('another-request'),
      )).toBe(false);
      expect(result.current.handleMutationMessage(
        successResponse(requestId!),
      )).toBe(true);
    });
    expect(committed).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
    expect(result.current.pendingRequestId).toBeNull();
  });

  it('rolls back a correlated refusal and ignores a retired workspace epoch', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const refused = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
      }));

    let requestId = '';
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, refused },
      ) || '';
    });
    act(() => {
      expect(result.current.handleMutationMessage(errorResponse(requestId, {
        workspaceEpoch: 9,
      }))).toBe(false);
      expect(result.current.handleMutationMessage(errorResponse(requestId)))
        .toBe(true);
    });
    expect(rollback).toHaveBeenCalledWith('STALE');
    expect(refused).toHaveBeenCalledTimes(1);
  });

  it('retires a pending mutation when the workspace capability changes', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const committed = jest.fn();
    const { result, rerender } = renderHook(
      ({ activeCapability }) =>
        useBotJobInstructionGraphMutation({
          webSocket,
          connected: true,
          capability: activeCapability,
        }),
      { initialProps: { activeCapability: capability } },
    );

    let requestId = '';
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, committed },
      ) || '';
    });
    rerender({
      activeCapability: {
        ...capability,
        workspaceEpoch: 9,
      },
    });
    expect(rollback).toHaveBeenCalledWith('WORKSPACE_CHANGED');
    expect(result.current.pendingRequestId).toBeNull();
    act(() => {
      expect(result.current.handleMutationMessage(successResponse(requestId)))
        .toBe(false);
    });
    expect(committed).not.toHaveBeenCalled();
  });

  it('does not consume a malformed success without committed authority', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const committed = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
      }));

    let requestId = '';
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, committed },
      ) || '';
    });
    const malformed = JSON.stringify({
      sessionId: 'botJobTasks',
      operationId: BOT_JOB_GRAPH_MUTATION_RESPONSE,
      body: JSON.stringify({
        contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
        requestId,
        workspaceEpoch: capability.workspaceEpoch,
        ownerAssertion: capability.ownerAssertion,
        ok: true,
      }),
    });
    act(() => {
      expect(result.current.handleMutationMessage(malformed)).toBe(false);
    });
    expect(committed).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
    expect(result.current.pendingRequestId).toBe(requestId);
    act(() => result.current.cancelPending());
  });

  it('does not consume success authority that fails to advance the base graph version', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const committed = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
      }));

    let requestId = '';
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, committed },
      ) || '';
    });
    act(() => {
      expect(result.current.handleMutationMessage(successResponse(requestId, {
        committedGraphVersion: capability.graphVersion,
      }))).toBe(false);
    });
    expect(committed).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
    expect(result.current.pendingRequestId).toBe(requestId);
    act(() => result.current.cancelPending());
  });

  it('keeps a pending mutation through a newer committed realtime capability', () => {
    const webSocket = socket();
    const rollback = jest.fn();
    const committed = jest.fn();
    const { result, rerender } = renderHook(
      ({ activeCapability }) =>
        useBotJobInstructionGraphMutation({
          webSocket,
          connected: true,
          capability: activeCapability,
        }),
      { initialProps: { activeCapability: capability } },
    );

    let requestId = '';
    act(() => {
      requestId = result.current.submitMutation(
        draft,
        { rollback, committed },
      ) || '';
    });
    rerender({
      activeCapability: {
        ...capability,
        graphVersion: 12,
        graphRevision: 'revision-12',
      },
    });
    expect(rollback).not.toHaveBeenCalled();
    expect(result.current.pendingRequestId).toBe(requestId);

    act(() => {
      expect(result.current.handleMutationMessage(successResponse(requestId)))
        .toBe(true);
    });
    expect(committed).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      label: 'owner',
      next: (
        originalSocket: WebSocket,
      ) => ({
        activeSocket: originalSocket,
        activeConnected: true,
        activeCapability: {
          ...capability,
          ownerAssertion: {
            ...capability.ownerAssertion,
            botJobId: 6,
          },
        },
      }),
      reason: 'WORKSPACE_CHANGED',
    },
    {
      label: 'socket',
      next: () => ({
        activeSocket: socket(),
        activeConnected: true,
        activeCapability: capability,
      }),
      reason: 'WORKSPACE_CHANGED',
    },
    {
      label: 'connection',
      next: (
        originalSocket: WebSocket,
      ) => ({
        activeSocket: originalSocket,
        activeConnected: false,
        activeCapability: capability,
      }),
      reason: 'DISCONNECTED',
    },
  ])('retires a pending mutation when its $label changes', ({
    next,
    reason,
  }) => {
    const webSocket = socket();
    const rollback = jest.fn();
    const { result, rerender } = renderHook(
      ({ activeSocket, activeConnected, activeCapability }) =>
        useBotJobInstructionGraphMutation({
          webSocket: activeSocket,
          connected: activeConnected,
          capability: activeCapability,
        }),
      {
        initialProps: {
          activeSocket: webSocket,
          activeConnected: true,
          activeCapability: capability,
        },
      },
    );

    act(() => {
      expect(result.current.submitMutation(draft, { rollback }))
        .not.toBeNull();
    });
    rerender(next(webSocket));
    expect(rollback).toHaveBeenCalledWith(reason);
    expect(result.current.pendingRequestId).toBeNull();
  });

  it.each([
    {
      label: 'null revision',
      malformed: {
        ...capability,
        graphRevision: null,
      },
    },
    {
      label: 'missing owner',
      malformed: {
        ...capability,
        ownerAssertion: null,
      },
    },
  ])('is safely inert for a runtime capability with $label', ({
    malformed,
  }) => {
    const webSocket = socket();
    const rollback = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability: malformed as unknown as typeof capability,
      }));

    expect(() => result.current.submitMutation(draft, { rollback }))
      .not.toThrow();
    expect(result.current.submitMutation(draft, { rollback })).toBeNull();
    expect(webSocket.send).not.toHaveBeenCalled();
  });

  it('generates distinct request IDs even within one clock tick', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_785_000_000_000);
    const webSocket = socket();
    const firstRollback = jest.fn();
    const secondRollback = jest.fn();
    const { result } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
      }));

    let first = '';
    let second = '';
    act(() => {
      first = result.current.submitMutation(
        draft,
        { rollback: firstRollback },
      ) || '';
      result.current.cancelPending();
      second = result.current.submitMutation(
        draft,
        { rollback: secondRollback },
      ) || '';
    });

    expect(first).not.toBe('');
    expect(second).not.toBe('');
    expect(second).not.toBe(first);
    expect(webSocket.send).toHaveBeenCalledTimes(2);
    act(() => result.current.cancelPending());
    now.mockRestore();
  });

  it('rolls back on timeout and refuses a second in-flight request', () => {
    jest.useFakeTimers();
    const webSocket = socket();
    const rollback = jest.fn();
    const { result, unmount } = renderHook(() =>
      useBotJobInstructionGraphMutation({
        webSocket,
        connected: true,
        capability,
        timeoutMs: 25,
      }));

    act(() => {
      expect(result.current.submitMutation(draft, { rollback }))
        .not.toBeNull();
      expect(result.current.submitMutation(draft, { rollback })).toBeNull();
      jest.advanceTimersByTime(25);
    });
    expect(rollback).toHaveBeenCalledWith('TIMEOUT');
    expect(result.current.pendingRequestId).toBeNull();
    unmount();
    jest.useRealTimers();
  });
});
