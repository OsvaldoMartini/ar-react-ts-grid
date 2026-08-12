import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import ExcelWriteManagerWorkspace from './excel-write-manager/ExcelWriteManagerWorkspace';
import type { ExcelWriteFlushPolicy } from './excel-write-manager/domain/excelWriteManager';
import {
  EXCEL_WRITER_MANAGER_SESSION_ID,
  excelWriterManagerChannelName,
  isExcelWriterManagerMessage,
  type ExcelWriterManagerSnapshot,
} from './excel-write-manager/domain/excelWriterManagerBridge';
import styles from './ExcelWriterManagerPage.module.scss';

export { EXCEL_WRITER_MANAGER_SESSION_ID };

type Props = { socketPort: number; sessionId: string; sourceBotJobId?: number; onClose?: () => void };

const ExcelWriterManagerPage: React.FC<Props> = ({ socketPort, sessionId, sourceBotJobId, onClose }) => {
  const botJobId = useMemo(() => {
    if (Number.isInteger(sourceBotJobId) && Number(sourceBotJobId) > 0) return Number(sourceBotJobId);
    const value = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isInteger(value) && value > 0 ? value : 0;
  }, [sourceBotJobId]);
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [snapshot, setSnapshot] = useState<ExcelWriterManagerSnapshot | null>(null);

  useEffect(() => { document.title = 'ExcelWriter Manager'; }, []);

  useEffect(() => {
    if (botJobId < 1 || typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(excelWriterManagerChannelName(botJobId));
    channelRef.current = channel;
    channel.onmessage = event => {
      if (!isExcelWriterManagerMessage(event.data, botJobId) || event.data.type !== 'STATE') return;
      setSnapshot(event.data);
    };
    channel.postMessage({ type: 'REQUEST_STATE', botJobId });
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, [botJobId]);

  const post = useCallback((message: Record<string, unknown>) => {
    if (botJobId < 1) return;
    channelRef.current?.postMessage({ ...message, botJobId });
  }, [botJobId]);

  const statusReady = snapshot !== null;
  return (
    <DetachedPageShell title="ExcelWriter Manager" testId="excel-writer-manager-page"
      onClose={undefined} showCloseButton={false}>
      <main className={styles.shell}>
        <header className={styles.topBar} data-floating-workspace-drag-handle>
          <div className={styles.titleBlock}>
            <FileSpreadsheet size={22} aria-hidden="true" />
            <span><small>React execution memory</small><h1>ExcelWriter Manager</h1></span>
          </div>
          <div className={styles.actions} data-floating-drag-ignore="true">
            <span className={`${styles.status} ${statusReady ? styles.statusReady : styles.statusWaiting}`} role="status">
              {statusReady ? `Bot Job #${snapshot.botJobId} · ${snapshot.state.files.length} file(s)` : 'Waiting for Smoke Test memory'}
            </span>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <section className={styles.body}>
          <div className={styles.manager}>
            {snapshot ? (
              <ExcelWriteManagerWorkspace
                state={snapshot.state}
                busy={snapshot.busy}
                policyLocked={snapshot.policyLocked}
                onPolicyChange={(policy: ExcelWriteFlushPolicy) => post({ type: 'POLICY_CHANGE', policy })}
                onCellChange={(fileId, rowIndex, column, value) => post({ type: 'CELL_CHANGE', fileId, rowIndex, column, value })}
                onSave={() => post({ type: 'SAVE' })}
              />
            ) : (
              <div className={styles.empty}>
                <FileSpreadsheet size={34} aria-hidden="true" />
                <strong>Waiting for ExcelWriter memory</strong>
                <span>Keep the matching Smoke Test page open. ExcelWrite files appear here as commands arrive.</span>
                <span>{botJobId > 0 ? `Bot Job #${botJobId}` : 'No Bot Job owner was supplied.'}</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default ExcelWriterManagerPage;
