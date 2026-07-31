import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import VariablesPage from './VariablesPage';

const mockSend = jest.fn();
const mockWebSocket = {
  readyState: 1,
  send: mockSend,
};
let mockMessages: string[] = [];
let mockSocketError: string | null = null;

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: mockWebSocket,
    connected: true,
    reconnectAttempts: 0,
    messages: mockMessages,
    error: mockSocketError,
  }),
}));

jest.mock('./DetachedPageShell', () => {
  return function MockDetachedPageShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="detached-page-shell">{children}</div>;
  };
});

jest.mock('./PagesOpenButton', () => {
  return function MockPagesOpenButton() {
    return <button type="button">Pages (1)</button>;
  };
});

const response = (operationId: string, body: Record<string, unknown>): string =>
  JSON.stringify({
    operationId,
    body: JSON.stringify(body),
  });

const snapshot = {
  ok: true,
  message: 'Variable relationships loaded.',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 4,
  graphRevision: 'a'.repeat(64),
  botJob: {
    id: 5,
    name: 'Saldo Banca Stato',
    homeBankingId: 2,
    organizationName: 'Banca Stato',
  },
  summary: {
    variableCount: 1,
    producerCount: 1,
    consumerCount: 1,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [{ id: 7, order: 1, name: 'Login', active: true }],
  variables: [{
    id: 12,
    name: 'VAR-189-Amount',
    type: '$String',
    configuredValue: '$EMPTY',
    localFormat: '',
    delimiter: '|',
    unused: false,
    owner: {
      instructionId: 189,
      instructionName: 'Amount',
      action: 'Web Field',
      blockId: 7,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 2,
      active: true,
      blockActive: true,
    },
    commands: [{
      instructionId: 190,
      instructionName: 'Read Amount',
      action: 'GET',
      role: 'PRODUCER',
      operation: '',
      parentId: 189,
      parentBlockId: 7,
      blockId: 7,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 3,
      active: true,
      blockActive: true,
    }, {
      instructionId: 191,
      instructionName: 'Compare Amount',
      action: 'CK',
      role: 'CONSUMER',
      operation: 'Amount:$Value:=:12',
      parentId: 189,
      parentBlockId: 7,
      blockId: 7,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 4,
      active: true,
      blockActive: true,
    }],
    diagnostics: [],
  }],
  edges: [{
    id: 'instruction:189:variable:12',
    from: 'instruction:189',
    to: 'variable:12',
    type: 'DECLARES',
  }, {
    id: 'command:190:writes:12',
    from: 'instruction:190',
    to: 'variable:12',
    type: 'WRITES',
  }, {
    id: 'variable:12:reads:191',
    from: 'variable:12',
    to: 'instruction:191',
    type: 'READS',
  }],
  diagnostics: [],
  runtimeMemory: {
    revision: 3,
    variables: [{
      variableId: 12,
      name: 'VAR-189-Amount',
      type: '$String',
      state: 'VALUE',
      value: '125.00',
      voidReason: null,
      entryRevision: 2,
      source: 'EXECUTION',
    }],
  },
};

const mutableRelationshipSnapshot = (graphRevision = 'd'.repeat(64)) => ({
  ...snapshot,
  graphRevision,
  variables: snapshot.variables.map(variable => ({
    ...variable,
    commands: variable.commands.map(command => ({
      ...command,
      variableId: variable.id,
    })),
  })),
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: null,
    reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
    graphVersion: 9,
    graphRevision,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    },
    layoutRows: [{
      instructionId: 189,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 2,
    }, {
      instructionId: 190,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 3,
    }, {
      instructionId: 191,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 4,
    }],
    instructionFacts: [{
      instructionId: 189,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 2,
      action: 'Web Field',
      relationKind: 'ELEMENT_TARGET',
      parentId: null,
      parentBlockId: null,
      variableId: null,
    }, {
      instructionId: 190,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 3,
      action: 'GET',
      relationKind: 'ELEMENT_TARGET',
      parentId: 189,
      parentBlockId: 7,
      variableId: 12,
    }, {
      instructionId: 191,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 4,
      action: 'CK',
      relationKind: 'ELEMENT_TARGET',
      parentId: 189,
      parentBlockId: 7,
      variableId: 12,
    }],
    variableFacts: [{
      variableId: 12,
      ownerInstructionId: 189,
    }],
  },
});

