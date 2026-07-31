import React, {
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowRight,
  Braces,
  Database,
  Download,
  MousePointer2,
  TriangleAlert,
  Workflow,
  X,
} from 'lucide-react';
import SearchBox, {
  type SearchBoxBadge,
  type SearchBoxOption,
} from '../SearchBox';
import { RulesCard, type RulesCardEvent } from '../RulesCard';
import type { VariableFlowRepairChoice } from './domain/variableFlowRepair';
import styles from './VariableFlowRepairModal.module.scss';

export interface VariableFlowRepairWebElementOption {
  instructionId: number;
  label: string;
  sublabel?: string;
  badges?: SearchBoxBadge[];
  keywords?: string;
}

export interface VariableFlowRepairGetOption {
  instructionId: number;
  label: string;
  sublabel?: string;
  badges?: SearchBoxBadge[];
  keywords?: string;
  compatibleWebElementInstructionIds: readonly number[];
}

export interface VariableFlowRepairModalProps {
  variableId: number;
  variableName: string;
  variableType?: string;
  currentOwnerLabel?: string | null;
  webElementOptions: readonly VariableFlowRepairWebElementOption[];
  getOptions: readonly VariableFlowRepairGetOption[];
  pending?: boolean;
  reviewWarnings?: (
    choice: VariableFlowRepairChoice,
  ) => readonly string[];
  onCancel: () => void;
  onConfirm: (choice: VariableFlowRepairChoice) => void;
}

const focusableSelector = [
  'input:not([disabled])',
  'button:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const searchOption = (
  option: VariableFlowRepairWebElementOption
    | VariableFlowRepairGetOption,
): SearchBoxOption => ({
  value: String(option.instructionId),
  label: option.label,
  sublabel: option.sublabel,
  badges: option.badges,
  keywords: option.keywords,
});

const VariableFlowRepairModal: React.FC<
  VariableFlowRepairModalProps
