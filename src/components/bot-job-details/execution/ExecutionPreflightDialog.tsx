import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  AlertTriangle,
  LocateFixed,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  BotJobToolbarAction,
  ExecutionPreflightIssue,
  ExecutionPreflightReport,
} from '../BotJobDetails.types';
import { executionPreflightOutcome } from './executionPreflightOutcome';
import styles from './ExecutionPreflightDialog.module.scss';

const MAX_VISIBLE_ISSUES = 25;

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ExecutionPreflightDialogProps {
  action: Extract<BotJobToolbarAction, 'PREFLIGHT' | 'TEST_RUN' | 'LAUNCH'>;
  report: ExecutionPreflightReport;
  onClose: () => void;
  onFocusIssue?: (issue: ExecutionPreflightIssue) => void;
}

const actionLabel = (
  action: ExecutionPreflightDialogProps['action'],
): string => action === 'LAUNCH' ? 'Launch' : 'Test Run';

const ExecutionPreflightDialog: React.FC<ExecutionPreflightDialogProps> = ({
  action,
  report,
  onClose,
  onFocusIssue,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleIssues = useMemo(
    () => report.issues.slice(0, MAX_VISIBLE_ISSUES),
    [report.issues],
  );
  const hiddenIssueCount = Math.max(
    0,
    report.totalIssues - visibleIssues.length,
  );
  const outcome = executionPreflightOutcome(report);
  const unavailable = outcome === 'UNAVAILABLE';
  const ready = outcome === 'READY';
  const blocked = outcome === 'BLOCKED';
  const variableDiagnosticCount = report.variableDiagnosticCount
    ?? report.issues.filter(
      issue => issue.disposition === 'VARIABLE_DIAGNOSTIC',
    ).length;
  const structuralFailureCount = report.structuralStartFailureCount
    ?? report.issues.filter(
      issue => issue.disposition === 'STRUCTURAL_START_FAILURE',
    ).length;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
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
    <div className={styles.backdrop}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.titleLine}>
              {ready
                ? <ShieldCheck size={21} aria-hidden="true" />
                : <AlertTriangle size={21} aria-hidden="true" />}
              <h2 id={titleId}>{actionLabel(action)} preflight</h2>
            </div>
            <p id={descriptionId}>
              {ready
                ? 'The authoritative execution snapshot is ready.'
                : unavailable
                  ? 'The authoritative execution check was unavailable.'
                  : blocked
                    ? `${structuralFailureCount || report.totalIssues} structural start ${structuralFailureCount === 1 ? 'failure was' : 'failures were'} detected.`
                    : `${variableDiagnosticCount || report.totalIssues} variable ${variableDiagnosticCount === 1 ? 'diagnostic was' : 'diagnostics were'} reported.`}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.iconClose}
            aria-label="Close execution preflight"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div
            className={`${styles.modeNotice} ${unavailable ? styles.unavailableNotice : ''}`}
            role="status"
          >
            <strong>
              {blocked
                ? 'Structural start safety'
                : unavailable
                  ? 'Observation unavailable'
                  : 'Warning only'}
            </strong>
            <span>
              {blocked
                ? 'A structural start failure was classified separately; WARN observation does not cancel the requested execution.'
                : unavailable
                  ? 'No variable-health decision can be inferred from an unavailable observation.'
                  : 'Variable diagnostics never resend, pause, cancel, or block execution.'}
            </span>
          </div>

          {unavailable && (
            <p className={styles.unavailableReason}>
              {report.unavailableReason}
            </p>
          )}

          {ready && (
            <p className={styles.emptyState}>
              No execution relationship issues were found in this run scope.
            </p>
          )}

          {visibleIssues.length > 0 && (
            <ol className={styles.issueList} aria-label="Execution preflight issues">
              {visibleIssues.map((issue, index) => (
                <li
                  key={`${issue.code}:${issue.blockId ?? 'none'}:${issue.instructionId ?? 'none'}:${index}`}
                  className={styles.issue}
                >
                  <div className={styles.issueContent}>
                    <div className={styles.issueMeta}>
                      <span className={styles.issueCode}>{issue.code}</span>
                      {issue.blockId !== null && (
                        <span>Block #{issue.blockId}</span>
                      )}
                      {issue.instructionId !== null && (
                        <span>Instruction #{issue.instructionId}</span>
                      )}
                    </div>
                    <p>{issue.message}</p>
                  </div>
                  {issue.instructionId !== null && onFocusIssue && (
                    <button
                      type="button"
                      className={styles.focusButton}
                      onClick={() => {
                        onFocusIssue(issue);
                        onClose();
                      }}
                    >
                      <LocateFixed size={15} aria-hidden="true" />
                      Focus
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}

          {hiddenIssueCount > 0 && (
            <p className={styles.remainder} role="status">
              {hiddenIssueCount} more {hiddenIssueCount === 1 ? 'issue is' : 'issues are'} not shown.
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <span>
            {blocked
              ? 'Structural safety can be enforced separately after versioned start checks are enabled.'
              : 'WARN mode does not resend, pause, cancel, or block execution.'}
          </span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
};

export default ExecutionPreflightDialog;