beforeEach(() => {
  mockSend.mockClear();
  mockMessages = [];
  mockSocketError = null;
});

test('loads the active Bot Job variable graph and keeps it visible after a refresh error', async () => {
  const onClose = jest.fn();
  const view = render(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
      onClose={onClose}
    />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...snapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
      onClose={onClose}
    />,
  );

  await waitFor(() => expect(screen.getAllByText('VAR-189-Amount').length).toBeGreaterThan(0));
  expect(screen.getByTestId('detached-page-shell')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Variables' })).toBeInTheDocument();
  expect(screen.getAllByText('Read Amount').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Compare Amount').length).toBeGreaterThan(0);
  expect(screen.getAllByText('EMPTY').length).toBeGreaterThan(0);
  expect(screen.getAllByText('125.00').length).toBeGreaterThan(0);
  expect(screen.getByText(/Runtime memory is independent from the definition/)).toBeInTheDocument();
  expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('variablesWorkspace.bootstrap'));

  mockMessages = [
    ...mockMessages,
    response('variablesWorkspace.snapshot', {
      ...snapshot,
      message: 'Variables workspace synchronized.',
      bindingEpoch: 'binding-2',
      graphRevision: 'b'.repeat(64),
      variables: snapshot.variables.map(variable => ({
        ...variable,
        configuredValue: '$NEW',
      })),
    }),
  ];
  view.rerender(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
      onClose={onClose}
    />,
  );
  await waitFor(() => expect(screen.getAllByText('$NEW').length).toBeGreaterThan(0));

  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  const refreshRequest = JSON.parse(JSON.parse(mockSend.mock.calls[1][0]).body);
  expect(refreshRequest.bindingEpoch).toBe('binding-2');
  mockMessages = [
    ...mockMessages,
    response('variablesWorkspace.errorResponse', {
      ok: false,
      requestId: 'stale-request',
      message: 'A stale error must be ignored.',
    }),
    response('variablesWorkspace.errorResponse', {
      ok: false,
      requestId: refreshRequest.requestId,
      message: 'The variable graph changed while it was loading.',
    }),
  ];
  view.rerender(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
      onClose={onClose}
    />,
  );

  expect(screen.getByText('The variable graph changed while it was loading.')).toBeInTheDocument();
  expect(screen.queryByText('A stale error must be ignored.')).not.toBeInTheDocument();
  expect(screen.getAllByText('VAR-189-Amount').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('shows a retry action when the first correlated bootstrap fails', async () => {
  const view = render(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
    />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.errorResponse', {
    ok: false,
    requestId: bootstrapRequest.requestId,
    message: 'No Bot Job is bound to the Variables workspace.',
  })];
  view.rerender(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
    />,
  );

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
    'No Bot Job is bound to the Variables workspace.',
  ));
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(mockSend).toHaveBeenCalledTimes(2);
  expect(JSON.parse(mockSend.mock.calls[1][0]).type).toBe('variablesWorkspace.bootstrap');
  view.unmount();
});

test('accepts a lower workspace epoch when the authoritative Bot Job changes', async () => {
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...snapshot,
    workspaceEpoch: 9,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(screen.getByText(/Saldo Banca Stato/))
    .toBeInTheDocument());

  mockMessages = [
    ...mockMessages,
    response('variablesWorkspace.snapshot', {
      ...snapshot,
      bindingEpoch: 'binding-other',
      workspaceEpoch: 1,
      graphRevision: 'c'.repeat(64),
      botJob: {
        ...snapshot.botJob,
        id: 32,
        name: 'Lower Epoch Bot',
      },
    }),
  ];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  await waitFor(() => expect(screen.getByText(/Lower Epoch Bot/))
    .toBeInTheDocument());
  view.unmount();
});

