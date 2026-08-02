import { buildVariableRelationshipGraph } from './variablesGraph';
import type {
  InstructionGraphLayoutRow,
  InstructionGraphOwnerAssertion,
  InstructionGraphRelationKind,
} from './bot-job-details/grid/domain/instructionGraphMutation.contract';
import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
} from './bot-job-details/grid/domain/instructionRelationshipPolicy';

export const VARIABLES_MANAGER_SESSION_ID = 'variablesManager';
export const VARIABLES_INDIVIDUAL_ROW_PROFILE =
  'VARIABLES_INDIVIDUAL_ROW_V1' as const;
export const VARIABLES_INDIVIDUAL_CROSS_BLOCK_PROFILE =
  'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1' as const;
export const VARIABLES_REACT_AUTHORED_PROFILE =
  'VARIABLES_REACT_AUTHORED_V1' as const;

export type VariablesMutationProfile =
  | typeof VARIABLES_INDIVIDUAL_ROW_PROFILE
  | typeof VARIABLES_INDIVIDUAL_CROSS_BLOCK_PROFILE
  | typeof VARIABLES_REACT_AUTHORED_PROFILE;

export type VariableCommandRole =
  | 'PRODUCER'
  | 'CONSUMER'
  | 'LITERAL_ASSIGNMENT'
  | 'INVALID_LINK';

export type VariableHealth = 'HEALTHY' | 'UNUSED' | 'WARNING' | 'ERROR';

export type VariableEdgeType =
  | 'DECLARES'
  | 'WRITES'
  | 'READS'
  | 'ASSIGNS_LITERAL'
  | 'INVALID_LINK';

export interface VariableWorkspaceBotJob {
  id: number;
  name: string;
  homeBankingId: number;
  organizationName: string;
}

export interface VariableWorkspaceBlock {
  id: number;
  name: string;
  order: number | null;
  active: boolean | null;
}

export interface VariableDiagnostic {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  variableId: number | null;
  instructionId: number | null;
}

export interface VariableInstructionNode {
  id: number | null;
  name: string;
  command: string;
  operation: string;
  onHoldSeconds?: number | null;
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  instructionOrder: number | null;
  parentId: number | null;
  parentBlockId: number | null;
  variableId: number | null;
  tagName?: string | null;
  active: boolean | null;
  blockActive: boolean | null;
  commandConfiguration?: VariableCommandConfiguration | null;
}

export interface VariableCommandConfiguration {
  commandType: string;
  conditionSource: string;
  leftVariableId: number | null;
  operandKind: string;
  comparisonOperator: string;
  operandRawValue: string;
  operandVariableId: number | null;
  outputKey: string;
  outputColumn: string;
  outputFile: string;
  externalSourceKey: string;
  formatPolicy: string;
}

export interface VariableCommandLink extends VariableInstructionNode {
  role: VariableCommandRole;
  diagnostics: VariableDiagnostic[];
}

export interface VariableGraphEntry {
  id: number;
  name: string;
  type: string;
  configuredValue: string;
  localFormat: string;
  delimiter: string;
  owner: VariableInstructionNode | null;
  commands: VariableCommandLink[];
  producers: VariableCommandLink[];
  consumers: VariableCommandLink[];
  literalAssignments: VariableCommandLink[];
  invalidLinks: VariableCommandLink[];
  diagnostics: VariableDiagnostic[];
  unused: boolean;
  health: VariableHealth;
}

export interface VariableWorkspaceSummary {
  variableCount: number;
  producerCount: number;
  consumerCount: number;
  literalAssignmentCount: number;
  warningCount: number;
  unusedCount: number;
}

export interface VariableRelationshipEdge {
  id: string;
  from: string;
  to: string;
  type: VariableEdgeType;
}

export interface VariablesInstructionFact extends InstructionGraphLayoutRow {
  action: string;
  relationKind: InstructionGraphRelationKind;
  parentId: number | null;
  parentBlockId: number | null;
  variableId: number | null;
  tagName?: string | null;
}

