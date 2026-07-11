import React from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import LicenseManager from './LicenseManager';
import styles from './ActivationRequired.module.scss';

type Props = { socketPort: number; sessionId: string };
const ActivationRequired: React.FC<Props> = ({ socketPort, sessionId }) => <main className={styles.page}>
  <header><ShieldAlert size={24}/><div><h1>Activation required</h1><p>A valid license is required before protected AR Web features can open.</p></div></header>
  <LicenseManager socketPort={socketPort} sessionId={sessionId}/>
  <button className={styles.exit} onClick={() => window.close()}><LogOut size={16}/>Exit application</button>
</main>;
export default ActivationRequired;
