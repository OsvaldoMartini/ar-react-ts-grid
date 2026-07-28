import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GridItemComp from './GridItemComp';
import type { ComponentsInstructionsDTO } from './instructionsMockData';

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
  useBotJobDetailsController: () => ({
    state: null,
    status: 'Components loaded',
    statusTone: 'success',
    sendAction: jest.fn(),
  }),
}));

jest.mock('./bot-job-details/BotJobDetailsChrome', () => () => null);
jest.mock('./bot-job-details/ComponentWorkspaceHeader', () => () => null);

const first: ComponentsInstructionsDTO = {
  homeBankingId: 2,
  tagName: 'button',
  botJobId: 5,
  botJobName: 'Target Bot Job',
  id: 101,
  instructionOrderNumber: 1,
  name: 'Continue',
  description: '',
  blockId: 44,
  blockOrderNumber: 1,
  blockName: 'Reusable Login',
  blockActive: true,
  blockWait: 0,
  actions: 'CLICK',
  instructionActive: true,
};

const second: ComponentsInstructionsDTO = {
  ...first,
  id: 102,
  instructionOrderNumber: 2,
  name: 'Confirm',
};

const capabilityResponseForLastRequest = (
  blockCapabilities: unknown[] = [],
  allowedBlockIds: number[] = [44],
  connectedMemoryGroup = false,
) => {
  const request = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'instructionEditor.memoryCapabilities');
  if (!request) throw new Error('Capability request was not sent');
  const requestedBody = JSON.parse(request.body);
  return JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'instructionEditor.memoryCapabilitiesResponse',
    body: JSON.stringify({
      ok: true,
      requestId: requestedBody.requestId,
      targetSessionId: requestedBody.targetSessionId,
      homeBankingId: requestedBody.homeBankingId,
      botJobId: requestedBody.botJobId,
      graphRevision: 'component-revision-1',
      capabilities: [101, 102].map(instructionId => ({
        instructionId,
        canAddToMemory: true,
        canMove: true,
        canDelete: true,
        allowedBlockIds,
        memoryGroupKey: connectedMemoryGroup
          ? 'I:101,102|B:'
          : `I:${instructionId}|B:`,
        memoryGroupRows: (connectedMemoryGroup ? [101, 102] : [instructionId])
          .map(groupInstructionId => ({
            id: groupInstructionId,
            order: groupInstructionId === 101 ? 1 : 2,
            name: groupInstructionId === 101 ? 'Continue' : 'Confirm',
            action: 'CLICK',
            parentId: null,
            blockId: 44,
          })),
        memoryGroupBlocks: [],
      })),
      blockCapabilities,
    }),
  });
};

const authorizeGrid = async (
  view: ReturnType<typeof render>,
  renderProps = props,
  blockCapabilities: unknown[] = [],
  allowedBlockIds: number[] = [44],
  connectedMemoryGroup = false,
) => {
  await waitFor(() => expect(
    mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .some(message => message.type === 'instructionEditor.memoryCapabilities'),
  ).toBe(true));
  mockMessages = [
    capabilityResponseForLastRequest(
      blockCapabilities,
      allowedBlockIds,
      connectedMemoryGroup,
    ),
  ];
  view.rerender(<GridItemComp {...renderProps} />);
  await waitFor(() => expect(screen.getByLabelText('Move instruction 1')).toBeEnabled());
};

const props = {
  homeBankingIdInitial: 2,
  dataComp: [first, second],
  socketPort: 52101,
  sessionId: 'componentTasks',
  botJobIdInitial: 5,
  botJobNameInitial: 'Target Bot Job',
  onSessionOpen: jest.fn(),
};

const latestMemorySnapshot = () => {
  const opens = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .filter(message => message.type === 'memoryList.open');
  const body = JSON.parse(opens[opens.length - 1].body);
  return body.snapshot;
};

beforeEach(() => {
  mockMessages = [];
  mockSend.mockReset();
});

test('row plus stages a typed COMPONENT instruction and exposes no component target blocks', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view);
  expect(screen.queryByAltText('Stage whole component block in memory')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByTitle('Add step to memory list')[0]);

  await waitFor(() => {
    expect(latestMemorySnapshot()).toEqual(expect.objectContaining({
      sourceKind: 'COMPONENT',
      blocks: [],
      items: [expect.objectContaining({
        key: 'COMPONENT:INSTRUCTION:2:44:101',
        sourceItemKey: 'INSTRUCTION:2:44:101',
        payload: {
          kind: 'INSTRUCTION',
          componentInstructionId: 101,
          componentBlockId: 44,
          sourceRevision: 'component-revision-1',
        },
      })],
    }));
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('COMPONENT_INJECT');
});

