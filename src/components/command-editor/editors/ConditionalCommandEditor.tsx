import React from 'react';
import SearchBox, { type SearchBoxOption } from '../../SearchBox';
import type { ComponentEditorVariableOption } from '../componentEditor.types';
import type {
  ComparisonOperandKind,
  ComparisonOperator,
  ConditionalCommandEditorDraft,
  ConditionalSource,
} from '../commandEditorDraft';
import { comparisonOperators, operandKinds } from './CheckValueCommandEditor';
import styles from './ConditionalCommandEditor.module.scss';

interface ConditionalCommandEditorProps {
  value: ConditionalCommandEditorDraft;
  variables: readonly ComponentEditorVariableOption[];
  disabled?: boolean;
  onChange: (value: ConditionalCommandEditorDraft) => void;
}

const ConditionalCommandEditor: React.FC<ConditionalCommandEditorProps> = ({
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
    <section className={styles.editor} aria-label={`${value.conditionType} configuration`}>
      <header>
        <span>{value.conditionType} condition</span>
        <small>
          Previous result preserves current execution. Variable comparison is stored for the typed executor.
        </small>
      </header>
      <div className={styles.fields}>
        <label className={styles.wide}>
          <span>Condition source</span>
          <select
            disabled={disabled}
            value={value.conditionSource}
            onChange={(event) => {
              const conditionSource = event.target.value as ConditionalSource;
              onChange({
                ...value,
                conditionSource,
                leftVariableId: conditionSource === 'VARIABLE_COMPARISON'
                  ? value.leftVariableId
                  : null,
                operandKind: conditionSource === 'VARIABLE_COMPARISON'
                  ? value.operandKind
                  : 'VOID',
                operandRawValue: conditionSource === 'VARIABLE_COMPARISON'
                  ? value.operandRawValue
                  : '',
                operandVariableId: conditionSource === 'VARIABLE_COMPARISON'
                  ? value.operandVariableId
                  : null,
              });
            }}
          >
            <option value="PREVIOUS_RESULT">Previous command result (current execution)</option>
            <option value="VARIABLE_COMPARISON">Runtime variable comparison (typed)</option>
          </select>
        </label>

        {value.conditionSource === 'VARIABLE_COMPARISON' && (
          <>
            <div className={styles.wide}>
              <SearchBox
                label="Left variable"
                placeholder="Search variable name or ID..."
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
              <select
                disabled={disabled}
                value={value.operator}
                onChange={(event) => onChange({
                  ...value,
                  operator: event.target.value as ComparisonOperator,
                })}
              >
                {comparisonOperators.map(operator => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Right operand</span>
              <select
                disabled={disabled}
                value={value.operandKind}
                onChange={(event) => {
                  const operandKind = event.target.value as ComparisonOperandKind;
                  onChange({
                    ...value,
                    operandKind,
                    operandRawValue: operandKind === 'LITERAL' ? value.operandRawValue : '',
                    operandVariableId: operandKind === 'VARIABLE' ? value.operandVariableId : null,
                  });
                }}
              >
                {operandKinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </label>
            {value.operandKind === 'LITERAL' && (
              <label className={styles.wide}>
                <span>Exact comparison text</span>
                <input
                  disabled={disabled}
                  type="text"
                  value={value.operandRawValue}
                  onChange={(event) => onChange({ ...value, operandRawValue: event.target.value })}
                />
              </label>
            )}
            {value.operandKind === 'VARIABLE' && (
              <div className={styles.wide}>
                <SearchBox
                  label="Right variable"
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
              <select
                disabled={disabled}
                value={value.formatPolicy}
                onChange={(event) => onChange({ ...value, formatPolicy: event.target.value })}
              >
                <option value="EXACT_TEXT">Exact raw text</option>
                <option value="LOCALE_NUMBER">Locale-aware number</option>
                <option value="CASE_INSENSITIVE_TEXT">Case-insensitive text</option>
              </select>
            </label>
          </>
        )}
      </div>
    </section>
  );
};

export default ConditionalCommandEditor;
