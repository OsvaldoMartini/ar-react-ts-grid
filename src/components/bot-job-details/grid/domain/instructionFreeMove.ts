import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { instructionRelationshipPolicy } from './instructionRelationshipPolicy';
import type { WorkspaceBlock } from './workspaceBlocks';

export type FreeMoveRelationKind =
  | 'ELEMENT_TARGET'
  | 'LOOP_ANCHOR'
  | 'BLOCK_TARGET';

export type FreeMovePatchOperation = 'KEEP' | 'CLEAR' | 'SET';

export type FreeMoveParentPatch = {
  relationKind: 'ELEMENT_TARGET' | 'LOOP_ANCHOR';
  instructionId: number;
  operation: FreeMovePatchOperation;
  expectedParentId: number | null;
  newParentId: number | null;
  expectedParentBlockId: number | null;
  newParentBlockId: number | null;
};

export type FreeMoveBlockPatch = {
  relationKind: 'BLOCK_TARGET';
  instructionId: number;
  operation: FreeMovePatchOperation;
  expectedParentBlockId: number | null;
  newParentBlockId: number | null;
};

export type FreeMoveRelationshipPatch =
  | FreeMoveParentPatch
  | FreeMoveBlockPatch;

export type FreeMoveReconnectOption = {
  targetType: 'INSTRUCTION' | 'BLOCK';
  targetId: number;
  label: string;
  patch: FreeMoveRelationshipPatch;
};

export type FreeMoveRelationshipImpact = {
  instructionId: number;
  relationKind: FreeMoveRelationKind;
  state: 'PRESERVED' | 'CHOICE_REQUIRED';
  reasonCode: string | null;
  keepPatch: FreeMoveRelationshipPatch | null;
  disconnectPatch: FreeMoveRelationshipPatch;
  reconnectOptions: readonly FreeMoveReconnectOption[];
};

export type FreeMoveDeferredDiagnostic = {
  instructionId: number;
  kind: 'CONDITIONAL_STRUCTURE' | 'VARIABLE_ORDER';
  code: string;
};

export type InstructionFreeMovePlan = {
  ok: boolean;
  changed: boolean;
  error?: string;
  draggedInstructionId: number;
  sourceBlockId: number;
  destinationBlockId: number;
  layoutRows: readonly BlockLoopInstructionLoadDTO[];
  /**
   * A free row move never deletes its source Block. An empty Block remains in
   * the authoritative workspace catalog until the user explicitly deletes it.
   */
  deleteBlockId: -1;
  emptySourceBlockId: number | null;
  relationshipImpacts: readonly FreeMoveRelationshipImpact[];
  requiresRelationshipChoice: boolean;
  /**
   * Explicitly identifies relationship classes that this first slice does not
   * patch. Live activation must stay gated until a later planner resolves every
   * diagnostic; their absence is never inferred from an empty patch list.
   */
  deferredDiagnostics: readonly FreeMoveDeferredDiagnostic[];
};

const LOOP_ACTIONS = new Set(['LOOP', 'REFRESH_LOOP']);
const NAVIGATION_ACTIONS = new Set(['GOTO', 'EXCEL GOTO']);

const failure = (
  instructionId: number,
  error: string,
): InstructionFreeMovePlan => ({
  ok: false,
  changed: false,
  error,
  draggedInstructionId: instructionId,
  sourceBlockId: -1,
  destinationBlockId: -1,
  layoutRows: [],
  deleteBlockId: -1,
  emptySourceBlockId: null,
  relationshipImpacts: [],
  requiresRelationshipChoice: false,
  deferredDiagnostics: [],
});

const actionOf = (row: BlockLoopInstructionLoadDTO): string =>
  instructionRelationshipPolicy(row.actions).canonicalAction;

