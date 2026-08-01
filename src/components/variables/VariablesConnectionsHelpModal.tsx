import React, {
  useEffect,
  useId,
  useRef,
} from 'react';
import { CircleHelp, X } from 'lucide-react';
import styles from './VariablesConnectionsHelpModal.module.scss';

export interface VariablesConnectionsHelpModalProps {
  onClose: () => void;
}

const VariablesConnectionsHelpModal: React.FC<
  VariablesConnectionsHelpModalProps
> = ({ onClose }) => {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            closeButtonRef.current?.focus();
            return;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <header className={styles.header}>
          <div className={styles.titleLine}>
            <CircleHelp size={22} aria-hidden="true" />
            <h2 id={titleId}>How Resolve X Connections works</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="Close Resolve Connections help"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3>Connection selection rules</h3>
            <ul>
              <li>
                <strong>AUTO SELECTED:</strong> Exactly one compatible target
                exists, so it selects automatically.
              </li>
              <li>
                <strong>SELECT TARGET:</strong> Multiple compatible targets
                exist. The first available target at the top is selected
                automatically, and you can change it before resolving.
              </li>
              <li>
                <strong>NO COMPATIBLE TARGET:</strong> Zero valid targets exist.
              </li>
              <li>
                <strong>SELECT PARENT FIRST:</strong> Another parent relationship
                must be resolved before the variable target can be calculated.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3>Compatible targets depend on the relationship</h3>
            <ul>
              <li>
                <strong>GET/SET/commands:</strong> Compatible preceding Web
                Elements in the same Block.
              </li>
              <li>
                <strong>LOOP:</strong> Preceding Web Elements in the same Block.
              </li>
              <li>
                <strong>GOTO/EXCEL GOTO:</strong> Blocks other than the
                containing Block.
              </li>
              <li>
                <strong>Variable binding:</strong> Compatible variables.
              </li>
              <li>
                <strong>Conditional commands:</strong> Compatible conditional
                roots.
              </li>
            </ul>
          </section>

          <p className={styles.scopeNote}>
            Resolve X Connections counts and applies only the connections shown
            by the current Block filter. Select All blocks to resolve the full
            frozen scope.
          </p>
        </div>
      </section>
    </div>
  );
};

export default VariablesConnectionsHelpModal;
