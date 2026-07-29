import type {
  BotJobGraphMutationDraft,
  InstructionGraphLayoutRow,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import { instructionRelationshipPolicy } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';

export type VariablesDropPlacement = 'BEFORE' | 'AFTER';

export type VariablesInstructionMoveErrorCode =
  | 'MUTATION_UNAVAILABLE'
  | 'SOURCE_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'INVALID_SOURCE'
  | 'CROSS_BLOCK_NOT_READY'
  | 'STRUCTURAL_BOUNDARY'
  | 'NO_CHANGE'
  | 'RELATIONSHIP_ORDER';

export type VariablesInstructionMovePlan = {
  sourceInstruction: VariableCommandLink;
  targetInstruction: VariableInstructionNode;
  placement: VariablesDropPlacement;
  draft: BotJobGraphMutationDraft;
};

export type VariablesInstructionMoveResult =
  | { ok: true; plan: VariablesInstructionMovePlan }
  | {
      ok: false;
      code: VariablesInstructionMoveErrorCode;
      message: string;
    };

const orderCompare = (
  left: InstructionGraphLayoutRow,
  right: InstructionGraphLayoutRow,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

const commandById = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): VariableCommandLink | null => {
  for (const variable of snapshot.variables) {
    const command = variable.commands.find(row => row.id === instructionId);
    if (command) return command;
  }
  return null;
};

const instructionById = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): VariableInstructionNode | null => {
  for (const variable of snapshot.variables) {
    if (variable.owner?.id === instructionId) return variable.owner;
    const command = variable.commands.find(row => row.id === instructionId);
    if (command) return command;
  }
  return null;
};

const reorderedLayout = (
  layoutRows: readonly InstructionGraphLayoutRow[],
  sourceInstructionId: number,
  targetInstructionId: number,
  placement: VariablesDropPlacement,
): InstructionGraphLayoutRow[] | null => {
  const source = layoutRows.find(row => row.instructionId === sourceInstructionId);
  const target = layoutRows.find(row => row.instructionId === targetInstructionId);
  if (!source || !target || source.blockId !== target.blockId) return null;

  const rowsInBlock = layoutRows
    .filter(row => row.blockId === source.blockId)
    .sort(orderCompare);
  const withoutSource = rowsInBlock.filter(
    row => row.instructionId !== sourceInstructionId,
  );
  const targetIndex = withoutSource.findIndex(
    row => row.instructionId === targetInstructionId,
  );
  if (targetIndex < 0) return null;
  const insertionIndex = placement === 'AFTER' ? targetIndex + 1 : targetIndex;
  withoutSource.splice(insertionIndex, 0, source);

  const reorderedById = new Map(
    withoutSource.map((row, index) => [
      row.instructionId,
      { ...row, instructionOrderNumber: index + 1 },
    ]),
  );
  return layoutRows
    .map(row => reorderedById.get(row.instructionId) ?? { ...row })
    .sort(orderCompare);
};

const sameLayout = (
  left: readonly InstructionGraphLayoutRow[],
  right: readonly InstructionGraphLayoutRow[],
): boolean => {
  if (left.length !== right.length) return false;
  const rightById = new Map(right.map(row => [row.instructionId, row]));
  return left.every(row => {
    const candidate = rightById.get(row.instructionId);
    return candidate?.blockId === row.blockId
      && candidate.blockOrderNumber === row.blockOrderNumber
      && candidate.instructionOrderNumber === row.instructionOrderNumber;
  });
};

const crossesStructuralBoundary = (
  facts: readonly VariablesInstructionFact[],
  sourceInstructionId: number,
  targetInstructionId: number,
  placement: VariablesDropPlacement,
): boolean => {
  const source = facts.find(row => row.instructionId === sourceInstructionId);
  const target = facts.find(row => row.instructionId === targetInstructionId);
  if (!source || !target || source.blockId !== target.blockId) return true;
  const lower = Math.min(
    source.instructionOrderNumber,
    target.instructionOrderNumber,
  );
  const upper = Math.max(
    source.instructionOrderNumber,
    target.instructionOrderNumber,
  );
  const crossesBetween = facts.some(row =>
    row.blockId === source.blockId
    && row.instructionId !== sourceInstructionId
    && row.instructionId !== targetInstructionId
    && row.instructionOrderNumber > lower
    && row.instructionOrderNumber < upper
    && row.relationKind !== 'ELEMENT_TARGET');
  if (crossesBetween) return true;

  const movingDown = source.instructionOrderNumber
    < target.instructionOrderNumber;
  const crossesTarget = movingDown
    ? placement === 'AFTER'
    : placement === 'BEFORE';
  return crossesTarget && target.relationKind !== 'ELEMENT_TARGET';
};

const effective = (row: VariableInstructionNode): boolean =>
  row.active === true && row.blockActive === true;

