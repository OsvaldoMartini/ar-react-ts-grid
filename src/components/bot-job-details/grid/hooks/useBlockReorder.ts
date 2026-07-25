import { useCallback, useEffect, useRef } from 'react';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

/** The grid's block → instructions grouping (keyed by blockId). */
export type GroupedData = {
  [blockId: number]: {
    blockName: string;
    exportFile?: string;
    instructions: BlockLoopInstructionLoadDTO[];
  };
};

export interface UseBlockReorderDeps {
  groupedData: GroupedData;
  instructionsData: BlockLoopInstructionLoadDTO[];
  setInstructionsData: React.Dispatch<React.SetStateAction<BlockLoopInstructionLoadDTO[]>>;
  setIsDataReordered: React.Dispatch<React.SetStateAction<boolean>>;
  webSocket: WebSocket | null;
  connected: boolean;
  botJobId: number | null;
  botJobName: string | null;
  homeBankingId: number;
}

export interface UseBlockReorder {
  /** Source of an in-flight whole-block drag (null between drags). */
  dragBlockRef: React.MutableRefObject<{ index: number; blockId: number } | null>;
  /** Reorder blocks fromIndex→toIndex: renumber every block 1..N and send one BLOCK_MOVE. */
  commitBlockReorder: (fromIndex: number, toIndex: number) => void;
  handleBlockDragStart: (index: number, blockId: number) => (event: React.DragEvent) => void;
  handleBlockDrop: (index: number) => (event: React.DragEvent) => void;
  handleBlockDragEnd: () => void;
  /** Current order-sorted index of a block by id (-1 if absent). */
  sortedBlockIndex: (blockId: number) => number;
  handleMoveBlockUp: (blockId: number) => void;
  handleMoveBlockDown: (blockId: number) => void;
}

/**
 * Phase 6, step 7 — whole-block reordering for the Bot Job Details grid: drag a
 * block header onto another (native HTML5 drag) or use the up/down buttons. Both
 * paths funnel through `commitBlockReorder`, which renumbers every block's
 * blockOrderNumber 1..N and sends ONE BLOCK_MOVE with the full ordered list (never
 * a 2-block swap). Extracted verbatim from GridItem, including the window.__blockReorder
 * diagnostic hook the drag regression drives. No behavior change.
 *
 * The instruction-drag path (onDragEnd / applyDragMove) is intentionally left in
 * GridItem — it mutates core grid data through the WS response and co-extracts with
 * the data layer.
 */
export function useBlockReorder(deps: UseBlockReorderDeps): UseBlockReorder {
  const {
    groupedData, instructionsData, setInstructionsData, setIsDataReordered,
    webSocket, connected, botJobId, botJobName, homeBankingId,
  } = deps;

  const dragBlockRef = useRef<{ index: number; blockId: number } | null>(null);

  const commitBlockReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const blocks = Object.values(groupedData)
      .sort((a, b) => a.instructions[0].blockOrderNumber - b.instructions[0].blockOrderNumber);
    if (fromIndex >= blocks.length || toIndex >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updatedBlocks = reordered.map((block, i) => ({
      blockId: block.instructions[0].blockId,
      botJobId: block.instructions[0].botJobId,
      blockOrderNumber: i + 1,
      blockName: block.instructions[0].blockName,
    }));
    const orderByBlockId = new Map(updatedBlocks.map(block => [block.blockId, block.blockOrderNumber]));
    const updatedData = instructionsData.map(instruction => ({
      ...instruction,
      blockOrderNumber: orderByBlockId.get(instruction.blockId) ?? instruction.blockOrderNumber,
    }));
    setInstructionsData(updatedData);
    setIsDataReordered(false);
    console.log('[Block][drag] reorder', { from: fromIndex, to: toIndex, updatedBlocks });
    if (webSocket && connected) {
      webSocket.send(JSON.stringify({
        type: 'BLOCK_MOVE',
        botJobId,
        botJobName,
        homeBankingId,
        sessionId: 'botJobTasks',
        updatedBlocks,
      }));
    }
  }, [groupedData, instructionsData, setInstructionsData, setIsDataReordered, webSocket, connected, botJobId, botJobName, homeBankingId]);

  const handleBlockDragStart = (index: number, blockId: number) => (event: React.DragEvent) => {
    dragBlockRef.current = { index, blockId };
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `block-${blockId}`);
    } catch {
      // dataTransfer may be restricted; the ref still carries the source.
    }
    console.log(`[Block][drag] GRABBED block ${blockId} at index ${index}`);
  };

  const handleBlockDrop = (index: number) => (event: React.DragEvent) => {
    if (!dragBlockRef.current) return; // an instruction drag — let InstructionList handle it
    event.preventDefault();
    event.stopPropagation();
    const source = dragBlockRef.current;
    dragBlockRef.current = null;
    commitBlockReorder(source.index, index);
  };

  const handleBlockDragEnd = () => {
    dragBlockRef.current = null;
  };

  useEffect(() => {
    (window as any).__blockReorder = (fromIndex: number, toIndex: number) =>
      commitBlockReorder(fromIndex, toIndex);
    return () => {
      delete (window as any).__blockReorder;
    };
  }, [commitBlockReorder]);

  const sortedBlockIndex = (blockId: number) =>
    Object.values(groupedData)
      .sort((a, b) => a.instructions[0].blockOrderNumber - b.instructions[0].blockOrderNumber)
      .findIndex(block => Number(block.instructions[0].blockId) === Number(blockId));

  const handleMoveBlockUp = (blockId: number) => {
    const index = sortedBlockIndex(blockId);
    if (index > 0) commitBlockReorder(index, index - 1);
  };

  const handleMoveBlockDown = (blockId: number) => {
    const index = sortedBlockIndex(blockId);
    if (index >= 0 && index < Object.keys(groupedData).length - 1) {
      commitBlockReorder(index, index + 1);
    }
  };

  return {
    dragBlockRef,
    commitBlockReorder,
    handleBlockDragStart,
    handleBlockDrop,
    handleBlockDragEnd,
    sortedBlockIndex,
    handleMoveBlockUp,
    handleMoveBlockDown,
  };
}
