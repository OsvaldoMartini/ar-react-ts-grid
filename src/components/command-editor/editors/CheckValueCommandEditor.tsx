import React from 'react';
import type {
  CheckValueCommandEditorDraft,
  ComparisonOperandKind,
  ComparisonOperator,
} from '../commandEditorDraft';
import styles from './CheckValueCommandEditor.module.scss';

interface CheckValueCommandEditorProps {
  value: CheckValueCommandEditorDraft;
  disabled?: boolean;
  onChange: (value: CheckValueCommandEditorDraft) => void;
}

export const comparisonOperators: readonly ComparisonOperator[] = [
  '=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith',
  'isEmpty', 'isNotEmpty',
];

export const binaryComparisonOperators: readonly ComparisonOperator[] =
  comparisonOperators.filter(operator => operator !== 'isEmpty' && operator !== 'isNotEmpty');

/** Shared by conditional editors; variable-only Check forms do not render this catalog. */
export const operandKinds: readonly ComparisonOperandKind[] = [
  'LITERAL', 'VARIABLE', 'EMPTY', 'VOID',
];

const CheckValueCommandEditor: React.FC<CheckValueCommandEditorProps> = ({
  value,
  disabled = false,
  onChange,
}) => {
  return (
    <section className={styles.editor} aria-label="CheckValue configuration">
      <header>
        <span>CheckValue configuration</span>
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

export default CheckValueCommandEditor;
