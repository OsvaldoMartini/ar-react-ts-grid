import React from 'react';
import saveImage from '../../../assets/save.png';
import styles from './InlineNameEditor.module.scss';

export interface InlineNameEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  saveAlt?: string;
}

/**
 * Inline "edit the name" control (text input + save icon), shared by the block
 * header and instruction rows. Extracted verbatim from GridItem's two identical
 * edit branches (editContainer + editTextbox + saveButton). Enter in the input
 * or a click on the save icon both fire onSave. Presentational only — the edit
 * state and persistence stay in GridItem.
 */
const InlineNameEditor: React.FC<InlineNameEditorProps> = ({
  value,
  onChange,
  onSave,
  inputRef,
  saveAlt = 'save',
}) => (
  <div className={styles.container}>
    <input
      type="text"
      value={value}
      ref={inputRef}
      className={styles.input}
      onChange={event => onChange(event.target.value)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          onSave();
        }
      }}
    />
    <img src={saveImage} alt={saveAlt} className={styles.save} onClick={onSave} />
  </div>
);

export default InlineNameEditor;
