import React, { useEffect, useId, useRef } from 'react';
import { CircleHelp, X } from 'lucide-react';
import styles from './VariablesConnectionsHelpModal.module.scss';

type Props = { onClose: () => void };

const MemoryVariablesHelpModal: React.FC<Props> = ({ onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.detailDialog}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <header className={styles.detailHeader}>
          <div className={styles.titleLine}>
            <CircleHelp size={21} aria-hidden="true" />
            <h2 id={titleId}>Memory variable rules</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeButton}
            aria-label="Close Memory variable rules"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.detailBody}>
          <section className={styles.section}>
            <h3>Creation and connection rules</h3>
            <ul>
              <li><strong>SAME VARS:</strong> All CheckValues share <strong>Left_Operand_1</strong> and <strong>Right_Operand_1</strong>. Other compatible commands share <strong>Variable_1</strong>.</li>
              <li><strong>DISTINCT:</strong> CheckValues receive sequential matching pairs such as <strong>Left_Operand_1 / Right_Operand_1</strong>, then <strong>Left_Operand_2 / Right_Operand_2</strong>. Other commands receive <strong>Variable_1, Variable_2...</strong> in instruction order.</li>
              <li><strong>AUTO:</strong> Creates missing variables and connects eligible commands automatically using the established automatic-resolution rules.</li>
              <li><strong>ADD:</strong> Creates one freely named Bot Job variable without connecting it automatically.</li>
              <li><strong>CLEAR:</strong> Resets runtime values to VOID while preserving variable definitions and connections.</li>
              <li><strong>ALL:</strong> Deletes every variable definition and disconnects its instruction slots.</li>
            </ul>
          </section>
          <p>
            Variables are free to come and go. Deleting a variable removes it
            and disconnects its relationships; commands and Web Elements remain
            available, so you can create, reconnect, or change variables whenever needed.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MemoryVariablesHelpModal;
