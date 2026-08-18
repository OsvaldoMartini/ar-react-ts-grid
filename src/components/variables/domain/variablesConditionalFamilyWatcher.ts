import type { InstructionGraphLayoutRow } from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import { instructionRelationshipPolicy } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';

const CONDITIONAL_ACTIONS = new Set(['IF', 'ELSEIF', 'ELSE', 'ENDIF']);

export type VariablesConditionalFamily = {
  rootInstructionId: number;
  blockId: number;
  boundaryInstructionIds: readonly number[];
  valid: boolean;
  error: string | null;
};

export type VariablesConditionalFamilyWatchResult =
  | { ok: true; family: VariablesConditionalFamily | null }
  | { ok: false; code: string; message: string };

export type VariablesConditionalTransferAction = 'MOVE' | 'COPY';

const actionOf = (fact: VariablesInstructionFact): string =>
  instructionRelationshipPolicy(fact.action).canonicalAction;

const compareLayout = (
  left: InstructionGraphLayoutRow,
  right: InstructionGraphLayoutRow,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

const familyError = (
  rootInstructionId: number,
  blockId: number,
  boundaryInstructionIds: readonly number[],
  error: string,
): VariablesConditionalFamily => ({
  rootInstructionId,
  blockId,
  boundaryInstructionIds,
  valid: false,
  error,
});

/**
 * Resolves only the structural IF-family boundaries connected by parentId.
 * Positional body commands deliberately remain independent.
 */
export const variablesConditionalFamilyForInstruction = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): VariablesConditionalFamily | null => {
  const capability = snapshot.mutationCapability;
  if (!capability) return null;
  const factsById = new Map(
    capability.instructionFacts.map(fact => [fact.instructionId, fact]),
  );
  const layoutById = new Map(
    capability.layoutRows.map(row => [row.instructionId, row]),
  );
  const selected = factsById.get(instructionId);
  if (!selected || !CONDITIONAL_ACTIONS.has(actionOf(selected))) return null;

  const rootInstructionId = actionOf(selected) === 'IF'
    ? selected.instructionId
    : selected.parentId;
  if (rootInstructionId === null) {
    return familyError(
      selected.instructionId,
      selected.blockId,
      [selected.instructionId],
      `${actionOf(selected)} instruction #${selected.instructionId} has no IF root.`,
    );
  }
  const root = factsById.get(rootInstructionId);
  if (!root || actionOf(root) !== 'IF') {
    return familyError(
      rootInstructionId,
      selected.blockId,
      [selected.instructionId],
      `Conditional instruction #${selected.instructionId} references a missing IF root.`,
    );
  }
  if (selected.blockId !== root.blockId) {
    return familyError(
      rootInstructionId,
      selected.blockId,
      [selected.instructionId],
      `Conditional instruction #${selected.instructionId} is not in its IF root Block.`,
    );
  }
  const rootsInBlock = capability.instructionFacts.filter(
    fact => fact.blockId === root.blockId && actionOf(fact) === 'IF',
  );
  if (
    rootsInBlock.length !== 1
    || rootsInBlock[0].instructionId !== rootInstructionId
  ) {
    return familyError(
      rootInstructionId,
      root.blockId,
      rootsInBlock.map(fact => fact.instructionId),
      'A Block may contain only one IF family.',
    );
  }

  const conditionalRowsInBlock = capability.instructionFacts.filter(
    fact => fact.blockId === root.blockId
      && CONDITIONAL_ACTIONS.has(actionOf(fact)),
  );
  const boundaries = conditionalRowsInBlock
    .filter(fact => fact.instructionId === rootInstructionId
      || fact.parentId === rootInstructionId)
    .sort((left, right) => {
      const leftLayout = layoutById.get(left.instructionId);
      const rightLayout = layoutById.get(right.instructionId);
      if (!leftLayout || !rightLayout) return left.instructionId - right.instructionId;
      return compareLayout(leftLayout, rightLayout);
    });
  const ids = boundaries.map(fact => fact.instructionId);
  const actions = boundaries.map(actionOf);
  const elseCount = actions.filter(action => action === 'ELSE').length;
  const endifCount = actions.filter(action => action === 'ENDIF').length;
  const expected = [
    'IF',
    ...actions.filter(action => action === 'ELSEIF'),
    'ELSE',
    'ENDIF',
  ];

  if (root.parentId !== rootInstructionId) {
    return familyError(
      rootInstructionId,
      root.blockId,
      ids,
      `IF instruction #${rootInstructionId} must reference itself.`,
    );
  }
  if (!ids.includes(selected.instructionId)) {
    return familyError(
      rootInstructionId,
      root.blockId,
      ids,
      `Conditional instruction #${selected.instructionId} does not belong to its IF family.`,
    );
  }
  if (boundaries.some(fact => fact.parentBlockId !== root.blockId)) {
    return familyError(
      rootInstructionId,
      root.blockId,
      ids,
      'Every IF-family boundary must reference its containing Block.',
    );
  }
  if (
    boundaries.length !== conditionalRowsInBlock.length
    ||
    elseCount !== 1
    || endifCount !== 1
    || actions.length !== expected.length
    || actions.some((action, index) => action !== expected[index])
  ) {
    return familyError(
      rootInstructionId,
      root.blockId,
      ids,
      'The IF family must remain IF, zero or more ELSEIF, ELSE, ENDIF.',
    );
  }
  if (boundaries.some(fact =>
    fact.instructionId !== rootInstructionId
    && fact.parentId !== rootInstructionId)) {
    return familyError(
      rootInstructionId,
      root.blockId,
      ids,
      'Every ELSEIF, ELSE, and ENDIF must reference the IF root.',
    );
  }

  return {
    rootInstructionId,
    blockId: root.blockId,
    boundaryInstructionIds: ids,
    valid: true,
    error: null,
  };
};

