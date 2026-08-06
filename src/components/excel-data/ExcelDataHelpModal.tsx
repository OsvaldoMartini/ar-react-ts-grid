import React, { useEffect, useId, useRef } from 'react';
import { Database, ShieldCheck, X } from 'lucide-react';
import styles from './ExcelDataHelpModal.module.scss';

type Props = { onClose: () => void };

const rules = [
  ['REAL DATA', 'Loads and edits the active Bot Job workbook. Save to Excel makes memory changes durable in that file.'],
  ['SYNTHETIC DATA', 'Uses an isolated database dataset. It never overwrites the real workbook.'],
  ['RECREATE COLUMNS', 'Rebuilds the real workbook columns from the Bot Job Blocks and input fields.'],
  ['RELOAD FILE / DB', 'Discards unsaved memory changes and reloads the selected REAL file or SYNTHETIC database dataset.'],
  ['GENERATE DATA TEST', 'Creates the requested number of synthetic rows using the selected business context.'],
  ['ADD ROW', 'Copies the last memory row so it can be edited as a new test case.'],
  ['SAVE', 'Save to Excel writes REAL memory to the workbook. Save Synthetic Data writes SYNTHETIC memory to SQLite.'],
  ['SEARCH', 'Filters Blocks, columns, and values without changing the memory dataset.'],
  ['EXECUTION', 'The currently used cell is highlighted during Test Run or Smoke Test.'],
] as const;

const ExcelDataHelpModal: React.FC<Props> = ({ onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return <div className={styles.backdrop} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.dialog}
      onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <header><span className={styles.icon}><Database size={20} /></span><div><small>Execution dataset</small><h2 id={titleId}>Excel Data rules</h2></div>
        <button ref={closeRef} type="button" aria-label="Close Excel Data rules" onClick={onClose}><X size={18} /></button></header>
      <div className={styles.body}><p>Control which dataset the active Bot Job uses and when memory changes become durable.</p>
        <div className={styles.grid}>{rules.map(([label, description], index) => <article key={label} data-tone={index % 3}><strong>{label}</strong><span>{description}</span></article>)}</div>
        <aside><ShieldCheck size={19} /><span><strong>Safe source separation</strong> REAL changes warn before execution when unsaved. SYNTHETIC rows remain isolated by Bot Job and can be regenerated or deleted without changing the workbook.</span></aside>
      </div>
    </section>
  </div>;
};

export default ExcelDataHelpModal;
