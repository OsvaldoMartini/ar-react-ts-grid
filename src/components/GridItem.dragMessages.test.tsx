import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import GridItem from './GridItem';
import GridItemComp from './GridItemComp';
import { BlockLoopInstructionLoadDTO, ComponentsInstructionsDTO } from './instructionsMockData';

const mockSend = jest.fn();
const mockWebSocket = { send: mockSend, readyState: WebSocket.OPEN } as unknown as WebSocket;
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
  useBotJobDetailsController: () => ({ state: null, sendAction: jest.fn() }),
}));

jest.mock('./bot-job-details/BotJobDetailsChrome', () => () => null);
jest.mock('./bot-job-details/ComponentWorkspaceHeader', () => () => null);

const row: BlockLoopInstructionLoadDTO = {
  homeBankingId: 2,
  tagName: 'button',
  botJobId: 5,
  botJobName: 'Drag regression',
  id: 101,
  instructionOrderNumber: 1,
  name: 'Continue',
  description: '',
  blockId: 10,
  blockOrderNumber: 1,
  blockName: 'Main',
  blockActive: true,
  blockWait: 0,
  actions: 'CLICK',
  instructionActive: true,
};

const secondRow: BlockLoopInstructionLoadDTO = {
  ...row,
  id: 102,
  instructionOrderNumber: 2,
  name: 'Confirm',
};

const capabilityResponse = (sessionId: string) => {
  const request = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'instructionEditor.memoryCapabilities');
  if (!request) throw new Error('Capability request was not sent');
  const requestedBody = JSON.parse(request.body);
  return JSON.stringify({
  sessionId,
  homeBankingId: 2,
  operationId: 'instructionEditor.memoryCapabilitiesResponse',
  body: JSON.stringify({
    ok: true,
    requestId: requestedBody.requestId,
    targetSessionId: requestedBody.targetSessionId,
    homeBankingId: requestedBody.homeBankingId,
    botJobId: requestedBody.botJobId,
    graphRevision: 'revision-1',
    capabilities: [{
      instructionId: 101,
      canAddToMemory: true,
      canMove: true,
      canDelete: true,
      allowedBlockIds: [10],
    }],
    blockCapabilities: [],
  }),
  });
};

const unrelatedResponse = (sessionId: string) => JSON.stringify({
  sessionId,
  operationId: 'rowStatus',
  body: JSON.stringify({ instructionId: 0, color: 'green' }),
});

const expectQueuedCapabilityEnablesDrag = async (sessionId: string) => {
  await waitFor(() => expect(screen.getByLabelText('Move instruction 1')).toBeEnabled());
  const staleMemoryButtons = screen.getAllByTitle(
    'The instruction graph changed. Refresh this workspace before adding rows or blocks to Memory List.',
  );
  expect(staleMemoryButtons.length).toBeGreaterThanOrEqual(2);
  staleMemoryButtons.forEach(button => expect(button).toBeDisabled());

  // Native HTML5 drag: grab row 1 (instruction 101) and drop it on row 2 (index 1).
  const sourceRow = screen.getByLabelText('Move instruction 1').closest('[draggable]');
  const destinationRow = screen.getByLabelText('Move instruction 2').closest('[draggable]');
  fireEvent.dragStart(sourceRow as Element);
  fireEvent.drop(destinationRow as Element);

  await waitFor(() => {
    const preview = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find((message) => message.type === 'instructionGraph.previewMove');
    expect(preview).toBeDefined();
    expect(JSON.parse(preview.body)).toMatchObject({
      targetSessionId: sessionId,
      graphRevision: 'revision-1',
      instructionId: 101,
      destinationBlockId: 10,
    });
  });
};

afterEach(() => {
  cleanup();
  mockMessages = [];
  mockSend.mockReset();
});

test('Bot Job grid consumes a capability response even when a later frame is queued', async () => {
  const props = {
    homeBankingIdInitial: 2,
    data: [row, secondRow],
    socketPort: 52101,
    sessionId: 'botJobTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Drag regression',
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItem {...props} />);
  await waitFor(() => expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .toContain('instructionEditor.memoryCapabilities'));

  mockMessages = [capabilityResponse(props.sessionId), unrelatedResponse(props.sessionId)];
  view.rerender(<GridItem {...props} />);

  await expectQueuedCapabilityEnablesDrag('botJobTasks');
});

