import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, RefreshCw, X } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './ExcelDataPage.module.scss';

export const EXCEL_DATA_SESSION_ID = 'excelDataManager';

type ExcelRow = { index: number; values: Record<string, string | null> };
type ExcelBlock = { name: string; columns: string[]; rows: ExcelRow[] };
type ExcelSnapshot = {
  ok: boolean;
  error?: string;
  botJobId: number;
  botJobName: string;
  fileName: string;
  filePath: string;
  loadedAt: string;
  rowCount: number;
  blocks: ExcelBlock[];
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void };

const parse = (raw: string) => {
  const envelope = JSON.parse(raw);
  const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body ?? {};
  return { operationId: envelope.operationId || envelope.type, body };
};

const ExcelDataPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const cursor = useRef(0);
  const [snapshot, setSnapshot] = useState<ExcelSnapshot | null>(null);
  const [status, setStatus] = useState('Connecting to Excel dataset…');

  const send = useCallback((type: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return false;
    webSocket.send(JSON.stringify({ type, sessionId, body: '{}' }));
    return true;
  }, [sessionId, webSocket]);

  const refresh = useCallback(() => {
    if (send('excelData.bootstrap')) setStatus('Loading retained Excel dataset…');
  }, [send]);

  const close = useCallback(() => {
    if (!send('excelData.close')) onClose?.();
    else setStatus('Releasing Excel dataset…');
  }, [onClose, send]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);
  useEffect(() => { if (error) setStatus(error); }, [error]);

  useEffect(() => {
    if (cursor.current > messages.length) cursor.current = 0;
    const pending = messages.slice(cursor.current);
    cursor.current = messages.length;
    pending.forEach(raw => {
      try {
        const { operationId, body } = parse(raw);
        if (operationId === 'excelData.bootstrapResponse') {
          if (body?.ok === false) setStatus(body.error || 'Excel dataset is unavailable.');
          else {
            setSnapshot(body as ExcelSnapshot);
            setStatus(`Loaded ${body.rowCount ?? 0} Excel row${body.rowCount === 1 ? '' : 's'} into memory`);
          }
        } else if (operationId === 'excelData.closeResponse') {
          onClose?.();
        } else if (operationId === 'application.workspaceFocus') {
          window.focus();
        }
      } catch (messageError) {
        console.error('Could not read Excel Data response:', messageError);
        setStatus('The Excel Data response could not be read.');
      }
    });
  }, [messages, onClose]);

  return (
    <DetachedPageShell title="Excel Data" testId="excel-data-page" showCloseButton={false}>
      <main className={styles.shell}>
        <header className={styles.header} data-floating-workspace-drag-handle>
          <div>
            <h1><Database size={18} /> Excel Data</h1>
            <p>{snapshot ? `${snapshot.botJobName} · ${snapshot.fileName}` : 'Bot Job execution dataset'}</p>
          </div>
          <div className={styles.actions} data-floating-drag-ignore="true">
            <span className={styles.status}>{status}</span>
            <button type="button" onClick={refresh} disabled={!connected}><RefreshCw size={14} />Refresh view</button>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={styles.close} onClick={close}><X size={14} />Close</button>
          </div>
        </header>
        {snapshot && <section className={styles.summary}>
          <span>Bot Job <strong>#{snapshot.botJobId}</strong></span>
          <span>Rows <strong>{snapshot.rowCount}</strong></span>
          <span>Loaded <strong>{new Date(snapshot.loadedAt).toLocaleTimeString()}</strong></span>
          <span className={styles.path} title={snapshot.filePath}>{snapshot.filePath}</span>
        </section>}
        <section className={styles.content}>
          {!snapshot && <div className={styles.empty}>Waiting for the authoritative Excel dataset.</div>}
          {snapshot?.blocks.map((block, blockIndex) => (
            <article className={styles.block} key={`${block.name}-${blockIndex}`}>
              <h2>{block.name || 'Workbook data'} <span>{block.rows.length} rows</span></h2>
              <div className={styles.tableWrap}>
                <table><thead><tr><th>Row</th>{block.columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{block.rows.map(row => <tr key={row.index}><td>{row.index + 1}</td>{block.columns.map(column => <td key={column}>{row.values[column] ?? <em>EMPTY</em>}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default ExcelDataPage;
