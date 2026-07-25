import { renderHook } from '@testing-library/react';
import { useBlockReorder, UseBlockReorderDeps, GroupedData } from './useBlockReorder';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

const ins = (id: number, blockId: number, order: number): BlockLoopInstructionLoadDTO =>
  ({ id, blockId, botJobId: 99, blockOrderNumber: order, blockName: `Block ${order}`, instructionOrderNumber: 1 } as unknown as BlockLoopInstructionLoadDTO);

// Three blocks in order 1,2,3.
const grouped: GroupedData = {
  10: { blockName: 'Block 1', instructions: [ins(1, 10, 1)] },
  20: { blockName: 'Block 2', instructions: [ins(2, 20, 2)] },
  30: { blockName: 'Block 3', instructions: [ins(3, 30, 3)] },
};
const flat = [ins(1, 10, 1), ins(2, 20, 2), ins(3, 30, 3)];

const makeDeps = (over: Partial<UseBlockReorderDeps> = {}): UseBlockReorderDeps => ({
  groupedData: grouped,
  instructionsData: flat,
  setInstructionsData: jest.fn(),
  setIsDataReordered: jest.fn(),
  webSocket: null,
  connected: false,
  botJobId: 99,
  botJobName: 'Job',
  homeBankingId: 1,
  ...over,
});

describe('useBlockReorder', () => {
  it('sortedBlockIndex returns order-sorted positions', () => {
    const { result } = renderHook(() => useBlockReorder(makeDeps()));
    expect(result.current.sortedBlockIndex(10)).toBe(0);
    expect(result.current.sortedBlockIndex(30)).toBe(2);
    expect(result.current.sortedBlockIndex(999)).toBe(-1);
  });

  it('commitBlockReorder renumbers all blocks 1..N and sends one full BLOCK_MOVE', () => {
    const send = jest.fn();
    const setInstructionsData = jest.fn();
    const { result } = renderHook(() =>
      useBlockReorder(makeDeps({ webSocket: { send } as unknown as WebSocket, connected: true, setInstructionsData })),
    );
    // move block at index 0 (id 10) to index 2
    result.current.commitBlockReorder(0, 2);
    expect(send).toHaveBeenCalledTimes(1);
    const msg = JSON.parse(send.mock.calls[0][0]);
    expect(msg.type).toBe('BLOCK_MOVE');
    expect(msg.updatedBlocks.map((b: any) => b.blockId)).toEqual([20, 30, 10]);
    expect(msg.updatedBlocks.map((b: any) => b.blockOrderNumber)).toEqual([1, 2, 3]);
    expect(setInstructionsData).toHaveBeenCalledTimes(1);
  });

  it('commitBlockReorder is a no-op for equal / out-of-range indices', () => {
    const send = jest.fn();
    const { result } = renderHook(() =>
      useBlockReorder(makeDeps({ webSocket: { send } as unknown as WebSocket, connected: true })),
    );
    result.current.commitBlockReorder(1, 1);
    result.current.commitBlockReorder(0, 9);
    expect(send).not.toHaveBeenCalled();
  });

  it('handleMoveBlockUp/Down respect the ends (no move at the boundary)', () => {
    const send = jest.fn();
    const { result } = renderHook(() =>
      useBlockReorder(makeDeps({ webSocket: { send } as unknown as WebSocket, connected: true })),
    );
    result.current.handleMoveBlockUp(10);   // top block — can't go up
    result.current.handleMoveBlockDown(30); // bottom block — can't go down
    expect(send).not.toHaveBeenCalled();
    result.current.handleMoveBlockDown(10); // top block moves down — one BLOCK_MOVE
    expect(send).toHaveBeenCalledTimes(1);
  });
});
