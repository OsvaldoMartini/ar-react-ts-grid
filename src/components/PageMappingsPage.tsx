import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './PageMappingsPage.module.scss';

export const PAGE_MAPPINGS_SESSION_ID = 'pageMappingsManager';

type Snapshot = {
  scanId: string;
  homeUrlId?: number;
  pageKey: string;
  pageUrl: string;
  capturedAt: string;
  elementCount: number;
  artifactPath: string;
  manifestSha256: string;
  status: 'READY' | 'FAILED' | string;
  pinned: boolean;
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void };

const PageMappingsPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => { document.title = 'Page Mappings'; }, []);
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting to Page Mappings…');
  const cursor = useRef(0);
  const sourceBotJobId = useMemo(() => {
    const value = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }, []);
  const homeBankingId = useMemo(() => {
    const value = Number(new URLSearchParams(window.location.search).get('homeBankingId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }, []);

  const bootstrap = useCallback(() => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Page Mappings is disconnected.');
      return;
    }
    setStatus('Loading scan history…');
    webSocket.send(JSON.stringify({
      type: 'pageMappings.bootstrap',
      sessionId,
      body: JSON.stringify({
        requestId: `page-mappings-${Date.now()}`,
        botJobId: sourceBotJobId,
        homeBankingId,
      }),
    }));
  }, [homeBankingId, sessionId, sourceBotJobId, webSocket]);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    for (const raw of messages.slice(cursor.current)) {
      cursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        const operation = envelope.operationId || envelope.type;
        if (operation !== 'pageMappings.bootstrapResponse') continue;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body || {};
        if (!body.ok) {
          setStatus(body.message || 'Page Mappings history is unavailable.');
          continue;
        }
        const next = Array.isArray(body.snapshots) ? body.snapshots as Snapshot[] : [];
        setSnapshots(next);
        setSelectedScanId(current => current && next.some(item => item.scanId === current) ? current : next[0]?.scanId ?? null);
        setStatus(next.length ? `${next.length} scan capture${next.length === 1 ? '' : 's'} available.` : 'No scan captures yet.');
      } catch {
        setStatus('Page Mappings received an invalid response.');
      }
    }
  }, [messages]);

  const selected = snapshots.find(item => item.scanId === selectedScanId) || null;
  return (
    <DetachedPageShell title="Page Mappings" testId="page-mappings-workspace" onClose={onClose}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PAGE SCAN HISTORY</p>
            <h1>Page Mappings</h1>
            <p className={styles.subtitle}>Owner-scoped captures for Bot Job {sourceBotJobId || '—'}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={bootstrap} disabled={!connected}>Reload</button>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={styles.close} onClick={onClose}>Close</button>
          </div>
        </header>
        <div className={styles.status} role="status">{status}</div>
        <section className={styles.workspace} aria-label="Page Mappings explorer">
          <aside className={styles.history}>
            <div className={styles.sectionHeading}><h2>Captures</h2><span>{snapshots.length}</span></div>
            {snapshots.length === 0 ? <p className={styles.empty}>Run Page Scanner to create the first immutable capture.</p> : (
              <div className={styles.captureList}>
                {snapshots.map(item => (
                  <button type="button" key={item.scanId}
                    className={`${styles.capture} ${item.scanId === selectedScanId ? styles.selected : ''}`}
                    onClick={() => setSelectedScanId(item.scanId)}>
                    <strong>{new Date(item.capturedAt).toLocaleString()}</strong>
                    <span>{item.pageUrl || item.pageKey}</span>
                    <small>{item.elementCount} elements · {item.status}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <section className={styles.details} aria-label="Selected scan capture">
            {!selected ? <div className={styles.emptyDetail}>Select a capture to inspect its immutable metadata.</div> : (
              <>
                <div className={styles.detailHeader}>
                  <div><p className={styles.eyebrow}>SELECTED CAPTURE</p><h2>{selected.pageUrl || selected.pageKey}</h2></div>
                  <span className={selected.status === 'READY' ? styles.ready : styles.failed}>{selected.status}</span>
                </div>
                <dl className={styles.metadata}>
                  <div><dt>Captured</dt><dd>{new Date(selected.capturedAt).toLocaleString()}</dd></div>
                  <div><dt>Elements</dt><dd>{selected.elementCount}</dd></div>
                  <div><dt>Page key</dt><dd>{selected.pageKey}</dd></div>
                  <div><dt>Artifact folder</dt><dd>{selected.artifactPath || 'Unavailable'}</dd></div>
                  <div><dt>Manifest SHA-256</dt><dd className={styles.hash}>{selected.manifestSha256 || 'Unavailable'}</dd></div>
                </dl>
                <div className={styles.notice}>P2 storage explorer is read-only. Element overlays, search, and Memory List actions arrive in P3/P4.</div>
              </>
            )}
          </section>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default PageMappingsPage;
