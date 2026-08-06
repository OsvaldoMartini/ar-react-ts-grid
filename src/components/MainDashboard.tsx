import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, ChevronDown, FlaskConical, GripHorizontal, ShieldCheck, Trash2, User } from 'lucide-react';
import AutoTestWorkspace, { AutomationTestCatalog } from './auto-test/AutoTestWorkspace';
import ConfirmationDialog from './ConfirmationDialog';
import FloatingWorkspaceFrame from './workspace/FloatingWorkspaceFrame';
import GridTempA, { GridTempAColumn } from './GridTemp_A';
import PagesOpenButton from './PagesOpenButton';
import { RulesCard } from './RulesCard';
import styles from './MainDashboard.module.scss';
import { useWebSocket } from './useWebSocket';

type StatusLevel = 'ok' | 'warn' | 'error';
const AUTO_TEST_INLINE_PAGE_ID = 'autoTest';

interface MainDashboardProps {
  socketPort: number;
  sessionId: string;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
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

interface LicenseProfile {
  active?: boolean;
  status?: string;
  statusCode?: string;
  organization?: string;
  owner?: string;
  licensedUser?: string;
}

interface DeleteConfirmation {
  kind: 'single' | 'selected';
  rows: readonly BotJobRow[];
}

const BOT_JOB_COLUMNS: readonly GridTempAColumn<BotJobRow>[] = [
  {
    id: 'id',
    header: 'ID',
    width: 58,
    renderCell: row => row.id,
    sortValue: row => row.id,
    title: row => String(row.id),
    headerTitle: 'Click to sort',
  },
  {
    id: 'name',
    header: 'Name',
    width: 190,
    renderCell: row => row.name,
    sortValue: row => row.name || '',
    searchValue: row => row.name || '',
    title: row => row.name,
    headerTitle: 'Click to sort',
  },
  {
    id: 'description',
    header: 'Description',
    width: 280,
    renderCell: row => row.description || '',
    sortValue: row => row.description || '',
    searchValue: row => row.description || '',
    title: row => row.description || '',
    headerTitle: 'Click to sort',
  },
  {
    id: 'organization',
    header: 'Organization',
    width: 150,
    renderCell: row => row.organizationName || '',
    sortValue: row => row.organizationName || '',
    searchValue: row => row.organizationName || '',
    title: row => row.organizationName || '',
    headerTitle: 'Click to sort',
  },
  {
    id: 'environment',
    header: 'Environment',
    width: 150,
    renderCell: row => row.environmentName || row.environmentUrl || '',
    sortValue: row => row.environmentName || row.environmentUrl || '',
    searchValue: row => [row.environmentName, row.environmentUrl],
    title: row => row.environmentName || row.environmentUrl || '',
    headerTitle: 'Click to sort',
  },
  {
    id: 'type',
    header: 'Type',
    width: 92,
    renderCell: row => row.priority || '',
    sortValue: row => row.priority || '',
    searchValue: row => row.priority || '',
    title: row => row.priority || '',
    headerTitle: 'Click to sort',
  },
  {
    id: 'status',
    header: 'Status',
    width: 82,
    renderCell: row => (
      <span className={row.active ? styles.activePill : styles.inactivePill}>
        {row.active ? 'Active' : 'Inactive'}
      </span>
    ),
    sortValue: row => row.active ? 0 : 1,
    searchValue: row => row.active ? 'Active' : 'Inactive',
    searchMode: 'exact',
    headerTitle: 'Click to sort',
  },
  {
    id: 'blocks',
    header: 'Blocks',
    width: 62,
    alignment: 'right',
    renderCell: row => row.blockCount || 0,
    sortValue: row => row.blockCount || 0,
    title: row => String(row.blockCount || 0),
    headerTitle: 'Click to sort',
  },
];

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

const initialDashboardPosition = () => {
  const width = Math.min(1240, Math.max(0, window.innerWidth - 32));
  const height = Math.min(820, Math.max(0, window.innerHeight - 32));
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
  };
};

const desktopShellPosition = () => ({ x: 0, y: 0 });

