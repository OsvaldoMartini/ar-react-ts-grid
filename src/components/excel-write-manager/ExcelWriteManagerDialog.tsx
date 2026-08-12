import React, { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import type {
  ExcelWriteFileState,
  ExcelWriteFlushPolicy,
  ExcelWriteManagerState,
} from './domain/excelWriteManager';
import styles from './ExcelWriteManagerDialog.module.scss';

type Props = {
  state: ExcelWriteManagerState;
  busy: boolean;
  policyLocked: boolean;
  onPolicyChange: (policy: ExcelWriteFlushPolicy) => void;
  onCellChange: (fileId: string, rowIndex: number, column: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

const ExcelWriteManagerDialog: React.FC<Props> = ({
  state,
  busy,
  policyLocked,
  onPolicyChange,
  onCellChange,
  onSave,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState(state.files[0]?.fileId ?? '');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    if (!state.files.some(file => file.fileId === selectedId)) {
      setSelectedId(state.files[0]?.fileId ?? '');
    }
  }, [selectedId, state.files]);

  const selected: ExcelWriteFileState | undefined = state.files.find(file => file.fileId === selectedId);
  return (
    <div className={styles.backdrop} role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true"
        aria-labelledby="excel-writer-manager-title">
        <header>
          <div><FileSpreadsheet size={21} /><span><small>React execution memory</small>
            <h2 id="excel-writer-manager-title">ExcelWriter Manager</h2></span></div>
          <button ref={closeRef} type="button" aria-label="Close ExcelWriter Manager"
            disabled={busy} onClick={onClose}><X size={18} /></button>
        </header>
        <div className={styles.toolbar}>
          <label><span>Write policy</span>
            <select value={state.policy} disabled={busy || policyLocked}
              title={policyLocked ? 'The write policy is frozen for the active run.' : 'Choose when memory is written to disk.'}
              onChange={event => onPolicyChange(event.target.value as ExcelWriteFlushPolicy)}>
              <option value="END_EXECUTION">End of execution</option>
              <option value="END_BLOCK">End of each Block</option>
            </select>
          </label>
          <button type="button" disabled={busy || !state.files.some(file => file.dirty)} onClick={onSave}>
            {busy ? 'Saving...' : 'Save Dirty Files'}
          </button>
        </div>
        <nav className={styles.tabs} role="tablist" aria-label="ExcelWrite files">
          {state.files.map(file => (
            <button type="button" role="tab" key={file.fileId} aria-selected={file.fileId === selectedId}
              onClick={() => setSelectedId(file.fileId)}>
              <strong>{file.displayName}</strong><small>{file.rows.length} rows - {file.flushState}</small>
            </button>
          ))}
        </nav>
        <main>
          {selected ? <>
            <div className={styles.fileStatus}><strong>{selected.displayName}</strong>
              <span>{selected.finalFormat} - revision {selected.revision}</span><small>{selected.message}</small></div>
            <div className={styles.gridViewport}><table><thead><tr><th>#</th>
              {selected.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>
              {selected.rows.map((row, rowIndex) => <tr key={rowIndex}><th>{rowIndex + 1}</th>
                {selected.columns.map(column => <td key={column}><input
                  aria-label={`${column} row ${rowIndex + 1}`} value={row[column] ?? ''}
                  disabled={busy} onChange={event => onCellChange(selected.fileId, rowIndex, column, event.target.value)}
                /></td>)}</tr>)}
            </tbody></table></div>
          </> : <p>No ExcelWrite command has arrived in this run.</p>}
        </main>
      </section>
    </div>
  );
};

export default ExcelWriteManagerDialog;
