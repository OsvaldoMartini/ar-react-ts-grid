import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileKey2, Info, RefreshCw } from 'lucide-react';
import LicenseManager from './LicenseManager';
import { useWebSocket } from './useWebSocket';
import styles from './AboutPanel.module.scss';

type Props = { socketPort: number; sessionId: string };
const AboutPanel: React.FC<Props> = ({ socketPort, sessionId }) => {
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const [about, setAbout] = useState<any>(null);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const refresh = useCallback(() => webSocket?.send(JSON.stringify({ type: 'about.bootstrap', sessionId })), [webSocket, sessionId]);
  const goBack = () => (window as any).receiveDataFromJava?.('[]', socketPort, 'mainDashboard', -9999, '', -9999, '');
  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);
  useEffect(() => { try { const message=JSON.parse(messages[messages.length-1]); if(message?.operationId==='about.bootstrapResponse') setAbout(typeof message.body==='string'?JSON.parse(message.body):message.body); } catch(_){} }, [messages]);
  return <main className={styles.page}>
    <header><div><button title="Back to dashboard" onClick={goBack}><ArrowLeft size={17}/></button><Info size={22}/><span><h1>{about?.product || 'Unavailable'}</h1><p>Application information</p></span></div><button title="Refresh" onClick={refresh}><RefreshCw size={17}/></button></header>
    <section className={styles.info}>
      <div><span>Version</span><strong>{about?.version || 'Unavailable'}</strong></div><div><span>Build</span><strong>{about?.build || 'Unavailable'}</strong></div><div><span>Expiration</span><strong>{about?.expiration || 'Unavailable'}</strong></div><div><span>License</span><strong>{about?.license?.status || 'Checking...'}</strong></div>
    </section>
    <footer><span>{about?.copyright ? `© ${about.copyright} · All rights reserved` : 'Copyright unavailable'}</span><button onClick={() => setLicenseOpen(true)}><FileKey2 size={16}/>License</button></footer>
    {licenseOpen && <div className={styles.overlay}><LicenseManager socketPort={socketPort} sessionId={sessionId} onClose={() => setLicenseOpen(false)}/></div>}
  </main>;
};
export default AboutPanel;
