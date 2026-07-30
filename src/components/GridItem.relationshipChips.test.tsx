import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import GridItem from './GridItem';
import GridItemComp from './GridItemComp';
import type {
  BlockLoopInstructionLoadDTO,
  ComponentsInstructionsDTO,
} from './instructionsMockData';
import { computeInstructionGraphRevision } from './bot-job-details/grid/domain/instructionGraphRevision';

const mockSend = jest.fn();
const mockWebSocket = {
  send: mockSend,
  readyState: WebSocket.OPEN,
} as unknown as WebSocket;
let mockMessages: string[] = [];

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: mockWebSocket,
    connected: true,
    reconnectAttempts: 0,
    messages: mockMessages,
    error: null,
  }),
}));

jest.mock('./bot-job-details/useBotJobDetailsController', () => ({
  useBotJobDetailsController: () => ({
    state: null,
    sendAction: jest.fn(),
  }),
}));

jest.mock('./bot-job-details/BotJobDetailsChrome', () => () => null);
jest.mock('./bot-job-details/ComponentWorkspaceHeader', () => () => null);

const loop: BlockLoopInstructionLoadDTO = {
  homeBankingId: 2,
  tagName: 'div',
  botJobId: 5,
  botJobName: 'Relationship regression',
  id: 918,
  instructionOrderNumber: 1,
  name: 'Loop',
  description: '',
  blockId: 10,
  blockOrderNumber: 1,
  blockName: 'Main',
  blockActive: true,
  blockWait: 0,
  actions: 'LOOP',
  operation: '5:100',
  instructionActive: true,
  parentId: 917,
};

const lateParent: BlockLoopInstructionLoadDTO = {
  ...loop,
  id: 917,
  instructionOrderNumber: 2,
  name: 'Pagina iniziale',
  actions: 'CLICK',
  operation: undefined,
  parentId: null,
  tagName: 'button',
};

const rows = [loop, lateParent];

const botJobProps = {
  homeBankingIdInitial: 2,
  data: rows,
  socketPort: 52101,
  sessionId: 'botJobTasks',
  botJobIdInitial: 5,
  botJobNameInitial: 'Relationship regression',
  workspaceEpochInitial: 9,
  onSessionOpen: jest.fn(),
};

const latestCapabilityRequest = () => {
  const envelope = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(candidate => candidate.type === 'instructionEditor.memoryCapabilities');
  if (!envelope) throw new Error('Capability request was not sent');
  return {
    envelope,
    body: JSON.parse(envelope.body),
  };
};

const capabilityResponse = (
  sessionId: string,
  relationshipChipsV1: boolean,
  workspaceEpoch: number,
  capabilityRows: BlockLoopInstructionLoadDTO[] = rows,
  fullGraphMutation = false,
): string => {
  const request = latestCapabilityRequest();
  const graphRevision = computeInstructionGraphRevision(capabilityRows, []);
  return JSON.stringify({
    sessionId,
    homeBankingId: 2,
    operationId: 'instructionEditor.memoryCapabilitiesResponse',
    body: JSON.stringify({
      ok: true,
      requestId: request.body.requestId,
      targetSessionId: request.body.targetSessionId,
      homeBankingId: request.body.homeBankingId,
      botJobId: request.body.botJobId,
      workspaceEpoch,
      workspaceCapabilities: {
        relationshipChipsV1,
        botJobGraphMutationV3: {
          workspaceEpoch: request.body.workspaceEpoch,
          ...(fullGraphMutation
            ? {
                enabled: true,
                contractVersion: 3,
                graphVersion: 4,
                graphRevision,
                ownerAssertion: {
                  workspaceKind: 'BOT_JOB',
                  homeBankingId: request.body.homeBankingId,
                  botJobId: request.body.botJobId,
                },
              }
            : {}),
        },
      },
      graphRevision,
      capabilities: capabilityRows.map(instruction => ({
        instructionId: instruction.id,
        canAddToMemory: true,
        canMove: true,
        canDelete: true,
        allowedBlockIds: [10],
      })),
      blockCapabilities: [],
      variableLinks: [],
    }),
  });
};

const waitForCapabilityRequest = async () => {
  await waitFor(() => {
    expect(mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload).type))
      .toContain('instructionEditor.memoryCapabilities');
  });
};

afterEach(() => {
  cleanup();
  mockMessages = [];
  mockSend.mockReset();
});

test('matching Bot Job capability and workspace epoch activates a nonblank relationship chip', async () => {
  const view = render(<GridItem {...botJobProps} />);
  await waitForCapabilityRequest();
  expect(latestCapabilityRequest().body.workspaceEpoch).toBe(9);

  mockMessages = [capabilityResponse('botJobTasks', true, 9)];
  view.rerender(<GridItem {...botJobProps} />);

  const details = await screen.findByTestId('instruction-relationship-details-918');
  expect(details).toHaveTextContent('(917)Pagina iniziale');
  expect(
    await screen.findByLabelText('Fix order: Loop anchor order'),
  ).toHaveAttribute('data-relationship-state', 'FIX_ORDER');
});

