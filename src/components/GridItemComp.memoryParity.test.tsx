import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GridItemComp from './GridItemComp';
import type { ComponentsInstructionsDTO } from './instructionsMockData';
import { computeInstructionGraphRevision } from './bot-job-details/grid/domain/instructionGraphRevision';

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

const defaultGraphRevision = computeInstructionGraphRevision([first, second], []);

const connectedSecond: ComponentsInstructionsDTO = {
  ...second,
  actions: 'GET',
  parentId: first.id,
};

const connectedProps = {
  homeBankingIdInitial: 2,
  dataComp: [first, connectedSecond],
  socketPort: 52101,
  sessionId: 'componentTasks',
  botJobIdInitial: 5,
  botJobNameInitial: 'Target Bot Job',
  onSessionOpen: jest.fn(),
};

const capabilityResponseForLastRequest = (
  blockCapabilities: unknown[] = [],
  allowedBlockIds: number[] = [44],
  instructionRows: ComponentsInstructionsDTO[] = [first, second],
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
      ...(requestedBody.workspaceEpoch > 0
        ? { workspaceEpoch: requestedBody.workspaceEpoch }
        : {}),
      graphRevision: computeInstructionGraphRevision(instructionRows, []),
      capabilities: instructionRows.map(instruction => ({
        instructionId: instruction.id,
        canMove: true,
        allowedBlockIds,
      })),
      blockCapabilities,
      variableLinks: [],
    }),
  });
};

const authorizeGrid = async (
  view: ReturnType<typeof render>,
  renderProps = props,
  blockCapabilities: unknown[] = [],
  allowedBlockIds: number[] = [44],
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
      renderProps.dataComp,
    ),
  ];
  view.rerender(<GridItemComp {...renderProps} />);
  await waitFor(() => expect(screen.getAllByLabelText('Move instruction 1')[0]).toBeEnabled());
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
  const epochProps = { ...props, workspaceEpochInitial: 7 };
  const view = render(<GridItemComp {...epochProps} />);
  await authorizeGrid(view, epochProps);
  expect(screen.queryByAltText('Stage whole component block in memory')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByTitle('Add step to memory list')[0]);

  await waitFor(() => {
    expect(latestMemorySnapshot()).toEqual(expect.objectContaining({
      workspaceEpoch: 7,
      sourceKind: 'COMPONENT',
      blocks: [],
      items: [expect.objectContaining({
        key: 'COMPONENT:INSTRUCTION:2:44:101',
        sourceItemKey: 'INSTRUCTION:2:44:101',
        payload: {
          kind: 'INSTRUCTION',
          componentInstructionId: 101,
          componentBlockId: 44,
          sourceRevision: defaultGraphRevision,
        },
      })],
    }));
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('COMPONENT_INJECT');
});

test('component plus keeps the server revision but stale presentation cannot move rows', async () => {
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
  const authoritativeRevision = 'a'.repeat(64);
  mockMessages = [JSON.stringify({
    sessionId: 'componentTasks',
    homeBankingId: 2,
    operationId: 'instructionEditor.memoryCapabilitiesResponse',
    body: JSON.stringify({
      ok: true,
      requestId: requestedBody.requestId,
      targetSessionId: requestedBody.targetSessionId,
      homeBankingId: requestedBody.homeBankingId,
      botJobId: requestedBody.botJobId,
      graphRevision: authoritativeRevision,
      capabilities: props.dataComp.map(instruction => ({
        instructionId: instruction.id,
        canMove: true,
        allowedBlockIds: [44],
      })),
      blockCapabilities: [],
      variableLinks: [],
    }),
  })];
  view.rerender(<GridItemComp {...props} />);

  const addButton = (await screen.findAllByTitle('Add step to memory list'))[0];
  expect(addButton).toBeEnabled();
  expect(screen.getByLabelText('Move instruction 1')).toBeDisabled();
  fireEvent.click(addButton);

  await waitFor(() => expect(latestMemorySnapshot().items[0].payload).toEqual({
    kind: 'INSTRUCTION',
    componentInstructionId: 101,
    componentBlockId: 44,
    sourceRevision: authoritativeRevision,
  }));
});

test('block-header plus stages the complete COMPONENT block as one typed item', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view);

  fireEvent.click(
    screen.getByTitle('Add this complete connected block to Memory List'),
  );

  await waitFor(() => expect(latestMemorySnapshot().items).toEqual([
    expect.objectContaining({
      key: 'COMPONENT:BLOCK:2:44',
      sourceItemKey: 'BLOCK:2:44',
      payload: {
        kind: 'BLOCK',
        componentBlockId: 44,
        sourceRevision: defaultGraphRevision,
      },
    }),
  ]));
});

