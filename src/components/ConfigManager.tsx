import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QuestionsCard from './QuestionsCard';
import styles from './ConfigManager.module.scss';
import { useWebSocket } from './useWebSocket';

type StatusLevel = 'ok' | 'warn' | 'error';
type SectionKey = 'operational' | 'advanced';

type ConfigData = {
  browser: string;
  databaseType: string;
  pathLicense: string;
  pathExcel: string;
  pathLog: string;
  pathDb: string;
  pathReport: string;
  pathPriority: string;
  pathEngine: string;
  pathWebDriver: string;
  pathAppium: string;
  pathPlugins: string;
  urlPlugins: string;
  dbUrl: string;
  dbUser: string;
  dbPwd: string;
  aiApiKey: string;
  aiEndpoint: string;
  aiModel: string;
  aiMaxBlocks: string;
};

type Options = {
  browsers: string[];
  databaseTypes: string[];
};

type OrganizationRow = {
  id: number;
  name: string;
  activeJobs: number;
  url: string | null;
};

type ResultDialog = {
  header: string;
  body: string;
  error: boolean;
  extraMsg: string;
};

type BrowserReplacement = {
  activeBrowser: string;
  requestedBrowser: string;
  warning: string;
};

interface ConfigManagerProps {
  socketPort: number;
  sessionId: string;
}

const EMPTY_CONFIG: ConfigData = {
  browser: '',
  databaseType: '',
  pathLicense: '',
  pathExcel: '',
  pathLog: '',
  pathDb: '',
  pathReport: '',
  pathPriority: '',
  pathEngine: '',
  pathWebDriver: '',
  pathAppium: '',
  pathPlugins: '',
  urlPlugins: '',
  dbUrl: '',
  dbUser: '',
  dbPwd: '',
  aiApiKey: '',
  aiEndpoint: '',
  aiModel: '',
  aiMaxBlocks: '',
};

const EMPTY_OPTIONS: Options = {
  browsers: ['Chrome', 'Edge', 'Firefox'],
  databaseTypes: ['Access', 'Postgres', 'TEXT'],
};

const PATH_FIELDS: Array<{ key: keyof ConfigData; label: string; mode: 'file' | 'directory' }> = [
  { key: 'pathLicense', label: 'License Path', mode: 'directory' },
  { key: 'pathExcel', label: 'Excel Path', mode: 'directory' },
  { key: 'pathLog', label: 'Log Path', mode: 'directory' },
  { key: 'pathDb', label: 'Database Path', mode: 'directory' },
  { key: 'pathReport', label: 'Report Path', mode: 'directory' },
  { key: 'pathPriority', label: 'Priority Path', mode: 'directory' },
  { key: 'pathEngine', label: 'Engine Path', mode: 'file' },
  { key: 'pathWebDriver', label: 'Web Driver Path', mode: 'directory' },
];

const ADVANCED_PATH_FIELDS: Array<{ key: keyof ConfigData; label: string; mode: 'file' | 'directory' }> = [
  { key: 'pathAppium', label: 'Appium Path', mode: 'directory' },
  { key: 'pathPlugins', label: 'Plugins Path', mode: 'directory' },
];

const REQUIRED_PROMPT_TOKENS = ['{{BLOCK_NAME}}', '{{ELEMENTS_JSON}}', '{{MAX_BLOCKS}}', '{{JSON_SCHEMA}}'];

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

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function backendDateKey(date: string): string {
  return date.replace(/-/g, '_');
}

