import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
const usernameElement = {
  ...instruction(41, 7, 'Login', 1, 3, 'Username'),
  actions: 'C',
};

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
  instructions: [loginWait, loginContinue, accountsBalance].some(
    row => row.id === selectedInstruction.id,
  )
    ? [loginWait, loginContinue, accountsBalance]
    : [loginWait, loginContinue, accountsBalance, selectedInstruction],
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
  commandConfigurations: [{
    instructionId: selectedInstruction.id,
    commandType: selectedInstruction.actions,
    conditionSource: '',
    leftVariableId: null,
    operandKind: '',
    comparisonOperator: '',
    operandRawValue: '',
    operandVariableId: null,
    outputKey: '',
    outputColumn: '',
    outputFile: '',
    externalSourceKey: '',
    formatPolicy: '',
  }],
  variableLinks: [],
  workspaceCapabilities: targetSessionId === 'botJobTasks' ? {
    botJobGraphMutationV3: {
      enabled: true,
      contractVersion: 3,
      workspaceEpoch: 41,
      graphVersion: 8,
      graphRevision: `graph-${selectionRevision}`,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
    },
  } : {},
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

test('hydrates the independent modern editor body without legacy panel actions', async () => {
  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(await screen.findByLabelText('Command Editor workspace')).toBeInTheDocument();
  expect(screen.getByLabelText('Target Block')).toHaveValue('#1 Login');
  expect(screen.getByLabelText('Command')).toHaveValue('Wait');
  expect(screen.getByLabelText('Command placement')).toHaveValue('KEEP');
  expect(screen.getByLabelText('Wait seconds')).toHaveValue(2);
  expect(screen.getByRole('button', { name: 'COPY NEW' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'UPDATE' })).toBeEnabled();
  expect(screen.queryByText('Add command before')).not.toBeInTheDocument();
  expect(screen.queryByText('Add command after')).not.toBeInTheDocument();
  expect(screen.queryByText('Insert ElseIf')).not.toBeInTheDocument();
  expect(requests('commandEditor.workspaceBootstrap')).toHaveLength(1);
  expect(requests('commandEditor.bootstrap')).toHaveLength(0);
});

test('hydrates a Components target but keeps unavailable persistence fail-closed', async () => {
  mockMessages = [
    envelope('commandEditor.workspaceBootstrapResponse', snapshotBody({
      requestId: BOOTSTRAP_REQUEST_ID,
      targetSessionId: 'componentTasks',
    })),
  ];

  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(await screen.findByLabelText('Command Editor workspace')).toBeInTheDocument();
  expect(screen.getByLabelText('Command')).toHaveValue('Wait');
  expect(screen.getByRole('button', { name: 'COPY NEW' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'UPDATE' })).toBeDisabled();
});

test('locks Web Element transformation while retaining placement, copy, and update', async () => {
  mockMessages = [
    envelope('commandEditor.workspaceBootstrapResponse', snapshotBody({
      requestId: BOOTSTRAP_REQUEST_ID,
      selectedInstruction: usernameElement,
    })),
  ];

  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  expect(await screen.findByLabelText('Command Editor workspace')).toBeInTheDocument();
  expect(screen.getByLabelText('Command')).toBeDisabled();
  expect(screen.getByLabelText('Command placement')).toBeEnabled();
  expect(screen.getByText(/Web Element type is locked/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'COPY NEW' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'UPDATE' })).toBeEnabled();
});

test('submits the reduced modern UPDATE contract and refreshes after its correlated response', async () => {
  const view = render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const updateButton = await screen.findByRole('button', { name: 'UPDATE' });
  mockSend.mockClear();
  fireEvent.click(updateButton);

  const updateRequests = requests('variablesWorkspace.commandEditor.update');
  expect(updateRequests).toHaveLength(1);
  const updateBody = JSON.parse(updateRequests[0].body);
  expect(updateBody).toEqual(expect.objectContaining({
    contractVersion: 1,
    bindingEpoch: 'binding-1',
    selectionRevision: 1,
    homeBankingId: 2,
    botJobId: 5,
    workspaceEpoch: 41,
    baseGraphVersion: 8,
    graphRevision: 'graph-1',
    sourceInstructionId: 21,
    targetBlockId: 7,
    placement: { kind: 'KEEP', referenceInstructionId: null },
    targetAction: 'H',
  }));
  expect(updateBody.configuration).toEqual({ kind: 'WAIT', waitSeconds: 2 });
  expect(screen.getByRole('button', { name: 'UPDATE' })).toBeDisabled();

  mockMessages = [
    ...mockMessages,
    envelope('variablesWorkspace.commandEditor.updateResponse', {
      ok: true,
      committed: true,
      requestId: updateBody.requestId,
      bindingEpoch: 'binding-1',
      message: 'Command updated',
    }),
  ];
  view.rerender(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  await waitFor(() => {
    expect(requests('commandEditor.workspaceBootstrap')).toHaveLength(1);
  });
  expect(JSON.parse(requests('commandEditor.workspaceBootstrap')[0].body)).toEqual(
    expect.objectContaining({ bindingEpoch: 'binding-1', selectionRevision: 1 }),
  );
});

test('submits COPY NEW independently with modal-equivalent placement semantics', async () => {
  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const copyButton = await screen.findByRole('button', { name: 'COPY NEW' });
  mockSend.mockClear();
  fireEvent.click(copyButton);

  const copyRequests = requests('variablesWorkspace.commandEditor.copy');
  expect(copyRequests).toHaveLength(1);
  expect(JSON.parse(copyRequests[0].body)).toEqual(expect.objectContaining({
    bindingEpoch: 'binding-1',
    sourceInstructionId: 21,
    targetBlockId: 7,
    placement: { kind: 'AFTER_INSTRUCTION', referenceInstructionId: 21 },
    createBlank: false,
  }));
});

test('surfaces a correlated contract refusal even when it precedes backend binding', async () => {
  const view = render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const updateButton = await screen.findByRole('button', { name: 'UPDATE' });
  mockSend.mockClear();
  fireEvent.click(updateButton);
  const updateBody = JSON.parse(requests('variablesWorkspace.commandEditor.update')[0].body);

  mockMessages = [
    ...mockMessages,
    envelope('variablesWorkspace.commandEditor.updateResponse', {
      ok: false,
      committed: false,
      requestId: updateBody.requestId,
      error: 'The Command Editor request contract is invalid.',
    }),
  ];
  view.rerender(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  await waitFor(() => expect(screen.getByRole('button', { name: 'UPDATE' })).toBeEnabled());
  expect(screen.getAllByText('The Command Editor request contract is invalid.')).not.toHaveLength(0);
});

test('reloads authoritative state before retry after a mutation response is lost', async () => {
  render(
    <CommandEditorPage socketPort={7357} sessionId="commandEditorManager" />,
  );

  const updateButton = await screen.findByRole('button', { name: 'UPDATE' });
  mockSend.mockClear();
  jest.useFakeTimers();
  try {
    fireEvent.click(updateButton);
    expect(updateButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(15_000);
    });

    expect(screen.queryByRole('button', { name: 'UPDATE' })).not.toBeInTheDocument();
    expect(screen.getByText('Loading Command Editor...')).toBeInTheDocument();
    expect(requests('commandEditor.workspaceBootstrap')).toHaveLength(1);
    expect(JSON.parse(requests('commandEditor.workspaceBootstrap')[0].body)).toEqual(
      expect.objectContaining({ bindingEpoch: 'binding-1', selectionRevision: 1 }),
    );
  } finally {
    jest.useRealTimers();
  }
});
