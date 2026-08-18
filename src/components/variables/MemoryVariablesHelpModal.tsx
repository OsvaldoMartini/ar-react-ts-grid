import React, { useEffect, useId, useRef } from 'react';
import { Database, Link2, X } from 'lucide-react';
import styles from './MemoryVariablesHelpModal.module.scss';

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
            <span className={styles.titleIcon} aria-hidden="true">
              <Database size={20} />
            </span>
            <div>
              <span className={styles.eyebrow}>Variable workspace</span>
              <h2 id={titleId}>Memory variable rules</h2>
            </div>
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
          <section aria-labelledby={`${titleId}-rules`}>
            <h3 id={`${titleId}-rules`}>Creation and connection rules</h3>
            <p className={styles.intro}>Choose how variables are created, connected, reset, or removed from the active Bot Job.</p>
            <div className={styles.rulesGrid}>
              <article className={styles.ruleCard} data-tone="blue">
                <span className={styles.ruleLabel}>SAME VARS</span>
                <h4>Share one variable set</h4>
                <p>All CheckValues share <strong>Left_Operand_1</strong> and <strong>Right_Operand_1</strong>. Other compatible commands share <strong>Variable_1</strong>.</p>
              </article>
              <article className={styles.ruleCard} data-tone="violet">
                <span className={styles.ruleLabel}>DISTINCT</span>
                <h4>Create variables in sequence</h4>
                <p>CheckValues receive matching pairs such as <strong>Left_Operand_1 / Right_Operand_1</strong>, then <strong>Left_Operand_2 / Right_Operand_2</strong>. Other commands receive <strong>Variable_1, Variable_2...</strong> in instruction order.</p>
              </article>
              <article className={styles.ruleCard} data-tone="green">
                <span className={styles.ruleLabel}>AUTO</span>
                <h4>Create and connect</h4>
                <p>Creates missing variables and connects eligible commands automatically using the selected resolution rule.</p>
              </article>
              <article className={styles.ruleCard} data-tone="teal">
                <span className={styles.ruleLabel}>ADD</span>
                <h4>Create without connecting</h4>
                <p>Creates one freely named Bot Job variable. No instruction connection is made automatically.</p>
              </article>
              <article className={styles.ruleCard} data-tone="amber">
                <span className={styles.ruleLabel}>CLEAR</span>
                <h4>Reset runtime memory</h4>
                <p>Resets runtime values to <strong>VOID</strong> while preserving variable definitions and instruction connections.</p>
              </article>
              <article className={styles.ruleCard} data-tone="red">
                <span className={styles.ruleLabel}>ALL</span>
                <h4>Delete every variable</h4>
                <p>Deletes every variable definition and disconnects its instruction slots. Commands and Web Elements remain available.</p>
              </article>
            </div>
          </section>
          <aside className={styles.summary}>
            <Link2 size={19} aria-hidden="true" />
            <div>
              <strong>Variables remain flexible</strong>
              <p>Variables are free to come and go. Deleting one removes its definition and disconnects its relationships; commands and Web Elements remain available to create, reconnect, or change variables whenever needed.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default MemoryVariablesHelpModal;
