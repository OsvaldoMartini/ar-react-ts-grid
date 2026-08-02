import React from 'react';
import SearchBox, { type SearchBoxOption } from '../../SearchBox';
import type { ComponentEditorVariableOption } from '../componentEditor.types';
import type {
  CheckValueCommandEditorDraft,
  ComparisonOperandKind,
  ComparisonOperator,
} from '../commandEditorDraft';
import styles from './CheckValueCommandEditor.module.scss';

interface CheckValueCommandEditorProps {
  value: CheckValueCommandEditorDraft;
  variables: readonly ComponentEditorVariableOption[];
  disabled?: boolean;
  onChange: (value: CheckValueCommandEditorDraft) => void;
}

export const comparisonOperators: readonly ComparisonOperator[] = [
  '=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith',
  'isEmpty', 'isNotEmpty',
];

export const operandKinds: readonly ComparisonOperandKind[] = [
  'LITERAL', 'VARIABLE', 'EMPTY', 'VOID',
];

const CheckValueCommandEditor: React.FC<CheckValueCommandEditorProps> = ({
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
    <section className={styles.editor} aria-label="CheckValue configuration">
      <header>
        <span>CheckValue configuration</span>
        <small>Compare the connected runtime variable without changing its relationship.</small>
      </header>
      <div className={styles.fields}>
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

export default CheckValueCommandEditor;
