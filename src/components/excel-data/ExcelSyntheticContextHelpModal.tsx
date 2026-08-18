import React, { useEffect, useId, useRef } from 'react';
import { Landmark, ShieldCheck, X } from 'lucide-react';
import styles from './ExcelSyntheticContextHelpModal.module.scss';

type Props = { onClose: () => void };

const ExcelSyntheticContextHelpModal: React.FC<Props> = ({ onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return <div className={styles.backdrop} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
      onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <header><Landmark size={19} /><h2 id={titleId}>Synthetic context rules</h2>
        <button ref={closeRef} type="button" aria-label="Close synthetic context rules" onClick={onClose}><X size={17} /></button></header>
      <div className={styles.body}>
        <p>Search for a profile and select it. The search clears, the selected label updates, and that choice is restored for this Bot Job next time.</p>
        <ul>
          <li><strong>Bank Account</strong> recognizes IBAN, account, customer, address, currency, amount, date, email, and phone columns.</li>
          <li><strong>Trading profiles</strong> also recognize symbols, order sides, quantities, prices, and references.</li>
          <li><strong>Swiss IBAN</strong> values use the 21-character CH structure and modulo-97 checksum with test-style IID 99999.</li>
        </ul>
        <aside><ShieldCheck size={17} /><span>All names, addresses, accounts, and identifiers are generated test data. Never use them for real payments or identity verification.</span></aside>
      </div>
    </section>
  </div>;
};

export default ExcelSyntheticContextHelpModal;
