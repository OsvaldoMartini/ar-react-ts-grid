import React from 'react';
import type { SwipeCommandEditorDraft } from '../commandEditorDraft';
import styles from './SwipeCommandEditor.module.scss';

interface SwipeCommandEditorProps {
  value: SwipeCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: SwipeCommandEditorDraft) => void;
}

const SwipeCommandEditor: React.FC<SwipeCommandEditorProps> = ({
  value,
  disabled = false,
  onChange,
}) => (
  <section className={styles.editor} aria-label={`${value.direction} configuration`}>
    <header>
      <span>{value.direction === 'SWIPE_UP' ? 'Swipe Up' : 'Swipe Down'} configuration</span>
      <small>The direction is fixed by the selected command; only its repetition count changes.</small>
    </header>
    <label>
      <span>Repetitions</span>
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

export default SwipeCommandEditor;
