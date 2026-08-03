import React, { useEffect, useId, useMemo, useRef } from 'react';
import { AlertTriangle, CheckCircle2, CircleSlash2, X, XCircle } from 'lucide-react';
import type {
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogEntry,
} from './domain/variablesSmokeTestTypes';
import VariablesSmokeTestLog from './VariablesSmokeTestLog';
import styles from './VariablesSmokeTestReportModal.module.scss';

export interface VariablesSmokeTestReportModalProps {
  counter: keyof VariablesSmokeTestCounters;
  count: number;
  entries: readonly VariablesSmokeTestLogEntry[];
  onClose: () => void;
}

const LABELS: Record<keyof VariablesSmokeTestCounters, string> = {
  passed: 'Passed',
  bypassed: 'Bypassed',
  warning: 'Warnings',
  failed: 'Failed',
};

const ICONS = {
  passed: CheckCircle2,
  bypassed: CircleSlash2,
  warning: AlertTriangle,
  failed: XCircle,
} as const;

const VariablesSmokeTestReportModal: React.FC<VariablesSmokeTestReportModalProps> = ({
  counter,
  count,
  entries,
  onClose,
}) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const reportEntries = useMemo(
    () => entries.filter(entry => entry.counter === counter),
    [counter, entries],
  );
  const Icon = ICONS[counter];

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-counter={counter}
      >
        <header className={styles.header}>
          <div>
            <Icon size={20} aria-hidden="true" />
            <span>Smoke Test report</span>
            <h3 id={titleId}>{LABELS[counter]}</h3>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close report">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.summary}>
          <strong>{count}</strong>
          <span>
            {LABELS[counter]} command{count === 1 ? '' : 's'} - {reportEntries.length} report entr{reportEntries.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        <div className={styles.list}>
          {reportEntries.length === 0 ? (
            <p className={styles.empty}>No {LABELS[counter].toLocaleLowerCase()} results were recorded.</p>
          ) : (
            <VariablesSmokeTestLog
              entries={reportEntries}
              sequenceLabel="STEP"
            />
          )}
        </div>

        <footer>
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
};

export default VariablesSmokeTestReportModal;
