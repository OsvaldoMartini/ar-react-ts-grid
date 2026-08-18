import type {
  BotJobGraphMutationDraft,
  InstructionGraphLayoutRow,
  InstructionGraphRelationPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type {
  InstructionRelationshipEdge,
  RelationshipOwner,
  RelationshipTarget,
} from '../../bot-job-details/grid/domain/instructionRelationshipGraph';
import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
  writesRuntimeVariableValue,
} from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  ReconnectWebElementOption as ReconnectRelationshipOption,
} from '../../ReconnectWebElement';
import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import type { VariablesDropPlacement } from './variablesInstructionMove';

const CROSS_BLOCK_ACTIONS = new Set([
  'E',
  'CK',
  'PDF CHECK',
  'CSV CHECK',
]);

export type VariablesCrossBlockMoveErrorCode =
  | 'CROSS_BLOCK_UNAVAILABLE'
  | 'SOURCE_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SAME_BLOCK'
  | 'INVALID_SOURCE'
  | 'SOURCE_HAS_DEPENDANTS'
  | 'EMPTY_SOURCE_BLOCK'
  | 'STRUCTURAL_SOURCE_BLOCK'
  | 'STRUCTURAL_DESTINATION_BLOCK'
  | 'WRITER_ORDER'
  | 'LAYOUT_INVALID';

export type VariablesCrossBlockRelationshipChoice =
  | { mode: 'DISCONNECT' }
  | { mode: 'RECONNECT'; targetInstructionId: number };

export type VariablesCrossBlockMovePlan = {
  sourceInstruction: VariableCommandLink;
  sourceFact: VariablesInstructionFact;
  targetFact: VariablesInstructionFact;
  placement: VariablesDropPlacement;
  destinationBlockId: number;
  destinationBlockOrderNumber: number;
  destinationLabel: string;
  layoutRows: readonly InstructionGraphLayoutRow[];
  edge: InstructionRelationshipEdge;
  sourceLabel: string;
  currentTargetLabel: string | null;
  compatibleTargets: readonly ReconnectRelationshipOption[];
};

export type VariablesCrossBlockMoveResult =
  | { ok: true; plan: VariablesCrossBlockMovePlan }
  | {
      ok: false;
      code: VariablesCrossBlockMoveErrorCode;
      message: string;
    };

const orderCompare = (
  left: InstructionGraphLayoutRow,
  right: InstructionGraphLayoutRow,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

const isCompleteContiguousLayout = (
  layoutRows: readonly InstructionGraphLayoutRow[],
  facts: readonly VariablesInstructionFact[],
): boolean => {
  if (layoutRows.length === 0 || layoutRows.length !== facts.length) {
    return false;
  }
  const factsById = new Map(
    facts.map(row => [row.instructionId, row]),
  );
  if (factsById.size !== facts.length) return false;
  const rowsByBlock = new Map<number, InstructionGraphLayoutRow[]>();
  for (const row of layoutRows) {
    const fact = factsById.get(row.instructionId);
    if (
      !fact
      || fact.blockId !== row.blockId
      || fact.blockOrderNumber !== row.blockOrderNumber
      || fact.instructionOrderNumber !== row.instructionOrderNumber
    ) {
      return false;
    }
    const blockRows = rowsByBlock.get(row.blockId) ?? [];
    blockRows.push(row);
    rowsByBlock.set(row.blockId, blockRows);
  }
  if (rowsByBlock.size === 0) return false;
  return [...rowsByBlock.values()].every((rows) => {
    const ordered = [...rows].sort(orderCompare);
    const blockOrder = ordered[0]?.blockOrderNumber;
    return ordered.every((row, index) =>
      row.blockOrderNumber === blockOrder
      && row.instructionOrderNumber === index + 1);
  });
};

const sourceCommand = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): {
  variable: VariableGraphEntry;
  command: VariableCommandLink;
} | null => {
  for (const variable of snapshot.variables) {
    const command = variable.commands.find(row => row.id === instructionId);
    if (command) return { variable, command };
  }
  return null;
};

const factLabel = (fact: VariablesInstructionFact | null): string | null => {
  if (!fact) return null;
  const action = canonicalInstructionAction(fact.action) || 'Instruction';
  return `#${fact.instructionOrderNumber} ${action} - ID ${fact.instructionId}`;
};

