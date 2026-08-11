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
      ['SCROLL PAGE', 'Red keeps normal capture behavior. Green moves downward by up to the saved SCROLL PAGES value, stopping early when the document bottom is stable. Each movement waits for visible rendering before Rescan captures the full current document.'],
      ['SCROLL PAGES', 'A browser preference saved separately for each Home Banking and Bot Job, from 1 to 40 with default 5. N means at most N downward viewport movements, not N different websites. Virtualized lists, nested scroll areas, canvas/video, CSS backgrounds, and unbounded content remain outside the top-document guarantee.'],
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
      ['OCR REVIEW', 'Runs OCR against the selected immutable screenshot, not the live browser page. Review is read-only: it compares OCR text with the captured DOM text and current client name, then proposes editable names without changing the database.'],
      ['QUALITY', 'EXACT CONTAIN, OVERLAP, PROXIMITY, and NONE describe how confidently a captured element matches nearby OCR words. Inspect the highlighted word boxes, DOM text, and proposed name before selecting a change.'],
      ['SAFE TEST', 'After Run OCR Review, choose Clear selected, enter a distinctive proposed name on one strong row, and use Apply names (1). Editing a valid proposal automatically selects its Use checkbox; always review the selected and changes counts first.'],
      ['APPLY NAMES', 'Saves the selected client names as one all-or-nothing, owner-scoped change for the exact Bot Job, page, capture, element revision, and current alias. A stale or conflicting row makes the whole Apply fail safely.'],
      ['WHAT APPLY CHANGES', 'Only the mutable scanned-element client name changes. The immutable canonical name, locators, screenshot, capture history, and existing Bot Job instructions do not change, and Apply creates no new capture or Rescan.'],
      ['MEMORY LIST', 'After a successful Apply, the loaded capture and any matching staged Memory List label are refreshed. Adding or dragging the element later carries the saved client name, but creating or changing Bot Job instructions still requires the separate Memory List Apply action.'],
      ['RESTORE A NAME', 'When a client name exists, use the small restore icon beside Proposed name. It immediately clears client_named through the same exact Apply transaction, returns display to the canonical captured name, and requires no Rescan.'],
      ['LIMITS', 'One Apply accepts at most 1,000 visible changes and each client name is limited to 255 characters. The screenshot may show up to 2,000 OCR word boxes.'],
      ['UNKNOWN OUTCOME', 'If Apply times out, disconnects, or reports a stale, malformed, or unknown result, do not submit another Apply. Reload Page Mappings and the verified capture first; reconnect recovery reconfirms the exact original request.'],
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

  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

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
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          closeRef.current?.focus();
        }}
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
