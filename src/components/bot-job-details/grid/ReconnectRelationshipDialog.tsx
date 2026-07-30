import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowRight, Link2, X } from 'lucide-react';
import SearchBox, {
  type SearchBoxBadge,
  type SearchBoxOption,
} from '../../SearchBox';
import { RulesCard, type RulesCardEvent } from '../../RulesCard';
import type {
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
  RelationshipTarget,
} from './domain/instructionRelationshipGraph';
import styles from './ReconnectRelationshipDialog.module.scss';

export interface ReconnectRelationshipOption {
  target: RelationshipTarget;
  label: string;
  sublabel?: string;
  badges?: SearchBoxBadge[];
  keywords?: string;
}

export interface ReconnectRelationshipDialogProps {
  edge: InstructionRelationshipEdge;
  sourceLabel: string;
  currentTargetLabel: string | null;
  /** Optional exact layout/location preview supplied by the authoring page. */
  changeSummary?: string;
  /**
   * The caller owns compatibility filtering. In particular, BLOCK_TARGET
   * candidates must already exclude the instruction's containing block.
   */
  compatibleTargets: readonly ReconnectRelationshipOption[];
  pending: boolean;
  onDisconnect: () => void;
  onConnect: (target: RelationshipTarget) => void;
  onCancel: () => void;
}

interface RelationshipCopy {
  title: string;
  description: string;
  relationLabel: string;
  selectorLabel: string;
  emptySelectionLabel: string;
}

const relationshipCopy: Readonly<Record<
  InstructionRelationshipKind,
  RelationshipCopy
>> = {
  ELEMENT_TARGET: {
    title: 'Reconnect Web Element',
    description: 'Select the Web Element this instruction should use. Connecting writes parentId.',
    relationLabel: 'parentId',
    selectorLabel: 'Compatible Web Elements',
    emptySelectionLabel: 'Select a compatible Web Element',
  },
  VARIABLE_BINDING: {
    title: 'Reconnect variable',
    description: 'Select the variable this instruction should use. Connecting writes variableId.',
    relationLabel: 'variableId',
    selectorLabel: 'Compatible variables',
    emptySelectionLabel: 'Select a compatible variable',
  },
  LOOP_ANCHOR: {
    title: 'Reconnect LOOP anchor',
    description: 'Select the Web Element that should anchor this LOOP. Connecting writes parentId.',
    relationLabel: 'parentId',
    selectorLabel: 'Compatible LOOP anchors',
    emptySelectionLabel: 'Select a compatible Web Element',
  },
  CONDITIONAL_ROOT: {
    title: 'Reconnect conditional root',
    description: 'Select the IF instruction that owns this conditional boundary. Connecting writes parentId.',
    relationLabel: 'parentId',
    selectorLabel: 'Compatible IF instructions',
    emptySelectionLabel: 'Select a compatible IF instruction',
  },
  BLOCK_TARGET: {
    title: 'Reconnect GOTO destination',
    description: 'Select another owned Block as the GOTO destination. Connecting writes parentBlockId.',
    relationLabel: 'parentBlockId',
    selectorLabel: 'Compatible destination Blocks',
    emptySelectionLabel: 'Select a compatible destination Block',
  },
  VARIABLE_OWNER: {
    title: 'Reconnect variable owner',
    description: 'Select the Web Element instruction that owns this variable. Connecting writes ownerInstructionId.',
    relationLabel: 'ownerInstructionId',
    selectorLabel: 'Compatible variable owners',
    emptySelectionLabel: 'Select a compatible owner',
  },
  VARIABLE_ORDER: {
    title: 'Reconnect variable writer',
    description: 'Select the runtime value writer that must execute before this instruction.',
    relationLabel: 'execution order',
    selectorLabel: 'Compatible variable writers',
    emptySelectionLabel: 'Select a compatible writer',
  },
  POSITIONAL_SCOPE: {
    title: 'Reconnect positional scope',
    description: 'Select the structural instruction that should own this positional scope.',
    relationLabel: 'positional scope',
    selectorLabel: 'Compatible structural instructions',
    emptySelectionLabel: 'Select a compatible scope',
  },
};

const ownerKey = (owner: RelationshipOwner): string =>
  owner.workspaceKind === 'BOT_JOB'
    ? `BOT_JOB:${owner.homeBankingId}:${owner.botJobId}`
    : `COMPONENT:${owner.homeBankingId}`;

const targetKey = (target: RelationshipTarget): string =>
  `${target.entity}:${ownerKey(target.owner)}:${target.id}`;

