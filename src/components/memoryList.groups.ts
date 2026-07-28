import type { MemoryListItem } from './memoryList.contract';

export type MemoryListGroupReorder =
  | { ok: true; items: MemoryListItem[]; movedCount: number }
  | { ok: false; reason: string };

/**
 * Move one Memory List row while treating every connected dependency group as one
 * atomic unit for MOVEMENT, without demanding contiguity for PLACEMENT:
 *
 * - Dragging any member moves its whole connected group, internal order preserved.
 * - Dropping an independent row (or another group) BETWEEN two connected members is
 *   allowed — the applied output then contains it at that position. The connected
 *   members themselves are never reordered relative to each other.
 * - Dropping a member onto another member of its own group is refused.
 *
 * The backend mirror is MemoryListReorder.resolveGrouped (relative-order invariant).
 */
export const reorderMemoryItemsAsGroups = (
  items: readonly MemoryListItem[],
  from: number,
  to: number,
): MemoryListGroupReorder => {
  if (
    from < 0 || to < 0
    || from >= items.length || to >= items.length
    || from === to
  ) {
    return { ok: false, reason: 'The requested Memory List movement is a no-op.' };
  }

  const source = items[from];
  const target = items[to];
  const movingKeys = new Set(
    (source.dependencyGroupKey
      ? items.filter(item => item.dependencyGroupKey === source.dependencyGroupKey)
      : [source]
    ).map(item => item.key),
  );
  if (movingKeys.has(target.key)) {
    return {
      ok: false,
      reason: 'Rows inside one connected group cannot be separated.',
    };
  }

  const moving = items.filter(item => movingKeys.has(item.key));
  const remaining = items.filter(item => !movingKeys.has(item.key));
  const targetIndex = remaining.findIndex(item => item.key === target.key);
  if (targetIndex < 0) {
    return {
      ok: false,
      reason: 'Memory List changed during the drag. Try the movement again.',
    };
  }

  // Downward drag places the unit after the target row; upward places it before —
  // the same established behavior as the instruction grid drop.
  const insertAt = from < to ? targetIndex + 1 : targetIndex;
  return {
    ok: true,
    items: [
      ...remaining.slice(0, insertAt),
      ...moving,
      ...remaining.slice(insertAt),
    ],
    movedCount: moving.length,
  };
};
