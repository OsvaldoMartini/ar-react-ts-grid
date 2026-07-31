import React, {
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link2,
  Unplug,
  Workflow,
  X,
} from 'lucide-react';
import SearchBox, {
  type SearchBoxBadge,
  type SearchBoxOption,
} from '../SearchBox';
import { RulesCard, type RulesCardEvent } from '../RulesCard';
import styles from './VariablesConnectionsModal.module.scss';

export type VariablesConnectionsModalMode = 'RESOLVE' | 'RELEASE';

export type VariablesConnectionStateTone =
  | 'green'
  | 'orange'
  | 'red'
  | 'blue'
  | 'gray';

export interface VariablesConnectionOption {
  value: string;
  label: string;
  sublabel?: string;
  badges?: SearchBoxBadge[];
  keywords?: string;
}

export interface VariablesConnectionReviewItem {
  id: string;
  sourceLabel: string;
  sourceSublabel?: string;
  relationLabel: string;
  state: string;
  stateTone?: VariablesConnectionStateTone;
  currentTargetLabel?: string | null;
  compatibleOptions?: readonly VariablesConnectionOption[];
  initialOptionValue?: string | null;
}

export interface VariablesConnectionResolution {
  itemId: string;
  optionValue: string;
}

export type VariablesConnectionsModalSubmission =
  | {
      mode: 'RESOLVE';
      resolutions: VariablesConnectionResolution[];
    }
  | {
      mode: 'RELEASE';
      itemIds: string[];
    };

export interface VariablesConnectionsModalProps {
  mode: VariablesConnectionsModalMode;
  scopeLabel: string;
  scopeCount: number;
  items: readonly VariablesConnectionReviewItem[];
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (submission: VariablesConnectionsModalSubmission) => void;
}

const focusableSelector = [
  'input:not([disabled])',
  'button:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const toneClass = (
  tone: VariablesConnectionStateTone | undefined,
): string => {
  switch (tone) {
    case 'green':
      return styles.stateGreen;
    case 'orange':
      return styles.stateOrange;
    case 'red':
      return styles.stateRed;
    case 'blue':
      return styles.stateBlue;
    default:
      return styles.stateGray;
  }
};

const VariablesConnectionsModal: React.FC<
  VariablesConnectionsModalProps
