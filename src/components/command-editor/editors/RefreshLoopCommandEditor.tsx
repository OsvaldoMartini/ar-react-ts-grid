import React from 'react';
import type { RefreshLoopCommandEditorDraft } from '../commandEditorDraft';
import styles from './RefreshLoopCommandEditor.module.scss';

interface RefreshLoopCommandEditorProps {
  value: RefreshLoopCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: RefreshLoopCommandEditorDraft) => void;
}

const RefreshLoopCommandEditor: React.FC<RefreshLoopCommandEditorProps> = ({ value, disabled = false, onChange }) => (
  <section className={styles.editor} aria-label="REFRESH LOOP configuration">
    <header><span>REFRESH LOOP configuration</span><small>Refresh timing remains separate from the legacy Command Editor</small></header>
    <div className={styles.fields}>
      <label><span>Interval seconds</span><input type="number" min={1} max={9999} step={1} value={value.intervalSeconds} disabled={disabled} onChange={(event) => onChange({ ...value, intervalSeconds: Number(event.target.value) })} /></label>
      <label><span>Iterations</span><input type="number" min={1} max={9999} step={1} value={value.iterations} disabled={disabled} onChange={(event) => onChange({ ...value, iterations: Number(event.target.value) })} /></label>
    </div>
  </section>
);

export default RefreshLoopCommandEditor;
