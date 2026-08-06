import React from 'react';
import { FlaskConical } from 'lucide-react';
import styles from './ExcelSyntheticControls.module.scss';

export const EXCEL_DATA_CONTEXTS = [
  'Bank Account',
  'Bank Trading',
  'Trading Platform',
  'Financial',
] as const;

type Props = {
  rowCount: number;
  context: string;
  disabled?: boolean;
  onRowCountChange: (value: number) => void;
  onContextChange: (value: string) => void;
  onGenerate: () => void;
};

const ExcelSyntheticControls: React.FC<Props> = ({
  rowCount, context, disabled = false, onRowCountChange, onContextChange, onGenerate,
}) => (
  <section className={styles.controls} aria-label="Synthetic Excel data generator">
    <button type="button" onClick={onGenerate} disabled={disabled}>
      <FlaskConical size={15} aria-hidden="true" /> Generate Data Test
    </button>
    <label>
      <span>Rows</span>
      <input
        type="number"
        min={1}
        max={1000}
        value={rowCount}
        disabled={disabled}
        onChange={event => onRowCountChange(Math.min(1000, Math.max(1, Number(event.currentTarget.value) || 1)))}
      />
    </label>
    <label>
      <span>Context</span>
      <input
        type="search"
        list="excel-data-contexts"
        value={context}
        disabled={disabled}
        placeholder="Search context"
        onChange={event => onContextChange(event.currentTarget.value)}
      />
      <datalist id="excel-data-contexts">
        {EXCEL_DATA_CONTEXTS.map(option => <option key={option} value={option} />)}
      </datalist>
    </label>
  </section>
);

export default ExcelSyntheticControls;