test('row plus confirms and stages the complete connected COMPONENT group', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view, props, [], [44], true);

  fireEvent.click(screen.getAllByTitle('Add step to memory list')[0]);

  expect(screen.getByText('Add 2 connected instructions to Memory List?')).toBeInTheDocument();
  expect(screen.getByText(/#1 Continue/)).toBeInTheDocument();
  expect(screen.getByText(/#2 Confirm/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await waitFor(() => expect(latestMemorySnapshot().items).toHaveLength(2));
  expect(latestMemorySnapshot().items.map((item: { sourceItemKey: string }) =>
    item.sourceItemKey)).toEqual([
    'INSTRUCTION:2:44:101',
    'INSTRUCTION:2:44:102',
  ]);
});

test('connected row confirmation refuses a graph that refreshed while the modal was open', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view, props, [], [44], true);

  fireEvent.click(screen.getAllByTitle('Add step to memory list')[0]);
  expect(screen.getByText('Add 2 connected instructions to Memory List?')).toBeInTheDocument();

  mockMessages = [
    mockMessages[0],
    JSON.stringify({
      sessionId: 'componentTasks',
      homeBankingId: 2,
      operationId: 'componentsUpdate',
      body: JSON.stringify({
        instructions: [
          { ...first, name: 'Continue refreshed' },
          second,
        ],
        blocks: [{
          blockId: 44,
          blockOrderNumber: 1,
          blockName: 'Reusable Login',
          blockActive: true,
          blockWait: 0,
        }],
        homeBankingId: 2,
        botJobId: 5,
        botJobName: 'Target Bot Job',
      }),
    }),
  ];
  view.rerender(<GridItemComp {...props} />);
  await screen.findByText('(101)Continue refreshed');

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  expect(await screen.findByText('Memory List Selection Refused')).toBeInTheDocument();
  expect(screen.getByText(
    'The connected instruction graph changed while confirmation was open.',
  )).toBeInTheDocument();
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('memoryList.open');
});

test('connected block confirmation refuses a graph that refreshed while the modal was open', async () => {
  const blockCapability = {
    blockId: 44,
    canDelete: false,
    reason: '',
    instructionCount: 2,
    deleteRows: [],
    canAddToMemory: true,
    memoryGroupKey: 'I:101,102,201|B:55',
    memoryGroupRows: [
      { id: 101, order: 1, name: 'Continue', action: 'CLICK', parentId: null, blockId: 44 },
      { id: 102, order: 2, name: 'Confirm', action: 'CLICK', parentId: null, blockId: 44 },
      { id: 201, order: 1, name: 'Target', action: 'CLICK', parentId: null, blockId: 55 },
    ],
    memoryGroupBlocks: [{
      blockId: 55,
      blockOrderNumber: 2,
      blockName: 'Target Block',
    }],
  };
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view, props, [blockCapability]);

  fireEvent.click(screen.getByTitle('Add eligible steps in this block to memory list'));
  expect(screen.getByText(
    'Add the complete connected Component Block to Memory List?',
  )).toBeInTheDocument();

  mockMessages = [
    mockMessages[0],
    JSON.stringify({
      sessionId: 'componentTasks',
      homeBankingId: 2,
      operationId: 'componentsUpdate',
      body: JSON.stringify({
        instructions: [
          { ...first, name: 'Continue refreshed' },
          second,
        ],
        blocks: [{
          blockId: 44,
          blockOrderNumber: 1,
          blockName: 'Reusable Login',
          blockActive: true,
          blockWait: 0,
        }],
        homeBankingId: 2,
        botJobId: 5,
        botJobName: 'Target Bot Job',
      }),
    }),
  ];
  view.rerender(<GridItemComp {...props} />);
  await screen.findByText('(101)Continue refreshed');

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  expect(await screen.findByText('Memory List Selection Refused')).toBeInTheDocument();
  expect(screen.getByText(
    'The connected Component Block changed while confirmation was open.',
  )).toBeInTheDocument();
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('memoryList.open');
});