const focusableSelector = [
  'input:not([disabled])',
  'button:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const ReconnectRelationshipDialog: React.FC<
  ReconnectRelationshipDialogProps
> = ({
  edge,
  sourceLabel,
  currentTargetLabel,
  changeSummary,
  compatibleTargets,
  pending,
  onDisconnect,
  onConnect,
  onCancel,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const copy = relationshipCopy[edge.kind];

  const targetByValue = useMemo(
    () => new Map(
      compatibleTargets.map(option => [targetKey(option.target), option]),
    ),
    [compatibleTargets],
  );
  const searchOptions = useMemo<SearchBoxOption[]>(
    () => compatibleTargets.map(option => ({
      value: targetKey(option.target),
      label: option.label,
      sublabel: option.sublabel,
      badges: option.badges,
      keywords: option.keywords,
    })),
    [compatibleTargets],
  );
  const selectedOption = selectedValue === null
    ? null
    : targetByValue.get(selectedValue) ?? null;

  useEffect(() => setSelectedValue(null), [edge.id]);
  useEffect(() => {
    if (selectedValue !== null && !targetByValue.has(selectedValue)) {
      setSelectedValue(null);
    }
  }, [selectedValue, targetByValue]);
  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLInputElement>('[role="combobox"]')
      ?.focus();
  }, [edge.id]);

  const relationEvent = useMemo<RulesCardEvent>(() => ({
    color: edge.kind === 'BLOCK_TARGET' ? 'blue' : 'orange',
    rules: copy.relationLabel,
    context: edge.kind.replaceAll('_', ' '),
    ts: 0,
  }), [copy.relationLabel, edge.kind]);
  const disconnectEvent = useMemo<RulesCardEvent>(() => ({
    color: 'red',
    rules: 'Disconnect',
    ts: 0,
  }), []);
  const connectEvent = useMemo<RulesCardEvent>(() => ({
    color: 'green',
    rules: pending ? 'Connecting...' : 'Connect',
    ts: 0,
  }), [pending]);

  const cancel = () => {
    if (!pending) onCancel();
  };
  const handleConnect = () => {
    if (!pending && selectedOption) onConnect(selectedOption.target);
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
              <Link2 size={20} aria-hidden="true" />
              <h2 id={titleId}>{copy.title}</h2>
            </div>
            <p id={descriptionId}>{copy.description}</p>
          </div>
          <div className={styles.headerActions}>
            <RulesCard
              event={relationEvent}
              animate={false}
              pulse={false}
              icon={false}
            />
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Cancel reconnect"
              title="Cancel"
              disabled={pending}
              onClick={cancel}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.sourceLine}>
            <span>Source instruction</span>
            <strong>{sourceLabel}</strong>
          </div>
          {changeSummary && (
            <div className={styles.sourceLine}>
              <span>Planned destination</span>
              <strong>{changeSummary}</strong>
            </div>
          )}
          <section
            className={styles.preview}
            aria-label="Relationship change preview"
          >
            <div className={styles.previewTarget}>
              <span>Current {copy.relationLabel}</span>
              <strong>{currentTargetLabel ?? 'Not connected'}</strong>
            </div>
            <ArrowRight
              className={styles.previewArrow}
              size={22}
              aria-label="changes to"
            />
            <div className={`${styles.previewTarget} ${styles.previewSelected}`}>
              <span>Selected {copy.relationLabel}</span>
              <strong>
                {selectedOption?.label ?? copy.emptySelectionLabel}
              </strong>
            </div>
          </section>
          <SearchBox
            options={searchOptions}
            value={selectedValue}
            onChange={setSelectedValue}
            label={copy.selectorLabel}
            placeholder={`Search ${copy.selectorLabel.toLocaleLowerCase()}...`}
            headerRight={copy.relationLabel}
            countLabel={count =>
              `${count} COMPATIBLE TARGET${count === 1 ? '' : 'S'}`}
            disabled={pending}
          />
          {compatibleTargets.length === 0 && (
            <p className={styles.emptyState} role="status">
              No compatible reconnect targets are available.
            </p>
          )}
          {pending && (
            <p className={styles.pendingStatus} role="status" aria-live="polite">
              Saving relationship...
            </p>
          )}
        </div>

        <footer className={styles.actions}>
          <div className={styles.ruleAction}>
            <RulesCard
              event={disconnectEvent}
              animate={false}
              pulse={false}
              onClick={onDisconnect}
              disabled={pending}
              title="Remove the current relationship"
            />
          </div>
          <div className={styles.actionSpacer} />
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
              event={connectEvent}
              animate={false}
              pulse={false}
              onClick={handleConnect}
              disabled={pending || selectedOption === null}
              title="Save the selected relationship"
            />
          </div>
        </footer>
      </section>
    </div>
  );
};

export default ReconnectRelationshipDialog;
