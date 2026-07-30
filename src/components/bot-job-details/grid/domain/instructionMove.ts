import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  canonicalInstructionAction,
  type InstructionVariableLink,
} from './instructionDependency';
import type { WorkspaceBlock } from './workspaceBlocks';

export type InstructionMovePlan = {
  ok: boolean;
  changed: boolean;
  error?: string;
  group: BlockLoopInstructionLoadDTO[];
  rows: BlockLoopInstructionLoadDTO[];
  deleteBlockId: number;
};

const CONDITIONAL_BOUNDARIES = new Set(['IF', 'ELSEIF', 'ELSE', 'ENDIF']);
const LOOP_BOUNDARIES = new Set(['LOOP', 'REFRESH_LOOP']);
const NAVIGATION_ACTIONS = new Set(['GOTO', 'EXCEL GOTO']);
const VARIABLE_CONSUMERS = new Set(['E', 'CK', 'PDF CHECK', 'CSV CHECK']);

const failure = (
  error: string,
  group: BlockLoopInstructionLoadDTO[] = [],
): InstructionMovePlan => ({
  ok: false,
  changed: false,
  error,
  group,
  rows: [],
  deleteBlockId: -1,
});

const sortWithinBlock = (
  rows: readonly BlockLoopInstructionLoadDTO[],
): BlockLoopInstructionLoadDTO[] => [...rows].sort(
  (left, right) =>
    left.instructionOrderNumber - right.instructionOrderNumber
    || left.id - right.id,
);

const sortLayout = (
  rows: readonly BlockLoopInstructionLoadDTO[],
): BlockLoopInstructionLoadDTO[] => [...rows].sort(
  (left, right) =>
    left.blockOrderNumber - right.blockOrderNumber
    || left.blockId - right.blockId
    || left.instructionOrderNumber - right.instructionOrderNumber
    || left.id - right.id,
);

const addConditionalFamily = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  selected: BlockLoopInstructionLoadDTO,
  included: Set<number>,
): void => {
  const action = canonicalInstructionAction(selected.actions);
  const rootId = action === 'IF' ? selected.id : selected.parentId;
  if (rootId == null) return;
  const rootIndex = rows.findIndex(row =>
    row.id === rootId && canonicalInstructionAction(row.actions) === 'IF');
  if (rootIndex < 0) return;

  let depth = 0;
  for (let index = rootIndex; index < rows.length; index += 1) {
    const row = rows[index];
    const rowAction = canonicalInstructionAction(row.actions);
    if (rowAction === 'IF') depth += 1;
    included.add(row.id);
    if (rowAction === 'ENDIF') {
      depth -= 1;
      if (depth === 0) return;
    }
  }
};

const addLoopFamily = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  boundary: BlockLoopInstructionLoadDTO,
  included: Set<number>,
): void => {
  if (!LOOP_BOUNDARIES.has(canonicalInstructionAction(boundary.actions))
    || boundary.parentId == null) return;
  const parentIndex = rows.findIndex(row => row.id === boundary.parentId);
  const boundaryIndex = rows.findIndex(row => row.id === boundary.id);
  if (parentIndex < 0 || boundaryIndex < 0) return;
  const start = Math.min(parentIndex, boundaryIndex);
  const end = Math.max(parentIndex, boundaryIndex);
  for (let index = start; index <= end; index += 1) {
    included.add(rows[index].id);
  }
};

const isHardParentEdge = (
  row: BlockLoopInstructionLoadDTO,
  rowsById: ReadonlyMap<number, BlockLoopInstructionLoadDTO>,
): boolean => {
  if (row.parentId == null || row.parentId === row.id) return false;
  const action = canonicalInstructionAction(row.actions);
  if (CONDITIONAL_BOUNDARIES.has(action) || LOOP_BOUNDARIES.has(action)) {
    return false;
  }
  if (NAVIGATION_ACTIONS.has(action)) {
    return false;
  }
  const parent = rowsById.get(row.parentId);
  return parent != null
    && !CONDITIONAL_BOUNDARIES.has(canonicalInstructionAction(parent.actions))
    && !LOOP_BOUNDARIES.has(canonicalInstructionAction(parent.actions));
};

/**
 * Resolve the atomic unit for row movement only.
 *
 * Unlike Memory List FULL selection, an ordinary instruction located inside an
 * IF/LOOP body remains independently movable. Boundary rows, loop anchors, and
 * hard Web Field parent families still travel as complete units.
 */