const isFlatBlock = (
  facts: readonly VariablesInstructionFact[],
  blockId: number,
): boolean => {
  const rows = facts.filter(row => row.blockId === blockId);
  return rows.length > 0
    && rows.every(row => row.relationKind === 'ELEMENT_TARGET');
};

const moveAcrossBlocks = (
  rows: readonly InstructionGraphLayoutRow[],
  sourceInstructionId: number,
  targetInstructionId: number,
  placement: VariablesDropPlacement,
): InstructionGraphLayoutRow[] | null => {
  const source = rows.find(row => row.instructionId === sourceInstructionId);
  const target = rows.find(row => row.instructionId === targetInstructionId);
  if (!source || !target || source.blockId === target.blockId) return null;

  const sourceRows = rows
    .filter(row => row.blockId === source.blockId)
    .sort(orderCompare);
  const destinationRows = rows
    .filter(row => row.blockId === target.blockId)
    .sort(orderCompare);
  if (sourceRows.length <= 1 || destinationRows.length === 0) return null;

  const sourceWithoutDragged = sourceRows.filter(
    row => row.instructionId !== sourceInstructionId,
  );
  const targetIndex = destinationRows.findIndex(
    row => row.instructionId === targetInstructionId,
  );
  if (targetIndex < 0) return null;
  const insertionIndex = placement === 'AFTER' ? targetIndex + 1 : targetIndex;
  destinationRows.splice(insertionIndex, 0, {
    ...source,
    blockId: target.blockId,
    blockOrderNumber: target.blockOrderNumber,
  });

  const replacements = new Map<number, InstructionGraphLayoutRow>();
  sourceWithoutDragged.forEach((row, index) => replacements.set(
    row.instructionId,
    { ...row, instructionOrderNumber: index + 1 },
  ));
  destinationRows.forEach((row, index) => replacements.set(
    row.instructionId,
    {
      ...row,
      blockId: target.blockId,
      blockOrderNumber: target.blockOrderNumber,
      instructionOrderNumber: index + 1,
    },
  ));
  return rows
    .map(row => replacements.get(row.instructionId) ?? { ...row })
    .sort(orderCompare);
};

const isEffectivelyActive = (command: VariableCommandLink): boolean =>
  command.active === true && command.blockActive === true;

const writerPrecedesConsumer = (
  variable: VariableGraphEntry,
  sourceInstructionId: number,
  layoutRows: readonly InstructionGraphLayoutRow[],
): boolean => {
  const layoutById = new Map(
    layoutRows.map(row => [row.instructionId, row]),
  );
  const source = layoutById.get(sourceInstructionId);
  if (!source) return false;
  return [
    ...variable.producers,
    ...variable.literalAssignments,
  ].some(writer => {
    if (
      writer.id === null
      || !isEffectivelyActive(writer)
      || !writesRuntimeVariableValue(writer.command)
    ) {
      return false;
    }
    const writerLayout = layoutById.get(writer.id);
    return Boolean(writerLayout) && orderCompare(
      writerLayout as InstructionGraphLayoutRow,
      source,
    ) < 0;
  });
};

const relationOwner = (
  snapshot: VariableWorkspaceSnapshot,
): RelationshipOwner => ({
  workspaceKind: 'BOT_JOB',
  homeBankingId: snapshot.botJob.homeBankingId,
  botJobId: snapshot.botJob.id,
});

const instructionTarget = (
  owner: RelationshipOwner,
  instructionId: number,
): RelationshipTarget => ({
  entity: 'INSTRUCTION',
  owner,
  id: instructionId,
});

const refused = (
  code: VariablesCrossBlockMoveErrorCode,
  message: string,
): VariablesCrossBlockMoveResult => ({ ok: false, code, message });

/**
 * Plans the intentionally small cross-block Variables mutation profile.
 *
 * All authoring decisions live here: exact destination, exact final layout,
 * writer safety, and explicit compatible parent candidates. The persistence
 * request is not built until the user chooses DISCONNECT or RECONNECT.
 */
