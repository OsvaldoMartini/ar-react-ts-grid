import { canonicalInstructionAction } from './bot-job-details/grid/domain/instructionDependency';

/**
 * React-owned variable relationship graph.
 *
 * Java (VariableRelationshipService) now supplies only RAW facts — blocks, variable
 * declarations with their resolved owner columns, and variable-linked instruction rows —
 * under `graphKind: "RAW_FACTS_V1"`. This module is the single source of truth for the
 * semantic layer previously computed in Java: command roles, relationship edges,
 * integrity diagnostics (CONSUMER_BEFORE_PRODUCER, MISSING_OWNER, ...), and the summary.
 *
 * The output is the exact legacy snapshot shape, so the strict contract normalizer
 * (variablesWorkspace.contract.ts) validates it identically to a Java-derived graph.
 */

const CONSUMER_ACTIONS = new Set(['SET', 'E', 'CK', 'PDF CHECK', 'CSV CHECK']);

export const isVariableProducerAction = (action: unknown): boolean =>
  canonicalInstructionAction(typeof action === 'string' ? action : '') === 'GET';

export const isVariableConsumerAction = (action: unknown): boolean =>
  CONSUMER_ACTIONS.has(canonicalInstructionAction(typeof action === 'string' ? action : ''));

type Raw = Record<string, any>;

const asObject = (value: unknown): Raw | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Raw
    : null;

const intOrNull = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

const boolOrNull = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const orderValue = (value: number | null): number =>
  value == null ? Number.MAX_SAFE_INTEGER : value;

interface RawCommand {
  id: number;
  name: string;
  action: string;
  operation: string;
  onHoldSeconds: number | null;
  variableId: number | null;
  tagName: string;
  parentId: number | null;
  parentBlockId: number | null;
  blockId: number | null;
  resolvedBlockId: number | null;
  blockName: string;
  blockOrder: number | null;
  instructionOrder: number | null;
  active: boolean | null;
  blockActive: boolean | null;
  commandConfiguration: Raw | null;
  variableSlots: Array<{ slot: string; variableId: number }>;
}

interface RawVariable {
  id: number;
  type: string;
  name: string;
  configuredValue: string;
  localFormat: string;
  delimiter: string;
  ownerInstructionId: number | null;
  resolvedOwnerId: number | null;
  ownerName: string;
  ownerAction: string;
  ownerBlockId: number | null;
  resolvedOwnerBlockId: number | null;
  ownerBlockName: string;
  ownerBlockOrder: number | null;
  ownerInstructionOrder: number | null;
  ownerActive: boolean | null;
  ownerBlockActive: boolean | null;
}

const commandOrder = (left: RawCommand, right: RawCommand): number =>
  orderValue(left.blockOrder) - orderValue(right.blockOrder)
  || orderValue(left.instructionOrder) - orderValue(right.instructionOrder)
  || left.id - right.id;

const parseRawCommand = (value: unknown): RawCommand | null => {
  const raw = asObject(value);
  if (!raw) return null;
  const id = intOrNull(raw.instructionId);
  const variableId = intOrNull(raw.variableId);
  const action = text(raw.action);
  if (id === null || !action.trim()) return null;
  const variableSlots = Array.isArray(raw.variableSlots)
    ? raw.variableSlots.flatMap((value: unknown) => {
        const slot = asObject(value);
        const slotName = text(slot?.slot).trim();
        const slotVariableId = intOrNull(slot?.variableId);
        return slotName && slotVariableId !== null && slotVariableId > 0
          ? [{ slot: slotName, variableId: slotVariableId }]
          : [];
      })
    : [];
  return {
    id,
    name: text(raw.instructionName),
    action,
    operation: text(raw.operation),
    onHoldSeconds: intOrNull(raw.onHoldSeconds ?? raw.on_hold_seconds),
    variableId,
    tagName: text(raw.tagName || raw.tag_name),
    parentId: intOrNull(raw.parentId),
    parentBlockId: intOrNull(raw.parentBlockId),
    blockId: intOrNull(raw.blockId),
    resolvedBlockId: intOrNull(raw.resolvedBlockId),
    blockName: text(raw.blockName),
    blockOrder: intOrNull(raw.blockOrder),
    instructionOrder: intOrNull(raw.instructionOrder),
    active: boolOrNull(raw.active),
    blockActive: boolOrNull(raw.blockActive),
    commandConfiguration: asObject(raw.commandConfiguration),
    variableSlots,
  };
};

