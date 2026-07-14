import React, { useEffect, useState } from 'react';
import WorkspaceHeader, { type WorkspaceHeaderAction } from '../workspace/WorkspaceHeader';
import type { ScannerAction, ScannerActionPayload, ScannerState, ScannerStatusTone } from './Scanner.types';
import styles from './ScannerWorkspaceHeader.module.scss';

interface ScannerWorkspaceHeaderProps {
  botJobName: string | null;
  connected: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  scannerState?: ScannerState | null;
  loading?: boolean;
  pendingAction?: ScannerAction | null;
  status?: string;
  statusTone?: ScannerStatusTone;
  onAction?: (action: ScannerAction, payload?: ScannerActionPayload) => void;
}

const ScannerWorkspaceHeader: React.FC<ScannerWorkspaceHeaderProps> = ({
  botJobName,
  connected,
  reconnectAttempts = 0,
  error,
  scannerState,
  loading = false,
  pendingAction = null,
  status,
  statusTone = 'neutral',
  onAction,
}) => {
  const busy = loading || pendingAction !== null;
  const initialSearchTerms = scannerState?.focus.searchTerms.join(', ') || '';
  const [searchTerms, setSearchTerms] = useState(initialSearchTerms);

  useEffect(() => {
    setSearchTerms(initialSearchTerms);
  }, [initialSearchTerms]);

  const actions: WorkspaceHeaderAction<ScannerAction>[] = [
    {
      id: 'PAGE_SCANNER',
      label: 'Page Scanner',
      title: 'Scan the active browser page',
      disabled: !connected || busy || !scannerState?.capabilities.canUsePageScanner,
    },
    {
      id: 'REFRESH_STATE',
      label: 'Refresh',
      title: 'Refresh scanner state',
      disabled: !connected || busy || !scannerState?.capabilities.canRefreshState,
    },
    {
      id: 'CLEAR_GRID',
      label: 'Clear Grid',
      title: 'Clear the scanner result grid',
      tone: 'warning',
      disabled: !connected || busy || !scannerState?.capabilities.canRefreshState,
    },
    {
      id: 'REFRESH_PAGE',
      label: 'Refresh Web Page',
      title: 'Refresh the scanner browser page',
      disabled: !connected || busy || !scannerState?.capabilities.canRefreshState,
    },
  ];
  const subtitle = scannerState
    ? `${scannerState.botJobName} · ${scannerState.blocks.length} blocks · ${scannerState.browser.state}`
    : botJobName || 'No Bot Job selected';
  const resolvedStatus = error
    || status
    || (connected ? 'Scanner workspace ready' : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`);
  const resolvedTone = error ? 'error' : connected ? statusTone : 'warning';
  const searchDisabled = !connected || busy || !scannerState?.capabilities.canUsePageScanner;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAction?.('PAGE_SCANNER', { searchTerms: searchTerms.trim() });
  };

  return (
    <div className={styles.wrapper}>
      <WorkspaceHeader
        eyebrow="Scanner"
        title="AR Web Factory"
        subtitle={subtitle}
        connected={connected}
        status={resolvedStatus}
        statusTone={resolvedTone}
        actions={actions}
        onAction={onAction}
        compact
      />
      {scannerState?.environmentUrl && (
        <div className={styles.urlLine} title={scannerState.environmentUrl}>
          {scannerState.environmentUrl}
        </div>
      )}
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
      </form>
    </div>
  );
};

export default ScannerWorkspaceHeader;
