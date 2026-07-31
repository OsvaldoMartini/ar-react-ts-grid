import type {
  BotJobGraphMutationDraft,
  InstructionGraphLayoutRow,
  InstructionGraphRelationPatch,
  InstructionGraphVariableBindingPatch,
  InstructionGraphVariableOwnerPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type {
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
  RelationshipTarget,
} from '../../bot-job-details/grid/domain/instructionRelationshipGraph';
import type {
  VariablesInstructionFact,
  VariablesVariableFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  VARIABLES_REACT_AUTHORED_PROFILE,
  variablesReconnectGraph,
} from './variablesReconnectMutation';

export type VariablesBatchEditableRelationshipKind =
  | Extract<
      InstructionRelationshipKind,
      | 'ELEMENT_TARGET'
      | 'VARIABLE_BINDING'
      | 'LOOP_ANCHOR'
      | 'CONDITIONAL_ROOT'
      | 'BLOCK_TARGET'
    >
  | 'VARIABLE_OWNER'
  | 'VARIABLE_ORDER';

export type VariablesBatchConnectionErrorCode =
  | 'MUTATION_UNAVAILABLE'
  | 'INVALID_VISIBLE_INSTRUCTION'
  | 'AUTHORITATIVE_GRAPH_INVALID'
  | 'DUPLICATE_REVIEW_CHOICE'
  | 'UNKNOWN_REVIEW_CHOICE'
  | 'INCOMPATIBLE_REVIEW_TARGET'
  | 'PARENT_REVIEW_REQUIRED'
  | 'REVIEW_REQUIRED'
  | 'NO_CHANGES';

export type VariablesBatchConnectionFailure = {
  ok: false;
  code: VariablesBatchConnectionErrorCode;
  message: string;
};

export type VariablesBatchAuthority = {
  authorityKey: string;
};

export type VariablesBatchReleasePlan = VariablesBatchAuthority & {
  kind: 'RELEASE';
  mutationProfile: typeof VARIABLES_REACT_AUTHORED_PROFILE;
  visibleInstructionIds: readonly number[];
  changedInstructionIds: readonly number[];
  draft: BotJobGraphMutationDraft;
};

export type VariablesBatchResolveChoice =
  | {
      reviewId: string;
      mode: 'CONNECT';
      target: RelationshipTarget;
    }
  | {
      reviewId: string;
      mode: 'SKIP';
    };

export type VariablesBatchResolveResolution =
  | 'AUTO'
  | 'REVIEWED'
  | 'REVIEW_REQUIRED'
  | 'SKIPPED'
  | 'UNAVAILABLE'
  | 'BLOCKED';

export type VariablesBatchResolveReviewItem = {
  reviewId: string;
  sourceEntity: 'INSTRUCTION' | 'VARIABLE';
  sourceId: number;
  sourceInstructionId: number | null;
  sourceVariableId: number | null;
  kind: VariablesBatchEditableRelationshipKind;
  state: InstructionRelationshipEdge['state'];
  code: string | null;
  currentTarget: RelationshipTarget | null;
  compatibleTargets: readonly RelationshipTarget[];
  selectedTarget: RelationshipTarget | null;
  resolution: VariablesBatchResolveResolution;
  blockedByReviewId: string | null;
};

type FrozenResolveBasis = {
  snapshot: VariableWorkspaceSnapshot;
  visibleInstructionIds: readonly number[];
  factsById: ReadonlyMap<number, VariablesInstructionFact>;
  variableFactsById: ReadonlyMap<number, VariablesVariableFact>;
};

export type VariablesBatchResolvePlan = VariablesBatchAuthority & {
  kind: 'RESOLVE';
  mutationProfile: typeof VARIABLES_REACT_AUTHORED_PROFILE;
  visibleInstructionIds: readonly number[];
  reviewItems: readonly VariablesBatchResolveReviewItem[];
  /**
   * Frozen WYSIWYG facts used to rebuild compatibility after reviewed parent
   * choices. Consumers must use the exported review/build functions rather
   * than reading this implementation detail.
   */
  readonly basis: FrozenResolveBasis;
};

export type VariablesBatchResolveReview = {
  items: readonly VariablesBatchResolveReviewItem[];
  reviewRequiredCount: number;
  unavailableCount: number;
  blockedCount: number;
};

export type VariablesBatchResolveMutation = {
  mutationProfile: typeof VARIABLES_REACT_AUTHORED_PROFILE;
  draft: BotJobGraphMutationDraft;
  review: VariablesBatchResolveReview;
  changedInstructionIds: readonly number[];
};

type PlanningResult<T> = { ok: true; plan: T } | VariablesBatchConnectionFailure;
type ReviewResult = { ok: true; review: VariablesBatchResolveReview }
  | VariablesBatchConnectionFailure;
type MutationResult = { ok: true; mutation: VariablesBatchResolveMutation }
  | VariablesBatchConnectionFailure;

const PARENT_KINDS = new Set<VariablesBatchEditableRelationshipKind>([
  'ELEMENT_TARGET',
  'LOOP_ANCHOR',
  'CONDITIONAL_ROOT',
  'BLOCK_TARGET',
]);

const EDITABLE_KINDS = new Set<VariablesBatchEditableRelationshipKind>([
  ...PARENT_KINDS,
  'VARIABLE_BINDING',
  'VARIABLE_OWNER',
  'VARIABLE_ORDER',
]);

const failure = (
  code: VariablesBatchConnectionErrorCode,
  message: string,
): VariablesBatchConnectionFailure => ({ ok: false, code, message });

const isBatchConnectionFailure = (
  value: readonly number[] | VariablesBatchConnectionFailure,
): value is VariablesBatchConnectionFailure => !Array.isArray(value);

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

const sameTarget = (
  left: RelationshipTarget | null,
  right: RelationshipTarget | null,
): boolean =>
  left === null || right === null
    ? left === right
    : targetKey(left) === targetKey(right);

const reviewIdFor = (
  sourceEntity: 'INSTRUCTION' | 'VARIABLE',
  sourceId: number,
  kind: VariablesBatchEditableRelationshipKind,
): string => sourceEntity === 'INSTRUCTION'
  ? `${sourceId}:${kind}`
  : `VARIABLE:${sourceId}:${kind}`;

/**
 * Stable authority key for a frozen Variables batch plan.
 *
 * Both the semantic RAW snapshot revision and the mutation-capability revision
 * are included. A caller must discard the plan when this key changes.
 */
export const variablesBatchConnectionsAuthorityKey = (
  snapshot: VariableWorkspaceSnapshot,
): string | null => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return null;
  }
  return [
    snapshot.bindingEpoch,
    snapshot.workspaceEpoch,
    snapshot.graphRevision,
    snapshot.botJob.homeBankingId,
    snapshot.botJob.id,
    capability.graphVersion,
    capability.graphRevision,
    capability.ownerAssertion.workspaceKind,
    capability.ownerAssertion.homeBankingId,
    capability.ownerAssertion.botJobId,
    capability.reactAuthoredProfile,
  ].join(':');
};

