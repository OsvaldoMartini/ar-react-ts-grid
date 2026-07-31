import type {
  BotJobGraphMutationDraft,
  InstructionGraphVariableBindingPatch,
  InstructionGraphVariableOwnerPatch,
  InstructionGraphRelationPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
} from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariableGraphEntry,
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  variablesBatchConnectionsAuthorityKey,
} from './variablesBatchConnections';
import { VARIABLES_REACT_AUTHORED_PROFILE } from './variablesReconnectMutation';

export interface VariableFlowOwnerFact {
  variableId: number;
  ownerInstructionId: number | null;
}

type CapabilityWithVariableFacts =
  NonNullable<VariableWorkspaceSnapshot['mutationCapability']> & {
    variableFacts?: readonly VariableFlowOwnerFact[];
  };

export interface VariableFlowWebElementCandidate {
  instructionId: number;
  blockId: number;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  name: string;
  action: string;
  tagName: string | null;
  existingVariableIds: readonly number[];
  compatibleGetInstructionIds: readonly number[];
}

export interface VariableFlowGetCandidate {
  instructionId: number;
  blockId: number;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  name: string;
  currentParentId: number | null;
  currentParentBlockId: number | null;
  currentVariableId: number | null;
}

export interface VariableFlowRepairChoice {
  webElementInstructionId: number;
  getInstructionId: number;
}

export interface VariableFlowRepairReview {
  webElement: VariableFlowWebElementCandidate;
  get: VariableFlowGetCandidate;
  variable: Pick<VariableGraphEntry, 'id' | 'name' | 'type'>;
  executionOrderIssueInstructionIds: readonly number[];
  reassignedVariableId: number | null;
  duplicateOwnerVariableIds: readonly number[];
}

type FrozenVariableFlowBasis = {
  snapshot: VariableWorkspaceSnapshot;
  factsById: ReadonlyMap<number, VariablesInstructionFact>;
  ownerFactsByVariableId: ReadonlyMap<number, VariableFlowOwnerFact>;
};

export interface VariableFlowRepairPlan {
  authorityKey: string;
  mutationProfile: typeof VARIABLES_REACT_AUTHORED_PROFILE;
  variableId: number;
  variable: Pick<VariableGraphEntry, 'id' | 'name' | 'type'>;
  currentOwnerInstructionId: number | null;
  webElementCandidates: readonly VariableFlowWebElementCandidate[];
  getCandidates: readonly VariableFlowGetCandidate[];
  unchangedLayout: BotJobGraphMutationDraft['layoutRows'];
  readonly basis: FrozenVariableFlowBasis;
}

export type VariableFlowRepairErrorCode =
  | 'MUTATION_UNAVAILABLE'
  | 'VARIABLE_NOT_FOUND'
  | 'VARIABLE_OWNER_FACTS_UNAVAILABLE'
  | 'AUTHORITATIVE_GRAPH_INVALID'
  | 'WEB_ELEMENT_REQUIRED'
  | 'GET_REQUIRED'
  | 'INCOMPATIBLE_WEB_ELEMENT'
  | 'INCOMPATIBLE_GET'
  | 'NO_CHANGES';

export type VariableFlowRepairFailure = {
  ok: false;
  code: VariableFlowRepairErrorCode;
  message: string;
};

export type VariableFlowRepairPlanningResult =
  | { ok: true; plan: VariableFlowRepairPlan }
  | VariableFlowRepairFailure;

export type VariableFlowRepairReviewResult =
  | { ok: true; review: VariableFlowRepairReview }
  | VariableFlowRepairFailure;

export type VariableFlowRepairMutationResult =
  | {
      ok: true;
      mutationProfile: typeof VARIABLES_REACT_AUTHORED_PROFILE;
      draft: BotJobGraphMutationDraft;
      review: VariableFlowRepairReview;
      changedInstructionIds: readonly number[];
      changedVariableIds: readonly number[];
    }
  | VariableFlowRepairFailure;

const failure = (
  code: VariableFlowRepairErrorCode,
  message: string,
): VariableFlowRepairFailure => ({ ok: false, code, message });

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const compareFact = (
  left: VariablesInstructionFact,
  right: VariablesInstructionFact,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

const effectivelyActive = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): boolean => {
  const command = snapshot.commands.find(candidate =>
    candidate.id === instructionId);
  if (!command) return false;
  const block = snapshot.blocks.find(candidate =>
    candidate.id === command.blockId);
  return command.active === true
    && (command.blockActive ?? block?.active) === true;
};

const supportsVariableType = (
  action: string,
  variableType: string,
): boolean => {
  const allowed = instructionRelationshipPolicy(action).allowedVariableTypes;
  return allowed.length === 0 || allowed.includes(variableType);
};

