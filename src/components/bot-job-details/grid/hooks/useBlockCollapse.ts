import { useCallback, useState } from 'react';

export interface UseBlockCollapse {
  collapsedBlocks: Set<number>;
  isCollapsed: (blockId: number) => boolean;
  expandBlock: (blockId: number) => void;
  toggleBlockCollapsed: (blockId: number) => void;
}

/**
 * Phase 6, step 2 — which Bot Job Details blocks are collapsed. Extracted verbatim
 * from GridItem. A Set of collapsed block ids plus a toggle; presentation-only.
 */
export function useBlockCollapse(): UseBlockCollapse {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());

  const toggleBlockCollapsed = useCallback((blockId: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }, []);

  const isCollapsed = useCallback((blockId: number) => collapsedBlocks.has(blockId), [collapsedBlocks]);

  const expandBlock = useCallback((blockId: number) => {
    setCollapsedBlocks((prev) => {
      if (!prev.has(blockId)) return prev;
      const next = new Set(prev);
      next.delete(blockId);
      return next;
    });
  }, []);

  return { collapsedBlocks, isCollapsed, expandBlock, toggleBlockCollapsed };
}
