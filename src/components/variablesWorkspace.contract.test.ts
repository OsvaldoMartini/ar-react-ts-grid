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
        variableId: 12,
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
          variableId: 12,
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
          variableId: 12,
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
          variableId: 12,
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
        variableId: 13,
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

const canonicalMutationCapability = {
  enabled: true,
  contractVersion: 3,
  profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
  graphVersion: 7,
  graphRevision: 'a'.repeat(64),
  ownerAssertion: {
    workspaceKind: 'BOT_JOB',
    homeBankingId: 2,
    botJobId: 5,
  },
  layoutRows: [
    { instructionId: 189, blockId: 7, blockOrderNumber: 1, instructionOrderNumber: 2 },
    { instructionId: 190, blockId: 7, blockOrderNumber: 1, instructionOrderNumber: 3 },
    { instructionId: 191, blockId: 7, blockOrderNumber: 1, instructionOrderNumber: 4 },
    { instructionId: 192, blockId: 7, blockOrderNumber: 1, instructionOrderNumber: 5 },
    { instructionId: 200, blockId: 7, blockOrderNumber: 1, instructionOrderNumber: 6 },
  ],
  instructionFacts: [
    {
      instructionId: 189,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 2,
      action: 'Web Field',
      parentId: null,
      parentBlockId: null,
      variableId: 12,
    },
    {
      instructionId: 190,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 3,
      action: 'GET',
      parentId: 189,
      parentBlockId: 7,
      variableId: 12,
    },
    {
      instructionId: 191,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 4,
      action: 'CK',
      parentId: 189,
      parentBlockId: 7,
      variableId: 12,
    },
    {
      instructionId: 192,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 5,
      action: 'SET',
      parentId: 189,
      parentBlockId: 7,
      variableId: 12,
    },
    {
      instructionId: 200,
      blockId: 7,
      blockOrderNumber: 1,
      instructionOrderNumber: 6,
      action: 'Web Field',
      parentId: null,
      parentBlockId: null,
      variableId: 13,
    },
  ],
  variableFacts: [
    { variableId: 12, ownerInstructionId: 189 },
    { variableId: 13, ownerInstructionId: 200 },
  ],
};

test('normalizes a coordinate-consistent Variables mutation capability', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: canonicalMutationCapability,
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.mutationCapability).toMatchObject({
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    graphVersion: 7,
    graphRevision: 'a'.repeat(64),
  });
  expect(snapshot?.mutationCapability?.layoutRows).toHaveLength(5);
  expect(snapshot?.mutationCapability?.variableFacts).toEqual([
    { variableId: 12, ownerInstructionId: 189 },
    { variableId: 13, ownerInstructionId: 200 },
  ]);
  expect(snapshot?.mutationCapability?.crossBlockProfile).toBeNull();
});

test('keeps React-authored mutation authority when relationship projections need repair', () => {
  const presentationVariables = canonicalSnapshot.variables.map(variable => {
    if (variable.id !== 12) return variable;
    return {
      ...variable,
      owner: null,
      commands: variable.commands.map(command => command.instructionId === 190
        ? {
            ...command,
            parentId: null,
            parentBlockId: null,
            variableId: 13,
          }
        : command),
    };
  });
  const presentationCommands = canonicalSnapshot.variables.flatMap(variable => [
    variable.owner,
    ...variable.commands,
  ]).map(command => command.instructionId === 190
    ? {
        ...command,
        parentId: null,
        parentBlockId: null,
        variableId: 13,
      }
    : command);

  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    variables: presentationVariables,
    commands: presentationCommands,
    mutationCapability: {
      ...canonicalMutationCapability,
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
    },
  });

  expect(snapshot?.mutationCapability?.reactAuthoredProfile).toBe(
    'VARIABLES_REACT_AUTHORED_V1',
  );
  expect(snapshot?.mutationCapability?.instructionFacts.find(
    fact => fact.instructionId === 190,
  )).toMatchObject({
    parentId: 189,
    parentBlockId: 7,
    variableId: 12,
  });
  expect(snapshot?.mutationCapability?.variableFacts).toContainEqual({
    variableId: 12,
    ownerInstructionId: 189,
  });
});

test('still rejects malformed authoritative layout for a React-authored capability', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      layoutRows: canonicalMutationCapability.layoutRows.map(row =>
        row.instructionId === 191
          ? { ...row, instructionOrderNumber: 3 }
          : row),
    },
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.mutationCapability).toBeNull();
});

const ownerlessUnusedSnapshot = (
  ownerInstructionId: number | null,
) => ({
  ...canonicalSnapshot,
  variables: canonicalSnapshot.variables.map(variable =>
    variable.id === 13
      ? { ...variable, owner: null }
      : variable),
  mutationCapability: {
    ...canonicalMutationCapability,
    layoutRows: canonicalMutationCapability.layoutRows.filter(
      row => row.instructionId !== 200,
    ),
    instructionFacts: canonicalMutationCapability.instructionFacts.filter(
      fact => fact.instructionId !== 200,
    ),
    variableFacts: canonicalMutationCapability.variableFacts.map(fact =>
      fact.variableId === 13
        ? { ...fact, ownerInstructionId }
        : fact),
  },
});

test('preserves exact null and dangling variable owner authority', () => {
  const withoutOwner = normalizeVariablesWorkspaceSnapshot(
    ownerlessUnusedSnapshot(null),
  );
  const danglingOwner = normalizeVariablesWorkspaceSnapshot(
    ownerlessUnusedSnapshot(999),
  );

  expect(withoutOwner?.mutationCapability?.variableFacts).toContainEqual({
    variableId: 13,
    ownerInstructionId: null,
  });
  expect(danglingOwner?.mutationCapability?.variableFacts).toContainEqual({
    variableId: 13,
    ownerInstructionId: 999,
  });
  expect(danglingOwner?.variables.find(variable => variable.id === 13)?.owner)
    .toBeNull();
});

test('fails closed for missing, malformed, duplicate, or parity-breaking variable facts', () => {
  const {
    variableFacts: _omittedVariableFacts,
    ...capabilityWithoutVariableFacts
  } = canonicalMutationCapability;
  const invalidCapabilities = [
    capabilityWithoutVariableFacts,
    {
      ...canonicalMutationCapability,
      variableFacts: [
        ...canonicalMutationCapability.variableFacts,
        canonicalMutationCapability.variableFacts[0],
      ],
    },
    {
      ...canonicalMutationCapability,
      variableFacts: canonicalMutationCapability.variableFacts.slice(0, 1),
    },
    {
      ...canonicalMutationCapability,
      variableFacts: canonicalMutationCapability.variableFacts.map(fact =>
        fact.variableId === 12
          ? { ...fact, ownerInstructionId: 0 }
          : fact),
    },
    {
      ...canonicalMutationCapability,
      variableFacts: canonicalMutationCapability.variableFacts.map((fact) => {
        if (fact.variableId !== 12) return fact;
        const {
          ownerInstructionId: _omittedOwnerInstructionId,
          ...withoutOwnerInstructionId
        } = fact;
        return withoutOwnerInstructionId;
      }),
    },
    {
      ...canonicalMutationCapability,
      variableFacts: canonicalMutationCapability.variableFacts.map(fact =>
        fact.variableId === 12
          ? { ...fact, ownerInstructionId: null }
          : fact),
    },
  ];

  invalidCapabilities.forEach((mutationCapability) => {
    const snapshot = normalizeVariablesWorkspaceSnapshot({
      ...canonicalSnapshot,
      mutationCapability,
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot?.mutationCapability).toBeNull();
  });
});

test('accepts only the exact separately advertised Variables cross-block profile', () => {
  const enabled = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
    },
  });
  const unknown = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      crossBlockProfile: 'VARIABLES_CROSS_BLOCK_FUTURE',
    },
  });

  expect(enabled?.mutationCapability?.crossBlockProfile).toBe(
    'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
  );
  expect(unknown?.mutationCapability?.crossBlockProfile).toBeNull();
});

