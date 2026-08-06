import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import DetachedPageShell from './DetachedPageShell';
import GridTempA, { GridTempAColumn } from './GridTemp_A';
import PagesOpenButton from './PagesOpenButton';
import styles from './NewBotJobPage.module.scss';
import { useWebSocket } from './useWebSocket';

type Props = {
  socketPort: number;
  sessionId: string;
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

const DEFAULT_APP_TYPES: AppType[] = ['Web App', 'Android', 'iOS'];

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

const NewBotJobPage: React.FC<Props> = ({
  socketPort,
  sessionId,
  onSessionOpen,
  onClose,
}) => {
  useEffect(() => { document.title = 'New Bot Job'; }, []);

  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const feedbackIdRef = useRef(0);
  const [appTypes, setAppTypes] = useState<AppType[]>(DEFAULT_APP_TYPES);
  const [appType, setAppType] = useState<AppType>('Web App');
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentRow[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [environmentKey, setEnvironmentKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  const bootstrap = useCallback(() => {
    send('newBotJob.bootstrap');
  }, [send]);

  const applyWorkspaceData = useCallback((body: any) => {
    const organizationRows: OrganizationRow[] = Array.isArray(body.organizations)
      ? body.organizations
      : [];
    const environmentRows: EnvironmentRow[] = Array.isArray(body.environments)
      ? body.environments
      : [];
    if (Array.isArray(body.appTypes) && body.appTypes.length > 0) {
      const nextAppTypes: AppType[] = body.appTypes;
      setAppTypes(nextAppTypes);
      setAppType(current => nextAppTypes.includes(current) ? current : nextAppTypes[0]);
    }
    setOrganizations(organizationRows);
    setEnvironments(environmentRows);
    setSelectedOrganizationId(current => (
      current !== null && organizationRows.some(row => row.id === current)
        ? current
        : null
    ));
    setEnvironmentKey(current => (
      current && environmentRows.some(row => String(row.id) === current)
        ? current
        : ''
    ));

    return { organizationRows, environmentRows };
  }, []);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    if (!connected && saving) {
      setSaving(false);
      showOperationFeedback(
        'Create Bot Job Failed',
        'The connection closed before the Bot Job could be created.',
        'Reconnect and try again.',
        true,
      );
    }
  }, [connected, saving, showOperationFeedback]);

  useEffect(() => {
    if (error) {
      const operationWasSaving = saving;
      setSaving(false);
      setStatus({ level: 'error', text: error });
      if (operationWasSaving) {
        showOperationFeedback(
          'Create Bot Job Failed',
          'The Bot Job could not be created.',
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
        if (
          operationId === 'newBotJob.bootstrapResponse'
          || operationId === 'newBotJob.environmentsResponse'
        ) {
          const { organizationRows } = applyWorkspaceData(body);
          setStatus({
            level: body.ok === false ? 'error' : 'ok',
            text: responseMessage(
              body,
              `Loaded ${organizationRows.length} organization${organizationRows.length === 1 ? '' : 's'}`,
            ),
          });
        } else if (operationId === 'newBotJob.createResponse') {
          setSaving(false);
          if (Array.isArray(body.organizations) || Array.isArray(body.environments)) {
            applyWorkspaceData(body);
          }
          const failed = body.ok === false;
          const message = operationMessage(
            body,
            failed ? 'The Bot Job could not be created.' : 'Bot Job created',
          );
          setStatus({
            level: failed ? 'error' : 'ok',
            text: responseMessage(body, 'Bot Job created'),
          });
          showOperationFeedback(
            failed ? 'Create Bot Job Failed' : 'Bot Job Created',
            message,
            failed
              ? operationErrorDetail(body) || 'No Bot Job was created.'
              : body?.botJob?.id
                ? `Bot Job ID ${body.botJob.id} is now available.`
                : 'The Bot Job is now available.',
            failed,
          );
          if (!failed) {
            setName('');
            setDescription('');
          }
        } else if (operationId === 'newBotJob.actionResponse') {
          if (Array.isArray(body.organizations) || Array.isArray(body.environments)) {
            applyWorkspaceData(body);
          }
          setStatus({
            level: body.ok === false ? 'error' : 'ok',
            text: responseMessage(body, 'Action completed'),
          });
        } else if (operationId === 'newBotJob.status') {
          setStatus({
            level: body.level === 'error' ? 'error' : body.level === 'warning' ? 'warn' : 'ok',
            text: body.message || 'Status update',
          });
        } else if (operationId === 'react.session.open') {
          onSessionOpen?.(body.targetSession, body.port, body.botJobId);
        }
      } catch (messageError) {
        console.warn('NewBotJobPage ignored socket message', messageError, raw);
      }
    }
  }, [applyWorkspaceData, messages, onSessionOpen, showOperationFeedback]);

  useEffect(() => {
    if (!environmentKey) return;
    const environment = environments.find(row => String(row.id) === environmentKey);
    if (
      !environment
      || selectedOrganizationId === null
      || Number(environment.homeBankingId) !== Number(selectedOrganizationId)
    ) {
      setEnvironmentKey('');
    }
  }, [environmentKey, environments, selectedOrganizationId]);

  const selectOrganization = (organization: OrganizationRow) => {
    setSelectedOrganizationId(organization.id);
    setEnvironmentKey(current => {
      const environment = environments.find(row => String(row.id) === current);
      return environment && Number(environment.homeBankingId) === Number(organization.id)
        ? current
        : '';
    });
    setStatus({
      level: 'ok',
      text: `${organization.name} selected — now select an Environment`,
    });
  };

  const selectEnvironment = (environment: EnvironmentRow) => {
    setEnvironmentKey(String(environment.id));
    setStatus({
      level: 'ok',
      text: `${environment.name || 'TEST'} selected for ${selectedOrganization?.name || environment.orgName}`,
    });
  };

  const createBotJob = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      const message = 'Bot Job name cannot be empty';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Create Bot Job Failed', message, undefined, true);
      return;
    }
    if (!selectedOrganization) {
      const message = 'Select an Organization';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Create Bot Job Failed', message, undefined, true);
      return;
    }
    if (!selectedEnvironment) {
      const message = 'Select a valid Organization Environment';
      setStatus({ level: 'warn', text: message });
      showOperationFeedback('Create Bot Job Failed', message, undefined, true);
      return;
    }
    setSaving(true);
    if (!send('newBotJob.create', {
      name: trimmedName,
      description: description.trim(),
      priority: appType,
      homeBankingId: selectedEnvironment.homeBankingId,
      homeUrlId: selectedEnvironment.id,
      openAfterCreate: true,
    })) {
      setSaving(false);
      showOperationFeedback(
        'Create Bot Job Failed',
        'The Bot Job could not be created because the backend is not connected.',
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
      title="New Bot Job"
      testId="new-bot-job-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <div className={styles.frame}>
        <main className={styles.shell}>
          <section className={styles.window}>
            <header className={styles.topBar} data-floating-workspace-drag-handle>
              <div className={styles.titleBlock}>
                <h1 className={styles.title}>New Bot Job</h1>
                <p className={styles.subtitle}>
                  Create an automation job from an Organization Environment
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
                <button type="button" className={styles.closeButton} onClick={closePage}>
                  Close
                </button>
              </div>
            </header>

            <section className={styles.toolbar}>
              <button
                type="button"
                onClick={() => send('newBotJob.openOrganizations')}
                disabled={saving}
              >
                Organizations / Environments
              </button>
              <button
                type="button"
                onClick={() => send('newBotJob.environments')}
                disabled={saving}
              >
                Refresh
              </button>
              <span className={styles.selectionHint}>
                Select an Organization, then select one of its Environments.
              </span>
            </section>

            <div className={styles.content}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>Bot Job Details</div>
                <div className={styles.formBody}>
                  <div className={styles.fieldsGrid}>
                    <label className={styles.fieldLabel}>
                      Bot Job Name
                      <input
                        value={name}
                        maxLength={100}
                        onChange={event => setName(event.target.value)}
                        placeholder="Enter Bot Job Name"
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
                      <span>Organization</span>
                      <strong title={selectedOrganization?.name || ''}>
                        {selectedOrganization?.name || 'Not selected'}
                      </strong>
                    </div>
                    <div>
                      <span>Environment</span>
                      <strong title={selectedEnvironment?.name || ''}>
                        {selectedEnvironment?.name || 'Not selected'}
                      </strong>
                    </div>
                    <div>
                      <span>URL</span>
                      <strong title={selectedEnvironment?.url || ''}>
                        {selectedEnvironment?.url || '-'}
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
                    disabled={saving || !name.trim() || !selectedEnvironment}
                    onClick={createBotJob}
                  >
                    {saving ? 'Creating...' : 'Create Bot Job'}
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
                    inputId: 'new-bot-job-organizations-find',
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
                  ariaLabel="New Bot Job Organizations"
                  testId="new-bot-job-organizations-grid"
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
                      inputId: `new-bot-job-environments-${selectedOrganization.id}-find`,
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
                    testId="new-bot-job-environments-grid"
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

export default NewBotJobPage;
