import React, {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Database, Loader2 } from 'lucide-react';
import styles from './RuntimeMemoryPanel.module.scss';

export type RuntimeMemoryValueState = 'VALUE' | 'VOID';

/**
 * One runtime-memory value. This is deliberately separate from the persisted
 * variable definition value: an empty VALUE is valid and is not the same as
 * VOID.
 */
export interface RuntimeMemoryPanelItem {
  variableId: number;
  name: string;
  state: RuntimeMemoryValueState;
  value: string | null;
  voidReason?: string | null;
  editable?: boolean;
}

export interface RuntimeMemoryPanelProps {
  items: readonly RuntimeMemoryPanelItem[];
  disabled?: boolean;
  disabledReason?: string;
  pendingVariableIds?: ReadonlySet<number>;
  onCommitValue?: (variableId: number, value: string) => void;
  onEditStart?: (variableId: number) => void;
  onEditCancel?: (variableId: number) => void;
  className?: string;
}

type RuntimeMemoryRowProps = {
  item: RuntimeMemoryPanelItem;
  disabled: boolean;
  pending: boolean;
  onCommitValue?: RuntimeMemoryPanelProps['onCommitValue'];
  onEditStart?: RuntimeMemoryPanelProps['onEditStart'];
  onEditCancel?: RuntimeMemoryPanelProps['onEditCancel'];
};

const inputValue = (item: RuntimeMemoryPanelItem): string =>
  item.state === 'VALUE' ? item.value ?? '' : '';

const voidLabel = (item: RuntimeMemoryPanelItem): string => {
  const reason = item.voidReason?.trim().replaceAll('_', ' ');
  return reason ? `VOID - ${reason}` : 'VOID';
};

const RuntimeMemoryRow: React.FC<RuntimeMemoryRowProps> = ({
  item,
  disabled,
  pending,
  onCommitValue,
  onEditStart,
  onEditCancel,
}) => {
  const authoritativeValue = inputValue(item);
  const [draft, setDraft] = useState(authoritativeValue);
  const [dirty, setDirty] = useState(false);
  const editingRef = useRef(false);
  const forceCommitRef = useRef(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (editingRef.current || pending) return;
    setDraft(authoritativeValue);
    setDirty(false);
  }, [authoritativeValue, item.state, item.variableId, pending]);

  const cancel = () => {
    cancelRef.current = false;
    forceCommitRef.current = false;
    editingRef.current = false;
    setDraft(authoritativeValue);
    setDirty(false);
    onEditCancel?.(item.variableId);
  };

  const commit = () => {
    const forceCommit = forceCommitRef.current;
    forceCommitRef.current = false;
    editingRef.current = false;

    if (cancelRef.current) {
      cancel();
      return;
    }

    const unchangedValue =
      item.state === 'VALUE' && draft === authoritativeValue;
    if ((!dirty && !(forceCommit && item.state === 'VOID')) || unchangedValue) {
      setDirty(false);
      return;
    }

    setDirty(false);
    onCommitValue?.(item.variableId, draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      forceCommitRef.current = true;
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelRef.current = true;
      event.currentTarget.blur();
    }
  };

  const rowDisabled =
    disabled || pending || item.editable === false || !onCommitValue;
  const producedEmpty = item.state === 'VALUE' && authoritativeValue === '';
  const inputTitle = item.state === 'VOID'
    ? `${voidLabel(item)}. Enter a value to override runtime memory.`
    : producedEmpty
      ? 'The current runtime value is an empty string.'
      : `Current runtime value: ${authoritativeValue}`;

  return (
    <tr
      className={item.state === 'VOID' ? styles.voidRow : undefined}
      data-runtime-state={item.state}
      data-variable-id={item.variableId}
    >
      <th scope="row" className={styles.nameCell}>
        <strong title={item.name}>{item.name || `Variable ${item.variableId}`}</strong>
      </th>
      <td className={styles.valueCell}>
        <div className={styles.valueEditor}>
          <input
            type="text"
            value={draft}
            disabled={rowDisabled}
            aria-label={`Value for ${item.name || `variable ${item.variableId}`}`}
            aria-invalid={false}
            className={[
              item.state === 'VOID' ? styles.voidInput : '',
              producedEmpty ? styles.emptyValueInput : '',
            ].filter(Boolean).join(' ')}
            placeholder={item.state === 'VOID' ? voidLabel(item) : undefined}
            title={inputTitle}
            onFocus={() => {
              editingRef.current = true;
              cancelRef.current = false;
              forceCommitRef.current = false;
              onEditStart?.(item.variableId);
            }}
            onChange={(event) => {
              setDraft(event.target.value);
              setDirty(true);
            }}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
          {item.state === 'VOID' && (
            <span className={styles.voidBadge} aria-hidden="true">VOID</span>
          )}
          {pending && (
            <Loader2
              className={styles.pendingIcon}
              size={14}
              aria-label={`Saving ${item.name || `variable ${item.variableId}`}`}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

const RuntimeMemoryPanel: React.FC<RuntimeMemoryPanelProps> = ({
  items,
  disabled = false,
  disabledReason,
  pendingVariableIds,
  onCommitValue,
  onEditStart,
  onEditCancel,
  className,
}) => (
  <aside
    className={[styles.panel, className ?? ''].filter(Boolean).join(' ')}
    aria-label="Runtime memory variables"
  >
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}>Live runtime</span>
        <h2>
          <Database size={16} aria-hidden="true" />
          Memory variables
        </h2>
      </div>
      <span className={styles.count}>{items.length}</span>
    </header>

    {disabledReason && (
      <p className={styles.disabledReason} role="status">
        {disabledReason}
      </p>
    )}

    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <RuntimeMemoryRow
              key={item.variableId}
              item={item}
              disabled={disabled}
              pending={pendingVariableIds?.has(item.variableId) ?? false}
              onCommitValue={onCommitValue}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
            />
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className={styles.empty} role="status">
          No runtime memory variables are defined.
        </div>
      )}
    </div>
  </aside>
);

export default RuntimeMemoryPanel;