test('keeps content and mutation revisions independent', () => {
  const mutationRevision = 'b'.repeat(64);
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      graphRevision: mutationRevision,
    },
  });

  expect(snapshot?.graphRevision).toBe('a'.repeat(64));
  expect(snapshot?.mutationCapability?.graphRevision).toBe(mutationRevision);
});

test('fails closed when the server advertises an unexpected mutation profile', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      profile: 'GENERIC_GRAPH_WRITER',
    },
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.mutationCapability).toBeNull();
});

test('derives structural relation kinds from raw persisted actions in React', () => {
  const structuralRows = [
    { instructionId: 201, instructionOrderNumber: 7, action: 'refresh_loop' },
    { instructionId: 202, instructionOrderNumber: 8, action: 'elseif' },
    { instructionId: 203, instructionOrderNumber: 9, action: 'excel goto' },
  ].map(row => ({
    ...row,
    blockId: 7,
    blockOrderNumber: 1,
  }));
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    commands: [
      ...canonicalSnapshot.variables.flatMap(variable => [
        variable.owner,
        ...variable.commands,
      ]),
      ...structuralRows.map(row => ({
        instructionId: row.instructionId,
        instructionName: row.action,
        action: row.action,
        operation: '',
        blockId: row.blockId,
        blockName: 'Login',
        blockOrder: row.blockOrderNumber,
        instructionOrder: row.instructionOrderNumber,
        parentId: 189,
        parentBlockId: 7,
        variableId: null,
        active: true,
        blockActive: true,
      })),
    ],
    mutationCapability: {
      ...canonicalMutationCapability,
      layoutRows: [
        ...canonicalMutationCapability.layoutRows,
        ...structuralRows.map(({
          action: _action,
          ...layoutRow
        }) => layoutRow),
      ],
      instructionFacts: [
        ...canonicalMutationCapability.instructionFacts,
        ...structuralRows.map(row => ({
          ...row,
          // A server-supplied classifier is deliberately ignored.
          relationKind: 'ELEMENT_TARGET',
          parentId: 189,
          parentBlockId: 7,
          variableId: null,
        })),
      ],
    },
  });

  expect(
    snapshot?.mutationCapability?.instructionFacts.slice(-3).map(fact => [
      fact.action,
      fact.relationKind,
    ]),
  ).toEqual([
    ['refresh_loop', 'LOOP_ANCHOR'],
    ['elseif', 'CONDITIONAL_ROOT'],
    ['excel goto', 'BLOCK_TARGET'],
  ]);
});

test('fails closed when mutation facts omit raw persisted actions', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      instructionFacts: canonicalMutationCapability.instructionFacts.map(
        ({ action: _action, ...fact }) => ({
          ...fact,
          relationKind: 'ELEMENT_TARGET',
        }),
      ),
    },
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.mutationCapability).toBeNull();
});

test('fails closed when a raw action disagrees with the visible variable command', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      instructionFacts: canonicalMutationCapability.instructionFacts.map(
        fact => fact.instructionId === 190
          ? { ...fact, action: 'SET' }
          : fact,
      ),
    },
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.mutationCapability).toBeNull();
});

