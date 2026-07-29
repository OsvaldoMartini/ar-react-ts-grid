import { act, renderHook } from '@testing-library/react';
import type { DragEvent } from 'react';
import { useVariablesInstructionDrag } from './useVariablesInstructionDrag';

const DATA_TYPE = 'application/x-arweb-variable-instruction';

const dragEvent = (transferred = '') => {
  const data = new Map<string, string>();
  if (transferred) data.set(DATA_TYPE, transferred);
  return {
    preventDefault: jest.fn(),
    currentTarget: document.createElement('div'),
    relatedTarget: null,
    dataTransfer: {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: jest.fn((type: string, value: string) => data.set(type, value)),
      getData: jest.fn((type: string) => data.get(type) ?? ''),
    },
  } as unknown as DragEvent<HTMLElement>;
};

test('keeps Variables drag state private and submits one exact drop intent', () => {
  const onDropInstruction = jest.fn();
  const { result } = renderHook(() => useVariablesInstructionDrag({
    authorityKey: 'binding-1:revision-1',
    disabled: false,
    onDropInstruction,
  }));
  const start = dragEvent();

  act(() => result.current.onDragStart(start, 101));
  expect(start.dataTransfer.setData).toHaveBeenCalledWith(DATA_TYPE, '101');
  expect(result.current.sourceInstructionId).toBe(101);

  const over = dragEvent();
  act(() => result.current.onDragOver(over, 102, 'BEFORE'));
  expect(over.preventDefault).toHaveBeenCalledTimes(1);
  expect(result.current.isDropActive(102, 'BEFORE')).toBe(true);

  const drop = dragEvent('101');
  act(() => result.current.onDrop(drop, 102, 'BEFORE'));
  expect(onDropInstruction).toHaveBeenCalledTimes(1);
  expect(onDropInstruction).toHaveBeenCalledWith(101, 102, 'BEFORE');
  expect(result.current.sourceInstructionId).toBeNull();
});

test('cancels an in-flight drag when the Variables authority changes', () => {
  const onDropInstruction = jest.fn();
  const { result, rerender } = renderHook(
    ({ authorityKey }) => useVariablesInstructionDrag({
      authorityKey,
      disabled: false,
      onDropInstruction,
    }),
    { initialProps: { authorityKey: 'binding-1:revision-1' } },
  );

  act(() => result.current.onDragStart(dragEvent(), 101));
  expect(result.current.sourceInstructionId).toBe(101);

  rerender({ authorityKey: 'binding-2:revision-2' });
  expect(result.current.sourceInstructionId).toBeNull();

  act(() => result.current.onDrop(dragEvent('101'), 102, 'AFTER'));
  expect(onDropInstruction).not.toHaveBeenCalled();
});

test('refuses missing or mismatched transfer data even with a live drag source', () => {
  const onDropInstruction = jest.fn();
  const { result } = renderHook(() => useVariablesInstructionDrag({
    authorityKey: 'binding-1:revision-1',
    disabled: false,
    onDropInstruction,
  }));

  act(() => result.current.onDragStart(dragEvent(), 101));
  act(() => result.current.onDrop(dragEvent(), 102, 'AFTER'));
  expect(onDropInstruction).not.toHaveBeenCalled();

  act(() => result.current.onDragStart(dragEvent(), 101));
  act(() => result.current.onDrop(dragEvent('999'), 102, 'AFTER'));
  expect(onDropInstruction).not.toHaveBeenCalled();
});