export const planVariablesCrossBlockMove = (
  snapshot: VariableWorkspaceSnapshot,
  sourceInstructionId: number,
  targetInstructionId: number,
  placement: VariablesDropPlacement,
): VariablesCrossBlockMoveResult => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.crossBlockProfile !== 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1'
  ) {
    return refused(
      'CROSS_BLOCK_UNAVAILABLE',
      'Cross-block Variables movement is not enabled for this workspace.',
    );
  }
  if (!isCompleteContiguousLayout(
    capability.layoutRows,
    capability.instructionFacts,
  )) {
    return refused(
      'LAYOUT_INVALID',
      'The authoritative Variables layout is incomplete. Refresh Variables.',
    );
  }
  const source = sourceCommand(snapshot, sourceInstructionId);
  if (!source) {
    return refused(
      'SOURCE_NOT_FOUND',
      'The dragged variable command is no longer in the current snapshot.',
    );
  }
  const sourceFact = capability.instructionFacts.find(
    row => row.instructionId === sourceInstructionId,
  );
  const targetFact = capability.instructionFacts.find(
    row => row.instructionId === targetInstructionId,
  );
  if (!sourceFact) {
    return refused(
      'SOURCE_NOT_FOUND',
      'The authoritative source instruction is unavailable. Refresh Variables.',
    );
  }
  if (!targetFact) {
    return refused(
      'TARGET_NOT_FOUND',
      'The authoritative destination instruction is unavailable. Refresh Variables.',
    );
  }
  if (sourceFact.blockId === targetFact.blockId) {
    return refused(
      'SAME_BLOCK',
      'Use the existing same-block Variables movement for this drop.',
    );
  }
  const action = canonicalInstructionAction(sourceFact.action);
  if (
    source.command.role !== 'CONSUMER'
    || !CROSS_BLOCK_ACTIONS.has(action)
    || sourceFact.relationKind !== 'ELEMENT_TARGET'
  ) {
    return refused(
      'INVALID_SOURCE',
      'Only E, CK, PDF CHECK, and CSV CHECK consumers can move between blocks in this release.',
    );
  }
  const currentParent = sourceFact.parentId === null
    ? null
    : capability.instructionFacts.find(
      fact => fact.instructionId === sourceFact.parentId,
    ) ?? null;
  if (
    !currentParent
    || sourceFact.parentBlockId !== sourceFact.blockId
    || currentParent.blockId !== sourceFact.blockId
    || currentParent.instructionOrderNumber >= sourceFact.instructionOrderNumber
    || instructionRelationshipPolicy(currentParent.action).role !== 'WEB_ELEMENT'
  ) {
    return refused(
      'INVALID_SOURCE',
      'Reconnect this consumer to a valid preceding Web Element before moving it between blocks.',
    );
  }
  if (capability.instructionFacts.some(
    fact => fact.instructionId !== sourceInstructionId
      && fact.parentId === sourceInstructionId,
  )) {
    return refused(
      'SOURCE_HAS_DEPENDANTS',
      'This instruction still owns dependent instructions and cannot move alone.',
    );
  }
  const sourceRows = capability.layoutRows.filter(
    row => row.blockId === sourceFact.blockId,
  );
  if (sourceRows.length <= 1) {
    return refused(
      'EMPTY_SOURCE_BLOCK',
      'This move would leave the source block empty and was not staged.',
    );
  }
  if (!isFlatBlock(capability.instructionFacts, sourceFact.blockId)) {
    return refused(
      'STRUCTURAL_SOURCE_BLOCK',
      'The source block contains LOOP, IF, or navigation structure and is not enabled for cross-block movement.',
    );
  }
  if (!isFlatBlock(capability.instructionFacts, targetFact.blockId)) {
    return refused(
      'STRUCTURAL_DESTINATION_BLOCK',
      'The destination block contains LOOP, IF, or navigation structure and is not enabled for cross-block movement.',
    );
  }

  const layoutRows = moveAcrossBlocks(
    capability.layoutRows,
    sourceInstructionId,
    targetInstructionId,
    placement,
  );
  if (!layoutRows) {
    return refused(
      'LAYOUT_INVALID',
      'The complete cross-block layout could not be constructed.',
    );
  }
  const requiresWriterOrder = isEffectivelyActive(source.command)
    && instructionRelationshipPolicy(action)
      .requirements.includes('VARIABLE_ORDER');
  if (
    requiresWriterOrder
    && !writerPrecedesConsumer(
      source.variable,
      sourceInstructionId,
      layoutRows,
    )
  ) {
    return refused(
      'WRITER_ORDER',
      'The destination would execute this consumer before its active GET or SET writer.',
    );
  }

  const movedLayout = layoutRows.find(
    row => row.instructionId === sourceInstructionId,
  );
  if (!movedLayout) {
    return refused(
      'LAYOUT_INVALID',
      'The moved instruction is missing from the planned layout.',
    );
  }
  const compatibleFacts = capability.instructionFacts
    .filter(candidate => {
      if (candidate.blockId !== targetFact.blockId) return false;
      const candidateLayout = layoutRows.find(
        row => row.instructionId === candidate.instructionId,
      );
      return Boolean(candidateLayout)
        && (candidateLayout as InstructionGraphLayoutRow).instructionOrderNumber
          < movedLayout.instructionOrderNumber
        && instructionRelationshipPolicy(candidate.action).role === 'WEB_ELEMENT';
    })
    .sort(orderCompare);
  const owner = relationOwner(snapshot);
  const destinationBlockName = snapshot.blocks.find(
    block => block.id === targetFact.blockId,
  )?.name.trim();
  const sourceTarget = instructionTarget(owner, sourceInstructionId);
  const currentTargetFact = sourceFact.parentId === null
    ? null
    : capability.instructionFacts.find(
      row => row.instructionId === sourceFact.parentId,
    ) ?? null;
  const compatibleTargets = compatibleFacts.map<ReconnectRelationshipOption>(
    candidate => ({
      target: instructionTarget(owner, candidate.instructionId),
      label: factLabel(candidate) as string,
      sublabel: `Block #${candidate.blockOrderNumber} - block ID ${candidate.blockId}`,
      keywords: [
        candidate.instructionId,
        candidate.instructionOrderNumber,
        candidate.blockId,
        candidate.action,
      ].join(' '),
    }),
  );
  return {
    ok: true,
    plan: {
      sourceInstruction: source.command,
      sourceFact,
      targetFact,
      placement,
      destinationBlockId: targetFact.blockId,
      destinationBlockOrderNumber: targetFact.blockOrderNumber,
      destinationLabel: [
        placement === 'BEFORE' ? 'Before' : 'After',
        `instruction #${targetFact.instructionOrderNumber}`,
        `in Block #${targetFact.blockOrderNumber}`,
        destinationBlockName || '',
        `(block ID ${targetFact.blockId})`,
      ].filter(Boolean).join(' '),
      layoutRows,
      edge: {
        id: [
          'VARIABLES',
          'ELEMENT_TARGET',
          sourceInstructionId,
          targetFact.blockId,
        ].join(':'),
        kind: 'ELEMENT_TARGET',
        source: sourceTarget,
        target: currentTargetFact
          ? instructionTarget(owner, currentTargetFact.instructionId)
          : null,
        state: 'RECONNECT_PARENT',
        code: 'ELEMENT_TARGET_WRONG_BLOCK',
        required: true,
        compatibleTargets: compatibleTargets.map(option => option.target),
      },
      sourceLabel: factLabel(sourceFact) as string,
      currentTargetLabel: factLabel(currentTargetFact),
      compatibleTargets,
    },
  };
};

