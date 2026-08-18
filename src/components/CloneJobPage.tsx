import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import DetachedPageShell from './DetachedPageShell';
import GridTempA, { GridTempAColumn } from './GridTemp_A';
import PagesOpenButton from './PagesOpenButton';
import styles from './CloneJobPage.module.scss';
import { useWebSocket } from './useWebSocket';

type Props = {
  socketPort: number;
  sessionId: string;
  sourceBotJobId: number;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
  onClose?: () => void;
};

type StatusLevel = 'ok' | 'warn' | 'error';
type AppType = 'Web App' | 'Android' | 'iOS' | 'Rest Api';
type OperationFeedback = {
  id: number;
  title: string;
  message: string;
  detail?: string;
  error: boolean;
};

type SourceBotJob = {
  id: number;
  name: string;
  description?: string;
  priority?: string;
  homeBankingId: number;
  homeUrlId?: number | null;
  organizationName?: string | null;
  environmentName?: string | null;
  environmentUrl?: string | null;
};

type OrganizationRow = {
  id: number;
  name: string;
  activeJobs: number;
  url: string | null;
};

type EnvironmentRow = {
  id: number;
  name: string;
  url: string;
  homeBankingId: number;
  orgName: string;
};

const DEFAULT_APP_TYPES: AppType[] = ['Web App', 'Android', 'iOS', 'Rest Api'];

const ORGANIZATION_COLUMNS: readonly GridTempAColumn<OrganizationRow>[] = [
  {
    id: 'id',
    header: 'ID',
    width: 72,
    renderCell: row => row.id,
    sortValue: row => row.id,
    searchValue: row => row.id,
    title: row => String(row.id),
    headerTitle: 'Click to sort',
  },
  {
    id: 'organization',
    header: 'Organization',
    width: 170,
    renderCell: row => row.name,
    sortValue: row => row.name || '',
    searchValue: row => row.name || '',
    title: row => row.name,
    headerTitle: 'Click to sort',
  },
  {
    id: 'activeJobs',
    header: 'Active Jobs',
    width: 110,
    renderCell: row => row.activeJobs ?? 0,
    sortValue: row => row.activeJobs ?? 0,
    searchValue: row => row.activeJobs ?? 0,
    title: row => String(row.activeJobs ?? 0),
    headerTitle: 'Click to sort',
  },
  {
    id: 'url',
    header: 'URL Baseline',
    width: 268,
    renderCell: row => row.url || '-',
    sortValue: row => row.url || '',
    searchValue: row => row.url || '',
    title: row => row.url || '',
    headerTitle: 'Click to sort',
  },
];

const ENVIRONMENT_COLUMNS: readonly GridTempAColumn<EnvironmentRow>[] = [
  {
    id: 'id',
    header: 'ID',
    width: 72,
    renderCell: row => row.id,
    sortValue: row => row.id,
    searchValue: row => row.id,
    title: row => String(row.id),
    headerTitle: 'Click to sort',
  },
  {
    id: 'environment',
    header: 'Environment',
    width: 180,
    renderCell: row => row.name || 'TEST',
    sortValue: row => row.name || 'TEST',
    searchValue: row => row.name || 'TEST',
    title: row => row.name || 'TEST',
    headerTitle: 'Click to sort',
  },
  {
    id: 'url',
    header: 'URL',
    width: 360,
    renderCell: row => row.url || '-',
    sortValue: row => row.url || '',
    searchValue: row => row.url || '',
    title: row => row.url || '',
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
    body?.error?.errorMessage
    || body?.error?.errorHeader
    || body?.error?.errorTitle
    || body?.message
    || fallback
  );
}

function operationMessage(body: any, fallback: string): string {
  return typeof body?.message === 'string' && body.message.trim()
    ? body.message
    : fallback;
}

function operationErrorDetail(body: any): string | undefined {
  const detail = (
    body?.error?.errorMessage
    || body?.error?.errorHeader
    || body?.error?.errorTitle
  );
  return typeof detail === 'string' && detail.trim() && detail !== body?.message
    ? detail
    : undefined;
}

