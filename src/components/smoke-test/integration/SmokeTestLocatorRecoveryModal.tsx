import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CircleHelp,
  LoaderCircle,
  Minus,
  MousePointerClick,
  Octagon,
  Power,
  Save,
  ScanSearch,
  ShieldAlert,
  SkipForward,
  TextCursorInput,
  X,
} from 'lucide-react';
import WebElementTypeToggle from '../../scanner/WebElementTypeToggle';
import type { WebElementExecutionType } from '../../webElementExecutionType';
import type {
  LocatorMatchValue,
  SmokeTestLocatorRecovery,
  SmokeTestLocatorRecoveryAction,
  SmokeTestLocatorRecoveryCandidate,
  SmokeTestLocatorRecoveryDecision,
  SmokeTestLocatorRecoveryFailedTarget,
} from './smokeTestIntegration.contract';
import styles from './SmokeTestLocatorRecoveryModal.module.scss';
import SmokeTestLocatorRecoveryHelpModal from './SmokeTestLocatorRecoveryHelpModal';

type Props = {
  instructionName: string;
  recovery: SmokeTestLocatorRecovery;
  verificationEnabled: boolean;
  onVerificationChange: (enabled: boolean) => void;
  onScanPage: () => Promise<string>;
  onTestCandidate: (
    candidate: SmokeTestLocatorRecoveryCandidate,
    action: 'CLICK' | 'INPUT',
  ) => Promise<string>;
  onDecision: (
    candidate: SmokeTestLocatorRecoveryCandidate | null,
    decision: SmokeTestLocatorRecoveryDecision | 'STOP',
    action?: SmokeTestLocatorRecoveryAction,
  ) => Promise<void>;
};

const Match: React.FC<{ value: LocatorMatchValue; label: string }> = ({ value, label }) => (
  <span
    className={value === true ? styles.match : value === false ? styles.mismatch : styles.unavailable}
    title={`${label}: ${value === true ? 'match' : value === false ? 'different' : 'unavailable'}`}
    aria-label={`${label}: ${value === true ? 'match' : value === false ? 'different' : 'unavailable'}`}
  >
    {value === true ? <Check size={15} /> : value === false ? <X size={15} /> : <Minus size={15} />}
  </span>
);

const attributes = (value: Readonly<Record<string, string>>): string =>
  Object.entries(value).map(([key, item]) => `${key}=${item}`).join('\n') || '—';

const testId = (value: Readonly<Record<string, string>>): string => {
  const normalized = Object.fromEntries(
    Object.entries(value).map(([name, item]) => [name.toLocaleLowerCase(), item]),
  );
  const configured = normalized['automation.test-id.attribute']?.trim().toLocaleLowerCase();
  const names = ['data-testid', 'data-test-id', 'test-id', 'data-cy', 'data-qa'];
  if (configured && !names.includes(configured)) names.push(configured);
  const name = names.find(candidate => normalized[candidate]?.trim());
  return name ? `${name}=${normalized[name]}` : '—';
};

const candidateTestId = (candidate: SmokeTestLocatorRecoveryCandidate): string => {
  const current = testId(candidate.newStableAttributes);
  return current === '—' ? testId(candidate.previousStableAttributes) : current;
};

const candidateLabel = (candidate: SmokeTestLocatorRecoveryCandidate): string =>
  candidate.ocrMappedName || candidate.savedClientName || candidate.savedCanonicalName || 'candidate';