test('component row drag commits with COMPONENT_ROW_MOVE after authoritative preview', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view);
  const capabilityResponse = mockMessages[0];
  const source = screen.getByLabelText('Move instruction 1').closest('[draggable]');
  const destination = screen.getByLabelText('Move instruction 2').closest('[draggable]');
  fireEvent.dragStart(source as Element);
  fireEvent.drop(destination as Element);

  let previewRequestId = '';
  await waitFor(() => {
    const preview = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'instructionGraph.previewMove');
    expect(preview).toBeDefined();
    const previewBody = JSON.parse(preview.body);
    expect(previewBody.targetSessionId).toBe('componentTasks');
    previewRequestId = previewBody.requestId;
  });

  mockMessages = [
    capabilityResponse,
    JSON.stringify({
      sessionId: 'componentTasks',
      operationId: 'instructionGraph.previewMoveResponse',
      body: JSON.stringify({
        ok: true,
        requestId: previewRequestId,
        groupRows: [{ id: 101, order: 1, name: 'Continue', action: 'CLICK' }],
      }),
    }),
  ];
  view.rerender(<GridItemComp {...props} />);

  await waitFor(() => {
    const move = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'COMPONENT_ROW_MOVE');
    expect(move).toEqual(expect.objectContaining({
      sessionId: 'componentTasks',
      graphRevision: 'component-revision-1',
    }));
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('ROW_MOVE');
});

test('component row drag can target an authoritative empty component block', async () => {
  const emptyBlockProps = {
    ...props,
    blocksComp: [
      {
        blockId: 44,
        blockOrderNumber: 1,
        blockName: 'Reusable Login',
        blockActive: true,
        blockWait: 0,
      },
      {
        blockId: 55,
        blockOrderNumber: 2,
        blockName: 'Empty destination',
        blockActive: true,
        blockWait: 0,
      },
    ],
  };
  const view = render(<GridItemComp {...emptyBlockProps} />);
  await authorizeGrid(view, emptyBlockProps, [], [44, 55]);
  const capabilityResponse = mockMessages[0];
  const source = screen.getByLabelText('Move instruction 1').closest('[draggable]');
  const destination = screen
    .getByText('No instructions in this block')
    .closest('[data-droppable-id="55"]');

  fireEvent.dragStart(source as Element);
  fireEvent.drop(destination as Element);

  let previewRequestId = '';
  await waitFor(() => {
    const preview = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'instructionGraph.previewMove');
    const previewBody = JSON.parse(preview.body);
    expect(previewBody.destinationBlockId).toBe(55);
    expect(previewBody.destinationIndex).toBe(0);
    previewRequestId = previewBody.requestId;
  });

  mockMessages = [
    capabilityResponse,
    JSON.stringify({
      sessionId: 'componentTasks',
      operationId: 'instructionGraph.previewMoveResponse',
      body: JSON.stringify({
        ok: true,
        requestId: previewRequestId,
        groupRows: [{ id: 101, order: 1, name: 'Continue', action: 'CLICK' }],
      }),
    }),
  ];
  view.rerender(<GridItemComp {...emptyBlockProps} />);

  await waitFor(() => {
    const move = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'COMPONENT_ROW_MOVE');
    expect(move.updatedRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        instructionId: 101,
        blockId: 55,
        instructionOrderNumber: 1,
      }),
    ]));
  });
});

test('stale capability responses cannot enable component mutations', async () => {
  const view = render(<GridItemComp {...props} />);
  await waitFor(() => expect(
    mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .some(message => message.type === 'instructionEditor.memoryCapabilities'),
  ).toBe(true));
  const validResponse = JSON.parse(capabilityResponseForLastRequest());
  const staleBody = JSON.parse(validResponse.body);
  staleBody.requestId = 'stale-request';
  validResponse.body = JSON.stringify(staleBody);
  mockMessages = [JSON.stringify(validResponse)];
  view.rerender(<GridItemComp {...props} />);

  fireEvent.click(screen.getAllByTitle('Add step to memory list')[0]);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('memoryList.open');
});

test('component rollback stays unavailable until an authoritative revision arrives', () => {
  render(<GridItemComp {...props} />);

  expect(screen.queryByAltText('Rollback block')).not.toBeInTheDocument();
});

