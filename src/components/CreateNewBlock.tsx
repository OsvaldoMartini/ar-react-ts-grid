import React, { useEffect, useRef, useState } from 'react';
import styles from './CreateNewBlock.module.scss';

// One entry per existing block, used to build the "Before N# name" positions.
export interface CreateBlockOption {
  blockId: number;
  blockOrderNumber: number;
  blockName: string;
}

// Where the new block goes: at the end, or before an existing block.
export type CreateBlockPosition =
  | { type: 'end' }
  | { type: 'before'; blockId: number; blockOrderNumber: number; blockName: string };

interface CreateNewBlockProps {
  blocks: CreateBlockOption[];
  onCreate: (blockName: string, position: CreateBlockPosition) => void;
  onClose: () => void;
}

// Floating (non-modal, draggable) "Create new block" dialog — same layout as
// the Java backend dialog: Block name + Insert position (At end / Before N# …).
const CreateNewBlock: React.FC<CreateNewBlockProps> = ({ blocks, onCreate, onClose }) => {
  const [blockName, setBlockName] = useState<string>('');
  const [positionValue, setPositionValue] = useState<string>('end'); // 'end' | blockId
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 160, y: 160 });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.blockOrderNumber - b.blockOrderNumber
  );

  const handleCreate = () => {
    const name = blockName.trim();
    if (!name) return;

    if (positionValue === 'end') {
      onCreate(name, { type: 'end' });
      return;
    }

    const target = sortedBlocks.find((b) => b.blockId === Number(positionValue));
    if (!target) return;
    onCreate(name, {
      type: 'before',
      blockId: target.blockId,
      blockOrderNumber: target.blockOrderNumber,
      blockName: target.blockName,
    });
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = pos;
    const onMove = (ev: MouseEvent) => {
      setPos({ x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className={styles.dialog} style={{ left: pos.x, top: pos.y }}>
      <div className={styles.header} onMouseDown={startDrag}>
        <span className={styles.title}>Create new block</span>
        <button
          type="button"
          className={styles.closeBtn}
          title="Close"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        <label className={styles.fieldLabel}>Block name:</label>
        <input
          ref={nameRef}
          type="text"
          className={styles.textInput}
          value={blockName}
          placeholder="e.g. Login Flow"
          onChange={(e) => setBlockName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />

        <label className={styles.fieldLabel}>Insert position:</label>
        <select
          className={styles.select}
          value={positionValue}
          onChange={(e) => setPositionValue(e.target.value)}
        >
          <option value="end">At end</option>
          {sortedBlocks.map((b) => (
            <option key={b.blockId} value={b.blockId}>
              Before {b.blockOrderNumber}# {b.blockName}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.createBtn}
          disabled={!blockName.trim()}
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateNewBlock;
