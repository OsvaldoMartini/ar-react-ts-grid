import type {
  BotJobGraphMutationDraft,
  InstructionGraphLayoutRow,
  InstructionGraphRelationKind,
  InstructionGraphRelationPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import { instructionRelationshipPolicy } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import {
  VARIABLES_REACT_AUTHORED_PROFILE,
  type VariablesInstructionFact,
  type VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { watchVariablesConditionalFreeMove } from './variablesConditionalFamilyWatcher';

export { VARIABLES_REACT_AUTHORED_PROFILE };

export type VariablesReactAuthoredProfile =
  typeof VARIABLES_REACT_AUTHORED_PROFILE;

export type VariablesFreeMoveRequest = {
  sourceInstructionId: number;
  destinationBlockId: number;
  /**
   * Zero-based final insertion index in the destination Block after removing
   * the source instruction from its current position.
   */
  destinationIndex: number;
};

export type VariablesFreeMoveErrorCode =
  | 'MUTATION_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'SOURCE_NOT_FOUND'
  | 'BLOCK_NOT_FOUND'
  | 'AUTHORITATIVE_GRAPH_INVALID'
  | 'DESTINATION_INDEX_OUT_OF_RANGE'
  | 'CONDITIONAL_FAMILY_INVALID'
  | 'CONDITIONAL_FAMILY_SPLIT'
  | 'CONDITIONAL_FAMILY_ORDER_INVALID'
  | 'CONDITIONAL_FAMILY_TRANSFER_REQUIRED'
  | 'NO_CHANGE';

export type VariablesFreeMoveClearReason =
  | 'PARENT_TARGET_MISSING'
  | 'PARENT_WRONG_BLOCK'
  | 'PARENT_BLOCK_PROJECTION_MISMATCH'
  | 'PARENT_NOT_PRECEDING'
  | 'BLOCK_TARGET_MISSING'
  | 'BLOCK_TARGET_OUTSIDE_WORKSPACE'
  | 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK';

export type VariablesFreeMoveClearedRelationship = {
  instructionId: number;
  relationKind: InstructionGraphRelationKind;
  reason: VariablesFreeMoveClearReason;
  expectedParentId: number | null;
  expectedParentBlockId: number | null;
};

export type VariablesFreeMovePlan = {
  mutationProfile: VariablesReactAuthoredProfile;
  sourceInstructionId: number;
  sourceBlockId: number;
  destinationBlockId: number;
  destinationIndex: number;
  preservedVariableId: number | null;
  clearedRelationships: readonly VariablesFreeMoveClearedRelationship[];
  draft: BotJobGraphMutationDraft;
};

export type VariablesFreeMoveResult =
  | { ok: true; plan: VariablesFreeMovePlan }
  | {
      ok: false;
      code: VariablesFreeMoveErrorCode;
      message: string;
    };

type RelationshipValidity =
  | { valid: true }
  | {
      valid: false;
      reason: VariablesFreeMoveClearReason;
    };

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const compareLayout = (
  left: InstructionGraphLayoutRow,
  right: InstructionGraphLayoutRow,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

const sameLayout = (
  left: readonly InstructionGraphLayoutRow[],
  right: readonly InstructionGraphLayoutRow[],
): boolean => {
  if (left.length !== right.length) return false;
  const rightById = new Map(right.map(row => [row.instructionId, row]));
  return left.every((row) => {
    const candidate = rightById.get(row.instructionId);
    return candidate?.blockId === row.blockId
      && candidate.blockOrderNumber === row.blockOrderNumber
      && candidate.instructionOrderNumber === row.instructionOrderNumber;
  });
};

const refusal = (
  code: VariablesFreeMoveErrorCode,
  message: string,
): VariablesFreeMoveResult => ({ ok: false, code, message });

const indexUnique = <T>(
  values: readonly T[],
  id: (value: T) => number,
): Map<number, T> | null => {
  const indexed = new Map<number, T>();
  for (const value of values) {
    const key = id(value);
    if (!positiveInteger(key) || indexed.has(key)) return null;
    indexed.set(key, value);
  }
  return indexed;
};

const normalizedBlockRows = (
  rows: readonly InstructionGraphLayoutRow[],
  blockId: number,
  blockOrderNumber: number,
): InstructionGraphLayoutRow[] =>
  rows.map((row, index) => ({
    ...row,
    blockId,
    blockOrderNumber,
    instructionOrderNumber: index + 1,
  }));

const relationValidity = (
  fact: VariablesInstructionFact,
  layoutByInstruction: ReadonlyMap<number, InstructionGraphLayoutRow>,
  workspaceBlockIds: ReadonlySet<number>,
): RelationshipValidity => {
  const containing = layoutByInstruction.get(fact.instructionId);
  if (!containing) {
    return { valid: false, reason: 'PARENT_TARGET_MISSING' };
  }

  if (fact.relationKind === 'BLOCK_TARGET') {
    if (fact.parentBlockId === null) {
      return { valid: false, reason: 'BLOCK_TARGET_MISSING' };
    }
    if (!workspaceBlockIds.has(fact.parentBlockId)) {
      return { valid: false, reason: 'BLOCK_TARGET_OUTSIDE_WORKSPACE' };
    }
    if (fact.parentBlockId === containing.blockId) {
      return {
        valid: false,
        reason: 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
      };
    }
    return { valid: true };
  }

  const policy = instructionRelationshipPolicy(fact.action);
  if (
    fact.relationKind === 'CONDITIONAL_ROOT'
    && policy.structuralSemantics === 'CONDITIONAL_ROOT'
    && fact.parentId === fact.instructionId
  ) {
    if (
      fact.parentBlockId !== null
      && fact.parentBlockId !== containing.blockId
    ) {
      return {
        valid: false,
        reason: 'PARENT_BLOCK_PROJECTION_MISMATCH',
      };
    }
    return { valid: true };
  }

  if (fact.parentId === null) {
    return { valid: false, reason: 'PARENT_TARGET_MISSING' };
  }
  const parent = layoutByInstruction.get(fact.parentId);
  if (!parent) {
    return { valid: false, reason: 'PARENT_TARGET_MISSING' };
  }
  if (parent.blockId !== containing.blockId) {
    return { valid: false, reason: 'PARENT_WRONG_BLOCK' };
  }
  // parentId is authoritative. Legacy rows may validly omit the optional
  // parentBlockId projection, but a present projection must remain exact.
  if (
    fact.parentBlockId !== null
    && fact.parentBlockId !== parent.blockId
  ) {
    return {
      valid: false,
      reason: 'PARENT_BLOCK_PROJECTION_MISMATCH',
    };
  }
  if (parent.instructionOrderNumber >= containing.instructionOrderNumber) {
    return { valid: false, reason: 'PARENT_NOT_PRECEDING' };
  }
  return { valid: true };
};

const clearPatch = (
  fact: VariablesInstructionFact,
): InstructionGraphRelationPatch => ({
  instructionId: fact.instructionId,
  relationKind: fact.relationKind,
  operation: 'CLEAR',
  expected: fact.relationKind === 'BLOCK_TARGET'
    ? {
        parentId: null,
        parentBlockId: fact.parentBlockId,
      }
    : {
        parentId: fact.parentId,
        parentBlockId: fact.parentBlockId,
      },
  replacement: {
    parentId: null,
    parentBlockId: null,
  },
});

/**
 * Plans one exact, ungrouped instruction move from the Variables workspace.
 *
 * Every instruction is eligible. The planner preserves variableId and every
 * relationship that remains structurally valid in the final layout. A parent
 * or Block relationship receives an explicit CLEAR patch only when it is valid
 * before the move and the submitted final layout makes it invalid.
 */
export const planVariablesFreeMove = (
  snapshot: VariableWorkspaceSnapshot,
  request: VariablesFreeMoveRequest,
): VariablesFreeMoveResult => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return refusal(
      'MUTATION_UNAVAILABLE',
      'Variables free movement is not available for this workspace.',
    );
  }
  if (
    !positiveInteger(request.sourceInstructionId)
    || !positiveInteger(request.destinationBlockId)
    || !Number.isSafeInteger(request.destinationIndex)
    || request.destinationIndex < 0
  ) {
    return refusal(
      'INVALID_REQUEST',
      'The source, destination Block, and destination index must be valid.',
    );
  }

  const blocksById = indexUnique(snapshot.blocks, block => block.id);
  const layoutById = indexUnique(
    capability.layoutRows,
    row => row.instructionId,
  );
  const factsById = indexUnique(
    capability.instructionFacts,
    fact => fact.instructionId,
  );
  if (
    !blocksById
    || !layoutById
    || !factsById
    || layoutById.size !== factsById.size
    || [...layoutById.keys()].some(id => !factsById.has(id))
  ) {
    return refusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative Variables instruction graph is incomplete.',
    );
  }

  const blockOrders = new Map<number, number>();
  for (const block of snapshot.blocks) {
    if (!positiveInteger(block.order)) {
      return refusal(
        'AUTHORITATIVE_GRAPH_INVALID',
        `Block #${block.id} does not have an authoritative positive order.`,
      );
    }
    blockOrders.set(block.id, block.order);
  }
  for (const row of capability.layoutRows) {
    const fact = factsById.get(row.instructionId);
    const blockOrder = blockOrders.get(row.blockId);
    if (
      !positiveInteger(row.blockId)
      || !positiveInteger(row.blockOrderNumber)
      || !positiveInteger(row.instructionOrderNumber)
      || blockOrder !== row.blockOrderNumber
      || !fact
      || fact.blockId !== row.blockId
      || fact.blockOrderNumber !== row.blockOrderNumber
      || fact.instructionOrderNumber !== row.instructionOrderNumber
    ) {
      return refusal(
        'AUTHORITATIVE_GRAPH_INVALID',
        'The authoritative Variables facts do not match the instruction layout.',
      );
    }
  }

  const source = layoutById.get(request.sourceInstructionId);
  const sourceFact = factsById.get(request.sourceInstructionId);
  if (!source || !sourceFact) {
    return refusal(
      'SOURCE_NOT_FOUND',
      `Instruction #${request.sourceInstructionId} is not in this Variables workspace.`,
    );
  }
  const destinationBlock = blocksById.get(request.destinationBlockId);
  const destinationBlockOrder = blockOrders.get(request.destinationBlockId);
  if (!destinationBlock || destinationBlockOrder === undefined) {
    return refusal(
      'BLOCK_NOT_FOUND',
      `Block #${request.destinationBlockId} is not in this Variables workspace.`,
    );
  }

  const sourceRows = capability.layoutRows
    .filter(row => row.blockId === source.blockId)
    .sort(compareLayout);
  const destinationRows = (
    source.blockId === request.destinationBlockId
      ? sourceRows
      : capability.layoutRows
          .filter(row => row.blockId === request.destinationBlockId)
          .sort(compareLayout)
  ).filter(row => row.instructionId !== request.sourceInstructionId);
  if (request.destinationIndex > destinationRows.length) {
    return refusal(
      'DESTINATION_INDEX_OUT_OF_RANGE',
      `Block #${request.destinationBlockId} accepts a destination index from 0 `
        + `to ${destinationRows.length}.`,
    );
  }

  const moved = {
    ...source,
    blockId: request.destinationBlockId,
    blockOrderNumber: destinationBlockOrder,
  };
  const nextDestination = [...destinationRows];
  nextDestination.splice(request.destinationIndex, 0, moved);
  const replacements = new Map<number, InstructionGraphLayoutRow>();
  normalizedBlockRows(
    nextDestination,
    request.destinationBlockId,
    destinationBlockOrder,
  ).forEach(row => replacements.set(row.instructionId, row));

  if (source.blockId !== request.destinationBlockId) {
    const sourceRemainder = sourceRows.filter(
      row => row.instructionId !== request.sourceInstructionId,
    );
    const sourceBlockOrder = blockOrders.get(source.blockId);
    if (sourceBlockOrder === undefined) {
      return refusal(
        'AUTHORITATIVE_GRAPH_INVALID',
        `Source Block #${source.blockId} is outside the workspace catalog.`,
      );
    }
    normalizedBlockRows(
      sourceRemainder,
      source.blockId,
      sourceBlockOrder,
    ).forEach(row => replacements.set(row.instructionId, row));
  }

  const finalLayout = capability.layoutRows
    .map(row => replacements.get(row.instructionId) ?? { ...row })
    .sort(compareLayout);
  if (sameLayout(capability.layoutRows, finalLayout)) {
    return refusal('NO_CHANGE', 'The instruction is already in that position.');
  }

  const conditionalWatch = watchVariablesConditionalFreeMove(
    snapshot,
    request.sourceInstructionId,
    request.destinationBlockId,
    finalLayout,
  );
  if (!conditionalWatch.ok) {
    return refusal(
      conditionalWatch.code as VariablesFreeMoveErrorCode,
      conditionalWatch.message,
    );
  }

  const finalLayoutById = new Map(
    finalLayout.map(row => [row.instructionId, row]),
  );
  const workspaceBlockIds = new Set(snapshot.blocks.map(block => block.id));
  const clearedRelationships: VariablesFreeMoveClearedRelationship[] = [];
  const instructionRelationPatches: InstructionGraphRelationPatch[] = [];
  capability.instructionFacts.forEach((fact) => {
    const before = relationValidity(fact, layoutById, workspaceBlockIds);
    const after = relationValidity(fact, finalLayoutById, workspaceBlockIds);
    if (!before.valid || after.valid) return;
    clearedRelationships.push({
      instructionId: fact.instructionId,
      relationKind: fact.relationKind,
      reason: after.reason,
      expectedParentId: fact.parentId,
      expectedParentBlockId: fact.parentBlockId,
    });
    instructionRelationPatches.push(clearPatch(fact));
  });
  clearedRelationships.sort((left, right) =>
    left.instructionId - right.instructionId
    || left.relationKind.localeCompare(right.relationKind));
  instructionRelationPatches.sort((left, right) =>
    left.instructionId - right.instructionId
    || left.relationKind.localeCompare(right.relationKind));

  const draft: BotJobGraphMutationDraft = {
    mutationKind: 'ROW_MOVE',
    draggedInstructionId: request.sourceInstructionId,
    layoutRows: finalLayout,
    instructionRelationPatches,
    // Movement never reconnects, disconnects, or otherwise rewrites variableId.
    variableBindingPatches: [],
    variableOwnerPatches: [],
  };
  return {
    ok: true,
    plan: {
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      sourceInstructionId: request.sourceInstructionId,
      sourceBlockId: source.blockId,
      destinationBlockId: request.destinationBlockId,
      destinationIndex: request.destinationIndex,
      preservedVariableId: sourceFact.variableId,
      clearedRelationships,
      draft,
    },
  };
};