/** Validate that a frozen plan still belongs to the exact live authority. */
export const validateVariablesBatchConnectionsAuthority = (
  authorityKey: string,
  snapshot: VariableWorkspaceSnapshot,
): boolean => {
  const current = variablesBatchConnectionsAuthorityKey(snapshot);
  return current !== null && current === authorityKey;
};

export const isVariablesBatchConnectionsPlanStale = (
  plan: VariablesBatchAuthority,
  snapshot: VariableWorkspaceSnapshot,
): boolean =>
  !validateVariablesBatchConnectionsAuthority(plan.authorityKey, snapshot);

const freezeVisibleInstructionIds = (
  snapshot: VariableWorkspaceSnapshot,
  visibleInstructionIds: readonly number[],
): readonly number[] | VariablesBatchConnectionFailure => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return failure(
      'MUTATION_UNAVAILABLE',
      'Variables batch relationship authoring is unavailable.',
    );
  }
  const factsById = new Map(
    capability.instructionFacts.map(fact => [fact.instructionId, fact]),
  );
  const requested = new Set<number>();
  for (const instructionId of visibleInstructionIds) {
    if (!positiveInteger(instructionId) || !factsById.has(instructionId)) {
      return failure(
        'INVALID_VISIBLE_INSTRUCTION',
        `Visible instruction #${instructionId} is not in the authoritative graph.`,
      );
    }
    requested.add(instructionId);
  }
  const frozen = capability.layoutRows
    .filter(row => requested.has(row.instructionId))
    .map(row => row.instructionId);
  if (frozen.length !== requested.size) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative layout does not contain every visible instruction.',
    );
  }
  return Object.freeze(frozen);
};

const frozenSnapshot = (
  snapshot: VariableWorkspaceSnapshot,
): VariableWorkspaceSnapshot => {
  const capability = snapshot.mutationCapability!;
  return Object.freeze({
    ...snapshot,
    blocks: Object.freeze(snapshot.blocks.map(block => Object.freeze({ ...block }))),
    commands: Object.freeze(snapshot.commands.map(command =>
      Object.freeze({ ...command }))),
    variables: Object.freeze(snapshot.variables.map(variable =>
      Object.freeze({
        ...variable,
        owner: variable.owner === null
          ? null
          : Object.freeze({ ...variable.owner }),
      }))),
    mutationCapability: Object.freeze({
      ...capability,
      ownerAssertion: Object.freeze({ ...capability.ownerAssertion }),
      layoutRows: Object.freeze(capability.layoutRows.map(row =>
        Object.freeze({ ...row }))),
      instructionFacts: Object.freeze(capability.instructionFacts.map(fact =>
        Object.freeze({ ...fact }))),
      variableFacts: Object.freeze(capability.variableFacts.map(fact =>
        Object.freeze({ ...fact }))),
    }),
  }) as unknown as VariableWorkspaceSnapshot;
};

const unchangedLayout = (
  snapshot: VariableWorkspaceSnapshot,
): BotJobGraphMutationDraft['layoutRows'] =>
  snapshot.mutationCapability!.layoutRows.map(row => ({ ...row }));

/**
 * RELEASE clears only relationships carried by visible instruction facts.
 *
 * One instruction may receive one parent patch and one variable-binding patch.
 * A variable owner is released only when that exact owner instruction is in
 * the frozen visible scope. Hidden owners, definitions, and runtime values are
 * preserved.
 */
