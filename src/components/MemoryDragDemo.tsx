import React, { useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from 'react-beautiful-dnd';

/**
 * Standalone, backend-free drag & drop proof for the Memory List row UI.
 *
 * Open it with `npm start` at:  http://localhost:3000/?memoryDragDemo=1
 *
 * Why this exists: MemoryList.tsx already has full react-beautiful-dnd wiring,
 * but its rows come from the Java WebSocket snapshot, so there is nothing to
 * drag without the backend. This file seeds 10 synthetic rows and keeps the
 * reorder entirely in local React state so the drag interaction can be tested
 * in isolation before any deploy.
 */

// --- 10 synthetic rows ------------------------------------------------------
type DemoRow = { key: string; label: string; detail: string };

const INITIAL_ROWS: DemoRow[] = Array.from({ length: 10 }, (_, index) => ({
  key: `row-${index + 1}`,
  label: `Memory item ${index + 1}`,
  detail: `synthetic instruction #${index + 1}`,
}));

const MemoryDragDemo: React.FC = () => {
  const [rows, setRows] = useState<DemoRow[]>(INITIAL_ROWS);
  const [lastMove, setLastMove] = useState<string>('Drag a row up or down.');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) {
      return;
    }
    setRows((current) => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destinationIndex, 0, moved);
      setLastMove(`Moved "${moved.label}" from position ${sourceIndex + 1} to ${destinationIndex + 1}.`);
      return next;
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Memory List — Drag &amp; Drop demo</h1>
        <p style={styles.status}>{lastMove}</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="memory-demo">
            {(dropProvided) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                style={styles.list}
              >
                {rows.map((row, index) => (
                  <Draggable key={row.key} draggableId={row.key} index={index}>
                    {(dragProvided, dragState) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...styles.row,
                          ...(dragState.isDragging ? styles.rowDragging : null),
                          ...dragProvided.draggableProps.style,
                        }}
                      >
                        <span
                          {...dragProvided.dragHandleProps}
                          style={styles.handle}
                          title="Drag to reorder"
                          aria-label={`Reorder ${row.label}`}
                        >
                          &#8801;
                        </span>
                        <span style={styles.order}>{index + 1}.</span>
                        <span style={styles.text}>
                          <strong>{row.label}</strong>
                          <small style={styles.detail}>{row.detail}</small>
                        </span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <p style={styles.hint}>
          Grab the &#8801; handle (or the row) and drag up/down. Order updates in local state only —
          no backend involved.
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '32px 16px',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#ffffff',
    borderRadius: 10,
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
    padding: 20,
  },
  title: { margin: '0 0 4px', fontSize: 18, color: '#111827' },
  status: { margin: '0 0 16px', fontSize: 13, color: '#2563eb', minHeight: 18 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    userSelect: 'none',
  },
  rowDragging: {
    background: '#eef2ff',
    border: '1px solid #6366f1',
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
  },
  handle: {
    cursor: 'grab',
    fontSize: 18,
    color: '#6b7280',
    padding: '0 4px',
  },
  order: { width: 24, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  text: { display: 'flex', flexDirection: 'column', lineHeight: 1.3 },
  detail: { color: '#6b7280' },
  hint: { marginTop: 16, fontSize: 12, color: '#6b7280' },
};

export default MemoryDragDemo;
