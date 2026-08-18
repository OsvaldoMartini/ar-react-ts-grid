import React, { useMemo, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import styles from './ExcelSyntheticControls.module.scss';
import ExcelSyntheticContextHelpModal from './ExcelSyntheticContextHelpModal';
import { SYNTHETIC_CONTEXTS, type SyntheticContext } from './syntheticDataProfiles';

type Props = {
  rowCount: number;
  context: SyntheticContext;
  disabled?: boolean;
  onRowCountChange: (value: number) => void;
  onContextChange: (value: SyntheticContext) => void;
  onGenerate: () => void;
};

const ExcelSyntheticControls: React.FC<Props> = ({
  rowCount, context, disabled = false, onRowCountChange, onContextChange, onGenerate,
}) => {
  const [query, setQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? SYNTHETIC_CONTEXTS.filter(option => option.toLowerCase().includes(needle)) : [];
  }, [query]);
  return <section className={styles.controls} aria-label="Synthetic Excel data generator">
    <div className={styles.generate}><span>{context}</span><button type="button" onClick={onGenerate} disabled={disabled}>
      <FlaskConical size={15} aria-hidden="true" /> Generate Data Test
    </button></div>
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
    <label className={styles.contextSearch}>
      <span>Context</span>
      <input
        type="search"
        value={query}
        disabled={disabled}
        placeholder="Search context"
        onChange={event => setQuery(event.currentTarget.value)}
      />
      {options.length > 0 && <div className={styles.contextOptions}>{options.map(option => <button
        key={option} type="button" onClick={() => { onContextChange(option); setQuery(''); }}>{option}</button>)}</div>}
    </label>
    <button type="button" className={styles.helpButton} aria-label="How synthetic contexts work"
      title="How synthetic contexts work" onClick={() => setHelpOpen(true)}>?</button>
    {helpOpen && <ExcelSyntheticContextHelpModal onClose={() => setHelpOpen(false)} />}
  </section>
};

export default ExcelSyntheticControls;
