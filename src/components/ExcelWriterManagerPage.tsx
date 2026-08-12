import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import ExcelWriteManagerWorkspace from './excel-write-manager/ExcelWriteManagerWorkspace';
import type { ExcelWriteFlushPolicy } from './excel-write-manager/domain/excelWriteManager';
import {
  EXCEL_WRITER_MANAGER_SESSION_ID,
  isExcelWriterManagerSnapshot,
  type ExcelWriterAuthority,
  type ExcelWriterManagerSnapshot,
} from './excel-write-manager/domain/excelWriterManagerBridge';
import styles from './ExcelWriterManagerPage.module.scss';

export { EXCEL_WRITER_MANAGER_SESSION_ID };
type Props = { socketPort: number; sessionId: string; sourceBotJobId?: number; onClose?: () => void };
type Status = { tone: 'READY' | 'WAITING' | 'ERROR'; text: string };

const parse = (raw: string): { operationId: string; body: Record<string, any> } => {
  const envelope = JSON.parse(raw);
  const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body ?? {};
  return { operationId: envelope.operationId || envelope.type || '', body };
};

const ExcelWriterManagerPage: React.FC<Props> = ({ socketPort, sessionId, sourceBotJobId, onClose }) => {
  const botJobId = useMemo(() => {
    if (Number.isInteger(sourceBotJobId) && Number(sourceBotJobId) > 0) return Number(sourceBotJobId);
    const value = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isInteger(value) && value > 0 ? value : 0;
  }, [sourceBotJobId]);
  const { webSocket, connected, messages, messageGeneration = 0, error } = useWebSocket(socketPort, sessionId);
  const cursor = useRef(0);
  const messageGenerationRef = useRef(messageGeneration);
  const readyBindingEpochRef = useRef('');
  const authorityRef = useRef<ExcelWriterAuthority | null>(null);
  const [authority, setAuthority] = useState<ExcelWriterAuthority | null>(null);
  const [snapshot, setSnapshot] = useState<ExcelWriterManagerSnapshot | null>(null);
  const [status, setStatus] = useState<Status>({ tone: 'WAITING', text: 'Connecting to ExcelWriter memory...' });

  useEffect(() => { document.title = 'ExcelWriter Manager'; }, []);

  const send = useCallback((type: string, body: Record<string, unknown>): boolean => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return false;
    webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
    return true;
  }, [sessionId, webSocket]);

  useEffect(() => {
    if (!connected || botJobId < 1) return;
    setStatus({ tone: 'WAITING', text: 'Loading the owner-bound ExcelWriter workspace...' });
    send('excelWriterWorkspace.bootstrap', { requestId: `${Date.now()}-excel-writer-bootstrap`, botJobId });
  }, [botJobId, connected, send]);

  useEffect(() => {
    if (error) setStatus({ tone: 'ERROR', text: error });
    else if (!connected) setStatus({ tone: 'WAITING', text: 'ExcelWriter Manager is reconnecting...' });
  }, [connected, error]);

  useEffect(() => {
    if (messageGenerationRef.current !== messageGeneration) {
      messageGenerationRef.current = messageGeneration;
      cursor.current = 0;
    } else if (cursor.current > messages.length) cursor.current = 0;
    const unread = messages.slice(cursor.current);
    cursor.current = messages.length;
    unread.forEach(raw => {
      try {
        const { operationId, body } = parse(String(raw));
        if (operationId === 'excelWriterWorkspace.bootstrapResponse'
          || operationId === 'excelWriterWorkspace.retarget') {
          if (body.ok === false) {
            setStatus({ tone: 'ERROR', text: body.error || 'ExcelWriter Manager could not load.' });
            return;
          }
          const next: ExcelWriterAuthority = {
            bindingEpoch: String(body.bindingEpoch || ''),
            workspaceEpoch: Number(body.workspaceEpoch),
            homeBankingId: Number(body.homeBankingId),
            botJobId: Number(body.botJobId),
          };
          if (!next.bindingEpoch || next.botJobId < 1 || next.homeBankingId < 1) {
            setStatus({ tone: 'ERROR', text: 'ExcelWriter Manager received an invalid owner binding.' });
            return;
          }
          authorityRef.current = next;
          readyBindingEpochRef.current = '';
          setAuthority(next);
          setSnapshot(null);
          send('excelWriterWorkspace.command', { ...next, requestId: `${Date.now()}-excel-writer-state`, command: 'REQUEST_STATE' });
          setStatus({ tone: 'WAITING', text: 'ExcelWriter page is connected; loading Smoke Test memory...' });
        } else if (operationId === 'excelWriterWorkspace.state') {
          const current = authorityRef.current;
          if (!current || !isExcelWriterManagerSnapshot(body, current)) return;
          setSnapshot(body);
          setStatus({ tone: 'READY', text: `Ready · ${body.state.files.length} file(s) · Bot Job #${body.botJobId}` });
        } else if (operationId === 'excelWriterWorkspace.errorResponse'
          || ((operationId.endsWith('Response')) && body.ok === false)) {
          setStatus({ tone: 'ERROR', text: body.error || 'ExcelWriter operation failed.' });
        }
      } catch (_) {
        setStatus({ tone: 'ERROR', text: 'ExcelWriter Manager received an unreadable response.' });
      }
    });
  }, [messageGeneration, messages, send]);

  useEffect(() => {
    if (!snapshot || !authority || readyBindingEpochRef.current === authority.bindingEpoch) return;
    if (!send('excelWriterWorkspace.ready', {
      ...authority,
      requestId: `${Date.now()}-excel-writer-ready`,
    })) {
      setStatus({ tone: 'ERROR', text: 'ExcelWriter readiness could not be acknowledged.' });
      return;
    }
    readyBindingEpochRef.current = authority.bindingEpoch;
  }, [authority, send, snapshot]);

  const command = useCallback((name: string, values: Record<string, unknown> = {}) => {
    const current = authorityRef.current;
    if (!current || !send('excelWriterWorkspace.command', {
      ...current, ...values, requestId: `${Date.now()}-excel-writer-command`, command: name,
    })) setStatus({ tone: 'ERROR', text: 'ExcelWriter command could not be sent.' });
  }, [send]);

  const statusClass = status.tone === 'ERROR'
    ? styles.statusError
    : status.tone === 'READY' ? styles.statusReady : styles.statusWaiting;
  return (
    <DetachedPageShell title="ExcelWriter Manager" testId="excel-writer-manager-page" onClose={undefined} showCloseButton={false}>
      <main className={styles.shell}>
        <header className={styles.topBar} data-floating-workspace-drag-handle>
          <div className={styles.titleBlock}><FileSpreadsheet size={22} aria-hidden="true" />
            <span><small>React execution memory</small><h1>ExcelWriter Manager</h1></span></div>
          <div className={styles.actions} data-floating-drag-ignore="true">
            <span className={`${styles.status} ${statusClass}`} role="status">{status.text}</span>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <section className={styles.body}><div className={styles.manager}>
          {snapshot ? <ExcelWriteManagerWorkspace state={snapshot.state} busy={snapshot.busy}
            policyLocked={snapshot.policyLocked}
            onPolicyChange={(policy: ExcelWriteFlushPolicy) => command('POLICY_CHANGE', { policy })}
            onCellChange={(fileId, rowIndex, column, value) => command('CELL_CHANGE', { fileId, rowIndex, column, value })}
            onSave={() => command('SAVE')} />
            : <div className={styles.empty}><FileSpreadsheet size={34} aria-hidden="true" />
              <strong>Waiting for ExcelWriter memory</strong><span>{status.text}</span>
              <span>{authority ? `Bot Job #${authority.botJobId}` : botJobId > 0 ? `Bot Job #${botJobId}` : 'No Bot Job owner was supplied.'}</span></div>}
        </div></section>
      </main>
    </DetachedPageShell>
  );
};

export default ExcelWriterManagerPage;