export const planVariablesBatchRelease = (
  snapshot: VariableWorkspaceSnapshot,
  visibleInstructionIds: readonly number[],
): PlanningResult<VariablesBatchReleasePlan> => {
  const authorityKey = variablesBatchConnectionsAuthorityKey(snapshot);
  if (authorityKey === null) {
    return failure(
      'MUTATION_UNAVAILABLE',
      'Variables batch relationship authoring is unavailable.',
    );
  }
  const visible = freezeVisibleInstructionIds(snapshot, visibleInstructionIds);
  if (isBatchConnectionFailure(visible)) return visible;

  const capability = snapshot.mutationCapability!;
  const visibleSet = new Set(visible);
  const relationPatches = new Map<number, InstructionGraphRelationPatch>();
  const bindingPatches =
    new Map<number, InstructionGraphVariableBindingPatch>();
  const ownerPatches =
    new Map<number, InstructionGraphVariableOwnerPatch>();
  const changedInstructionIds = new Set<number>();
  const authoritativeInstructionIds = new Set(
    capability.instructionFacts.map(fact => fact.instructionId),
  );
  const visibleBindingsByVariable = new Map<number, number[]>();

  capability.instructionFacts.forEach((fact) => {
    if (!visibleSet.has(fact.instructionId)) return;
    if (fact.parentId !== null || fact.parentBlockId !== null) {
      relationPatches.set(fact.instructionId, {
        instructionId: fact.instructionId,
        relationKind: fact.relationKind,
        operation: 'CLEAR',
        expected: {
          parentId: fact.parentId,
          parentBlockId: fact.parentBlockId,
        },
        replacement: {
          parentId: null,
          parentBlockId: null,
        },
      });
      changedInstructionIds.add(fact.instructionId);
    }
    if (fact.variableId !== null) {
      const boundInstructions =
        visibleBindingsByVariable.get(fact.variableId) ?? [];
      boundInstructions.push(fact.instructionId);
      visibleBindingsByVariable.set(fact.variableId, boundInstructions);
      bindingPatches.set(fact.instructionId, {
        instructionId: fact.instructionId,
        operation: 'CLEAR',
        expected: { value: fact.variableId },
        replacement: { value: null },
      });
      changedInstructionIds.add(fact.instructionId);
    }
  });
  capability.variableFacts.forEach((fact) => {
    if (fact.ownerInstructionId === null) return;
    const visibleOwner = visibleSet.has(fact.ownerInstructionId);
    const danglingOwner =
      !authoritativeInstructionIds.has(fact.ownerInstructionId);
    const visibleBindings =
      visibleBindingsByVariable.get(fact.variableId) ?? [];
    if (!visibleOwner && !(danglingOwner && visibleBindings.length > 0)) return;
    ownerPatches.set(fact.variableId, {
      variableId: fact.variableId,
      operation: 'CLEAR',
      expected: { value: fact.ownerInstructionId },
      replacement: { value: null },
    });
    if (visibleOwner) {
      changedInstructionIds.add(fact.ownerInstructionId);
    } else {
      visibleBindings.forEach(id => changedInstructionIds.add(id));
    }
  });

  return {
    ok: true,
    plan: {
      kind: 'RELEASE',
      authorityKey,
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      visibleInstructionIds: visible,
      changedInstructionIds: Object.freeze(
        visible.filter(id => changedInstructionIds.has(id)),
      ),
      draft: {
        mutationKind: 'RELATIONSHIP_UPDATE',
        draggedInstructionId: null,
        layoutRows: unchangedLayout(snapshot),
        instructionRelationPatches: [...relationPatches.values()],
        variableBindingPatches: [...bindingPatches.values()],
        variableOwnerPatches: [...ownerPatches.values()],
      },
    },
  };
};

const cloneFact = (
  fact: VariablesInstructionFact,
): VariablesInstructionFact => ({ ...fact });

const cloneVariableFact = (
  fact: VariablesVariableFact,
): VariablesVariableFact => ({ ...fact });

const projectedSnapshot = (
  basis: FrozenResolveBasis,
  projectedFacts: ReadonlyMap<number, VariablesInstructionFact>,
  projectedVariableFacts: ReadonlyMap<number, VariablesVariableFact> =
    basis.variableFactsById,
  projectedLayout: readonly InstructionGraphLayoutRow[] =
    basis.snapshot.mutationCapability!.layoutRows,
): VariableWorkspaceSnapshot => {
  const layoutById = new Map(
    projectedLayout.map(row => [row.instructionId, row]),
  );
  return {
    ...basis.snapshot,
    mutationCapability: {
      ...basis.snapshot.mutationCapability!,
      layoutRows: projectedLayout.map(row => ({ ...row })),
      instructionFacts: basis.snapshot.mutationCapability!.instructionFacts.map(
        (fact) => {
          const projected = cloneFact(
            projectedFacts.get(fact.instructionId) ?? fact,
          );
          const layout = layoutById.get(fact.instructionId);
          return layout
            ? {
                ...projected,
                blockId: layout.blockId,
                blockOrderNumber: layout.blockOrderNumber,
                instructionOrderNumber: layout.instructionOrderNumber,
              }
            : projected;
        },
      ),
      variableFacts: basis.snapshot.mutationCapability!.variableFacts.map(
        fact => cloneVariableFact(
          projectedVariableFacts.get(fact.variableId) ?? fact,
        ),
      ),
    },
  };
};

const editableIssueEdges = (
  graph: NonNullable<ReturnType<typeof variablesReconnectGraph>>,
  visible: ReadonlySet<number>,
  kinds: ReadonlySet<VariablesBatchEditableRelationshipKind>,
): Array<InstructionRelationshipEdge & {
  kind: VariablesBatchEditableRelationshipKind;
}> =>
  graph.edges.filter((edge): edge is InstructionRelationshipEdge & {
    kind: VariablesBatchEditableRelationshipKind;
  } =>
    edge.source.entity === 'INSTRUCTION'
    && visible.has(edge.source.id)
    && EDITABLE_KINDS.has(edge.kind as VariablesBatchEditableRelationshipKind)
    && kinds.has(edge.kind as VariablesBatchEditableRelationshipKind)
    && edge.state !== 'CONNECTED'
    && edge.state !== 'FIX_ORDER');

const scopedVariableIds = (
  basis: FrozenResolveBasis,
): ReadonlySet<number> => {
  const visible = new Set(basis.visibleInstructionIds);
  const ids = new Set<number>();
  basis.factsById.forEach((fact) => {
    if (visible.has(fact.instructionId) && fact.variableId !== null) {
      ids.add(fact.variableId);
    }
  });
  basis.variableFactsById.forEach((fact) => {
    if (
      fact.ownerInstructionId !== null
      && visible.has(fact.ownerInstructionId)
    ) {
      ids.add(fact.variableId);
    }
  });
  return ids;
};

