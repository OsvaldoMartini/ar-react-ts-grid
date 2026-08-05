import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CopyPlus, Database, FilePlus2, FlaskConical, RefreshCw, Save, X } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import QuestionsCard from './QuestionsCard';
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
  dirty?: boolean;
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void };
type ActiveCell = { blockName: string; column: string; rowIndex: number; instructionId?: number };

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
  const [pendingAction, setPendingAction] = useState<'STANDARD' | 'SYNTHETIC' | 'SAVE' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

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

  const generate = useCallback((kind: 'STANDARD' | 'SYNTHETIC') => {
    const operation = kind === 'SYNTHETIC' ? 'excelData.generateSynthetic' : 'excelData.generate';
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Excel Data is not connected.');
      return;
    }
    setGenerating(true);
    setPendingAction(null);
    setStatus(kind === 'SYNTHETIC' ? 'Generating synthetic Excel rows…' : 'Generating Excel data file…');
    webSocket.send(JSON.stringify({
      type: operation,
      sessionId,
      body: JSON.stringify({ confirmed: true }),
    }));
  }, [sessionId, webSocket]);

  const addRow = useCallback(() => {
    if (!send('excelData.addRow')) setStatus('Excel Data is not connected.');
    else setStatus('Copying the previous row in memory…');
  }, [send]);

  const save = useCallback(() => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Excel Data is not connected.');
      return;
    }
    setGenerating(true);
    setPendingAction(null);
    setStatus('Saving the in-memory dataset to Excel…');
    webSocket.send(JSON.stringify({
      type: 'excelData.save', sessionId, body: JSON.stringify({ confirmed: true }),
    }));
  }, [sessionId, webSocket]);

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
        } else if (operationId === 'excelData.generateResponse'
          || operationId === 'excelData.generateSyntheticResponse') {
          setGenerating(false);
          if (body?.ok === false) setStatus(body.error || 'Excel generation failed.');
          else {
            setSnapshot(body as ExcelSnapshot);
            setStatus(body.message || 'Excel data generated and loaded.');
          }
        } else if (operationId === 'excelData.addRowResponse') {
          if (body?.ok === false) setStatus(body.error || 'The Excel row was not added.');
          else {
            setSnapshot(body as ExcelSnapshot);
            setStatus(body.message || 'Excel row added in memory.');
          }
        } else if (operationId === 'excelData.saveResponse') {
          setGenerating(false);
          if (body?.ok === false) setStatus(body.error || 'The Excel dataset was not saved.');
          else {
            setSnapshot(body as ExcelSnapshot);
            setStatus(body.message || 'Excel dataset saved.');
          }
        } else if (operationId === 'excelData.activeCell') {
          setActiveCell(body as ActiveCell);
          setStatus(`Executing row ${Number(body.rowIndex) + 1} · ${body.column}`);
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
            <button type="button" onClick={() => setPendingAction('STANDARD')} disabled={!connected || generating}><FilePlus2 size={14} />Generate</button>
            <button type="button" className={styles.synthetic} onClick={() => setPendingAction('SYNTHETIC')} disabled={!connected || generating}><FlaskConical size={14} />Synthetic Data</button>
            <button type="button" onClick={addRow} disabled={!connected || generating || !snapshot || snapshot.rowCount < 1}><CopyPlus size={14} />Add Row</button>
            <button type="button" className={styles.save} onClick={() => setPendingAction('SAVE')} disabled={!connected || generating || !snapshot?.dirty}><Save size={14} />Save to Excel</button>
            <button type="button" onClick={refresh} disabled={!connected}><RefreshCw size={14} />Refresh Memory View</button>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={styles.close} onClick={close}><X size={14} />Close</button>
          </div>
        </header>
        {snapshot && <section className={styles.summary}>
          <span>Bot Job <strong>#{snapshot.botJobId}</strong></span>
          <span>Rows <strong>{snapshot.rowCount}</strong></span>
          <span>State <strong>{snapshot.dirty ? 'UNSAVED MEMORY' : 'SAVED'}</strong></span>
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
                  <tbody>{block.rows.map(row => <tr key={row.index}><td>{row.index + 1}</td>{block.columns.map(column => {
                    const executing = activeCell?.blockName === block.name
                      && activeCell.column === column
                      && activeCell.rowIndex === row.index;
                    return <td key={column} className={executing ? styles.activeCell : undefined}>{row.values[column] ?? <em>EMPTY</em>}{executing && <b className={styles.executing}>EXECUTING</b>}</td>;
                  })}</tr>)}</tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
        {pendingAction && (
          <QuestionsCard
            mode="confirm"
            header={pendingAction === 'SYNTHETIC'
              ? 'Generate Synthetic Memory Data?'
              : pendingAction === 'SAVE' ? 'Save Memory Data to Excel?' : 'Generate Excel Data File?'}
            body={pendingAction === 'SYNTHETIC'
              ? 'Replace the current in-memory dataset with three deterministic synthetic rows for every Excel input column? The workbook is not changed until Save to Excel.'
              : pendingAction === 'SAVE'
                ? 'Atomically replace the original Bot Job workbook with the current in-memory rows?'
                : 'Rebuild the active Bot Job workbook from its current Blocks and input fields while preserving existing row values?'}
            extraMsg={pendingAction === 'SAVE'
              ? 'Smoke Test and Test Run already use this shared memory dataset; saving makes it durable on disk.'
              : 'The in-memory dataset remains the authoritative source for this open Excel Data workspace.'}
            okLabel={pendingAction === 'SYNTHETIC' ? 'Generate in Memory' : pendingAction === 'SAVE' ? 'Save to Excel' : 'Generate'}
            destructive={pendingAction !== 'SYNTHETIC'}
            onSubmit={() => pendingAction === 'SAVE' ? save() : generate(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default ExcelDataPage;