const parseRawVariable = (value: unknown): RawVariable | null => {
  const raw = asObject(value);
  if (!raw) return null;
  const id = intOrNull(raw.id);
  if (id === null) return null;
  return {
    id,
    type: text(raw.type),
    name: text(raw.name),
    configuredValue: text(raw.configuredValue),
    localFormat: text(raw.localFormat),
    delimiter: text(raw.delimiter),
    ownerInstructionId: intOrNull(raw.ownerInstructionId),
    resolvedOwnerId: intOrNull(raw.resolvedOwnerId),
    ownerName: text(raw.ownerName),
    ownerAction: text(raw.ownerAction),
    ownerBlockId: intOrNull(raw.ownerBlockId),
    resolvedOwnerBlockId: intOrNull(raw.resolvedOwnerBlockId),
    ownerBlockName: text(raw.ownerBlockName),
    ownerBlockOrder: intOrNull(raw.ownerBlockOrder),
    ownerInstructionOrder: intOrNull(raw.ownerInstructionOrder),
    ownerActive: boolOrNull(raw.ownerActive),
    ownerBlockActive: boolOrNull(raw.ownerBlockActive),
  };
};

const role = (command: RawCommand, variableId: number): string => {
  const connectedSlots = new Set(command.variableSlots
    .filter(slot => slot.variableId === variableId)
    .map(slot => slot.slot.trim().toUpperCase()));
  const action = canonicalInstructionAction(command.action);
  if (action === 'GET' && connectedSlots.has('GET_WRITE')) return 'PRODUCER';
  if (action === 'SET' && connectedSlots.has('READ_SET')) return 'CONSUMER';
  if (action === 'E' && connectedSlots.has('READ')) return 'CONSUMER';
  if (['CK', 'PDF CHECK', 'CSV CHECK'].includes(action)
    && (connectedSlots.has('LEFT') || connectedSlots.has('RIGHT'))) return 'CONSUMER';
  // Compatibility for snapshots created before slot facts were available.
  if (command.variableSlots.length === 0) {
    if (isVariableProducerAction(action)) return 'PRODUCER';
    if (isVariableConsumerAction(action)) return 'CONSUMER';
  }
  return 'INVALID_LINK';
};

const isEffectivelyActive = (command: RawCommand): boolean =>
  command.active === true && command.blockActive === true;

const diagnostic = (
  code: string,
  severity: 'INFO' | 'WARNING' | 'ERROR',
  message: string,
  variableId: number | null,
  instructionId: number | null,
): Raw => ({ code, severity, message, variableId, instructionId });

const edge = (id: string, from: string, to: string, type: string): Raw =>
  ({ id, from, to, type });

const commandJson = (command: RawCommand, commandRole: string): Raw => ({
  instructionId: command.id,
  instructionName: command.name,
  action: canonicalInstructionAction(command.action),
  role: commandRole,
  operation: command.operation,
  onHoldSeconds: command.onHoldSeconds,
  variableId: command.variableId,
  tagName: command.tagName,
  parentId: command.parentId,
  parentBlockId: command.parentBlockId,
  blockId: command.blockId,
  blockName: command.blockName,
  blockOrder: command.blockOrder,
  instructionOrder: command.instructionOrder,
  active: command.active,
  blockActive: command.blockActive,
  effectiveActive: isEffectivelyActive(command),
  commandConfiguration: command.commandConfiguration,
  variableSlots: command.variableSlots,
});

/**
 * Build the derived variable graph (legacy snapshot shape) from RAW_FACTS_V1 facts.
 * Returns null when the raw payload is structurally invalid — the caller then treats
 * the whole snapshot as unparseable, never as an empty successful graph.
 */