const variableOwnerIssueEdges = (
  graph: NonNullable<ReturnType<typeof variablesReconnectGraph>>,
  variableIds: ReadonlySet<number>,
): InstructionRelationshipEdge[] =>
  graph.edges.filter(edge =>
    edge.kind === 'VARIABLE_OWNER'
    && edge.source.entity === 'VARIABLE'
    && variableIds.has(edge.source.id)
    && (
      edge.state === 'RECONNECT_PARENT'
      || edge.state === 'MEMORY_ONLY'
    ));

const executionOrderIssueEdges = (
  graph: NonNullable<ReturnType<typeof variablesReconnectGraph>>,
  visibleInstructionIds: ReadonlySet<number>,
): InstructionRelationshipEdge[] =>
  graph.edges.filter(edge =>
    edge.source.entity === 'INSTRUCTION'
    && visibleInstructionIds.has(edge.source.id)
    && edge.state === 'FIX_ORDER'
    && (
      edge.kind === 'ELEMENT_TARGET'
      || edge.kind === 'LOOP_ANCHOR'
      || edge.kind === 'VARIABLE_ORDER'
    ));

type InstructionOrderConstraint = Readonly<{
  sourceInstructionId: number;
  targetInstructionId: number;
}>;

/**
 * Apply every reviewed "target before source" constraint together.
 *
 * The sort is stable inside each Block, never changes block ownership, and
 * refuses cycles. Applying all constraints as one graph prevents a later move
 * from invalidating an order repair applied earlier in the same mutation.
 */
const applyStableOrderConstraints = (
  rows: readonly InstructionGraphLayoutRow[],
  constraints: readonly InstructionOrderConstraint[],
): InstructionGraphLayoutRow[] | null => {
  const rowByInstruction = new Map(
    rows.map(row => [row.instructionId, row] as const),
  );
  const rowsByBlock = new Map<number, InstructionGraphLayoutRow[]>();
  rows.forEach((row) => {
    const blockRows = rowsByBlock.get(row.blockId) ?? [];
    blockRows.push({ ...row });
    rowsByBlock.set(row.blockId, blockRows);
  });
  const constraintsByBlock =
    new Map<number, InstructionOrderConstraint[]>();
  for (const constraint of constraints) {
    const source = rowByInstruction.get(constraint.sourceInstructionId);
    const target = rowByInstruction.get(constraint.targetInstructionId);
    if (
      !source
      || !target
      || source.instructionId === target.instructionId
      || source.blockId !== target.blockId
    ) {
      return null;
    }
    const blockConstraints = constraintsByBlock.get(source.blockId) ?? [];
    blockConstraints.push(constraint);
    constraintsByBlock.set(source.blockId, blockConstraints);
  }

  const orderedByBlock = new Map<number, InstructionGraphLayoutRow[]>();
  for (const [blockId, blockRows] of rowsByBlock) {
    const blockConstraints = constraintsByBlock.get(blockId) ?? [];
    if (blockConstraints.length === 0) {
      orderedByBlock.set(blockId, blockRows);
      continue;
    }
    const originalIndex = new Map(
      blockRows.map((row, index) => [row.instructionId, index] as const),
    );
    const successors = new Map<number, Set<number>>();
    const indegree = new Map<number, number>(
      blockRows.map(row => [row.instructionId, 0] as const),
    );
    blockConstraints.forEach(({ sourceInstructionId, targetInstructionId }) => {
      const targetSuccessors =
        successors.get(targetInstructionId) ?? new Set<number>();
      if (!targetSuccessors.has(sourceInstructionId)) {
        targetSuccessors.add(sourceInstructionId);
        successors.set(targetInstructionId, targetSuccessors);
        indegree.set(
          sourceInstructionId,
          (indegree.get(sourceInstructionId) ?? 0) + 1,
        );
      }
    });
    const ready = blockRows
      .filter(row => indegree.get(row.instructionId) === 0)
      .map(row => row.instructionId);
    const sortedIds: number[] = [];
    while (ready.length > 0) {
      ready.sort((left, right) =>
        (originalIndex.get(left) ?? Number.MAX_SAFE_INTEGER)
        - (originalIndex.get(right) ?? Number.MAX_SAFE_INTEGER));
      const current = ready.shift()!;
      sortedIds.push(current);
      (successors.get(current) ?? []).forEach((successor) => {
        const nextIndegree = (indegree.get(successor) ?? 0) - 1;
        indegree.set(successor, nextIndegree);
        if (nextIndegree === 0) ready.push(successor);
      });
    }
    if (sortedIds.length !== blockRows.length) return null;
    orderedByBlock.set(
      blockId,
      sortedIds.map((instructionId, index) => ({
        ...rowByInstruction.get(instructionId)!,
        instructionOrderNumber: index + 1,
      })),
    );
  }

  const emittedBlocks = new Set<number>();
  const result: InstructionGraphLayoutRow[] = [];
  rows.forEach((row) => {
    if (emittedBlocks.has(row.blockId)) return;
    emittedBlocks.add(row.blockId);
    result.push(...(orderedByBlock.get(row.blockId) ?? []));
  });
  return result;
};

