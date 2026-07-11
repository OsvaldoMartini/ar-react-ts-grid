import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileKey2, FolderOpen, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useWebSocket } from './useWebSocket';
import styles from './LicenseManager.module.scss';

type LicenseState = {
  ok: boolean; statusCode: string; status: string; active: boolean; requiresActivation: boolean;
  path?: string; organization?: string; owner?: string; error?: string;
  capabilities?: Record<string, boolean>;
};

type Props = { socketPort: number; sessionId: string; onClose?: () => void };

const LicenseManager: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const [state, setState] = useState<LicenseState | null>(null);
  const [mode, setMode] = useState<'request' | 'activate' | 'existing'>('request');

  const refresh = useCallback(() => webSocket?.send(JSON.stringify({ type: 'license.bootstrap', sessionId })), [webSocket, sessionId]);
  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);
  useEffect(() => {
    if (!messages.length) return;
    try {
      const message = JSON.parse(messages[messages.length - 1]);
      if (message.sessionId !== sessionId || !['license.bootstrapResponse', 'license.statusResponse'].includes(message.operationId)) return;
      setState(typeof message.body === 'string' ? JSON.parse(message.body) : message.body);
    } catch (_) { }
  }, [messages, sessionId]);

  const modes = useMemo(() => [
    { id: 'request' as const, label: 'Request', enabled: state?.capabilities?.request !== false },
    { id: 'activate' as const, label: 'Activate', enabled: state?.capabilities?.activate !== false },
    { id: 'existing' as const, label: 'Use existing', enabled: state?.capabilities?.useExisting !== false },
  ], [state]);

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
    <div className={styles.pending}>
      <FolderOpen size={18}/><span><strong>{mode === 'request' ? 'Request a new license' : mode === 'activate' ? 'Activate a response file' : 'Select an existing license'}</strong><small>This action becomes available when the secure backend mutation API is enabled.</small></span>
    </div>
  </section>;
};

export default LicenseManager;