export const resolveInstructionDragGroup = (
  sourceRows: readonly BlockLoopInstructionLoadDTO[],
  selectedInstructionId: number,
): BlockLoopInstructionLoadDTO[] => {
  const rows = sortWithinBlock(sourceRows);
  const rowsById = new Map(rows.map(row => [row.id, row]));
  const selected = rowsById.get(selectedInstructionId);
  if (!selected) return [];

  const included = new Set<number>([selected.id]);
  const include = (instructionId: number): boolean => {
    const before = included.size;
    included.add(instructionId);
    return included.size !== before;
  };
  let changed = true;
  while (changed) {
    changed = false;

    for (const row of rows) {
      const action = canonicalInstructionAction(row.actions);
      if (included.has(row.id) && CONDITIONAL_BOUNDARIES.has(action)) {
        const before = included.size;
        addConditionalFamily(rows, row, included);
        if (included.size !== before) changed = true;
      }
    }

    for (const row of rows) {
      const action = canonicalInstructionAction(row.actions);
      if (LOOP_BOUNDARIES.has(action)
        && (included.has(row.id) || (row.parentId != null && included.has(row.parentId)))) {
        const before = included.size;
        addLoopFamily(rows, row, included);
        if (included.size !== before) changed = true;
      }
    }

    for (const row of rows) {
      if (!isHardParentEdge(row, rowsById)) continue;
      if (included.has(row.id) || (row.parentId != null && included.has(row.parentId))) {
        if (include(row.id)) changed = true;
        if (row.parentId != null && include(row.parentId)) changed = true;
        for (const sibling of rows) {
          if (sibling.parentId === row.parentId && isHardParentEdge(sibling, rowsById)) {
            if (include(sibling.id)) changed = true;
          }
        }
      }
    }
  }

  return rows.filter(row => included.has(row.id));
};

type SemanticError = {
  key: string;
  message: string;
};

const collectSemanticErrors = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  variableLinks: readonly InstructionVariableLink[],
  validBlockIds: ReadonlySet<number>,
): SemanticError[] => {
  const errors: SemanticError[] = [];
  const rowsById = new Map(rows.map(row => [row.id, row]));
  const blocks = new Map<number, BlockLoopInstructionLoadDTO[]>();
  rows.forEach(row => {
    blocks.set(row.blockId, [...(blocks.get(row.blockId) ?? []), row]);
  });

  blocks.forEach((suppliedRows, blockId) => {
    const blockRows = sortWithinBlock(suppliedRows);
    const conditionalStack: number[] = [];
    let elseSeen = new Set<number>();

    for (const row of blockRows) {
      const action = canonicalInstructionAction(row.actions);
      if (action === 'IF') {
        if (row.parentId !== row.id) {
          errors.push({
            key: `conditional-self:${row.id}`,
            message: `IF instruction #${row.id} must reference itself.`,
          });
        }
        conditionalStack.push(row.id);
        continue;
      }
      if (action === 'ELSEIF' || action === 'ELSE' || action === 'ENDIF') {
        const rootId = conditionalStack[conditionalStack.length - 1];
        if (rootId == null) {
          errors.push({
            key: `conditional-missing-root:${row.id}`,
            message: `${action} instruction #${row.id} has no matching IF.`,
          });
          continue;
        }
        if (row.parentId !== rootId) {
          errors.push({
            key: `conditional-parent:${row.id}`,
            message: `${action} instruction #${row.id} does not reference its matching IF.`,
          });
        }
        if (action === 'ELSEIF' && elseSeen.has(rootId)) {
          errors.push({
            key: `conditional-elseif-after-else:${row.id}`,
            message: `ELSEIF instruction #${row.id} appears after ELSE.`,
          });
        }
        if (action === 'ELSE') {
          if (elseSeen.has(rootId)) {
            errors.push({
              key: `conditional-duplicate-else:${rootId}`,
              message: `IF instruction #${rootId} contains more than one ELSE.`,
            });
          }
          elseSeen.add(rootId);
        }
        if (action === 'ENDIF') {
          conditionalStack.pop();
          elseSeen = new Set([...elseSeen].filter(id => id !== rootId));
        }
      }
    }
    conditionalStack.forEach(rootId => errors.push({
      key: `conditional-missing-end:${rootId}`,
      message: `IF instruction #${rootId} has no matching ENDIF.`,
    }));

    if (blockRows.length > 0
      && blockRows.every(row => canonicalInstructionAction(row.actions) === 'EXCEL GOTO')) {
      errors.push({
        key: `excel-goto-solitary:${blockId}`,
        message: 'EXCEL GOTO cannot be left as the only instruction in a block.',
      });
    }
  });

  for (const row of rows) {
    const action = canonicalInstructionAction(row.actions);
    if (LOOP_BOUNDARIES.has(action)) {
      const parent = row.parentId == null ? undefined : rowsById.get(row.parentId);
      if (!parent || parent.blockId !== row.blockId) {
        errors.push({
          key: `loop-parent:${row.id}`,
          message: `${action} instruction #${row.id} must remain with its parent.`,
        });
      } else if (parent.instructionOrderNumber >= row.instructionOrderNumber) {
        errors.push({
          key: `loop-order:${row.id}`,
          message: `${action} instruction #${row.id} must run after its parent.`,
        });
      }
      continue;
    }

    if (row.parentId != null
      && !CONDITIONAL_BOUNDARIES.has(action)
      && !NAVIGATION_ACTIONS.has(action)) {
      const parent = rowsById.get(row.parentId);
      if (!parent) {
        errors.push({
          key: `parent-missing:${row.id}`,
          message: `Instruction #${row.id} references a missing parent.`,
        });
      } else if (parent.blockId !== row.blockId) {
        errors.push({
          key: `parent-block:${row.id}`,
          message: `Instruction #${row.id} must remain in its parent block.`,
        });
      } else if (parent.instructionOrderNumber >= row.instructionOrderNumber) {
        errors.push({
          key: `parent-order:${row.id}`,
          message: `The parent of instruction #${row.id} must run first.`,
        });
      }
    }

    if ((action === 'GOTO' || action === 'EXCEL GOTO')
      && row.parentBlockId != null
      && !validBlockIds.has(row.parentBlockId)) {
      errors.push({
        key: `navigation-target:${row.id}`,
        message: `${action} instruction #${row.id} references a missing block.`,
      });
    }

    if (row.variableId != null && VARIABLE_CONSUMERS.has(action)) {
      const producers = rows.filter(candidate =>
        candidate.variableId === row.variableId
        && canonicalInstructionAction(candidate.actions) === 'GET');
      if (producers.length > 0 && !producers.some(producer =>
        producer.blockOrderNumber < row.blockOrderNumber
        || (producer.blockOrderNumber === row.blockOrderNumber
          && producer.instructionOrderNumber < row.instructionOrderNumber))) {
        errors.push({
          key: `variable-order:${row.id}:${row.variableId}`,
          message: `GET must run before ${action} instruction #${row.id}.`,
        });
      }
    }
  }

  // Variable ownership is part of the authoritative graph/revision. Keep the
  // argument explicit so move planning cannot accidentally use an uncorrelated
  // instruction-only snapshot.
  void variableLinks;
  return errors;
};

