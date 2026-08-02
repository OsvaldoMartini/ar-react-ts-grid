import React from 'react';
import SearchBox, { type SearchBoxOption } from '../../SearchBox';
import type { ComponentEditorVariableOption } from '../componentEditor.types';
import type {
  ComparisonOperandKind,
  ComparisonOperator,
  ExternalCheckCommandEditorDraft,
} from '../commandEditorDraft';
import { comparisonOperators, operandKinds } from './CheckValueCommandEditor';
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
        <small>External source and comparison values are stored separately from legacy execution.</small>
      </header>
      <div className={styles.fields}>
        <label className={styles.wide}>
          <span>External source key or file</span>
          <input disabled={disabled} type="text" value={value.externalSourceKey} onChange={(event) => onChange({
            ...value,
            externalSourceKey: event.target.value,
          })} />
        </label>
        <label>
          <span>Operator</span>
          <select disabled={disabled} value={value.operator} onChange={(event) => onChange({
            ...value,
            operator: event.target.value as ComparisonOperator,
          })}>
            {comparisonOperators.map(operator => <option key={operator} value={operator}>{operator}</option>)}
          </select>
        </label>
        <label>
          <span>Expected operand</span>
          <select disabled={disabled} value={value.operandKind} onChange={(event) => {
            const operandKind = event.target.value as ComparisonOperandKind;
            onChange({
              ...value,
              operandKind,
              operandRawValue: operandKind === 'LITERAL' ? value.operandRawValue : '',
              operandVariableId: operandKind === 'VARIABLE' ? value.operandVariableId : null,
            });
          }}>
            {operandKinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}
          </select>
        </label>
        {value.operandKind === 'LITERAL' && (
          <label className={styles.wide}>
            <span>Exact comparison text</span>
            <input disabled={disabled} type="text" value={value.operandRawValue} onChange={(event) => onChange({
              ...value,
              operandRawValue: event.target.value,
            })} />
          </label>
        )}
        {value.operandKind === 'VARIABLE' && (
          <div className={styles.wide}>
            <SearchBox
              label="Comparison variable"
              placeholder="Search variable name or ID..."
              options={variableOptions}
              value={value.operandVariableId == null ? null : String(value.operandVariableId)}
              onChange={(selected) => onChange({
                ...value,
                operandVariableId: selected == null ? null : Number(selected),
              })}
              disabled={disabled}
            />
          </div>
        )}
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
