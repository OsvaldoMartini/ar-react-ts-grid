import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import type { MemoryListItem } from './memoryList.contract';
import { useMemoryListDrag } from './useMemoryListDrag';

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

const dragEvent = () => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  dataTransfer: {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: jest.fn(),
  },
} as unknown as React.DragEvent);

test('uses the stable dragged key when a realtime snapshot changes row indices', () => {
  const onReorder = jest.fn((_items: MemoryListItem[]) => true);
  const onRefusal = jest.fn();
  const { result, rerender } = renderHook(
    ({ items }) => useMemoryListDrag({
      items,
      busy: false,
      onReorder,
      onRefusal,
    }),
    { initialProps: { items: [item('1'), item('2'), item('3')] } },
  );

  act(() => result.current.handleRowDragStart('1', dragEvent()));
  rerender({ items: [item('2'), item('1'), item('3')] });
  act(() => result.current.handleRowDrop('3', dragEvent()));

  expect(onReorder).toHaveBeenCalledTimes(1);
  expect((onReorder.mock.calls[0]?.[0] ?? []).map(row => row.key))
    .toEqual(['2', '3', '1']);
  expect(onRefusal).not.toHaveBeenCalled();
});

test('moves a connected family once and refuses a drop inside that family', () => {
  const items = [
    item('field-1', 'family'),
    item('get-2', 'family'),
    item('excel-3', 'family'),
    item('other-4'),
  ];
  const onReorder = jest.fn((_items: MemoryListItem[]) => true);
  const onRefusal = jest.fn();
  const { result } = renderHook(() => useMemoryListDrag({
    items,
    busy: false,
    onReorder,
    onRefusal,
  }));

  act(() => {
    expect(result.current.reorderByIndex(0, 3)).toBe(true);
  });
  expect(onReorder).toHaveBeenCalledTimes(1);
  expect((onReorder.mock.calls[0]?.[0] ?? []).map(row => row.key)).toEqual([
    'other-4',
    'field-1',
    'get-2',
    'excel-3',
  ]);

  act(() => {
    expect(result.current.reorderByIndex(0, 2)).toBe(false);
  });
  expect(onReorder).toHaveBeenCalledTimes(1);
  expect(onRefusal).toHaveBeenCalledWith(
    'Rows inside one connected group cannot be separated.',
  );
});
