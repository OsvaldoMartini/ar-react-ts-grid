import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileKey2, FolderOpen, RefreshCw, ShieldAlert, X } from 'lucide-react';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import { LICENSE_AGREEMENT_V1, LICENSE_AGREEMENT_VERSION } from './licenseAgreement';
import styles from './LicenseManager.module.scss';

type LicenseState = {
  ok: boolean; statusCode: string; status: string; active: boolean; requiresActivation: boolean;
  path?: string; organization?: string; owner?: string; error?: string;
  capabilities?: Record<string, boolean>;
};

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
  onActivated?: () => void;
  detached?: boolean;
};

type Notice = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

const LicenseManager: React.FC<Props> = ({ socketPort, sessionId, onClose, onActivated, detached = false }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [state, setState] = useState<LicenseState | null>(null);
  const [mode, setMode] = useState<'request' | 'activate' | 'existing'>('request');
  const [form, setForm] = useState({ organization: '', owner: '', email: '', file: '', agreementAccepted: false });
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>({ level: 'warn', text: 'Connecting to License Request...' });

  const requestBootstrap = useCallback((announce: boolean) => {
    if (!connected || !webSocket) {
      setNotice({ level: 'error', text: 'License Request is not connected.' });
      return;
    }
    if (announce) setNotice({ level: 'warn', text: 'Checking license status...' });
    webSocket.send(JSON.stringify({ type: 'license.bootstrap', sessionId }));
  }, [connected, sessionId, webSocket]);
  const refresh = useCallback(() => requestBootstrap(true), [requestBootstrap]);
  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);
  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;
    pendingMessages.forEach(raw => {
      try {
        const message = JSON.parse(raw);
        if (message.sessionId && message.sessionId !== sessionId) return;
        const operationId = message.operationId || message.type;
        if (operationId === 'application.workspaceFocus') {
          try {
            window.focus();
          } catch {
            // Native focus is best-effort and may be refused by the window manager.
          }
          return;
        }
        if (!operationId?.startsWith('license.')) return;
        const body = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
        setPending(false);
        if (body?.ok) {
          setState(body);
          setNotice({
            level: body.active ? 'ok' : body.requiresActivation ? 'warn' : 'ok',
            text: body.message || body.status || 'License status refreshed.',
          });
          if (!['license.bootstrapResponse', 'license.statusResponse', 'license.statusChanged'].includes(operationId)) {
            requestBootstrap(false);
          }
        } else {
          setNotice({ level: 'error', text: body?.error || 'License operation failed.' });
        }
      } catch {
        setPending(false);
        setNotice({ level: 'error', text: 'The License response could not be read.' });
      }
    });
  }, [messages, requestBootstrap, sessionId]);

  useEffect(() => {
    if (error) setNotice({ level: 'error', text: error });
  }, [error]);

  const modes = useMemo(() => [
    { id: 'request' as const, label: 'Request', enabled: state?.capabilities?.request !== false },
    { id: 'activate' as const, label: 'Activate', enabled: state?.capabilities?.activate !== false },
    { id: 'existing' as const, label: 'Use existing', enabled: state?.capabilities?.useExisting !== false },
  ], [state]);
  useEffect(() => { if (state?.active) onActivated?.(); }, [state?.active, onActivated]);

  const selectMode = (nextMode: 'request' | 'activate' | 'existing') => {
    setMode(nextMode);
    setNotice({ level: 'ok', text: 'Ready' });
  };

  const submit = () => {
    if (pending) return;
    const organization = form.organization.trim();
    const owner = form.owner.trim();
    const email = form.email.trim();
    const file = form.file.trim();
    let validationError = '';
    if (mode === 'request') {
      if (!organization) validationError = 'Organization is required.';
      else if (!owner) validationError = 'Owner is required.';
      else if (!email) validationError = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationError = 'Enter a valid email address.';
    } else if (!file) {
      validationError = mode === 'activate' ? 'Response file is required.' : 'License file is required.';
    }
    if (!validationError && mode !== 'existing' && !form.agreementAccepted) {
      validationError = 'Accept the software license agreement to continue.';
    }
    if (validationError) {
      setNotice({ level: 'error', text: validationError });
      return;
    }
    if (!connected || !webSocket) {
      setNotice({ level: 'error', text: 'License Request is not connected.' });
      return;
    }
    setPending(true);
    setNotice({ level: 'warn', text: mode === 'request' ? 'Generating license request...' : mode === 'activate' ? 'Activating license...' : 'Validating existing license...' });
    const type = mode === 'request' ? 'license.request' : mode === 'activate' ? 'license.activate' : 'license.useExisting';
    webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify({
      requestId: `${Date.now()}-${type}`, organization, owner, email,
      agreementAccepted: form.agreementAccepted,
      responseFile: mode === 'activate' ? file : undefined,
      licenseFile: mode === 'existing' ? file : undefined,
    }) }));
  };

  const noticeClass = notice.level === 'error'
    ? styles.statusError
    : notice.level === 'warn'
      ? styles.statusWarn
      : styles.statusOk;

  return <section className={`${styles.panel} ${detached ? styles.detached : ''}`} aria-label="License manager">
    <header
      className={styles.header}
      data-floating-workspace-drag-handle={detached ? true : undefined}
    >
      <div><FileKey2 size={18}/><span><strong>License Request</strong><small>Request, activate, or select an AR Web license</small></span></div>
      <div className={styles.headerActions} data-floating-drag-ignore="true">
        <div
          className={`${styles.headerStatus} ${noticeClass}`}
          role={notice.level === 'error' ? 'alert' : 'status'}
          aria-live={notice.level === 'error' ? 'assertive' : 'polite'}
          title={notice.text}
        >
          {notice.text}
        </div>
        <button title="Refresh license status" onClick={refresh} disabled={!connected}><RefreshCw size={16}/></button>
        {detached && (
          <div className={styles.pagesControl}>
            <PagesOpenButton
              webSocket={webSocket}
              connected={connected}
              messages={messages}
              sessionId={sessionId}
            />
          </div>
        )}
        {onClose && (
          <button
            className={detached ? styles.detachedClose : undefined}
            title={detached ? 'Close only this License Manager window' : 'Close'}
            onClick={onClose}
          >
            {detached ? 'Close' : <X size={17}/>}
          </button>
        )}
      </div>
    </header>
    <div className={`${styles.licenseStatus} ${state?.active ? styles.active : styles.required}`}>
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
      {modes.map(item => <button key={item.id} disabled={!item.enabled} className={mode === item.id ? styles.selected : ''} onClick={() => selectMode(item.id)}>{item.label}</button>)}
    </nav>
    <div className={styles.form}>
      <p className={styles.requiredHint}>Required fields are marked below.</p>
      {mode === 'request' ? <>
        <label><span className={styles.fieldLabel}>Organization <em>Required</em></span><input aria-label="Organization" required value={form.organization} onChange={e => setForm({...form,organization:e.target.value})}/></label>
        <label><span className={styles.fieldLabel}>Owner <em>Required</em></span><input aria-label="Owner" required value={form.owner} onChange={e => setForm({...form,owner:e.target.value})}/></label>
        <label><span className={styles.fieldLabel}>Email <em>Required</em></span><input aria-label="Email" required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label>
      </> : <label><span className={styles.fieldLabel}>{mode === 'activate' ? 'Response file' : 'License file'} <em>Required</em></span><span className={styles.pathInput}><FolderOpen size={17}/><input aria-label={mode === 'activate' ? 'Response file' : 'License file'} required value={form.file} onChange={e => setForm({...form,file:e.target.value})} placeholder={mode === 'activate' ? 'Configured directory/response file' : 'Configured directory/ARWeb.lic'}/></span></label>}
      {mode !== 'existing' && <>
        <section className={styles.agreementText} aria-labelledby="license-agreement-title" tabIndex={0}>
          <h2 id="license-agreement-title">Software License Agreement <small>v{LICENSE_AGREEMENT_VERSION}</small></h2>
          <p>{LICENSE_AGREEMENT_V1}</p>
        </section>
        <label className={styles.agreement}><input type="checkbox" required checked={form.agreementAccepted} onChange={e => setForm({...form,agreementAccepted:e.target.checked})}/><span>I accept the software license agreement. <em>Required</em></span></label>
      </>}
      <button className={styles.submit} onClick={submit} disabled={pending}>{pending ? 'Processing...' : mode === 'request' ? 'Generate request' : mode === 'activate' ? 'Activate license' : 'Use existing license'}</button>
    </div>
  </section>;
};

export default LicenseManager;
