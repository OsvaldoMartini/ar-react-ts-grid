import type { MemoryListItem } from './memoryList.contract';

export type MemoryListGroupReorder =
  | { ok: true; items: MemoryListItem[]; movedCount: number }
  | { ok: false; reason: string };

const unitKey = (item: MemoryListItem): string => (
  item.dependencyGroupKey
    ? `GROUP:${item.dependencyGroupKey}`
    : `ITEM:${item.key}`
);

/**
 * Move one Memory List row while treating every connected dependency group as
 * one indivisible unit. Relative order inside the group is always preserved.
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

  const units: { key: string; items: MemoryListItem[] }[] = [];
  const unitByKey = new Map<string, { key: string; items: MemoryListItem[] }>();
  items.forEach((item) => {
    const key = unitKey(item);
    let unit = unitByKey.get(key);
    if (!unit) {
      unit = { key, items: [] };
      unitByKey.set(key, unit);
      units.push(unit);
    }
    unit.items.push(item);
  });

  const sourceKey = unitKey(items[from]);
  const targetKey = unitKey(items[to]);
  const sourceIndex = units.findIndex((unit) => unit.key === sourceKey);
  const targetIndex = units.findIndex((unit) => unit.key === targetKey);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return {
      ok: false,
      reason: 'Rows inside one connected group cannot be separated.',
    };
  }

  const nextUnits = [...units];
  const [moved] = nextUnits.splice(sourceIndex, 1);
  nextUnits.splice(targetIndex, 0, moved);
  return {
    ok: true,
    items: nextUnits.flatMap((unit) => unit.items),
    movedCount: moved.items.length,
  };
};
