import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './NewBotJobManager.module.scss';
import { useWebSocket } from './useWebSocket';

type StatusLevel = 'ok' | 'warn' | 'error';
type AppType = 'Web App' | 'Android' | 'iOS' | 'Rest Api';

interface NewBotJobManagerProps {
  socketPort: number;
  sessionId: string;
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
}

interface EnvironmentRow {
  id: number;
  name: string;
  url: string;
  homeBankingId: number;
  orgName: string;
}

const DEFAULT_APP_TYPES: AppType[] = ['Web App', 'Android', 'iOS'];

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

const NewBotJobManager: React.FC<NewBotJobManagerProps> = ({ socketPort, sessionId, onSessionOpen }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [appTypes, setAppTypes] = useState<AppType[]>(DEFAULT_APP_TYPES);
  const [appType, setAppType] = useState<AppType>('Web App');
  const [environments, setEnvironments] = useState<EnvironmentRow[]>([]);
  const [environmentKey, setEnvironmentKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const selectedEnvironment = useMemo(
    () => environments.find(row => String(row.id) === environmentKey) || null,
    [environmentKey, environments],
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

  const bootstrap = useCallback(() => {
    send('newBotJob.bootstrap');
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
        if (operationId === 'newBotJob.bootstrapResponse') {
          const rows = Array.isArray(body.environments) ? body.environments : [];
          setAppTypes(Array.isArray(body.appTypes) && body.appTypes.length > 0 ? body.appTypes : DEFAULT_APP_TYPES);
          setEnvironments(rows);
          setEnvironmentKey(prev => (prev && rows.some((row: EnvironmentRow) => String(row.id) === prev) ? prev : ''));
          setStatus({ level: 'ok', text: `Loaded ${rows.length} environment${rows.length === 1 ? '' : 's'}` });
        } else if (operationId === 'newBotJob.environmentsResponse') {
          const rows = Array.isArray(body.environments) ? body.environments : [];
          setEnvironments(rows);
          setEnvironmentKey(prev => (prev && rows.some((row: EnvironmentRow) => String(row.id) === prev) ? prev : ''));
          setStatus({ level: body.ok === false ? 'error' : 'ok', text: responseMessage(body, 'Environments refreshed') });
        } else if (operationId === 'newBotJob.createResponse') {
          setSaving(false);
          setStatus({ level: body.ok === false ? 'error' : 'ok', text: responseMessage(body, 'Bot Job created') });
          if (body.ok !== false) {
            setName('');
            setDescription('');
          }
        } else if (operationId === 'newBotJob.actionResponse') {
          setStatus({ level: body.ok === false ? 'error' : 'ok', text: responseMessage(body, 'Action completed') });
          if (Array.isArray(body.environments)) {
            setEnvironments(body.environments);
          }
        } else if (operationId === 'newBotJob.status') {
          setStatus({
            level: body.level === 'error' ? 'error' : body.level === 'warning' ? 'warn' : 'ok',
            text: body.message || 'Status update',
          });
        } else if (operationId === 'react.session.open') {
          onSessionOpen?.(body.targetSession, body.port, body.botJobId);
        }
      } catch (err) {
        console.warn('NewBotJobManager ignored socket message', err, raw);
      }
    }
  }, [messages, onSessionOpen]);

  const createBotJob = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setStatus({ level: 'warn', text: 'Bot Job name cannot be empty' });
      return;
    }
    if (!selectedEnvironment) {
      setStatus({ level: 'warn', text: 'Select a valid Organization Environment' });
      return;
    }
    setSaving(true);
    send('newBotJob.create', {
      name: trimmedName,
      description: description.trim(),
      priority: appType,
      homeBankingId: selectedEnvironment.homeBankingId,
      homeUrlId: selectedEnvironment.id,
      openAfterCreate: true,
    });
  };

  const statusClass =
    status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={styles.shell}>
      <section className={styles.window}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>New Bot Job</h1>
            <p className={styles.subtitle}>Create an automation job from an Organization Environment</p>
          </div>
          <div className={`${styles.status} ${statusClass}`}>{status.text}</div>
        </header>

        <section className={styles.formPanel}>
          <div className={styles.segmentRow} role="radiogroup" aria-label="Application type">
            {appTypes.map(type => (
              <button
                key={type}
                type="button"
                className={`${styles.segmentBtn} ${appType === type ? styles.segmentBtnActive : ''}`}
                onClick={() => setAppType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className={styles.formGrid}>
            <label className={styles.fieldLabel}>
              Bot Job Name
              <input
                className={styles.input}
                value={name}
                maxLength={100}
                onChange={event => setName(event.target.value)}
                placeholder="Enter Bot Job Name"
              />
            </label>

            <label className={styles.fieldLabel}>
              Description
              <input
                className={styles.input}
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Enter Description"
              />
            </label>

            <label className={`${styles.fieldLabel} ${styles.full}`}>
              Organization Environment
              <select
                className={styles.select}
                value={environmentKey}
                onChange={event => setEnvironmentKey(event.target.value)}
              >
                <option value="">Select the Environment</option>
                {environments.map(env => (
                  <option key={env.id} value={env.id}>
                    {env.orgName} | {env.name || 'TEST'} | {env.url}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.environmentStrip}>
            <div>
              <span>Organization</span>
              <strong title={selectedEnvironment?.orgName || ''}>{selectedEnvironment?.orgName || '-'}</strong>
            </div>
            <div>
              <span>Environment</span>
              <strong title={selectedEnvironment?.name || ''}>{selectedEnvironment?.name || '-'}</strong>
            </div>
            <div>
              <span>URL</span>
              <strong title={selectedEnvironment?.url || ''}>{selectedEnvironment?.url || '-'}</strong>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <button type="button" className={styles.commandBtn} onClick={() => send('newBotJob.openOrganizations')}>
            Organizations / Environments
          </button>
          <button type="button" className={styles.commandBtn} onClick={() => send('newBotJob.environments')}>
            Refresh Environments
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => send('newBotJob.cancel')}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.createBtn}
            disabled={saving || !name.trim() || !selectedEnvironment}
            onClick={createBotJob}
          >
            {saving ? 'Creating...' : 'Create Bot Job'}
          </button>
        </footer>
      </section>
    </main>
  );
};

export default NewBotJobManager;