const replacementParent = (
  edge: InstructionRelationshipEdge,
  target: RelationshipTarget,
  factsById: ReadonlyMap<number, VariablesInstructionFact>,
): { parentId: number | null; parentBlockId: number | null } | null => {
  if (edge.kind === 'BLOCK_TARGET') {
    return target.entity === 'BLOCK'
      ? { parentId: null, parentBlockId: target.id }
      : null;
  }
  if (target.entity !== 'INSTRUCTION') return null;
  const targetFact = factsById.get(target.id);
  return targetFact
    ? { parentId: target.id, parentBlockId: targetFact.blockId }
    : null;
};

const changesParent = (
  edge: InstructionRelationshipEdge,
  target: RelationshipTarget,
  factsById: ReadonlyMap<number, VariablesInstructionFact>,
): boolean => {
  if (edge.source.entity !== 'INSTRUCTION') return false;
  const source = factsById.get(edge.source.id);
  const replacement = replacementParent(edge, target, factsById);
  return Boolean(
    source
    && replacement
    && (
      source.parentId !== replacement.parentId
      || source.parentBlockId !== replacement.parentBlockId
    ),
  );
};

const changesVariable = (
  edge: InstructionRelationshipEdge,
  target: RelationshipTarget,
  factsById: ReadonlyMap<number, VariablesInstructionFact>,
): boolean => {
  if (
    edge.kind !== 'VARIABLE_BINDING'
    || edge.source.entity !== 'INSTRUCTION'
    || target.entity !== 'VARIABLE'
  ) {
    return false;
  }
  return factsById.get(edge.source.id)?.variableId !== target.id;
};

const compatibleChangingTargets = (
  edge: InstructionRelationshipEdge,
  factsById: ReadonlyMap<number, VariablesInstructionFact>,
): readonly RelationshipTarget[] => Object.freeze(
  edge.compatibleTargets.filter(target =>
    edge.kind === 'VARIABLE_BINDING'
      ? changesVariable(edge, target, factsById)
      : changesParent(edge, target, factsById)),
);

type ChoiceIndexResult =
  | { ok: true; choices: ReadonlyMap<string, VariablesBatchResolveChoice> }
  | VariablesBatchConnectionFailure;

const indexChoices = (
  choices: readonly VariablesBatchResolveChoice[],
): ChoiceIndexResult => {
  const indexed = new Map<string, VariablesBatchResolveChoice>();
  for (const choice of choices) {
    if (indexed.has(choice.reviewId)) {
      return failure(
        'DUPLICATE_REVIEW_CHOICE',
        `Relationship review ${choice.reviewId} has more than one choice.`,
      );
    }
    indexed.set(choice.reviewId, choice);
  }
  return { ok: true, choices: indexed };
};

const selectReviewTarget = (
  reviewId: string,
  compatibleTargets: readonly RelationshipTarget[],
  choices: ReadonlyMap<string, VariablesBatchResolveChoice>,
): {
  selectedTarget: RelationshipTarget | null;
  resolution: VariablesBatchResolveResolution;
} | VariablesBatchConnectionFailure => {
  const choice = choices.get(reviewId);
  if (choice?.mode === 'SKIP') {
    return { selectedTarget: null, resolution: 'SKIPPED' };
  }
  if (choice?.mode === 'CONNECT') {
    const selected = compatibleTargets.find(target =>
      sameTarget(target, choice.target));
    return selected
      ? { selectedTarget: selected, resolution: 'REVIEWED' }
      : failure(
          'INCOMPATIBLE_REVIEW_TARGET',
          `The selected target is not compatible with ${reviewId}.`,
        );
  }
  if (compatibleTargets.length === 0) {
    return { selectedTarget: null, resolution: 'UNAVAILABLE' };
  }
  if (compatibleTargets.length === 1) {
    return { selectedTarget: compatibleTargets[0], resolution: 'AUTO' };
  }
  return { selectedTarget: null, resolution: 'REVIEW_REQUIRED' };
};

type DerivedReviewResult =
  | {
      ok: true;
      review: VariablesBatchResolveReview;
      projectedFacts: ReadonlyMap<number, VariablesInstructionFact>;
      projectedVariableFacts: ReadonlyMap<number, VariablesVariableFact>;
      projectedLayout: readonly InstructionGraphLayoutRow[];
    }
  | VariablesBatchConnectionFailure;

