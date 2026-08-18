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
import {
  planVariablesFreeMove,
  type VariablesFreeMoveClearedRelationship,
  type VariablesReactAuthoredProfile,
} from './variablesFreeMove';
import {
  variablesConditionalFamilyForInstruction,
  watchVariablesConditionalBlockTransfer,
} from './variablesConditionalFamilyWatcher';

export type VariablesBlockTransferScope =
  | 'ONLY_INSTRUCTION'
  | 'WITH_PARENTS';

export type VariablesBlockTransferSelection = {
  selectedInstructionId: number;
  scope: VariablesBlockTransferScope;
  sourceInstructionIds: readonly number[];
};

export type VariablesBlockTransferErrorCode =
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
  | 'CONDITIONAL_FAMILY_DESTINATION_OCCUPIED'
  | 'NO_CHANGE';

export type VariablesBlockTransferSelectionResult =
  | { ok: true; selection: VariablesBlockTransferSelection }
  | {
      ok: false;
      code: VariablesBlockTransferErrorCode;
      message: string;
    };

export type VariablesBlockMovePlan = {
  mutationProfile: VariablesReactAuthoredProfile;
  selectedInstructionId: number;
  sourceInstructionIds: readonly number[];
  destinationBlockId: number;
  clearedRelationships: readonly VariablesFreeMoveClearedRelationship[];
  draft: BotJobGraphMutationDraft;
};

export type VariablesBlockMoveResult =
  | { ok: true; plan: VariablesBlockMovePlan }
  | {
      ok: false;
      code: VariablesBlockTransferErrorCode;
      message: string;
    };

type RelationshipValidity =
  | { valid: true }
  | {
      valid: false;
      reason: VariablesFreeMoveClearedRelationship['reason'];
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
  code: VariablesBlockTransferErrorCode,
  message: string,
): VariablesBlockTransferSelectionResult => ({ ok: false, code, message });

const moveRefusal = (
  code: VariablesBlockTransferErrorCode,
  message: string,
): VariablesBlockMoveResult => ({ ok: false, code, message });

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

const authoritativeIndexes = (
  snapshot: VariableWorkspaceSnapshot,
): {
  layoutById: Map<number, InstructionGraphLayoutRow>;
  factsById: Map<number, VariablesInstructionFact>;
} | null => {
  const capability = snapshot.mutationCapability;
  if (!capability) return null;
  const layoutById = indexUnique(
    capability.layoutRows,
    row => row.instructionId,
  );
  const factsById = indexUnique(
    capability.instructionFacts,
    row => row.instructionId,
  );
  if (
    !layoutById
    || !factsById
    || layoutById.size !== factsById.size
    || [...layoutById.keys()].some(id => !factsById.has(id))
  ) {
    return null;
  }
  return { layoutById, factsById };
};

/**
 * Selects only explicit dependency ancestors.
 *
 * The closure starts with the selected instruction and follows parentId links.
 * For every variable-bound member it also adds that variable's declaration
 * owner and GET producers, then follows their parentId chains. It never selects
 * children and never infers positional IF/LOOP body membership.
 */