test('opens a partial read-only review without mutation capability', async () => {
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...snapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  const reviewButton = await screen.findByRole('button', {
    name: 'REVIEW ALL CONNECTIONS',
  });
  expect(reviewButton).toBeEnabled();
  const sentBeforeReview = mockSend.mock.calls.length;
  fireEvent.click(reviewButton);
  expect(screen.getByText('Relationship graph unavailable'))
    .toBeInTheDocument();
  expect(screen.getAllByText('Read Amount').length).toBeGreaterThan(0);
  expect(mockSend).toHaveBeenCalledTimes(sentBeforeReview);
  view.unmount();
});

test('retains runtime memory when a GET becomes inactive', async () => {
  const view = render(
    <VariablesPage
      socketPort={59772}
      sessionId={'variablesManager'}
    />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  const nullableProducerSnapshot = {
    ...snapshot,
    requestId: bootstrapRequest.requestId,
    variables: snapshot.variables.map(variable => ({
      ...variable,
      configuredValue: '',
      commands: variable.commands.map(command => command.action === 'GET'
        ? { ...command, active: null }
        : command),
    })),
  };
  mockMessages = [response(
    'variablesWorkspace.bootstrapResponse',
    nullableProducerSnapshot,
  )];
  view.rerender(
    <VariablesPage
      socketPort={59772}
      sessionId={'variablesManager'}
    />,
  );

  await waitFor(() =>
    expect(screen.getAllByText('125.00').length).toBeGreaterThan(0));
  expect(screen.getAllByText('Not configured').length).toBeGreaterThan(0);
  expect(screen.getByText('GET missing')).toBeInTheDocument();
  expect(screen.getByText(
    'Active readers exist, but no active GET command produces a value.',
  )).toBeInTheDocument();
  expect(screen.queryByText('VOID - no active GET producer')).not.toBeInTheDocument();
  expect(screen.queryByText(/Variable-dependent work is bypassed/)).not.toBeInTheDocument();
  view.unmount();
});

test('unlocks retry when a Variables request times out', () => {
  jest.useFakeTimers();
  const view = render(
    <VariablesPage
      socketPort={59772}
      sessionId="variablesManager"
    />,
  );
  expect(mockSend).toHaveBeenCalledTimes(1);

  act(() => {
    jest.advanceTimersByTime(10_000);
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'The Variables request did not return.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(mockSend).toHaveBeenCalledTimes(2);
  view.unmount();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('opens the two-step Block transfer flow and sends the exact React copy selection', async () => {
  const graphRevision = 'c'.repeat(64);
  const mutableSnapshot = {
    ...snapshot,
    graphRevision,
    variables: snapshot.variables.map(variable => ({
      ...variable,
      commands: variable.commands.map(command => ({
        ...command,
        variableId: variable.id,
      })),
    })),
    blocks: [
      ...snapshot.blocks,
      { id: 8, order: 2, name: 'Payment', active: true },
    ],
    mutationCapability: {
      enabled: true,
      contractVersion: 3,
      profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
      crossBlockProfile: null,
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      graphVersion: 9,
      graphRevision,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      layoutRows: [{
        instructionId: 189,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 2,
      }, {
        instructionId: 190,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 3,
      }, {
        instructionId: 191,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 4,
      }],
      instructionFacts: [{
        instructionId: 189,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 2,
        action: 'Web Field',
        relationKind: 'ELEMENT_TARGET',
        parentId: null,
        parentBlockId: null,
        variableId: null,
      }, {
        instructionId: 190,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 3,
        action: 'GET',
        relationKind: 'ELEMENT_TARGET',
        parentId: 189,
        parentBlockId: 7,
        variableId: 12,
      }, {
        instructionId: 191,
        blockId: 7,
        blockOrderNumber: 1,
        instructionOrderNumber: 4,
        action: 'CK',
        relationKind: 'ELEMENT_TARGET',
        parentId: 189,
        parentBlockId: 7,
        variableId: 12,
      }],
      variableFacts: [{
        variableId: 12,
        ownerInstructionId: 189,
      }],
    },
  };
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...mutableSnapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  await waitFor(() =>
    expect(screen.getByTestId('variables-transfer-block-8')).toBeInTheDocument());
  const source = screen.getAllByText('Compare Amount')
    .map(element => element.closest('article'))
    .find((element): element is HTMLElement =>
      element?.getAttribute('draggable') === 'true');
  expect(source).toBeDefined();
  const data = new Map<string, string>();
  const dataTransfer = {
    types: ['application/x-ar-variables-instruction'],
    effectAllowed: 'move',
    dropEffect: 'move',
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? '',
  };
  fireEvent.dragStart(source as HTMLElement, { dataTransfer });
  fireEvent.drop(screen.getByTestId('variables-transfer-block-8'), {
    dataTransfer,
  });

  expect(screen.getByRole('heading', {
    name: 'Move or Copy Instruction?',
  })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'NEW COPY' }));
  expect(screen.getByRole('heading', {
    name: 'Choose Copy Scope',
  })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {
    name: 'ONLY INSTRUCTION',
  }));

  const sent = JSON.parse(mockSend.mock.calls.at(-1)?.[0] as string);
  const body = JSON.parse(sent.body);
  expect(sent.type).toBe('variablesWorkspace.instructions.copy');
  expect(body).toMatchObject({
    contractVersion: 1,
    bindingEpoch: 'binding-1',
    workspaceEpoch: 4,
    baseGraphVersion: 9,
    graphRevision,
    targetBlockId: 8,
    selectedInstructionId: 191,
    scope: 'ONLY_INSTRUCTION',
    sourceInstructionIds: [191],
  });
  view.unmount();
});

test('releases only visible direct connections in one atomic v3 request', async () => {
  const mutableSnapshot = mutableRelationshipSnapshot();
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...mutableSnapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  await waitFor(() => expect(screen.getByRole('button', {
    name: 'RELEASE ALL CONNECTIONS',
  })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', {
    name: 'RELEASE ALL CONNECTIONS',
  }));

  expect(screen.getByRole('heading', { name: 'Release Connections' }))
    .toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {
    name: 'Release 5 Connections',
  }));

  const sent = JSON.parse(mockSend.mock.calls.at(-1)?.[0] as string);
  const body = JSON.parse(sent.body);
  expect(sent.type).toBe('variablesWorkspace.graphMutationV3');
  expect(body).toMatchObject({
    mutationKind: 'RELATIONSHIP_UPDATE',
    baseGraphVersion: 9,
    graphRevision: mutableSnapshot.graphRevision,
    draggedInstructionId: null,
    variableOwnerPatches: [{
      variableId: 12,
      operation: 'CLEAR',
      expected: { value: 189 },
      replacement: { value: null },
    }],
  });
  expect(body.instructionRelationPatches).toEqual([
    expect.objectContaining({
      instructionId: 190,
      operation: 'CLEAR',
      expected: { parentId: 189, parentBlockId: 7 },
      replacement: { parentId: null, parentBlockId: null },
    }),
    expect.objectContaining({
      instructionId: 191,
      operation: 'CLEAR',
      expected: { parentId: 189, parentBlockId: 7 },
      replacement: { parentId: null, parentBlockId: null },
    }),
  ]);
  expect(body.variableBindingPatches).toEqual([
    expect.objectContaining({
      instructionId: 190,
      operation: 'CLEAR',
      expected: { value: 12 },
      replacement: { value: null },
    }),
    expect.objectContaining({
      instructionId: 191,
      operation: 'CLEAR',
      expected: { value: 12 },
      replacement: { value: null },
    }),
  ]);
  view.unmount();
});