const compareWithinBlock = (
  left: BlockLoopInstructionLoadDTO,
  right: BlockLoopInstructionLoadDTO,
): number =>
  left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const compareLayout = (
  left: BlockLoopInstructionLoadDTO,
  right: BlockLoopInstructionLoadDTO,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || compareWithinBlock(left, right);

const normalizeBlock = (
  rows: readonly BlockLoopInstructionLoadDTO[],
): BlockLoopInstructionLoadDTO[] =>
  rows.map((row, index) => ({ ...row, instructionOrderNumber: index + 1 }));

const parentPatch = (
  row: BlockLoopInstructionLoadDTO,
  relationKind: 'ELEMENT_TARGET' | 'LOOP_ANCHOR',
  operation: FreeMovePatchOperation,
  newParentId: number | null,
  newParentBlockId: number | null,
): FreeMoveParentPatch => ({
  relationKind,
  instructionId: row.id,
  operation,
  expectedParentId: row.parentId ?? null,
  newParentId,
  expectedParentBlockId: row.parentBlockId ?? null,
  newParentBlockId,
});

const blockPatch = (
  row: BlockLoopInstructionLoadDTO,
  operation: FreeMovePatchOperation,
  newParentBlockId: number | null,
): FreeMoveBlockPatch => ({
  relationKind: 'BLOCK_TARGET',
  instructionId: row.id,
  operation,
  expectedParentBlockId: row.parentBlockId ?? null,
  newParentBlockId,
});

const isBeforeInSameBlock = (
  candidate: BlockLoopInstructionLoadDTO,
  row: BlockLoopInstructionLoadDTO,
): boolean =>
  candidate.blockId === row.blockId
  && compareWithinBlock(candidate, row) < 0;

const supportsElementTarget = (
  dependent: BlockLoopInstructionLoadDTO,
  candidate: BlockLoopInstructionLoadDTO,
): boolean => {
  const dependentPolicy = instructionRelationshipPolicy(dependent.actions);
  if (instructionRelationshipPolicy(candidate.actions).role !== 'WEB_ELEMENT') {
    return false;
  }
  if (dependentPolicy.allowedElementTags.length === 0) return true;
  return typeof candidate.tagName === 'string'
    && dependentPolicy.allowedElementTags.includes(
      candidate.tagName.trim().toLocaleLowerCase(),
    );
};

const relationKindFor = (
  row: BlockLoopInstructionLoadDTO,
): FreeMoveRelationKind | null => {
  const action = actionOf(row);
  if (NAVIGATION_ACTIONS.has(action)) return 'BLOCK_TARGET';
  if (LOOP_ACTIONS.has(action)) return 'LOOP_ANCHOR';
  if (
    instructionRelationshipPolicy(action).requirements.includes('ELEMENT_TARGET')
    || (
      row.parentId != null
      && instructionRelationshipPolicy(action).structuralSemantics === 'NONE'
    )
  ) {
    return 'ELEMENT_TARGET';
  }
  return null;
};

const parentReason = (
  row: BlockLoopInstructionLoadDTO,
  parent: BlockLoopInstructionLoadDTO | undefined,
  relationKind: 'ELEMENT_TARGET' | 'LOOP_ANCHOR',
): string | null => {
  if (row.parentId == null) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'MISSING_LOOP_ANCHOR'
      : 'MISSING_ELEMENT_TARGET';
  }
  if (!parent) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'DANGLING_LOOP_ANCHOR'
      : 'DANGLING_ELEMENT_TARGET';
  }
  if (parent.blockId !== row.blockId) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'LOOP_ANCHOR_WRONG_BLOCK'
      : 'ELEMENT_TARGET_WRONG_BLOCK';
  }
  if (row.parentBlockId != null && row.parentBlockId !== parent.blockId) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'LOOP_ANCHOR_BLOCK_PROJECTION'
      : 'ELEMENT_TARGET_BLOCK_PROJECTION';
  }
  if (!supportsElementTarget(row, parent)) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'INCOMPATIBLE_LOOP_ANCHOR'
      : 'INCOMPATIBLE_ELEMENT_TARGET';
  }
  if (!isBeforeInSameBlock(parent, row)) {
    return relationKind === 'LOOP_ANCHOR'
      ? 'LOOP_ANCHOR_ORDER'
      : 'ELEMENT_TARGET_ORDER';
  }
  return null;
};

const buildParentImpact = (
  row: BlockLoopInstructionLoadDTO,
  relationKind: 'ELEMENT_TARGET' | 'LOOP_ANCHOR',
  rows: readonly BlockLoopInstructionLoadDTO[],
): FreeMoveRelationshipImpact => {
  const rowsById = new Map(rows.map(candidate => [candidate.id, candidate]));
  const parent = row.parentId == null ? undefined : rowsById.get(row.parentId);
  const reasonCode = parentReason(row, parent, relationKind);
  const reconnectOptions = rows
    .filter(candidate =>
      candidate.id !== row.id
      && isBeforeInSameBlock(candidate, row)
      && supportsElementTarget(row, candidate))
    .map(candidate => ({
      targetType: 'INSTRUCTION' as const,
      targetId: candidate.id,
      label: `#${candidate.instructionOrderNumber} ${candidate.name || candidate.actions}`,
      patch: parentPatch(
        row,
        relationKind,
        'SET',
        candidate.id,
        candidate.blockId,
      ),
    }));
  const disconnectPatch = parentPatch(row, relationKind, 'CLEAR', null, null);
  return {
    instructionId: row.id,
    relationKind,
    state: reasonCode === null ? 'PRESERVED' : 'CHOICE_REQUIRED',
    reasonCode,
    keepPatch: reasonCode === null
      ? parentPatch(
          row,
          relationKind,
          'KEEP',
          row.parentId ?? null,
          row.parentBlockId ?? null,
        )
      : null,
    disconnectPatch,
    reconnectOptions,
  };
};