const deriveResolveReview = (
  basis: FrozenResolveBasis,
  submittedChoices: readonly VariablesBatchResolveChoice[],
): DerivedReviewResult => {
  const indexed = indexChoices(submittedChoices);
  if (!indexed.ok) return indexed;
  const remainingChoiceIds = new Set(indexed.choices.keys());
  const visibleSet = new Set(basis.visibleInstructionIds);
  const baseGraph = variablesReconnectGraph(basis.snapshot);
  if (!baseGraph) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative relationship graph could not be constructed.',
    );
  }

  const projectedFacts = new Map(
    [...basis.factsById].map(([id, fact]) => [id, cloneFact(fact)]),
  );
  const projectedVariableFacts = new Map(
    [...basis.variableFactsById].map(
      ([id, fact]) => [id, cloneVariableFact(fact)],
    ),
  );
  let projectedLayout = basis.snapshot.mutationCapability!.layoutRows.map(
    row => ({ ...row }),
  );
  const items: VariablesBatchResolveReviewItem[] = [];
  const unresolvedParentBySource = new Map<number, string>();

  const ownerEdges = variableOwnerIssueEdges(
    baseGraph,
    scopedVariableIds(basis),
  );
  for (const edge of ownerEdges) {
    const sourceVariableId = edge.source.id;
    const reviewId = reviewIdFor(
      'VARIABLE',
      sourceVariableId,
      'VARIABLE_OWNER',
    );
    const authoritative = projectedVariableFacts.get(sourceVariableId);
    if (!authoritative) {
      return failure(
        'AUTHORITATIVE_GRAPH_INVALID',
        `Variable #${sourceVariableId} has no authoritative owner fact.`,
      );
    }
    const compatibleTargets = Object.freeze(
      edge.compatibleTargets.filter(target =>
        target.entity === 'INSTRUCTION'
        && target.id !== authoritative.ownerInstructionId),
    );
    const selection = selectReviewTarget(
      reviewId,
      compatibleTargets,
      indexed.choices,
    );
    if ('ok' in selection) return selection;
    remainingChoiceIds.delete(reviewId);
    const currentTarget: RelationshipTarget | null =
      authoritative.ownerInstructionId === null
        ? null
        : {
            entity: 'INSTRUCTION',
            owner: edge.source.owner,
            id: authoritative.ownerInstructionId,
          };
    items.push(Object.freeze({
      reviewId,
      sourceEntity: 'VARIABLE',
      sourceId: sourceVariableId,
      sourceInstructionId: null,
      sourceVariableId,
      kind: 'VARIABLE_OWNER',
      state: edge.state,
      code: edge.code,
      currentTarget,
      compatibleTargets,
      selectedTarget: selection.selectedTarget,
      resolution: selection.resolution,
      blockedByReviewId: null,
    }));
    if (selection.selectedTarget?.entity === 'INSTRUCTION') {
      projectedVariableFacts.set(sourceVariableId, {
        ...authoritative,
        ownerInstructionId: selection.selectedTarget.id,
      });
    }
  }

  const graphAfterOwners = variablesReconnectGraph(
    projectedSnapshot(
      basis,
      projectedFacts,
      projectedVariableFacts,
      projectedLayout,
    ),
  );
  if (!graphAfterOwners) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The projected variable-owner graph could not be constructed.',
    );
  }
  const parentEdges = editableIssueEdges(
    graphAfterOwners,
    visibleSet,
    PARENT_KINDS,
  );

  for (const edge of parentEdges) {
    const sourceInstructionId = edge.source.id;
    const reviewId = reviewIdFor(
      'INSTRUCTION',
      sourceInstructionId,
      edge.kind,
    );
    const compatibleTargets =
      compatibleChangingTargets(edge, basis.factsById);
    const selection = selectReviewTarget(
      reviewId,
      compatibleTargets,
      indexed.choices,
    );
    if ('ok' in selection) return selection;
    remainingChoiceIds.delete(reviewId);
    const item: VariablesBatchResolveReviewItem = {
      reviewId,
      sourceEntity: 'INSTRUCTION',
      sourceId: sourceInstructionId,
      sourceInstructionId,
      sourceVariableId: null,
      kind: edge.kind as VariablesBatchEditableRelationshipKind,
      state: edge.state,
      code: edge.code,
      currentTarget: edge.target,
      compatibleTargets,
      selectedTarget: selection.selectedTarget,
      resolution: selection.resolution,
      blockedByReviewId: null,
    };
    items.push(Object.freeze(item));
    if (selection.selectedTarget === null) {
      unresolvedParentBySource.set(sourceInstructionId, reviewId);
      continue;
    }
    const fact = projectedFacts.get(sourceInstructionId);
    const replacement = replacementParent(
      edge,
      selection.selectedTarget,
      projectedFacts,
    );
    if (!fact || !replacement) {
      return failure(
        'AUTHORITATIVE_GRAPH_INVALID',
        `Relationship ${reviewId} has no authoritative source or target fact.`,
      );
    }
    projectedFacts.set(sourceInstructionId, {
      ...fact,
      parentId: replacement.parentId,
      parentBlockId: replacement.parentBlockId,
    });
  }

  const graphAfterParents = variablesReconnectGraph(
    projectedSnapshot(
      basis,
      projectedFacts,
      projectedVariableFacts,
      projectedLayout,
    ),
  );
  if (!graphAfterParents) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The projected relationship graph could not be constructed.',
    );
  }
  const variableEdges = editableIssueEdges(
    graphAfterParents,
    visibleSet,
    new Set<VariablesBatchEditableRelationshipKind>(['VARIABLE_BINDING']),
  );
  for (const edge of variableEdges) {
    const sourceInstructionId = edge.source.id;
    const reviewId = reviewIdFor(
      'INSTRUCTION',
      sourceInstructionId,
      'VARIABLE_BINDING',
    );
    const blockedByReviewId =
      unresolvedParentBySource.get(sourceInstructionId) ?? null;
    if (blockedByReviewId !== null) {
      if (indexed.choices.has(reviewId)) {
        return failure(
          'PARENT_REVIEW_REQUIRED',
          `Resolve ${blockedByReviewId} before choosing ${reviewId}.`,
        );
      }
      items.push(Object.freeze({
        reviewId,
        sourceEntity: 'INSTRUCTION',
        sourceId: sourceInstructionId,
        sourceInstructionId,
        sourceVariableId: null,
        kind: 'VARIABLE_BINDING',
        state: edge.state,
        code: edge.code,
        currentTarget: edge.target,
        compatibleTargets: Object.freeze([]),
        selectedTarget: null,
        resolution: 'BLOCKED',
        blockedByReviewId,
      }));
      continue;
    }

    const compatibleTargets =
      compatibleChangingTargets(edge, projectedFacts);
    const selection = selectReviewTarget(
      reviewId,
      compatibleTargets,
      indexed.choices,
    );
    if ('ok' in selection) return selection;
    remainingChoiceIds.delete(reviewId);
    items.push(Object.freeze({
      reviewId,
      sourceEntity: 'INSTRUCTION',
      sourceId: sourceInstructionId,
      sourceInstructionId,
      sourceVariableId: null,
      kind: 'VARIABLE_BINDING',
      state: edge.state,
      code: edge.code,
      currentTarget: edge.target,
      compatibleTargets,
      selectedTarget: selection.selectedTarget,
      resolution: selection.resolution,
      blockedByReviewId: null,
    }));
    if (selection.selectedTarget?.entity === 'VARIABLE') {
      const fact = projectedFacts.get(sourceInstructionId);
      if (!fact) {
        return failure(
          'AUTHORITATIVE_GRAPH_INVALID',
          `Instruction #${sourceInstructionId} has no authoritative fact.`,
        );
      }
      projectedFacts.set(sourceInstructionId, {
        ...fact,
        variableId: selection.selectedTarget.id,
      });
    }
  }

  const graphAfterBindings = variablesReconnectGraph(
    projectedSnapshot(
      basis,
      projectedFacts,
      projectedVariableFacts,
      projectedLayout,
    ),
  );
  if (!graphAfterBindings) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The projected variable-binding graph could not be constructed.',
    );
  }
  const orderSelections: Array<{
    sourceInstructionId: number;
    targetInstructionId: number;
  }> = [];
  const orderEdges = executionOrderIssueEdges(
    graphAfterBindings,
    visibleSet,
  );
  const orderLayout = projectedLayout;
  for (const edge of orderEdges) {
    const sourceInstructionId = edge.source.id;
    const sourceLayout = orderLayout.find(row =>
      row.instructionId === sourceInstructionId);
    const kind = edge.kind === 'VARIABLE_ORDER'
      ? 'VARIABLE_ORDER'
      : edge.kind as Extract<
          VariablesBatchEditableRelationshipKind,
          'ELEMENT_TARGET' | 'LOOP_ANCHOR'
        >;
    const reviewId = reviewIdFor(
      'INSTRUCTION',
      sourceInstructionId,
      kind,
    );
    const targets = new Map<string, RelationshipTarget>();
    if (
      edge.target?.entity === 'INSTRUCTION'
      && sourceLayout
      && orderLayout.find(row =>
        row.instructionId === edge.target?.id)?.blockId
        === sourceLayout.blockId
    ) {
      targets.set(targetKey(edge.target), edge.target);
    }
    edge.compatibleTargets.forEach((target) => {
      const targetLayout = target.entity === 'INSTRUCTION'
        ? orderLayout.find(row => row.instructionId === target.id)
        : null;
      if (
        target.entity === 'INSTRUCTION'
        && target.id !== sourceInstructionId
        && sourceLayout
        && targetLayout?.blockId === sourceLayout.blockId
      ) {
        targets.set(targetKey(target), target);
      }
    });
    const compatibleTargets = Object.freeze([...targets.values()]);
    const selection = selectReviewTarget(
      reviewId,
      compatibleTargets,
      indexed.choices,
    );
    if ('ok' in selection) return selection;
    remainingChoiceIds.delete(reviewId);
    items.push(Object.freeze({
      reviewId,
      sourceEntity: 'INSTRUCTION',
      sourceId: sourceInstructionId,
      sourceInstructionId,
      sourceVariableId: null,
      kind,
      state: edge.state,
      code: edge.code,
      currentTarget: edge.target,
      compatibleTargets,
      selectedTarget: selection.selectedTarget,
      resolution: selection.resolution,
      blockedByReviewId: null,
    }));
    if (selection.selectedTarget?.entity === 'INSTRUCTION') {
      orderSelections.push({
        sourceInstructionId,
        targetInstructionId: selection.selectedTarget.id,
      });
    }
  }

  if (orderSelections.length > 0) {
    const ordered = applyStableOrderConstraints(
      projectedLayout,
      orderSelections,
    );
    if (!ordered) {
      return failure(
        'AUTHORITATIVE_GRAPH_INVALID',
        'The reviewed execution-order relationships are cyclic or cross Block boundaries.',
      );
    }
    projectedLayout = ordered;
  }

  const unknownChoice = [...remainingChoiceIds][0];
  if (unknownChoice !== undefined) {
    return failure(
      'UNKNOWN_REVIEW_CHOICE',
      `Relationship review ${unknownChoice} is not part of this frozen plan.`,
    );
  }

  const frozenItems = Object.freeze(items);
  return {
    ok: true,
    review: {
      items: frozenItems,
      reviewRequiredCount: items.filter(
        item => item.resolution === 'REVIEW_REQUIRED',
      ).length,
      unavailableCount: items.filter(
        item => item.resolution === 'UNAVAILABLE',
      ).length,
      blockedCount: items.filter(
        item => item.resolution === 'BLOCKED',
      ).length,
    },
    projectedFacts,
    projectedVariableFacts,
    projectedLayout: Object.freeze(projectedLayout.map(row =>
      Object.freeze({ ...row }))),
  };
};

