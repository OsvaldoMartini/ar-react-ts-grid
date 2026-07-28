import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { MemoryListItem } from './memoryList.contract';
import { reorderMemoryItemsAsGroups } from './memoryList.groups';

type MemoryListDragOptions = {
  items: readonly MemoryListItem[];
  busy: boolean;
  onReorder: (items: MemoryListItem[]) => boolean;
  onRefusal: (reason: string) => void;
};

/**
 * Private native drag controller for the detached Memory List.
 *
 * It deliberately carries stable item keys rather than render indices. A realtime
 * snapshot can therefore never redirect a pending drag to another row. Connected
 * parent/child groups remain one atomic unit through the shared pure group policy.
 */
export const useMemoryListDrag = ({
  items,
  busy,
  onReorder,
  onRefusal,
}: MemoryListDragOptions) => {
  const draggedItemKeyRef = useRef<string | null>(null);
  const [overItemKey, setOverItemKey] = useState<string | null>(null);

  const reorderByKeys = useCallback((sourceKey: string, targetKey: string) => {
    if (busy) {
      onRefusal('Memory List is busy. Wait for the current action to finish.');
      return false;
    }
    if (sourceKey === targetKey) return false;

    const from = items.findIndex(item => item.key === sourceKey);
    const to = items.findIndex(item => item.key === targetKey);
    if (from < 0 || to < 0) {
      onRefusal('Memory List changed during the drag. Try the movement again.');
      return false;
    }

    const groupReorder = reorderMemoryItemsAsGroups(items, from, to);
    if (!groupReorder.ok) {
      onRefusal(groupReorder.reason);
      return false;
    }
    return onReorder(groupReorder.items);
  }, [busy, items, onRefusal, onReorder]);

  const reorderByIndex = useCallback((from: number, to: number) => {
    const sourceKey = items[from]?.key;
    const targetKey = items[to]?.key;
    if (!sourceKey || !targetKey) {
      onRefusal('Memory List changed during the drag. Try the movement again.');
      return false;
    }
    return reorderByKeys(sourceKey, targetKey);
  }, [items, onRefusal, reorderByKeys]);

  const handleRowDragStart = useCallback((
    itemKey: string,
    event: React.DragEvent,
  ) => {
    if (busy || !items.some(item => item.key === itemKey)) {
      event.preventDefault();
      return;
    }
    draggedItemKeyRef.current = itemKey;
    setOverItemKey(itemKey);
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemKey);
    } catch {
      // The stable ref remains authoritative when dataTransfer is restricted.
    }
  }, [busy, items]);

  const handleRowDragOver = useCallback((
    itemKey: string,
    event: React.DragEvent,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverItemKey(itemKey);
  }, []);

  const handleRowDrop = useCallback((
    itemKey: string,
    event: React.DragEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceKey = draggedItemKeyRef.current;
    draggedItemKeyRef.current = null;
    setOverItemKey(null);
    if (!sourceKey) {
      onRefusal('No Memory List row is being moved.');
      return false;
    }
    return reorderByKeys(sourceKey, itemKey);
  }, [onRefusal, reorderByKeys]);

  const handleRowDragEnd = useCallback(() => {
    draggedItemKeyRef.current = null;
    setOverItemKey(null);
  }, []);

  // This diagnostic belongs only to the detached Memory List controller.
  useEffect(() => {
    (window as any).__mlReorder = reorderByIndex;
    return () => {
      if ((window as any).__mlReorder === reorderByIndex) {
        delete (window as any).__mlReorder;
      }
    };
  }, [reorderByIndex]);

  return {
    overItemKey,
    reorderByIndex,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleRowDragEnd,
  };
};