> = ({
  variableId,
  variableName,
  variableType = 'Variable',
  currentOwnerLabel = null,
  webElementOptions,
  getOptions,
  pending = false,
  reviewWarnings,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const frozenRef = useRef<{
    variableId: number;
    variableName: string;
    variableType: string;
    currentOwnerLabel: string | null;
    webElementOptions: readonly VariableFlowRepairWebElementOption[];
    getOptions: readonly VariableFlowRepairGetOption[];
  } | null>(null);
  if (frozenRef.current === null) {
    frozenRef.current = {
      variableId,
      variableName,
      variableType,
      currentOwnerLabel,
      webElementOptions: webElementOptions.map(option => ({
        ...option,
        badges: option.badges?.map(badge => ({ ...badge })),
      })),
      getOptions: getOptions.map(option => ({
        ...option,
        badges: option.badges?.map(badge => ({ ...badge })),
        compatibleWebElementInstructionIds: [
          ...option.compatibleWebElementInstructionIds,
        ],
      })),
    };
  }
  const frozen = frozenRef.current;
  const [webElementValue, setWebElementValue] = useState<string | null>(null);
  const [getValue, setGetValue] = useState<string | null>(null);
  const webElementInstructionId = webElementValue === null
    ? null
    : Number(webElementValue);
  const getInstructionId = getValue === null ? null : Number(getValue);
  const compatibleGetOptions = useMemo(
    () => webElementInstructionId === null
      ? []
      : frozen.getOptions.filter(option =>
        option.compatibleWebElementInstructionIds.includes(
          webElementInstructionId,
        )),
    [frozen.getOptions, webElementInstructionId],
  );
  const ready = webElementInstructionId !== null
    && getInstructionId !== null
    && compatibleGetOptions.some(option =>
      option.instructionId === getInstructionId);
  const confirmDisabled = pending || !ready;
  const warnings = useMemo(
    () => ready
      && webElementInstructionId !== null
      && getInstructionId !== null
      ? [...(reviewWarnings?.({
          webElementInstructionId,
          getInstructionId,
        }) ?? [])]
      : [],
    [
      getInstructionId,
      ready,
      reviewWarnings,
      webElementInstructionId,
    ],
  );
  const confirmEvent = useMemo<RulesCardEvent>(() => ({
    color: 'green',
    rules: pending ? 'Connecting...' : 'Connect Variable Flow',
    ts: 0,
  }), [pending]);

  const cancel = () => {
    if (!pending) onCancel();
  };
  const confirm = () => {
    if (
      confirmDisabled
      || webElementInstructionId === null
      || getInstructionId === null
    ) {
      return;
    }
    onConfirm({ webElementInstructionId, getInstructionId });
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
              <Workflow size={21} aria-hidden="true" />
              <h2 id={titleId}>Repair Variable Flow</h2>
            </div>
            <p id={descriptionId}>
              Explicitly connect one Web Element to one GET producer and the
              selected variable in a single atomic update.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Cancel variable flow repair"
            title="Cancel"
            disabled={pending}
            onClick={cancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.currentFlow} aria-label="Current variable">
            <Braces size={18} aria-hidden="true" />
            <div>
              <span>Selected variable</span>
              <strong>#{frozen.variableId} {frozen.variableName}</strong>
              <small>
                {frozen.variableType}
                {' · '}
                {frozen.currentOwnerLabel
                  ? `Current owner: ${frozen.currentOwnerLabel}`
                  : 'No authoritative Web Element owner'}
              </small>
            </div>
          </section>

          <div className={styles.flow} aria-label="Web Element GET Variable flow">
            <section className={styles.step}>
              <header className={styles.stepHeader}>
                <span className={styles.stepNumber}>1</span>
                <MousePointer2 size={17} aria-hidden="true" />
                <div>
                  <strong>Web Element</strong>
                  <small>Declaration and value source</small>
                </div>
              </header>
              <SearchBox
                options={frozen.webElementOptions.map(searchOption)}
                value={webElementValue}
                onChange={(value) => {
                  setWebElementValue(value);
                  setGetValue(current => {
                    if (value === null || current === null) return null;
                    const nextWebElementId = Number(value);
                    const currentGetId = Number(current);
                    return frozen.getOptions.some(option =>
                      option.instructionId === currentGetId
                      && option.compatibleWebElementInstructionIds.includes(
                        nextWebElementId,
                      ))
                      ? current
                      : null;
                  });
                }}
                label="Compatible Web Element"
                placeholder="Search Web Element, name, ID..."
                headerRight="Step 1"
                countLabel={count =>
                  `${count} WEB ELEMENT${count === 1 ? '' : 'S'}`}
                disabled={pending}
              />
              {frozen.webElementOptions.length === 0 && (
                <p className={styles.emptyState} role="status">
                  No compatible Web Element is available.
                </p>
              )}
            </section>

            <ArrowRight className={styles.flowArrow} aria-hidden="true" />

            <section className={styles.step}>
              <header className={styles.stepHeader}>
                <span className={styles.stepNumber}>2</span>
                <Download size={17} aria-hidden="true" />
                <div>
                  <strong>GET producer</strong>
                  <small>Reads the selected Web Element</small>
                </div>
              </header>
              <SearchBox
                options={compatibleGetOptions.map(searchOption)}
                value={getValue}
                onChange={setGetValue}
                label="Compatible GET producer"
                placeholder={webElementInstructionId === null
                  ? 'Select a Web Element first'
                  : 'Search GET command, name, ID...'}
                headerRight="Step 2"
                countLabel={count =>
                  `${count} GET PRODUCER${count === 1 ? '' : 'S'}`}
                disabled={pending || webElementInstructionId === null}
              />
              {webElementInstructionId !== null
                && compatibleGetOptions.length === 0 && (
                <p className={styles.emptyState} role="status">
                  No active GET follows this Web Element in the same Block.
                </p>
              )}
            </section>

            <ArrowRight className={styles.flowArrow} aria-hidden="true" />

            <section className={`${styles.step} ${styles.variableStep}`}>
              <header className={styles.stepHeader}>
                <span className={styles.stepNumber}>3</span>
                <Database size={17} aria-hidden="true" />
                <div>
                  <strong>Variable</strong>
                  <small>Receives the exact GET value</small>
                </div>
              </header>
              <div className={styles.variableCard}>
                <span>Fixed repair target</span>
                <strong>#{frozen.variableId} {frozen.variableName}</strong>
                <small>{frozen.variableType}</small>
              </div>
            </section>
          </div>

          <section className={styles.review} aria-label="Repair review">
            <div>
              <span>Web Element</span>
              <strong>
                {frozen.webElementOptions.find(option =>
                  option.instructionId === webElementInstructionId)?.label
                  ?? 'Selection required'}
              </strong>
            </div>
            <ArrowRight size={15} aria-hidden="true" />
            <div>
              <span>GET producer</span>
              <strong>
                {compatibleGetOptions.find(option =>
                  option.instructionId === getInstructionId)?.label
                  ?? 'Selection required'}
              </strong>
            </div>
            <ArrowRight size={15} aria-hidden="true" />
            <div>
              <span>Variable</span>
              <strong>#{frozen.variableId} {frozen.variableName}</strong>
            </div>
          </section>

          {warnings.length > 0 && (
            <section
              className={styles.reviewWarnings}
              aria-label="Variable flow repair warnings"
            >
              <TriangleAlert size={18} aria-hidden="true" />
              <div>
                <strong>Review before connecting</strong>
                <ul>
                  {warnings.map(warning => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {pending && (
            <p className={styles.pendingStatus} role="status" aria-live="polite">
              Connecting the reviewed variable flow...
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
              title="Connect the selected Web Element, GET, and variable"
            />
          </div>
        </footer>
      </section>
    </div>
  );
};

export default VariableFlowRepairModal;
