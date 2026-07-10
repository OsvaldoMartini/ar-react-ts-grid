import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './MainDashboard.module.scss';
import { useWebSocket } from './useWebSocket';

type StatusLevel = 'ok' | 'warn' | 'error';

interface MainDashboardProps {
  socketPort: number;
  sessionId: string;
}

interface BotJobRow {
  id: number;
  name: string;
  description?: string | null;
  priority?: string | null;
  active: boolean;
  homeBankingId?: number | null;
  homeUrlId?: number | null;
  organizationName?: string | null;
  environmentName?: string | null;
  environmentUrl?: string | null;
  blockCount?: number;
  launchable?: boolean;
}

function parseMessage(raw: string): { operationId?: string; body: any } {
  const outer = JSON.parse(raw);
  const operationId = outer.operationId || outer.type;
  const body = typeof outer.body === 'string' ? JSON.parse(outer.body) : outer.body ?? outer;
  return { operationId, body };
}

function responseMessage(body: any, fallback: string): string {
  return (
    body?.error?.errorMessage ||
    body?.error?.errorHeader ||
    body?.error?.errorTitle ||
    body?.message ||
    fallback
  );
}

const MainDashboard: React.FC<MainDashboardProps> = ({ socketPort, sessionId }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [botJobs, setBotJobs] = useState<BotJobRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BotJobRow | null>(null);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const selectedJob = useMemo(
    () => botJobs.find(row => row.id === selectedId) || null,
    [botJobs, selectedId],
  );

  const send = useCallback(
    (type: string, body: unknown = {}) => {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        setStatus({ level: 'warn', text: 'Socket is not connected yet' });
        return;
      }
      webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
    },
    [sessionId, webSocket],
  );

  const refresh = useCallback(() => {
    send('mainDashboard.list');
  }, [send]);

  useEffect(() => {
    if (connected) {
      refresh();
    }
  }, [connected, refresh]);

  useEffect(() => {
    if (error) {
      setStatus({ level: 'error', text: error });
    }
  }, [error]);

  useEffect(() => {
    const nextMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;
    for (const raw of nextMessages) {
      try {
        const { operationId, body } = parseMessage(raw);
        if (operationId === 'mainDashboard.listResponse') {
          const rows = Array.isArray(body.botJobs) ? body.botJobs : [];
          setBotJobs(rows);
          setSelectedId(prev => (prev && rows.some((row: BotJobRow) => row.id === prev) ? prev : null));
          setStatus({ level: 'ok', text: `Loaded ${rows.length} bot job${rows.length === 1 ? '' : 's'}` });
        } else if (operationId === 'mainDashboard.actionResponse') {
          if (Array.isArray(body.botJobs)) {
            setBotJobs(body.botJobs);
          }
          if (typeof body.selectedBotJobId === 'number') {
            setSelectedId(body.selectedBotJobId);
          }
          setStatus({
            level: body.ok === false ? 'error' : 'ok',
            text: responseMessage(body, 'Action completed'),
          });
        } else if (operationId === 'mainDashboard.status') {
          setStatus({
            level: body.level === 'error' ? 'error' : body.level === 'warning' ? 'warn' : 'ok',
            text: body.message || 'Status update',
          });
        }
      } catch (err) {
        console.warn('MainDashboard ignored socket message', err, raw);
      }
    }
  }, [messages]);

  const selectedRequired = (action: string, command: string) => {
    if (!selectedJob) {
      setStatus({ level: 'warn', text: `Select a Bot Job before ${action}` });
      return;
    }
    send(command, { botJobId: selectedJob.id });
  };

  const launchSelected = () => {
    if (!selectedJob) {
      setStatus({ level: 'warn', text: 'Select a Bot Job before Launch' });
      return;
    }
    if (selectedJob.launchable === false) {
      setStatus({ level: 'warn', text: 'Mobile Bot Jobs can only be executed from AR Mobile' });
      return;
    }
    send('mainDashboard.launchBotJob', { botJobId: selectedJob.id });
  };

  const confirmDeleteSelected = () => {
    if (!confirmDelete) return;
    send('mainDashboard.deleteBotJob', { botJobId: confirmDelete.id });
    setConfirmDelete(null);
  };

  const statusClass =
    status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={styles.shell}>
      <section className={styles.window}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>AR Web</h1>
            <p className={styles.subtitle}>Main Dashboard</p>
          </div>
          <div className={`${styles.status} ${statusClass}`}>{status.text}</div>
        </header>

        <div className={styles.commandBar}>
          <button type="button" className={styles.primaryBtn} onClick={() => send('mainDashboard.openOrganizations')}>
            Organizations
          </button>
          <button type="button" className={styles.commandBtn} onClick={() => send('mainDashboard.newBotJob')}>
            New Bot Job
          </button>
          <button type="button" className={styles.commandBtn} disabled={!selectedJob} onClick={() => selectedRequired('Clone', 'mainDashboard.cloneBotJob')}>
            Clone Job
          </button>
          <button type="button" className={styles.commandBtn} onClick={() => send('mainDashboard.openConfig')}>
            Config
          </button>
          <button type="button" className={styles.commandBtn} onClick={() => send('mainDashboard.openInfo')}>
            Info
          </button>
          <button type="button" className={styles.commandBtn} disabled={!selectedJob || selectedJob.launchable === false} onClick={launchSelected}>
            Launch
          </button>
          <button type="button" className={styles.commandBtn} disabled={!selectedJob} onClick={() => selectedRequired('Open Job', 'mainDashboard.openBotJob')}>
            Open Job
          </button>
          <button type="button" className={styles.commandBtn} onClick={refresh}>
            Refresh
          </button>
          <button type="button" className={styles.dangerBtn} onClick={() => send('mainDashboard.exit')}>
            Exit
          </button>
        </div>

        <section className={styles.gridPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Bot Jobs</span>
            <span className={styles.badge}>{botJobs.length}</span>
          </div>
          <div className={styles.gridWrap}>
            <table className={styles.grid}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Organization</th>
                  <th>Environment</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Blocks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {botJobs.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={9}>No Bot Jobs loaded</td>
                  </tr>
                ) : (
                  botJobs.map(row => (
                    <tr
                      key={row.id}
                      className={selectedId === row.id ? styles.selectedRow : undefined}
                      onClick={() => setSelectedId(row.id)}
                      onDoubleClick={() => send('mainDashboard.openBotJob', { botJobId: row.id })}
                    >
                      <td title={String(row.id)}>{row.id}</td>
                      <td title={row.name}>{row.name}</td>
                      <td title={row.description || ''}>{row.description || ''}</td>
                      <td title={row.organizationName || ''}>{row.organizationName || ''}</td>
                      <td title={row.environmentName || row.environmentUrl || ''}>{row.environmentName || row.environmentUrl || ''}</td>
                      <td title={row.priority || ''}>{row.priority || ''}</td>
                      <td>
                        <span className={row.active ? styles.activePill : styles.inactivePill}>
                          {row.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td title={String(row.blockCount || 0)}>{row.blockCount || 0}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.rowDeleteBtn}
                          title="Delete Bot Job"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(row.id);
                            setConfirmDelete(row);
                          }}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {confirmDelete && (
          <div className={styles.confirmBackdrop}>
            <div className={styles.confirmDialog}>
              <div className={styles.confirmHeader}>Bot Job Deletion</div>
              <div className={styles.confirmBody}>
                <p>Are you sure you want to delete this Bot Job?</p>
                <strong>({confirmDelete.id}) {confirmDelete.name}</strong>
                <p className={styles.confirmWarning}>This action removes all job data, including saved components.</p>
              </div>
              <div className={styles.confirmFooter}>
                <button type="button" className={styles.commandBtn} onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button type="button" className={styles.dangerBtn} onClick={confirmDeleteSelected}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default MainDashboard;
