import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Trash2, X } from 'lucide-react';
import styles from './ExcelExportPanel.module.scss';

export type ExcelExportContext = {
  blockId: number; blockName: string; blockOrderNumber: number; exportFile?: string;
};

type Draft = { directory: string; filename: string; fileType: '.xlsx' | '.csv'; delimiter: ',' | '|'; clear?: boolean };
type Props = { context: ExcelExportContext; onSubmit: (draft: Draft) => void; onClose: () => void };

const parse = (encoded?: string): Draft => {
  let value = (encoded || '').replace(/\\/g, '/');
  let delimiter: ',' | '|' = ',';
  if (value.endsWith(':,') || value.endsWith(':|')) {
    delimiter = value.slice(-1) as ',' | '|'; value = value.slice(0, -2);
  }
  if (!value || value.includes('No Excel Export File')) return { directory: '', filename: '', fileType: '.xlsx', delimiter };
  const slash = value.lastIndexOf('/');
  const filename = slash >= 0 ? value.slice(slash + 1) : value;
  return { directory: slash >= 0 ? value.slice(0, slash) : '', filename,
    fileType: filename.toLowerCase().endsWith('.csv') ? '.csv' : '.xlsx', delimiter };
};

const ExcelExportPanel: React.FC<Props> = ({ context, onSubmit, onClose }) => {
  const initial = useMemo(() => parse(context.exportFile), [context.exportFile]);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const submit = () => {
    if (!draft.directory.trim() || !draft.filename.trim()) { setError('Directory and filename are required.'); return; }
    onSubmit(draft);
  };
  return <div className={styles.backdrop} role="presentation">
    <section className={styles.panel} aria-label="Excel export configuration">
      <header><FileSpreadsheet size={19}/><span><strong>Excel export</strong><small>#{context.blockOrderNumber} {context.blockName}</small></span><button title="Close" onClick={onClose}><X size={17}/></button></header>
      <div className={styles.form}>
        <label>Export directory<input value={draft.directory} onChange={e => setDraft({...draft,directory:e.target.value})}/></label>
        <label>File name<input value={draft.filename} onChange={e => setDraft({...draft,filename:e.target.value})}/></label>
        <label>File type<select value={draft.fileType} onChange={e => setDraft({...draft,fileType:e.target.value as Draft['fileType']})}><option value=".xlsx">Excel (.xlsx)</option><option value=".csv">CSV (.csv)</option></select></label>
        <label>Delimiter<select value={draft.delimiter} onChange={e => setDraft({...draft,delimiter:e.target.value as Draft['delimiter']})}><option value=",">Comma</option><option value="|">Pipe</option></select></label>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <footer><button className={styles.clear} onClick={() => onSubmit({...draft,clear:true})}><Trash2 size={15}/>Clear</button><button className={styles.save} onClick={submit}>Save</button></footer>
    </section>
  </div>;
};
export default ExcelExportPanel;
