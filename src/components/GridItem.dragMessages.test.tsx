import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const capabilityResponse = (sessionId: string) => JSON.stringify({
  sessionId,
  homeBankingId: 2,
  operationId: 'instructionEditor.memoryCapabilitiesResponse',
  body: JSON.stringify({
    ok: true,
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

const unrelatedResponse = (sessionId: string) => JSON.stringify({
  sessionId,
  operationId: 'rowStatus',
  body: JSON.stringify({ instructionId: 0, color: 'green' }),
});

const expectQueuedCapabilityEnablesDrag = async (sessionId: string) => {
  await waitFor(() => expect(screen.getByLabelText('Move instruction 1')).toBeEnabled());

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

  mockMessages = [capabilityResponse(props.sessionId), unrelatedResponse(props.sessionId)];
  view.rerender(<GridItemComp {...props} />);

  await expectQueuedCapabilityEnablesDrag('componentTasks');
});
