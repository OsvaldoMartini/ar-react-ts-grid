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
import type { VariableWorkspaceBlock } from '../variablesWorkspace.contract';
import VariablesConnectionsHelpModal from './VariablesConnectionsHelpModal';
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
  blockId?: number | null;
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
      itemIds: string[];
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
  blocks?: readonly VariableWorkspaceBlock[];
  blockFilter?: number | null;
  onBlockFilterChange?: (blockId: number | null) => void;
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
  blocks = [],
  blockFilter: controlledBlockFilter,
  onBlockFilterChange,
  pending = false,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const [localBlockFilter, setLocalBlockFilter] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const blockFilter = controlledBlockFilter === undefined
    ? localBlockFilter
    : controlledBlockFilter;

  const [selectionByItem, setSelectionByItem] = useState<
    Record<string, string | null>
  >(() => Object.fromEntries(
    items.map(item => {
      const initial = item.initialOptionValue ?? null;
      const valid = initial !== null
        && (item.compatibleOptions ?? []).some(
          option => option.value === initial,
        );
      const firstAvailable = item.compatibleOptions?.[0]?.value ?? null;
      return [item.id, valid ? initial : firstAvailable];
    }),
  ));
  const blockSearchOptions = useMemo<SearchBoxOption[]>(() => {
    const connectionCounts = new Map<number, number>();
    items.forEach((item) => {
      if (item.blockId == null) return;
      connectionCounts.set(
        item.blockId,
        (connectionCounts.get(item.blockId) ?? 0) + 1,
      );
    });
    return blocks.map(block => ({
      value: String(block.id),
      label: `#${block.order ?? block.id} ${block.name}`,
      sublabel: `${connectionCounts.get(block.id) ?? 0} connection(s) · block ID ${block.id}`,
      badges: [block.active === false
        ? { text: 'INACTIVE', tone: 'red' as const }
        : { text: 'ACTIVE', tone: 'green' as const }],
      keywords: String(block.id),
    }));
  }, [blocks, items]);
  const visibleItems = useMemo(() => blockFilter === null
    ? items
    : items.filter(item => item.blockId === blockFilter), [blockFilter, items]);
  const resolutionItems = mode === 'RESOLVE' ? visibleItems : items;
  const resolutions = useMemo<VariablesConnectionResolution[]>(
    () => resolutionItems.flatMap((item) => {
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
    [resolutionItems, selectionByItem],
  );
  const noTargetCount = useMemo(
    () => visibleItems.filter(item =>
      (item.compatibleOptions ?? []).length === 0).length,
    [visibleItems],
  );
  const selectedCount = resolutions.length;
  const remainingCount = Math.max(visibleItems.length - selectedCount, 0);
  const confirmCount = mode === 'RESOLVE' ? selectedCount : visibleItems.length;
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
      onConfirm({
        mode,
        resolutions,
        itemIds: visibleItems.map(item => item.id),
      });
      return;
    }
    onConfirm({ mode, itemIds: visibleItems.map(item => item.id) });
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

        <div className={`${styles.body} ${resolving ? styles.bodyWithHelp : ''}`}>
          <section className={styles.scope} aria-label="Frozen connection scope">
            <div>
              <span>Frozen scope</span>
              <strong>{scopeLabel}</strong>
            </div>
            <b>{scopeCount}</b>
          </section>

          <section className={styles.summary} aria-label="Connection summary">
            <div>
              <span>Connections</span>
              <strong>{visibleItems.length}</strong>
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
          <SearchBox
            label="Block"
            placeholder="Search block name or number..."
            headerRight="Connections per block"
            countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
            allOptionLabel="All blocks"
            options={blockSearchOptions}
            value={blockFilter === null ? null : String(blockFilter)}
            onChange={(value) => {
              const nextBlockFilter = value === null ? null : Number(value);
              setLocalBlockFilter(nextBlockFilter);
              onBlockFilterChange?.(nextBlockFilter);
            }}
            disabled={pending}
          />
          {!resolving && (
            <p className={styles.releaseSummary}>
              Release will disconnect {visibleItems.length} reviewed connection
              {visibleItems.length === 1 ? '' : 's'} in the selected Block scope.
            </p>
          )}

          <div className={styles.reviewList}>
            {visibleItems.map((item, index) => {
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
                        labelClassName={item.relationLabel === 'Variable'
                          ? styles.variableTargetLabel
                          : item.relationLabel === 'Web Element'
                            ? styles.webElementTargetLabel
                            : undefined}
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
            {visibleItems.length === 0 && (
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
        {resolving && (
          <button
            type="button"
            className={styles.helpButton}
            aria-label="How Resolve Connections works"
            title="How Resolve Connections works"
            onClick={() => setHelpOpen(true)}
          >
            ?
          </button>
        )}
        {helpOpen && (
          <VariablesConnectionsHelpModal
            onClose={() => setHelpOpen(false)}
          />
        )}
      </section>
    </div>
  );
};

export default VariablesConnectionsModal;