const CloneJobPage: React.FC<Props> = ({
  socketPort,
  sessionId,
  sourceBotJobId,
  onSessionOpen,
  onClose,
}) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const feedbackIdRef = useRef(0);
  const activeSourceIdRef = useRef(sourceBotJobId);
  const pendingCloneSourceIdRef = useRef<number | null>(null);
  const sourceRef = useRef<SourceBotJob | null>(null);
  const selectedOrganizationIdRef = useRef<number | null>(null);
  const environmentKeyRef = useRef('');
  const customTargetUrlRef = useRef(false);
  const [activeSourceBotJobId, setActiveSourceBotJobId] = useState(sourceBotJobId);
  const [source, setSource] = useState<SourceBotJob | null>(null);
  const [appTypes, setAppTypes] = useState<AppType[]>(DEFAULT_APP_TYPES);
  const [appType, setAppType] = useState<AppType>('Web App');
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentRow[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [environmentKey, setEnvironmentKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [operationFeedback, setOperationFeedback] = useState<OperationFeedback | null>(null);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const dismissOperationFeedback = useCallback(() => {
    setOperationFeedback(null);
  }, []);

  const showOperationFeedback = useCallback((
    title: string,
    message: string,
    detail: string | undefined,
    isError: boolean,
  ) => {
    feedbackIdRef.current += 1;
    setOperationFeedback({
      id: feedbackIdRef.current,
      title,
      message,
      detail,
      error: isError,
    });
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find(row => row.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId],
  );

  const organizationEnvironments = useMemo(
    () => selectedOrganizationId === null
      ? []
      : environments.filter(row => Number(row.homeBankingId) === Number(selectedOrganizationId)),
    [environments, selectedOrganizationId],
  );

  const selectedEnvironment = useMemo(
    () => organizationEnvironments.find(row => String(row.id) === environmentKey) || null,
    [environmentKey, organizationEnvironments],
  );

  const send = useCallback(
    (type: string, body: unknown = {}): boolean => {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        setStatus({ level: 'warn', text: 'Socket is not connected yet' });
        return false;
      }
      webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
      return true;
    },
    [sessionId, webSocket],
  );

  const resetForSource = useCallback((nextSourceId: number) => {
    activeSourceIdRef.current = nextSourceId;
    sourceRef.current = null;
    setActiveSourceBotJobId(nextSourceId);
    setSource(null);
    setOrganizations([]);
    setEnvironments([]);
    selectedOrganizationIdRef.current = null;
    environmentKeyRef.current = '';
    setSelectedOrganizationId(null);
    setEnvironmentKey('');
    setName('');
    setDescription('');
    setTargetUrl('');
    customTargetUrlRef.current = false;
    pendingCloneSourceIdRef.current = null;
    setSaving(false);
    setOperationFeedback(null);
    setStatus({ level: 'warn', text: 'Loading the selected source Bot Job' });
  }, []);

  useEffect(() => {
    if (
      Number.isSafeInteger(sourceBotJobId)
      && sourceBotJobId > 0
      && sourceBotJobId !== activeSourceIdRef.current
    ) {
      resetForSource(sourceBotJobId);
    }
  }, [resetForSource, sourceBotJobId]);

  useEffect(() => {
    if (connected && activeSourceBotJobId > 0) {
      send('cloneJob.bootstrap', { sourceBotJobId: activeSourceBotJobId });
    }
  }, [activeSourceBotJobId, connected, send]);

  useEffect(() => {
    if (!connected && saving) {
      pendingCloneSourceIdRef.current = null;
      setSaving(false);
      showOperationFeedback(
        'Clone Bot Job Failed',
        'The connection closed before the Bot Job could be cloned.',
        'Reconnect and try again.',
        true,
      );
    }
  }, [connected, saving, showOperationFeedback]);

  useEffect(() => {
    if (error) {
      const operationWasSaving = saving;
      pendingCloneSourceIdRef.current = null;
      setSaving(false);
      setStatus({ level: 'error', text: error });
      if (operationWasSaving) {
        showOperationFeedback(
          'Clone Bot Job Failed',
          'The Bot Job could not be cloned.',
          error,
          true,
        );
      }
    }
  }, [error, saving, showOperationFeedback]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const nextMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    for (const raw of nextMessages) {
      try {
        const { operationId, body } = parseMessage(raw);
        if (operationId === 'cloneJob.bootstrapResponse') {
          if (body.ok === false || !body.sourceBotJob) {
            setSaving(false);
            setStatus({
              level: 'error',
              text: responseMessage(body, 'Source Bot Job could not be loaded'),
            });
            continue;
          }

          const nextSource: SourceBotJob = body.sourceBotJob;
          if (Number(nextSource.id) !== activeSourceIdRef.current) {
            continue;
          }
          const organizationRows: OrganizationRow[] = Array.isArray(body.organizations)
            ? body.organizations
            : [];
          const environmentRows: EnvironmentRow[] = Array.isArray(body.environments)
            ? body.environments
            : [];
          const nextAppTypes: AppType[] = Array.isArray(body.appTypes) && body.appTypes.length > 0
            ? body.appTypes
            : DEFAULT_APP_TYPES;
          const initialOrganization = organizationRows.find(
            row => Number(row.id) === Number(nextSource.homeBankingId),
          ) || null;
          const initialEnvironment = environmentRows.find(
            row => (
              Number(row.homeBankingId) === Number(nextSource.homeBankingId)
              && (
                Number(row.id) === Number(nextSource.homeUrlId)
                || (
                  Boolean(nextSource.environmentUrl)
                  && row.url === nextSource.environmentUrl
                )
              )
            ),
          ) || null;

          sourceRef.current = nextSource;
          setSource(nextSource);
          setOrganizations(organizationRows);
          setEnvironments(environmentRows);
          setAppTypes(nextAppTypes);
          setAppType(
            nextAppTypes.includes(nextSource.priority as AppType)
              ? nextSource.priority as AppType
              : nextAppTypes[0],
          );
          setName(`${nextSource.name} Copy`);
          setDescription(nextSource.description || '');
          selectedOrganizationIdRef.current = initialOrganization?.id ?? null;
          environmentKeyRef.current = initialEnvironment ? String(initialEnvironment.id) : '';
          setSelectedOrganizationId(initialOrganization?.id ?? null);
          setEnvironmentKey(initialEnvironment ? String(initialEnvironment.id) : '');
          setTargetUrl(initialEnvironment?.url || nextSource.environmentUrl || '');
          customTargetUrlRef.current = false;
          setSaving(false);
          setStatus({
            level: 'ok',
            text: responseMessage(body, 'Clone Job loaded'),
          });
        } else if (operationId === 'cloneJob.environmentsResponse') {
          if (body.ok === false) {
            setStatus({
              level: 'error',
              text: responseMessage(body, 'Clone destinations could not be refreshed'),
            });
            continue;
          }
          const organizationRows: OrganizationRow[] = Array.isArray(body.organizations)
            ? body.organizations
            : [];
          const environmentRows: EnvironmentRow[] = Array.isArray(body.environments)
            ? body.environments
            : [];
          const currentOrganizationId = selectedOrganizationIdRef.current;
          const nextOrganizationId = currentOrganizationId !== null
            && organizationRows.some(row => Number(row.id) === Number(currentOrganizationId))
            ? currentOrganizationId
            : (
              sourceRef.current
              && organizationRows.some(
                row => Number(row.id) === Number(sourceRef.current?.homeBankingId),
              )
                ? sourceRef.current.homeBankingId
                : null
            );
          const organizationChanged = Number(nextOrganizationId) !== Number(currentOrganizationId);
          const currentEnvironment = environmentRows.find(row => (
            String(row.id) === environmentKeyRef.current
            && nextOrganizationId !== null
            && Number(row.homeBankingId) === Number(nextOrganizationId)
          ));
          const sourceEnvironment = !currentEnvironment
            && !customTargetUrlRef.current
            && sourceRef.current
            && Number(nextOrganizationId) === Number(sourceRef.current.homeBankingId)
            ? environmentRows.find(row => (
              Number(row.homeBankingId) === Number(sourceRef.current?.homeBankingId)
              && Number(row.id) === Number(sourceRef.current?.homeUrlId)
            ))
            : undefined;
          const nextEnvironment = currentEnvironment || sourceEnvironment;

          setOrganizations(organizationRows);
          setEnvironments(environmentRows);
          selectedOrganizationIdRef.current = nextOrganizationId;
          environmentKeyRef.current = nextEnvironment ? String(nextEnvironment.id) : '';
          setSelectedOrganizationId(nextOrganizationId);
          setEnvironmentKey(nextEnvironment ? String(nextEnvironment.id) : '');
          if (nextEnvironment) {
            setTargetUrl(nextEnvironment.url || '');
            customTargetUrlRef.current = false;
          } else if (organizationChanged || !customTargetUrlRef.current) {
            setTargetUrl('');
            customTargetUrlRef.current = false;
          }
          setStatus({
            level: 'ok',
            text: responseMessage(body, 'Clone destinations refreshed'),
          });
        } else if (operationId === 'cloneJob.cloneResponse') {
          const requestSourceId = pendingCloneSourceIdRef.current;
          pendingCloneSourceIdRef.current = null;
          setSaving(false);
          if (
            requestSourceId === null
            || requestSourceId !== activeSourceIdRef.current
          ) {
            continue;
          }
          const failed = body.ok === false;
          const message = operationMessage(
            body,
            failed ? 'The Bot Job could not be cloned.' : 'Bot Job cloned successfully',
          );
          setStatus({
            level: failed ? 'error' : 'ok',
            text: responseMessage(body, 'Clone completed'),
          });
          showOperationFeedback(
            failed ? 'Clone Bot Job Failed' : 'Bot Job Cloned',
            message,
            failed
              ? operationErrorDetail(body) || 'No Bot Job was cloned.'
              : body?.clonedBotJobId
                ? `Bot Job ID ${body.clonedBotJobId} is now available.`
                : 'The cloned Bot Job is now available.',
            failed,
          );
        } else if (operationId === 'cloneJob.actionResponse') {
          setStatus({
            level: body.ok === false ? 'error' : 'ok',
            text: responseMessage(body, 'Action completed'),
          });
        } else if (operationId === 'cloneJob.retarget') {
          const nextSourceId = Number(body.sourceBotJobId);
          if (Number.isSafeInteger(nextSourceId) && nextSourceId > 0) {
            try {
              window.focus();
            } catch {
              // Native focus is best-effort and may be refused by the window manager.
            }
            if (nextSourceId === activeSourceIdRef.current) {
              send('cloneJob.bootstrap', { sourceBotJobId: nextSourceId });
            } else {
              resetForSource(nextSourceId);
            }
          }
        } else if (operationId === 'react.session.open') {
          onSessionOpen?.(body.targetSession, body.port, body.botJobId);
        }
      } catch (messageError) {
        console.warn('CloneJobPage ignored socket message', messageError, raw);
      }
    }
  }, [messages, onSessionOpen, resetForSource, send, showOperationFeedback]);

  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId]);

  useEffect(() => {
    environmentKeyRef.current = environmentKey;
  }, [environmentKey]);

  useEffect(() => {
    if (!environmentKey) return;
    const environment = environments.find(row => String(row.id) === environmentKey);
    if (
      !environment
      || selectedOrganizationId === null
      || Number(environment.homeBankingId) !== Number(selectedOrganizationId)
    ) {
      environmentKeyRef.current = '';
      setEnvironmentKey('');
      if (!customTargetUrlRef.current) {
        setTargetUrl('');
      }
    }
  }, [environmentKey, environments, selectedOrganizationId]);

  const selectOrganization = (organization: OrganizationRow) => {
    selectedOrganizationIdRef.current = organization.id;
    setSelectedOrganizationId(organization.id);
    const currentEnvironment = environments.find(row => String(row.id) === environmentKey);
    if (
      !currentEnvironment
      || Number(currentEnvironment.homeBankingId) !== Number(organization.id)
    ) {
      environmentKeyRef.current = '';
      setEnvironmentKey('');
      setTargetUrl('');
      customTargetUrlRef.current = false;
    }
    setStatus({
      level: 'ok',
      text: `${organization.name} selected — now select an Environment`,
    });
  };

  const selectEnvironment = (environment: EnvironmentRow) => {
    environmentKeyRef.current = String(environment.id);
    setEnvironmentKey(String(environment.id));
    setTargetUrl(environment.url || '');
    customTargetUrlRef.current = false;
    setStatus({
      level: 'ok',
      text: `${environment.name || 'TEST'} selected for ${selectedOrganization?.name || environment.orgName}`,
    });
  };

  const cloneBotJob = () => {
    const trimmedName = name.trim();
    const trimmedUrl = targetUrl.trim();
    if (!source) {
      const message = 'Source Bot Job is not loaded';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Clone Bot Job Failed', message, undefined, true);
      return;
    }
    if (!trimmedName) {
      const message = 'New Bot Job name is required';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Clone Bot Job Failed', message, undefined, true);
      return;
    }
    if (!selectedOrganization) {
      const message = 'Select a target Organization';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Clone Bot Job Failed', message, undefined, true);
      return;
    }
    if (!trimmedUrl) {
      const message = 'Select an Environment or enter a target URL';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Clone Bot Job Failed', message, undefined, true);
      return;
    }

    pendingCloneSourceIdRef.current = source.id;
    setSaving(true);
    if (!send('cloneJob.create', {
      sourceBotJobId: source.id,
      name: trimmedName,
      description: description.trim(),
      priority: appType,
      homeBankingId: selectedOrganization.id,
      homeUrlId: selectedEnvironment?.id ?? null,
      url: trimmedUrl,
      createExcelDataFile: true,
      openAfterClone: false,
    })) {
      pendingCloneSourceIdRef.current = null;
      setSaving(false);
      showOperationFeedback(
        'Clone Bot Job Failed',
        'The Bot Job could not be cloned because the backend is not connected.',
        'Reconnect and try again.',
        true,
      );
    }
  };

  const closePage = () => {
    onClose?.();
  };

  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'ok'
      ? styles.statusOk
      : styles.statusWarn;

  return (
    <DetachedPageShell
      title="Clone Job"
      testId="clone-job-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <div className={styles.frame}>
        <main className={styles.shell}>
          <section className={styles.window}>
            <header className={styles.topBar} data-floating-workspace-drag-handle>
              <div className={styles.titleBlock}>
                <h1 className={styles.title}>Clone Job</h1>
                <p className={styles.subtitle}>
                  Clone an automation job into an Organization Environment
                </p>
              </div>
              <div className={styles.topBarRight} data-floating-drag-ignore="true">
                <div className={`${styles.status} ${statusClass}`} role="status">
                  {status.text}
                </div>
                <PagesOpenButton
                  webSocket={webSocket}
                  connected={connected}
                  messages={messages}
                  sessionId={sessionId}
                />
                <button
                  type="button"
                  className={styles.closeButton}
                  title="Close only this Clone Job window"
                  onClick={closePage}
                >
                  Close
                </button>
              </div>
            </header>

            <section className={styles.toolbar}>
              <button
                type="button"
                onClick={() => send('cloneJob.openOrganizations')}
                disabled={saving}
              >
                Organizations / Environments
              </button>
              <button
                type="button"
                onClick={() => send('cloneJob.environments', {
                  sourceBotJobId: activeSourceBotJobId,
                })}
                disabled={saving}
              >
                Refresh
              </button>
              <span className={styles.selectionHint}>
                The source Organization and Environment are selected automatically.
              </span>
            </section>

            <div className={styles.content}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>Source Bot Job</div>
                <div className={styles.sourceSummary}>
                  <div>
                    <span>Source</span>
                    <strong title={source?.name || ''}>
                      {source ? `(${source.id}) ${source.name}` : 'Loading...'}
                    </strong>
                  </div>
                  <div>
                    <span>Organization</span>
                    <strong title={source?.organizationName || ''}>
                      {source?.organizationName || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Environment</span>
                    <strong title={source?.environmentName || ''}>
                      {source?.environmentName || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Application Type</span>
                    <strong>{source?.priority || '-'}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>Cloned Bot Job Details</div>
                <div className={styles.formBody}>
                  <div className={styles.fieldsGrid}>
                    <label className={styles.fieldLabel}>
                      New Bot Job Name
                      <input
                        value={name}
                        maxLength={100}
                        onChange={event => setName(event.target.value)}
                        placeholder="Enter the cloned Bot Job name"
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      Description
                      <input
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        placeholder="Enter Description"
                      />
                    </label>
                    <label className={`${styles.fieldLabel} ${styles.fullField}`}>
                      Target URL
                      <input
                        value={targetUrl}
                        onChange={event => {
                          setTargetUrl(event.target.value);
                          environmentKeyRef.current = '';
                          setEnvironmentKey('');
                          customTargetUrlRef.current = true;
                        }}
                        placeholder="Select an Environment or enter a new URL"
                      />
                    </label>
                  </div>

                  <div className={styles.appTypeGroup}>
                    <span>Application Type</span>
                    <div className={styles.segmentRow} role="radiogroup" aria-label="Application type">
                      {appTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          role="radio"
                          aria-checked={appType === type}
                          className={`${styles.segmentButton} ${appType === type ? styles.segmentButtonActive : ''}`}
                          onClick={() => setAppType(type)}
                          disabled={saving}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.selectionSummary}>
                    <div>
                      <span>Target Organization</span>
                      <strong title={selectedOrganization?.name || ''}>
                        {selectedOrganization?.name || 'Not selected'}
                      </strong>
                    </div>
                    <div>
                      <span>Target Environment</span>
                      <strong title={selectedEnvironment?.name || ''}>
                        {selectedEnvironment?.name || (targetUrl ? 'Custom URL' : 'Not selected')}
                      </strong>
                    </div>
                    <div>
                      <span>Target URL</span>
                      <strong title={targetUrl}>
                        {targetUrl || '-'}
                      </strong>
                    </div>
                  </div>
                </div>
                <footer className={styles.formFooter}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    disabled={saving}
                    onClick={closePage}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.createButton}
                    disabled={
                      saving
                      || !source
                      || !name.trim()
                      || !selectedOrganization
                      || !targetUrl.trim()
                    }
                    onClick={cloneBotJob}
                  >
                    {saving ? 'Cloning...' : 'Clone Bot Job'}
                  </button>
                </footer>
              </section>

              <div className={styles.selectionGrids}>
                <GridTempA
                  title="Organizations"
                  rows={organizations}
                  columns={ORGANIZATION_COLUMNS}
                  rowKey={row => row.id}
                  emptyMessage="No organizations loaded"
                  find={{
                    inputId: 'clone-job-organizations-find',
                    label: 'Find:',
                    placeholder: 'ID, Organization, Active Jobs or URL Baseline',
                    clearTitle: 'Clear Find',
                    noMatchesMessage: 'No organizations match Find',
                  }}
                  className={styles.gridPanel}
                  minTableWidth={620}
                  maxViewportHeight="min(42dvh, 360px)"
                  selectedRowKey={selectedOrganizationId}
                  initialSort={{ columnId: 'id', direction: 'asc' }}
                  onRowClick={selectOrganization}
                  ariaLabel="Clone Job Organizations"
                  testId="clone-job-organizations-grid"
                />

                {selectedOrganization && (
                  <GridTempA
                    key={selectedOrganization.id}
                    title={`${selectedOrganization.name} Environment List`}
                    rows={organizationEnvironments}
                    columns={ENVIRONMENT_COLUMNS}
                    rowKey={row => row.id}
                    emptyMessage="No environments are configured for this organization"
                    find={{
                      inputId: `clone-job-environments-${selectedOrganization.id}-find`,
                      label: 'Find:',
                      placeholder: 'ID, Environment or URL',
                      clearTitle: 'Clear Find',
                      noMatchesMessage: 'No environments match Find',
                    }}
                    className={styles.gridPanel}
                    minTableWidth={610}
                    maxViewportHeight="min(42dvh, 360px)"
                    selectedRowKey={selectedEnvironment?.id ?? null}
                    initialSort={{ columnId: 'id', direction: 'asc' }}
                    onRowClick={selectEnvironment}
                    ariaLabel={`${selectedOrganization.name} Environments`}
                    testId="clone-job-environments-grid"
                  />
                )}
              </div>
            </div>
          </section>
        </main>
        {operationFeedback && (
          <ConfirmationDialog
            key={operationFeedback.id}
            alert
            title={operationFeedback.title}
            message={operationFeedback.message}
            detail={operationFeedback.detail}
            error={operationFeedback.error}
            confirmLabel="Close"
            showHeaderClose
            autoDismissMs={3000}
            onCancel={dismissOperationFeedback}
            onConfirm={dismissOperationFeedback}
          />
        )}
      </div>
    </DetachedPageShell>
  );
};

export default CloneJobPage;