const buildBlockImpact = (
  row: BlockLoopInstructionLoadDTO,
  blocks: readonly WorkspaceBlock[],
): FreeMoveRelationshipImpact => {
  const targetBlockId = row.parentBlockId ?? null;
  const targetExists = targetBlockId !== null
    && blocks.some(block => block.blockId === targetBlockId);
  const selfTarget = targetBlockId !== null && targetBlockId === row.blockId;
  const reasonCode = targetBlockId === null
    ? 'MISSING_BLOCK_TARGET'
    : !targetExists
      ? 'DANGLING_BLOCK_TARGET'
      : selfTarget
        ? 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK'
        : null;
  const reconnectOptions = blocks
    .filter(block => block.blockId !== row.blockId)
    .map(block => ({
      targetType: 'BLOCK' as const,
      targetId: block.blockId,
      label: `#${block.blockOrderNumber} ${block.blockName}`,
      patch: blockPatch(row, 'SET', block.blockId),
    }));
  return {
    instructionId: row.id,
    relationKind: 'BLOCK_TARGET',
    state: reasonCode === null ? 'PRESERVED' : 'CHOICE_REQUIRED',
    reasonCode,
    keepPatch: reasonCode === null
      ? blockPatch(row, 'KEEP', targetBlockId)
      : null,
    disconnectPatch: blockPatch(row, 'CLEAR', null),
    reconnectOptions,
  };
};

const relationshipImpacts = (
  originalRows: readonly BlockLoopInstructionLoadDTO[],
  layoutRows: readonly BlockLoopInstructionLoadDTO[],
  movedInstructionId: number,
  blocks: readonly WorkspaceBlock[],
): FreeMoveRelationshipImpact[] => {
  const original = new Map(originalRows.map(row => [row.id, row]));
  const moved = original.get(movedInstructionId);
  if (!moved) return [];

  // Moving a parent can invalidate dependants left behind, so evaluate the
  // moved row plus every row that directly references it.
  const affectedIds = new Set<number>([movedInstructionId]);
  originalRows.forEach(row => {
    if (row.parentId === movedInstructionId) affectedIds.add(row.id);
  });

  const impacts: FreeMoveRelationshipImpact[] = [];
  layoutRows.forEach(row => {
    if (!affectedIds.has(row.id)) return;
    const relationKind = relationKindFor(row);
    if (relationKind === 'BLOCK_TARGET') {
      impacts.push(buildBlockImpact(row, blocks));
    } else if (relationKind === 'LOOP_ANCHOR' || relationKind === 'ELEMENT_TARGET') {
      impacts.push(buildParentImpact(row, relationKind, layoutRows));
    }
  });
  return impacts.sort((left, right) =>
    left.instructionId - right.instructionId
    || left.relationKind.localeCompare(right.relationKind));
};

const deferredDiagnostics = (
  originalRows: readonly BlockLoopInstructionLoadDTO[],
  movedInstructionId: number,
): FreeMoveDeferredDiagnostic[] => {
  const moved = originalRows.find(row => row.id === movedInstructionId);
  if (!moved) return [];
  const diagnostics: FreeMoveDeferredDiagnostic[] = [];
  if (
    instructionRelationshipPolicy(moved.actions).structuralSemantics
      === 'CONDITIONAL_ROOT'
    || instructionRelationshipPolicy(moved.actions).structuralSemantics
      === 'CONDITIONAL_BOUNDARY'
  ) {
    diagnostics.push({
      instructionId: moved.id,
      kind: 'CONDITIONAL_STRUCTURE',
      code: 'CONDITIONAL_FREE_MOVE_NOT_PLANNED',
    });
  }
  if (moved.variableId != null) {
    diagnostics.push({
      instructionId: moved.id,
      kind: 'VARIABLE_ORDER',
      code: 'VARIABLE_ORDER_REQUIRES_GRAPH_REVIEW',
    });
  }
  return diagnostics;
};

/**
 * Pure Bot Job authoring planner. It changes physical layout only; relationship
 * changes are returned as explicit preview patches and are never silently
 * applied. A valid relationship has one mechanical KEEP result. Every invalid
 * relationship still requires the caller to choose Cancel, Move & Disconnect,
 * or one exact Move & Reconnect patch before persistence.
 */
