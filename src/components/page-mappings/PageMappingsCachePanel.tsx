import React, { useEffect, useId, useState } from 'react';
import styles from './PageMappingsCachePanel.module.scss';

export const PAGE_MAPPINGS_DEFAULT_SCROLL_PAGES = 5;
export const PAGE_MAPPINGS_MIN_SCROLL_PAGES = 1;
export const PAGE_MAPPINGS_MAX_SCROLL_PAGES = 40;

export type PageMappingsCacheState = {
  state: 'LOADING' | 'CURRENT' | 'CHANGED' | 'PAGE_CHANGED' | 'STALE'
    | 'NO_CAPTURE' | 'HISTORICAL_ONLY' | 'MIGRATION_REQUIRED' | 'UNSUPPORTED'
    | 'UNAVAILABLE' | string;
  message: string;
  browserAvailable: boolean;
  livePageKey: string;
  livePageUrl: string;
  liveNodeCount: number;
  reusableScanId: string;
  comparedScanId: string;
};

type Props = {
  cache: PageMappingsCacheState;
  busy: boolean;
  disabled?: boolean;
  actionsDisabled?: boolean;
  scrollPage: boolean;
  scrollPages: number;
  onRefresh: () => void;
  onUseExisting: (scanId: string) => void;
  onRescan: () => void;
  onScrollPageChange: (enabled: boolean) => void;
  onScrollPagesCommit: (scrollPages: number) => void;
  onScrollPagesEditingChange: (editing: boolean) => void;
};

const PageMappingsCachePanel: React.FC<Props> = ({
  cache,
  busy,
  disabled = false,
  actionsDisabled = false,
  scrollPage,
  scrollPages,
  onRefresh,
  onUseExisting,
  onRescan,
  onScrollPageChange,
  onScrollPagesCommit,
  onScrollPagesEditingChange,
}) => {
  const inputId = useId();
  const hintId = useId();
  const [scrollPagesDraft, setScrollPagesDraft] = useState(String(scrollPages));
  const current = cache.state === 'CURRENT';
  const changed = cache.state === 'CHANGED' || cache.state === 'PAGE_CHANGED' || cache.state === 'STALE';
  const tone = current ? styles.current : changed ? styles.changed : styles.neutral;
  const preferenceEditing = scrollPagesDraft !== String(scrollPages);

  useEffect(() => {
    setScrollPagesDraft(String(scrollPages));
  }, [scrollPages]);

  useEffect(() => {
    onScrollPagesEditingChange(preferenceEditing);
  }, [onScrollPagesEditingChange, preferenceEditing]);

  const normalizeDraft = (): number | null => {
    const trimmed = scrollPagesDraft.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed)) return null;
    return Math.min(
      PAGE_MAPPINGS_MAX_SCROLL_PAGES,
      Math.max(PAGE_MAPPINGS_MIN_SCROLL_PAGES, parsed),
    );
  };

  const commitDraft = () => {
    const next = normalizeDraft();
    if (next === null) {
      setScrollPagesDraft(String(scrollPages));
      return;
    }
    setScrollPagesDraft(String(next));
    if (next !== scrollPages) onScrollPagesCommit(next);
  };

  const stepDraft = (change: number) => {
    const parsedDraft = normalizeDraft();
    const base = parsedDraft === null ? scrollPages : parsedDraft;
    const next = Math.min(
      PAGE_MAPPINGS_MAX_SCROLL_PAGES,
      Math.max(PAGE_MAPPINGS_MIN_SCROLL_PAGES, base + change),
    );
    setScrollPagesDraft(String(next));
    if (next !== scrollPages) onScrollPagesCommit(next);
  };

  const preferenceDisabled = disabled || busy;
  const cacheActionsDisabled = preferenceDisabled || actionsDisabled || preferenceEditing;

  return (
    <section className={`${styles.panel} ${tone}`} aria-label="Live mapping cache status">
      <div className={styles.summary} aria-live="polite">
        <div>
          <p>LIVE PAGE COMPARISON</p>
          <strong>{cache.state.replaceAll('_', ' ')}</strong>
        </div>
        <span>{busy ? 'Working...' : cache.browserAvailable ? 'Browser connected' : 'Historical mode'}</span>
      </div>
      <p className={styles.message}>{cache.message}</p>
      {(cache.livePageUrl || cache.livePageKey) && (
        <dl className={styles.details}>
          {cache.livePageUrl && <div><dt>Live page</dt><dd>{cache.livePageUrl}</dd></div>}
          {cache.livePageKey && <div><dt>Page key</dt><dd>{cache.livePageKey}</dd></div>}
          {cache.liveNodeCount > 0 && <div><dt>DOM nodes</dt><dd>{cache.liveNodeCount}</dd></div>}
        </dl>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.scrollToggle} ${scrollPage ? styles.scrollOn : styles.scrollOff}`}
          aria-pressed={scrollPage}
          title={scrollPage
            ? 'Automatic bounded page scrolling and full-page capture enabled for Rescan'
            : 'Automatic page scrolling disabled'}
          onClick={() => onScrollPageChange(!scrollPage)}
          disabled={cacheActionsDisabled}
        ><span>SCROLL PAGE</span><strong>{scrollPage ? 'ON' : 'OFF'}</strong></button>
        <div
          className={styles.scrollPreference}
          title="Maximum downward viewport movements for SCROLL PAGE Rescan; saved for this Bot Job"
        >
          <label htmlFor={inputId}>
            <span>SCROLL PAGES</span>
            <small>Per Bot Job</small>
          </label>
          <div className={styles.stepper}>
            <button
              type="button"
              aria-label="Decrease Scroll Pages"
              onMouseDown={event => event.preventDefault()}
              onClick={() => stepDraft(-1)}
              disabled={preferenceDisabled || scrollPages <= PAGE_MAPPINGS_MIN_SCROLL_PAGES}
            >&#8722;</button>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={PAGE_MAPPINGS_MIN_SCROLL_PAGES}
              max={PAGE_MAPPINGS_MAX_SCROLL_PAGES}
              step={1}
              value={scrollPagesDraft}
              aria-describedby={hintId}
              aria-label="Maximum automatic scroll movements"
              disabled={preferenceDisabled}
              onChange={event => setScrollPagesDraft(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={event => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  setScrollPagesDraft(String(scrollPages));
                  event.preventDefault();
                }
              }}
            />
            <button
              type="button"
              aria-label="Increase Scroll Pages"
              onMouseDown={event => event.preventDefault()}
              onClick={() => stepDraft(1)}
              disabled={preferenceDisabled || scrollPages >= PAGE_MAPPINGS_MAX_SCROLL_PAGES}
            >+</button>
          </div>
          <span id={hintId} className={styles.preferenceHint}>1-40 viewport moves</span>
        </div>
        <button type="button" onClick={onRefresh} disabled={cacheActionsDisabled}>Check page</button>
        <button
          type="button"
          className={styles.useExisting}
          onClick={() => onUseExisting(cache.reusableScanId)}
          disabled={cacheActionsDisabled || !cache.reusableScanId}
        >Use existing</button>
        <button
          type="button"
          className={styles.rescan}
          onClick={onRescan}
          disabled={cacheActionsDisabled || cache.state === 'MIGRATION_REQUIRED'}
        >Rescan</button>
      </div>
    </section>
  );
};

export default PageMappingsCachePanel;
