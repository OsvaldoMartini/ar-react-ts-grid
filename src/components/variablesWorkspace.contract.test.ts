import {
  normalizeVariablesWorkspaceSnapshot,
  parseVariablesWorkspaceMessage,
} from './variablesWorkspace.contract';

const canonicalSnapshot = {
  ok: true,
  message: 'Variable relationships loaded.',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 8,
  graphRevision: 'a'.repeat(64),
  botJob: {
    id: 5,
    name: 'Saldo Banca Stato',
    homeBankingId: 2,
    organizationName: 'Banca Stato',
  },
  summary: {
    variableCount: 2,
    producerCount: 1,
    consumerCount: 1,
    literalAssignmentCount: 1,
    warningCount: 0,
    unusedCount: 1,
  },
  blocks: [{ id: 7, order: 1, name: 'Login', active: true }],
  variables: [
    {
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
      commands: [
        {
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
        },
        {
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
        },
        {
          instructionId: 192,
          instructionName: 'Literal Amount',
          action: 'SET',
          role: 'LITERAL_ASSIGNMENT',
          operation: 'Amount:12',
          parentId: 189,
          parentBlockId: 7,
          blockId: 7,
          blockName: 'Login',
          blockOrder: 1,
          instructionOrder: 5,
          active: true,
          blockActive: true,
        },
      ],
      diagnostics: [],
    },
    {
      id: 13,
      name: 'Unused',
      type: '$String',
      configuredValue: '',
      localFormat: '',
      delimiter: '',
      unused: true,
      owner: {
        instructionId: 200,
        instructionName: 'Unused Field',
        action: 'Web Field',
        blockId: 7,
        blockName: 'Login',
        blockOrder: 1,
        instructionOrder: 6,
        active: true,
        blockActive: true,
      },
      commands: [],
      diagnostics: [],
    },
  ],
  edges: [],
  diagnostics: [],
};

test('normalizes canonical producer, consumer, literal, and unused relationships', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot(canonicalSnapshot);
  const connected = snapshot?.variables.find(variable => variable.id === 12);
  const unused = snapshot?.variables.find(variable => variable.id === 13);

  expect(snapshot).not.toBeNull();
  expect(snapshot?.botJob.name).toBe('Saldo Banca Stato');
  expect(connected?.producers.map(command => command.id)).toEqual([190]);
  expect(connected?.consumers.map(command => command.id)).toEqual([191]);
  expect(connected?.literalAssignments.map(command => command.id)).toEqual([192]);
  expect(connected?.health).toBe('HEALTHY');
  expect(unused?.health).toBe('UNUSED');
  expect(snapshot?.summary.unusedCount).toBe(1);
  expect(snapshot?.edges).toEqual([]);
});

test('parses the WebSocket envelope without accepting a failed snapshot', () => {
  const envelope = parseVariablesWorkspaceMessage(JSON.stringify({
    operationId: 'variablesWorkspace.snapshot',
    body: JSON.stringify(canonicalSnapshot),
  }));

  expect(envelope.operationId).toBe('variablesWorkspace.snapshot');
  expect(normalizeVariablesWorkspaceSnapshot(envelope.body)?.graphRevision).toHaveLength(64);
  expect(normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    ok: false,
  })).toBeNull();
});

test('rejects incomplete or partially malformed canonical graphs', () => {
  expect(normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    bindingEpoch: '',
  })).toBeNull();

  expect(normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    graphRevision: 'not-a-revision',
  })).toBeNull();

  expect(normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    variables: canonicalSnapshot.variables.map((variable, index) => index === 0
      ? {
          ...variable,
          commands: variable.commands.map((command, commandIndex) => commandIndex === 0
            ? { ...command, role: 'UNKNOWN_ROLE' }
            : command),
        }
      : variable),
  })).toBeNull();

  expect(normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    summary: {
      ...canonicalSnapshot.summary,
      variableCount: 99,
    },
  })).toBeNull();
});
