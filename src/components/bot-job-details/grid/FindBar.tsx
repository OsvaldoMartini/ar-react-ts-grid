import React from 'react';
import styles from './FindBar.module.scss';

export interface FindBarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  memoryCount?: number;
  onOpenMemory?: () => void;
}

/**
 * Find/search input for the Bot Job Details instruction grid.
 *
 * Extracted from GridItem's find row (label, input, clear, and the optional
 * Memory-list reopen action). State and behavior remain owned by GridItem.
 * The surrounding sticky `.gridFindRow` layout remains in GridItem.
 */
const FindBar: React.FC<FindBarProps> = ({
  value,
  onChange,
  label = 'Find:',
  placeholder = 'Type to find…',
  memoryCount = 0,
  onOpenMemory,
}) => (
  <>
    <span className={styles.label}>{label}</span>
    <div className={styles.inputWrap}>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear find"
          title="Clear find"
          onClick={() => onChange('')}
        >
          X
        </button>
      )}
    </div>
    {memoryCount > 0 && onOpenMemory && (
      <button
        type="button"
        className={styles.memory}
        onClick={onOpenMemory}
      >
        Memory ({memoryCount})
      </button>
    )}
  </>
);

export default FindBar;