test('Bot Job reconnect parent button opens the shared design modal without mutating', async () => {
  const webElement: BlockLoopInstructionLoadDTO = {
    ...lateParent,
    id: 1499,
    instructionOrderNumber: 1,
    name: 'User number',
    actions: 'O',
    tagName: 'input',
  };
  const missingParent: BlockLoopInstructionLoadDTO = {
    ...loop,
    id: 1500,
    instructionOrderNumber: 2,
    name: 'Get user number',
    actions: 'GET',
    operation: 'user_number:value',
    parentId: null,
    variableId: null,
  };
  const reconnectRows = [webElement, missingParent];
  const reconnectProps = {
    ...botJobProps,
    data: reconnectRows,
  };
  const view = render(<GridItem {...reconnectProps} />);
  await waitForCapabilityRequest();

  mockMessages = [
    capabilityResponse('botJobTasks', true, 9, reconnectRows),
  ];
  view.rerender(<GridItem {...reconnectProps} />);

  fireEvent.click(await screen.findByRole('button', {
    name: /Reconnect parent: Missing element target/i,
  }));

  expect(screen.getByRole('heading', { name: 'Reconnect Web Element' }))
    .toBeInTheDocument();
  expect(screen.getByText(/#1 User number · ID 1499/i))
    .toBeInTheDocument();
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('BOT_JOB_GRAPH_MUTATION');

  fireEvent.click(screen.getByRole('button', { name: 'Cancel reconnect' }));
  expect(screen.queryByRole('heading', { name: 'Reconnect Web Element' }))
    .not.toBeInTheDocument();
});

test('Bot Job reconnect persists one exact parent patch through graph v3', async () => {
  const webElement: BlockLoopInstructionLoadDTO = {
    ...lateParent,
    id: 1499,
    instructionOrderNumber: 1,
    name: 'User number',
    actions: 'O',
    tagName: 'input',
  };
  const missingParent: BlockLoopInstructionLoadDTO = {
    ...loop,
    id: 1500,
    instructionOrderNumber: 2,
    name: 'Get user number',
    actions: 'GET',
    operation: 'user_number:value',
    parentId: null,
    parentBlockId: null,
    variableId: null,
  };
  const reconnectRows = [webElement, missingParent];
  const reconnectProps = {
    ...botJobProps,
    data: reconnectRows,
  };
  const view = render(<GridItem {...reconnectProps} />);
  await waitForCapabilityRequest();

  mockMessages = [
    capabilityResponse('botJobTasks', true, 9, reconnectRows, true),
  ];
  view.rerender(<GridItem {...reconnectProps} />);

  fireEvent.click(await screen.findByRole('button', {
    name: /Reconnect parent: Missing element target/i,
  }));
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText(/#1 User number/));
  fireEvent.click(screen.getByRole('button', { name: /^Connect$/i }));

  const mutation = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(envelope => envelope.type === 'BOT_JOB_GRAPH_MUTATION');
  expect(mutation).toMatchObject({
    contractVersion: 3,
    mutationKind: 'RELATIONSHIP_UPDATE',
    draggedInstructionId: null,
    instructionRelationPatches: [{
      instructionId: 1500,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: { parentId: null, parentBlockId: null },
      replacement: { parentId: 1499, parentBlockId: 10 },
    }],
    variableBindingPatches: [],
    variableOwnerPatches: [],
  });
  expect(mutation.layoutRows).toHaveLength(2);
});

test.each([
  ['unadvertised capability', false, 9],
  ['mismatched workspace epoch', true, 8],
])('%s keeps rows visible without activating chips', async (
  _caseName,
  relationshipChipsV1,
  responseEpoch,
) => {
  const view = render(<GridItem {...botJobProps} />);
  await waitForCapabilityRequest();

  mockMessages = [
    capabilityResponse('botJobTasks', relationshipChipsV1, responseEpoch),
  ];
  view.rerender(<GridItem {...botJobProps} />);

  await waitFor(() => expect(
    screen.getByLabelText('Move instruction 1'),
  ).toBeEnabled());
  expect(screen.getByTestId('instruction-relationship-details-918'))
    .toHaveTextContent('(917)Pagina iniziale');
  expect(screen.queryByLabelText('Fix order: Loop anchor order'))
    .not.toBeInTheDocument();
});

test('Components ignores relationshipChipsV1 even when a response advertises it', async () => {
  const componentProps = {
    homeBankingIdInitial: 2,
    dataComp: rows as ComponentsInstructionsDTO[],
    socketPort: 52101,
    sessionId: 'componentTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Relationship regression',
    workspaceEpochInitial: 9,
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItemComp {...componentProps} />);
  await waitForCapabilityRequest();

  mockMessages = [capabilityResponse('componentTasks', true, 9)];
  view.rerender(<GridItemComp {...componentProps} />);

  await waitFor(() => expect(
    screen.getByLabelText('Move instruction 1'),
  ).toBeEnabled());
  expect(screen.getByTestId('instruction-relationship-details-918'))
    .toHaveTextContent('(917)Pagina iniziale');
  expect(screen.queryByLabelText('Fix order: Loop anchor order'))
    .not.toBeInTheDocument();
});
