import { reorderMemoryItemsAsGroups } from './memoryList.groups';
import type { MemoryListItem } from './memoryList.contract';

const item = (key: string, dependencyGroupKey?: string): MemoryListItem => ({
  key,
  sourceKind: 'BOT_JOB',
  sourceItemKey: key,
  label: key,
  dependencyGroupKey,
  payload: {
    instructionId: Number(key.replace(/\D/g, '')) || 1,
    sourceRevision: 'revision-1',
  },
});

test('moves a parent GET Excel group as one unit and preserves its internal order', () => {
  const result = reorderMemoryItemsAsGroups([
    item('field-1', 'BOT_JOB:2:5:I:1,2,3|B:'),
    item('get-2', 'BOT_JOB:2:5:I:1,2,3|B:'),
    item('excel-3', 'BOT_JOB:2:5:I:1,2,3|B:'),
    item('unrelated-4'),
    item('unrelated-5'),
  ], 0, 4);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.movedCount).toBe(3);
  expect(result.items.map((row) => row.key)).toEqual([
    'unrelated-4',
    'unrelated-5',
    'field-1',
    'get-2',
    'excel-3',
  ]);
});

test('refuses dropping one connected member inside its own group', () => {
  const result = reorderMemoryItemsAsGroups([
    item('field-1', 'group-1'),
    item('get-2', 'group-1'),
    item('excel-3', 'group-1'),
    item('unrelated-4'),
  ], 0, 2);

  expect(result).toEqual({
    ok: false,
    reason: 'Rows inside one connected group cannot be separated.',
  });
});