export interface VariablesMutationCapability {
  enabled: true;
  contractVersion: 3;
  profile: typeof VARIABLES_INDIVIDUAL_ROW_PROFILE;
  crossBlockProfile:
    | typeof VARIABLES_INDIVIDUAL_CROSS_BLOCK_PROFILE
    | null;
  reactAuthoredProfile?:
    | typeof VARIABLES_REACT_AUTHORED_PROFILE
    | null;
  graphVersion: number;
  graphRevision: string;
  ownerAssertion: InstructionGraphOwnerAssertion & {
    workspaceKind: 'BOT_JOB';
    botJobId: number;
  };
  layoutRows: InstructionGraphLayoutRow[];
  instructionFacts: VariablesInstructionFact[];
}

export type RuntimeVariableState = 'VALUE' | 'VOID';

export interface RuntimeVariableMemoryEntry {
  variableId: number;
  name: string;
  type: string;
  state: RuntimeVariableState;
  value: string;
  voidReason: string | null;
  entryRevision: number;
  source: string;
}

export interface RuntimeVariableMemorySnapshot {
  revision: number;
  variables: RuntimeVariableMemoryEntry[];
}

export interface VariableWorkspaceSnapshot {
  ok: true;
  message: string;
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  graphRevision: string;
  botJob: VariableWorkspaceBotJob;
  summary: VariableWorkspaceSummary;
  blocks: VariableWorkspaceBlock[];
  commands: VariableInstructionNode[];
  variables: VariableGraphEntry[];
  edges: VariableRelationshipEdge[];
  diagnostics: VariableDiagnostic[];
  runtimeMemory: RuntimeVariableMemorySnapshot;
  mutationCapability: VariablesMutationCapability | null;
}

export interface VariablesWorkspaceEnvelope {
  operationId: string;
  body: unknown;
}

const asObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const parseJsonValue = (value: unknown): unknown => {
  let current = value;
  for (let depth = 0; depth < 3 && typeof current === 'string'; depth += 1) {
    const text = current.trim();
    if (!text || (!text.startsWith('{') && !text.startsWith('['))) break;
    current = JSON.parse(text);
  }
  return current;
};

const textValue = (...values: unknown[]): string => {
  const found = values.find(value => typeof value === 'string' && value.trim().length > 0);
  return typeof found === 'string' ? found.trim() : '';
};

const nullableInteger = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (value == null || value === '') continue;
    const number = Number(value);
    if (Number.isSafeInteger(number)) return number;
  }
  return null;
};

const positiveInteger = (...values: unknown[]): number | null => {
  const number = nullableInteger(...values);
  return number !== null && number > 0 ? number : null;
};

const nonNegativeInteger = (...values: unknown[]): number | null => {
  const number = nullableInteger(...values);
  return number !== null && number >= 0 ? number : null;
};

const relationKindForAction = (
  action: string,
): InstructionGraphRelationKind => {
  const policy = instructionRelationshipPolicy(action);
  if (policy.requirements.includes('BLOCK_TARGET')) return 'BLOCK_TARGET';
  if (policy.requirements.includes('LOOP_ANCHOR')) return 'LOOP_ANCHOR';
  if (
    policy.structuralSemantics === 'CONDITIONAL_ROOT'
    || policy.structuralSemantics === 'CONDITIONAL_BOUNDARY'
  ) {
    return 'CONDITIONAL_ROOT';
  }
  return 'ELEMENT_TARGET';
};