test('an empty first component block can roll all instructions back into itself', async () => {
  const emptyBlockProps = {
    ...props,
    dataComp: [
      { ...first, blockOrderNumber: 2 },
      { ...second, blockOrderNumber: 2 },
    ],
    blocksComp: [
      {
        blockId: 33,
        blockOrderNumber: 1,
        blockName: 'Empty destination',
        blockActive: true,
        blockWait: 0,
      },
      {
        blockId: 44,
        blockOrderNumber: 2,
        blockName: 'Reusable Login',
        blockActive: true,
        blockWait: 0,
      },
    ],
  };
  const view = render(<GridItemComp {...emptyBlockProps} />);
  await authorizeGrid(view, emptyBlockProps);

  fireEvent.click(screen.getByAltText('Rollback block'));

  const rollback = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'BLOCK_ROLLBACK');
  expect(rollback).toEqual(expect.objectContaining({
    sessionId: 'componentTasks',
    blockId: 33,
    botJobId: 5,
    graphRevision: 'component-revision-1',
  }));
  expect(rollback.updatedRows).toEqual([
    expect.objectContaining({ instructionId: 101, blockId: 33, instructionOrderNumber: 1 }),
    expect.objectContaining({ instructionId: 102, blockId: 33, instructionOrderNumber: 2 }),
  ]);
  expect(rollback.updatedBlocks).toEqual([
    expect.objectContaining({
      blockId: 33,
      homeBankId: 2,
      botJobId: 5,
      blockOrderNumber: 1,
      blockName: 'Empty destination',
      blockActive: true,
      blockWait: 0,
    }),
    expect.objectContaining({
      blockId: 44,
      homeBankId: 2,
      botJobId: 5,
      blockOrderNumber: 2,
      blockName: 'Reusable Login',
      blockActive: true,
      blockWait: 0,
    }),
  ]);
});

test('empty component block delete uses catalog metadata and component routing', async () => {
  const emptyBlockProps = {
    ...props,
    dataComp: [
      { ...first, blockOrderNumber: 2 },
      { ...second, blockOrderNumber: 2 },
    ],
    blocksComp: [
      {
        blockId: 33,
        blockOrderNumber: 1,
        blockName: 'Empty destination',
        blockActive: true,
        blockWait: 0,
      },
      {
        blockId: 44,
        blockOrderNumber: 2,
        blockName: 'Reusable Login',
        blockActive: true,
        blockWait: 0,
      },
    ],
  };
  const view = render(<GridItemComp {...emptyBlockProps} />);
  await authorizeGrid(view, emptyBlockProps, [{
    blockId: 33,
    canDelete: true,
    reason: 'Delete empty component block',
    instructionCount: 0,
    deleteRows: [],
  }]);

  fireEvent.click(screen.getByTitle('Delete empty component block'));
  fireEvent.click(screen.getByText('Confirm'));

  const deletion = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'DELETE_BLOCK');
  expect(deletion).toEqual(expect.objectContaining({
    sessionId: 'componentTasks',
    blockId: 33,
    botJobId: 5,
    graphRevision: 'component-revision-1',
    updatedBlocks: [{
      blockId: 44,
      botJobId: 5,
      blockOrderNumber: 1,
      blockName: 'Reusable Login',
    }],
  }));
});

test('authoritative refresh failure disables mutations and tells the user to refresh', async () => {
  const view = render(<GridItemComp {...props} />);
  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    operationId: 'instructionEditor.resyncRequired',
    body: JSON.stringify({
      ok: false,
      resyncRequired: true,
      error: 'The change was saved, but Components could not be refreshed.',
      action: 'Refresh Components before making another change.',
    }),
  })];
  view.rerender(<GridItemComp {...props} />);

  expect(await screen.findByText('Components Refresh Required')).toBeInTheDocument();
  expect(screen.getByText(
    'The change was saved, but Components could not be refreshed.',
  )).toBeInTheDocument();
  expect(screen.getByLabelText('Move instruction 1')).toBeDisabled();
});

test('context-free WebSocket sentinels cannot poison the Components organization', async () => {
  const view = render(<GridItemComp {...props} />);
  await waitFor(() => expect(
    mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .some(message => message.type === 'instructionEditor.memoryCapabilities'),
  ).toBe(true));

  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: -1,
    operationId: 'license.statusChanged',
    body: JSON.stringify({ active: true }),
  })];
  view.rerender(<GridItemComp {...props} />);

  await new Promise(resolve => setTimeout(resolve, 0));
  const capabilityRequests = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .filter(message => message.type === 'instructionEditor.memoryCapabilities');
  expect(capabilityRequests.length).toBeGreaterThan(0);
  capabilityRequests.forEach(request => {
    expect(request.homeBankingId).toBe(2);
    expect(JSON.parse(request.body).homeBankingId).toBe(2);
  });
  expect(screen.getByText(/\(101\)Continue/)).toBeInTheDocument();
  expect(screen.getByText(/\(102\)Confirm/)).toBeInTheDocument();
});

