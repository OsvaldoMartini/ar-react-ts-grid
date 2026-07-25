import { act, renderHook } from '@testing-library/react';
import { useInstructionMemory } from './useInstructionMemory';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

const ins = (id: number, blockId: number, order: number): BlockLoopInstructionLoadDTO =>
  ({
    id,
    blockId,
    blockOrderNumber: order,
    blockName: `Block ${order}`,
    instructionOrderNumber: 1,
    actions: 'C',
  } as unknown as BlockLoopInstructionLoadDTO);

const data = [ins(1, 10, 1), ins(2, 10, 1), ins(3, 20, 2)];

describe('useInstructionMemory', () => {
  it('seeds block options from data and starts with no memorized steps', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    expect(result.current.memorySteps).toEqual([]);
    expect(result.current.memoryTargetBlockId).toBeNull();
    expect(result.current.memoryBlockOptions.map((b) => b.blockId)).toEqual([10, 20]);
    expect(result.current.pendingMemoryMove).toBeNull();
  });

  it('handleAddToMemory ignores instructions without canAdd', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => result.current.handleAddToMemory(data[0]));
    expect(result.current.memorySteps).toEqual([]); // no capability yet
  });

  it('adds an eligible instruction once and bumps the open version', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => {
      result.current.setMemoryCapabilities(
        new Map([[1, { canAdd: true, canMove: false, canDelete: false, deleteCount: 0, reason: '', deleteReason: '', allowedBlockIds: [], deleteRows: [] }]]),
      );
    });
    act(() => result.current.handleAddToMemory(data[0]));
    act(() => result.current.handleAddToMemory(data[0])); // duplicate ignored
    expect(result.current.memorySteps.map((s) => s.id)).toEqual([1]);
    expect(result.current.memoryListOpenVersion).toBeGreaterThan(0);
    expect(result.current.memoryListOpenRequestedRef.current).toBe(true);
  });

  it('handleRemoveFromMemory drops the step by id', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => {
      result.current.setMemorySteps([data[0], data[2]]);
    });
    act(() => result.current.handleRemoveFromMemory(1));
    expect(result.current.memorySteps.map((s) => s.id)).toEqual([3]);
  });
});