test('keeps the Variables snapshot visible but disables mutation when fact coordinates disagree', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot({
    ...canonicalSnapshot,
    mutationCapability: {
      ...canonicalMutationCapability,
      instructionFacts: canonicalMutationCapability.instructionFacts.map(
        fact => fact.instructionId === 191
          ? { ...fact, instructionOrderNumber: 99 }
          : fact,
      ),
    },
  });

  expect(snapshot).not.toBeNull();
  expect(snapshot?.variables).toHaveLength(2);
  expect(snapshot?.mutationCapability).toBeNull();
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

const rawFactsSnapshot = {
  ok: true,
  message: 'Variable relationships loaded.',
  bindingEpoch: 'binding-1',
  workspaceEpoch: 8,
  graphRevision: 'b'.repeat(64),
  botJob: {
    id: 5,
    name: 'Saldo Banca Stato',
    homeBankingId: 2,
    organizationName: 'Banca Stato',
  },
  graphKind: 'RAW_FACTS_V1',
  botJobId: 5,
  blocks: [{ id: 7, order: 1, name: 'Login', active: true }],
  rawVariables: [
    {
      id: 12,
      name: 'VAR-189-Amount',
      type: '$String',
      configuredValue: '$EMPTY',
      localFormat: '',
      delimiter: '|',
      ownerInstructionId: 189,
      resolvedOwnerId: 189,
      ownerName: 'Amount',
      ownerAction: 'Web Field',
      ownerBlockId: 7,
      resolvedOwnerBlockId: 7,
      ownerBlockName: 'Login',
      ownerBlockOrder: 1,
      ownerInstructionOrder: 2,
      ownerActive: true,
      ownerBlockActive: true,
    },
    {
      id: 13,
      name: 'Unused',
      type: '$String',
      configuredValue: '',
      localFormat: '',
      delimiter: '',
      ownerInstructionId: 200,
      resolvedOwnerId: 200,
      ownerName: 'Unused Field',
      ownerAction: 'Web Field',
      ownerBlockId: 7,
      resolvedOwnerBlockId: 7,
      ownerBlockName: 'Login',
      ownerBlockOrder: 1,
      ownerInstructionOrder: 6,
      ownerActive: true,
      ownerBlockActive: true,
    },
  ],
  rawCommands: [
    {
      instructionId: 190,
      instructionName: 'Read Amount',
      action: 'GET',
      operation: '',
      variableId: 12,
      parentId: 189,
      parentBlockId: 7,
      blockId: 7,
      resolvedBlockId: 7,
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
      operation: 'Amount:$Value:=:12',
      variableId: 12,
      parentId: 189,
      parentBlockId: 7,
      blockId: 7,
      resolvedBlockId: 7,
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
      operation: 'Amount:12',
      variableId: 12,
      parentId: 189,
      parentBlockId: 7,
      blockId: 7,
      resolvedBlockId: 7,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 5,
      active: true,
      blockActive: true,
    },
  ],
};

test('builds the full graph in React from RAW_FACTS_V1 Java facts', () => {
  const snapshot = normalizeVariablesWorkspaceSnapshot(rawFactsSnapshot);
  const connected = snapshot?.variables.find(variable => variable.id === 12);
  const unused = snapshot?.variables.find(variable => variable.id === 13);

  expect(snapshot).not.toBeNull();
  expect(snapshot?.botJob.name).toBe('Saldo Banca Stato');
  expect(connected?.producers.map(command => command.id)).toEqual([190]);
  expect(connected?.consumers.map(command => command.id)).toEqual([191]);
  expect(connected?.literalAssignments.map(command => command.id)).toEqual([192]);
  expect(connected?.health).toBe('HEALTHY');
  expect(connected?.owner?.blockId).toBe(7);
  expect(unused?.health).toBe('UNUSED');
  expect(snapshot?.summary.producerCount).toBe(1);
  expect(snapshot?.summary.consumerCount).toBe(1);
  expect(snapshot?.summary.literalAssignmentCount).toBe(1);
  expect(snapshot?.summary.unusedCount).toBe(1);
  expect(snapshot?.summary.warningCount).toBe(0);
  expect(snapshot?.edges.map(edge => edge.type)).toEqual(
    expect.arrayContaining(['DECLARES', 'WRITES', 'READS', 'ASSIGNS_LITERAL']),
  );
});

test('rejects structurally broken RAW_FACTS_V1 payloads instead of showing an empty graph', () => {
  expect(normalizeVariablesWorkspaceSnapshot({
    ...rawFactsSnapshot,
    rawCommands: [{ instructionId: 'broken' }],
  })).toBeNull();
  expect(normalizeVariablesWorkspaceSnapshot({
    ...rawFactsSnapshot,
    rawVariables: undefined,
  })).toBeNull();
});