export const planBotJobInstructionFreeMove = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  instructionId: number,
  destinationBlockId: number,
  destinationIndex: number,
  workspaceBlocks: readonly WorkspaceBlock[],
): InstructionFreeMovePlan => {
  if (!Number.isSafeInteger(destinationIndex) || destinationIndex < 0) {
    return failure(
      instructionId,
      'The destination index must be a non-negative safe integer.',
    );
  }
  const blocksById = new Map<number, WorkspaceBlock>();
  for (const block of workspaceBlocks) {
    if (blocksById.has(block.blockId)) {
      return failure(
        instructionId,
        `The workspace contains duplicate Block ID #${block.blockId}.`,
      );
    }
    blocksById.set(block.blockId, block);
  }
  const missingBlockRow = rows.find(row => !blocksById.has(row.blockId));
  if (missingBlockRow) {
    return failure(
      instructionId,
      `Instruction #${missingBlockRow.id} references a Block outside the workspace.`,
    );
  }
  const catalogRows = rows.map(row => ({
    ...row,
    blockOrderNumber: blocksById.get(row.blockId)!.blockOrderNumber,
  }));
  const source = catalogRows.find(row => row.id === instructionId);
  if (!source) return failure(instructionId, 'The dragged instruction no longer exists.');
  const destination = workspaceBlocks.find(block => block.blockId === destinationBlockId);
  if (!destination) return failure(instructionId, 'The destination block no longer exists.');
  if (new Set(catalogRows.map(row => row.id)).size !== catalogRows.length) {
    return failure(instructionId, 'The instruction layout contains duplicate IDs.');
  }

  const sourceRows = [...catalogRows.filter(row => row.blockId === source.blockId)]
    .sort(compareWithinBlock);
  const targetRows = source.blockId === destinationBlockId
    ? sourceRows
    : [...catalogRows.filter(row => row.blockId === destinationBlockId)]
      .sort(compareWithinBlock);
  const sourceIndex = sourceRows.findIndex(row => row.id === instructionId);
  if (sourceIndex < 0) return failure(instructionId, 'The dragged instruction is not in its block.');

  if (
    source.blockId === destinationBlockId
    && destinationIndex === sourceIndex
  ) {
    return {
      ok: true,
      changed: false,
      draggedInstructionId: instructionId,
      sourceBlockId: source.blockId,
      destinationBlockId,
      layoutRows: [...catalogRows].sort(compareLayout),
      deleteBlockId: -1,
      emptySourceBlockId: null,
      relationshipImpacts: [],
      requiresRelationshipChoice: false,
      deferredDiagnostics: [],
    };
  }

  const sourceRemainder = sourceRows.filter(row => row.id !== instructionId);
  const destinationRemainder = source.blockId === destinationBlockId
    ? sourceRemainder
    : targetRows;
  let insertAt = Math.max(0, Math.min(destinationIndex, destinationRemainder.length));
  if (source.blockId === destinationBlockId) {
    const target = targetRows[destinationIndex];
    if (target) {
      const targetAfterRemoval = destinationRemainder.findIndex(row => row.id === target.id);
      if (targetAfterRemoval >= 0) {
        insertAt = sourceIndex < destinationIndex
          ? targetAfterRemoval + 1
          : targetAfterRemoval;
      }
    }
  }

  const movedRow: BlockLoopInstructionLoadDTO = {
    ...source,
    blockId: destination.blockId,
    blockOrderNumber: destination.blockOrderNumber,
    blockName: destination.blockName,
    blockActive: destination.blockActive,
    blockWait: destination.blockWait,
    exportFile: destination.exportFile,
    // Relationship fields and variableId intentionally remain unchanged here.
    // Any change is represented by an explicit preview patch below.
  };
  const nextDestination = [...destinationRemainder];
  nextDestination.splice(insertAt, 0, movedRow);

  const unaffected = catalogRows.filter(row =>
    row.blockId !== source.blockId && row.blockId !== destinationBlockId);
  const layoutRows = [
    ...unaffected,
    ...(source.blockId === destinationBlockId ? [] : normalizeBlock(sourceRemainder)),
    ...normalizeBlock(nextDestination),
  ].sort(compareLayout);
  const impacts = relationshipImpacts(
    catalogRows,
    layoutRows,
    instructionId,
    workspaceBlocks,
  );

  return {
    ok: true,
    changed: true,
    draggedInstructionId: instructionId,
    sourceBlockId: source.blockId,
    destinationBlockId,
    layoutRows,
    deleteBlockId: -1,
    emptySourceBlockId:
      source.blockId !== destinationBlockId && sourceRemainder.length === 0
        ? source.blockId
        : null,
    relationshipImpacts: impacts,
    requiresRelationshipChoice: impacts.some(impact => impact.state === 'CHOICE_REQUIRED'),
    deferredDiagnostics: deferredDiagnostics(catalogRows, instructionId),
  };
};
