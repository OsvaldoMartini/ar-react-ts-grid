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
                <strong>AUTO SELECTED — Web Elements:</strong> Exactly one
                compatible <strong>Web Element</strong> exists, so it is selected
                automatically.
              </li>
              <li>
                <strong>SELECT TARGET — Web Elements:</strong> Multiple
                compatible <strong>Web Elements</strong> exist. The first
                compatible <strong>Web Element</strong> is selected automatically,
                but you can change it before resolving.
              </li>
              <li>
                <strong>NO COMPATIBLE TARGET — Web Elements:</strong> No
                compatible <strong>Web Element</strong> exists. The parent remains
                unresolved for the client to configure later.
              </li>
              <li>
                <strong>VARIABLE AUTO RESOLUTION:</strong>{' '}
                <strong>Variables</strong> are independent of{' '}
                <strong>Web Element</strong> parents and are always resolved
                separately.
              </li>
              <li>
                <strong>DEFAULT VARIABLE CREATED:</strong> If a command requires
                a variable and none exists, a sequential variable such as
                <strong> Variable_1</strong> is created and connected
                automatically.
              </li>
              <li>
                <strong>CHECKVALUE VARIABLES:</strong>{' '}
                <strong>CHECKVALUE</strong> requires two independent variables.
                The oldest compatible variable becomes{' '}
                <strong>Left_Operand</strong>, and the next becomes{' '}
                <strong>Right_Operand</strong>. Missing operands are created
                automatically.
              </li>
              <li>
                <strong>IF FAMILY CREATED:</strong> Adding <strong>IF</strong>{' '}
                automatically creates <strong>IF → ELSE → ENDIF</strong>.
                Additional <strong>ELSEIF</strong> commands may be inserted between{' '}
                <strong>IF</strong> and <strong>ELSE</strong>.
              </li>
              <li>
                <strong>EXCEL GOTO LIMITED:</strong> Only one active{' '}
                <strong>EXCEL GOTO</strong> is allowed per Bot Job. It requires a{' '}
                <strong>Return Block</strong> and an <strong>End Block</strong>.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3>Compatible targets depend on the relationship</h3>
            <ul>
              <li>
                <strong>Web Element parent:</strong> Must be a preceding
                compatible <strong>Web Element</strong> in the same Block.
              </li>
              <li>
                <strong>GET:</strong> Reads the connected{' '}
                <strong>Web Element</strong>&apos;s value
                and stores it in the selected variable. Requires a preceding{' '}
                <strong>Web Element</strong> and one compatible{' '}
                <strong>$String</strong> or{' '}
                <strong>#Numeric</strong> variable. Variable ownership does not
                restrict selection.
              </li>
              <li>
                <strong>SET:</strong> Reads the selected variable&apos;s value and
                writes it into the connected <strong>Web Element</strong>.
                Requires a preceding writable <strong>Web Element</strong> and one
                compatible <strong>$String</strong> or <strong>#Numeric</strong>{' '}
                variable.
              </li>
              <li>
                <strong>LOOP:</strong> May connect to any preceding{' '}
                <strong>Web Element</strong> or command in the same Block. When
                executed, it waits for its configured interval and jumps to that
                parent until its iteration count finishes.
              </li>
              <li>
                <strong>REFRESH LOOP:</strong> Uses the same anchor rules as
                <strong> LOOP</strong>. It refreshes the browser, waits for the
                configured interval, and jumps to its parent until its iteration
                count finishes.
              </li>
              <li>
                <strong>GOTO:</strong> Targets another Block. It cannot target
                its own containing Block. It jumps according to its configured
                count.
              </li>
              <li>
                <strong>EXCEL GOTO:</strong> Dataset controller with{' '}
                <strong>Return Block</strong> and <strong>End Block</strong>. Only
                one active <strong>EXCEL GOTO</strong> is initially allowed per Bot
                Job.
              </li>
              <li>
                <strong>CHECKVALUE:</strong> Uses two variables and an operator:
                <strong> Left_Operand</strong>{' '}
                <strong>Operator</strong> <strong>Right_Operand</strong>. It does
                not require a <strong>Web Element</strong> parent.
              </li>
              <li>
                <strong>ELSEIF / ELSE / ENDIF:</strong> Must connect to the single
                <strong> IF</strong> root in the same Block.
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