export const buildVariablesCrossBlockMutationDraft = (
  plan: VariablesCrossBlockMovePlan,
  choice: VariablesCrossBlockRelationshipChoice,
): BotJobGraphMutationDraft | null => {
  const expected = {
    parentId: plan.sourceFact.parentId,
    parentBlockId: plan.sourceFact.parentBlockId,
  };
  let relationPatch: InstructionGraphRelationPatch;
  if (choice.mode === 'DISCONNECT') {
    relationPatch = {
      instructionId: plan.sourceFact.instructionId,
      relationKind: 'ELEMENT_TARGET',
      operation: 'CLEAR',
      expected,
      replacement: {
        parentId: null,
        parentBlockId: null,
      },
    };
  } else {
    const compatible = plan.compatibleTargets.find(
      option => option.target.entity === 'INSTRUCTION'
        && option.target.id === choice.targetInstructionId,
    );
    if (!compatible) return null;
    relationPatch = {
      instructionId: plan.sourceFact.instructionId,
      relationKind: 'ELEMENT_TARGET',
      operation: 'SET',
      expected,
      replacement: {
        parentId: choice.targetInstructionId,
        parentBlockId: plan.destinationBlockId,
      },
    };
  }
  return {
    mutationKind: 'ROW_MOVE',
    draggedInstructionId: plan.sourceFact.instructionId,
    layoutRows: [...plan.layoutRows],
    instructionRelationPatches: [relationPatch],
    variableBindingPatches: [],
    variableOwnerPatches: [],
  };
};
