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

const CONSUMER_ACTIONS = new Set(['E', 'CK', 'PDF CHECK', 'CSV CHECK']);

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
  if (id === null) return null;
  return {
    id,
    name: text(raw.instructionName),
    action: text(raw.action),
    operation: text(raw.operation),
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

const role = (action: string): string => {
  if (isVariableProducerAction(action)) return 'PRODUCER';
  if (isVariableConsumerAction(action)) return 'CONSUMER';
  if (canonicalInstructionAction(action) === 'SET') return 'LITERAL_ASSIGNMENT';
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
    if (command.variableId === null) return;
    const rows = commandsByVariable.get(command.variableId) ?? [];
    rows.push(command);
    commandsByVariable.set(command.variableId, rows);
  });
  commandsByVariable.forEach(rows => rows.sort(commandOrder));

  const declarationsByOwner = new Map<number, number>();
  rawVariables.forEach((variable) => {
    if (variable.ownerInstructionId === null) return;
    declarationsByOwner.set(
      variable.ownerInstructionId,
      (declarationsByOwner.get(variable.ownerInstructionId) ?? 0) + 1,
    );
  });

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

  for (const variable of rawVariables) {
    // The owning Web Field declares the variable. A stale self-link must not turn
    // that field into an apparent executable variable command.
    const related = (commandsByVariable.get(variable.id) ?? []).filter(
      command => variable.resolvedOwnerId === null || command.id !== variable.resolvedOwnerId,
    );
    const diagnostics: Raw[] = [];

    if (variable.ownerInstructionId === null || variable.resolvedOwnerId === null) {
      diagnostics.push(diagnostic(
        'MISSING_OWNER',
        'ERROR',
        'The variable declaration does not have an authoritative Web Field.',
        variable.id,
        variable.ownerInstructionId,
      ));
      warningCount += 1;
    } else {
      edges.push(edge(
        `owner:${variable.ownerInstructionId}:variable:${variable.id}`,
        `instruction:${variable.ownerInstructionId}`,
        `variable:${variable.id}`,
        'DECLARES',
      ));
      if ((declarationsByOwner.get(variable.ownerInstructionId) ?? 0) > 1) {
        diagnostics.push(diagnostic(
          'DUPLICATE_DECLARATION',
          'WARNING',
          'This Web Field owns more than one variable declaration.',
          variable.id,
          variable.ownerInstructionId,
        ));
        warningCount += 1;
      }
      if (variable.ownerBlockId === null || variable.resolvedOwnerBlockId === null) {
        diagnostics.push(diagnostic(
          'OWNER_BLOCK_MISMATCH',
          'ERROR',
          'The variable owner is not attached to a block in this Bot Job.',
          variable.id,
          variable.ownerInstructionId,
        ));
        warningCount += 1;
      }
    }

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
      command => canonicalInstructionAction(command.action) === 'SET',
    ).length;
    if (related.length === 0) unusedCount += 1;

    if (consumers.length > 0 && producers.length === 0) {
      diagnostics.push(diagnostic(
        'MISSING_PRODUCER',
        'ERROR',
        'One or more commands read this variable, but no GET command produces it.',
        variable.id,
        null,
      ));
      warningCount += 1;
    }
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
      const commandRole = role(command.action);
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
      } else if (
        variable.resolvedOwnerBlockId !== null
        && variable.resolvedOwnerBlockId !== command.resolvedBlockId
      ) {
        diagnostics.push(diagnostic(
          'COMMAND_OWNER_BLOCK_MISMATCH',
          'WARNING',
          'A linked command is stored in a different block than its variable owner.',
          variable.id,
          command.id,
        ));
        warningCount += 1;
      }
      if (
        commandRole === 'PRODUCER'
        && variable.resolvedOwnerId !== null
        && (command.parentId === null
          || command.parentId !== variable.resolvedOwnerId
          || (variable.resolvedOwnerBlockId !== null
            && command.resolvedBlockId !== null
            && variable.resolvedOwnerBlockId !== command.resolvedBlockId))
      ) {
        diagnostics.push(diagnostic(
          'PRODUCER_OWNER_MISMATCH',
          'ERROR',
          "The GET producer does not point to this variable's owning Web Field.",
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
      } else if (commandRole === 'LITERAL_ASSIGNMENT' && variable.ownerInstructionId !== null) {
        edges.push(edge(
          `command:${command.id}:assigns:${variable.ownerInstructionId}`,
          `instruction:${command.id}`,
          `instruction:${variable.ownerInstructionId}`,
          'ASSIGNS_LITERAL',
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

    const owner = variable.ownerInstructionId === null || variable.resolvedOwnerId === null
      ? null
      : {
          instructionId: variable.ownerInstructionId,
          instructionName: variable.ownerName,
          action: variable.ownerAction,
          blockId: variable.ownerBlockId,
          blockName: variable.ownerBlockName,
          blockOrder: variable.ownerBlockOrder,
          instructionOrder: variable.ownerInstructionOrder,
          active: variable.ownerActive,
          blockActive: variable.ownerBlockActive,
        };
    variableJson.push({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      configuredValue: variable.configuredValue,
      localFormat: variable.localFormat,
      delimiter: variable.delimiter,
      owner,
      unused: related.length === 0,
      commands: commandRows,
      diagnostics,
    });
  }

  for (const command of rawCommands) {
    if (command.variableId === null) continue;
    if (variableIds.has(command.variableId)) continue;
    graphDiagnostics.push(diagnostic(
      'DANGLING_VARIABLE_LINK',
      'ERROR',
      'An instruction references a variable that does not exist in this Bot Job.',
      command.variableId,
      command.id,
    ));
    warningCount += 1;
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
        command.variableId === null ? 'INVALID_LINK' : role(command.action),
      )),
    variables: variableJson,
    edges,
    diagnostics: graphDiagnostics,
  };
};