const commandName = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): string =>
  snapshot.commands.find(command => command.id === instructionId)?.name
  || canonicalInstructionAction(
    snapshot.mutationCapability?.instructionFacts.find(
      fact => fact.instructionId === instructionId,
    )?.action,
  )
  || `Instruction ${instructionId}`;

const frozenSnapshot = (
  snapshot: VariableWorkspaceSnapshot,
): VariableWorkspaceSnapshot => {
  const capability = snapshot.mutationCapability as
    | CapabilityWithVariableFacts
    | null;
  return Object.freeze({
    ...snapshot,
    blocks: Object.freeze(snapshot.blocks.map(block =>
      Object.freeze({ ...block }))),
    commands: Object.freeze(snapshot.commands.map(command =>
      Object.freeze({ ...command }))),
    variables: Object.freeze(snapshot.variables.map(variable =>
      Object.freeze({
        ...variable,
        owner: variable.owner === null
          ? null
          : Object.freeze({ ...variable.owner }),
      }))),
    mutationCapability: capability === null
      ? null
      : Object.freeze({
          ...capability,
          ownerAssertion: Object.freeze({ ...capability.ownerAssertion }),
          layoutRows: Object.freeze(capability.layoutRows.map(row =>
            Object.freeze({ ...row }))),
          instructionFacts: Object.freeze(capability.instructionFacts.map(
            fact => Object.freeze({ ...fact }),
          )),
          variableFacts: Object.freeze((capability.variableFacts ?? []).map(
            fact => Object.freeze({ ...fact }),
          )),
        }),
  }) as unknown as VariableWorkspaceSnapshot;
};

const ownerFacts = (
  snapshot: VariableWorkspaceSnapshot,
): readonly VariableFlowOwnerFact[] | null => {
  const capability = snapshot.mutationCapability as
    | CapabilityWithVariableFacts
    | null;
  if (!capability || !Array.isArray(capability.variableFacts)) return null;
  const seen = new Set<number>();
  const normalized: VariableFlowOwnerFact[] = [];
  for (const fact of capability.variableFacts) {
    if (
      !positiveInteger(fact.variableId)
      || (
        fact.ownerInstructionId !== null
        && !positiveInteger(fact.ownerInstructionId)
      )
      || seen.has(fact.variableId)
    ) {
      return null;
    }
    seen.add(fact.variableId);
    normalized.push({
      variableId: fact.variableId,
      ownerInstructionId: fact.ownerInstructionId,
    });
  }
  return normalized;
};

/**
 * Freeze the authoritative choices for repairing one complete
 * Web Element -> GET -> Variable flow.
 *
 * React owns candidate selection and the final v3 draft. Java remains the
 * compare-and-set persistence boundary.
 */