test('resolves a unique visible Web Element connection through the new modal', async () => {
  const base = mutableRelationshipSnapshot('e'.repeat(64));
  const reconnectSnapshot = {
    ...base,
    variables: base.variables.map(variable => ({
      ...variable,
      commands: variable.commands.map(command =>
        command.instructionId === 190
          ? { ...command, parentId: null, parentBlockId: null }
          : command),
    })),
    mutationCapability: {
      ...base.mutationCapability,
      instructionFacts: base.mutationCapability.instructionFacts.map(fact =>
        fact.instructionId === 190
          ? { ...fact, parentId: null, parentBlockId: null }
          : fact),
    },
  };
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...reconnectSnapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  await waitFor(() => expect(screen.getByRole('button', {
    name: 'RESOLVE ALL CONNECTIONS',
  })).toBeEnabled());
  expect(screen.getByRole('button', {
    name: 'REVIEW ALL CONNECTIONS',
  })).toBeEnabled();
  const disconnectedCommandRow = screen.getAllByText('Read Amount')
    .map(element => element.closest('article'))
    .find((element): element is HTMLElement =>
      element?.getAttribute('data-instruction-id') === '190');
  expect(disconnectedCommandRow).toBeDefined();
  expect(disconnectedCommandRow).toHaveAttribute('draggable', 'true');
  fireEvent.click(screen.getByRole('button', {
    name: 'RESOLVE ALL CONNECTIONS',
  }));

  expect(screen.getByRole('heading', { name: 'Resolve Connections' }))
    .toBeInTheDocument();
  expect(disconnectedCommandRow).toHaveAttribute('draggable', 'true');
  fireEvent.click(screen.getByRole('button', {
    name: 'Resolve 1 Connection',
  }));

  const sent = JSON.parse(mockSend.mock.calls.at(-1)?.[0] as string);
  const body = JSON.parse(sent.body);
  expect(sent.type).toBe('variablesWorkspace.graphMutationV3');
  expect(body.instructionRelationPatches).toEqual([
    expect.objectContaining({
      instructionId: 190,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: { parentId: null, parentBlockId: null },
      replacement: { parentId: 189, parentBlockId: 7 },
    }),
  ]);
  expect(body.variableBindingPatches).toEqual([]);
  expect(body.variableOwnerPatches).toEqual([]);
  view.unmount();
});

