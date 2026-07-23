import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './TemplateForm.module.scss';
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

interface TemplateFormProps {
  socketPort: number;
  sessionId: string;
  showApplicationExit?: boolean;
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

const TemplateForm: React.FC<TemplateFormProps> = ({ socketPort, sessionId, showApplicationExit = false }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const shutdownRequestedRef = useRef(false);
  const [config, setConfig] = useState<ConfigData>(EMPTY_CONFIG);
  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [openSection, setOpenSection] = useState<SectionKey>('operational');
  const [restoreDate, setRestoreDate] = useState(todayKey());
  const [busyAction, setBusyAction] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const dbUsesPath = useMemo(() => {
    const value = config.databaseType.toLowerCase();
    return value === 'access' || value === 'text' || value === 'sqlite';
  }, [config.databaseType]);

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
          if (!body.cancelled && body.field && body.path) {
            setConfig(prev => ({ ...prev, [body.field]: body.path }));
          }
          setStatus({ level: body.cancelled ? 'warn' : 'ok', text: responseMessage(body, 'Path selected') });
        } else if (operationId === 'config.saveResponse') {
          setBusyAction('');
          setErrors(body.errors || {});
          applyPayload(body);
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Configuration saved') });
        } else if (operationId === 'config.backupResponse') {
          setBusyAction('');
          setStatus({ level: ok ? 'ok' : 'error', text: responseMessage(body, 'Backup completed') });
        } else if (operationId === 'config.restoreResponse' || operationId === 'config.deleteResponse') {
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
        console.warn('TemplateForm ignored socket message', err, raw);
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
    send('config.choosePath', { field, mode });
  };

  const saveConfig = () => {
    setBusyAction('save');
    send('config.save', { config });
  };

  const backup = () => {
    if (!window.confirm('Execute database backup now?')) return;
    setBusyAction('backup');
    send('config.backup', { databaseType: config.databaseType });
  };

  const restore = () => {
    if (!restoreDate.trim()) {
      setStatus({ level: 'warn', text: 'Please select a restore date' });
      return;
    }
    if (!window.confirm(`Restore database from ${restoreDate}? This will replace current data.`)) return;
    setBusyAction('restore');
    send('config.restore', { databaseType: config.databaseType, date: backendDateKey(restoreDate.trim()) });
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

  const savePrompt = () => {
    const missing = REQUIRED_PROMPT_TOKENS.filter(token => !promptText.includes(token));
    if (missing.length > 0 && !window.confirm(`Missing placeholders: ${missing.join(', ')}. Save anyway?`)) {
      return;
    }
    setBusyAction('prompt');
    send('config.saveGenFlowPrompt', { content: promptText });
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
          <div className={styles.topBarRight}>
            <div className={`${styles.status} ${statusClass}`}>{status.text}</div>
            {showApplicationExit && (
              <button type="button" className={styles.exitButton} onClick={requestApplicationShutdown}>
                Exit
              </button>
            )}
          </div>
        </header>

        <section className={styles.toolbar}>
          <label className={styles.toolbarField}>
            Browser
            <select value={config.browser} onChange={event => update('browser', event.target.value)}>
              {options.browsers.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className={styles.toolbarField}>
            DB Type
            <select value={config.databaseType} onChange={event => update('databaseType', event.target.value)}>
              {options.databaseTypes.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" onClick={saveConfig} disabled={!!busyAction}>Reload Configs</button>
          <button type="button" onClick={backup} disabled={!!busyAction}>Backup DB</button>
          <button type="button" onClick={restore} disabled={!!busyAction}>Restore DB</button>
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

export default TemplateForm;
