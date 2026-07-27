import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CommandEditorPage from './CommandEditorPage';

const mockSend = jest.fn();
let mockMessages: string[] = [];
const NOW = 1700000000000;
const BOOTSTRAP_REQUEST_ID = `${NOW}-command-editor-bootstrap`;
const mockWebSocket = {
  readyState: 1,
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

const instruction = (
  id: number,
  blockId: number,
  blockName: string,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  name: string,
) => ({
  id,
  name,
  actions: 'H',
  operation: null,
  blockId,
  blockName,
  blockOrderNumber,
  instructionOrderNumber,
  variableId: null,
  parentId: null,
  parentBlockId: null,
  onHoldSeconds: 2,
});

const loginWait = instruction(21, 7, 'Login', 1, 1, 'Wait for Login');
const loginContinue = instruction(22, 7, 'Login', 1, 2, 'Continue');
const accountsBalance = instruction(31, 8, 'Accounts', 2, 1, 'Read Balance');

const snapshotBody = ({
  bindingEpoch = 'binding-1',
  selectionRevision = 1,
  selectedInstruction = loginWait,
  targetSessionId = 'botJobTasks',
  requestId,
}: {
  bindingEpoch?: string;
  selectionRevision?: number;
  selectedInstruction?: typeof loginWait;
  targetSessionId?: 'botJobTasks' | 'componentTasks';
  requestId?: string;
} = {}) => ({
  ok: true,
  message: 'Command Editor loaded',
  ...(requestId ? { requestId } : {}),
  bindingEpoch,
  selectionRevision,
  targetSessionId,
  workspaceEpoch: 41,
  homeBankingId: 2,
  botJobId: 5,
  botJobName: 'Saldo Banca Stato',
  selectedBlockId: selectedInstruction.blockId,
  selectedInstructionId: selectedInstruction.id,
  instruction: selectedInstruction,
  blocks: [
    { id: 7, name: 'Login', blockOrderNumber: 1 },
    { id: 8, name: 'Accounts', blockOrderNumber: 2 },
  ],
  instructions: [loginWait, loginContinue, accountsBalance],
  variables: [{
    id: 501,
    type: '$String',
    name: 'account',
    value: 'ready',
    instructionId: 21,
  }],
  webFields: [{
    id: 90,
    name: 'Username',
    actions: 'INPUT',
    tagName: 'input',
    blockId: 7,
    blockName: 'Login',
  }],
  commands: [{
    code: 'H',
    label: 'Wait',
    target: 'none',
    fields: ['hold'],
    insertAllowed: true,
    editAllowed: true,
  }],
  graphRevision: `graph-${selectionRevision}`,
  draft: null,
  rowCapabilities: { canInsertElseIf: false, canSplit: false },
});

const envelope = (operationId: string, body: unknown) => JSON.stringify({
  operationId,
  body: JSON.stringify(body),
});

const requests = (type: string) => mockSend.mock.calls
  .map(([payload]) => JSON.parse(payload))
  .filter(message => message.type === type);

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  mockSend.mockClear();
  mockMessages = [
    envelope('commandEditor.workspaceBootstrapResponse', snapshotBody({
      requestId: BOOTSTRAP_REQUEST_ID,
    })),
  ];
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('hydrates the complete first workspace snapshot without a child bootstrap', async () => {
  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const blockSelect = await screen.findByLabelText('Command Editor Block');
  const instructionSelect = screen.getByLabelText('Command Editor Instruction');

  expect(blockSelect).toHaveValue('7');
  expect(within(blockSelect).getAllByRole('option')).toHaveLength(2);
  expect(instructionSelect).toHaveValue('21');
  expect(within(instructionSelect).getAllByRole('option')).toHaveLength(2);
  expect(screen.getByText('3 instructions loaded')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Add command before/ })).toBeEnabled();
  expect(requests('commandEditor.workspaceBootstrap')).toHaveLength(1);
  expect(requests('commandEditor.bootstrap')).toHaveLength(0);
});

test('hydrates an authoritative Components instruction workspace', async () => {
  mockMessages = [
    envelope('commandEditor.workspaceBootstrapResponse', snapshotBody({
      requestId: BOOTSTRAP_REQUEST_ID,
      targetSessionId: 'componentTasks',
    })),
  ];

  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(await screen.findByLabelText('Command Editor Instruction')).toHaveValue('21');
  expect(screen.getByText('3 instructions loaded')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Add command before/ })).toBeEnabled();
});

test('selects another instruction once and ignores stale select and snapshot responses', async () => {
  const page = render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const instructionSelect = await screen.findByLabelText('Command Editor Instruction');
  mockSend.mockClear();
  fireEvent.change(instructionSelect, { target: { value: '22' } });

  const selectRequests = requests('commandEditor.select');
  expect(selectRequests).toHaveLength(1);
  const selectBody = JSON.parse(selectRequests[0].body);
  expect(selectBody).toEqual(expect.objectContaining({
    bindingEpoch: 'binding-1',
    selectionRevision: 1,
    selectedBlockId: 7,
    selectedInstructionId: 22,
  }));
  expect(instructionSelect).toBeDisabled();

  mockMessages = [
    ...mockMessages,
    envelope('commandEditor.selectResponse', snapshotBody({
      bindingEpoch: 'stale-binding',
      selectionRevision: 2,
      selectedInstruction: loginContinue,
      requestId: 'another-request',
    })),
  ];
  page.rerender(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(await screen.findByLabelText('Command Editor Instruction')).toHaveValue('21');
  expect(screen.getByLabelText('Command Editor Instruction')).toBeDisabled();

  mockMessages = [
    ...mockMessages,
    envelope('commandEditor.selectResponse', snapshotBody({
      bindingEpoch: 'binding-2',
      selectionRevision: 2,
      selectedInstruction: loginContinue,
      requestId: selectBody.requestId,
    })),
  ];
  page.rerender(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Command Editor Instruction')).toHaveValue('22');
    expect(screen.getByLabelText('Command Editor Instruction')).toBeEnabled();
  });

  mockMessages = [
    ...mockMessages,
    envelope('commandEditor.snapshot', snapshotBody({
      bindingEpoch: 'binding-1',
      selectionRevision: 1,
      selectedInstruction: loginWait,
    })),
  ];
  page.rerender(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(screen.getByLabelText('Command Editor Instruction')).toHaveValue('22');
  expect(requests('commandEditor.select')).toHaveLength(1);
});
