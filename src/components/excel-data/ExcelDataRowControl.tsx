import React from 'react';
import { GripVertical } from 'lucide-react';
import styles from './ExcelDataRowControl.module.scss';

export interface ExcelDataRowControlProps {
  rowIndex: number;
  groupName: string;
  selected: boolean;
  disabled?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  onSelect: (rowIndex: number) => void;
  onDragStart: (rowIndex: number) => void;
  onDragOver: (rowIndex: number) => void;
  onDrop: (rowIndex: number) => void;
  onDragEnd: () => void;
}

export const ExcelDataRowControlHeader: React.FC = () => (
  <th className={styles.header} scope="col">Use / Move</th>
);

/**
 * Isolated control cell for one logical Excel-memory row.
 *
 * The parent owns the authoritative snapshot and never reorders rows locally;
 * this component only reports the original row index selected or dragged.
 */
const ExcelDataRowControl: React.FC<ExcelDataRowControlProps> = ({
  rowIndex,
  groupName,
  selected,
  disabled = false,
  dragging = false,
  dropTarget = false,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const rowNumber = rowIndex + 1;

  return (
    <td
      className={`${styles.cell} ${selected ? styles.selected : ''} ${
        dragging ? styles.dragging : ''
      } ${dropTarget ? styles.dropTarget : ''}`}
      onDragOver={(event) => {
        if (disabled || dragging) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver(rowIndex);
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        onDrop(rowIndex);
      }}
    >
      <label className={styles.selector} title={`Use row ${rowNumber} for execution`}>
        <input
          type="radio"
          name={groupName}
          checked={selected}
          disabled={disabled}
          aria-label={`Select row ${rowNumber} for execution`}
          onChange={() => onSelect(rowIndex)}
        />
        <span aria-hidden="true" />
      </label>
      <button
        type="button"
        className={styles.dragHandle}
        draggable={!disabled}
        disabled={disabled}
        aria-label={`Move row ${rowNumber}`}
        title={`Drag row ${rowNumber} to change execution order`}
        onDragStart={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(rowIndex));
          onDragStart(rowIndex);
        }}
        onDragEnd={onDragEnd}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
    </td>
  );
};

export default ExcelDataRowControl;
