import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Minus, Octagon, Save, ShieldAlert, SkipForward, X } from 'lucide-react';
import type {
  LocatorMatchValue,
  SmokeTestLocatorRecovery,
  SmokeTestLocatorRecoveryCandidate,
  SmokeTestLocatorRecoveryDecision,
} from './smokeTestIntegration.contract';
import styles from './SmokeTestLocatorRecoveryModal.module.scss';

type Props = {
  instructionName: string;
  recovery: SmokeTestLocatorRecovery;
  onDecision: (
    candidate: SmokeTestLocatorRecoveryCandidate | null,
    decision: SmokeTestLocatorRecoveryDecision | 'STOP',
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

const SmokeTestLocatorRecoveryModal: React.FC<Props> = ({ instructionName, recovery, onDecision }) => {
  const [selectedId, setSelectedId] = useState(recovery.candidates[0]?.recoveryCandidateId ?? '');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => recovery.candidates.find(candidate => candidate.recoveryCandidateId === selectedId) ?? null,
    [recovery.candidates, selectedId],
  );

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
    if (busy) return;
    setBusy(true);
    try {
      await onDecision(candidate, decision);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
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
          <span>{recovery.candidates.length} candidate{recovery.candidates.length === 1 ? '' : 's'}</span>
        </header>

        <section className={styles.summary}>
          No element was clicked, typed, or read. Compare the saved mapping with the live page,
          then explicitly choose how this one instruction continues.
        </section>

        <div className={styles.tableViewport}>
          <table>
            <thead>
              <tr>
                <th>Select</th><th>Saved canonical</th><th>Saved client_named</th><th>OCR / mapped</th>
                <th>Previous XPath</th><th>Previous custom XPath</th><th>Previous CSS</th>
                <th>New XPath</th><th>New CSS</th><th>Stable attributes</th>
                <th>Previous page</th><th>Current page</th><th>Tag / type / role / action</th>
                <th>Confidence / reasons</th><th>Warnings</th>
                <th>XPath match</th><th>Custom XPath match</th><th>CSS match</th>
                <th>Attributes match</th><th>Frame match</th><th>Shadow match</th>
              </tr>
            </thead>
            <tbody>
              {recovery.candidates.length === 0 && (
                <tr>
                  <td colSpan={21} className={styles.empty}>
                    No safe recovery candidates were found on the current page. Bypass can skip
                    this instruction and continue the evaluation without performing an action.
                  </td>
                </tr>
              )}
              {recovery.candidates.map(candidate => (
                <tr key={candidate.recoveryCandidateId} data-selected={candidate.recoveryCandidateId === selectedId}>
                  <td><input type="radio" name="locator-recovery" checked={candidate.recoveryCandidateId === selectedId} onChange={() => setSelectedId(candidate.recoveryCandidateId)} /></td>
                  <td>{candidate.savedCanonicalName || '—'}</td>
                  <td>{candidate.savedClientName || '—'}</td>
                  <td>{candidate.ocrMappedName || '—'}</td>
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
                  <td><Match value={candidate.matches.xpath} label="XPath" /></td>
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
          <button type="button" disabled={busy} onClick={() => void decide(null, 'CANCEL')}>Cancel Recovery</button>
          <button type="button" className={styles.stop} disabled={busy} onClick={() => void decide(null, 'STOP')}><Octagon size={15} /> Stop Execution</button>
          <button type="button" className={styles.bypass} disabled={busy} onClick={() => void decide(null, 'BYPASS')}><SkipForward size={15} /> Bypass &amp; Continue</button>
          <button type="button" className={styles.once} disabled={busy || selected === null} onClick={() => void decide(selected, 'USE_ONCE')}>Use Once</button>
          <button type="button" className={styles.save} disabled={busy || selected === null} onClick={() => void decide(selected, 'USE_AND_SAVE')}><Save size={15} /> Use and Save Locator</button>
        </footer>
      </div>
    </div>
  );
};

export default SmokeTestLocatorRecoveryModal;