const MainDashboard: React.FC<MainDashboardProps> = ({ socketPort, sessionId, onSessionOpen }) => {
  useEffect(() => {
    document.title = 'Main';
  }, []);
  const desktopShell = new URLSearchParams(window.location.search).get('desktopShell') === '1';
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const shutdownRequestedRef = useRef(false);
  const reportedAutoTestStateRef = useRef<boolean | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
  const pendingBulkDeleteRequestRef = useRef<string | null>(null);
  const bulkDeleteTimeoutRef = useRef<number | null>(null);
  const bulkDeleteReconciliationRequestedRef = useRef(false);
  const [botJobs, setBotJobs] = useState<BotJobRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedBotJobIds, setSelectedBotJobIds] = useState<Set<number>>(() => new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [licenseProfile, setLicenseProfile] = useState<LicenseProfile | null>(null);
  const [autoTestOpen, setAutoTestOpen] = useState(false);
  const [testCatalog, setTestCatalog] = useState<AutomationTestCatalog | null>(null);
  const [testCatalogLoading, setTestCatalogLoading] = useState(false);
  const [testCatalogError, setTestCatalogError] = useState('');
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
        return false;
      }
      try {
        webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
        return true;
      } catch (sendError) {
        setStatus({
          level: 'error',
          text: sendError instanceof Error ? sendError.message : 'The request could not be sent',
        });
        return false;
      }
    },
    [sessionId, webSocket],
  );

  const clearBulkDeleteTimeout = useCallback(() => {
    if (bulkDeleteTimeoutRef.current == null) return;
    window.clearTimeout(bulkDeleteTimeoutRef.current);
    bulkDeleteTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    const loadedIds = new Set(botJobs.map(row => row.id));
    setSelectedBotJobIds(previous => {
      const next = new Set([...previous].filter(id => loadedIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [botJobs]);

  useEffect(() => {
    if (connected) return;
    clearBulkDeleteTimeout();
    pendingBulkDeleteRequestRef.current = null;
    bulkDeleteReconciliationRequestedRef.current = false;
    setBulkDeletePending(false);
  }, [clearBulkDeleteTimeout, connected]);

  useEffect(() => () => clearBulkDeleteTimeout(), [clearBulkDeleteTimeout]);

  const loadedSelectedBotJobIds = useMemo(
    () => new Set(botJobs.filter(row => selectedBotJobIds.has(row.id)).map(row => row.id)),
    [botJobs, selectedBotJobIds],
  );
  const selectedBotJobCount = loadedSelectedBotJobIds.size;
  const allLoadedBotJobsSelected = botJobs.length > 0 && selectedBotJobCount === botJobs.length;
  const someLoadedBotJobsSelected = selectedBotJobCount > 0 && !allLoadedBotJobsSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someLoadedBotJobsSelected;
    }
  }, [someLoadedBotJobsSelected]);

  const toggleBotJobSelection = useCallback((botJobId: number, checked: boolean) => {
    setSelectedBotJobIds(previous => {
      const next = new Set(previous);
      if (checked) next.add(botJobId);
      else next.delete(botJobId);
      return next;
    });
  }, []);

  const toggleAllBotJobs = useCallback((checked: boolean) => {
    setSelectedBotJobIds(checked ? new Set(botJobs.map(row => row.id)) : new Set());
  }, [botJobs]);

  const dashboardColumns = useMemo<readonly GridTempAColumn<BotJobRow>[]>(() => [
    {
      id: 'selected',
      header: (
        <input
          ref={selectAllCheckboxRef}
          type="checkbox"
          className={styles.selectionCheckbox}
          checked={allLoadedBotJobsSelected}
          disabled={botJobs.length === 0 || bulkDeletePending}
          aria-label={`${allLoadedBotJobsSelected ? 'Unselect' : 'Select'} all loaded Bot Jobs`}
          title="Select or unselect all loaded Bot Jobs"
          onChange={event => toggleAllBotJobs(event.target.checked)}
        />
      ),
      width: 42,
      alignment: 'center',
      className: styles.selectionColumn,
      renderCell: row => {
        const checked = loadedSelectedBotJobIds.has(row.id);
        return (
          <input
            type="checkbox"
            className={styles.selectionCheckbox}
            checked={checked}
            disabled={bulkDeletePending}
            aria-label={`${checked ? 'Unselect' : 'Select'} Bot Job #${row.id} ${row.name}`}
            title={`${checked ? 'Unselect' : 'Select'} Bot Job #${row.id} ${row.name}`}
            onClick={event => event.stopPropagation()}
            onDoubleClick={event => event.stopPropagation()}
            onChange={event => toggleBotJobSelection(row.id, event.target.checked)}
          />
        );
      },
    },
    ...BOT_JOB_COLUMNS,
  ], [
    allLoadedBotJobsSelected,
    botJobs.length,
    bulkDeletePending,
    loadedSelectedBotJobIds,
    toggleAllBotJobs,
    toggleBotJobSelection,
  ]);

  const requestApplicationShutdown = useCallback(() => {
    if (shutdownRequestedRef.current) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus({ level: 'warn', text: 'Socket is not connected yet' });
      return;
    }

    shutdownRequestedRef.current = true;
    try {
      webSocket.send(JSON.stringify({
        type: 'mainDashboard.exit',
        sessionId,
        body: JSON.stringify({ reason: 'EXIT_BUTTON' }),
      }));
    } catch (shutdownError) {
      shutdownRequestedRef.current = false;
      setStatus({
        level: 'error',
        text: shutdownError instanceof Error
          ? shutdownError.message
          : 'The application shutdown request could not be sent',
      });
    }
  }, [sessionId, webSocket]);

  const refresh = useCallback(() => {
    send('mainDashboard.list');
  }, [send]);

  const loadTestCatalog = useCallback(() => {
    if (!connected) {
      setTestCatalogLoading(false);
      setTestCatalogError('The dashboard is not connected to the backend.');
      return;
    }
    setTestCatalogLoading(true);
    setTestCatalogError('');
    send('automationTests.list');
  }, [connected, send]);

  useEffect(() => {
    if (connected) {
      refresh();
      send('license.bootstrap');
    }
  }, [connected, refresh, send]);

  useEffect(() => {
    if (!connected) {
      reportedAutoTestStateRef.current = null;
      return;
    }
    if (reportedAutoTestStateRef.current === autoTestOpen) return;

    reportedAutoTestStateRef.current = autoTestOpen;
    send('pagesOpen.inlineState', {
      pageId: AUTO_TEST_INLINE_PAGE_ID,
      pageKey: AUTO_TEST_INLINE_PAGE_ID,
      title: 'Auto Test',
      kind: 'INLINE',
      open: autoTestOpen,
      isOpen: autoTestOpen,
    });
  }, [autoTestOpen, connected, send]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [userMenuOpen]);

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
          if (bulkDeleteReconciliationRequestedRef.current) {
            clearBulkDeleteTimeout();
            pendingBulkDeleteRequestRef.current = null;
            bulkDeleteReconciliationRequestedRef.current = false;
            setBulkDeletePending(false);
          }
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
        } else if (operationId === 'mainDashboard.deleteBotJobsResponse') {
          const responseRequestId = String(body?.requestId || '');
          if (!responseRequestId || responseRequestId !== pendingBulkDeleteRequestRef.current) {
            continue;
          }
          clearBulkDeleteTimeout();
          pendingBulkDeleteRequestRef.current = null;
          bulkDeleteReconciliationRequestedRef.current = false;
          setBulkDeletePending(false);
          if (Array.isArray(body.botJobs)) {
            setBotJobs(body.botJobs);
          }
          const committed = body?.committed === true;
          if (committed && Array.isArray(body.deletedBotJobIds)) {
            const deletedIds = new Set<number>(
              body.deletedBotJobIds
                .map((value: unknown) => Number(value))
                .filter((value: number) => Number.isSafeInteger(value) && value > 0),
            );
            setSelectedBotJobIds(previous => new Set(
              [...previous].filter(id => !deletedIds.has(id)),
            ));
            setSelectedId(previous => previous != null && deletedIds.has(previous) ? null : previous);
            if (!Array.isArray(body.botJobs)) {
              setBotJobs(previous => previous.filter(row => !deletedIds.has(row.id)));
            }
          }
          setStatus({
            level: body.ok === false ? 'error' : 'ok',
            text: responseMessage(body, 'Selected Bot Jobs deleted'),
          });
        } else if (operationId === 'mainDashboard.status') {
          setStatus({
            level: body.level === 'error' ? 'error' : body.level === 'warning' ? 'warn' : 'ok',
            text: body.message || 'Status update',
          });
        } else if (operationId === 'license.statusChanged') {
          setLicenseProfile(previous => ({ ...previous, ...body }));
          setStatus({
            level: body.active === true ? 'ok' : 'error',
            text: body.active === true
              ? (body.message || 'License active')
              : (body.error || body.status || 'License activation is required'),
          });
        } else if (operationId === 'license.bootstrapResponse' || operationId === 'license.statusResponse') {
          setLicenseProfile(body);
        } else if (operationId === 'automationTests.listResponse') {
          setTestCatalogLoading(false);
          if (body?.ok === false) {
            setTestCatalogError(body.error || 'The automation catalog could not be loaded.');
          } else {
            setTestCatalog(body as AutomationTestCatalog);
            setTestCatalogError('');
          }
        } else if (operationId === 'pagesOpen.openResponse') {
          setStatus({
            level: body?.ok === false ? 'error' : 'ok',
            text: responseMessage(body, 'Pages Open workspace opened'),
          });
        } else if (operationId === 'pagesOpen.inlineClose') {
          const targetSessionId = String(body?.sessionId || body?.targetSessionId || '');
          if (!targetSessionId || targetSessionId === sessionId) {
            setAutoTestOpen(false);
          }
        } else if (operationId === 'react.session.open') {
          onSessionOpen?.(body.targetSession, body.port, body.botJobId);
        }
      } catch (err) {
        console.warn('MainDashboard ignored socket message', err, raw);
      }
    }
  }, [clearBulkDeleteTimeout, messages, onSessionOpen, sessionId]);

  const openAutoTest = () => {
    setUserMenuOpen(false);
    setAutoTestOpen(true);
    if (!testCatalog) loadTestCatalog();
  };

  const openPagesOpen = () => {
    setUserMenuOpen(false);
    send('pagesOpen.open');
  };

  const licensedUser = licenseProfile?.owner || licenseProfile?.licensedUser || 'Licensed user';
  const licenseDetail = licenseProfile?.owner && licenseProfile?.licensedUser
    ? licenseProfile.licensedUser
    : licenseProfile?.organization || 'AR Web';

  const selectedRequired = (action: string, command: string) => {
    if (!selectedJob) {
      setStatus({ level: 'warn', text: `Select a Bot Job before ${action}` });
      return;
    }
    send(command, { botJobId: selectedJob.id });
  };

  // The backend opens Bot Job Details in another Chromium application window. Keeping window.open
  // out of this path prevents a normal browser tab/address bar from appearing.
  const openBotJob = (targetBotJobId: number) => {
    send('mainDashboard.openBotJob', { botJobId: targetBotJobId });
  };

  const openSelectedBotJob = () => {
    if (!selectedJob) {
      setStatus({ level: 'warn', text: 'Select a Bot Job before Open Job' });
      return;
    }
    openBotJob(selectedJob.id);
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

  const requestDeleteSelectedBotJobs = () => {
    const selectedRows = botJobs.filter(row => loadedSelectedBotJobIds.has(row.id));
    if (selectedRows.length === 0) {
      setStatus({ level: 'warn', text: 'Select one or more Bot Jobs before Delete All' });
      return;
    }
    setDeleteConfirmation({ kind: 'selected', rows: selectedRows });
  };

  const confirmBotJobDeletion = () => {
    if (!deleteConfirmation || deleteConfirmation.rows.length === 0) return;
    if (deleteConfirmation.kind === 'single') {
      send('mainDashboard.deleteBotJob', { botJobId: deleteConfirmation.rows[0].id });
      setDeleteConfirmation(null);
      return;
    }

    const requestId = `${Date.now()}-main-dashboard-delete-selected`;
    const botJobIds = deleteConfirmation.rows.map(row => row.id);
    pendingBulkDeleteRequestRef.current = requestId;
    const sent = send('mainDashboard.deleteBotJobs', {
      contractVersion: 1,
      requestId,
      botJobIds,
    });
    if (sent) {
      setBulkDeletePending(true);
      clearBulkDeleteTimeout();
      bulkDeleteTimeoutRef.current = window.setTimeout(() => {
        if (pendingBulkDeleteRequestRef.current !== requestId) return;
        bulkDeleteReconciliationRequestedRef.current = true;
        setStatus({
          level: 'warn',
          text: 'Delete response timed out. Refreshing Bot Jobs to verify the result.',
        });
        if (!send('mainDashboard.list')) {
          pendingBulkDeleteRequestRef.current = null;
          bulkDeleteReconciliationRequestedRef.current = false;
          setBulkDeletePending(false);
        }
      }, 30_000);
    } else {
      pendingBulkDeleteRequestRef.current = null;
    }
    setDeleteConfirmation(null);
  };

  const deleteConfirmationNames = deleteConfirmation
    ? deleteConfirmation.rows
      .slice(0, 8)
      .map(row => `#${row.id} ${row.name}`)
      .join('\n')
    : '';
  const deleteConfirmationOverflow = deleteConfirmation && deleteConfirmation.rows.length > 8
    ? `\n…and ${deleteConfirmation.rows.length - 8} more`
    : '';

  const statusClass =
    status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={[styles.shell, desktopShell ? styles.desktopShell : ''].filter(Boolean).join(' ')}>
      <FloatingWorkspaceFrame
        className={[styles.window, desktopShell ? styles.desktopShellWindow : ''].filter(Boolean).join(' ')}
        initialPosition={desktopShell ? desktopShellPosition : initialDashboardPosition}
        edgeMargin={desktopShell ? 0 : 8}
        dragEnabled={!desktopShell}
        aria-label="Main Dashboard"
        data-testid="main-dashboard-workspace"
      >
        <header
          className={styles.topBar}
          data-testid="main-dashboard-drag-handle"
          data-floating-workspace-drag-handle
        >
          <div className={styles.titleBlock}>
            <GripHorizontal className={styles.dragGrip} size={18} aria-hidden="true" />
            <div className={styles.titleText}>
              <h1 className={styles.title}>AR Web</h1>
              <p className={styles.subtitle}>Main Dashboard</p>
            </div>
          </div>
          <div className={styles.topBarRight} data-floating-drag-ignore>
            <div className={`${styles.status} ${statusClass}`}>{status.text}</div>
            <PagesOpenButton
              webSocket={webSocket}
              connected={connected}
              messages={messages}
              sessionId={sessionId}
            />
            <div className={styles.userMenu} ref={userMenuRef}>
              <button
                type="button"
                className={styles.userMenuTrigger}
                aria-label="Open user menu"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen(open => !open)}
              >
                <span className={styles.userAvatar}><User size={15} aria-hidden="true" /></span>
                <span className={styles.userTriggerText}>
                  <strong>{licensedUser}</strong>
                  <small>{licenseProfile?.active ? 'Licensed' : 'License status'}</small>
                </span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {userMenuOpen && (
                <div className={styles.userDropdown} role="menu" aria-label="User menu">
                  <div className={styles.licenseIdentity}>
                    <span className={styles.identityIcon}><User size={19} aria-hidden="true" /></span>
                    <span className={styles.identityText}>
                      <small>Licensed user</small>
                      <strong>{licensedUser}</strong>
                      <em>{licenseDetail}</em>
                    </span>
                    <span className={licenseProfile?.active ? styles.licenseActive : styles.licenseUnknown}>
                      <ShieldCheck size={13} aria-hidden="true" />
                      {licenseProfile?.status || 'Checking license'}
                    </span>
                  </div>
                  <button type="button" role="menuitem" className={styles.autoTestMenuItem} onClick={openAutoTest}>
                    <FlaskConical size={19} aria-hidden="true" />
                    <span>
                      <strong>Auto Test</strong>
                      <small>Browse every automation test</small>
                    </span>
                  </button>
                  <button type="button" role="menuitem" className={styles.autoTestMenuItem} onClick={openPagesOpen}>
                    <AppWindow size={19} aria-hidden="true" />
                    <span>
                      <strong>Pages Open</strong>
                      <small>View and close every open page</small>
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button type="button" className={styles.dangerBtn} onClick={requestApplicationShutdown}>
              Exit
            </button>
          </div>
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
          <button type="button" className={styles.commandBtn} disabled={!selectedJob} onClick={openSelectedBotJob}>
            Open Job
          </button>
          <button type="button" className={styles.commandBtn} onClick={refresh}>
            Refresh
          </button>
        </div>

        <GridTempA
          title="Bot Jobs"
          rows={botJobs}
          columns={dashboardColumns}
          rowKey={row => row.id}
          actions={{
            header: (
              <RulesCard
                event={{ color: 'red', rules: 'ALL', ts: 1 }}
                className={styles.bulkDeleteControl}
                ariaLabel="Delete selected Bot Jobs"
                glow={false}
                border
                animate={false}
                iconNode={<Trash2 size={12} aria-hidden="true" />}
                title={selectedBotJobCount > 0
                  ? `Delete ${selectedBotJobCount} selected Bot Job${selectedBotJobCount === 1 ? '' : 's'}`
                  : 'Select one or more Bot Jobs to delete'}
                onClick={requestDeleteSelectedBotJobs}
                disabled={selectedBotJobCount === 0 || bulkDeletePending}
              />
            ),
            width: 76,
            alignment: 'center',
            render: row => (
              <button
                type="button"
                className={styles.rowDeleteBtn}
                title="Delete Bot Job"
                disabled={bulkDeletePending}
                onClick={() => {
                  setSelectedId(row.id);
                  setDeleteConfirmation({ kind: 'single', rows: [row] });
                }}
              >
                X
              </button>
            ),
          }}
          emptyMessage="No Bot Jobs loaded"
          find={{
            inputId: 'main-dashboard-find',
            label: 'Find:',
            placeholder: 'Name, Description, Organization, Environment, Type or Status',
            clearTitle: 'Clear Find',
            noMatchesMessage: 'No Bot Jobs match Find',
          }}
          className={styles.gridPanel}
          minTableWidth={1102}
          maxViewportHeight="none"
          selectedRowKey={selectedId}
          initialSort={{ columnId: 'id', direction: 'asc' }}
          onRowClick={row => setSelectedId(row.id)}
          onRowDoubleClick={row => openBotJob(row.id)}
          ariaLabel="Bot Jobs"
          testId="main-dashboard-bot-jobs-grid"
        />

        {deleteConfirmation && (
          <ConfirmationDialog
            title={deleteConfirmation.kind === 'single'
              ? 'Bot Job Deletion'
              : 'Delete Selected Bot Jobs'}
            message={deleteConfirmation.kind === 'single'
              ? 'Are you sure you want to delete this Bot Job?\nThis action removes all job data, including saved components.'
              : `Delete ${deleteConfirmation.rows.length} selected Bot Job${deleteConfirmation.rows.length === 1 ? '' : 's'}?\nThis action removes all selected job data, including saved components.`}
            detail={deleteConfirmation.kind === 'single'
              ? `(${deleteConfirmation.rows[0].id}) ${deleteConfirmation.rows[0].name}`
              : `${deleteConfirmationNames}${deleteConfirmationOverflow}`}
            confirmLabel={deleteConfirmation.kind === 'single' ? 'Delete' : 'Delete selected'}
            destructive
            initialFocus="cancel"
            onConfirm={confirmBotJobDeletion}
            onCancel={() => setDeleteConfirmation(null)}
          />
        )}
        {autoTestOpen && (
          <AutoTestWorkspace
            catalog={testCatalog}
            loading={testCatalogLoading}
            error={testCatalogError}
            onRefresh={loadTestCatalog}
            onClose={() => setAutoTestOpen(false)}
          />
        )}
      </FloatingWorkspaceFrame>
    </main>
  );
};

export default MainDashboard;
