import React from 'react';
import SearchBox, { type SearchBoxOption } from '../../SearchBox';
import type { ComponentEditorVariableOption } from '../componentEditor.types';
import type {
  ComparisonOperator,
  ExternalCheckCommandEditorDraft,
} from '../commandEditorDraft';
import { binaryComparisonOperators } from './CheckValueCommandEditor';
import styles from './ExternalCheckCommandEditor.module.scss';

interface ExternalCheckCommandEditorProps {
  value: ExternalCheckCommandEditorDraft;
  variables: readonly ComponentEditorVariableOption[];
  disabled?: boolean;
  onChange: (value: ExternalCheckCommandEditorDraft) => void;
}

const ExternalCheckCommandEditor: React.FC<ExternalCheckCommandEditorProps> = ({
  value,
  variables,
  disabled = false,
  onChange,
}) => {
  const variableOptions: SearchBoxOption[] = variables.map(variable => ({
    value: String(variable.variableId),
    label: variable.name,
    sublabel: `${variable.type || '$String'} · variable ID ${variable.variableId}`,
    keywords: `${variable.variableId} ${variable.name} ${variable.type}`,
  }));
  return (
    <section className={styles.editor} aria-label={`${value.checkType} configuration`}>
      <header>
        <span>{value.checkType} configuration</span>
        <small>Compare the first runtime variable with the second runtime variable.</small>
      </header>
      <div className={styles.fields}>
        <div className={styles.wide}>
          <SearchBox
            label="First variable"
            placeholder="Search first variable name or ID..."
            options={variableOptions}
            value={value.leftVariableId == null ? null : String(value.leftVariableId)}
            onChange={(selected) => onChange({
              ...value,
              leftVariableId: selected == null ? null : Number(selected),
            })}
            disabled={disabled}
          />
        </div>
        <label>
          <span>Operator</span>
          <select disabled={disabled} value={value.operator} onChange={(event) => onChange({
            ...value,
            operator: event.target.value as ComparisonOperator,
          })}>
            {binaryComparisonOperators.map(operator => <option key={operator} value={operator}>{operator}</option>)}
          </select>
        </label>
        <div className={styles.wide}>
          <SearchBox
            label="Second variable"
            placeholder="Search second variable name or ID..."
            options={variableOptions}
            value={value.operandVariableId == null ? null : String(value.operandVariableId)}
            onChange={(selected) => onChange({
              ...value,
              operandKind: 'VARIABLE',
              operandRawValue: '',
              operandVariableId: selected == null ? null : Number(selected),
            })}
            disabled={disabled}
          />
        </div>
        <label className={styles.wide}>
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
