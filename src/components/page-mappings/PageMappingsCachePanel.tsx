import React from 'react';
import styles from './PageMappingsCachePanel.module.scss';

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
  onRefresh: () => void;
  onUseExisting: (scanId: string) => void;
  onRescan: () => void;
};

const PageMappingsCachePanel: React.FC<Props> = ({
  cache,
  busy,
  disabled = false,
  onRefresh,
  onUseExisting,
  onRescan,
}) => {
  const current = cache.state === 'CURRENT';
  const changed = cache.state === 'CHANGED' || cache.state === 'PAGE_CHANGED' || cache.state === 'STALE';
  const tone = current ? styles.current : changed ? styles.changed : styles.neutral;
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
        <button type="button" onClick={onRefresh} disabled={disabled || busy}>Check page</button>
        <button
          type="button"
          className={styles.useExisting}
          onClick={() => onUseExisting(cache.reusableScanId)}
          disabled={disabled || busy || !cache.reusableScanId}
        >Use existing</button>
        <button
          type="button"
          className={styles.rescan}
          onClick={onRescan}
          disabled={disabled || busy || cache.state === 'MIGRATION_REQUIRED'}
        >Rescan</button>
      </div>
    </section>
  );
};

export default PageMappingsCachePanel;
