import React from 'react';
// Shares GridItem's `.block` styling so the design is preserved exactly.
import styles from '../../Griditem.module.scss';

export interface BlockCardProps {
  /** Stable visual order from the authoritative block catalog (including empty blocks). */
  displayOrder?: number;
  /** Whether this block header can initiate a block reorder drag. */
  blockDraggable: boolean;
  onBlockDragStart: (event: React.DragEvent) => void;
  onBlockDragOver: (event: React.DragEvent) => void;
  onBlockDrop: (event: React.DragEvent) => void;
  onBlockDragEnd: (event: React.DragEvent) => void;
  collapsed: boolean;
  header: React.ReactNode;
  list: React.ReactNode;
}

/**
 * One Bot Job Details block: the `.block` container that holds a `BlockHeader`
 * and (unless collapsed) an `InstructionList`. The header is the native drag
 * source for reordering whole blocks; the card itself is the block drop target.
 * Instruction drags/drops are handled inside `InstructionList` and are ignored
 * by the block drop handler (which only acts on an active block drag).
 */
const BlockCard: React.FC<BlockCardProps> = ({
  displayOrder,
  blockDraggable,
  onBlockDragStart,
  onBlockDragOver,
  onBlockDrop,
  onBlockDragEnd,
  collapsed,
  header,
  list,
}) => (
  <div
    className={styles.block}
    style={displayOrder == null ? undefined : { order: displayOrder }}
    onDragOver={onBlockDragOver}
    onDrop={onBlockDrop}
  >
    <div
      draggable={blockDraggable}
      onDragStart={onBlockDragStart}
      onDragEnd={onBlockDragEnd}
      style={{ cursor: blockDraggable ? 'grab' : undefined }}
      title={blockDraggable ? 'Drag the block header to reorder blocks' : undefined}
    >
      {header}
    </div>
    {!collapsed && list}
  </div>
);

export default BlockCard;
