import React, { useEffect, useState } from 'react';
import ScannerExecutionPanel from './ScannerExecutionPanel';
import type { ScannerAction, ScannerActionPayload, ScannerState } from './Scanner.types';
import styles from './ScannerWorkspaceHeader.module.scss';

interface ScannerToolbarProps {
  connected: boolean;
  loading?: boolean;
  pendingAction?: ScannerAction | null;
  scannerState?: ScannerState | null;
  onAction?: (action: ScannerAction, payload?: ScannerActionPayload) => void;
  onOpenOcrConfig?: () => void;
}

const ScannerToolbar: React.FC<ScannerToolbarProps> = ({
  connected,
  loading = false,
  pendingAction = null,
  scannerState,
  onAction,
  onOpenOcrConfig,
}) => {
  const busy = loading || pendingAction !== null;
  const initialSearchTerms = scannerState?.focus.searchTerms.join(', ') || '';
  const [searchTerms, setSearchTerms] = useState(initialSearchTerms);

  useEffect(() => {
    setSearchTerms(initialSearchTerms);
  }, [initialSearchTerms]);

  const searchDisabled = !connected || busy || !scannerState?.capabilities.canUsePageScanner;
  const tabDisabled = !connected || busy || !scannerState?.capabilities.canRefreshState;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAction?.('PAGE_SCANNER', { searchTerms: searchTerms.trim() });
  };

  return (
    <form className={styles.searchRow} onSubmit={submitSearch}>
      <input
        className={styles.searchInput}
        value={searchTerms}
        onChange={(event) => setSearchTerms(event.target.value)}
        disabled={searchDisabled}
        placeholder="input, textarea, button, a, select, label"
        aria-label="Scanner search terms"
      />
      <button
        type="submit"
        className={styles.searchButton}
        disabled={searchDisabled}
        title="Scan using these search terms"
      >
        Search
      </button>
      <button
        type="button"
        className={styles.tabButton}
        disabled={tabDisabled}
        title="Previous browser tab"
        onClick={() => onAction?.('PREVIOUS_TAB')}
      >
        Previous
      </button>
      <button
        type="button"
        className={styles.tabButton}
        disabled={tabDisabled}
        title="Next browser tab"
        onClick={() => onAction?.('NEXT_TAB')}
      >
        Next
      </button>
      <button
        type="button"
        className={styles.ocrButton}
        disabled={!connected || busy || !scannerState?.capabilities.canUseOcr}
        title="OCR Configuration"
        onClick={onOpenOcrConfig}
      >
        OCR Config
      </button>
      <ScannerExecutionPanel
        connected={connected}
        loading={loading}
        pendingAction={pendingAction}
        scannerState={scannerState}
        onAction={onAction}
      />
    </form>
  );
};

export default ScannerToolbar;
