import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileKey2, FolderOpen, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useWebSocket } from './useWebSocket';
import styles from './LicenseManager.module.scss';

type LicenseState = {
  ok: boolean; statusCode: string; status: string; active: boolean; requiresActivation: boolean;
  path?: string; organization?: string; owner?: string; error?: string;
  capabilities?: Record<string, boolean>;
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void; onActivated?: () => void };

const LicenseManager: React.FC<Props> = ({ socketPort, sessionId, onClose, onActivated }) => {
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const [state, setState] = useState<LicenseState | null>(null);
  const [mode, setMode] = useState<'request' | 'activate' | 'existing'>('request');
  const [form, setForm] = useState({ organization: '', owner: '', email: '', file: '', agreementAccepted: false });
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const refresh = useCallback(() => webSocket?.send(JSON.stringify({ type: 'license.bootstrap', sessionId })), [webSocket, sessionId]);
  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);
  useEffect(() => {
    if (!messages.length) return;
    try {
      const message = JSON.parse(messages[messages.length - 1]);
      if (message.sessionId !== sessionId || !message.operationId?.startsWith('license.')) return;
      const body = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
      setPending(false);
      if (body?.ok) {
        setState(body);
        setFeedback(body.message || 'License status refreshed.');
        if (!['license.bootstrapResponse', 'license.statusResponse'].includes(message.operationId)) refresh();
      } else setFeedback(body?.error || 'License operation failed.');
    } catch (_) { }
  }, [messages, sessionId]);

  const modes = useMemo(() => [
    { id: 'request' as const, label: 'Request', enabled: state?.capabilities?.request !== false },
    { id: 'activate' as const, label: 'Activate', enabled: state?.capabilities?.activate !== false },
    { id: 'existing' as const, label: 'Use existing', enabled: state?.capabilities?.useExisting !== false },
  ], [state]);
  useEffect(() => { if (state?.active) onActivated?.(); }, [state?.active, onActivated]);

  const submit = () => {
    if (!webSocket || pending) return;
    setPending(true); setFeedback('');
    const type = mode === 'request' ? 'license.request' : mode === 'activate' ? 'license.activate' : 'license.useExisting';
    webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify({
      requestId: `${Date.now()}-${type}`, organization: form.organization, owner: form.owner, email: form.email,
      agreementAccepted: form.agreementAccepted,
      responseFile: mode === 'activate' ? form.file : undefined,
      licenseFile: mode === 'existing' ? form.file : undefined,
    }) }));
  };

  return <section className={styles.panel} aria-label="License manager">
    <header className={styles.header}>
      <div><FileKey2 size={18}/><span><strong>License</strong><small>AR Web authorization</small></span></div>
      <div className={styles.headerActions}>
        <button title="Refresh license status" onClick={refresh} disabled={!connected}><RefreshCw size={16}/></button>
        {onClose && <button title="Close" onClick={onClose}><X size={17}/></button>}
      </div>
    </header>
    <div className={`${styles.status} ${state?.active ? styles.active : styles.required}`}>
      {state?.active ? <CheckCircle2 size={20}/> : <ShieldAlert size={20}/>}<span>
        <strong>{state?.status || (connected ? 'Checking license...' : 'Connecting...')}</strong>
        <small>{state?.statusCode || 'UNKNOWN'}</small>
      </span>
    </div>
    {state?.error && <p className={styles.error}>{state.error}</p>}
    <dl className={styles.details}>
      <div><dt>Organization</dt><dd>{state?.organization || 'Not configured'}</dd></div>
      <div><dt>Owner</dt><dd>{state?.owner || 'Not configured'}</dd></div>
      <div><dt>License path</dt><dd>{state?.path || 'Application directory'}</dd></div>
    </dl>
    <nav className={styles.segmented} aria-label="License action">
      {modes.map(item => <button key={item.id} disabled={!item.enabled} className={mode === item.id ? styles.selected : ''} onClick={() => setMode(item.id)}>{item.label}</button>)}
    </nav>
    <div className={styles.form}>
      {mode === 'request' ? <>
        <label>Organization<input value={form.organization} onChange={e => setForm({...form,organization:e.target.value})}/></label>
        <label>Owner<input value={form.owner} onChange={e => setForm({...form,owner:e.target.value})}/></label>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label>
      </> : <label>{mode === 'activate' ? 'Response file' : 'License file'}<span className={styles.pathInput}><FolderOpen size={17}/><input value={form.file} onChange={e => setForm({...form,file:e.target.value})} placeholder={mode === 'activate' ? 'Configured directory/response file' : 'Configured directory/ARWeb.lic'}/></span></label>}
      {mode !== 'existing' && <label className={styles.agreement}><input type="checkbox" checked={form.agreementAccepted} onChange={e => setForm({...form,agreementAccepted:e.target.checked})}/><span>I accept the software license agreement.</span></label>}
      {feedback && <p className={styles.feedback}>{feedback}</p>}
      <button className={styles.submit} onClick={submit} disabled={pending || (mode !== 'existing' && !form.agreementAccepted)}>{pending ? 'Processing...' : mode === 'request' ? 'Generate request' : mode === 'activate' ? 'Activate license' : 'Use existing license'}</button>
    </div>
  </section>;
};

export default LicenseManager;
