import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckSquare2, ChevronDown, Search, Square } from 'lucide-react';
import styles from './BlockMultiSelectSearchBox.module.scss';

export type BlockMultiSelectOption = {
  value: number;
  label: string;
  sublabel: string;
  active: boolean;
  keywords?: string;
};

export interface BlockMultiSelectSearchBoxProps {
  options: readonly BlockMultiSelectOption[];
  selectedValues: readonly number[];
  onChange: (selectedValues: number[]) => void;
  label?: string;
  placeholder?: string;
  selectionMode?: 'single' | 'multiple';
  disabled?: boolean;
}

const BlockMultiSelectSearchBox: React.FC<BlockMultiSelectSearchBoxProps> = ({
  options,
  selectedValues,
  onChange,
  label = 'Smoke Test Blocks',
  placeholder = 'Search Blocks...',
  selectionMode = 'multiple',
  disabled = false,
}) => {
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(selectedValues), [selectedValues]);
  const filteredOptions = useMemo(() => {
    const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.sublabel} ${option.keywords ?? ''}`.toLocaleLowerCase();
      return tokens.every(token => haystack.includes(token));
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const toggle = (value: number) => {
    if (selectionMode === 'single') {
      onChange(selected.has(value) ? [] : [value]);
      setOpen(false);
      setQuery('');
      return;
    }
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(options.map(option => option.value).filter(optionValue => next.has(optionValue)));
  };

  const selectVisible = () => {
    const next = new Set(selected);
    filteredOptions.forEach(option => next.add(option.value));
    onChange(options.map(option => option.value).filter(optionValue => next.has(optionValue)));
  };

  const selectedOption = options.find(option => selected.has(option.value)) ?? null;
  const closedValue = selectionMode === 'single'
    ? selectedOption?.label ?? ''
    : selectedValues.length === options.length && options.length > 0
      ? `All ${options.length} Blocks selected`
      : `${selectedValues.length} of ${options.length} Blocks selected`;

  return (
    <div className={styles.root} ref={rootRef}>
      <label htmlFor={inputId}>{label}</label>
      <div className={`${styles.inputShell} ${open ? styles.inputShellOpen : ''}`}>
        <Search size={14} aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : closedValue}
          placeholder={placeholder}
          onFocus={() => { if (!disabled) setOpen(true); }}
          onClick={() => { if (!disabled) setOpen(true); }}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={open ? 'Close Block choices' : 'Open Block choices'}
          onClick={() => {
            setOpen(current => !current);
            inputRef.current?.focus();
          }}
        >
          <ChevronDown size={14} className={open ? styles.chevronOpen : ''} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className={styles.dropdown}>
          <header>
            <span>{filteredOptions.length} Block{filteredOptions.length === 1 ? '' : 's'} found</span>
            <strong>{selectedValues.length} selected</strong>
          </header>
          {selectionMode === 'multiple' && (
            <div className={styles.bulkActions}>
              <button type="button" onClick={selectVisible}>Select visible</button>
              <button type="button" onClick={() => onChange([])}>Clear all</button>
            </div>
          )}
          <ul id={listboxId} role="listbox" aria-multiselectable="true">
            {filteredOptions.map(option => {
              const checked = selected.has(option.value);
              return (
                <li key={option.value} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    className={checked ? styles.selectedOption : ''}
                    onClick={() => toggle(option.value)}
                  >
                    {checked
                      ? <CheckSquare2 size={17} aria-hidden="true" />
                      : <Square size={17} aria-hidden="true" />}
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.sublabel}</small>
                    </span>
                    <em data-active={option.active}>{option.active ? 'ACTIVE' : 'INACTIVE'}</em>
                  </button>
                </li>
              );
            })}
            {filteredOptions.length === 0 && (
              <li className={styles.empty}>No matching Blocks.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlockMultiSelectSearchBox;
