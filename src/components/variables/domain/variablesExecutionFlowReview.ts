import type {
  DerivedRelationshipState,
  InstructionRelationshipKind,
  RelationshipTarget,
} from '../../bot-job-details/grid/domain/instructionRelationshipGraph';
import type {
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  canonicalInstructionAction,
} from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import { variablesReconnectGraph } from './variablesReconnectMutation';

export type VariablesExecutionFlowConnection = {
  id: string;
  kind: InstructionRelationshipKind;
  state: DerivedRelationshipState;
  code: string | null;
  required: boolean;
  source: RelationshipTarget;
  target: RelationshipTarget | null;
  sourceLabel: string;
  targetLabel: string | null;
};

export type VariablesExecutionStepVariable = {
  slot: 'PRIMARY' | 'SECONDARY';
  variableId: number | null;
  variableName: string;
  runtimeState: 'VALUE' | 'VOID';
  runtimeRawValue: string;
  displayValue: string;
};

export type VariablesExecutionFlowStep = {
  key: string;
  instructionId: number | null;
  instructionName: string;
  action: string;
  operation: string;
  onHoldSeconds: number | null;
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  instructionOrder: number | null;
  active: boolean;
  comparisonOperator: string | null;
  comparisonFormatPolicy: string;
  variables: readonly VariablesExecutionStepVariable[];
  connections: readonly VariablesExecutionFlowConnection[];
};

export type VariablesExecutionFlowBlock = {
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  active: boolean;
  steps: readonly VariablesExecutionFlowStep[];
};

export type VariablesExecutionVariableFlow = {
  variableId: number;
  variableName: string;
  variableType: string;
  configuredValue: string;
  runtimeState: 'VALUE' | 'VOID';
  runtimeRawValue: string;
  runtimeVoidReason: string | null;
  ownerInstructionId: number | null;
  producerInstructionIds: readonly number[];
  readerInstructionIds: readonly number[];
  connectionIds: readonly string[];
};

export type VariablesExecutionFlowDiagnostic = {
  id: string;
  sourceLabel: string;
  sourceType: RelationshipTarget['entity'] | 'BOT_JOB';
  blockIds: readonly number[];
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
};

export type VariablesExecutionFlowReview = {
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  graphRevision: string;
  runtimeMemoryRevision: number;
  relationshipsAvailable: boolean;
  blocks: readonly VariablesExecutionFlowBlock[];
  steps: readonly VariablesExecutionFlowStep[];
  variableFlows: readonly VariablesExecutionVariableFlow[];
  unassignedConnections: readonly VariablesExecutionFlowConnection[];
  connectionCount: number;
  diagnostics: readonly VariablesExecutionFlowDiagnostic[];
  issueCount: number;
};

/** Semantic snapshot authority used to close a read-only review when data changes. */
export const variablesExecutionFlowReviewAuthorityKey = (
  snapshot: VariableWorkspaceSnapshot,
): string => [
  snapshot.bindingEpoch,
  snapshot.workspaceEpoch,
  snapshot.graphRevision,
  snapshot.botJob.homeBankingId,
  snapshot.botJob.id,
].join(':');

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const compareSteps = (
  left: VariablesExecutionFlowStep,
  right: VariablesExecutionFlowStep,
): number =>
  (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
    - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.blockId ?? Number.MAX_SAFE_INTEGER)
    - (right.blockId ?? Number.MAX_SAFE_INTEGER)
  || (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
    - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.instructionId ?? Number.MAX_SAFE_INTEGER)
    - (right.instructionId ?? Number.MAX_SAFE_INTEGER)
  || left.key.localeCompare(right.key);

const frozenConnection = (
  edge: VariablesExecutionFlowConnection,
): VariablesExecutionFlowConnection => Object.freeze({
  ...edge,
  source: Object.freeze({ ...edge.source }),
  target: edge.target === null ? null : Object.freeze({ ...edge.target }),
});

/**
 * Build a read-only, complete Bot Job execution review from the exact React
 * relationship graph. This function never creates a mutation draft.
 */
