import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './CloneJobManager.module.scss';
import { useWebSocket } from './useWebSocket';

interface Props { socketPort: number; sessionId: string; sourceBotJobId: number; onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void; }
interface Source { id: number; name: string; description?: string; homeBankingId: number; homeUrlId: number; organizationName?: string; environmentName?: string; environmentUrl?: string; }
interface Environment { id: number; homeBankingId: number; orgName: string; name?: string; url: string; }

const decode = (raw: string) => {
  const outer = JSON.parse(raw);
  return { operationId: outer.operationId || outer.type, body: typeof outer.body === 'string' ? JSON.parse(outer.body) : outer.body ?? outer };
};

const CloneJobManager: React.FC<Props> = ({ socketPort, sessionId, sourceBotJobId, onSessionOpen }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const cursor = useRef(0);
  const [source, setSource] = useState<Source | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentId, setEnvironmentId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ level: 'warn', text: 'Waiting for backend data' });
  const selected = useMemo(() => environments.find(row => String(row.id) === environmentId), [environmentId, environments]);
  const send = useCallback((type: string, body: unknown = {}) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
  }, [sessionId, webSocket]);

  useEffect(() => { if (connected) send('cloneJob.bootstrap', { sourceBotJobId }); }, [connected, send, sourceBotJobId]);
  useEffect(() => { if (error) setStatus({ level: 'error', text: error }); }, [error]);
  useEffect(() => {
    for (const raw of messages.slice(cursor.current)) {
      try {
        const { operationId, body } = decode(raw);
        if (operationId === 'cloneJob.bootstrapResponse') {
          if (body.ok === false) { setStatus({ level: 'error', text: body.message }); continue; }
          setSource(body.sourceBotJob); setEnvironments(body.environments || []);
          setName(`${body.sourceBotJob.name} Copy`); setDescription(body.sourceBotJob.description || '');
          const initial = (body.environments || []).find((row: Environment) => row.id === body.sourceBotJob.homeUrlId);
          if (initial) { setEnvironmentId(String(initial.id)); setUrl(initial.url); }
          setStatus({ level: 'ok', text: body.message || 'Clone Job loaded' });
        } else if (operationId === 'cloneJob.environmentsResponse') {
          setEnvironments(body.environments || []); setStatus({ level: body.ok === false ? 'error' : 'ok', text: body.message });
        } else if (operationId === 'cloneJob.cloneResponse') {
          setSaving(false); setStatus({ level: body.ok === false ? 'error' : 'ok', text: body.message || 'Clone completed' });
        } else if (operationId === 'cloneJob.actionResponse') {
          setStatus({ level: body.ok === false ? 'error' : 'ok', text: body.message });
        } else if (operationId === 'react.session.open') {
          onSessionOpen?.(body.targetSession, body.port, body.botJobId);
        }
      } catch (reason) { console.warn('CloneJobManager ignored socket message', reason, raw); }
    }
    cursor.current = messages.length;
  }, [messages, onSessionOpen]);

  const chooseEnvironment = (value: string) => {
    setEnvironmentId(value);
    const next = environments.find(row => String(row.id) === value);
    if (next) setUrl(next.url);
  };
  const clone = () => {
    if (!source || !name.trim() || !url.trim()) { setStatus({ level: 'warn', text: 'Name and target URL are required' }); return; }
    setSaving(true);
    send('cloneJob.create', { sourceBotJobId: source.id, name: name.trim(), description: description.trim(), homeBankingId: source.homeBankingId, homeUrlId: selected?.id || null, url: url.trim(), createExcelDataFile: true, openAfterClone: false });
  };
  const statusClass = status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return <main className={styles.shell}><section className={styles.window}>
    <header className={styles.topBar}><div><h1>Clone Job</h1><p>Create a complete copy in an Organization Environment</p></div><div className={`${styles.status} ${statusClass}`}>{status.text}</div></header>
    <section className={styles.content}>
      <div className={styles.source}><span>Source</span><strong>{source ? `(${source.id}) ${source.name}` : '-'}</strong><span>Organization</span><strong>{source?.organizationName || '-'}</strong></div>
      <div className={styles.formGrid}>
        <label>New Bot Job Name<input value={name} onChange={event => setName(event.target.value)} maxLength={100} /></label>
        <label>Description<input value={description} onChange={event => setDescription(event.target.value)} /></label>
        <label className={styles.full}>Target Environment<select value={environmentId} onChange={event => chooseEnvironment(event.target.value)}><option value="">Type a new URL or select an environment</option>{environments.map(env => <option key={env.id} value={env.id}>{env.orgName} | {env.name || 'TEST'} | {env.url}</option>)}</select></label>
        <label className={styles.full}>Target URL<input value={url} onChange={event => { setUrl(event.target.value); setEnvironmentId(''); }} /></label>
      </div>
    </section>
    <footer className={styles.footer}><button onClick={() => send('cloneJob.openOrganizations')}>Organizations / Environments</button><button onClick={() => send('cloneJob.environments', { sourceBotJobId })}>Refresh Environments</button><button onClick={() => send('cloneJob.cancel')}>Cancel</button><button className={styles.primary} disabled={saving || !source || !name.trim() || !url.trim()} onClick={clone}>{saving ? 'Cloning...' : 'Clone Bot Job'}</button></footer>
  </section></main>;
};

export default CloneJobManager;
