import {
  buildInstructionRelationshipGraph,
  type InstructionRelationshipEdge,
  type InstructionRelationshipKind,
  type RelationshipOwner,
  type RelationshipTarget,
} from '../../bot-job-details/grid/domain/instructionRelationshipGraph';
import type {
  BotJobGraphMutationDraft,
  InstructionGraphRelationKind,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  VARIABLES_REACT_AUTHORED_PROFILE,
  type VariablesReactAuthoredProfile,
} from './variablesFreeMove';

export { VARIABLES_REACT_AUTHORED_PROFILE };

export type VariablesReconnectRelationKind = Extract<
  InstructionRelationshipKind,
  | 'ELEMENT_TARGET'
  | 'VARIABLE_BINDING'
  | 'LOOP_ANCHOR'
  | 'CONDITIONAL_ROOT'
  | 'BLOCK_TARGET'
>;

export type VariablesReconnectTarget = {
  target: RelationshipTarget;
  /**
   * Final parentBlockId projection for instruction targets. It is null for
   * VARIABLE and BLOCK targets.
   */
  instructionBlockId: number | null;
};

export type VariablesReconnectPlan = {
  mutationProfile: VariablesReactAuthoredProfile;
  authorityKey: string;
  sourceInstructionId: number;
  relationKind: VariablesReconnectRelationKind;
  edge: InstructionRelationshipEdge;
  currentTarget: RelationshipTarget | null;
  compatibleTargets: readonly VariablesReconnectTarget[];
  sourceFact: VariablesInstructionFact;
  unchangedLayout: BotJobGraphMutationDraft['layoutRows'];
};

export type VariablesReconnectPlanningErrorCode =
  | 'MUTATION_UNAVAILABLE'
  | 'SOURCE_NOT_FOUND'
  | 'RELATION_NOT_SUPPORTED'
  | 'AUTHORITATIVE_GRAPH_INVALID';

export type VariablesReconnectPlanningResult =
  | { ok: true; plan: VariablesReconnectPlan }
  | {
      ok: false;
      code: VariablesReconnectPlanningErrorCode;
      message: string;
    };

export type VariablesReconnectChoice =
  | { mode: 'DISCONNECT' }
  | {
      mode: 'CONNECT';
      target: RelationshipTarget;
    };

export type VariablesReconnectMutationErrorCode =
  | 'UNKNOWN_TARGET'
  | 'TARGET_TYPE_MISMATCH'
  | 'NO_CHANGE';

export type VariablesReconnectMutationResult =
  | {
      ok: true;
      mutationProfile: VariablesReactAuthoredProfile;
      draft: BotJobGraphMutationDraft;
    }
  | {
      ok: false;
      code: VariablesReconnectMutationErrorCode;
      message: string;
    };

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const ownerKey = (owner: RelationshipOwner): string =>
  owner.workspaceKind === 'BOT_JOB'
    ? `BOT_JOB:${owner.homeBankingId}:${owner.botJobId}`
    : `COMPONENT:${owner.homeBankingId}`;

const targetKey = (target: RelationshipTarget): string =>
  `${target.entity}:${ownerKey(target.owner)}:${target.id}`;

const authorityKey = (snapshot: VariableWorkspaceSnapshot): string =>
  [
    snapshot.bindingEpoch,
    snapshot.workspaceEpoch,
    snapshot.graphRevision,
    snapshot.mutationCapability?.graphVersion ?? '',
    snapshot.mutationCapability?.graphRevision ?? '',
  ].join(':');

const planningRefusal = (
  code: VariablesReconnectPlanningErrorCode,
  message: string,
): VariablesReconnectPlanningResult => ({ ok: false, code, message });

const mutationRefusal = (
  code: VariablesReconnectMutationErrorCode,
  message: string,
): VariablesReconnectMutationResult => ({ ok: false, code, message });

const expectedTarget = (
  owner: Extract<RelationshipOwner, { workspaceKind: 'BOT_JOB' }>,
  fact: VariablesInstructionFact,
  relationKind: VariablesReconnectRelationKind,
): RelationshipTarget | null => {
  if (relationKind === 'VARIABLE_BINDING') {
    return fact.variableId === null
      ? null
      : { entity: 'VARIABLE', owner, id: fact.variableId };
  }
  if (relationKind === 'BLOCK_TARGET') {
    return fact.parentBlockId === null
      ? null
      : { entity: 'BLOCK', owner, id: fact.parentBlockId };
  }
  return fact.parentId === null
    ? null
    : { entity: 'INSTRUCTION', owner, id: fact.parentId };
};