> = ({
  mode,
  scopeLabel,
  scopeCount,
  items,
  pending = false,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const frozenScopeRef = useRef<{
    label: string;
    count: number;
  } | null>(null);
  if (frozenScopeRef.current === null) {
    frozenScopeRef.current = {
      label: scopeLabel,
      count: scopeCount,
    };
  }
  const frozenScope = frozenScopeRef.current;

  const [selectionByItem, setSelectionByItem] = useState<
    Record<string, string | null>
  >(() => Object.fromEntries(
    items.map(item => {
      const initial = item.initialOptionValue ?? null;
      const valid = initial !== null
        && (item.compatibleOptions ?? []).some(
          option => option.value === initial,
        );
      return [item.id, valid ? initial : null];
    }),
  ));

  const resolutions = useMemo<VariablesConnectionResolution[]>(
    () => items.flatMap((item) => {
      const optionValue = selectionByItem[item.id] ?? null;
      if (
        optionValue === null
        || !(item.compatibleOptions ?? []).some(
          option => option.value === optionValue,
        )
      ) {
        return [];
      }
      return [{ itemId: item.id, optionValue }];
    }),
    [items, selectionByItem],
  );
  const noTargetCount = useMemo(
    () => items.filter(item =>
      (item.compatibleOptions ?? []).length === 0).length,
    [items],
  );
  const selectedCount = resolutions.length;
  const remainingCount = Math.max(items.length - selectedCount, 0);
  const confirmCount = mode === 'RESOLVE' ? selectedCount : items.length;
  const confirmDisabled = pending || confirmCount === 0;

  const confirmEvent = useMemo<RulesCardEvent>(() => ({
    color: mode === 'RESOLVE' ? 'green' : 'red',
    rules: pending
      ? mode === 'RESOLVE'
        ? 'Resolving...'
        : 'Releasing...'
      : `${mode === 'RESOLVE' ? 'Resolve' : 'Release'} ${confirmCount} Connection${confirmCount === 1 ? '' : 's'}`,
    ts: 0,
  }), [confirmCount, mode, pending]);

  const cancel = () => {
    if (!pending) onCancel();
  };
  const confirm = () => {
    if (confirmDisabled) return;
    if (mode === 'RESOLVE') {
      onConfirm({ mode, resolutions });
      return;
    }
    onConfirm({ mode, itemIds: items.map(item => item.id) });
  };
  const handleDialogKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key === 'Escape') {
      if (!pending) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const resolving = mode === 'RESOLVE';
  const title = resolving
    ? 'Resolve Connections'
    : 'Release Connections';
  const description = resolving
    ? 'Review each visible relationship and select a compatible target.'
    : 'Review the visible relationships that will be disconnected.';

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={handleDialogKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.titleLine}>
              {resolving
                ? <Workflow size={21} aria-hidden="true" />
                : <Unplug size={21} aria-hidden="true" />}
              <h2 id={titleId}>{title}</h2>
            </div>
            <p id={descriptionId}>{description}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label={`Cancel ${title.toLocaleLowerCase()}`}
            title="Cancel"
            disabled={pending}
            onClick={cancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.scope} aria-label="Frozen connection scope">
            <div>
              <span>Frozen scope</span>
              <strong>{frozenScope.label}</strong>
            </div>
            <b>{frozenScope.count}</b>
          </section>

          <section className={styles.summary} aria-label="Connection summary">
            <div>
              <span>Connections</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>{resolving ? 'Ready' : 'To release'}</span>
              <strong>{confirmCount}</strong>
            </div>
            {resolving && (
              <>
                <div>
                  <span>Need selection</span>
                  <strong>{remainingCount}</strong>
                </div>
                <div>
                  <span>No compatible target</span>
                  <strong>{noTargetCount}</strong>
                </div>
              </>
            )}
          </section>
          {!resolving && (
            <p className={styles.releaseSummary}>
              Release will disconnect all {items.length} reviewed connection
              {items.length === 1 ? '' : 's'} in this frozen scope.
            </p>
          )}

          <div className={styles.reviewList}>
            {items.map((item, index) => {
              const options = [...(item.compatibleOptions ?? [])];
              const searchOptions: SearchBoxOption[] = options.map(
                option => ({ ...option }),
              );
              return (
                <article className={styles.reviewItem} key={item.id}>
                  <header className={styles.reviewHeader}>
                    <span className={styles.sequence}>{index + 1}</span>
                    <div className={styles.source}>
                      <strong>{item.sourceLabel}</strong>
                      {item.sourceSublabel && (
                        <small>{item.sourceSublabel}</small>
                      )}
                    </div>
                    <span
                      className={`${styles.state} ${toneClass(item.stateTone)}`}
                    >
                      {item.state}
                    </span>
                  </header>
                  <div className={styles.relation}>
                    <Link2 size={14} aria-hidden="true" />
                    <span>{item.relationLabel}</span>
                    <strong>
                      {item.currentTargetLabel ?? 'Not connected'}
                    </strong>
                  </div>
                  {resolving && (
                    <>
                      <SearchBox
                        options={searchOptions}
                        value={selectionByItem[item.id] ?? null}
                        onChange={(value) => {
                          setSelectionByItem(current => ({
                            ...current,
                            [item.id]: value,
                          }));
                        }}
                        label={`${item.relationLabel} target for ${item.sourceLabel}`}
                        placeholder={`Search compatible ${item.relationLabel.toLocaleLowerCase()}...`}
                        headerRight={item.state}
                        countLabel={count =>
                          `${count} COMPATIBLE OPTION${count === 1 ? '' : 'S'}`}
                        disabled={pending}
                      />
                      {options.length === 0 && (
                        <p className={styles.emptyState} role="status">
                          No compatible options are available for this connection.
                        </p>
                      )}
                    </>
                  )}
                </article>
              );
            })}
            {items.length === 0 && (
              <p className={styles.emptyList} role="status">
                No connections are present in the frozen scope.
              </p>
            )}
          </div>

          {pending && (
            <p className={styles.pendingStatus} role="status" aria-live="polite">
              {resolving
                ? 'Resolving selected connections...'
                : 'Releasing selected connections...'}
            </p>
          )}
        </div>

        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={pending}
            onClick={cancel}
          >
            Cancel
          </button>
          <div className={styles.ruleAction}>
            <RulesCard
              event={confirmEvent}
              animate={false}
              pulse={false}
              onClick={confirm}
              disabled={confirmDisabled}
              title={resolving
                ? 'Apply the selected compatible targets'
                : 'Disconnect every reviewed relationship'}
            />
          </div>
        </footer>
      </section>
    </div>
  );
};

export default VariablesConnectionsModal;