const validateLayoutShape = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  originalCount: number,
  validBlockIds: ReadonlySet<number>,
): string | null => {
  if (rows.length !== originalCount) {
    return 'The move layout does not contain every rendered instruction.';
  }
  const ids = new Set<number>();
  const orders = new Map<number, Set<number>>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.id) || row.id <= 0 || ids.has(row.id)) {
      return 'The move layout contains a missing or duplicate instruction ID.';
    }
    ids.add(row.id);
    if (!validBlockIds.has(row.blockId)) {
      return 'The move layout references a block outside this workspace.';
    }
    const blockOrders = orders.get(row.blockId) ?? new Set<number>();
    if (!Number.isSafeInteger(row.instructionOrderNumber)
      || row.instructionOrderNumber <= 0
      || blockOrders.has(row.instructionOrderNumber)) {
      return 'The move layout contains a duplicate or invalid instruction order.';
    }
    blockOrders.add(row.instructionOrderNumber);
    orders.set(row.blockId, blockOrders);
  }
  for (const blockOrders of orders.values()) {
    for (let order = 1; order <= blockOrders.size; order += 1) {
      if (!blockOrders.has(order)) {
        return 'Instruction orders must remain contiguous inside every block.';
      }
    }
  }
  return null;
};

const projectParentBlocks = (
  originalRows: readonly BlockLoopInstructionLoadDTO[],
  finalRows: readonly BlockLoopInstructionLoadDTO[],
): BlockLoopInstructionLoadDTO[] => {
  const originalById = new Map(originalRows.map(row => [row.id, row]));
  const finalById = new Map(finalRows.map(row => [row.id, row]));
  return finalRows.map(row => {
    const original = originalById.get(row.id);
    const parent = row.parentId == null ? undefined : finalById.get(row.parentId);
    const originalParent = row.parentId == null ? undefined : originalById.get(row.parentId);
    if (!original || !parent || !originalParent
      || NAVIGATION_ACTIONS.has(canonicalInstructionAction(original.actions))) {
      return { ...row, parentBlockId: original?.parentBlockId };
    }
    const relationshipMoved = original.blockId !== row.blockId
      || originalParent.blockId !== parent.blockId;
    return {
      ...row,
      parentBlockId: relationshipMoved ? parent.blockId : original.parentBlockId,
    };
  });
};