export const variablesReconnectGraph = (
  snapshot: VariableWorkspaceSnapshot,
): ReturnType<typeof buildInstructionRelationshipGraph> | null => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return null;
  }
  const owner = {
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: snapshot.botJob.homeBankingId,
    botJobId: snapshot.botJob.id,
  };
  const instructionIds = new Set<number>();
  const commandsById = new Map(
    snapshot.commands.flatMap(command =>
      command.id === null ? [] : [[command.id, command] as const]),
  );
  const instructions = capability.instructionFacts.map((fact) => {
    if (
      !positiveInteger(fact.instructionId)
      || instructionIds.has(fact.instructionId)
    ) {
      return null;
    }
    instructionIds.add(fact.instructionId);
    const command = commandsById.get(fact.instructionId);
    return {
      owner,
      id: fact.instructionId,
      blockId: fact.blockId,
      blockOrderNumber: fact.blockOrderNumber,
      instructionOrderNumber: fact.instructionOrderNumber,
      actions: fact.action,
      // Prefer the rendered raw-command tag and fall back to an optional
      // mutation fact. An absent tag stays absent rather than being invented.
      tagName: command?.tagName ?? fact.tagName ?? null,
      parentId: fact.parentId,
      parentBlockId: fact.parentBlockId,
      variableId: fact.variableId,
      instructionActive: command?.active ?? null,
      blockActive: command?.blockActive
        ?? snapshot.blocks.find(block => block.id === fact.blockId)?.active
        ?? null,
    };
  });
  if (instructions.some(instruction => instruction === null)) return null;
  return buildInstructionRelationshipGraph({
    owner,
    instructions: instructions as Exclude<
      (typeof instructions)[number],
      null
    >[],
    blocks: snapshot.blocks.map(block => ({
      owner,
      id: block.id,
      order: block.order,
      active: block.active,
    })),
    variables: snapshot.variables.map(variable => ({
      owner,
      id: variable.id,
      type: variable.type || null,
      ownerInstructionId: variable.owner?.id ?? null,
    })),
  });
};

/**
 * Plans the compatible targets for one explicit relationship repair.
 *
 * The shared relationship graph owns compatibility. This function neither
 * guesses a target nor mutates layout; it packages the exact persisted source
 * values needed for a later compare-and-set patch.
 */
export const planVariablesReconnect = (
  snapshot: VariableWorkspaceSnapshot,
  sourceInstructionId: number,
  relationKind: VariablesReconnectRelationKind,
): VariablesReconnectPlanningResult => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return planningRefusal(
      'MUTATION_UNAVAILABLE',
      'Variables relationship authoring is not available for this workspace.',
    );
  }
  const sourceFact = capability.instructionFacts.find(
    fact => fact.instructionId === sourceInstructionId,
  );
  if (!sourceFact) {
    return planningRefusal(
      'SOURCE_NOT_FOUND',
      `Instruction #${sourceInstructionId} is not in the authoritative graph.`,
    );
  }
  const graph = variablesReconnectGraph(snapshot);
  if (!graph) {
    return planningRefusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative relationship graph could not be constructed.',
    );
  }
  const edge = graph.edges.find(candidate =>
    candidate.kind === relationKind
    && candidate.source.entity === 'INSTRUCTION'
    && candidate.source.id === sourceInstructionId);
  if (!edge) {
    return planningRefusal(
      'RELATION_NOT_SUPPORTED',
      `Instruction #${sourceInstructionId} does not support ${relationKind}.`,
    );
  }
  const factById = new Map(
    capability.instructionFacts.map(fact => [fact.instructionId, fact]),
  );
  const compatibleTargets: VariablesReconnectTarget[] =
    edge.compatibleTargets.map(target => ({
      target,
      instructionBlockId: target.entity === 'INSTRUCTION'
        ? factById.get(target.id)?.blockId ?? null
        : null,
    }));
  if (
    compatibleTargets.some(candidate =>
      candidate.target.entity === 'INSTRUCTION'
      && candidate.instructionBlockId === null)
  ) {
    return planningRefusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'A compatible instruction target is missing its authoritative Block.',
    );
  }
  const owner = graph.owner.workspaceKind === 'BOT_JOB'
    ? graph.owner
    : null;
  if (!owner) {
    return planningRefusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The Variables relationship owner is not a Bot Job.',
    );
  }
  return {
    ok: true,
    plan: {
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      authorityKey: authorityKey(snapshot),
      sourceInstructionId,
      relationKind,
      edge,
      currentTarget: expectedTarget(owner, sourceFact, relationKind),
      compatibleTargets,
      sourceFact,
      unchangedLayout: capability.layoutRows.map(row => ({ ...row })),
    },
  };
};