export const selectVariablesBlockTransferSources = (
  snapshot: VariableWorkspaceSnapshot,
  selectedInstructionId: number,
  scope: VariablesBlockTransferScope,
): VariablesBlockTransferSelectionResult => {
  if (
    !positiveInteger(selectedInstructionId)
    || (scope !== 'ONLY_INSTRUCTION' && scope !== 'WITH_PARENTS')
  ) {
    return refusal(
      'INVALID_REQUEST',
      'Choose one valid instruction and transfer scope.',
    );
  }
  const indexes = authoritativeIndexes(snapshot);
  if (!indexes) {
    return refusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative Variables instruction graph is incomplete.',
    );
  }
  if (!indexes.factsById.has(selectedInstructionId)) {
    return refusal(
      'SOURCE_NOT_FOUND',
      `Instruction #${selectedInstructionId} is not in this Variables workspace.`,
    );
  }
  const conditionalFamily = variablesConditionalFamilyForInstruction(
    snapshot,
    selectedInstructionId,
  );
  if (conditionalFamily) {
    if (!conditionalFamily.valid) {
      return refusal(
        'CONDITIONAL_FAMILY_INVALID',
        conditionalFamily.error || 'Repair this IF family before transferring it.',
      );
    }
    return {
      ok: true,
      selection: {
        selectedInstructionId,
        scope,
        sourceInstructionIds: [...conditionalFamily.boundaryInstructionIds],
      },
    };
  }
  if (scope === 'ONLY_INSTRUCTION') {
    return {
      ok: true,
      selection: {
        selectedInstructionId,
        scope,
        sourceInstructionIds: [selectedInstructionId],
      },
    };
  }

  const variableDependencies = new Map<number, Set<number>>();
  snapshot.variables.forEach((variable) => {
    const dependencies = new Set<number>();
    if (
      variable.owner?.id != null
      && indexes.factsById.has(variable.owner.id)
    ) {
      dependencies.add(variable.owner.id);
    }
    variable.producers.forEach((producer) => {
      if (producer.id != null && indexes.factsById.has(producer.id)) {
        dependencies.add(producer.id);
      }
    });
    variableDependencies.set(variable.id, dependencies);
  });

  const memberVariables = new Map<number, Set<number>>();
  snapshot.variables.forEach((variable) => {
    const memberIds = [
      variable.owner?.id,
      ...variable.commands.map(command => command.id),
    ];
    memberIds.forEach((instructionId) => {
      if (instructionId == null) return;
      const variableIds = memberVariables.get(instructionId) ?? new Set<number>();
      variableIds.add(variable.id);
      memberVariables.set(instructionId, variableIds);
    });
  });

  const selected = new Set<number>();
  const pending = [selectedInstructionId];
  while (pending.length > 0) {
    const instructionId = pending.pop() as number;
    if (selected.has(instructionId)) continue;
    const fact = indexes.factsById.get(instructionId);
    if (!fact) continue;
    selected.add(instructionId);

    if (
      fact.relationKind !== 'BLOCK_TARGET'
      && fact.parentId !== null
      && fact.parentId !== fact.instructionId
      && indexes.factsById.has(fact.parentId)
    ) {
      pending.push(fact.parentId);
    }

    const variableIds = new Set<number>();
    if (fact.variableId !== null) variableIds.add(fact.variableId);
    memberVariables.get(instructionId)?.forEach(id => variableIds.add(id));
    variableIds.forEach((variableId) => {
      variableDependencies.get(variableId)?.forEach(id => pending.push(id));
    });
  }

  const sourceInstructionIds = [...selected].sort((left, right) =>
    compareLayout(
      indexes.layoutById.get(left) as InstructionGraphLayoutRow,
      indexes.layoutById.get(right) as InstructionGraphLayoutRow,
    ));
  return {
    ok: true,
    selection: {
      selectedInstructionId,
      scope,
      sourceInstructionIds,
    },
  };
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
  relationKind: fact.relationKind as InstructionGraphRelationKind,
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
 * Plans one atomic dependency-ancestor group move to the target Block end.
 */