export const planVariableFlowRepair = (
  snapshot: VariableWorkspaceSnapshot,
  variableId: number,
): VariableFlowRepairPlanningResult => {
  const authorityKey = variablesBatchConnectionsAuthorityKey(snapshot);
  const capability = snapshot.mutationCapability as
    | CapabilityWithVariableFacts
    | null;
  if (
    authorityKey === null
    || !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return failure(
      'MUTATION_UNAVAILABLE',
      'Variable flow repair is unavailable for this workspace.',
    );
  }
  const variable = snapshot.variables.find(candidate =>
    candidate.id === variableId);
  if (!variable) {
    return failure(
      'VARIABLE_NOT_FOUND',
      `Variable #${variableId} is not in the current Variables graph.`,
    );
  }
  const authoritativeOwnerFacts = ownerFacts(snapshot);
  if (authoritativeOwnerFacts === null) {
    return failure(
      'VARIABLE_OWNER_FACTS_UNAVAILABLE',
      'Authoritative variable-owner facts are not available.',
    );
  }
  const variableIdSet = new Set(snapshot.variables.map(item => item.id));
  if (
    authoritativeOwnerFacts.length !== variableIdSet.size
    || authoritativeOwnerFacts.some(fact => !variableIdSet.has(fact.variableId))
  ) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'Authoritative variable-owner facts do not match the Variables graph.',
    );
  }
  const factsById = new Map(
    capability.instructionFacts.map(fact => [fact.instructionId, fact]),
  );
  if (
    factsById.size !== capability.instructionFacts.length
    || capability.instructionFacts.length !== capability.layoutRows.length
  ) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative instruction graph is incomplete.',
    );
  }
  const ownerFactsByVariableId = new Map(
    authoritativeOwnerFacts.map(fact => [fact.variableId, fact]),
  );
  const selectedOwnerFact = ownerFactsByVariableId.get(variableId);
  if (!selectedOwnerFact) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      `Variable #${variableId} has no authoritative owner fact.`,
    );
  }

  const getFacts = capability.instructionFacts.filter(fact =>
    canonicalInstructionAction(fact.action) === 'GET'
    && effectivelyActive(snapshot, fact.instructionId)
    && supportsVariableType(fact.action, variable.type));
  const existingVariableIdsByOwner = new Map<number, number[]>();
  authoritativeOwnerFacts.forEach((fact) => {
    if (fact.ownerInstructionId === null) return;
    const ids = existingVariableIdsByOwner.get(fact.ownerInstructionId) ?? [];
    ids.push(fact.variableId);
    existingVariableIdsByOwner.set(fact.ownerInstructionId, ids);
  });

  const webElementFacts = capability.instructionFacts
    .filter(fact =>
      instructionRelationshipPolicy(fact.action).role === 'WEB_ELEMENT')
    .sort(compareFact);
  const getCandidates: VariableFlowGetCandidate[] = getFacts
    .slice()
    .sort(compareFact)
    .map(fact => ({
      instructionId: fact.instructionId,
      blockId: fact.blockId,
      blockOrderNumber: fact.blockOrderNumber,
      instructionOrderNumber: fact.instructionOrderNumber,
      name: commandName(snapshot, fact.instructionId),
      currentParentId: fact.parentId,
      currentParentBlockId: fact.parentBlockId,
      currentVariableId: fact.variableId,
    }));
  const webElementCandidates: VariableFlowWebElementCandidate[] =
    webElementFacts.map(fact => ({
      instructionId: fact.instructionId,
      blockId: fact.blockId,
      blockOrderNumber: fact.blockOrderNumber,
      instructionOrderNumber: fact.instructionOrderNumber,
      name: commandName(snapshot, fact.instructionId),
      action: fact.action,
      tagName: snapshot.commands.find(command =>
        command.id === fact.instructionId)?.tagName ?? fact.tagName ?? null,
      existingVariableIds: Object.freeze([
        ...(existingVariableIdsByOwner.get(fact.instructionId) ?? []),
      ]),
      compatibleGetInstructionIds: Object.freeze(
        getCandidates
          .filter(get =>
            get.blockId === fact.blockId
            && get.instructionOrderNumber > fact.instructionOrderNumber)
          .map(get => get.instructionId),
      ),
    }));

  const frozen = frozenSnapshot(snapshot);
  const frozenCapability = frozen.mutationCapability as
    CapabilityWithVariableFacts;
  const frozenFactsById = new Map(
    frozenCapability.instructionFacts.map(fact =>
      [fact.instructionId, fact] as const),
  );
  const frozenOwnerFacts = new Map(
    (frozenCapability.variableFacts ?? []).map(fact =>
      [fact.variableId, fact] as const),
  );
  return {
    ok: true,
    plan: {
      authorityKey,
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      variableId,
      variable: Object.freeze({
        id: variable.id,
        name: variable.name,
        type: variable.type,
      }),
      currentOwnerInstructionId: selectedOwnerFact.ownerInstructionId,
      webElementCandidates: Object.freeze(webElementCandidates),
      getCandidates: Object.freeze(getCandidates),
      unchangedLayout: capability.layoutRows.map(row => ({ ...row })),
      basis: Object.freeze({
        snapshot: frozen,
        factsById: frozenFactsById,
        ownerFactsByVariableId: frozenOwnerFacts,
      }),
    },
  };
};

export const getVariableFlowGetCandidates = (
  plan: VariableFlowRepairPlan,
  webElementInstructionId: number | null,
): readonly VariableFlowGetCandidate[] => {
  if (webElementInstructionId === null) return Object.freeze([]);
  const webElement = plan.webElementCandidates.find(candidate =>
    candidate.instructionId === webElementInstructionId);
  if (!webElement) return Object.freeze([]);
  const compatible = new Set(webElement.compatibleGetInstructionIds);
  return Object.freeze(
    plan.getCandidates.filter(candidate =>
      compatible.has(candidate.instructionId)),
  );
};

export const validateVariableFlowRepairAuthority = (
  plan: Pick<VariableFlowRepairPlan, 'authorityKey'>,
  snapshot: VariableWorkspaceSnapshot,
): boolean =>
  variablesBatchConnectionsAuthorityKey(snapshot) === plan.authorityKey;

