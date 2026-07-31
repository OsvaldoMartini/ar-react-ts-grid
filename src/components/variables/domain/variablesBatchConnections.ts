import type {
  BotJobGraphMutationDraft,
  InstructionGraphRelationPatch,
  InstructionGraphVariableBindingPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type {
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
  RelationshipTarget,
} from '../../bot-job-details/grid/domain/instructionRelationshipGraph';
import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  VARIABLES_REACT_AUTHORED_PROFILE,
  variablesReconnectGraph,
} from './variablesReconnectMutation';

export type VariablesBatchEditableRelationshipKind = Extract<
  InstructionRelationshipKind,
  | 'ELEMENT_TARGET'
  | 'VARIABLE_BINDING'
  | 'LOOP_ANCHOR'
  | 'CONDITIONAL_ROOT'
  | 'BLOCK_TARGET'
>;

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
  sourceInstructionId: number;
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
  sourceInstructionId: number,
  kind: VariablesBatchEditableRelationshipKind,
): string => `${sourceInstructionId}:${kind}`;

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
 * Layout and variable ownership are always preserved.
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
  const changedInstructionIds = new Set<number>();

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
      bindingPatches.set(fact.instructionId, {
        instructionId: fact.instructionId,
        operation: 'CLEAR',
        expected: { value: fact.variableId },
        replacement: { value: null },
      });
      changedInstructionIds.add(fact.instructionId);
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
        variableOwnerPatches: [],
      },
    },
  };
};

const cloneFact = (
  fact: VariablesInstructionFact,
): VariablesInstructionFact => ({ ...fact });

const projectedSnapshot = (
  basis: FrozenResolveBasis,
  projectedFacts: ReadonlyMap<number, VariablesInstructionFact>,
): VariableWorkspaceSnapshot => ({
  ...basis.snapshot,
  mutationCapability: {
    ...basis.snapshot.mutationCapability!,
    instructionFacts: basis.snapshot.mutationCapability!.instructionFacts.map(
      fact => cloneFact(projectedFacts.get(fact.instructionId) ?? fact),
    ),
  },
});

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
  const items: VariablesBatchResolveReviewItem[] = [];
  const unresolvedParentBySource = new Map<number, string>();
  const parentEdges = editableIssueEdges(baseGraph, visibleSet, PARENT_KINDS);

  for (const edge of parentEdges) {
    const sourceInstructionId = edge.source.id;
    const reviewId = reviewIdFor(sourceInstructionId, edge.kind);
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
      sourceInstructionId,
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
    projectedSnapshot(basis, projectedFacts),
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
    const reviewId = reviewIdFor(sourceInstructionId, 'VARIABLE_BINDING');
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
        sourceInstructionId,
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
      sourceInstructionId,
      kind: 'VARIABLE_BINDING',
      state: edge.state,
      code: edge.code,
      currentTarget: edge.target,
      compatibleTargets,
      selectedTarget: selection.selectedTarget,
      resolution: selection.resolution,
      blockedByReviewId: null,
    }));
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
  const basis: FrozenResolveBasis = Object.freeze({
    snapshot: basisSnapshot,
    visibleInstructionIds: visible,
    factsById,
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
  const changedInstructionIds = new Set<number>();

  derived.review.items.forEach((item) => {
    const target = item.selectedTarget;
    if (target === null) return;
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

  if (relationPatches.size === 0 && bindingPatches.size === 0) {
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
        mutationKind: 'RELATIONSHIP_UPDATE',
        draggedInstructionId: null,
        layoutRows: plan.basis.snapshot.mutationCapability!.layoutRows.map(
          row => ({ ...row }),
        ),
        instructionRelationPatches: [...relationPatches.values()],
        variableBindingPatches: [...bindingPatches.values()],
        variableOwnerPatches: [],
      },
      review: derived.review,
      changedInstructionIds: Object.freeze(
        plan.visibleInstructionIds.filter(id => changedInstructionIds.has(id)),
      ),
    },
  };
};