export const planVariablesBlockMove = (
  snapshot: VariableWorkspaceSnapshot,
  selectedInstructionId: number,
  targetBlockId: number,
  scope: VariablesBlockTransferScope,
): VariablesBlockMoveResult => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.reactAuthoredProfile !== VARIABLES_REACT_AUTHORED_PROFILE
  ) {
    return moveRefusal(
      'MUTATION_UNAVAILABLE',
      'Variables block transfer is not available for this workspace.',
    );
  }
  if (!positiveInteger(targetBlockId)) {
    return moveRefusal('INVALID_REQUEST', 'Choose a valid target Block.');
  }
  const targetBlock = snapshot.blocks.find(block => block.id === targetBlockId);
  if (!targetBlock || !positiveInteger(targetBlock.order)) {
    return moveRefusal(
      'BLOCK_NOT_FOUND',
      `Block #${targetBlockId} is not in this Variables workspace.`,
    );
  }

  const conditionalWatch = watchVariablesConditionalBlockTransfer(
    snapshot,
    selectedInstructionId,
    targetBlockId,
  );
  if (!conditionalWatch.ok) {
    return moveRefusal(
      conditionalWatch.code as VariablesBlockTransferErrorCode,
      conditionalWatch.message,
    );
  }

  const selection = selectVariablesBlockTransferSources(
    snapshot,
    selectedInstructionId,
    scope,
  );
  if (!selection.ok) return selection;

  if (
    scope === 'ONLY_INSTRUCTION'
    && selection.selection.sourceInstructionIds.length === 1
  ) {
    const destinationIndex = capability.layoutRows.filter(
      row =>
        row.blockId === targetBlockId
        && row.instructionId !== selectedInstructionId,
    ).length;
    const planned = planVariablesFreeMove(snapshot, {
      sourceInstructionId: selectedInstructionId,
      destinationBlockId: targetBlockId,
      destinationIndex,
    });
    if (!planned.ok) {
      return moveRefusal(planned.code, planned.message);
    }
    return {
      ok: true,
      plan: {
        mutationProfile: planned.plan.mutationProfile,
        selectedInstructionId,
        sourceInstructionIds: [selectedInstructionId],
        destinationBlockId: targetBlockId,
        clearedRelationships: planned.plan.clearedRelationships,
        draft: planned.plan.draft,
      },
    };
  }

  const indexes = authoritativeIndexes(snapshot);
  if (!indexes) {
    return moveRefusal(
      'AUTHORITATIVE_GRAPH_INVALID',
      'The authoritative Variables instruction graph is incomplete.',
    );
  }
  const blockOrders = new Map<number, number>();
  for (const block of snapshot.blocks) {
    if (!positiveInteger(block.order)) {
      return moveRefusal(
        'AUTHORITATIVE_GRAPH_INVALID',
        `Block #${block.id} does not have an authoritative positive order.`,
      );
    }
    blockOrders.set(block.id, block.order);
  }
  for (const row of capability.layoutRows) {
    const fact = indexes.factsById.get(row.instructionId);
    if (
      blockOrders.get(row.blockId) !== row.blockOrderNumber
      || fact?.blockId !== row.blockId
      || fact.blockOrderNumber !== row.blockOrderNumber
      || fact.instructionOrderNumber !== row.instructionOrderNumber
    ) {
      return moveRefusal(
        'AUTHORITATIVE_GRAPH_INVALID',
        'The authoritative Variables facts do not match the instruction layout.',
      );
    }
  }

  const sourceIds = new Set(selection.selection.sourceInstructionIds);
  const movedRows = selection.selection.sourceInstructionIds.map(
    instructionId => indexes.layoutById.get(instructionId) as InstructionGraphLayoutRow,
  );
  const rebuilt: InstructionGraphLayoutRow[] = [];
  snapshot.blocks
    .slice()
    .sort((left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER)
      - (right.order ?? Number.MAX_SAFE_INTEGER)
      || left.id - right.id)
    .forEach((block) => {
      const currentRows = capability.layoutRows
        .filter(row => row.blockId === block.id && !sourceIds.has(row.instructionId))
        .sort(compareLayout);
      const rows = block.id === targetBlockId
        ? [
            ...currentRows,
            ...movedRows.map(row => ({
              ...row,
              blockId: targetBlockId,
              blockOrderNumber: targetBlock.order as number,
            })),
          ]
        : currentRows;
      rebuilt.push(...normalizedBlockRows(
        rows,
        block.id,
        block.order as number,
      ));
    });
  const finalLayout = rebuilt.sort(compareLayout);
  if (sameLayout(capability.layoutRows, finalLayout)) {
    return moveRefusal(
      'NO_CHANGE',
      'The selected instruction group is already at that Block position.',
    );
  }

  const finalLayoutById = new Map(
    finalLayout.map(row => [row.instructionId, row]),
  );
  const workspaceBlockIds = new Set(snapshot.blocks.map(block => block.id));
  const clearedRelationships: VariablesFreeMoveClearedRelationship[] = [];
  const instructionRelationPatches: InstructionGraphRelationPatch[] = [];
  capability.instructionFacts.forEach((fact) => {
    const movedInternalParent = sourceIds.has(fact.instructionId)
      && fact.relationKind !== 'BLOCK_TARGET'
      && fact.parentId !== null
      && sourceIds.has(fact.parentId);
    if (movedInternalParent) {
      const parentBlockId = finalLayoutById.get(fact.parentId as number)?.blockId;
      if (
        parentBlockId !== undefined
        && (
          fact.parentBlockId !== parentBlockId
          || !relationValidity(
            fact,
            finalLayoutById,
            workspaceBlockIds,
          ).valid
        )
      ) {
        instructionRelationPatches.push({
          instructionId: fact.instructionId,
          relationKind: fact.relationKind,
          operation: 'SET',
          expected: {
            parentId: fact.parentId,
            parentBlockId: fact.parentBlockId,
          },
          replacement: {
            parentId: fact.parentId,
            parentBlockId,
          },
        });
      }
      return;
    }
    const before = relationValidity(
      fact,
      indexes.layoutById,
      workspaceBlockIds,
    );
    const after = relationValidity(
      fact,
      finalLayoutById,
      workspaceBlockIds,
    );
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

  return {
    ok: true,
    plan: {
      mutationProfile: VARIABLES_REACT_AUTHORED_PROFILE,
      selectedInstructionId,
      sourceInstructionIds: selection.selection.sourceInstructionIds,
      destinationBlockId: targetBlockId,
      clearedRelationships,
      draft: {
        mutationKind: 'ROW_MOVE',
        draggedInstructionId: selectedInstructionId,
        layoutRows: finalLayout,
        instructionRelationPatches,
        variableBindingPatches: [],
        variableOwnerPatches: [],
      },
    },
  };
};