export const reviewVariableFlowRepair = (
  plan: VariableFlowRepairPlan,
  choice: Partial<VariableFlowRepairChoice>,
): VariableFlowRepairReviewResult => {
  if (!positiveInteger(choice.webElementInstructionId)) {
    return failure(
      'WEB_ELEMENT_REQUIRED',
      'Choose the Web Element that declares and supplies the variable.',
    );
  }
  const webElement = plan.webElementCandidates.find(candidate =>
    candidate.instructionId === choice.webElementInstructionId);
  if (!webElement) {
    return failure(
      'INCOMPATIBLE_WEB_ELEMENT',
      'The selected Web Element is not part of this frozen repair plan.',
    );
  }
  if (!positiveInteger(choice.getInstructionId)) {
    return failure(
      'GET_REQUIRED',
      'Choose the GET command that writes the variable.',
    );
  }
  const compatibleGetIds = new Set(webElement.compatibleGetInstructionIds);
  const get = plan.getCandidates.find(candidate =>
    candidate.instructionId === choice.getInstructionId);
  if (!get || !compatibleGetIds.has(get.instructionId)) {
    return failure(
      'INCOMPATIBLE_GET',
      'The selected GET is not active, ordered after, and in the same Block as the Web Element.',
    );
  }

  const getFact = plan.basis.factsById.get(get.instructionId)!;
  const executionOrderIssueInstructionIds =
    plan.basis.snapshot.mutationCapability!.instructionFacts
      .filter(fact =>
        fact.instructionId !== get.instructionId
        && fact.variableId === plan.variableId
        && effectivelyActive(plan.basis.snapshot, fact.instructionId)
        && instructionRelationshipPolicy(fact.action)
          .requirements.includes('VARIABLE_ORDER')
        && compareFact(fact, getFact) < 0)
      .sort(compareFact)
      .map(fact => fact.instructionId);
  return {
    ok: true,
    review: {
      webElement,
      get,
      variable: plan.variable,
      executionOrderIssueInstructionIds: Object.freeze(
        executionOrderIssueInstructionIds,
      ),
      reassignedVariableId:
        get.currentVariableId !== null
        && get.currentVariableId !== plan.variableId
          ? get.currentVariableId
          : null,
      duplicateOwnerVariableIds: Object.freeze(
        webElement.existingVariableIds.filter(id => id !== plan.variableId),
      ),
    },
  };
};

export const buildVariableFlowRepairMutation = (
  plan: VariableFlowRepairPlan,
  choice: VariableFlowRepairChoice,
): VariableFlowRepairMutationResult => {
  const reviewed = reviewVariableFlowRepair(plan, choice);
  if (!reviewed.ok) return reviewed;
  const { webElement, get } = reviewed.review;
  const getFact = plan.basis.factsById.get(get.instructionId);
  const ownerFact = plan.basis.ownerFactsByVariableId.get(plan.variableId);
  if (!getFact || !ownerFact) {
    return failure(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The frozen GET or variable owner fact is unavailable.',
    );
  }

  const relationPatches: InstructionGraphRelationPatch[] = [];
  const variableBindingPatches: InstructionGraphVariableBindingPatch[] = [];
  const variableOwnerPatches: InstructionGraphVariableOwnerPatch[] = [];
  if (
    getFact.parentId !== webElement.instructionId
    || getFact.parentBlockId !== webElement.blockId
  ) {
    relationPatches.push({
      instructionId: getFact.instructionId,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected: {
        parentId: getFact.parentId,
        parentBlockId: getFact.parentBlockId,
      },
      replacement: {
        parentId: webElement.instructionId,
        parentBlockId: webElement.blockId,
      },
    });
  }
  if (getFact.variableId !== plan.variableId) {
    variableBindingPatches.push({
      instructionId: getFact.instructionId,
      operation: 'SET',
      expected: { value: getFact.variableId },
      replacement: { value: plan.variableId },
    });
  }
  if (ownerFact.ownerInstructionId !== webElement.instructionId) {
    variableOwnerPatches.push({
      variableId: plan.variableId,
      operation: 'SET',
      expected: { value: ownerFact.ownerInstructionId },
      replacement: { value: webElement.instructionId },
    });
  }
  if (
    relationPatches.length === 0
    && variableBindingPatches.length === 0
    && variableOwnerPatches.length === 0
  ) {
    return failure(
      'NO_CHANGES',
      'The selected Web Element, GET, and variable are already connected.',
    );
  }
  return {
    ok: true,
    mutationProfile: plan.mutationProfile,
    draft: {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: plan.unchangedLayout.map(row => ({ ...row })),
      instructionRelationPatches: relationPatches,
      variableBindingPatches,
      variableOwnerPatches,
    },
    review: reviewed.review,
    changedInstructionIds: Object.freeze([
      ...(relationPatches.length > 0 || variableBindingPatches.length > 0
        ? [getFact.instructionId]
        : []),
    ]),
    changedVariableIds: Object.freeze([
      ...(variableOwnerPatches.length > 0 ? [plan.variableId] : []),
    ]),
  };
};