export const planVariablesBatchResolve = (
  snapshot: VariableWorkspaceSnapshot,
  visibleInstructionIds: readonly number[],
): PlanningResult<VariablesBatchResolvePlan> => {
  const authorityKey = variablesBatchConnectionsAuthorityKey(snapshot);
  if (authorityKey === null) {
    return failure(
      'MUTATION_UNAVAILABLE',
      'Variables batch relationship authoring is unavailable.',
    );
  }
  const visible = freezeVisibleInstructionIds(snapshot, visibleInstructionIds);
  if (isBatchConnectionFailure(visible)) return visible;
  const basisSnapshot = frozenSnapshot(snapshot);
  const factsById = new Map(
    basisSnapshot.mutationCapability!.instructionFacts.map(
      fact => [fact.instructionId, fact],
    ),
  );
  const variableFactsById = new Map(
    basisSnapshot.mutationCapability!.variableFacts.map(
      fact => [fact.variableId, fact],
    ),
  );
  const basis: FrozenResolveBasis = Object.freeze({
    snapshot: basisSnapshot,
    visibleInstructionIds: visible,
    factsById,
    variableFactsById,
  });
  const derived = deriveResolveReview(basis, []);
  if (!derived.ok) return derived;
  return {
    ok: true,
    plan: {
      kind: 'RESOLVE',
      authorityKey,
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      visibleInstructionIds: visible,
      reviewItems: derived.review.items,
      basis,
    },
  };
};

