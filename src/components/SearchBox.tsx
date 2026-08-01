import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Search } from 'lucide-react';
import styles from './SearchBox.module.scss';

export type SearchBoxBadgeTone = 'green' | 'red' | 'blue' | 'gray';

export interface SearchBoxBadge {
  text: string;
  tone?: SearchBoxBadgeTone;
}

export interface SearchBoxOption {
  /** Stable identity returned by onChange. */
  value: string;
  /** Main card title (e.g. "#3 Login"). */
  label: string;
  /** Muted second line (e.g. "4 variable links · futures"). */
  sublabel?: string;
  /** Colored chips rendered next to the title (BUY/SELL/BINANCE style). */
  badges?: SearchBoxBadge[];
  /** Extra text that participates in filtering but is not rendered. */
  keywords?: string;
}

export interface SearchBoxProps {
  options: SearchBoxOption[];
  /** Currently selected option value, or null when nothing/all is selected. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Small uppercase heading above the input (e.g. "EXACT BOT AND ACCOUNT"). */
  label?: string;
  /** Optional presentation class applied only to the heading label. */
  labelClassName?: string;
  /** Right side of the results header row, rendered uppercase. */
  headerRight?: string;
  /** Results header count text; defaults to "N RESULTS". */
  countLabel?: (count: number) => string;
  /** When set, a first pseudo-option clears the selection (onChange(null)). */
  allOptionLabel?: string;
  disabled?: boolean;
}

/**
 * Searchable dropdown combobox modeled on the AI Manager "Exact bot and account"
 * selector (specifications/migrations/searchable_tool.png): opens on click/focus,
 * token-based auto-filtering with a live result count, keyboard navigation with
 * ARIA combobox semantics, and compact option cards with colored badges.
 */
const SearchBox: React.FC<SearchBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  label,
  labelClassName,
  headerRight,
  countLabel,
  allOptionLabel,
  disabled = false,
}) => {
  const listboxId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return options;
    return options.filter((option) => {
      const haystack = [
        option.label,
        option.sublabel ?? '',
        option.keywords ?? '',
        ...(option.badges ?? []).map(badge => badge.text),
      ].join(' ').toLocaleLowerCase();
      return tokens.every(token => haystack.includes(token));
    });
  }, [options, query]);

  // The "All" pseudo-row participates in keyboard navigation as index 0.
  const showAllOption = allOptionLabel !== undefined;
  const rowCount = filteredOptions.length + (showAllOption ? 1 : 0);

  useEffect(() => {
    if (activeIndex >= rowCount) setActiveIndex(rowCount > 0 ? rowCount - 1 : 0);
  }, [activeIndex, rowCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(0);
  };

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const commit = (nextValue: string | null) => {
    onChange(nextValue);
    close();
  };

  const commitActive = () => {
    if (rowCount === 0) return;
    if (showAllOption && activeIndex === 0) {
      commit(null);
      return;
    }
    const option = filteredOptions[activeIndex - (showAllOption ? 1 : 0)];
    if (option) commit(option.value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      event.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, Math.max(rowCount - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commitActive();
    }
  };

  const resultText = countLabel
    ? countLabel(filteredOptions.length)
    : `${filteredOptions.length} RESULT${filteredOptions.length === 1 ? '' : 'S'}`;

  return (
    <div className={styles.searchBox} ref={rootRef}>
      {label && (
        <label
          className={`${styles.boxLabel} ${labelClassName ?? ''}`.trim()}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div
        className={`${styles.inputShell} ${open ? styles.inputShellOpen : ''} ${disabled ? styles.inputShellDisabled : ''}`}
      >
        <Search size={14} aria-hidden="true" className={styles.searchIcon} />
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={selectedOption && !open ? undefined : placeholder}
          value={open ? query : (selectedOption?.label ?? '')}
          onFocus={openList}
          onClick={openList}
          onChange={(event) => {
            if (!open) setOpen(true);
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={styles.chevronButton}
          tabIndex={-1}
          aria-label={open ? 'Close options' : 'Open options'}
          disabled={disabled}
          onClick={() => {
            if (open) {
              close();
            } else {
              openList();
              inputRef.current?.focus();
            }
          }}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={open ? styles.chevronOpen : ''}
          />
        </button>
      </div>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>{resultText}</span>
            {headerRight && <span>{headerRight}</span>}
          </div>
          <ul id={listboxId} role="listbox" className={styles.optionList}>
            {showAllOption && (
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === null}
                  className={[
                    styles.optionCard,
                    styles.allOption,
                    value === null ? styles.optionSelected : '',
                    activeIndex === 0 ? styles.optionActive : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => setActiveIndex(0)}
                  onClick={() => commit(null)}
                >
                  <span className={styles.optionTitleLine}>
                    <strong>{allOptionLabel}</strong>
                  </span>
                </button>
              </li>
            )}
            {filteredOptions.map((option, index) => {
              const rowIndex = index + (showAllOption ? 1 : 0);
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={[
                      styles.optionCard,
                      option.value === value ? styles.optionSelected : '',
                      rowIndex === activeIndex ? styles.optionActive : '',
                    ].filter(Boolean).join(' ')}
                    onMouseEnter={() => setActiveIndex(rowIndex)}
                    onClick={() => commit(option.value)}
                  >
                    <span className={styles.optionTitleLine}>
                      <strong>{option.label}</strong>
                      {(option.badges ?? []).map(badge => (
                        <span
                          key={`${option.value}:${badge.text}`}
                          className={`${styles.badge} ${styles[`badge_${badge.tone ?? 'gray'}`]}`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </span>
                    {option.sublabel && (
                      <span className={styles.optionSublabel}>{option.sublabel}</span>
                    )}
                  </button>
                </li>
              );
            })}
            {filteredOptions.length === 0 && (
              <li role="presentation" className={styles.noResults}>
                No matches for “{query.trim()}”
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