const normalizeMutationCapability = (
  value: unknown,
  botJob: VariableWorkspaceBotJob,
  variables: readonly VariableGraphEntry[],
  commands: readonly VariableInstructionNode[],
): VariablesMutationCapability | null => {
  const candidate = asObject(value);
  if (!candidate || candidate.enabled !== true) return null;
  const graphVersion = nonNegativeInteger(candidate.graphVersion);
  const capabilityRevision = textValue(candidate.graphRevision);
  const owner = asObject(candidate.ownerAssertion);
  if (
    candidate.contractVersion !== 3
    || candidate.profile !== VARIABLES_INDIVIDUAL_ROW_PROFILE
    || graphVersion === null
    || !/^[a-f0-9]{64}$/i.test(capabilityRevision)
    || !owner
    || owner.workspaceKind !== 'BOT_JOB'
    || positiveInteger(owner.homeBankingId) !== botJob.homeBankingId
    || positiveInteger(owner.botJobId) !== botJob.id
    || !Array.isArray(candidate.layoutRows)
    || !Array.isArray(candidate.instructionFacts)
  ) {
    return null;
  }

  const layoutRows = candidate.layoutRows.map((value: unknown) => {
    const row = asObject(value);
    if (!row) return null;
    const instructionId = positiveInteger(row.instructionId);
    const blockId = positiveInteger(row.blockId);
    const blockOrderNumber = positiveInteger(row.blockOrderNumber);
    const instructionOrderNumber = positiveInteger(row.instructionOrderNumber);
    return instructionId && blockId && blockOrderNumber && instructionOrderNumber
      ? { instructionId, blockId, blockOrderNumber, instructionOrderNumber }
      : null;
  });
  const instructionFacts = candidate.instructionFacts.map((value: unknown) => {
    const row = asObject(value);
    if (!row) return null;
    const instructionId = positiveInteger(row.instructionId);
    const blockId = positiveInteger(row.blockId);
    const blockOrderNumber = positiveInteger(row.blockOrderNumber);
    const instructionOrderNumber = positiveInteger(row.instructionOrderNumber);
    const action = typeof row.action === 'string' ? row.action.trim() : null;
    return instructionId
      && blockId
      && blockOrderNumber
      && instructionOrderNumber
      && action !== null
      ? {
          instructionId,
          blockId,
          blockOrderNumber,
          instructionOrderNumber,
          action,
          relationKind: relationKindForAction(action),
          parentId: positiveInteger(row.parentId),
          parentBlockId: positiveInteger(row.parentBlockId),
          variableId: positiveInteger(row.variableId),
          tagName: textValue(row.tagName, row.tag_name) || null,
        }
      : null;
  });
  if (
    layoutRows.some(row => row === null)
    || instructionFacts.some(row => row === null)
    || layoutRows.length === 0
    || layoutRows.length !== instructionFacts.length
  ) {
    return null;
  }
  const normalizedLayout = layoutRows as InstructionGraphLayoutRow[];
  const normalizedFacts = instructionFacts as VariablesInstructionFact[];
  const crossBlockProfile = candidate.crossBlockProfile
    === VARIABLES_INDIVIDUAL_CROSS_BLOCK_PROFILE
    ? VARIABLES_INDIVIDUAL_CROSS_BLOCK_PROFILE
    : null;
  const reactAuthoredProfile = candidate.reactAuthoredProfile
    === VARIABLES_REACT_AUTHORED_PROFILE
    ? VARIABLES_REACT_AUTHORED_PROFILE
    : null;
  const layoutIds = new Set(normalizedLayout.map(row => row.instructionId));
  const factIds = new Set(normalizedFacts.map(row => row.instructionId));
  const factsById = new Map(
    normalizedFacts.map(row => [row.instructionId, row]),
  );
  const occupiedOrders = new Set<string>();
  if (
    layoutIds.size !== normalizedLayout.length
    || factIds.size !== normalizedFacts.length
    || layoutIds.size !== factIds.size
    || [...layoutIds].some(id => !factIds.has(id))
    || normalizedLayout.some(row => {
      const fact = factsById.get(row.instructionId);
      const orderKey = `${row.blockId}:${row.instructionOrderNumber}`;
      if (occupiedOrders.has(orderKey)) return true;
      occupiedOrders.add(orderKey);
      return !fact
        || fact.blockId !== row.blockId
        || fact.blockOrderNumber !== row.blockOrderNumber
        || fact.instructionOrderNumber !== row.instructionOrderNumber;
    })
  ) {
    return null;
  }
  const variableFactsMatch = variables.every(variable =>
    variable.commands.every(command => {
      if (command.id === null) return false;
      const fact = factsById.get(command.id);
      return Boolean(fact)
        && fact?.blockId === command.blockId
        && fact?.blockOrderNumber === command.blockOrder
        && fact?.instructionOrderNumber === command.instructionOrder
        && canonicalInstructionAction(fact?.action)
          === canonicalInstructionAction(command.command)
        && fact?.parentId === command.parentId
        && fact?.parentBlockId === command.parentBlockId
        && fact?.variableId === variable.id;
    })
    && (
      variable.owner === null
      || (
        variable.owner.id !== null
        && factsById.get(variable.owner.id)?.blockId === variable.owner.blockId
        && factsById.get(variable.owner.id)?.blockOrderNumber
          === variable.owner.blockOrder
        && factsById.get(variable.owner.id)?.instructionOrderNumber
          === variable.owner.instructionOrder
        && canonicalInstructionAction(
          factsById.get(variable.owner.id)?.action,
        ) === canonicalInstructionAction(variable.owner.command)
      )
    ));
  const commandFactsMatch = commands.every(command => {
    if (command.id === null) return false;
    const fact = factsById.get(command.id);
    return Boolean(fact)
      && fact?.blockId === command.blockId
      && fact?.blockOrderNumber === command.blockOrder
      && fact?.instructionOrderNumber === command.instructionOrder
      && canonicalInstructionAction(fact?.action)
        === canonicalInstructionAction(command.command)
      && fact?.parentId === command.parentId
      && fact?.parentBlockId === command.parentBlockId
      && fact?.variableId === command.variableId
      && (
        !fact?.tagName
        || !command.tagName
        || fact.tagName.trim().toLocaleLowerCase()
          === command.tagName.trim().toLocaleLowerCase()
      );
  });
  const commandIds = new Set(
    commands.flatMap(command => command.id === null ? [] : [command.id]),
  );
  if (
    !variableFactsMatch
    || !commandFactsMatch
    || commands.length !== normalizedFacts.length
    || commandIds.size !== normalizedFacts.length
    || normalizedFacts.some(fact => !commandIds.has(fact.instructionId))
  ) {
    return null;
  }

  return {
    enabled: true,
    contractVersion: 3,
    profile: VARIABLES_INDIVIDUAL_ROW_PROFILE,
    crossBlockProfile,
    reactAuthoredProfile,
    graphVersion,
    graphRevision: capabilityRevision,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: botJob.homeBankingId,
      botJobId: botJob.id,
    },
    layoutRows: normalizedLayout,
    instructionFacts: normalizedFacts,
  };
};

const normalizeSeverity = (value: unknown): VariableDiagnostic['severity'] | null => {
  const severity = String(value ?? '').trim().toUpperCase();
  if (severity === 'ERROR') return 'ERROR';
  if (severity === 'WARNING') return 'WARNING';
  if (severity === 'INFO') return 'INFO';
  return null;
};

const normalizeDiagnostic = (value: unknown): VariableDiagnostic | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const severity = normalizeSeverity(candidate.severity);
  const message = textValue(
    candidate.message,
  );
  const code = textValue(candidate.code);
  if (!message || !code || severity === null) return null;
  return {
    code,
    message,
    severity,
    variableId: positiveInteger(candidate.variableId),
    instructionId: positiveInteger(candidate.instructionId, candidate.commandId),
  };
};

const normalizeDiagnostics = (value: unknown): VariableDiagnostic[] => {
  const candidates = Array.isArray(value)
    ? value
    : value == null
      ? []
      : [value];
  return candidates
    .map(normalizeDiagnostic)
    .filter((diagnostic): diagnostic is VariableDiagnostic => diagnostic !== null);
};

const commandText = (candidate: Record<string, any>): string =>
  textValue(
    candidate.command,
    candidate.actions,
    candidate.action,
    candidate.commandType,
    candidate.instructionType,
  );

