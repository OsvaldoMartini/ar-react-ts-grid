import React from 'react';
import type {
  ComparisonOperator,
  ExternalCheckCommandEditorDraft,
} from '../commandEditorDraft';
import { binaryComparisonOperators } from './CheckValueCommandEditor';
import styles from './ExternalCheckCommandEditor.module.scss';

interface ExternalCheckCommandEditorProps {
  value: ExternalCheckCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: ExternalCheckCommandEditorDraft) => void;
}

const ExternalCheckCommandEditor: React.FC<ExternalCheckCommandEditorProps> = ({
  value,
  disabled = false,
  onChange,
}) => {
  return (
    <section className={styles.editor} aria-label={`${value.checkType} configuration`}>
      <header>
        <span>{value.checkType} configuration</span>
        <small>Configure how the two independently connected variables are compared.</small>
      </header>
      <div className={styles.fields}>
        <label>
          <span>Operator</span>
          <select disabled={disabled} value={value.operator} onChange={(event) => onChange({
            ...value,
            operator: event.target.value as ComparisonOperator,
          })}>
            {binaryComparisonOperators.map(operator => <option key={operator} value={operator}>{operator}</option>)}
          </select>
        </label>
        <label>
          <span>Format policy</span>
          <select disabled={disabled} value={value.formatPolicy} onChange={(event) => onChange({
            ...value,
            formatPolicy: event.target.value,
          })}>
            <option value="EXACT_TEXT">Exact raw text</option>
            <option value="LOCALE_NUMBER">Locale-aware number</option>
            <option value="CASE_INSENSITIVE_TEXT">Case-insensitive text</option>
          </select>
        </label>
      </div>
    </section>
  );
};

export default ExternalCheckCommandEditor;