test('row plus confirms and stages the complete connected COMPONENT group', async () => {
  const view = render(<GridItemComp {...connectedProps} />);
  await authorizeGrid(view, connectedProps, [], [44]);

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
  const view = render(<GridItemComp {...connectedProps} />);
  await authorizeGrid(view, connectedProps, [], [44]);

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
          connectedSecond,
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
  view.rerender(<GridItemComp {...connectedProps} />);
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
  const gotoInstruction: ComponentsInstructionsDTO = {
    ...first,
    actions: 'GOTO',
    parentId: 201,
    parentBlockId: 55,
  };
  const targetInstruction: ComponentsInstructionsDTO = {
    ...first,
    id: 201,
    blockId: 55,
    blockOrderNumber: 2,
    blockName: 'Target Block',
    instructionOrderNumber: 1,
    name: 'Target',
  };
  const gotoProps = {
    ...props,
    dataComp: [gotoInstruction, second, targetInstruction],
  };
  const view = render(<GridItemComp {...gotoProps} />);
  await authorizeGrid(view, gotoProps);

  fireEvent.click(
    screen.getAllByTitle('Add this complete connected block to Memory List')[0],
  );
  expect(screen.getByText(
    'Add the complete connected Component Block to Memory List?',
  )).toBeInTheDocument();
  const capabilityRequestsBeforeRefresh = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .filter(message => message.type === 'instructionEditor.memoryCapabilities')
    .length;

  mockMessages = [
    mockMessages[0],
    JSON.stringify({
      sessionId: 'componentTasks',
      homeBankingId: 2,
      operationId: 'componentsUpdate',
      body: JSON.stringify({
        instructions: [
          { ...gotoInstruction, name: 'Continue refreshed' },
          second,
          targetInstruction,
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
  view.rerender(<GridItemComp {...gotoProps} />);
  await waitFor(() => expect(
    mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .filter(message => message.type === 'instructionEditor.memoryCapabilities')
      .length,
  ).toBeGreaterThan(capabilityRequestsBeforeRefresh));

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  expect(await screen.findByText('Memory List Selection Refused')).toBeInTheDocument();
  expect(screen.getByText(
    'The connected Component Block changed while confirmation was open.',
  )).toBeInTheDocument();
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('memoryList.open');
});

test('delete modal and v2 request contain the same exact conditional boundaries', async () => {
  const conditionalRows: ComponentsInstructionsDTO[] = [
    { ...first, id: 201, instructionOrderNumber: 1, name: 'IF root', actions: 'IF', parentId: 201 },
    { ...first, id: 202, instructionOrderNumber: 2, name: 'IF body', actions: 'C', parentId: 201 },
    { ...first, id: 203, instructionOrderNumber: 3, name: 'ELSE boundary', actions: 'ELSE', parentId: 201 },
    { ...first, id: 204, instructionOrderNumber: 4, name: 'ELSE body', actions: 'H', parentId: 203 },
    { ...first, id: 205, instructionOrderNumber: 5, name: 'ENDIF boundary', actions: 'ENDIF', parentId: 201 },
  ];
  const conditionalProps = {
    ...props,
    dataComp: conditionalRows,
  };
  const view = render(<GridItemComp {...conditionalProps} />);
  await authorizeGrid(view, conditionalProps);
  const capabilityRequest = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'instructionEditor.memoryCapabilities');
  expect(JSON.parse(capabilityRequest.body).deleteContractVersion).toBe(2);

  fireEvent.click(screen.getAllByTitle('Delete instruction')[2]);

  expect(screen.getByText('Delete Conditional Boundaries')).toBeInTheDocument();
  const modalRowIds = Array.from(
    document.querySelectorAll('.complex-message-row td:first-child'),
  ).map(cell => Number(cell.textContent?.match(/\((\d+)\)/)?.[1]));
  expect(modalRowIds).toEqual([201, 203, 205]);

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  const deletion = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'DELETE_INSTRUCTION');
  expect(deletion).toEqual(expect.objectContaining({
    deleteContractVersion: 2,
    sessionId: 'componentTasks',
    graphRevision: computeInstructionGraphRevision(conditionalRows, []),
    selectedInstructionId: 203,
    instructionId: 203,
    deleteInstructionIds: [201, 203, 205],
    deleteParentRepairs: [
      { instructionId: 202, parentId: null },
      { instructionId: 204, parentId: null },
    ],
  }));
  expect(deletion.deleteInstructionIds).toEqual(modalRowIds);
});

test('delete modal summarizes more than five exact rows without truncating the v2 request', async () => {
  const rootId = 301;
  const linkedRows: ComponentsInstructionsDTO[] = Array.from(
    { length: 6 },
    (_, index) => ({
      ...first,
      id: rootId + index,
      instructionOrderNumber: index + 1,
      name: index === 0 ? 'Selected root' : `Linked child ${index}`,
      actions: index === 0 ? 'CLICK' : 'GET',
      parentId: index === 0 ? undefined : rootId,
    }),
  );
  const linkedProps = {
    ...props,
    dataComp: linkedRows,
  };
  const view = render(<GridItemComp {...linkedProps} />);
  await authorizeGrid(view, linkedProps);

  fireEvent.click(screen.getAllByTitle('Delete instruction')[0]);

  expect(screen.getByText(
    'All 6 explicitly linked instructions/steps selected by the exact React plan will be deleted.',
  )).toBeInTheDocument();
  expect(document.querySelectorAll('.complex-message-row')).toHaveLength(0);
  expect(mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload).type))
    .not.toContain('DELETE_INSTRUCTION');

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  const deletion = mockSend.mock.calls
    .map(([payload]) => JSON.parse(payload))
    .find(message => message.type === 'DELETE_INSTRUCTION');
  expect(deletion).toEqual(expect.objectContaining({
    deleteContractVersion: 2,
    selectedInstructionId: rootId,
    deleteInstructionIds: linkedRows.map(row => row.id),
    deleteParentRepairs: [],
  }));
});

test('component row drag commits one React-planned COMPONENT_ROW_MOVE', async () => {
  const view = render(<GridItemComp {...props} />);
  await authorizeGrid(view);
  const source = screen.getByLabelText('Move instruction 1').closest('[draggable]');
  const destination = screen.getByLabelText('Move instruction 2').closest('[draggable]');
  fireEvent.dragStart(source as Element);
  fireEvent.drop(destination as Element);

  await waitFor(() => {
    const moves = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .filter(message => message.type === 'COMPONENT_ROW_MOVE');
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move).toEqual(expect.objectContaining({
      sessionId: 'componentTasks',
      graphRevision: defaultGraphRevision,
      rowMoveLayoutVersion: 2,
    }));
    expect(move.updatedRows).toEqual([
      expect.objectContaining({
        instructionId: 102,
        instructionOrderNumber: 1,
        parentId: null,
        parentBlockId: null,
      }),
      expect.objectContaining({
        instructionId: 101,
        instructionOrderNumber: 2,
        parentId: null,
        parentBlockId: null,
      }),
    ]);
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('ROW_MOVE');
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionGraph.previewMove');
});

test('component drag moves an authoritative connected family after the target row', async () => {
  const third: ComponentsInstructionsDTO = {
    ...first,
    id: 103,
    instructionOrderNumber: 3,
    name: 'Middle',
  };
  const fourth: ComponentsInstructionsDTO = {
    ...first,
    id: 104,
    instructionOrderNumber: 4,
    name: 'Last',
  };
  const connectedProps = {
    ...props,
    dataComp: [first, connectedSecond, third, fourth],
  };
  const view = render(<GridItemComp {...connectedProps} />);
  await authorizeGrid(view, connectedProps, [], [44]);

  fireEvent.dragStart(
    screen.getByLabelText('Move instruction 1').closest('[draggable]') as Element,
  );
  fireEvent.drop(
    screen.getByLabelText('Move instruction 3').closest('[draggable]') as Element,
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

  await waitFor(() => {
    const moves = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .filter(message => message.type === 'COMPONENT_ROW_MOVE');
    expect(moves).toHaveLength(1);
    expect(moves[0].updatedRows).toEqual([
      expect.objectContaining({ instructionId: 103, instructionOrderNumber: 1 }),
      expect.objectContaining({ instructionId: 101, instructionOrderNumber: 2 }),
      expect.objectContaining({ instructionId: 102, instructionOrderNumber: 3 }),
      expect.objectContaining({ instructionId: 104, instructionOrderNumber: 4 }),
    ]);
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionGraph.previewMove');
});

test('component drag on another member of its connected family is a no-op', async () => {
  const view = render(<GridItemComp {...connectedProps} />);
  await authorizeGrid(view, connectedProps, [], [44]);
  mockSend.mockClear();

  fireEvent.dragStart(
    screen.getByLabelText('Move instruction 1').closest('[draggable]') as Element,
  );
  fireEvent.drop(
    screen.getByLabelText('Move instruction 2').closest('[draggable]') as Element,
  );

  await new Promise(resolve => setTimeout(resolve, 0));
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionGraph.previewMove');
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('COMPONENT_ROW_MOVE');
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
  const source = screen.getByLabelText('Move instruction 1').closest('[draggable]');
  const destination = screen
    .getByText('No instructions in this block')
    .closest('[data-droppable-id="55"]');

  fireEvent.dragStart(source as Element);
  fireEvent.drop(destination as Element);

  await waitFor(() => {
    const move = mockSend.mock.calls
      .map(([payload]) => JSON.parse(payload))
      .find(message => message.type === 'COMPONENT_ROW_MOVE');
    expect(move.updatedRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        instructionId: 101,
        blockId: 55,
        blockOrderNumber: 2,
        instructionOrderNumber: 1,
      }),
    ]));
  });
  expect(mockSend.mock.calls.map(([payload]) => JSON.parse(payload).type))
    .not.toContain('instructionGraph.previewMove');
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
    graphRevision: defaultGraphRevision,
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
    graphRevision: defaultGraphRevision,
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
