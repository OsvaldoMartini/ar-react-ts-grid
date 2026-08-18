import React from 'react';
import type { LoopCommandEditorDraft } from '../commandEditorDraft';
import styles from './LoopCommandEditor.module.scss';

interface LoopCommandEditorProps {
  value: LoopCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: LoopCommandEditorDraft) => void;
}

const LoopCommandEditor: React.FC<LoopCommandEditorProps> = ({ value, disabled = false, onChange }) => (
  <section className={styles.editor} aria-label="LOOP configuration">
    <header><span>LOOP configuration</span><small>Typed draft isolated from the legacy Command Editor</small></header>
    <div className={styles.fields}>
      <label><span>Interval seconds</span><input type="number" min={1} max={9999} step={1} value={value.intervalSeconds} disabled={disabled} onChange={(event) => onChange({ ...value, intervalSeconds: Number(event.target.value) })} /></label>
      <label><span>Iterations</span><input type="number" min={1} max={9999} step={1} value={value.iterations} disabled={disabled} onChange={(event) => onChange({ ...value, iterations: Number(event.target.value) })} /></label>
    </div>
  </section>
);

export default LoopCommandEditor;
