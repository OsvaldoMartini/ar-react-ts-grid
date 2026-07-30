import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