test('reviews a healthy complete execution flow without submitting a mutation', async () => {
  const healthySnapshot = mutableRelationshipSnapshot('8'.repeat(64));
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(JSON.parse(mockSend.mock.calls[0][0]).body);
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...healthySnapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  const reviewButton = await screen.findByRole('button', {
    name: 'REVIEW ALL CONNECTIONS',
  });
  expect(screen.getByRole('button', {
    name: 'RESOLVE ALL CONNECTIONS',
  })).toBeEnabled();
  const sentBeforeReview = mockSend.mock.calls.length;
  fireEvent.click(reviewButton);

  const dialog = screen.getByRole('dialog', {
    name: 'Review All Connections',
  });
  expect(within(dialog).getByText('Bot Job execution flow'))
    .toBeInTheDocument();
  expect(within(dialog).getAllByText('Amount').length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText('Read Amount').length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText('Compare Amount').length).toBeGreaterThan(0);
  expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
  expect(mockSend).toHaveBeenCalledTimes(sentBeforeReview);

  mockMessages = [
    ...mockMessages,
    response('variablesWorkspace.snapshot', {
      ...healthySnapshot,
      runtimeMemory: {
        revision: healthySnapshot.runtimeMemory.revision + 1,
        variables: healthySnapshot.runtimeMemory.variables.map(entry => ({
          ...entry,
          value: '999.00',
          entryRevision: entry.entryRevision + 1,
        })),
      },
    }),
  ];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(within(screen.getByRole('dialog', {
    name: 'Review All Connections',
  })).getByText('Runtime VALUE: 999.00')).toBeInTheDocument());

  fireEvent.click(within(screen.getByRole('dialog', {
    name: 'Review All Connections',
  })).getByRole('button', { name: 'Close' }));
  expect(mockSend).toHaveBeenCalledTimes(sentBeforeReview);
  view.unmount();
});