const ConfigManager: React.FC<ConfigManagerProps> = ({ socketPort, sessionId }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [config, setConfig] = useState<ConfigData>(EMPTY_CONFIG);
  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [openSection, setOpenSection] = useState<SectionKey>('operational');
  const [restoreDate, setRestoreDate] = useState(todayKey());
  const [busyAction, setBusyAction] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [promptSaveConfirmOpen, setPromptSaveConfirmOpen] = useState(false);
  const [promptMissingTokens, setPromptMissingTokens] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reloadConfirmOpen, setReloadConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [backupConfirmOpen, setBackupConfirmOpen] = useState(false);
  const [backupResult, setBackupResult] = useState<ResultDialog | null>(null);
  const [browserReplacement, setBrowserReplacement] = useState<BrowserReplacement | null>(null);
  const [browserResult, setBrowserResult] = useState<ResultDialog | null>(null);
  const [reloadResult, setReloadResult] = useState<ResultDialog | null>(null);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const dbUsesPath = useMemo(() => {
    const value = config.databaseType.toLowerCase();
    return value === 'access' || value === 'text' || value === 'sqlite';
  }, [config.databaseType]);

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
    send('config.bootstrap');
  }, [send]);

  useEffect(() => {
    if (connected) {
      bootstrap();
    }
  }, [bootstrap, connected]);

  useEffect(() => {
    if (error) {
      setStatus({ level: 'error', text: error });
    }
  }, [error]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const nextMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;
    for (const raw of nextMessages) {
      try {
        const { operationId, body } = parseMessage(raw);
        const ok = body.ok !== false;
        if (operationId === 'config.bootstrapResponse') {
          applyPayload(body);
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Configuration loaded') });
        } else if (operationId === 'config.pathResponse') {
          setBusyAction('');
          if (ok && !body.cancelled && body.field && body.path) {
            setConfig(prev => ({ ...prev, [body.field]: body.path }));
          }
          setStatus({
            level: !ok ? 'error' : body.cancelled ? 'warn' : 'ok',
            text: responseMessage(body, 'Path selected'),
          });
        } else if (operationId === 'config.saveResponse') {
          setBusyAction('');
          setErrors(body.errors || {});
          applyPayload(body);
          const message = responseMessage(body, 'Configuration saved');
          const workspaceCloseWarning = typeof body?.workspaceCloseWarning === 'string'
            ? body.workspaceCloseWarning.trim()
            : '';
          setStatus({
            level: ok ? (workspaceCloseWarning ? 'warn' : 'ok') : 'error',
            text: workspaceCloseWarning || message,
          });
          setReloadResult({
            header: ok
              ? (workspaceCloseWarning ? 'Database Reloaded With Warning' : 'Database Reloaded')
              : 'Database Reload Failed',
            body: message,
            error: !ok,
            extraMsg: !ok
              ? 'The reload did not complete. Review the error and try again.'
              : workspaceCloseWarning
                ? `The Main Dashboard was refreshed, but some pages could not be closed: ${workspaceCloseWarning}`
                : 'The Main Dashboard Bot Jobs were refreshed in real time and stale pages were closed.',
          });
        } else if (operationId === 'config.backupResponse') {
          setBusyAction('');
          const cancelled = body?.cancelled === true;
          const message = responseMessage(body, cancelled ? 'Database backup cancelled' : 'Backup completed');
          setStatus({ level: !ok ? 'error' : cancelled ? 'warn' : 'ok', text: message });
          setBackupResult({
            header: !ok
              ? 'Database Backup Failed'
              : cancelled
                ? 'Database Backup Cancelled'
                : 'Database Backup Completed',
            body: message,
            error: !ok,
            extraMsg: !ok
              ? 'The database was not backed up. Review the error and try again.'
              : cancelled
                ? 'No files were written.'
                : `Backup file: ${body?.path || body?.folder || 'the selected destination'}`,
          });
        } else if (
          operationId === 'config.browserResponse'
          || operationId === 'config.browser.updateResponse'
        ) {
          setBusyAction('');
          const message = responseMessage(body, 'Browser configuration update completed');
          if (body?.confirmationRequired === true) {
            setBrowserReplacement({
              activeBrowser: String(body?.activeBrowser || 'current'),
              requestedBrowser: String(body?.requestedBrowser || ''),
              warning: String(
                body?.warning
                || 'Continuing closes the current shared Playwright browser.',
              ),
            });
            setStatus({ level: 'warn', text: message });
          } else {
            applyPayload(body);
            setStatus({ level: ok ? 'ok' : 'error', text: message });
            setBrowserResult({
              header: ok ? 'Browser Configuration Updated' : 'Browser Update Failed',
              body: message,
              error: !ok,
              extraMsg: ok
                ? `${body?.browserClosed === true
                  ? 'The previous shared Playwright browser was closed. '
                  : ''}Config file: ${body?.configFile || 'active AR Web configuration'}`
                : body?.rollbackFailed === true
                  ? 'The previous selection could not be restored automatically. Review the active config file before continuing.'
                  : 'The current browser configuration was kept.',
            });
          }
        } else if (operationId === 'config.browserUpdated') {
          if (ok) {
            applyPayload(body);
            setStatus({
              level: 'ok',
              text: responseMessage(body, 'Browser configuration updated in real time'),
            });
          }
        } else if (operationId === 'config.restoreResponse') {
          setBusyAction('');
          applyPayload(body);
          const message = responseMessage(body, 'Database restore completed');
          const workspaceCloseWarning = typeof body?.workspaceCloseWarning === 'string'
            ? body.workspaceCloseWarning.trim()
            : '';
          setStatus({
            level: ok ? (workspaceCloseWarning ? 'warn' : 'ok') : 'error',
            text: workspaceCloseWarning || message,
          });
          setReloadResult({
            header: ok
              ? (workspaceCloseWarning ? 'Database Restored With Warning' : 'Database Restored')
              : 'Database Restore Failed',
            body: message,
            error: !ok,
            extraMsg: !ok
              ? 'The restore did not complete. Review the error and try again.'
              : workspaceCloseWarning
                ? `The Main Dashboard was refreshed, but some pages could not be closed: ${workspaceCloseWarning}`
                : 'The Main Dashboard Bot Jobs were refreshed in real time and stale pages were closed.',
          });
        } else if (operationId === 'config.deleteResponse') {
          setBusyAction('');
          applyPayload(body);
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Database operation completed') });
        } else if (operationId === 'config.promptResponse') {
          setBusyAction('');
          if (typeof body.content === 'string') {
            setPromptText(body.content);
            setPromptOpen(true);
          } else if (ok) {
            setPromptOpen(false);
          }
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Prompt operation completed') });
        } else if (operationId === 'config.actionResponse') {
          applyPayload(body);
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Action completed') });
        }
      } catch (err) {
        console.warn('ConfigManager ignored socket message', err, raw);
      }
    }
  }, [messages]);

  const applyPayload = (body: any) => {
    if (body.config) {
      setConfig({ ...EMPTY_CONFIG, ...body.config });
    }
    if (body.options) {
      setOptions({ ...EMPTY_OPTIONS, ...body.options });
    }
    if (Array.isArray(body.organizations)) {
      setOrganizations(body.organizations);
    }
  };

  const update = (key: keyof ConfigData, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const choosePath = (field: keyof ConfigData, mode: 'file' | 'directory') => {
    setBusyAction(`path:${String(field)}`);
    if (!send('config.choosePath', { field, mode, currentPath: config[field] })) {
      setBusyAction('');
    }
  };

  const saveConfig = () => {
    setReloadConfirmOpen(false);
    setBusyAction('save');
    if (!send('config.save', { config })) {
      setBusyAction('');
    }
  };

  const backup = () => {
    setBackupConfirmOpen(false);
    setBusyAction('backup');
    if (!send('config.backup', {
      databaseType: config.databaseType,
      initialPath: config.pathDb,
    })) {
      setBusyAction('');
    }
  };

  const requestBrowserUpdate = (requestedBrowser: string) => {
    if (!requestedBrowser || requestedBrowser === config.browser) return;
    setBusyAction('browser');
    if (!send('config.browser.update', {
      browser: requestedBrowser,
      confirmReplace: false,
    })) {
      setBusyAction('');
    }
  };

  const confirmBrowserReplacement = () => {
    const requestedBrowser = browserReplacement?.requestedBrowser || '';
    setBrowserReplacement(null);
    if (!requestedBrowser) return;
    setBusyAction('browser');
    if (!send('config.browser.update', {
      browser: requestedBrowser,
      confirmReplace: true,
    })) {
      setBusyAction('');
    }
  };

  const requestRestore = () => {
    if (!restoreDate.trim()) {
      setStatus({ level: 'warn', text: 'Please select a restore date' });
      return;
    }
    setRestoreConfirmOpen(true);
  };

  const restore = () => {
    setRestoreConfirmOpen(false);
    setBusyAction('restore');
    if (!send('config.restore', {
      databaseType: config.databaseType,
      date: backendDateKey(restoreDate.trim()),
      initialPath: config.pathDb,
    })) {
      setBusyAction('');
    }
  };

  const deleteAll = () => {
    setDeleteConfirmOpen(false);
    setBusyAction('delete');
    send('config.deleteAllJobs', { databaseType: config.databaseType });
  };

  const openPrompt = () => {
    setBusyAction('prompt');
    send('config.loadGenFlowPrompt');
  };

  const submitPrompt = () => {
    setPromptSaveConfirmOpen(false);
    setBusyAction('prompt');
    if (!send('config.saveGenFlowPrompt', { content: promptText })) {
      setBusyAction('');
    }
  };

  const savePrompt = () => {
    const missing = REQUIRED_PROMPT_TOKENS.filter(token => !promptText.includes(token));
    if (missing.length > 0) {
      setPromptMissingTokens(missing);
      setPromptSaveConfirmOpen(true);
      return;
    }
    submitPrompt();
  };

  const statusClass = status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={styles.shell}>
      <section className={styles.window}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Configuration</h1>
            <p className={styles.subtitle}>Paths, database, backup, restore, and AI settings</p>
          </div>
          <div className={`${styles.status} ${statusClass}`}>{status.text}</div>
        </header>

        <section className={styles.toolbar}>
          <label className={styles.toolbarField}>
            Browser
            <select
              value={config.browser}
              disabled={!!busyAction}
              onChange={event => requestBrowserUpdate(event.target.value)}
            >
              {options.browsers.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className={styles.toolbarField}>
            DB Type
            <select value={config.databaseType} onChange={event => update('databaseType', event.target.value)}>
              {options.databaseTypes.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setReloadConfirmOpen(true)} disabled={!!busyAction}>Reload Configs</button>
          <button type="button" onClick={() => setBackupConfirmOpen(true)} disabled={!!busyAction}>Backup DB</button>
          <button type="button" onClick={requestRestore} disabled={!!busyAction}>Restore DB</button>
          <label className={styles.toolbarField}>
            Date Restore
            <input type="date" value={restoreDate} onChange={event => setRestoreDate(event.target.value)} />
          </label>
          <button type="button" className={styles.dangerBtn} onClick={() => setDeleteConfirmOpen(true)} disabled={!!busyAction}>Delete DB</button>
          <button type="button" onClick={() => send('config.openOrganizations')} disabled={!!busyAction}>Organizations</button>
        </section>

        <div className={styles.content}>
          <section className={styles.section}>
            <button type="button" className={styles.sectionHeader} onClick={() => setOpenSection(openSection === 'operational' ? 'advanced' : 'operational')}>
              {openSection === 'operational' ? '▼' : '▶'} Operational Configuration
            </button>
            {openSection === 'operational' && (
              <div className={styles.fieldsGrid}>
                {PATH_FIELDS.map(field => (
                  <PathField
                    key={field.key}
                    label={field.label}
                    value={config[field.key]}
                    error={errors[field.key]}
                    disabled={field.key === 'pathDb' && !dbUsesPath}
                    busy={busyAction === `path:${String(field.key)}`}
                    onChange={value => update(field.key, value)}
                    onPick={() => choosePath(field.key, field.mode)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <button type="button" className={styles.sectionHeader} onClick={() => setOpenSection(openSection === 'advanced' ? 'operational' : 'advanced')}>
              {openSection === 'advanced' ? '▼' : '▶'} Advanced Configuration
            </button>
            {openSection === 'advanced' && (
              <div className={styles.fieldsGrid}>
                {ADVANCED_PATH_FIELDS.map(field => (
                  <PathField
                    key={field.key}
                    label={field.label}
                    value={config[field.key]}
                    error={errors[field.key]}
                    busy={busyAction === `path:${String(field.key)}`}
                    onChange={value => update(field.key, value)}
                    onPick={() => choosePath(field.key, field.mode)}
                  />
                ))}
                <TextField label="URL Plugins" value={config.urlPlugins} onChange={value => update('urlPlugins', value)} />
                <TextField label="Database URL" value={config.dbUrl} disabled={dbUsesPath} onChange={value => update('dbUrl', value)} />
                <TextField label="Database User" value={config.dbUser} disabled={dbUsesPath} onChange={value => update('dbUser', value)} />
                <TextField label="Database Password" value={config.dbPwd} disabled={dbUsesPath} onChange={value => update('dbPwd', value)} />
                <TextField label="AI API Key" value={config.aiApiKey} type="password" onChange={value => update('aiApiKey', value)} />
                <TextField label="AI Endpoint" value={config.aiEndpoint} onChange={value => update('aiEndpoint', value)} />
                <TextField label="AI Model" value={config.aiModel} onChange={value => update('aiModel', value)} />
                <TextField label="AI Max Generated Blocks" value={config.aiMaxBlocks} onChange={value => update('aiMaxBlocks', value)} />
                <button type="button" className={styles.promptBtn} onClick={openPrompt} disabled={!!busyAction}>Edit GEN FLOW Prompt</button>
              </div>
            )}
          </section>

          <section className={styles.orgSection}>
            <div className={styles.orgHeader}>
              <h2>Organizations</h2>
              <span>{organizations.length}</span>
            </div>
            <div className={styles.orgGrid}>
              <div className={styles.orgHead}>ID</div>
              <div className={styles.orgHead}>Organization</div>
              <div className={styles.orgHead}>Active Jobs</div>
              <div className={styles.orgHead}>URL Baseline</div>
              {organizations.map(row => (
                <React.Fragment key={row.id}>
                  <div>{row.id}</div>
                  <div title={row.name}>{row.name}</div>
                  <div>{row.activeJobs ?? 0}</div>
                  <div title={row.url || ''}>{row.url || '-'}</div>
                </React.Fragment>
              ))}
            </div>
          </section>
        </div>
      </section>

      {promptOpen && (
        <div className={styles.modalShade}>
          <section className={styles.promptModal}>
            <header>
              <h2>GEN FLOW Prompt</h2>
              <button type="button" onClick={() => setPromptOpen(false)}>X</button>
            </header>
            <p>Keep placeholders: {REQUIRED_PROMPT_TOKENS.join(' ')}</p>
            <textarea value={promptText} onChange={event => setPromptText(event.target.value)} />
            <footer>
              <button type="button" onClick={() => setPromptOpen(false)}>Cancel</button>
              <button type="button" onClick={savePrompt} disabled={busyAction === 'prompt'}>Save Prompt</button>
            </footer>
          </section>
        </div>
      )}

      {promptSaveConfirmOpen && (
        <QuestionsCard
          mode="confirm"
          header="Save Prompt With Missing Placeholders?"
          body={`Missing placeholders: ${promptMissingTokens.join(', ')}`}
          extraMsg="The generated flow may be incomplete without these placeholders."
          okLabel="Save Anyway"
          cancelLabel="Review Prompt"
          onCancel={() => setPromptSaveConfirmOpen(false)}
          onSubmit={submitPrompt}
        />
      )}

      {deleteConfirmOpen && (
        <div className={styles.modalShade} role="presentation" onMouseDown={() => setDeleteConfirmOpen(false)}>
          <section
            className={styles.confirmModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-db-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header>
              <h2 id="delete-db-title">Confirm Database Deletion</h2>
              <button type="button" title="Close" onClick={() => setDeleteConfirmOpen(false)}>X</button>
            </header>
            <div className={styles.confirmBody}>
              <strong>Delete all Bot Job details?</strong>
              <p>This removes all job details from the selected <b>{config.databaseType || 'current'}</b> database. This operation cannot be undone.</p>
            </div>
            <footer>
              <button type="button" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
              <button type="button" className={styles.confirmDeleteBtn} onClick={deleteAll}>Delete DB</button>
            </footer>
          </section>
        </div>
      )}

      {reloadConfirmOpen && (
        <QuestionsCard
          mode="confirm"
          header="Reload Database"
          body={`Reload the ${config.databaseType || 'current'} database using the configured connection?`}
          extraMsg="After a successful reload, other open pages will close and the Main Dashboard Bot Jobs will refresh in real time."
          okLabel="Reload"
          cancelLabel="Cancel"
          onCancel={() => setReloadConfirmOpen(false)}
          onSubmit={saveConfig}
        />
      )}

      {backupConfirmOpen && (
        <QuestionsCard
          mode="confirm"
          header="Backup Database"
          body={`Create a backup of the ${config.databaseType || 'current'} database now?`}
          extraMsg="After confirmation, choose the destination folder in Explorer. The selector opens at the configured database path."
          okLabel="Choose Folder"
          cancelLabel="Cancel"
          onCancel={() => setBackupConfirmOpen(false)}
          onSubmit={backup}
        />
      )}

      {browserReplacement && (
        <QuestionsCard
          mode="confirm"
          header="Replace Shared Playwright Browser"
          body={`${browserReplacement.activeBrowser === 'unknown'
            ? 'An existing browser'
            : browserReplacement.activeBrowser} is running. Change to ${browserReplacement.requestedBrowser}?`}
          extraMsg={browserReplacement.warning}
          okLabel="Close and Change"
          cancelLabel="Keep Current"
          destructive
          onCancel={() => setBrowserReplacement(null)}
          onSubmit={confirmBrowserReplacement}
        />
      )}

      {restoreConfirmOpen && (
        <QuestionsCard
          mode="confirm"
          header="Restore Database"
          body={`Restore the ${config.databaseType || 'current'} database from ${restoreDate}?`}
          extraMsg="This replaces current data. After a successful restore, other open pages will close and the Main Dashboard will refresh in real time."
          okLabel="Restore"
          cancelLabel="Cancel"
          destructive
          onCancel={() => setRestoreConfirmOpen(false)}
          onSubmit={restore}
        />
      )}

      {backupResult && (
        <QuestionsCard
          mode="alert"
          header={backupResult.header}
          body={backupResult.body}
          extraMsg={backupResult.extraMsg}
          error={backupResult.error}
          okLabel="Close"
          onCancel={() => setBackupResult(null)}
          onSubmit={() => setBackupResult(null)}
        />
      )}

      {browserResult && (
        <QuestionsCard
          mode="alert"
          header={browserResult.header}
          body={browserResult.body}
          extraMsg={browserResult.extraMsg}
          error={browserResult.error}
          okLabel="Close"
          onCancel={() => setBrowserResult(null)}
          onSubmit={() => setBrowserResult(null)}
        />
      )}

      {reloadResult && (
        <QuestionsCard
          mode="alert"
          header={reloadResult.header}
          body={reloadResult.body}
          extraMsg={reloadResult.extraMsg}
          error={reloadResult.error}
          okLabel="Close"
          onCancel={() => setReloadResult(null)}
          onSubmit={() => setReloadResult(null)}
        />
      )}
    </main>
  );
};

const PathField: React.FC<{
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  busy?: boolean;
  onChange: (value: string) => void;
  onPick: () => void;
}> = ({ label, value, error, disabled, busy, onChange, onPick }) => (
  <label className={styles.fieldLabel}>
    <span>{label}</span>
    <div className={styles.pathControl}>
      <input value={value || ''} disabled={disabled} onChange={event => onChange(event.target.value)} title={value || ''} />
      <button type="button" onClick={onPick} disabled={disabled || busy}>{busy ? '...' : '...'}</button>
    </div>
    {error && <strong>{error}</strong>}
  </label>
);

const TextField: React.FC<{
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}> = ({ label, value, type = 'text', disabled, onChange }) => (
  <label className={styles.fieldLabel}>
    <span>{label}</span>
    <input type={type} value={value || ''} disabled={disabled} onChange={event => onChange(event.target.value)} title={value || ''} />
  </label>
);

export default ConfigManager;
