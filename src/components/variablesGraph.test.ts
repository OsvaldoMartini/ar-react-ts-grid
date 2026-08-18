import { buildVariableRelationshipGraph } from './variablesGraph';

/**
 * React-owned port of the semantic scenarios previously tested against Java's
 * VariableRelationshipService: roles, edges, ordering diagnostics, and summary.
 */

type Raw = Record<string, any>;

const block = (id: number, order: number, name: string, active = true): Raw =>
  ({ id, order, name, active });

const rawVariable = (overrides: Raw): Raw => ({
  id: 1,
  name: 'Variable',
  type: '$String',
  configuredValue: '$EMPTY',
  localFormat: '',
  delimiter: '',
  ownerInstructionId: null,
  resolvedOwnerId: null,
  ownerName: '',
  ownerAction: '',
  ownerBlockId: null,
  resolvedOwnerBlockId: null,
  ownerBlockName: '',
  ownerBlockOrder: null,
  ownerInstructionOrder: null,
  ownerActive: null,
  ownerBlockActive: null,
  ...overrides,
});

const rawCommand = (overrides: Raw): Raw => ({
  instructionId: 0,
  instructionName: 'Command',
  action: 'GET',
  operation: '',
  variableId: 1,
  parentId: null,
  parentBlockId: null,
  blockId: 10,
  resolvedBlockId: 10,
  blockName: 'Login',
  blockOrder: 1,
  instructionOrder: 1,
  active: true,
  blockActive: true,
  ...overrides,
});

const payload = (variables: Raw[], commands: Raw[], blocks: Raw[] = [
  block(10, 1, 'Login'),
  block(11, 2, 'Checks'),
]): Raw => ({
  ok: true,
  botJobId: 5,
  graphKind: 'RAW_FACTS_V1',
  blocks,
  rawVariables: variables,
  rawCommands: commands,
});

const ownedVariable = (id: number, ownerId: number, overrides: Raw = {}): Raw =>
  rawVariable({
    id,
    ownerInstructionId: ownerId,
    resolvedOwnerId: ownerId,
    ownerName: `Owner ${ownerId}`,
    ownerAction: 'CLICK',
    ownerBlockId: 10,
    resolvedOwnerBlockId: 10,
    ownerBlockName: 'Login',
    ownerBlockOrder: 1,
    ownerInstructionOrder: 1,
    ownerActive: true,
    ownerBlockActive: true,
    ...overrides,
  });

const variableById = (graph: Raw, id: number): Raw => {
  const found = graph.variables.find((row: Raw) => row.id === id);
  if (!found) throw new Error(`Missing variable ${id}`);
  return found;
};

const commandById = (variable: Raw, id: number): Raw => {
  const found = variable.commands.find((row: Raw) => row.instructionId === id);
  if (!found) throw new Error(`Missing command ${id}`);
  return found;
};

const codes = (diagnostics: Raw[]): string[] =>
  diagnostics.map(diagnostic => diagnostic.code);

test('classifies canonical command roles and builds every edge type', () => {
  const graph = buildVariableRelationshipGraph(payload(
    [ownedVariable(1, 100), ownedVariable(2, 101)],
    [
      rawCommand({ instructionId: 100, action: 'CLICK', variableId: null, instructionOrder: 1 }),
      rawCommand({ instructionId: 110, action: 'GET', parentId: 100, instructionOrder: 3 }),
      rawCommand({ instructionId: 111, action: 'E', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 1 }),
      rawCommand({ instructionId: 112, action: 'CK', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 2 }),
      rawCommand({ instructionId: 113, action: 'PDF CHECK', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 3 }),
      rawCommand({ instructionId: 114, action: 'CSV CHECK', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 4 }),
      rawCommand({ instructionId: 115, action: 'SET', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 5 }),
      rawCommand({ instructionId: 116, action: 'C', blockId: 11, resolvedBlockId: 11, blockOrder: 2, instructionOrder: 6 }),
    ],
  ));

  expect(graph).not.toBeNull();
  if (!graph) return;
  const first = variableById(graph, 1);
  const second = variableById(graph, 2);
  // The Web Element endpoint is not a variable-linked executable command.
  expect(first.commands).toHaveLength(7);
  expect(second.commands).toHaveLength(0);
  expect(first.unused).toBe(false);
  expect(second.unused).toBe(true);
  expect(commandById(first, 110).role).toBe('PRODUCER');
  expect(commandById(first, 111).role).toBe('CONSUMER');
  expect(commandById(first, 112).role).toBe('CONSUMER');
  expect(commandById(first, 113).role).toBe('CONSUMER');
  expect(commandById(first, 114).role).toBe('CONSUMER');
  expect(commandById(first, 115).role).toBe('CONSUMER');
  expect(commandById(first, 116).role).toBe('INVALID_LINK');
  expect(codes(first.diagnostics)).toContain('NON_VARIABLE_ACTION_LINK');

  expect(graph.summary.variableCount).toBe(2);
  expect(graph.summary.producerCount).toBe(1);
  expect(graph.summary.consumerCount).toBe(5);
  expect(graph.summary.literalAssignmentCount).toBe(0);
  expect(graph.summary.unusedCount).toBe(1);

  const edgeTypes = graph.edges.map((edge: Raw) => edge.type);
  expect(edgeTypes).toContain('WRITES');
  expect(edgeTypes).toContain('READS');
  expect(edgeTypes).toContain('INVALID_LINK');
});