export const watchVariablesConditionalFreeMove = (
  snapshot: VariableWorkspaceSnapshot,
  sourceInstructionId: number,
  destinationBlockId: number,
  finalLayout: readonly InstructionGraphLayoutRow[],
): VariablesConditionalFamilyWatchResult => {
  const family = variablesConditionalFamilyForInstruction(
    snapshot,
    sourceInstructionId,
  );
  if (!family) return { ok: true, family: null };
  if (!family.valid) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_INVALID',
      message: family.error || 'Repair this IF family before moving its boundaries.',
    };
  }
  if (destinationBlockId !== family.blockId) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_TRANSFER_REQUIRED',
      message: 'IF, ELSEIF, ELSE, and ENDIF must change Blocks together. '
        + 'Drop the family on Block transfer and choose Move or New Copy.',
    };
  }

  const finalById = new Map(finalLayout.map(row => [row.instructionId, row]));
  const boundaryRows = family.boundaryInstructionIds
    .map(id => finalById.get(id))
    .filter((row): row is InstructionGraphLayoutRow => row != null);
  if (
    boundaryRows.length !== family.boundaryInstructionIds.length
    || boundaryRows.some(row => row.blockId !== family.blockId)
  ) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_SPLIT',
      message: 'The complete IF family must remain in one Block.',
    };
  }
  const factsById = new Map(
    snapshot.mutationCapability?.instructionFacts.map(fact => [fact.instructionId, fact])
      ?? [],
  );
  const finalActions = [...boundaryRows]
    .sort(compareLayout)
    .map(row => factsById.get(row.instructionId))
    .filter((fact): fact is VariablesInstructionFact => fact != null)
    .map(actionOf);
  const expectedActions = [
    'IF',
    ...finalActions.filter(action => action === 'ELSEIF'),
    'ELSE',
    'ENDIF',
  ];
  if (
    finalActions.length !== expectedActions.length
    || finalActions.some((action, index) => action !== expectedActions[index])
  ) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_ORDER_INVALID',
      message: 'Keep the conditional order IF -> ELSEIF(s) -> ELSE -> ENDIF.',
    };
  }
  return { ok: true, family };
};

export const watchVariablesConditionalBlockTransfer = (
  snapshot: VariableWorkspaceSnapshot,
  sourceInstructionId: number,
  destinationBlockId: number,
  action: VariablesConditionalTransferAction = 'MOVE',
): VariablesConditionalFamilyWatchResult => {
  const family = variablesConditionalFamilyForInstruction(
    snapshot,
    sourceInstructionId,
  );
  if (!family) return { ok: true, family: null };
  if (!family.valid) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_INVALID',
      message: family.error || 'Repair this IF family before transferring it.',
    };
  }
  const destinationHasConditional = snapshot.mutationCapability?.instructionFacts.some(
    fact => fact.blockId === destinationBlockId
      && CONDITIONAL_ACTIONS.has(actionOf(fact))
      && (
        action === 'COPY'
        || !family.boundaryInstructionIds.includes(fact.instructionId)
      ),
  ) ?? false;
  if (destinationHasConditional) {
    return {
      ok: false,
      code: 'CONDITIONAL_FAMILY_DESTINATION_OCCUPIED',
      message: 'The destination Block already contains an IF family.',
    };
  }
  return { ok: true, family };
};
