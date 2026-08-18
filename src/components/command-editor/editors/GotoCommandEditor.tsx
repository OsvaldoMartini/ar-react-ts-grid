import React from 'react';
import type { GotoCommandEditorDraft } from '../commandEditorDraft';
import styles from './GotoCommandEditor.module.scss';

interface GotoCommandEditorProps {
  value: GotoCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: GotoCommandEditorDraft) => void;
}

const GotoCommandEditor: React.FC<GotoCommandEditorProps> = ({
  value,
  disabled = false,
  onChange,
}) => (
  <section className={styles.editor} aria-label="GOTO configuration">
    <header>
      <span>GOTO configuration</span>
      <small>The destination Block remains an independent reconnectable relationship.</small>
    </header>
    <label>
      <span>GOTO count</span>
      <input
        type="number"
        min={1}
        max={9999}
        step={1}
        value={value.count}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, count: Number(event.target.value) })}
      />
    </label>
  </section>
);

export default GotoCommandEditor;
