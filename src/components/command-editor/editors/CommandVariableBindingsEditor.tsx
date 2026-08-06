import React, { useMemo } from 'react';
import SearchBox, { type SearchBoxOption } from '../../SearchBox';
import type {
  ComponentEditorVariableOption,
  ComponentEditorVariableSlot,
} from '../componentEditor.types';
import type { CommandEditorVariableBinding } from '../commandEditorVariableBindings';
import styles from './CommandVariableBindingsEditor.module.scss';

interface Props {
  bindings: readonly CommandEditorVariableBinding[];
  variables: readonly ComponentEditorVariableOption[];
  disabled?: boolean;
  disconnectedOnly?: boolean;
  onChange: (slot: ComponentEditorVariableSlot, variableId: number | null) => void;
}

const SLOT_PRESENTATION: Readonly<Record<ComponentEditorVariableSlot, {
  label: string;
  direction: string;
}>> = {
  LEFT: { label: 'First variable', direction: 'Variable → comparison left side' },
  RIGHT: { label: 'Second variable', direction: 'Variable → comparison right side' },
  GET_WRITE: { label: 'GET target variable', direction: 'Web Element → Variable' },
  READ_SET: { label: 'SET source variable', direction: 'Variable → Web Element' },
  READ: { label: 'ExcelWrite source variable', direction: 'Variable → Excel/CSV' },
};

const CommandVariableBindingsEditor: React.FC<Props> = ({
  bindings,
  variables,
  disabled = false,
  disconnectedOnly = false,
  onChange,
}) => {
  const baseOptions = useMemo<SearchBoxOption[]>(() => variables.map(variable => ({
    value: String(variable.variableId),
    label: variable.name,
    sublabel: `${variable.type || '$String'} · variable ID ${variable.variableId}`,
    keywords: `${variable.variableId} ${variable.name} ${variable.type}`,
  })), [variables]);

  if (bindings.length === 0) return null;

  return (
    <section className={styles.editor} aria-label="Variable connections">
      <header>
        <span>Variable connections</span>
        <small>
          {disconnectedOnly
            ? 'New commands are created disconnected. Connect variables after creation.'
            : 'Choose the runtime variable used by each required command slot.'}
        </small>
      </header>
      <div className={styles.fields}>
        {bindings.map(binding => {
          const presentation = SLOT_PRESENTATION[binding.slot];
          const desiredId = binding.desiredVariableId;
          const hasDesiredOption = desiredId === null
            || baseOptions.some(option => option.value === String(desiredId));
          const options = hasDesiredOption
            ? baseOptions
            : [{
                value: String(desiredId),
                label: `Variable ID ${desiredId}`,
                sublabel: 'Connected variable is not present in the current variable list.',
                badges: [{ text: 'UNAVAILABLE', tone: 'red' as const }],
                keywords: String(desiredId),
              }, ...baseOptions];
          return (
            <div className={styles.field} key={binding.slot}>
              <SearchBox
                label={presentation.label}
                placeholder={`Search ${presentation.label.toLocaleLowerCase()} name or ID...`}
                headerRight={presentation.direction}
                allOptionLabel="Disconnect variable"
                options={options}
                value={desiredId === null ? null : String(desiredId)}
                onChange={selected => onChange(
                  binding.slot,
                  selected === null ? null : Number(selected),
                )}
                disabled={disabled || disconnectedOnly}
              />
              <small>{presentation.direction}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CommandVariableBindingsEditor;
