import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyPlus, Database, FilePlus2, RefreshCw, Save, Trash2, X } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import QuestionsCard from './QuestionsCard';
import { useWebSocket } from './useWebSocket';
import ExcelDataSearchBox, { filterExcelDataBlocks } from './excel-data/ExcelDataSearchBox';
import ExcelSyntheticControls from './excel-data/ExcelSyntheticControls';
import ExcelDataHelpModal from './excel-data/ExcelDataHelpModal';
import ExcelDataModeToggle from './excel-data/ExcelDataModeToggle';
import ExcelDataRowControl, {
  ExcelDataRowControlHeader,
} from './excel-data/ExcelDataRowControl';
import { generateSyntheticBlocks, SYNTHETIC_CONTEXTS, type SyntheticContext } from './excel-data/syntheticDataProfiles';
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
  selectedRowIndex: number | null;
  datasetRevision?: number;
  dirty?: boolean;
  mode: 'REAL' | 'SYNTHETIC';
  syntheticContext?: string;
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void };
type ActiveCell = { blockName: string; column: string; rowIndex: number; instructionId?: number };
type ExcelAlert = { title: string; message: string };
type ExcelRowMove = { fromIndex: number; toIndex: number };
type ExcelRowDrag = { fromIndex: number; overIndex: number | null };

const parse = (raw: string) => {
  const envelope = JSON.parse(raw);
  const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body ?? {};
  return { operationId: envelope.operationId || envelope.type, body };
};

const ExcelDataPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => { document.title = 'Excel DATA'; }, []);
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const cursor = useRef(0);
  const [snapshot, setSnapshot] = useState<ExcelSnapshot | null>(null);
  const [status, setStatus] = useState('Connecting to Excel dataset…');
  const [pendingAction, setPendingAction] = useState<'STANDARD' | 'SYNTHETIC' | 'SAVE' | 'CLEAR' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [selectingRowIndex, setSelectingRowIndex] = useState<number | null>(null);
  const [movingRow, setMovingRow] = useState<ExcelRowMove | null>(null);
  const [draggingRow, setDraggingRow] = useState<ExcelRowDrag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syntheticRowCount, setSyntheticRowCount] = useState(1);
  const [syntheticContext, setSyntheticContext] = useState<SyntheticContext>('Bank Account');
  const [helpOpen, setHelpOpen] = useState(false);
  const [alert, setAlert] = useState<ExcelAlert | null>(null);

  const filteredBlocks = useMemo(
    () => filterExcelDataBlocks(snapshot?.blocks ?? [], searchQuery),
    [searchQuery, snapshot?.blocks],
  );
  const filteredColumnCount = useMemo(
    () => filteredBlocks.reduce((total, block) => total + block.columns.length, 0),
    [filteredBlocks],
  );
  const filteredRowCount = useMemo(
    () => filteredBlocks.reduce((total, block) => total + block.rows.length, 0),
    [filteredBlocks],
  );

  const send = useCallback((type: string, body: Record<string, unknown> = {}) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return false;
    webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
    return true;
  }, [sessionId, webSocket]);

  const resetRowInteraction = useCallback(() => {
    setSelectingRowIndex(null);
    setMovingRow(null);
    setDraggingRow(null);
  }, []);

  const bootstrap = useCallback(() => {
    if (send('excelData.bootstrap')) setStatus('Loading retained Excel dataset…');
  }, [send]);

  const refresh = useCallback(() => {
    if (send('excelData.refresh')) setStatus('Reloading selected data source…');
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
      body: JSON.stringify({
        confirmed: true,
        ...(kind === 'SYNTHETIC'
          ? {
            rowCount: syntheticRowCount,
            context: syntheticContext,
            blocks: generateSyntheticBlocks(snapshot?.blocks ?? [], syntheticRowCount, syntheticContext),
          }
          : {}),
      }),
    }));
  }, [sessionId, snapshot?.blocks, syntheticContext, syntheticRowCount, webSocket]);

  const showExcelError = useCallback((body: any) => {
    const titles: Record<string, string> = {
      EXCEL_FILE_IN_USE: 'Excel File in Use',
      EXCEL_FILE_CORRUPTED: 'Excel File Corrupted',
      EXCEL_FILE_OPERATION_FAILED: 'Excel File Not Saved',
    };
    setAlert({
      title: titles[String(body?.errorCode)] || 'Excel Operation Failed',
      message: body?.error || 'The Excel operation could not be completed.',
    });
  }, []);

  const addRow = useCallback(() => {
    if (!send('excelData.addRow')) setStatus('Excel Data is not connected.');
    else setStatus('Copying the previous row in memory…');
  }, [send]);

  const clearRows = useCallback(() => {
    setPendingAction(null);
    if (!send('excelData.rows.clear', { confirmed: true })) {
      setStatus('Excel Data is not connected.');
    } else {
      setStatus('Clearing all rows from memory…');
    }
  }, [send]);

  const deleteRow = useCallback((rowIndex: number) => {
    if (!send('excelData.row.delete', { rowIndex })) {
      setStatus('Excel Data is not connected.');
      return;
    }
    setDeletingRowIndex(rowIndex);
    setStatus(`Deleting row ${rowIndex + 1} from memory…`);
  }, [send]);

  const selectRow = useCallback((rowIndex: number) => {
    if (snapshot?.selectedRowIndex === rowIndex) return;
    if (!send('excelData.row.select', { rowIndex })) {
      setStatus('Excel Data is not connected.');
      return;
    }
    setSelectingRowIndex(rowIndex);
    setStatus(`Selecting row ${rowIndex + 1} for execution…`);
  }, [send, snapshot?.selectedRowIndex]);

  const startRowDrag = useCallback((rowIndex: number) => {
    setDraggingRow({ fromIndex: rowIndex, overIndex: null });
  }, []);

  const moveRowOver = useCallback((rowIndex: number) => {
    setDraggingRow(current => current && current.fromIndex !== rowIndex
      ? { ...current, overIndex: rowIndex }
      : current);
  }, []);

  const finishRowDrag = useCallback(() => {
    setDraggingRow(null);
  }, []);

  const dropRow = useCallback((toIndex: number) => {
    const fromIndex = draggingRow?.fromIndex;
    setDraggingRow(null);
    if (fromIndex == null || fromIndex === toIndex) return;
    if (!send('excelData.row.move', { fromIndex, toIndex })) {
      setStatus('Excel Data is not connected.');
      return;
    }
    setMovingRow({ fromIndex, toIndex });
    setStatus(`Moving row ${fromIndex + 1} to position ${toIndex + 1}…`);
  }, [draggingRow?.fromIndex, send]);

  const selectMode = useCallback((mode: 'REAL' | 'SYNTHETIC') => {
    setDraggingRow(null);
    if (send('excelData.mode.update', { mode })) setStatus(`Selecting ${mode} data…`);
  }, [send]);

  const selectSyntheticContext = useCallback((context: SyntheticContext) => {
    setSyntheticContext(context);
    if (!send('excelData.context.update', { context })) {
      setStatus('Excel Data is not connected.');
    } else {
      setStatus(`Saving ${context} synthetic context…`);
    }
  }, [send]);

  const updateCell = useCallback((blockName: string, column: string, rowIndex: number, value: string) => {
    if (!send('excelData.cell.update', { blockName, column, rowIndex, value })) {
      setStatus('Excel Data is not connected.');
    }
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

  useEffect(() => { if (connected) bootstrap(); }, [bootstrap, connected]);
  useEffect(() => { if (error) setStatus(error); }, [error]);
  useEffect(() => {
    if (!connected) resetRowInteraction();
  }, [connected, resetRowInteraction]);
  useEffect(() => {
    setDraggingRow(null);
    setMovingRow(null);
    setSelectingRowIndex(null);
  }, [snapshot?.botJobId, snapshot?.mode]);

  useEffect(() => {
    if (cursor.current > messages.length) cursor.current = 0;
    const pending = messages.slice(cursor.current);
    cursor.current = messages.length;
    pending.forEach(raw => {
      try {
        const { operationId, body } = parse(raw);
        if (operationId === 'excelData.bootstrapResponse' || operationId === 'excelData.retarget') {
          if (operationId === 'excelData.retarget') {
            setSearchQuery('');
            setActiveCell(null);
            resetRowInteraction();
          }
          if (body?.ok === false) setStatus(body.error || 'Excel dataset is unavailable.');
          else {
            setSnapshot(body as ExcelSnapshot);
            if (SYNTHETIC_CONTEXTS.includes(body.syntheticContext as SyntheticContext)) {
              setSyntheticContext(body.syntheticContext as SyntheticContext);
            }
            setStatus(operationId === 'excelData.retarget'
              ? body.message || 'Excel Data reloaded for the selected Bot Job.'
              : `Loaded ${body.rowCount ?? 0} Excel row${body.rowCount === 1 ? '' : 's'} into memory`);
          }
        } else if (operationId === 'excelData.generateResponse'
          || operationId === 'excelData.generateSyntheticResponse') {
          setGenerating(false);
          if (body?.ok === false) {
            setStatus(body.error || 'Excel generation failed.');
            showExcelError(body);
          }
          else {
            setSnapshot(body as ExcelSnapshot);
            setStatus(body.message || 'Excel data generated and loaded.');
          }
        } else if (operationId === 'excelData.addRowResponse'
          || operationId === 'excelData.mode.updateResponse'
          || operationId === 'excelData.context.updateResponse'
          || operationId === 'excelData.refreshResponse'
          || operationId === 'excelData.cell.updateResponse'
          || operationId === 'excelData.row.deleteResponse'
          || operationId === 'excelData.row.selectResponse'
          || operationId === 'excelData.row.moveResponse'
          || operationId === 'excelData.rows.clearResponse') {
          if (operationId === 'excelData.row.deleteResponse') setDeletingRowIndex(null);
          if (operationId === 'excelData.row.selectResponse') setSelectingRowIndex(null);
          if (operationId === 'excelData.row.moveResponse') {
            setMovingRow(null);
            setDraggingRow(null);
          }
          if (body?.ok === false) {
            setStatus(body.error || 'The Excel operation failed.');
            if (operationId === 'excelData.refreshResponse') showExcelError(body);
          }
          else {
            setSnapshot(body as ExcelSnapshot);
            if (SYNTHETIC_CONTEXTS.includes(body.syntheticContext as SyntheticContext)) {
              setSyntheticContext(body.syntheticContext as SyntheticContext);
            }
            setStatus(body.message || 'Excel memory updated.');
          }
        } else if (operationId === 'excelData.saveResponse') {
          setGenerating(false);
          if (body?.ok === false) {
            setStatus(body.error || 'The Excel dataset was not saved.');
            showExcelError(body);
          }
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
  }, [messages, onClose, resetRowInteraction, showExcelError]);

  return (
    <DetachedPageShell title="Excel Data" testId="excel-data-page" showCloseButton={false}>
      <main className={styles.shell}>
        <header className={styles.header} data-floating-workspace-drag-handle>
          <div>
            <h1><Database size={18} /> Excel Data</h1>
            <p>{snapshot ? `${snapshot.botJobName} · ${snapshot.fileName}` : 'Bot Job execution dataset'}</p>
          </div>
          <div className={styles.actions} data-floating-drag-ignore="true">
            <span className={`${styles.status} ${snapshot?.mode === 'SYNTHETIC' ? styles.syntheticStatus : styles.realStatus}`}>{status}</span>
            <ExcelDataModeToggle mode={snapshot?.mode ?? 'REAL'}
              onChange={selectMode} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null} />
            <button type="button" className={styles.actionButton} onClick={() => setPendingAction('STANDARD')} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null || snapshot?.mode !== 'REAL'}><FilePlus2 size={14} />Recreate Columns</button>
            <button type="button" className={styles.actionButton} onClick={addRow} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null || !snapshot || snapshot.rowCount < 1}><CopyPlus size={14} />Add Row</button>
            <button type="button" className={`${styles.actionButton} ${styles.clear}`} onClick={() => snapshot?.mode === 'REAL' ? setPendingAction('CLEAR') : clearRows()}
              disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null || !snapshot || snapshot.rowCount < 1}><Trash2 size={14} />Clean Rows</button>
            {snapshot?.mode === 'SYNTHETIC'
              ? <button type="button" className={`${styles.actionButton} ${styles.save}`} onClick={() => setPendingAction('SAVE')} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null || !snapshot.dirty}><Save size={14} />SAVE DB</button>
              : <>
                <button type="button" className={`${styles.actionButton} ${styles.save}`} onClick={() => setPendingAction('SAVE')} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null || !snapshot?.dirty}><Save size={14} />Save to Excel</button>
                <button type="button" className={styles.actionButton} onClick={refresh} disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null}><RefreshCw size={14} />RELOAD FILE</button>
              </>}
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={`${styles.actionButton} ${styles.close}`} onClick={close}><X size={14} />Close</button>
          </div>
        </header>
        {snapshot && <section className={styles.summary}>
          <span>Bot Job <strong>#{snapshot.botJobId}</strong></span>
          <span>Rows <strong>{snapshot.rowCount}</strong></span>
          <span>Source <strong>{snapshot.mode}</strong></span>
          <span>State <strong>{snapshot.dirty ? 'UNSAVED MEMORY' : 'SAVED'}</strong></span>
          <span>Loaded <strong>{new Date(snapshot.loadedAt).toLocaleTimeString()}</strong></span>
          <span className={styles.path} title={snapshot.filePath}>{snapshot.filePath}</span>
        </section>}
        <section className={styles.content}>
          {!snapshot && <div className={styles.empty}>Waiting for the authoritative Excel dataset.</div>}
          {snapshot && <div className={styles.searchRow}><ExcelDataSearchBox
              query={searchQuery}
              onQueryChange={setSearchQuery}
              blockCount={filteredBlocks.length}
              columnCount={filteredColumnCount}
              rowCount={filteredRowCount}
            />
            {snapshot.mode === 'SYNTHETIC' && <ExcelSyntheticControls
              rowCount={syntheticRowCount}
              context={syntheticContext}
              disabled={!connected || generating || selectingRowIndex !== null || movingRow !== null}
              onRowCountChange={setSyntheticRowCount}
              onContextChange={selectSyntheticContext}
              onGenerate={() => setPendingAction('SYNTHETIC')}
            />}
          </div>}
          {snapshot && searchQuery.trim() && filteredBlocks.length === 0 && (
            <div className={styles.empty}>No Excel Block, column, or value matches “{searchQuery.trim()}”.</div>
          )}
          {snapshot && filteredBlocks.map((block, blockIndex) => (
            <article className={styles.block} key={`${block.name}-${blockIndex}`}>
              <h2>{block.name || 'Workbook data'} <span>{block.rows.length} rows</span></h2>
              <div className={styles.tableWrap}>
                <table><thead><tr><ExcelDataRowControlHeader /><th>Row</th>{block.columns.map(column => <th key={column}>{column}</th>)}<th className={styles.rowActionHeader}>Delete</th></tr></thead>
                  <tbody>{block.rows.map(row => {
                    const rowSelected = snapshot.selectedRowIndex === row.index;
                    const rowDragging = draggingRow?.fromIndex === row.index;
                    const rowDropTarget = draggingRow?.overIndex === row.index;
                    const rowControlsDisabled = !connected || generating || deletingRowIndex !== null
                      || selectingRowIndex !== null || movingRow !== null;
                    return <tr
                      key={row.index}
                      className={`${rowSelected ? styles.selectedDataRow : ''} ${
                        rowDragging ? styles.draggingDataRow : ''
                      } ${rowDropTarget ? styles.dropTargetDataRow : ''}`}
                    ><ExcelDataRowControl
                      rowIndex={row.index}
                      groupName={`excel-data-selected-row-${blockIndex}`}
                      selected={rowSelected}
                      disabled={rowControlsDisabled}
                      dragging={rowDragging}
                      dropTarget={rowDropTarget}
                      onSelect={selectRow}
                      onDragStart={startRowDrag}
                      onDragOver={moveRowOver}
                      onDrop={dropRow}
                      onDragEnd={finishRowDrag}
                    /><td>{row.index + 1}</td>{block.columns.map(column => {
                    const executing = activeCell?.blockName === block.name
                      && activeCell.column === column
                      && activeCell.rowIndex === row.index;
                    return <td key={column} className={executing ? styles.activeCell : undefined}>
                      <input key={`${snapshot.mode}-${snapshot.datasetRevision ?? snapshot.loadedAt}-${column}-${row.index}`}
                        aria-label={`${block.name} ${column} row ${row.index + 1}`}
                        defaultValue={row.values[column] ?? ''}
                        disabled={generating || deletingRowIndex !== null || movingRow !== null}
                        onBlur={event => updateCell(block.name, column, row.index, event.currentTarget.value)} />
                      {executing && <b className={styles.executing}>EXECUTING</b>}
                    </td>;
                  })}<td className={styles.rowActionCell}><button type="button"
                    className={styles.rowDeleteButton}
                    aria-label={`Delete row ${row.index + 1}`}
                    title={`Delete row ${row.index + 1}`}
                    disabled={!connected || generating || deletingRowIndex !== null || selectingRowIndex !== null || movingRow !== null}
                    onClick={() => deleteRow(row.index)}><X size={14} aria-hidden="true" /></button></td></tr>;
                  })}</tbody>
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
              : pendingAction === 'CLEAR' ? 'Clear All Real Rows?'
              : pendingAction === 'SAVE' ? (snapshot?.mode === 'SYNTHETIC' ? 'Save Synthetic Memory Data?' : 'Save Memory Data to Excel?') : 'Recreate Excel Columns?'}
            body={pendingAction === 'SYNTHETIC'
              ? `Replace synthetic memory with ${syntheticRowCount} ${syntheticContext} test row${syntheticRowCount === 1 ? '' : 's'}? The real workbook will not be changed.`
              : pendingAction === 'CLEAR'
                ? 'Remove every REAL data row from memory while preserving the Excel columns?'
              : pendingAction === 'SAVE'
                ? snapshot?.mode === 'SYNTHETIC'
                  ? 'Save the current synthetic rows for this Bot Job and organization in the database?'
                  : 'Atomically replace the original Bot Job workbook with the current in-memory rows?'
                : 'Rebuild the active Bot Job workbook from its current Blocks and input fields while preserving existing row values?'}
            extraMsg={pendingAction === 'CLEAR'
              ? 'The original workbook remains unchanged until you choose Save to Excel.'
              : pendingAction === 'SAVE'
              ? 'Smoke Test and Test Run already use this shared memory dataset; saving makes it durable on disk.'
              : 'The in-memory dataset remains the authoritative source for this open Excel Data workspace.'}
            okLabel={pendingAction === 'SYNTHETIC' ? 'Generate in Memory' : pendingAction === 'CLEAR' ? 'Clean Rows' : pendingAction === 'SAVE' ? (snapshot?.mode === 'SYNTHETIC' ? 'Save DB' : 'Save to Excel') : 'Recreate Columns'}
            destructive={pendingAction !== 'SYNTHETIC'}
            onSubmit={() => pendingAction === 'SAVE' ? save() : pendingAction === 'CLEAR' ? clearRows() : generate(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
        <button type="button" className={styles.helpButton} aria-label="Open Excel Data rules"
          title="Excel Data rules" onClick={() => setHelpOpen(true)}>?</button>
        {helpOpen && <ExcelDataHelpModal onClose={() => setHelpOpen(false)} />}
        {alert && <QuestionsCard mode="alert" header={alert.title} body={alert.message}
          error okLabel="OK" onSubmit={() => setAlert(null)} onCancel={() => setAlert(null)} />}
      </main>
    </DetachedPageShell>
  );
};

export default ExcelDataPage;