/** Build one complete, immutable version-2 row layout without a backend preview. */
export const planInstructionMove = (
  rows: readonly BlockLoopInstructionLoadDTO[],
  variableLinks: readonly InstructionVariableLink[],
  instructionId: number,
  destinationBlockId: number,
  destinationIndex: number,
  workspaceBlocks: readonly WorkspaceBlock[],
): InstructionMovePlan => {
  const blockCatalog = new Map(workspaceBlocks.map(block => [block.blockId, block]));
  const validBlockIds = new Set(blockCatalog.keys());
  const source = rows.find(row => row.id === instructionId);
  if (!source) return failure('The dragged instruction no longer exists.');
  const destinationBlock = blockCatalog.get(destinationBlockId);
  if (!destinationBlock) return failure('The destination block no longer exists.');

  const sourceAll = sortWithinBlock(rows.filter(row => row.blockId === source.blockId));
  const group = resolveInstructionDragGroup(sourceAll, instructionId);
  if (group.length === 0) {
    return failure('The connected move group could not be resolved.');
  }
  const groupIds = new Set(group.map(row => row.id));
  const targetAll = sortWithinBlock(rows.filter(row => row.blockId === destinationBlockId));
  if (source.blockId === destinationBlockId) {
    const target = targetAll[destinationIndex];
    if (target && groupIds.has(target.id)) {
      return {
        ok: true,
        changed: false,
        group,
        rows: sortLayout(rows),
        deleteBlockId: -1,
      };
    }
  }

  const sourceRemainder = sourceAll.filter(row => !groupIds.has(row.id));
  const destinationRows = source.blockId === destinationBlockId
    ? sourceRemainder
    : targetAll;
  let insertAt = Math.max(0, Math.min(destinationIndex, destinationRows.length));
  if (source.blockId === destinationBlockId) {
    const target = targetAll[destinationIndex];
    if (target) {
      const targetAfterRemoval = sourceRemainder.findIndex(row => row.id === target.id);
      const firstGroupIndex = targetAll.findIndex(row => groupIds.has(row.id));
      if (targetAfterRemoval >= 0) {
        // Preserve the established row-drop behavior: moving downward places
        // the unit after the target row; moving upward places it before.
        insertAt = firstGroupIndex < destinationIndex
          ? targetAfterRemoval + 1
          : targetAfterRemoval;
      }
    }
  }
  const movedRows = group.map(row => ({
    ...row,
    blockId: destinationBlock.blockId,
    blockOrderNumber: destinationBlock.blockOrderNumber,
    blockName: destinationBlock.blockName,
    blockActive: destinationBlock.blockActive,
    blockWait: destinationBlock.blockWait,
    exportFile: destinationBlock.exportFile,
  }));
  const nextDestination = [...destinationRows];
  nextDestination.splice(insertAt, 0, ...movedRows);

  const normalizedDestination = nextDestination.map((row, index) => ({
    ...row,
    instructionOrderNumber: index + 1,
  }));
  const normalizedSource = source.blockId === destinationBlockId
    ? []
    : sourceRemainder.map((row, index) => ({
        ...row,
        instructionOrderNumber: index + 1,
      }));
  const unaffected = rows.filter(row =>
    row.blockId !== source.blockId && row.blockId !== destinationBlockId);
  const projected = projectParentBlocks(rows, [
    ...unaffected,
    ...normalizedSource,
    ...normalizedDestination,
  ]);

  const shapeError = validateLayoutShape(projected, rows.length, validBlockIds);
  if (shapeError) return failure(shapeError, group);

  const originalById = new Map(rows.map(row => [row.id, row]));
  const changed = projected.some(row => {
    const original = originalById.get(row.id);
    return original == null
      || original.blockId !== row.blockId
      || original.instructionOrderNumber !== row.instructionOrderNumber
      || original.parentBlockId !== row.parentBlockId;
  });
  return {
    ok: true,
    changed,
    group,
    rows: sortLayout(projected),
    deleteBlockId:
      source.blockId !== destinationBlockId && sourceRemainder.length === 0
        ? source.blockId
        : -1,
  };
};