export const buildVariablesExecutionFlowReview = (
  snapshot: VariableWorkspaceSnapshot,
): VariablesExecutionFlowReview => {
  const graph = variablesReconnectGraph(snapshot);

  const commandsById = new Map(snapshot.commands.flatMap(command =>
    positiveInteger(command.id) ? [[command.id, command] as const] : []));
  const blocksById = new Map(snapshot.blocks.map(block => [block.id, block]));
  const variablesById = new Map(snapshot.variables.map(variable =>
    [variable.id, variable] as const));
  const runtimeByVariableId = new Map(snapshot.runtimeMemory.variables.map(entry =>
    [entry.variableId, entry] as const));
  const relationshipOwner = Object.freeze({
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: snapshot.botJob.homeBankingId,
    botJobId: snapshot.botJob.id,
  });
  const targetLabel = (target: RelationshipTarget): string => {
    if (target.entity === 'INSTRUCTION') {
      const command = commandsById.get(target.id);
      return command
        ? `#${command.instructionOrder ?? '?'} ${command.name || command.command} (ID ${target.id})`
        : `Instruction ID ${target.id}`;
    }
    if (target.entity === 'BLOCK') {
      const block = blocksById.get(target.id);
      return block
        ? `Block #${block.order ?? '?'} ${block.name} (ID ${target.id})`
        : `Block ID ${target.id}`;
    }
    const variable = variablesById.get(target.id);
    return variable
      ? `${variable.name} (Variable ID ${target.id})`
      : `Variable ID ${target.id}`;
  };
  const diagnosticBlockIds = (target: RelationshipTarget): readonly number[] => {
    if (target.entity === 'BLOCK') return Object.freeze([target.id]);
    if (target.entity === 'INSTRUCTION') {
      const blockId = commandsById.get(target.id)?.blockId;
      return Object.freeze(positiveInteger(blockId) ? [blockId] : []);
    }
    const variable = variablesById.get(target.id);
    if (!variable) return Object.freeze([]);
    const blockIds = new Set<number>();
    [variable.owner, ...variable.commands].forEach((instruction) => {
      const blockId = instruction?.blockId;
      if (positiveInteger(blockId)) {
        blockIds.add(blockId);
      }
    });
    return Object.freeze([...blockIds].sort((left, right) => left - right));
  };
  const connections = (graph?.edges ?? []).map(edge => frozenConnection({
    id: edge.id,
    kind: edge.kind,
    state: edge.state,
    code: edge.code,
    required: edge.required,
    source: edge.source,
    target: edge.target,
    sourceLabel: targetLabel(edge.source),
    targetLabel: edge.target === null ? null : targetLabel(edge.target),
  }));
  const instructionConnections = new Map<
    number,
    VariablesExecutionFlowConnection[]
  >();
  const assignedConnectionIds = new Set<string>();

  connections.forEach((connection) => {
    let instructionId: number | null = null;
    if (connection.source.entity === 'INSTRUCTION') {
      instructionId = connection.source.id;
    } else if (
      connection.source.entity === 'VARIABLE'
      && connection.target?.entity === 'INSTRUCTION'
    ) {
      // A variable declaration belongs visually to its owner Web Element.
      instructionId = connection.target.id;
    }
    if (instructionId === null || !commandsById.has(instructionId)) return;
    const current = instructionConnections.get(instructionId) ?? [];
    current.push(connection);
    instructionConnections.set(instructionId, current);
    assignedConnectionIds.add(connection.id);
  });

  const variableIdsForCommand = (
    command: VariableWorkspaceSnapshot['commands'][number],
    action: string,
  ): readonly (number | null)[] => {
    const configured = command.commandConfiguration;
    const configuredLeftVariableId = configured?.leftVariableId ?? null;
    const configuredOperandVariableId = configured?.operandVariableId ?? null;
    const primary = positiveInteger(configuredLeftVariableId)
      ? configuredLeftVariableId
      : positiveInteger(command.variableId)
        ? command.variableId
        : null;
    if (action === 'CK' || action === 'CSV CHECK' || action === 'PDF CHECK') {
      return Object.freeze([
        primary,
        positiveInteger(configuredOperandVariableId)
          ? configuredOperandVariableId
          : null,
      ]);
    }
    return ['GET', 'SET', 'E'].includes(action)
      ? Object.freeze([primary])
      : Object.freeze([]);
  };

  const stepVariable = (
    variableId: number | null,
    index: number,
  ): VariablesExecutionStepVariable => {
    const variable = variableId === null ? null : variablesById.get(variableId) ?? null;
    const runtime = variableId === null ? null : runtimeByVariableId.get(variableId) ?? null;
    const runtimeState = runtime?.state ?? 'VOID';
    const runtimeRawValue = runtimeState === 'VALUE' ? runtime?.value ?? '' : '';
    return Object.freeze({
      slot: index === 0 ? 'PRIMARY' : 'SECONDARY',
      variableId,
      variableName: variable?.name ?? (variableId === null
        ? 'Variable not connected'
        : `Variable ${variableId}`),
      runtimeState,
      runtimeRawValue,
      displayValue: runtimeState === 'VOID'
        ? 'VOID'
        : runtimeRawValue === ''
          ? 'EMPTY'
          : runtimeRawValue,
    });
  };

  const variableConnection = (
    command: VariableWorkspaceSnapshot['commands'][number],
    variableId: number | null,
    index: number,
    existing: VariablesExecutionFlowConnection | null,
  ): VariablesExecutionFlowConnection => {
    if (existing !== null) return existing;
    const sourceId = positiveInteger(command.id) ? command.id : 0;
    const target = variableId === null ? null : Object.freeze({
      entity: 'VARIABLE' as const,
      owner: relationshipOwner,
      id: variableId,
    });
    return frozenConnection({
      id: `REVIEW:VARIABLE_BINDING:${sourceId}:${index}:${variableId ?? 'NONE'}`,
      kind: 'VARIABLE_BINDING',
      state: variableId === null ? 'RECONNECT_VARIABLE' : 'CONNECTED',
      code: variableId === null ? 'MISSING_VARIABLE_BINDING' : null,
      required: true,
      source: {
        entity: 'INSTRUCTION',
        owner: relationshipOwner,
        id: sourceId,
      },
      target,
      sourceLabel: positiveInteger(command.id)
        ? targetLabel({ entity: 'INSTRUCTION', owner: relationshipOwner, id: command.id })
        : command.name || command.command || 'Unnamed command',
      targetLabel: target === null ? null : targetLabel(target),
    });
  };

  const steps = snapshot.commands.map((command, index) => {
    const block = command.blockId === null
      ? null
      : blocksById.get(command.blockId) ?? null;
    const action = canonicalInstructionAction(command.command);
    const variableIds = variableIdsForCommand(command, action);
    const originalConnections = positiveInteger(command.id)
      ? [...(instructionConnections.get(command.id) ?? [])]
      : [];
    const variableBindings = originalConnections.filter(connection =>
      connection.kind === 'VARIABLE_BINDING');
    const variableConnections = variableIds.map((variableId, variableIndex) => {
      const existing = variableBindings.find(connection =>
        variableId === null
          ? connection.target === null
          : connection.target?.entity === 'VARIABLE'
            && connection.target.id === variableId) ?? null;
      return variableConnection(command, variableId, variableIndex, existing);
    });
    const presentationConnections = variableIds.length === 0
      ? originalConnections
      : [
          ...originalConnections.filter(connection => {
            if (connection.kind === 'VARIABLE_BINDING') return false;
            if (connection.kind === 'VARIABLE_ORDER') return false;
            if (action === 'E' && connection.kind === 'ELEMENT_TARGET') return false;
            if (
              (action === 'CK' || action === 'CSV CHECK' || action === 'PDF CHECK')
              && connection.kind === 'ELEMENT_TARGET'
            ) return false;
            return true;
          }),
          ...variableConnections,
        ];
    return Object.freeze({
      key: positiveInteger(command.id)
        ? `INSTRUCTION:${command.id}`
        : `UNIDENTIFIED:${index}:${command.blockId ?? 'NONE'}`,
      instructionId: positiveInteger(command.id) ? command.id : null,
      instructionName: command.name || command.command || 'Unnamed command',
      action: command.command || 'UNKNOWN',
      operation: variableIds.length > 0
        ? ''
        : command.operation,
      onHoldSeconds: command.onHoldSeconds ?? null,
      blockId: command.blockId,
      blockName: command.blockName
        || block?.name
        || (command.blockId === null
          ? 'Unassigned commands'
          : `Block ${command.blockId}`),
      blockOrder: command.blockOrder ?? block?.order ?? null,
      instructionOrder: command.instructionOrder,
      active: command.active !== false && command.blockActive !== false,
      comparisonOperator: variableIds.length > 1
        ? command.commandConfiguration?.comparisonOperator?.trim() || null
        : null,
      comparisonFormatPolicy:
        command.commandConfiguration?.formatPolicy?.trim() || 'EXACT_TEXT',
      variables: Object.freeze(variableIds.map(stepVariable)),
      connections: Object.freeze(presentationConnections),
    });
  }).sort(compareSteps);

  const stepsByBlock = new Map<number, VariablesExecutionFlowStep[]>();
  const unassignedSteps: VariablesExecutionFlowStep[] = [];
  steps.forEach((step) => {
    if (step.blockId === null) {
      unassignedSteps.push(step);
      return;
    }
    const current = stepsByBlock.get(step.blockId) ?? [];
    current.push(step);
    stepsByBlock.set(step.blockId, current);
  });
  const blocks: VariablesExecutionFlowBlock[] = snapshot.blocks
    .map(block => Object.freeze({
      blockId: block.id,
      blockName: block.name,
      blockOrder: block.order,
      active: block.active !== false,
      steps: Object.freeze([...(stepsByBlock.get(block.id) ?? [])]),
    }))
    .sort((left, right) =>
      (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
        - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
      || (left.blockId ?? Number.MAX_SAFE_INTEGER)
        - (right.blockId ?? Number.MAX_SAFE_INTEGER));
  const knownBlockIds = new Set(snapshot.blocks.map(block => block.id));
  [...stepsByBlock.entries()]
    .filter(([blockId]) => !knownBlockIds.has(blockId))
    .forEach(([blockId, blockSteps]) => {
      blocks.push(Object.freeze({
        blockId,
        blockName: blockSteps[0]?.blockName ?? `Block ${blockId}`,
        blockOrder: blockSteps[0]?.blockOrder ?? null,
        active: blockSteps.some(step => step.active),
        steps: Object.freeze([...blockSteps]),
      }));
    });
  if (unassignedSteps.length > 0) {
    blocks.push(Object.freeze({
      blockId: null,
      blockName: 'Unassigned commands',
      blockOrder: null,
      active: unassignedSteps.some(step => step.active),
      steps: Object.freeze([...unassignedSteps]),
    }));
  }
  blocks.sort((left, right) => {
    if (left.blockId === null) return right.blockId === null ? 0 : 1;
    if (right.blockId === null) return -1;
    return (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
      || left.blockId - right.blockId;
  });

  const variableFlows = snapshot.variables
    .map((variable) => {
      const runtime = snapshot.runtimeMemory.variables.find(entry =>
        entry.variableId === variable.id) ?? null;
      const variableConnections = connections.filter(connection =>
        (connection.source.entity === 'VARIABLE'
          && connection.source.id === variable.id)
        || (connection.target?.entity === 'VARIABLE'
          && connection.target.id === variable.id));
      const producerInstructionIds = new Set<number>();
      const readerInstructionIds = new Set<number>();
      variable.producers.forEach(command => {
        if (positiveInteger(command.id)) producerInstructionIds.add(command.id);
      });
      variable.literalAssignments.forEach(command => {
        if (positiveInteger(command.id)) producerInstructionIds.add(command.id);
      });
      variable.consumers.forEach(command => {
        if (positiveInteger(command.id)) readerInstructionIds.add(command.id);
      });
      variableConnections.forEach((connection) => {
        if (
          connection.kind === 'VARIABLE_BINDING'
          && connection.source.entity === 'INSTRUCTION'
        ) {
          const step = commandsById.get(connection.source.id);
          const action = (step?.command ?? '').trim().toLocaleUpperCase();
          if (action === 'GET' || action === 'SET') {
            producerInstructionIds.add(connection.source.id);
          } else {
            readerInstructionIds.add(connection.source.id);
          }
        }
      });
      connections
        .filter(connection => connection.kind === 'VARIABLE_ORDER'
          && connection.source.entity === 'INSTRUCTION'
          && variable.commands.some(command => command.id === connection.source.id))
        .forEach((connection) => {
          readerInstructionIds.add(connection.source.id);
          if (connection.target?.entity === 'INSTRUCTION') {
            producerInstructionIds.add(connection.target.id);
          }
        });
      return Object.freeze({
        variableId: variable.id,
        variableName: variable.name,
        variableType: variable.type,
        configuredValue: variable.configuredValue,
        runtimeState: runtime?.state ?? 'VOID',
        runtimeRawValue: runtime?.state === 'VALUE' ? runtime.value : '',
        runtimeVoidReason: runtime?.state === 'VOID'
          ? runtime.voidReason
          : runtime === null
            ? 'NO_RUNTIME_VALUE'
            : null,
        ownerInstructionId: variable.owner?.id ?? null,
        producerInstructionIds: Object.freeze([...producerInstructionIds]),
        readerInstructionIds: Object.freeze([...readerInstructionIds]),
        connectionIds: Object.freeze(variableConnections.map(item => item.id)),
      });
    })
    .sort((left, right) => left.variableId - right.variableId);

  const graphDiagnostics: VariablesExecutionFlowDiagnostic[] = (graph?.issues ?? [])
    .map(issue => ({
      id: `GRAPH:${issue.edgeId}:${issue.code}`,
      sourceLabel: targetLabel(issue.source),
      sourceType: issue.source.entity,
      blockIds: diagnosticBlockIds(issue.source),
      code: issue.code,
      message: `${issue.kind.replaceAll('_', ' ')} is ${issue.state.replaceAll('_', ' ').toLocaleLowerCase()}.`,
      severity: 'ERROR' as const,
    }));
  const snapshotDiagnostics: VariablesExecutionFlowDiagnostic[] =
    snapshot.diagnostics.map((diagnostic, index) => ({
      id: `SNAPSHOT:${index}:${diagnostic.code}:${diagnostic.instructionId ?? diagnostic.variableId ?? 'GLOBAL'}`,
      sourceLabel: diagnostic.instructionId !== null
        ? targetLabel({
            entity: 'INSTRUCTION',
            owner: {
              workspaceKind: 'BOT_JOB',
              homeBankingId: snapshot.botJob.homeBankingId,
              botJobId: snapshot.botJob.id,
            },
            id: diagnostic.instructionId,
          })
        : diagnostic.variableId !== null
          ? targetLabel({
              entity: 'VARIABLE',
              owner: {
                workspaceKind: 'BOT_JOB',
                homeBankingId: snapshot.botJob.homeBankingId,
                botJobId: snapshot.botJob.id,
              },
              id: diagnostic.variableId,
            })
          : 'Bot Job graph',
      sourceType: diagnostic.instructionId !== null
        ? 'INSTRUCTION' as const
        : diagnostic.variableId !== null
          ? 'VARIABLE' as const
          : 'BOT_JOB' as const,
      blockIds: diagnostic.instructionId !== null
        ? diagnosticBlockIds({
            entity: 'INSTRUCTION',
            owner: {
              workspaceKind: 'BOT_JOB',
              homeBankingId: snapshot.botJob.homeBankingId,
              botJobId: snapshot.botJob.id,
            },
            id: diagnostic.instructionId,
          })
        : diagnostic.variableId !== null
          ? diagnosticBlockIds({
              entity: 'VARIABLE',
              owner: {
                workspaceKind: 'BOT_JOB',
                homeBankingId: snapshot.botJob.homeBankingId,
                botJobId: snapshot.botJob.id,
              },
              id: diagnostic.variableId,
            })
          : Object.freeze([]),
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity,
    }));
  const diagnostics = [...graphDiagnostics, ...snapshotDiagnostics];

  return Object.freeze({
    homeBankingId: snapshot.botJob.homeBankingId,
    botJobId: snapshot.botJob.id,
    botJobName: snapshot.botJob.name,
    graphRevision: snapshot.graphRevision,
    runtimeMemoryRevision: snapshot.runtimeMemory.revision,
    relationshipsAvailable: graph !== null,
    blocks: Object.freeze(blocks),
    steps: Object.freeze(steps),
    variableFlows: Object.freeze(variableFlows),
    unassignedConnections: Object.freeze(connections.filter(connection =>
      !assignedConnectionIds.has(connection.id))),
    connectionCount: connections.length,
    diagnostics: Object.freeze(diagnostics),
    issueCount: diagnostics.length,
  });
};
