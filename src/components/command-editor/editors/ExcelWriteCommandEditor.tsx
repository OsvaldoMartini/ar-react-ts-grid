import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import type { ExcelWriteCommandEditorDraft } from '../commandEditorDraft';
import styles from './ExcelWriteCommandEditor.module.scss';

interface ExcelWriteCommandEditorProps {
  value: ExcelWriteCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: ExcelWriteCommandEditorDraft) => void;
  onConfigureFile?: () => void;
}

const ExcelWriteCommandEditor: React.FC<ExcelWriteCommandEditorProps> = ({
  value,
  disabled = false,
  onChange,
  onConfigureFile,
}) => (
  <section className={styles.editor} aria-label="ExcelWrite configuration">
    <header>
      <span>ExcelWrite configuration</span>
      <small>The connected variable remains the value source; these fields define its destination.</small>
    </header>
    <div className={styles.fields}>
      <label>
        <span>Output key</span>
        <input disabled={disabled} type="text" value={value.outputKey} onChange={(event) => onChange({
          ...value,
          outputKey: event.target.value,
        })} />
      </label>
      <label>
        <span>Column</span>
        <input disabled={disabled} type="text" value={value.outputColumn} onChange={(event) => onChange({
          ...value,
          outputColumn: event.target.value,
        })} />
      </label>
      <label className={styles.wide}>
        <span>File configuration</span>
        <span className={styles.fileControl}>
          <input disabled={disabled} readOnly={Boolean(onConfigureFile)} type="text" value={value.outputFile}
            placeholder="No instruction-owned Excel file configured" onChange={(event) => onChange({ ...value, outputFile: event.target.value })} />
          {onConfigureFile && (
            <button type="button" disabled={disabled} className={styles.fileButton}
              title="Configure this ExcelWrite instruction file" aria-label="Configure ExcelWrite file" onClick={onConfigureFile}>
              <FileSpreadsheet size={18} aria-hidden="true" />
              <span><strong>Excel</strong><small>File</small></span>
            </button>
          )}
        </span>
      </label>
      <label className={styles.wide}>
        <span>Format policy</span>
        <select disabled={disabled} value={value.formatPolicy} onChange={(event) => onChange({
          ...value,
          formatPolicy: event.target.value,
        })}>
          <option value="EXACT_TEXT">Exact raw text</option>
          <option value="LOCALE_NUMBER">Locale-aware number</option>
        </select>
      </label>
    </div>
  </section>
);

export default ExcelWriteCommandEditor;
