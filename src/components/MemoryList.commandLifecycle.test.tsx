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

const commandResponseMessage = (body: Record<string, unknown>) => JSON.stringify({
  operationId: 'memoryList.commandResponse',
  sessionId: 'memoryListManager',
  body: JSON.stringify(body),
});

const memoryCommands = () => mockSend.mock.calls
  .map(([raw]) => JSON.parse(raw))
  .filter(message => message.type === 'memoryList.command')
  .map(message => JSON.parse(message.body));

const openCreateAndApply = async () => {
  fireEvent.change(
    await screen.findByLabelText('Block:'),
    { target: { value: '__create__' } },
  );
  const nameInput = await screen.findByPlaceholderText('e.g. Login Flow');
  fireEvent.change(nameInput, { target: { value: 'Verified Target' } });
  const submit = screen.getByRole('button', { name: 'Create & Apply' });
  fireEvent.click(submit);
  return { nameInput, submit };
};

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

      const commands = memoryCommands();
      expect(commands).toHaveLength(1);
      const body = commands[0];
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
      expect(memoryCommands()).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  },
);

test('sends one correlated create-and-apply command and keeps the dialog pending', async () => {
  mockMessages = [snapshotMessage('BOT_JOB')];
  render(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

  const { nameInput } = await openCreateAndApply();
  fireEvent.click(screen.getByRole('button', { name: 'Creating and applying...' }));

  const commands = memoryCommands();
  expect(commands).toHaveLength(1);
  expect(commands[0]).toMatchObject({
    action: 'CREATE_BLOCK_AND_APPLY',
    blockName: 'Verified Target',
    position: { type: 'end' },
    ownerEpoch: 'memory-owner-1',
  });
  expect(commands[0].requestId)
    .toMatch(/^memory-list-\d+-\d+-create_block_and_apply$/);
  expect(nameInput).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Creating and applying...' })).toBeDisabled();
  expect(screen.getByText('Login')).toBeInTheDocument();
  expect(commands.some(command => command.action === 'CREATE_BLOCK')).toBe(false);
  expect(commands.some(command => command.action === 'APPLY')).toBe(false);
});

test('closes the create dialog and shows final success after a correlated committed response', async () => {
  mockMessages = [snapshotMessage('COMPONENT')];
  const { rerender } = render(
    <MemoryList socketPort={7357} sessionId="memoryListManager" />,
  );

  await openCreateAndApply();
  const [{ requestId }] = memoryCommands();
  mockMessages = [
    ...mockMessages,
    commandResponseMessage({
      ok: true,
      committed: true,
      synchronized: true,
      requestId,
      createdBlockId: 81,
      createdBlockName: 'Verified Target',
      appliedCount: 1,
      message: 'Target block created and Memory List applied.',
    }),
  ];
  rerender(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

  const alert = await screen.findByRole('alertdialog');
  expect(alert).toHaveTextContent('Block Created and Instructions Applied');
  expect(alert).toHaveTextContent('Target block created and Memory List applied.');
  expect(alert).toHaveTextContent('1 Memory List item was applied to "Verified Target" (ID 81).');
  expect(screen.queryByPlaceholderText('e.g. Login Flow')).not.toBeInTheDocument();
});

test('keeps the dialog and rows available when create-and-apply fails', async () => {
  mockMessages = [snapshotMessage('BOT_JOB')];
  const { rerender } = render(
    <MemoryList socketPort={7357} sessionId="memoryListManager" />,
  );

  await openCreateAndApply();
  const [{ requestId }] = memoryCommands();
  mockMessages = [
    ...mockMessages,
    commandResponseMessage({
      ok: false,
      committed: false,
      requestId,
      message: 'The new block could not be verified.',
    }),
  ];
  rerender(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

  const alert = await screen.findByRole('alertdialog');
  expect(alert).toHaveTextContent('Create and Apply Failed');
  expect(alert).toHaveTextContent('The new block could not be verified.');
  expect(screen.getByPlaceholderText('e.g. Login Flow')).toHaveValue('Verified Target');
  expect(screen.getByRole('button', { name: 'Create & Apply' })).toBeEnabled();
  expect(screen.getByText('Login')).toBeInTheDocument();
});

test('ignores a stale create-and-apply response and remains locked for the active request', async () => {
  mockMessages = [snapshotMessage('BOT_JOB')];
  const { rerender } = render(
    <MemoryList socketPort={7357} sessionId="memoryListManager" />,
  );

  await openCreateAndApply();
  mockMessages = [
    ...mockMessages,
    commandResponseMessage({
      ok: true,
      committed: true,
      synchronized: true,
      requestId: 'stale-request',
      createdBlockId: 81,
      appliedCount: 1,
    }),
  ];
  rerender(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('e.g. Login Flow')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Creating and applying...' })).toBeDisabled();
});

test('reports a committed unsynchronized result as success with a refresh warning', async () => {
  mockMessages = [snapshotMessage('BOT_JOB')];
  const { rerender } = render(
    <MemoryList socketPort={7357} sessionId="memoryListManager" />,
  );

  await openCreateAndApply();
  const [{ requestId }] = memoryCommands();
  mockMessages = [
    ...mockMessages,
    commandResponseMessage({
      ok: true,
      committed: true,
      synchronized: false,
      requestId,
      createdBlockId: 82,
      createdBlockName: 'Verified Target',
      appliedCount: 2,
      message: 'Instructions committed; Bot Job Details refresh is pending.',
    }),
  ];
  rerender(<MemoryList socketPort={7357} sessionId="memoryListManager" />);

  const alert = await screen.findByRole('alertdialog');
  expect(alert).toHaveTextContent('Instructions Applied - Refresh Pending');
  expect(alert).toHaveTextContent('2 Memory List items were applied to "Verified Target" (ID 82).');
  expect(alert).toHaveTextContent('Bot Job Details is still waiting for its authoritative refresh.');
  expect(screen.queryByPlaceholderText('e.g. Login Flow')).not.toBeInTheDocument();
});
