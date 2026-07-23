import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow } from 'lucide-react';
import { normalizeOpenPages, parsePagesOpenMessage } from './pagesOpen.contract';
import { RulesCard } from './RulesCard';

interface PagesOpenButtonProps {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  sessionId: string;
}

const SNAPSHOT_OPERATIONS = new Set([
  'pagesOpen.snapshot',
  'pagesOpen.summaryResponse',
  'pagesOpen.openResponse',
]);

const PagesOpenButton: React.FC<PagesOpenButtonProps> = ({
  webSocket,
  connected,
  messages,
  sessionId,
}) => {
  const processedMessageCountRef = useRef(0);
  const summarySocketRef = useRef<WebSocket | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [summaryReady, setSummaryReady] = useState(false);

  const send = useCallback((type: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return false;
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      body: JSON.stringify({}),
    }));
    return true;
  }, [sessionId, webSocket]);

  useEffect(() => {
    if (!connected || !webSocket || summarySocketRef.current === webSocket) return;
    summarySocketRef.current = webSocket;
    setSummaryReady(false);
    send('pagesOpen.summary');
  }, [connected, send, webSocket]);

  useEffect(() => {
    if (!connected) {
      summarySocketRef.current = null;
      setSummaryReady(false);
    }
  }, [connected]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const { operationId, body } = parsePagesOpenMessage(raw);
        if (!operationId || !SNAPSHOT_OPERATIONS.has(operationId)) return;
        if (body?.ok === false) {
          setSummaryReady(false);
          return;
        }
        setPageCount(normalizeOpenPages(body).length);
        setSummaryReady(true);
      } catch {
        // Other page-specific socket messages are intentionally ignored.
      }
    });
  }, [messages]);

  const available = connected && summaryReady;
  const event = useMemo(() => ({
    color: available ? 'green' as const : 'red' as const,
    rules: `Pages (${pageCount})`,
    ts: pageCount,
  }), [available, pageCount]);

  return (
    <RulesCard
      event={event}
      animate={false}
      pulse={available && pageCount > 0}
      glow={available && pageCount > 0}
      border={!available || pageCount === 0}
      iconNode={<AppWindow aria-hidden="true" />}
      onClick={() => send('pagesOpen.open')}
      title={connected
        ? 'View and close every open AR Web page'
        : 'Pages Open is unavailable while this page is disconnected'}
      disabled={!connected}
    />
  );
};

export default PagesOpenButton;
