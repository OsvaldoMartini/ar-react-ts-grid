import React, { useCallback } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import LicenseManager from './LicenseManager';
import styles from './ActivationRequired.module.scss';

type Props = { socketPort: number; sessionId: string };
const ActivationRequired: React.FC<Props> = ({ socketPort, sessionId }) => {
  const openApplication = useCallback(() => {
    const receive = (window as any).receiveDataFromJava;
    if (typeof receive === 'function') receive('[]', socketPort, 'mainDashboard', -9999, '', -9999, '');
  }, [socketPort]);
  return <main className={styles.page}>
  <header><ShieldAlert size={24}/><div><h1>Activation required</h1><p>A valid license is required before protected AR Web features can open.</p></div></header>
  <LicenseManager socketPort={socketPort} sessionId={sessionId} onActivated={openApplication}/>
  <button className={styles.exit} onClick={openApplication}><LogOut size={16}/>Back to main dashboard</button>
</main>;
};
export default ActivationRequired;