const requiredTargetEntity = (
  relationKind: VariablesReconnectRelationKind,
): RelationshipTarget['entity'] => {
  if (relationKind === 'VARIABLE_BINDING') return 'VARIABLE';
  if (relationKind === 'BLOCK_TARGET') return 'BLOCK';
  return 'INSTRUCTION';
};

/**
 * Converts one reviewed reconnect choice into an exact relationship-only v3
 * draft. The caller must compare plan.authorityKey with the current snapshot
 * before submitting it.
 */
export const buildVariablesReconnectMutation = (
  plan: VariablesReconnectPlan,
  choice: VariablesReconnectChoice,
): VariablesReconnectMutationResult => {
  const selected = choice.mode === 'CONNECT'
    ? plan.compatibleTargets.find(candidate =>
        targetKey(candidate.target) === targetKey(choice.target))
    : null;
  if (choice.mode === 'CONNECT' && !selected) {
    return mutationRefusal(
      'UNKNOWN_TARGET',
      'The selected reconnect target is not compatible with this relationship.',
    );
  }
  const requiredEntity = requiredTargetEntity(plan.relationKind);
  if (
    selected
    && (
      selected.target.entity !== requiredEntity
      || (
        selected.target.entity === 'INSTRUCTION'
        && selected.instructionBlockId === null
      )
    )
  ) {
    return mutationRefusal(
      'TARGET_TYPE_MISMATCH',
      `The ${plan.relationKind} relationship requires a ${requiredEntity} target.`,
    );
  }

  const fact = plan.sourceFact;
  const disconnecting = choice.mode === 'DISCONNECT';
  if (plan.relationKind === 'VARIABLE_BINDING') {
    const replacement = disconnecting ? null : selected!.target.id;
    if (replacement === fact.variableId) {
      return mutationRefusal(
        'NO_CHANGE',
        'The instruction already has that variable binding.',
      );
    }
    return {
      ok: true,
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      draft: {
        mutationKind: 'RELATIONSHIP_UPDATE',
        draggedInstructionId: null,
        layoutRows: plan.unchangedLayout.map(row => ({ ...row })),
        instructionRelationPatches: [],
        variableBindingPatches: [{
          instructionId: fact.instructionId,
          operation: disconnecting ? 'CLEAR' : 'SET',
          expected: { value: fact.variableId },
          replacement: { value: replacement },
        }],
        variableOwnerPatches: [],
      },
    };
  }

  if (plan.relationKind === 'BLOCK_TARGET') {
    const replacementBlockId = disconnecting ? null : selected!.target.id;
    if (replacementBlockId === fact.parentBlockId && fact.parentId === null) {
      return mutationRefusal(
        'NO_CHANGE',
        'The instruction already has that Block target.',
      );
    }
    return {
      ok: true,
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      draft: {
        mutationKind: 'RELATIONSHIP_UPDATE',
        draggedInstructionId: null,
        layoutRows: plan.unchangedLayout.map(row => ({ ...row })),
        instructionRelationPatches: [{
          instructionId: fact.instructionId,
          relationKind: 'BLOCK_TARGET',
          operation: disconnecting ? 'CLEAR' : 'SET',
          expected: {
            parentId: null,
            parentBlockId: fact.parentBlockId,
          },
          replacement: {
            parentId: null,
            parentBlockId: replacementBlockId,
          },
        }],
        variableBindingPatches: [],
        variableOwnerPatches: [],
      },
    };
  }

  const replacementParentId = disconnecting ? null : selected!.target.id;
  const replacementParentBlockId = disconnecting
    ? null
    : selected!.instructionBlockId;
  if (
    replacementParentId === fact.parentId
    && replacementParentBlockId === fact.parentBlockId
  ) {
    return mutationRefusal(
      'NO_CHANGE',
      'The instruction already has that parent relationship.',
    );
  }
  return {
    ok: true,
    mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
    draft: {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: plan.unchangedLayout.map(row => ({ ...row })),
      instructionRelationPatches: [{
        instructionId: fact.instructionId,
        relationKind: plan.relationKind as InstructionGraphRelationKind,
        operation: disconnecting ? 'CLEAR' : 'SET',
        expected: {
          parentId: fact.parentId,
          parentBlockId: fact.parentBlockId,
        },
        replacement: {
          parentId: replacementParentId,
          parentBlockId: replacementParentBlockId,
        },
      }],
      variableBindingPatches: [],
      variableOwnerPatches: [],
    },
  };
};