const SmokeTestLocatorRecoveryModal: React.FC<Props> = ({
  instructionName,
  recovery,
  verificationEnabled,
  onVerificationChange,
  onScanPage,
  onTestCandidate,
  onDecision,
}) => {
  const [selectedId, setSelectedId] = useState(recovery.candidates[0]?.recoveryCandidateId ?? '');
  const [candidateActions, setCandidateActions] = useState<Record<string, SmokeTestLocatorRecoveryAction>>({});
  const [busy, setBusy] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  const [testPending, setTestPending] = useState<{ candidateId: string; action: 'CLICK' | 'INPUT' } | null>(null);
  const [testMessages, setTestMessages] = useState<Record<string, string>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const selected = useMemo(
    () => recovery.candidates.find(candidate => candidate.recoveryCandidateId === selectedId) ?? null,
    [recovery.candidates, selectedId],
  );
  const controlsBusy = busy || scannerBusy || testPending !== null;
  const failedTarget: SmokeTestLocatorRecoveryFailedTarget = recovery.failedTarget ?? {
    origin: 'BOT_JOB',
    savedCanonicalName: instructionName,
    savedClientName: '',
    ocrMappedName: '',
    previousXPath: '',
    previousCustomXPath: '',
    previousCss: '',
    previousStableAttributes: {},
    previousPageIdentity: 'Unavailable',
    currentPageIdentity: 'Unavailable',
    tag: '',
    type: '',
    role: '',
    expectedAction: 'CLICK',
    diagnosticCode: 'TARGET_NOT_FOUND',
  };

  useEffect(() => {
    if (recovery.candidates.some(candidate => candidate.recoveryCandidateId === selectedId)) return;
    setSelectedId(recovery.candidates[0]?.recoveryCandidateId ?? '');
  }, [recovery.candidates, selectedId]);

  useEffect(() => {
    dialogRef.current?.focus();
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ));
      if (controls.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', containFocus);
    return () => document.removeEventListener('keydown', containFocus);
  }, []);

  const decide = async (
    candidate: SmokeTestLocatorRecoveryCandidate | null,
    decision: SmokeTestLocatorRecoveryDecision | 'STOP',
  ) => {
    if (controlsBusy) return;
    setBusy(true);
    try {
      await onDecision(
        candidate,
        decision,
        candidate === null ? undefined : candidateActions[candidate.recoveryCandidateId]
          ?? candidate.expectedAction,
      );
    } finally {
      setBusy(false);
    }
  };

  const scanPage = async () => {
    if (controlsBusy) return;
    setScannerBusy(true);
    setScannerMessage('Scanning the paused runtime page and refreshing recovery candidates...');
    try {
      setScannerMessage(await onScanPage());
    } catch (failure) {
      setScannerMessage(failure instanceof Error
        ? failure.message
        : 'The paused runtime page could not be scanned.');
    } finally {
      setScannerBusy(false);
    }
  };

  const testCandidate = async (
    candidate: SmokeTestLocatorRecoveryCandidate,
    action: 'CLICK' | 'INPUT',
  ) => {
    if (controlsBusy) return;
    setTestPending({ candidateId: candidate.recoveryCandidateId, action });
    setTestMessages(current => ({
      ...current,
      [candidate.recoveryCandidateId]: `Testing ${action.toLocaleLowerCase()} on the paused page...`,
    }));
    try {
      const message = await onTestCandidate(candidate, action);
      setTestMessages(current => ({ ...current, [candidate.recoveryCandidateId]: message }));
    } catch (failure) {
      setTestMessages(current => ({
        ...current,
        [candidate.recoveryCandidateId]: failure instanceof Error
          ? failure.message
          : `Test ${action.toLocaleLowerCase()} failed.`,
      }));
    } finally {
      setTestPending(null);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-hidden={helpOpen || undefined}
        aria-labelledby="locator-recovery-title"
        tabIndex={-1}
      >
        <header>
          <div>
            <ShieldAlert size={22} aria-hidden="true" />
            <div>
              <small>Physical action paused · waiting for your decision</small>
              <h2 id="locator-recovery-title">Locator Recovery · {instructionName}</h2>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.verificationPower} ${verificationEnabled ? styles.verificationOn : styles.verificationOff}`}
              aria-pressed={verificationEnabled}
              aria-label={`${verificationEnabled ? 'Disable' : 'Enable'} locator recovery verification`}
              title="Turn off to bypass this recovery and future unresolved elements"
              disabled={controlsBusy}
              onClick={() => onVerificationChange(!verificationEnabled)}
            >
              <Power size={15} aria-hidden="true" />
            </button>
            <span>{recovery.candidates.length} candidate{recovery.candidates.length === 1 ? '' : 's'}</span>
          </div>
        </header>

        <section className={styles.summary}>
          No element was clicked, typed, or read. Compare the saved mapping with the live page,
          then explicitly choose how this one instruction continues.
          {scannerMessage && <small role="status">{scannerMessage}</small>}
        </section>

        <div className={styles.tableViewport}>
          <table>
            <thead>
              <tr>
                <th>Select</th><th>Test ID</th><th>Origin</th><th>Saved canonical</th><th>Saved client_named</th><th>OCR / mapped</th>
                <th>Action</th><th>Test Input</th><th>Test Click</th>
                <th>XPath match</th>
                <th>Previous XPath</th><th>Previous custom XPath</th><th>Previous CSS</th>
                <th>New XPath</th><th>New CSS</th><th>Stable attributes</th>
                <th>Previous page</th><th>Current page</th><th>Tag / type / role / action</th>
                <th>Confidence / reasons</th><th>Warnings</th>
                <th>Custom XPath match</th><th>CSS match</th>
                <th>Attributes match</th><th>Frame match</th><th>Shadow match</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.failedTargetRow} data-testid="locator-recovery-failed-target">
                <td><span className={styles.notAvailable}>—</span></td>
                <td title={testId(failedTarget.previousStableAttributes)}>{testId(failedTarget.previousStableAttributes)}</td>
                <td><span className={`${styles.originBadge} ${styles.botJobOrigin}`}>BOT JOB</span></td>
                <td>{failedTarget.savedCanonicalName || instructionName}</td>
                <td>{failedTarget.savedClientName || '—'}</td>
                <td>{failedTarget.ocrMappedName || '—'}</td>
                <td>{failedTarget.expectedAction}</td>
                <td><span className={styles.notAvailable}>—</span></td>
                <td><span className={styles.notAvailable}>—</span></td>
                <td><Match value={null} label="XPath" /></td>
                <td title={failedTarget.previousXPath}>{failedTarget.previousXPath || '—'}</td>
                <td title={failedTarget.previousCustomXPath}>{failedTarget.previousCustomXPath || '—'}</td>
                <td title={failedTarget.previousCss}>{failedTarget.previousCss || '—'}</td>
                <td>—</td><td>—</td>
                <td title={attributes(failedTarget.previousStableAttributes)}>
                  {attributes(failedTarget.previousStableAttributes)}
                </td>
                <td title={failedTarget.previousPageIdentity}>{failedTarget.previousPageIdentity}</td>
                <td title={failedTarget.currentPageIdentity}>{failedTarget.currentPageIdentity}</td>
                <td>{[
                  failedTarget.tag, failedTarget.type, failedTarget.role, failedTarget.expectedAction,
                ].filter(Boolean).join(' · ')}</td>
                <td><strong>Target not located</strong><small>Awaiting database or Page Scanner match</small></td>
                <td>{failedTarget.diagnosticCode}</td>
                <td><Match value={null} label="Custom XPath" /></td>
                <td><Match value={null} label="CSS" /></td>
                <td><Match value={null} label="Stable attributes" /></td>
                <td><Match value={null} label="Frame" /></td>
                <td><Match value={null} label="Shadow" /></td>
              </tr>
              {recovery.candidates.length === 0 && (
                <tr>
                  <td colSpan={26} className={styles.empty}>
                    No safe recovery candidates were found. The unresolved target remains above.
                    Run Page Scanner to refresh database/live-page comparisons, or bypass this instruction.
                  </td>
                </tr>
              )}
              {recovery.candidates.map(candidate => (
                <tr key={candidate.recoveryCandidateId} data-selected={candidate.recoveryCandidateId === selectedId}>
                  <td><input type="radio" name="locator-recovery" checked={candidate.recoveryCandidateId === selectedId} onChange={() => setSelectedId(candidate.recoveryCandidateId)} /></td>
                  <td title={candidateTestId(candidate)}>{candidateTestId(candidate)}</td>
                  <td>
                    <span className={`${styles.originBadge} ${candidate.origin === 'CURRENT' ? styles.currentOrigin : styles.previousOrigin}`}>
                      {candidate.origin}
                    </span>
                  </td>
                  <td>{candidate.savedCanonicalName || '—'}</td>
                  <td>{candidate.savedClientName || '—'}</td>
                  <td>{candidate.ocrMappedName || '—'}</td>
                  <td className={styles.actionCell}>
                    <WebElementTypeToggle
                      value={(candidateActions[candidate.recoveryCandidateId]
                        ?? candidate.expectedAction) as WebElementExecutionType}
                      disabled={controlsBusy}
                      onChange={(action) => setCandidateActions(current => ({
                        ...current,
                        [candidate.recoveryCandidateId]: action,
                      }))}
                    />
                    {testMessages[candidate.recoveryCandidateId] && (
                      <small title={testMessages[candidate.recoveryCandidateId]}>
                        {testMessages[candidate.recoveryCandidateId]}
                      </small>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.testButton} ${styles.inputButton}`}
                      disabled={controlsBusy}
                      title={`Test Input on ${candidateLabel(candidate)}`}
                      onClick={() => void testCandidate(candidate, 'INPUT')}
                    >
                      {testPending?.candidateId === candidate.recoveryCandidateId && testPending.action === 'INPUT'
                        ? <LoaderCircle className={styles.spin} size={15} aria-hidden="true" />
                        : <TextCursorInput size={15} aria-hidden="true" />}
                      <span><strong>Test</strong><small>Input</small></span>
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.testButton} ${styles.clickButton}`}
                      disabled={controlsBusy}
                      title={`Test Click on ${candidateLabel(candidate)}`}
                      onClick={() => void testCandidate(candidate, 'CLICK')}
                    >
                      {testPending?.candidateId === candidate.recoveryCandidateId && testPending.action === 'CLICK'
                        ? <LoaderCircle className={styles.spin} size={15} aria-hidden="true" />
                        : <MousePointerClick size={15} aria-hidden="true" />}
                      <span><strong>Test</strong><small>Click</small></span>
                    </button>
                  </td>
                  <td><Match value={candidate.matches.xpath} label="XPath" /></td>
                  <td title={candidate.previousXPath}>{candidate.previousXPath || '—'}</td>
                  <td title={candidate.previousCustomXPath}>{candidate.previousCustomXPath || '—'}</td>
                  <td title={candidate.previousCss}>{candidate.previousCss || '—'}</td>
                  <td title={candidate.newXPath}>{candidate.newXPath || '—'}</td>
                  <td title={candidate.newCss}>{candidate.newCss || '—'}</td>
                  <td title={`${attributes(candidate.previousStableAttributes)}\n→\n${attributes(candidate.newStableAttributes)}`}>
                    {attributes(candidate.newStableAttributes)}
                  </td>
                  <td title={candidate.previousPageIdentity}>{candidate.previousPageIdentity}</td>
                  <td title={candidate.currentPageIdentity}>{candidate.currentPageIdentity}</td>
                  <td>{[candidate.tag, candidate.type, candidate.role, candidate.expectedAction].filter(Boolean).join(' · ')}</td>
                  <td><strong>{Math.round(candidate.confidence * 100)}%</strong><small>{candidate.reasons.join(' · ') || 'No strong evidence'}</small></td>
                  <td>{candidate.ambiguityWarnings.join(' · ') || '—'}</td>
                  <td><Match value={candidate.matches.customXPath} label="Custom XPath" /></td>
                  <td><Match value={candidate.matches.css} label="CSS" /></td>
                  <td><Match value={candidate.matches.stableAttributes} label="Stable attributes" /></td>
                  <td><Match value={candidate.matches.frame} label="Frame" /></td>
                  <td><Match value={candidate.matches.shadow} label="Shadow" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer>
          <button type="button" className={styles.scanner} disabled={controlsBusy} onClick={() => void scanPage()}><ScanSearch size={15} /> {scannerBusy ? 'Scanning...' : 'Page Scanner'}</button>
          <button type="button" disabled={controlsBusy} onClick={() => void decide(null, 'CANCEL')}>Cancel Recovery</button>
          <button type="button" className={styles.stop} disabled={controlsBusy} onClick={() => void decide(null, 'STOP')}><Octagon size={15} /> Stop Execution</button>
          <button type="button" className={styles.bypass} disabled={controlsBusy} onClick={() => void decide(null, 'BYPASS')}><SkipForward size={15} /> Bypass &amp; Continue</button>
          <button type="button" className={styles.once} disabled={controlsBusy || selected === null} onClick={() => void decide(selected, 'USE_ONCE')}>Use Once</button>
          <button type="button" className={styles.save} disabled={controlsBusy || selected === null} onClick={() => void decide(selected, 'USE_AND_SAVE')}><Save size={15} /> Use and Save Locator</button>
          <button
            ref={helpButtonRef}
            type="button"
            className={styles.helpButton}
            aria-label="Open Locator Recovery rules"
            title="Open Locator Recovery rules"
            onClick={() => setHelpOpen(true)}
          ><CircleHelp size={19} aria-hidden="true" /></button>
        </footer>
        {helpOpen && (
          <SmokeTestLocatorRecoveryHelpModal onClose={() => {
            setHelpOpen(false);
            window.requestAnimationFrame(() => helpButtonRef.current?.focus());
          }} />
        )}
      </div>
    </div>
  );
};

export default SmokeTestLocatorRecoveryModal;
