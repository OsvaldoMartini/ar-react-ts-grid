import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MemoryList from './MemoryList';

const mockSend = jest.fn();
let mockMessages: string[] = [];
const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: mockSend,
};

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: mockWebSocket,
    connected: true,
    reconnectAttempts: 0,
    messages: mockMessages,
    error: null,
  }),
}));

jest.mock('./PagesOpenButton', () => () => null);
jest.mock('./DetachedPageShell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const snapshotMessage = (sourceKind: 'BOT_JOB' | 'COMPONENT') => JSON.stringify({
  operationId: 'memoryList.snapshot',
  sessionId: 'memoryListManager',
  body: JSON.stringify({
    ownerEpoch: 'memory-owner-1',
    sourceKind,
    homeBankingId: 2,
    botJobId: 5,
    botJobName: 'Saldo Banca Stato',
    items: [{
      key: `${sourceKind}:row-1`,
      sourceKind,
      sourceItemKey: 'row-1',
      label: 'Login',
      active: true,
      payload: sourceKind === 'COMPONENT'
        ? {
            kind: 'INSTRUCTION',
            componentInstructionId: 101,
            componentBlockId: 44,
            sourceRevision: 'component-revision-1',
          }
        : { instructionId: 21 },
    }],
    blocks: [{ blockId: 7, blockOrderNumber: 1, blockName: 'Target' }],
    targetBlockId: 7,
    busy: false,
    canApply: true,
  }),
});

beforeEach(() => {
  mockSend.mockClear();
  mockMessages = [];
});

test.each(['BOT_JOB', 'COMPONENT'] as const)(
  'sends only one correlated Apply while the %s command is pending',
  async (sourceKind) => {
    mockMessages = [snapshotMessage(sourceKind)];
    render(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

    const apply = await screen.findByRole('button', { name: 'Apply' });
    await waitFor(() => expect(apply).toBeEnabled());

    jest.useFakeTimers();
    try {
      fireEvent.click(apply);
      fireEvent.click(apply);

      const commands = mockSend.mock.calls
        .map(([raw]) => JSON.parse(raw))
        .filter(message => message.type === 'memoryList.command');
      expect(commands).toHaveLength(1);
      const body = JSON.parse(commands[0].body);
      expect(body.action).toBe('APPLY');
      expect(body.ownerEpoch).toBe('memory-owner-1');
      expect(body.requestId).toMatch(/^memory-list-\d+-\d+-apply$/);
      expect(screen.getByRole('button', { name: 'Applying...' })).toBeDisabled();

      act(() => {
        jest.advanceTimersByTime(15000);
      });
      expect(screen.getByText(/still waiting for backend confirmation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Applying...' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Applying...' }));
      expect(mockSend.mock.calls
        .map(([raw]) => JSON.parse(raw))
        .filter(message => message.type === 'memoryList.command'))
        .toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  },
);
