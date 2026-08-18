import React, { useEffect, useId, useRef } from 'react';
import { CircleHelp, ShieldCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './SmokeTestLocatorRecoveryHelpModal.module.scss';

type Props = { onClose: () => void };

const groups = [
  {
    title: 'Rows and origins',
    rules: [
      ['BOT JOB', 'The first row is the authored Web Element instruction that could not be resolved. It is evidence only and cannot be selected or physically tested.'],
      ['PREVIOUS', 'A relevant owner/page-scoped scanned_element candidate saved before the in-modal Page Scanner run and validated for the paused browser.'],
      ['CURRENT', 'A fresh candidate produced by the Page Scanner running now and correlated with the frozen saved evidence. Previous rows remain available for comparison.'],
    ],
  },
  {
    title: 'Candidate inspection',
    rules: [
      ['ACTION', 'Choose CLICK, INPUT, or OUTPUT for the eventual recovery attempt. Changing the action does not execute or save anything.'],
      ['TEST INPUT', 'Uses the active run’s exact REAL/SYNTHETIC row or runtime variable and tries one input against the selected candidate. It never settles or saves recovery.'],
      ['TEST CLICK', 'Tries one click against the selected candidate on the exact paused V1/V2 browser. It never settles or saves recovery.'],
      ['MATCH COLUMNS', 'Green means equal, red X means different, and gray dash means unavailable. Confidence and warnings are evidence, never permission to guess.'],
    ],
  },
  {
    title: 'Scanner and decisions',
    rules: [
      ['PAGE SCANNER', 'Runs the established settle, DOM scan, OCR naming, scanned_element persistence, diagnostics, fingerprint, screenshot, and snapshot pipeline against the paused browser.'],
      ['USE ONCE', 'Executes the selected candidate once for this instruction and does not save the locator for a later run.'],
      ['USE AND SAVE LOCATOR', 'Executes once and saves the approved locator only after the physical action succeeds against the exact owner/page registry row.'],
      ['BYPASS & CONTINUE', 'Skips this physical instruction and continues the Integration program without changing a locator.'],
      ['CANCEL / STOP', 'Cancel retires this recovery decision. Stop terminates the exact execution while preserving the browser under the established STOP policy.'],
      ['POWER', 'Green enables recovery verification. Turning it red bypasses the current unresolved instruction and future unresolved instructions in this run.'],
    ],
  },
] as const;

const SmokeTestLocatorRecoveryHelpModal: React.FC<Props> = ({ onClose }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return createPortal(
    <div className={styles.backdrop} onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) || []);
          if (!controls.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <header>
          <span className={styles.icon}><CircleHelp size={21} aria-hidden="true" /></span>
          <div><small>Paused physical action</small><h2 id={titleId}>Locator Recovery rules</h2></div>
          <button ref={closeRef} type="button" aria-label="Close Locator Recovery rules" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>
          <p>Use this evidence to identify one unique, visible and action-compatible element. Nothing is changed automatically.</p>
          {groups.map((group, groupIndex) => (
            <section className={styles.group} key={group.title}>
              <h3>{group.title}</h3>
              <div className={styles.grid}>
                {group.rules.map(([label, description], index) => (
                  <article key={label} data-tone={(groupIndex + index) % 3}>
                    <strong>{label}</strong><span>{description}</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <aside><ShieldCheck size={19} aria-hidden="true" /><span><strong>Fail-closed recovery</strong> The active Bot Job, run, instruction, page identity, candidate ID and browser authority are revalidated before every test or decision. Ambiguous or stale evidence performs no physical action.</span></aside>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default SmokeTestLocatorRecoveryHelpModal;
