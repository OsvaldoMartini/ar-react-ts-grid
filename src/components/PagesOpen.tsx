import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, RefreshCw } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import QuestionsCard from './QuestionsCard';
import {
  normalizeOpenPages,
  pagesOpenTextValue,
  parsePagesOpenMessage,
  type OpenPageEntry,
} from './pagesOpen.contract';
import { useWebSocket } from './useWebSocket';
import styles from './PagesOpen.module.scss';

export const PAGES_OPEN_SESSION_ID = 'pagesOpenManager';
export type { OpenPageEntry } from './pagesOpen.contract';

interface PagesOpenProps {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
}

const responseMessage = (body: any, fallback: string): string =>
  pagesOpenTextValue(
    body?.message,
    body?.error?.errorMessage,
    body?.error?.errorHeader,
    body?.error,
    fallback,
  );

const PagesOpen: React.FC<PagesOpenProps> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => { document.title = 'Pages Open'; }, []);
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [pages, setPages] = useState<OpenPageEntry[]>([]);
  const [status, setStatus] = useState('Waiting for open pages');
  const [statusTone, setStatusTone] = useState<'ok' | 'warn' | 'error'>('warn');
  const [pendingPageId, setPendingPageId] = useState('');
  const [pendingFocusPageId, setPendingFocusPageId] = useState('');
  const [mainCloseCandidate, setMainCloseCandidate] = useState<OpenPageEntry | null>(null);

  const send = useCallback((type: string, body: unknown = {}) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Pages Open is not connected.');
      setStatusTone('error');
      return false;
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      body: JSON.stringify(body),
    }));
    return true;
  }, [sessionId, webSocket]);

  const bootstrap = useCallback(() => {
    if (send('pagesOpen.bootstrap')) {
      setStatus('Refreshing open pages...');
      setStatusTone('warn');
    }
  }, [send]);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const { operationId, body } = parsePagesOpenMessage(raw);
        if (operationId === 'pagesOpen.snapshot' || operationId === 'pagesOpen.bootstrapResponse') {
          const nextPages = normalizeOpenPages(body);
          setPages(nextPages);
          setPendingPageId('');
          setStatus(responseMessage(
            body,
            `${nextPages.length} page${nextPages.length === 1 ? '' : 's'} open`,
          ));
          setStatusTone(body?.ok === false ? 'error' : 'ok');
        } else if (operationId === 'pagesOpen.focus') {
          try {
            window.focus();
          } catch {
            // Native focus is best-effort and may be refused by the window manager.
          }
        } else if (operationId === 'pagesOpen.focusPageResponse') {
          setPendingFocusPageId('');
          setStatus(responseMessage(
            body,
            body?.ok === false ? 'The page could not be focused.' : 'Page brought to front.',
          ));
          setStatusTone(body?.ok === false ? 'error' : 'ok');
        } else if (
          operationId === 'pagesOpen.closeResponse'
          || operationId === 'pagesOpen.closePageResponse'
        ) {
          setPendingPageId('');
          setStatus(responseMessage(
            body,
            body?.ok === false ? 'The page could not be closed.' : 'Page closed.',
          ));
          setStatusTone(body?.ok === false ? 'error' : 'ok');
        }
      } catch (messageError) {
        console.error('Could not read Pages Open message:', messageError);
        setPendingPageId('');
        setPendingFocusPageId('');
        setStatus('The Pages Open response could not be read.');
        setStatusTone('error');
      }
    });
  }, [messages]);

  useEffect(() => {
    if (!error) return;
    setStatus(error);
    setStatusTone('error');
  }, [error]);

  const requestFocus = useCallback((page: OpenPageEntry) => {
    if (pendingFocusPageId || pendingPageId) return;
    if (send('pagesOpen.focusPage', {
      pageId: page.pageId,
      sessionId: page.sessionId,
      kind: page.kind,
    })) {
      setPendingFocusPageId(page.pageId);
      setStatus(`Bringing ${page.title} to front...`);
      setStatusTone('warn');
    }
  }, [pendingFocusPageId, pendingPageId, send]);

  const requestClose = useCallback((page: OpenPageEntry) => {
    if (!page.closeable || pendingPageId) return;
    if (page.main) {
      setMainCloseCandidate(page);
      return;
    }

    if (send('pagesOpen.closePage', {
      pageId: page.pageId,
      sessionId: page.sessionId,
      kind: page.kind,
    })) {
      setPendingPageId(page.pageId);
      setStatus(`Closing ${page.title}...`);
      setStatusTone('warn');
    }
  }, [pendingPageId, send]);

  const confirmMainClose = useCallback(() => {
    if (!mainCloseCandidate) return;
    const page = mainCloseCandidate;
    setMainCloseCandidate(null);
    if (send('pagesOpen.closePage', {
      pageId: page.pageId,
      sessionId: page.sessionId,
      kind: page.kind,
    })) {
      setPendingPageId(page.pageId);
      setStatus('Closing the AR Web application...');
      setStatusTone('warn');
    }
  }, [mainCloseCandidate, send]);

  const statusClass = statusTone === 'error'
    ? styles.statusError
    : statusTone === 'ok'
      ? styles.statusOk
      : styles.statusWarn;
  const sortedPages = useMemo(
    () => [...pages].sort((left, right) => {
      if (left.main !== right.main) return left.main ? -1 : 1;
      return left.title.localeCompare(right.title);
    }),
    [pages],
  );

  return (
    <DetachedPageShell
      title="Pages Open"
      testId="pages-open-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Pages Open</h1>
              <p className={styles.subtitle}>All AR Web pages currently open</p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">
                {status}
              </div>
              <button
                type="button"
                className={styles.refreshButton}
                title="Refresh open pages"
                aria-label="Refresh open pages"
                disabled={!connected}
                onClick={bootstrap}
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                Close
              </button>
            </div>
          </header>

          <div className={styles.summaryRow}>
            <span>Open pages</span>
            <strong>{sortedPages.length}</strong>
          </div>

          <section className={styles.list} aria-label="Open AR Web pages">
            {sortedPages.length === 0 ? (
              <div className={styles.empty}>
                {connected ? 'No open pages were reported.' : 'Connecting to Pages Open...'}
              </div>
            ) : (
              sortedPages.map((page, index) => {
                const detail = page.detail
                  || page.botJobName
                  || page.sessionId
                  || page.kind;
                const closing = pendingPageId === page.pageId;
                const focusing = pendingFocusPageId === page.pageId;
                return (
                  <article className={styles.item} key={page.pageId}>
                    <button
                      type="button"
                      className={styles.focusButton}
                      title={`Bring ${page.title} to front`}
                      aria-label={`Bring ${page.title} to front`}
                      disabled={Boolean(pendingPageId || pendingFocusPageId)}
                      onClick={() => requestFocus(page)}
                    >
                      <span className={styles.order}>{index + 1}.</span>
                      <span className={`${styles.pageIcon} ${focusing ? styles.focusing : ''}`}>
                        <AppWindow size={19} aria-hidden="true" />
                      </span>
                      <span className={styles.itemText}>
                        <strong title={page.title}>{page.title}</strong>
                        <small title={detail}>{detail}</small>
                      </span>
                      <span className={styles.focusHint}>Click to bring to front</span>
                      {page.main && <span className={styles.mainBadge}>Main</span>}
                      <span className={styles.kindBadge}>{page.kind}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      title={page.main ? 'Close the entire AR Web application' : `Close ${page.title}`}
                      aria-label={page.main ? 'Close the entire AR Web application' : `Close ${page.title}`}
                      disabled={!page.closeable || Boolean(pendingPageId || pendingFocusPageId)}
                      onClick={() => requestClose(page)}
                    >
                      {closing ? '...' : 'X'}
                    </button>
                  </article>
                );
              })
            )}
          </section>

          <footer className={styles.footer}>
            {sortedPages.length} page{sortedPages.length === 1 ? '' : 's'} open
          </footer>
        </section>

        {mainCloseCandidate && (
          <QuestionsCard
            mode="confirm"
            header="Close Main Dashboard?"
            body="Closing the Main Dashboard will close every AR Web page and stop the backend."
            extraMsg="This action closes the entire application, not only the selected window."
            okLabel="Close Application"
            cancelLabel="Cancel"
            destructive
            error
            onCancel={() => setMainCloseCandidate(null)}
            onSubmit={confirmMainClose}
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default PagesOpen;