test('diagnoses missing owners, dangling links, and block mismatches', () => {
  const graph = buildVariableRelationshipGraph(payload(
    [
      // The owner FK points at an instruction that did not resolve in this Bot Job.
      rawVariable({ id: 1, ownerInstructionId: 200 }),
      ownedVariable(2, 100),
      // The owner resolved but its block did not.
      ownedVariable(3, 121, {
        ownerBlockId: 999,
        resolvedOwnerBlockId: null,
      }),
    ],
    [
      // A command whose block does not exist in this Bot Job.
      rawCommand({
        instructionId: 122,
        variableId: 2,
        blockId: 999,
        resolvedBlockId: null,
        instructionOrder: 4,
      }),
      // A command referencing a variable that does not exist at all.
      rawCommand({ instructionId: 120, variableId: 999, instructionOrder: 2 }),
    ],
  ));

  expect(graph).not.toBeNull();
  if (!graph) return;
  expect(variableById(graph, 1).owner).toBeNull();
  expect(codes(variableById(graph, 1).diagnostics)).not.toContain('MISSING_OWNER');
  expect(codes(variableById(graph, 3).diagnostics)).not.toContain('OWNER_BLOCK_MISMATCH');
  expect(codes(variableById(graph, 2).diagnostics)).toContain('COMMAND_BLOCK_MISMATCH');
  expect(codes(graph.diagnostics)).toContain('DANGLING_VARIABLE_LINK');
});

test('diagnoses ordering and producer integrity, ignoring inactive links', () => {
  const graph = buildVariableRelationshipGraph(payload(
    [ownedVariable(1, 100), ownedVariable(2, 101)],
    [
      // Effective consumer at order 3, before the first effective producer at order 4.
      rawCommand({ instructionId: 110, action: 'E', parentId: 100, instructionOrder: 3 }),
      // Inactive producer in an inactive block: excluded from flow analysis.
      rawCommand({
        instructionId: 111,
        action: 'GET',
        parentId: 100,
        blockId: 11,
        resolvedBlockId: 11,
        blockOrder: 2,
        instructionOrder: 1,
        active: false,
        blockActive: false,
      }),
      rawCommand({ instructionId: 112, action: 'GET', parentId: 100, instructionOrder: 4 }),
      // Producer whose parent is NOT this variable's owner.
      rawCommand({ instructionId: 114, action: 'GET', parentId: 101, instructionOrder: 5 }),
      // Consumer of variable 2 with no producer at all.
      rawCommand({
        instructionId: 113,
        action: 'CK',
        variableId: 2,
        parentId: 101,
        instructionOrder: 6,
      }),
    ],
  ));

  expect(graph).not.toBeNull();
  if (!graph) return;
  const ordered = variableById(graph, 1);
  expect(codes(ordered.diagnostics)).toContain('MULTIPLE_PRODUCERS');
  expect(codes(ordered.diagnostics)).toContain('CONSUMER_BEFORE_PRODUCER');
  expect(codes(ordered.diagnostics)).toContain('COMMAND_WEB_ELEMENT_MISSING');
  expect(codes(variableById(graph, 2).diagnostics)).not.toContain('MISSING_PRODUCER');
  expect(commandById(ordered, 111).effectiveActive).toBe(false);
  expect(graph.summary.inactiveLinkCount).toBe(1);
});

test('legacy declaration owners do not affect independent variable health', () => {
  const graph = buildVariableRelationshipGraph(payload(
    [ownedVariable(1, 100), ownedVariable(2, 100)],
    [],
  ));

  expect(graph).not.toBeNull();
  if (!graph) return;
  expect(codes(variableById(graph, 1).diagnostics)).not.toContain('DUPLICATE_DECLARATION');
  expect(codes(variableById(graph, 2).diagnostics)).not.toContain('DUPLICATE_DECLARATION');
});

test('indexes CheckValue LEFT and RIGHT plus SET through their exact slots', () => {
  const graph = buildVariableRelationshipGraph(payload(
    [rawVariable({ id: 1, name: 'Left' }), rawVariable({ id: 2, name: 'Right' })],
    [
      rawCommand({
        instructionId: 100,
        action: 'C',
        variableId: null,
        variableSlots: [],
      }),
      rawCommand({
        instructionId: 110,
        action: 'CK',
        variableId: 1,
        variableSlots: [
          { slot: 'LEFT', variableId: 1 },
          { slot: 'RIGHT', variableId: 2 },
        ],
      }),
      rawCommand({
        instructionId: 111,
        action: 'SET',
        variableId: 2,
        parentId: 100,
        variableSlots: [{ slot: 'READ_SET', variableId: 2 }],
      }),
    ],
  ));

  expect(graph).not.toBeNull();
  if (!graph) return;
  expect(commandById(variableById(graph, 1), 110).role).toBe('CONSUMER');
  expect(commandById(variableById(graph, 2), 110).role).toBe('CONSUMER');
  expect(commandById(variableById(graph, 2), 111).role).toBe('CONSUMER');
  expect(codes(variableById(graph, 1).diagnostics)).not.toContain('MISSING_PRODUCER');
});

test('rejects structurally invalid raw payloads instead of faking an empty graph', () => {
  expect(buildVariableRelationshipGraph(null)).toBeNull();
  expect(buildVariableRelationshipGraph({ ok: false })).toBeNull();
  expect(buildVariableRelationshipGraph({
    ok: true,
    blocks: [],
    rawVariables: [{ id: 'not-a-number' }],
    rawCommands: [],
  })).toBeNull();
  expect(buildVariableRelationshipGraph({
    ok: true,
    blocks: [],
    rawVariables: [],
    rawCommands: [{ instructionId: 1 }],
  })).toBeNull();
});