const normalizeInstruction = (value: unknown): VariableInstructionNode | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const id = positiveInteger(candidate.id, candidate.instructionId, candidate.commandId);
  const name = textValue(
    candidate.name,
    candidate.instructionName,
    candidate.label,
    id ? `Instruction ${id}` : '',
  );
  const command = commandText(candidate);
  if (id === null && !name && !command) return null;
  const storedConfiguration = asObject(candidate.commandConfiguration);
  return {
    id,
    name: name || 'Unknown instruction',
    command: command || 'UNKNOWN',
    operation: textValue(candidate.operation, candidate.value, candidate.configuredValue),
    onHoldSeconds: positiveInteger(candidate.onHoldSeconds, candidate.on_hold_seconds),
    blockId: positiveInteger(candidate.blockId, candidate.sourceBlockId),
    blockName: textValue(candidate.blockName, candidate.sourceBlockName),
    blockOrder: positiveInteger(
      candidate.blockOrder,
      candidate.blockOrderNumber,
      candidate.sourceBlockOrder,
    ),
    instructionOrder: positiveInteger(
      candidate.instructionOrder,
      candidate.instructionOrderNumber,
      candidate.order,
      candidate.sourceOrder,
    ),
    parentId: positiveInteger(candidate.parentId, candidate.parentInstructionId),
    parentBlockId: positiveInteger(candidate.parentBlockId),
    variableId: positiveInteger(candidate.variableId),
    tagName: textValue(candidate.tagName, candidate.tag_name) || null,
    active: typeof candidate.active === 'boolean' ? candidate.active : null,
    blockActive: typeof candidate.blockActive === 'boolean' ? candidate.blockActive : null,
    commandConfiguration: storedConfiguration ? {
      commandType: textValue(storedConfiguration.commandType),
      conditionSource: textValue(storedConfiguration.conditionSource),
      leftVariableId: positiveInteger(storedConfiguration.leftVariableId),
      operandKind: textValue(storedConfiguration.operandKind),
      comparisonOperator: textValue(storedConfiguration.comparisonOperator),
      operandRawValue: textValue(storedConfiguration.operandRawValue),
      operandVariableId: positiveInteger(storedConfiguration.operandVariableId),
      outputKey: textValue(storedConfiguration.outputKey),
      outputColumn: textValue(storedConfiguration.outputColumn),
      outputFile: textValue(storedConfiguration.outputFile),
      externalSourceKey: textValue(storedConfiguration.externalSourceKey),
      formatPolicy: textValue(storedConfiguration.formatPolicy),
    } : null,
  };
};

const normalizeRole = (value: unknown): VariableCommandRole | null => {
  const role = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (role === 'PRODUCER') return 'PRODUCER';
  if (role === 'CONSUMER') return 'CONSUMER';
  if (role === 'LITERAL_ASSIGNMENT') return 'LITERAL_ASSIGNMENT';
  if (role === 'INVALID_LINK') return 'INVALID_LINK';
  return null;
};

const normalizeCommand = (value: unknown): VariableCommandLink | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const instruction = normalizeInstruction(
    asObject(candidate.instruction) ?? candidate,
  );
  const role = normalizeRole(candidate.role);
  if (!instruction || instruction.id === null || role === null) return null;
  return {
    ...instruction,
    role,
    diagnostics: normalizeDiagnostics(
      candidate.diagnostics ?? candidate.diagnostic ?? candidate.errors,
    ),
  };
};