test('repairs Web Element, GET, and variable ownership in one atomic v3 request', async () => {
  const base = mutableRelationshipSnapshot('f'.repeat(64));
  const disconnectedFlowSnapshot = {
    ...base,
    variables: base.variables.map(variable => ({
      ...variable,
      owner: null,
      commands: [{
        instructionId: 189,
        instructionName: 'Amount',
        action: 'Web Field',
        role: 'INVALID_LINK',
        operation: '',
        parentId: null,
        parentBlockId: null,
        variableId: 12,
        blockId: 7,
        blockName: 'Login',
        blockOrder: 1,
        instructionOrder: 2,
        active: true,
        blockActive: true,
      }, ...variable.commands.map(command =>
        command.instructionId === 190
          ? {
              ...command,
              parentId: null,
              parentBlockId: null,
            }
          : command)],
    })),
    mutationCapability: {
      ...base.mutationCapability,
      instructionFacts: base.mutationCapability.instructionFacts.map(fact =>
        fact.instructionId === 189
          ? {
              ...fact,
              variableId: 12,
            }
          : fact.instructionId === 190
          ? {
              ...fact,
              parentId: null,
              parentBlockId: null,
            }
          : fact),
      variableFacts: [{
        variableId: 12,
        ownerInstructionId: null,
      }],
    },
  };
  const view = render(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );
  await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));
  const bootstrapRequest = JSON.parse(
    JSON.parse(mockSend.mock.calls[0][0]).body,
  );
  mockMessages = [response('variablesWorkspace.bootstrapResponse', {
    ...disconnectedFlowSnapshot,
    requestId: bootstrapRequest.requestId,
  })];
  view.rerender(
    <VariablesPage socketPort={59772} sessionId="variablesManager" />,
  );

  const ownerMissing = await screen.findByRole('button', {
    name: /Owner missing.*Connect Web Element/i,
  });
  fireEvent.click(ownerMissing);
  expect(screen.getByRole('heading', { name: 'Repair Variable Flow' }))
    .toBeInTheDocument();
  fireEvent.click(screen.getByRole('combobox', {
    name: 'Compatible Web Element',
  }));
  fireEvent.click(screen.getByRole('option', {
    name: /Amount.*ID 189/i,
  }));
  fireEvent.click(screen.getByRole('combobox', {
    name: 'Compatible GET producer',
  }));
  fireEvent.click(screen.getByRole('option', {
    name: /Read Amount.*ID 190/i,
  }));
  fireEvent.click(screen.getByRole('button', {
    name: 'Connect Variable Flow',
  }));

  const sent = JSON.parse(mockSend.mock.calls.at(-1)?.[0] as string);
  const body = JSON.parse(sent.body);
  expect(sent.type).toBe('variablesWorkspace.graphMutationV3');
  expect(body.instructionRelationPatches).toEqual([{
    instructionId: 190,
    relationKind: 'ELEMENT_TARGET',
    operation: 'SET',
    expected: { parentId: null, parentBlockId: null },
    replacement: { parentId: 189, parentBlockId: 7 },
  }]);
  expect(body.variableBindingPatches).toEqual([]);
  expect(body.variableOwnerPatches).toEqual([{
    variableId: 12,
    operation: 'SET',
    expected: { value: null },
    replacement: { value: 189 },
  }]);
  view.unmount();
});
