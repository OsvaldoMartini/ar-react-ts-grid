import React, { useEffect, useMemo, useState } from 'react';
import styles from './PageMappingsRetentionPanel.module.scss';

export type PageMappingsRetentionState = {
  retentionDays: number;
  maxUnpinnedPerPage: number;
  enabled: boolean;
  readyCount: number;
  pinnedCount: number;
  eligibleCount: number;
};

type Props = {
  retention: PageMappingsRetentionState | null;
  storageReady: boolean | null;
  authoritativeRevision: string;
  reloadRequired: boolean;
  busy: boolean;
  pendingOperation: 'pin' | 'save' | 'purge' | null;
  disabled?: boolean;
  onSave: (retentionDays: number, maxUnpinnedPerPage: number) => void;
  onPurge: () => void;
};

const boundedInteger = (value: string, maximum: number): number | null => {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maximum ? parsed : null;
};

const PageMappingsRetentionPanel: React.FC<Props> = ({
  retention,
  storageReady,
  authoritativeRevision,
  reloadRequired,
  busy,
  pendingOperation,
  disabled = false,
  onSave,
  onPurge,
}) => {
  const [days, setDays] = useState('0');
  const [maximum, setMaximum] = useState('0');

  useEffect(() => {
    if (!retention) return;
    setDays(String(retention.retentionDays));
    setMaximum(String(retention.maxUnpinnedPerPage));
  }, [authoritativeRevision, retention]);

  const parsedDays = useMemo(() => boundedInteger(days, 3650), [days]);
  const parsedMaximum = useMemo(() => boundedInteger(maximum, 1000), [maximum]);
  const valid = parsedDays !== null && parsedMaximum !== null;
  const changed = Boolean(valid && retention
    && (parsedDays !== retention.retentionDays
      || parsedMaximum !== retention.maxUnpinnedPerPage));
  const unavailable = disabled || busy || storageReady !== true || !retention;

  if (reloadRequired) {
    return (
      <section
        className={`${styles.panel} ${styles.unavailable}`}
        aria-label="Snapshot retention"
        role="alert"
      >
        <strong>Snapshot retention reload required</strong>
        <p>The previous action has an unknown or stale outcome. Use Reload before pinning, saving, or purging again.</p>
      </section>
    );
  }

  if (storageReady === null) {
    return (
      <section className={styles.panel} aria-label="Snapshot retention">
        <strong>Checking snapshot storage...</strong>
      </section>
    );
  }

  if (!storageReady) {
    return (
      <section className={`${styles.panel} ${styles.unavailable}`} aria-label="Snapshot retention">
        <strong>Snapshot storage unavailable</strong>
        <p>Page Mappings history storage is not initialized. The legacy Page Scanner remains available.</p>
      </section>
    );
  }

  if (!retention) {
    return (
      <section className={`${styles.panel} ${styles.unavailable}`} aria-label="Snapshot retention">
        <strong>Snapshot retention unavailable</strong>
        <p>Reload Page Mappings before changing or purging captures.</p>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Snapshot retention">
      <header>
        <div>
          <p>SYSTEM-WIDE SNAPSHOT RETENTION</p>
          <strong>{retention.enabled ? 'System-wide after-scan cleanup enabled' : 'System-wide after-scan cleanup disabled'}</strong>
        </div>
        <span>{retention.eligibleCount} eligible for this Bot Job</span>
      </header>

      <div className={styles.counts}>
        <span><b>{retention.readyCount}</b> ready</span>
        <span><b>{retention.pinnedCount}</b> pinned</span>
      </div>

      <div className={styles.fields}>
        <label>
          Retain days
          <input
            type="number"
            min={0}
            max={3650}
            step={1}
            inputMode="numeric"
            value={days}
            disabled={unavailable}
            aria-invalid={parsedDays === null}
            onChange={event => setDays(event.target.value)}
          />
        </label>
        <label>
          Max unpinned / page
          <input
            type="number"
            min={0}
            max={1000}
            step={1}
            inputMode="numeric"
            value={maximum}
            disabled={unavailable}
            aria-invalid={parsedMaximum === null}
            onChange={event => setMaximum(event.target.value)}
          />
        </label>
      </div>

      {!valid && <p className={styles.validation}>Use whole numbers: days 0–3650 and captures 0–1000.</p>}
      <p className={styles.hint}>The policy applies system-wide. Counts and Purge Eligible apply only to this Bot Job. Cleanup is evaluated after successful scans or by Purge Eligible. Zero disables a limit; pinned captures are never eligible.</p>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => {
            if (parsedDays !== null && parsedMaximum !== null) onSave(parsedDays, parsedMaximum);
          }}
          disabled={unavailable || !valid || !changed}
        >{pendingOperation === 'save' ? 'Saving...' : 'Save'}</button>
        <button
          type="button"
          className={styles.purge}
          onClick={onPurge}
          disabled={unavailable || !retention.eligibleCount}
        >{pendingOperation === 'purge' ? 'Purging...' : 'Purge Eligible'}</button>
      </div>
    </section>
  );
};

export default PageMappingsRetentionPanel;