const uniqueCommands = (commands: VariableCommandLink[]): VariableCommandLink[] => {
  const seen = new Set<string>();
  return commands.filter((command, index) => {
    const key = command.id !== null
      ? `${command.role}:${command.id}`
      : `${command.role}:${command.blockId ?? ''}:${command.instructionOrder ?? ''}:${command.name}:${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeInstructions = (
  value: unknown,
): VariableInstructionNode[] | null => {
  if (!Array.isArray(value)) return null;
  const instructions = value.map(normalizeInstruction);
  if (instructions.some(instruction => instruction?.id == null)) return null;
  const normalized = instructions as VariableInstructionNode[];
  const seen = new Set<number>();
  for (const instruction of normalized) {
    const id = instruction.id as number;
    if (seen.has(id)) return null;
    seen.add(id);
  }
  return normalized.sort((left, right) =>
    (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
    || (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
    || (left.id ?? Number.MAX_SAFE_INTEGER)
      - (right.id ?? Number.MAX_SAFE_INTEGER));
};

export const normalizeRuntimeVariableMemorySnapshot = (
  value: unknown,
  variables: readonly VariableGraphEntry[],
): RuntimeVariableMemorySnapshot | null => {
  const candidate = asObject(value);
  if (!candidate) {
    return {
      revision: 0,
      variables: variables.map(variable => ({
        variableId: variable.id,
        name: variable.name,
        type: variable.type,
        state: 'VOID',
        value: '',
        voidReason: 'NO_PRODUCER_YET',
        entryRevision: 0,
        source: 'DEFINED',
      })),
    };
  }
  const revision = nonNegativeInteger(candidate.revision);
  if (revision === null || !Array.isArray(candidate.variables)) return null;
  const entries = candidate.variables.map((value: unknown) => {
    const row = asObject(value);
    if (!row) return null;
    const variableId = positiveInteger(row.variableId, row.id);
    const state = String(row.state ?? '').trim().toUpperCase();
    const entryRevision = nonNegativeInteger(row.entryRevision) ?? 0;
    if (
      variableId === null
      || (state !== 'VALUE' && state !== 'VOID')
    ) {
      return null;
    }
    return {
      variableId,
      name: textValue(
        row.name,
        variables.find(variable => variable.id === variableId)?.name,
        `Variable ${variableId}`,
      ),
      type: textValue(
        row.type,
        variables.find(variable => variable.id === variableId)?.type,
      ),
      state: state as RuntimeVariableState,
      value: state === 'VALUE' && typeof row.value === 'string'
        ? row.value
        : '',
      voidReason: state === 'VOID'
        ? textValue(row.voidReason, 'NO_PRODUCER_YET')
        : null,
      entryRevision,
      source: textValue(row.source, state === 'VOID' ? 'DEFINED' : 'COMMAND'),
    };
  });
  if (entries.some(entry => entry === null)) return null;
  const normalized = entries as RuntimeVariableMemoryEntry[];
  const seen = new Set<number>();
  if (normalized.some(entry => {
    if (seen.has(entry.variableId)) return true;
    seen.add(entry.variableId);
    return false;
  })) {
    return null;
  }
  return {
    revision,
    variables: normalized.sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      || left.variableId - right.variableId),
  };
};

const normalizeCommands = (candidate: Record<string, any>): VariableCommandLink[] | null => {
  if (!Array.isArray(candidate.commands)) return null;
  const commands = candidate.commands.map(normalizeCommand);
  if (commands.some(command => command === null)) return null;
  const unique = uniqueCommands(commands as VariableCommandLink[]);
  return unique.length === commands.length ? unique : null;
};

const healthFor = (
  owner: VariableInstructionNode | null,
  commands: VariableCommandLink[],
  diagnostics: VariableDiagnostic[],
  unused: boolean,
): VariableHealth => {
  if (
    diagnostics.some(diagnostic => diagnostic.severity === 'ERROR')
    || commands.some(command => command.diagnostics.some(
      diagnostic => diagnostic.severity === 'ERROR',
    ))
  ) {
    return 'ERROR';
  }
  const producerCount = commands.filter(command => command.role === 'PRODUCER').length;
  if (
    !owner
    || diagnostics.length > 0
    || commands.some(command =>
      command.role === 'INVALID_LINK' || command.diagnostics.length > 0)
    || producerCount > 1
  ) {
    return 'WARNING';
  }
  if (unused) return 'UNUSED';
  return 'HEALTHY';
};

const normalizeVariable = (value: unknown): VariableGraphEntry | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const id = positiveInteger(candidate.id, candidate.variableId);
  if (
    id === null
    || !Object.prototype.hasOwnProperty.call(candidate, 'owner')
    || !Array.isArray(candidate.diagnostics)
    || typeof candidate.unused !== 'boolean'
  ) {
    return null;
  }
  const owner = normalizeInstruction(
    candidate.owner,
  );
  const commands = normalizeCommands(candidate);
  const diagnostics = normalizeDiagnostics(candidate.diagnostics);
  if (
    (candidate.owner !== null && (!owner || owner.id === null))
    || commands === null
    || diagnostics.length !== candidate.diagnostics.length
  ) {
    return null;
  }
  const unused = candidate.unused;
  return {
    id,
    name: textValue(candidate.name, candidate.variableName, `Variable ${id}`),
    type: textValue(candidate.type, candidate.variableType, 'String'),
    configuredValue: textValue(
      candidate.configuredValue,
      candidate.declaredValue,
      candidate.value,
    ),
    localFormat: textValue(candidate.localFormat, candidate.format),
    delimiter: textValue(candidate.delimiter, candidate.separator),
    owner,
    commands,
    producers: commands.filter(command => command.role === 'PRODUCER'),
    consumers: commands.filter(command => command.role === 'CONSUMER'),
    literalAssignments: commands.filter(command => command.role === 'LITERAL_ASSIGNMENT'),
    invalidLinks: commands.filter(command => command.role === 'INVALID_LINK'),
    diagnostics,
    unused,
    health: healthFor(owner, commands, diagnostics, unused),
  };
};

const normalizeEdgeType = (value: unknown): VariableEdgeType | null => {
  const type = String(value ?? '').trim().toUpperCase();
  if (
    type === 'DECLARES'
    || type === 'WRITES'
    || type === 'READS'
    || type === 'ASSIGNS_LITERAL'
    || type === 'INVALID_LINK'
  ) {
    return type;
  }
  return null;
};

const normalizeEdge = (value: unknown): VariableRelationshipEdge | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const id = textValue(candidate.id);
  const from = textValue(candidate.from);
  const to = textValue(candidate.to);
  const type = normalizeEdgeType(candidate.type);
  if (!id || !from || !to || !type) return null;
  return { id, from, to, type };
};

const normalizeBlock = (value: unknown): VariableWorkspaceBlock | null => {
  const candidate = asObject(value);
  if (!candidate) return null;
  const id = positiveInteger(candidate.id, candidate.blockId);
  if (id === null) return null;
  return {
    id,
    name: textValue(candidate.name, candidate.blockName, `Block ${id}`),
    order: positiveInteger(
      candidate.order,
      candidate.blockOrder,
      candidate.blockOrderNumber,
    ),
    active: typeof candidate.active === 'boolean' ? candidate.active : null,
  };
};

const normalizeBotJob = (
  root: Record<string, any>,
  candidate: Record<string, any>,
): VariableWorkspaceBotJob | null => {
  const nested = asObject(candidate.botJob);
  if (!nested) return null;
  const id = positiveInteger(nested.id, nested.botJobId, candidate.botJobId, root.botJobId);
  const homeBankingId = positiveInteger(
    nested.homeBankingId,
    candidate.homeBankingId,
    root.homeBankingId,
  );
  if (id === null || homeBankingId === null) return null;
  return {
    id,
    name: textValue(nested.name, nested.botJobName, candidate.botJobName, root.botJobName, `Bot Job ${id}`),
    homeBankingId,
    organizationName: textValue(
      nested.organizationName,
      nested.homeBankName,
      candidate.organizationName,
      candidate.homeBankName,
      root.organizationName,
    ),
  };
};

export const parseVariablesWorkspaceMessage = (raw: string): VariablesWorkspaceEnvelope => {
  const parsed = parseJsonValue(raw);
  const envelope = asObject(parsed);
  if (!envelope) throw new Error('Variables Workspace response is not an object.');
  return {
    operationId: textValue(envelope.operationId, envelope.type),
    body: parseJsonValue(envelope.body ?? envelope),
  };
};

export const normalizeVariablesWorkspaceSnapshot = (
  payload: unknown,
): VariableWorkspaceSnapshot | null => {
  const root = asObject(parseJsonValue(payload));
  if (!root) return null;
  const nestedSnapshot = asObject(parseJsonValue(root.snapshot));
  let candidate = nestedSnapshot ?? root;
  if (candidate.ok !== true) return null;

  // RAW_FACTS_V1: Java supplies only raw blocks/variables/commands; the semantic
  // graph (roles, edges, diagnostics, summary) is computed here in React, which is
  // the source of truth for variable-flow verification.
  if (candidate.graphKind === 'RAW_FACTS_V1') {
    const derived = buildVariableRelationshipGraph(candidate);
    if (!derived) return null;
    candidate = { ...candidate, ...derived };
  }

  const botJob = normalizeBotJob(root, candidate);
  if (!botJob) return null;

  const bindingEpoch = textValue(candidate.bindingEpoch, root.bindingEpoch);
  const workspaceEpoch = positiveInteger(candidate.workspaceEpoch, root.workspaceEpoch);
  const graphRevision = textValue(candidate.graphRevision, root.graphRevision);
  const summaryCandidate = asObject(candidate.summary);
  if (
    !bindingEpoch
    || workspaceEpoch === null
    || !/^[a-f0-9]{64}$/i.test(graphRevision)
    || !summaryCandidate
    || !Array.isArray(candidate.variables)
    || !Array.isArray(candidate.blocks)
    || !Array.isArray(candidate.edges)
    || !Array.isArray(candidate.diagnostics)
  ) {
    return null;
  }

  const normalizedVariables = candidate.variables.map(normalizeVariable);
  const normalizedBlocks = candidate.blocks.map(normalizeBlock);
  const normalizedEdges = candidate.edges.map(normalizeEdge);
  const diagnostics = normalizeDiagnostics(candidate.diagnostics);
  if (
    normalizedVariables.some(variable => variable === null)
    || normalizedBlocks.some(block => block === null)
    || normalizedEdges.some(edge => edge === null)
    || diagnostics.length !== candidate.diagnostics.length
  ) {
    return null;
  }

  const variables = (normalizedVariables as VariableGraphEntry[])
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      || left.id - right.id);
  const commandCandidates = Array.isArray(candidate.commands)
    ? candidate.commands
    : variables.flatMap(variable => [
        ...(variable.owner ? [variable.owner] : []),
        ...variable.commands,
      ]);
  const commands = normalizeInstructions(commandCandidates);
  if (commands === null) return null;
  const blocks = (normalizedBlocks as VariableWorkspaceBlock[])
    .sort((left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
      || left.id - right.id);
  const edges = normalizedEdges as VariableRelationshipEdge[];
  const mutationCapability = normalizeMutationCapability(
    candidate.mutationCapability ?? root.mutationCapability,
    botJob,
    variables,
    commands,
  );
  const runtimeMemory = normalizeRuntimeVariableMemorySnapshot(
    candidate.runtimeMemory ?? root.runtimeMemory,
    variables,
  );
  if (runtimeMemory === null) return null;
  const variableCount = nonNegativeInteger(summaryCandidate.variableCount);
  const producerCount = nonNegativeInteger(summaryCandidate.producerCount);
  const consumerCount = nonNegativeInteger(summaryCandidate.consumerCount);
  const literalAssignmentCount = nonNegativeInteger(summaryCandidate.literalAssignmentCount);
  const warningCount = nonNegativeInteger(summaryCandidate.warningCount);
  const unusedCount = nonNegativeInteger(summaryCandidate.unusedCount);
  if (
    variableCount === null
    || producerCount === null
    || consumerCount === null
    || literalAssignmentCount === null
    || warningCount === null
    || unusedCount === null
    || variableCount !== variables.length
  ) {
    return null;
  }

  return {
    ok: true,
    message: textValue(candidate.message, root.message, 'Variables loaded'),
    requestId: textValue(candidate.requestId, root.requestId),
    bindingEpoch,
    workspaceEpoch,
    graphRevision,
    botJob,
    summary: {
      variableCount,
      producerCount,
      consumerCount,
      literalAssignmentCount,
      warningCount,
      unusedCount,
    },
    blocks,
    commands,
    variables,
    edges,
    diagnostics,
    runtimeMemory,
    mutationCapability,
  };
};