test('Component grid consumes a capability response even when a later frame is queued', async () => {
  const props = {
    homeBankingIdInitial: 2,
    dataComp: [row as ComponentsInstructionsDTO, secondRow as ComponentsInstructionsDTO],
    socketPort: 52101,
    sessionId: 'componentTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Drag regression',
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItemComp {...props} />);
  await waitFor(() => expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .toContain('instructionEditor.memoryCapabilities'));

  mockMessages = [capabilityResponse(props.sessionId), unrelatedResponse(props.sessionId)];
  view.rerender(<GridItemComp {...props} />);

  await expectQueuedCapabilityEnablesDrag('componentTasks');
});

test('Bot Job block plus stages its complete connected dependency union atomically', async () => {
  const getValue: BlockLoopInstructionLoadDTO = {
    ...secondRow,
    blockId: 20,
    blockOrderNumber: 2,
    blockName: 'Extraction',
    instructionOrderNumber: 1,
    name: 'Get Value',
    actions: 'GET',
    parentId: 101,
  };
  const extractField: BlockLoopInstructionLoadDTO = {
    ...getValue,
    id: 103,
    instructionOrderNumber: 2,
    name: 'Extract Field',
    actions: 'E',
  };
  const props = {
    homeBankingIdInitial: 2,
    data: [row, getValue, extractField],
    socketPort: 52101,
    sessionId: 'botJobTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Drag regression',
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItem {...props} />);
  await waitFor(() => expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .toContain('instructionEditor.memoryCapabilities'));

  const request = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'instructionEditor.memoryCapabilities');
  const requestedBody = JSON.parse(request.body);
  const memoryGroupRows = [
    { id: 101, order: 1, name: 'Continue', action: 'CLICK', parentId: null, blockId: 10 },
    { id: 102, order: 1, name: 'Get Value', action: 'GET', parentId: 101, blockId: 20 },
    { id: 103, order: 2, name: 'Extract Field', action: 'E', parentId: 101, blockId: 20 },
  ];
  mockMessages = [JSON.stringify({
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    operationId: 'instructionEditor.memoryCapabilitiesResponse',
    body: JSON.stringify({
      ok: true,
      requestId: requestedBody.requestId,
      targetSessionId: 'botJobTasks',
      homeBankingId: 2,
      botJobId: 5,
      graphRevision: 'revision-1',
      capabilities: [101, 102, 103].map(instructionId => ({
        instructionId,
        canAddToMemory: true,
        canMove: true,
        canDelete: true,
        allowedBlockIds: [10, 20],
        memoryGroupKey: 'I:101,102,103|B:',
        memoryGroupRows,
        memoryGroupBlocks: [],
      })),
      blockCapabilities: [],
    }),
  })];
  view.rerender(<GridItem {...props} />);
  await waitFor(() => expect(screen.getAllByTitle(
    'Add this complete connected block to Memory List',
  )[0]).toBeEnabled());

  fireEvent.click(screen.getAllByTitle(
    'Add this complete connected block to Memory List',
  )[0]);
  expect(screen.getByText(
    'Add the complete connected Bot Job Block to Memory List?',
  )).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await waitFor(() => expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .toContain('memoryList.open'));
  const open = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'memoryList.open');
  const snapshot = JSON.parse(open.body).snapshot;
  expect(snapshot.items.map(
    (item: { payload: { instructionId: number } }) => item.payload.instructionId,
  )).toEqual([101, 102, 103]);
  expect(new Set(snapshot.items.map(
    (item: { dependencyGroupKey?: string }) => item.dependencyGroupKey,
  )).size).toBe(1);
});

