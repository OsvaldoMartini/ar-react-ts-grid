import React from 'react';
import styles from './FindBar.module.scss';

export interface FindBarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Find/search input for the Bot Job Details instruction grid.
 *
 * Extracted verbatim from GridItem's find row (label + input + clear). It is
 * purely presentational: the `findText` state stays in GridItem and is passed
 * in, so behavior is unchanged. The surrounding `.gridFindRow` (which also holds
 * the Memory button) remains in GridItem.
 */
const FindBar: React.FC<FindBarProps> = ({
  value,
  onChange,
  label = 'Find:',
  placeholder = 'Type to find…',
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
  </>
);

export default FindBar;