export const reviewVariablesBatchResolve = (
  plan: VariablesBatchResolvePlan,
  choices: readonly VariablesBatchResolveChoice[],
): ReviewResult => {
  const derived = deriveResolveReview(plan.basis, choices);
  return derived.ok
    ? { ok: true, review: derived.review }
    : derived;
};

export const buildVariablesBatchResolveMutation = (
  plan: VariablesBatchResolvePlan,
  choices: readonly VariablesBatchResolveChoice[],
): MutationResult => {
  const derived = deriveResolveReview(plan.basis, choices);
  if (!derived.ok) return derived;
  if (derived.review.reviewRequiredCount > 0) {
    return failure(
      'REVIEW_REQUIRED',
      'Review every relationship with multiple compatible targets before applying.',
    );
  }

  const relationPatches = new Map<number, InstructionGraphRelationPatch>();
  const bindingPatches =
    new Map<number, InstructionGraphVariableBindingPatch>();
  const ownerPatches =
    new Map<number, InstructionGraphVariableOwnerPatch>();
  const changedInstructionIds = new Set<number>();

  derived.review.items.forEach((item) => {
    const target = item.selectedTarget;
    if (target === null) return;
    if (item.state === 'FIX_ORDER' && item.sourceInstructionId !== null) {
      changedInstructionIds.add(item.sourceInstructionId);
    }
    if (item.kind === 'VARIABLE_OWNER') {
      if (
        item.sourceVariableId === null
        || target.entity !== 'INSTRUCTION'
      ) {
        return;
      }
      const sourceVariable = plan.basis.variableFactsById.get(
        item.sourceVariableId,
      );
      if (
        !sourceVariable
        || sourceVariable.ownerInstructionId === target.id
      ) {
        return;
      }
      ownerPatches.set(item.sourceVariableId, {
        variableId: item.sourceVariableId,
        operation: 'SET',
        expected: { value: sourceVariable.ownerInstructionId },
        replacement: { value: target.id },
      });
      changedInstructionIds.add(target.id);
      return;
    }
    if (item.kind === 'VARIABLE_ORDER') {
      if (item.sourceInstructionId !== null) {
        changedInstructionIds.add(item.sourceInstructionId);
      }
      return;
    }
    if (item.sourceInstructionId === null) return;
    const source = plan.basis.factsById.get(item.sourceInstructionId);
    if (!source) return;
    if (item.kind === 'VARIABLE_BINDING') {
      if (target.entity !== 'VARIABLE' || source.variableId === target.id) return;
      bindingPatches.set(item.sourceInstructionId, {
        instructionId: item.sourceInstructionId,
        operation: 'SET',
        expected: { value: source.variableId },
        replacement: { value: target.id },
      });
      changedInstructionIds.add(item.sourceInstructionId);
      return;
    }
    const replacement = replacementParent(
      {
        kind: item.kind,
        source: {
          entity: 'INSTRUCTION',
          owner: target.owner,
          id: item.sourceInstructionId,
        },
      } as InstructionRelationshipEdge,
      target,
      plan.basis.factsById,
    );
    if (
      !replacement
      || (
        source.parentId === replacement.parentId
        && source.parentBlockId === replacement.parentBlockId
      )
    ) {
      return;
    }
    relationPatches.set(item.sourceInstructionId, {
      instructionId: item.sourceInstructionId,
      relationKind: item.kind,
      operation: 'SET',
      expected: {
        parentId: source.parentId,
        parentBlockId: source.parentBlockId,
      },
      replacement,
    });
    changedInstructionIds.add(item.sourceInstructionId);
  });

  const authoritativeLayout =
    plan.basis.snapshot.mutationCapability!.layoutRows;
  const layoutChanged =
    derived.projectedLayout.length === authoritativeLayout.length
    && derived.projectedLayout.some((row, index) => {
      const before = authoritativeLayout[index];
      return before.instructionId !== row.instructionId
        || before.blockId !== row.blockId
        || before.blockOrderNumber !== row.blockOrderNumber
        || before.instructionOrderNumber !== row.instructionOrderNumber;
    });
  const firstMovedInstructionId = derived.review.items.find(item =>
    item.state === 'FIX_ORDER'
    && item.selectedTarget !== null
    && item.sourceInstructionId !== null)?.sourceInstructionId ?? null;

  if (
    relationPatches.size === 0
    && bindingPatches.size === 0
    && ownerPatches.size === 0
    && !layoutChanged
  ) {
    return failure(
      'NO_CHANGES',
      'No reviewed visible relationship requires an update.',
    );
  }
  return {
    ok: true,
    mutation: {
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      draft: {
        mutationKind: layoutChanged ? 'ROW_MOVE' : 'RELATIONSHIP_UPDATE',
        draggedInstructionId: layoutChanged
          ? firstMovedInstructionId
          : null,
        layoutRows: derived.projectedLayout.map(row => ({ ...row })),
        instructionRelationPatches: [...relationPatches.values()],
        variableBindingPatches: [...bindingPatches.values()],
        variableOwnerPatches: [...ownerPatches.values()],
      },
      review: derived.review,
      changedInstructionIds: Object.freeze(
        authoritativeLayout
          .map(row => row.instructionId)
          .filter(id => changedInstructionIds.has(id)),
      ),
    },
  };
};