export const buildVariableRelationshipGraph = (payload: unknown): Raw | null => {
  const root = asObject(payload);
  if (
    !root
    || root.ok !== true
    || !Array.isArray(root.blocks)
    || !Array.isArray(root.rawVariables)
    || !Array.isArray(root.rawCommands)
  ) {
    return null;
  }

  const variables = root.rawVariables.map(parseRawVariable);
  const commands = root.rawCommands.map(parseRawCommand);
  if (variables.some(row => row === null) || commands.some(row => row === null)) {
    return null;
  }
  const rawVariables = variables as RawVariable[];
  const rawCommands = commands as RawCommand[];

  const commandsByVariable = new Map<number, RawCommand[]>();
  rawCommands.forEach((command) => {
    const connectedVariableIds = command.variableSlots.length > 0
      ? [...new Set(command.variableSlots.map(slot => slot.variableId))]
      : command.variableId === null ? [] : [command.variableId];
    connectedVariableIds.forEach((variableId) => {
      const rows = commandsByVariable.get(variableId) ?? [];
      rows.push(command);
      commandsByVariable.set(variableId, rows);
    });
  });
  commandsByVariable.forEach(rows => rows.sort(commandOrder));

  const variableJson: Raw[] = [];
  const edges: Raw[] = [];
  const graphDiagnostics: Raw[] = [];
  let producerCount = 0;
  let consumerCount = 0;
  let literalAssignmentCount = 0;
  let unusedCount = 0;
  let inactiveLinkCount = 0;
  let warningCount = 0;

  const variableIds = new Set(rawVariables.map(variable => variable.id));
  const commandIds = new Set(rawCommands.map(command => command.id));

  for (const variable of rawVariables) {
    // The owning Web Field declares the variable. A stale self-link must not turn
    // that field into an apparent executable variable command.
    const related = commandsByVariable.get(variable.id) ?? [];
    const diagnostics: Raw[] = [];

    const effectiveRelated = related.filter(isEffectivelyActive);
    inactiveLinkCount += related.length - effectiveRelated.length;
    const producers = effectiveRelated.filter(
      command => isVariableProducerAction(command.action),
    );
    const consumers = effectiveRelated.filter(
      command => isVariableConsumerAction(command.action),
    );
    producerCount += producers.length;
    consumerCount += consumers.length;
    literalAssignmentCount += effectiveRelated.filter(
      command => role(command, variable.id) === 'LITERAL_ASSIGNMENT',
    ).length;
    if (related.length === 0) unusedCount += 1;

    if (producers.length > 1) {
      diagnostics.push(diagnostic(
        'MULTIPLE_PRODUCERS',
        'WARNING',
        'More than one GET command writes this variable.',
        variable.id,
        null,
      ));
      warningCount += 1;
    }
    if (producers.length > 0) {
      const firstProducer = [...producers].sort(commandOrder)[0];
      for (const consumer of consumers) {
        if (commandOrder(consumer, firstProducer) < 0) {
          diagnostics.push(diagnostic(
            'CONSUMER_BEFORE_PRODUCER',
            'ERROR',
            'A variable consumer is ordered before its first GET producer.',
            variable.id,
            consumer.id,
          ));
          warningCount += 1;
        }
      }
    }

    const commandRows: Raw[] = [];
    for (const command of related) {
      const commandRole = role(command, variable.id);
      commandRows.push(commandJson(command, commandRole));
      if (command.blockId === null || command.resolvedBlockId === null) {
        diagnostics.push(diagnostic(
          'COMMAND_BLOCK_MISMATCH',
          'ERROR',
          'A linked command is not attached to a block in this Bot Job.',
          variable.id,
          command.id,
        ));
        warningCount += 1;
      }
      const action = canonicalInstructionAction(command.action);
      if ((action === 'GET' || action === 'SET')
        && (command.parentId === null || !commandIds.has(command.parentId))) {
        diagnostics.push(diagnostic(
          'COMMAND_WEB_ELEMENT_MISSING',
          'ERROR',
          `${action} #${command.id} does not resolve to a Web Element parent.`,
          variable.id,
          command.id,
        ));
        warningCount += 1;
      }
      if (commandRole === 'PRODUCER') {
        edges.push(edge(
          `command:${command.id}:writes:${variable.id}`,
          `instruction:${command.id}`,
          `variable:${variable.id}`,
          'WRITES',
        ));
      } else if (commandRole === 'CONSUMER') {
        edges.push(edge(
          `variable:${variable.id}:reads:${command.id}`,
          `variable:${variable.id}`,
          `instruction:${command.id}`,
          'READS',
        ));
      } else if (commandRole === 'INVALID_LINK') {
        diagnostics.push(diagnostic(
          'NON_VARIABLE_ACTION_LINK',
          'WARNING',
          'A non-variable command carries this variable ID.',
          variable.id,
          command.id,
        ));
        edges.push(edge(
          `command:${command.id}:invalid:${variable.id}`,
          `instruction:${command.id}`,
          `variable:${variable.id}`,
          'INVALID_LINK',
        ));
        warningCount += 1;
      }
    }

    variableJson.push({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      configuredValue: variable.configuredValue,
      localFormat: variable.localFormat,
      delimiter: variable.delimiter,
      owner: null,
      unused: related.length === 0,
      commands: commandRows,
      diagnostics,
    });
  }

  for (const command of rawCommands) {
    const linkedIds = command.variableSlots.length > 0
      ? [...new Set(command.variableSlots.map(slot => slot.variableId))]
      : command.variableId === null ? [] : [command.variableId];
    for (const linkedId of linkedIds) {
      if (variableIds.has(linkedId)) continue;
      graphDiagnostics.push(diagnostic(
        'DANGLING_VARIABLE_LINK',
        'ERROR',
        'An instruction slot references a variable that does not exist in this Bot Job.',
        linkedId,
        command.id,
      ));
      warningCount += 1;
    }
  }

  return {
    ok: true,
    botJobId: root.botJobId,
    summary: {
      variableCount: rawVariables.length,
      producerCount,
      consumerCount,
      literalAssignmentCount,
      unusedCount,
      inactiveLinkCount,
      warningCount,
    },
    blocks: root.blocks,
    commands: [...rawCommands]
      .sort(commandOrder)
      .map(command => commandJson(
        command,
        command.variableId === null ? 'INVALID_LINK' : role(command, command.variableId),
      )),
    variables: variableJson,
    edges,
    diagnostics: graphDiagnostics,
  };
};
