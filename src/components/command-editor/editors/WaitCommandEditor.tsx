import React from 'react';
import type { WaitCommandEditorDraft } from '../commandEditorDraft';
import styles from './WaitCommandEditor.module.scss';

interface WaitCommandEditorProps {
  value: WaitCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: WaitCommandEditorDraft) => void;
}

const WaitCommandEditor: React.FC<WaitCommandEditorProps> = ({ value, disabled = false, onChange }) => (
  <section className={styles.editor} aria-label="Wait configuration">
    <header><span>Wait configuration</span><small>The current Wait value is loaded without changing legacy rules</small></header>
    <label><span>Wait seconds</span><input type="number" min={1} max={9999} step={1} value={value.waitSeconds} disabled={disabled} onChange={(event) => onChange({ ...value, waitSeconds: Number(event.target.value) })} /></label>
  </section>
);

export default WaitCommandEditor;