test('a correlated capability refusal disables actions without hiding the last valid rows', async () => {
  const view = render(<GridItemComp {...props} />);
  await waitFor(() => expect(
    mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .some(message => message.type === 'instructionEditor.memoryCapabilities'),
  ).toBe(true));
  const request = [...mockSend.mock.calls]
    .reverse()
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'instructionEditor.memoryCapabilities');
  const requestedBody = JSON.parse(request.body);
  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'instructionEditor.memoryCapabilitiesResponse',
    body: JSON.stringify({
      ok: false,
      requestId: requestedBody.requestId,
      targetSessionId: requestedBody.targetSessionId,
      homeBankingId: requestedBody.homeBankingId,
      botJobId: requestedBody.botJobId,
      error: 'The Components organization is required.',
    }),
  })];
  view.rerender(<GridItemComp {...props} />);

  expect(await screen.findByText('Grid Actions Unavailable')).toBeInTheDocument();
  expect(screen.getByText('The Components organization is required.')).toBeInTheDocument();
  expect(screen.getByText(/\(101\)Continue/)).toBeInTheDocument();
  expect(screen.getByText(/\(102\)Confirm/)).toBeInTheDocument();
  expect(screen.getByLabelText('Move instruction 1')).toBeDisabled();
  expect(screen.queryByText(/No components were created yet/)).not.toBeInTheDocument();
});

test('capabilities wait for an authoritative positive Components organization', async () => {
  const loadingProps = { ...props, homeBankingIdInitial: 0 };
  const view = render(<GridItemComp {...loadingProps} />);

  await new Promise(resolve => setTimeout(resolve, 0));
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionEditor.memoryCapabilities');

  view.rerender(<GridItemComp {...props} />);
  await waitFor(() => {
    const capability = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'instructionEditor.memoryCapabilities');
    expect(capability).toEqual(expect.objectContaining({ homeBankingId: 2 }));
  });
});

test('authoritative Components bootstrap hydrates an initially empty detached workspace without resetting it', async () => {
  const loadingProps = {
    ...props,
    homeBankingIdInitial: 0,
    dataComp: [] as ComponentsInstructionsDTO[],
    blocksComp: [],
  };
  const view = render(<GridItemComp {...loadingProps} />);
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionEditor.memoryCapabilities');

  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'componentsUpdate',
    body: JSON.stringify({
      instructions: [first, second],
      blocks: [{
        blockId: 44,
        blockOrderNumber: 1,
        blockName: 'Reusable Login',
        blockActive: true,
        blockWait: 0,
      }],
      homeBankingId: 2,
      botJobId: 5,
      botJobName: 'Target Bot Job',
    }),
  })];
  view.rerender(<GridItemComp {...loadingProps} />);

  expect(await screen.findByText(/\(101\)Continue/)).toBeInTheDocument();
  expect(screen.getByText(/\(102\)Confirm/)).toBeInTheDocument();
  await waitFor(() => {
    const capability = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'instructionEditor.memoryCapabilities');
    expect(capability).toEqual(expect.objectContaining({ homeBankingId: 2 }));
    expect(JSON.parse(capability.body).homeBankingId).toBe(2);
  });

  view.rerender(<GridItemComp
    {...loadingProps}
    homeBankingIdInitial={2}
    botJobIdInitial={5}
  />);
  expect(screen.getByText(/\(101\)Continue/)).toBeInTheDocument();
  expect(screen.getByText(/\(102\)Confirm/)).toBeInTheDocument();
});

test('failed or malformed Components updates preserve the last valid rows', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view);
  mockMessages = [...mockMessages, JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'componentsUpdate',
    body: JSON.stringify({
      ok: false,
      error: 'The refreshed component snapshot is unavailable.',
      instructions: [],
      blocks: [],
      homeBankingId: 2,
      botJobId: 5,
    }),
  })];
  view.rerender(<GridItemComp {...props} />);

  expect(await screen.findByText('Grid Refresh Ignored')).toBeInTheDocument();
  expect(screen.getByText('The refreshed component snapshot is unavailable.')).toBeInTheDocument();
  expect(screen.getByText(/\(101\)Continue/)).toBeInTheDocument();
  expect(screen.getByText(/\(102\)Confirm/)).toBeInTheDocument();
  expect(screen.getByLabelText('Move instruction 1')).toBeDisabled();
  expect(screen.queryByText(/No components were created yet/)).not.toBeInTheDocument();
});

test('an explicit authoritative empty Components snapshot may clear the grid', async () => {
  const view = render(<GridItemComp {...props} />);
  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'componentsUpdate',
    body: JSON.stringify({
      instructions: [],
      blocks: [],
      homeBankingId: 2,
      botJobId: 5,
      botJobName: 'Target Bot Job',
    }),
  })];
  view.rerender(<GridItemComp {...props} />);

  expect(await screen.findByText(/No components were created yet/)).toBeInTheDocument();
  expect(screen.queryByText(/\(101\)Continue/)).not.toBeInTheDocument();
});