test('an authoritative empty block never triggers the legacy automatic BLOCK_ORDER writer', async () => {
  const props = {
    homeBankingIdInitial: 2,
    data: [
      { ...row, blockOrderNumber: 2 },
      { ...secondRow, blockOrderNumber: 2 },
    ],
    initialBlocks: [
      {
        blockId: 135,
        blockOrderNumber: 1,
        blockName: 'TEST',
        blockActive: true,
        blockWait: 0,
      },
      {
        blockId: 10,
        blockOrderNumber: 2,
        blockName: 'Main',
        blockActive: true,
        blockWait: 0,
      },
    ],
    socketPort: 52101,
    sessionId: 'botJobTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Drag regression',
    onSessionOpen: jest.fn(),
  };
  render(<GridItem {...props} />);

  await waitFor(() => expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .toContain('instructionEditor.memoryCapabilities'));
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('BLOCK_ORDER');
  expect(screen.getByText('TEST')).toBeInTheDocument();
  expect(screen.getByText('No instructions in this block')).toBeInTheDocument();
  const emptyBlockTitle = screen.getByText('TEST');
  const populatedBlockTitle = screen.getByText('Main');
  expect(
    emptyBlockTitle.compareDocumentPosition(populatedBlockTitle)
      & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test('Memory Apply structured refresh keeps the source and renders its fresh copy', async () => {
  const props = {
    homeBankingIdInitial: 2,
    data: [row],
    socketPort: 52101,
    sessionId: 'botJobTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Drag regression',
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItem {...props} />);
  const blocks = [
    {
      blockId: 10,
      blockOrderNumber: 1,
      blockName: 'Main',
      blockActive: true,
      blockWait: 0,
    },
    {
      blockId: 135,
      blockOrderNumber: 2,
      blockName: 'TEST',
      blockActive: true,
      blockWait: 0,
    },
  ];
  const update = (instructions: BlockLoopInstructionLoadDTO[], requestId: string) => JSON.stringify({
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    operationId: 'updateInstructions',
    body: JSON.stringify({
      instructions,
      blocks,
      botJobId: 5,
      botJobName: 'Drag regression',
      homeBankingId: 2,
      memoryListRequestId: requestId,
    }),
  });

  mockMessages = [update([row], 'memory-create-1')];
  view.rerender(<GridItem {...props} />);
  await waitFor(() => {
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('No instructions in this block')).toBeInTheDocument();
  });

  const copiedRow = {
    ...row,
    id: 201,
    blockId: 135,
    blockOrderNumber: 2,
    blockName: 'TEST',
    instructionOrderNumber: 1,
  };
  mockMessages = [
    update([row], 'memory-create-1'),
    update([row, copiedRow], 'memory-apply-1'),
  ];
  view.rerender(<GridItem {...props} />);

  await waitFor(() => {
    const mainTitle = screen.getByText('Main');
    const mainCard = mainTitle.parentElement?.parentElement?.parentElement;
    expect(mainCard).not.toBeNull();
    expect(within(mainCard as HTMLElement).getByText('(101)Continue')).toBeInTheDocument();

    const testTitle = screen.getByText('TEST');
    const testCard = testTitle.parentElement?.parentElement?.parentElement;
    expect(testCard).not.toBeNull();
    expect(within(testCard as HTMLElement).getByText('(201)Continue')).toBeInTheDocument();
    expect(within(testCard as HTMLElement).queryByText('No instructions in this block')).not.toBeInTheDocument();
  });
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('BLOCK_ORDER');
});

test('legacy producer Memory Apply cannot emit ROW_MOVE or remove its source row', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const props = {
    homeBankingIdInitial: 2,
    data: [row],
    initialBlocks: [
      {
        blockId: 10,
        blockOrderNumber: 1,
        blockName: 'Main',
        blockActive: true,
        blockWait: 0,
      },
      {
        blockId: 135,
        blockOrderNumber: 2,
        blockName: 'TEST',
        blockActive: true,
        blockWait: 0,
      },
    ],
    socketPort: 52101,
    sessionId: 'botJobTasks',
    botJobIdInitial: 5,
    botJobNameInitial: 'Copy regression',
    onSessionOpen: jest.fn(),
  };
  const view = render(<GridItem {...props} />);

  mockMessages = [JSON.stringify({
    sessionId: 'botJobTasks',
    homeBankingId: 2,
    operationId: 'memoryList.command',
    body: JSON.stringify({
      botJobId: 5,
      command: 'APPLY',
      payload: {
        targetBlockId: 135,
        sourceItemKeys: ['BOT_JOB:101'],
      },
    }),
  })];
  view.rerender(<GridItem {...props} />);

  await waitFor(() => {
    expect(warning).toHaveBeenCalledWith(
      'Ignored legacy producer-side Memory Apply; the backend owns this transaction.',
    );
  });
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('ROW_MOVE');
  expect(screen.getByText('(101)Continue')).toBeInTheDocument();
  warning.mockRestore();
});