const relationOrderIssues = (
  variables: readonly VariableGraphEntry[],
  facts: readonly VariablesInstructionFact[],
  layoutRows: readonly InstructionGraphLayoutRow[],
): Set<string> => {
  const issues = new Set<string>();
  const factsById = new Map(facts.map(row => [row.instructionId, row]));
  const layoutById = new Map(layoutRows.map(row => [row.instructionId, row]));

  facts.forEach(fact => {
    if (fact.parentId === null) return;
    const instructionLayout = layoutById.get(fact.instructionId);
    const parentLayout = layoutById.get(fact.parentId);
    if (
      instructionLayout
      && parentLayout
      && instructionLayout.blockId === parentLayout.blockId
      && parentLayout.instructionOrderNumber
        >= instructionLayout.instructionOrderNumber
    ) {
      issues.add(`PARENT_ORDER:${fact.instructionId}`);
    }
  });

  variables.forEach(variable => {
    const writers = [
      ...variable.producers,
      ...variable.literalAssignments,
    ].filter(row => row.id !== null && effective(row));
    const consumers = variable.consumers.filter(row =>
      row.id !== null
      && effective(row)
      && instructionRelationshipPolicy(row.command)
        .requirements.includes('VARIABLE_ORDER'));
    const orderedWriters = writers
      .map(row => layoutById.get(row.id as number))
      .filter((row): row is InstructionGraphLayoutRow => Boolean(row))
      .sort(orderCompare);
    const firstWriter = orderedWriters[0];
    if (!firstWriter) return;

    consumers.forEach(consumer => {
      const consumerLayout = layoutById.get(consumer.id as number);
      if (consumerLayout && orderCompare(consumerLayout, firstWriter) < 0) {
        issues.add(`CONSUMER_BEFORE_WRITER:${consumer.id}`);
      }
    });
  });

  layoutRows.forEach(row => {
    if (!factsById.has(row.instructionId)) {
      issues.add(`MISSING_FACT:${row.instructionId}`);
    }
  });
  return issues;
};

const refused = (
  code: VariablesInstructionMoveErrorCode,
  message: string,
): VariablesInstructionMoveResult => ({ ok: false, code, message });

/**
 * Plans one exact same-block command reorder for the detached Variables page.
 *
 * The function is intentionally persistence-free. It never expands the selected
 * row, rewrites parent/variable IDs, or asks Java to infer a connected group.
 */
export const planVariablesInstructionMove = (
  snapshot: VariableWorkspaceSnapshot,
  sourceInstructionId: number,
  targetInstructionId: number,
  placement: VariablesDropPlacement,
): VariablesInstructionMoveResult => {
  const capability = snapshot.mutationCapability;
  if (!capability) {
    return refused(
      'MUTATION_UNAVAILABLE',
      'Variables drag and drop is not available for this workspace.',
    );
  }
  const source = commandById(snapshot, sourceInstructionId);
  if (!source) {
    return refused(
      'SOURCE_NOT_FOUND',
      'The dragged variable command is no longer in the current snapshot.',
    );
  }
  if (source.role === 'INVALID_LINK') {
    return refused(
      'INVALID_SOURCE',
      'Repair this command relationship before changing its execution order.',
    );
  }
  const target = instructionById(snapshot, targetInstructionId);
  if (!target) {
    return refused(
      'TARGET_NOT_FOUND',
      'The selected drop anchor is no longer in the current snapshot.',
    );
  }
  if (sourceInstructionId === targetInstructionId) {
    return refused('NO_CHANGE', 'Choose another instruction as the drop anchor.');
  }
  const sourceFact = capability.instructionFacts.find(
    row => row.instructionId === sourceInstructionId,
  );
  const targetFact = capability.instructionFacts.find(
    row => row.instructionId === targetInstructionId,
  );
  if (!sourceFact || !targetFact) {
    return refused(
      'MUTATION_UNAVAILABLE',
      'The authoritative instruction layout is incomplete. Refresh Variables.',
    );
  }
  if (sourceFact.relationKind !== 'ELEMENT_TARGET') {
    return refused(
      'INVALID_SOURCE',
      'Structural commands are not enabled for Variables drag and drop yet.',
    );
  }
  if (sourceFact.blockId !== targetFact.blockId) {
    return refused(
      'CROSS_BLOCK_NOT_READY',
      'This first Variables release moves one command only inside its current block.',
    );
  }
  if (crossesStructuralBoundary(
    capability.instructionFacts,
    sourceInstructionId,
    targetInstructionId,
    placement,
  )) {
    return refused(
      'STRUCTURAL_BOUNDARY',
      'This drop crosses a LOOP, IF, or navigation boundary and was not saved.',
    );
  }

  const nextLayout = reorderedLayout(
    capability.layoutRows,
    sourceInstructionId,
    targetInstructionId,
    placement,
  );
  if (!nextLayout) {
    return refused(
      'MUTATION_UNAVAILABLE',
      'The authoritative instruction layout could not be reordered.',
    );
  }
  if (sameLayout(capability.layoutRows, nextLayout)) {
    return refused('NO_CHANGE', 'The instruction is already in that position.');
  }

  const beforeIssues = relationOrderIssues(
    snapshot.variables,
    capability.instructionFacts,
    capability.layoutRows,
  );
  const afterIssues = relationOrderIssues(
    snapshot.variables,
    capability.instructionFacts,
    nextLayout,
  );
  const newIssues = [...afterIssues].filter(issue => !beforeIssues.has(issue));
  if (newIssues.length > 0) {
    return refused(
      'RELATIONSHIP_ORDER',
      'This drop would put a parent or variable reader in an unsafe execution order.',
    );
  }

  return {
    ok: true,
    plan: {
      sourceInstruction: source,
      targetInstruction: target,
      placement,
      draft: {
        mutationKind: 'ROW_MOVE',
        draggedInstructionId: sourceInstructionId,
        layoutRows: nextLayout,
        instructionRelationPatches: [],
        variableBindingPatches: [],
        variableOwnerPatches: [],
      },
    },
  };
};
