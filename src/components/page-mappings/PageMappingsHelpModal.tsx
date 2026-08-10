import React, { useEffect, useId, useRef } from 'react';
import { Map, ShieldCheck, X } from 'lucide-react';
import styles from './PageMappingsHelpModal.module.scss';

type Props = { onClose: () => void };

const ruleGroups = [
  {
    title: 'Ownership and history',
    rules: [
      ['BOT JOB SCOPE', 'History belongs only to the active Home Banking and Bot Job. Changing Bot Jobs retires the previous owner state and reloads the new history.'],
      ['CAPTURES', 'History is newest first. Selecting a READY row loads that immutable screenshot, metadata, geometry, and element list without editing the capture.'],
      ['PAGES (X)', 'Shows every open AR Web page or window and lets you focus or close it. It is unrelated to capture count, pinning, and retention.'],
    ],
  },
  {
    title: 'Live page actions',
    rules: [
      ['CHECK PAGE', 'Compares the current shared browser page with the latest matching reusable capture. It does not scan, save, or create history.'],
      ['USE EXISTING', 'Available only when the live page fingerprint is CURRENT. It loads the newest matching verified capture and creates no new capture.'],
      ['RESCAN', 'Runs the normal Page Scanner pipeline for the active Bot Job against the current shared Playwright page and requires a new READY immutable capture.'],
      ['SCROLL PAGE', 'Red keeps normal capture behavior. Green performs a bounded page scroll before Rescan and requests one full-page screenshot; unsafe or unbounded pages fail instead of claiming a complete capture.'],
    ],
  },
  {
    title: 'Explorer, search, and Memory List',
    rules: [
      ['IMAGE VIEW', 'The selected capture contains one screenshot. Use the image scrollbar to inspect its stored width; scrolling cannot reveal pixels that were not captured.'],
      ['SEARCH', 'Filters only the selected capture, case-insensitively, across names, text, XPath, CSS, and other captured fields. Results are limited to 200; X clears only the search.'],
      ['ELEMENT SELECTION', 'Clicking an image box or element row selects the same captured element. Selection does not change the immutable capture.'],
      ['MEMORY LIST', 'Add or drag stages an authoritative capture reference for the active Bot Job and opens or synchronizes Memory List. Duplicate and stale rows are rejected; staging is not a durable mapping write.'],
    ],
  },
  {
    title: 'OCR Review and safe recovery',
    rules: [
      ['OCR REVIEW', 'Reads the selected immutable screenshot, proposes client names, and changes nothing until Apply names is used. Apply is correlation and revision checked.'],
      ['RELOAD', 'Reload refreshes authoritative owner history, policy, and live-page state. After a timeout, disconnect, stale response, or unknown mutation outcome, editing stays blocked until recovery completes.'],
    ],
  },
  {
    title: 'Pinning and retention',
    rules: [
      ['PIN', 'Protects that READY capture from retention deletion. Unpinning makes it eligible again when an age or count limit applies.'],
      ['RETENTION LIMITS', 'Retain days 0 disables the age limit. Max unpinned / page 0 disables the count limit. With 30 / 0, unpinned captures older than 30 days are eligible.'],
      ['ALWAYS RETAINED', 'Pinned captures are never eligible. The newest unpinned capture for each page is also retained even when it is older than the configured limit.'],
      ['SAVE POLICY', 'Saving updates the system-wide policy and eligible count; it does not delete immediately. Automatic cleanup is evaluated after successful scans.'],
      ['PURGE ELIGIBLE', 'After confirmation, deletes up to 100 oldest eligible captures for this Bot Job, including database rows and artifact files. It also removes staged Memory List selections tied to them, but not the Bot Job, instructions, mutable mappings, or unrelated captures.'],
    ],
  },
] as const;

const PageMappingsHelpModal: React.FC<Props> = ({ onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={event => { if (event.key === 'Escape') onClose(); }}
      >
        <header>
          <span className={styles.icon}><Map size={20} aria-hidden="true" /></span>
          <div>
            <small>Immutable capture workspace</small>
            <h2 id={titleId}>Page Mappings rules</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close Page Mappings rules"
            onClick={onClose}
          ><X size={18} aria-hidden="true" /></button>
        </header>
        <div className={styles.body}>
          <p>Use these rules to understand what reads the live page, what creates history, and what can delete stored captures.</p>
          {ruleGroups.map((group, groupIndex) => (
            <section className={styles.group} key={group.title}>
              <h3>{group.title}</h3>
              <div className={styles.grid}>
                {group.rules.map(([label, description], index) => (
                  <article key={label} data-tone={(groupIndex + index) % 3}>
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <aside>
            <ShieldCheck size={19} aria-hidden="true" />
            <span><strong>Fail-closed ownership</strong> Page Mappings mutations are bound to the active Bot Job, workspace generation, and exact window transport. When authority is stale or an outcome is unknown, Reload is required.</span>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default PageMappingsHelpModal;
