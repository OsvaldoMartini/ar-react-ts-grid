import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { CircleHelp, X } from 'lucide-react';
import VariablesConnectionGraphHelpModal, {
  type VariablesConnectionGraphKind,
} from './connection-help/VariablesConnectionGraphHelpModal';
import styles from './VariablesConnectionsHelpModal.module.scss';

export interface VariablesConnectionsHelpModalProps {
  onClose: () => void;
}

const VariablesConnectionsHelpModal: React.FC<
  VariablesConnectionsHelpModalProps
> = ({ onClose }) => {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [graphHelp, setGraphHelp] = useState<
    VariablesConnectionGraphKind | null
  >(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <>
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
            <div className={styles.tableScroll}>
              <table className={styles.compatibilityTable}>
                <thead>
                  <tr>
                    <th scope="col">Command/connection</th>
                    <th scope="col">Final rule</th>
                    <th scope="col" className={styles.helpColumn}>Help</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Web Element parent</th>
                    <td>
                      Must be a preceding compatible <strong>Web Element</strong>{' '}
                      in the same Block.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">IF..ELSE..ENDIF FAMILY</th>
                    <td>
                      Must connect to the single <strong>IF</strong> root in the
                      same Block.
                    </td>
                    <td className={styles.helpCell}>
                      <button
                        type="button"
                        className={styles.helpPlaceholder}
                        aria-label="Open IF, ELSE, and ENDIF family flow help"
                        title="Open IF family flow"
                        onClick={() => setGraphHelp('IF_FAMILY')}
                      >
                        <CircleHelp size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">EXCEL GOTO</th>
                    <td>
                      Dataset controller with <strong>Return Block</strong> and{' '}
                      <strong>End Block</strong>. Only one active{' '}
                      <strong>EXCEL GOTO</strong> is initially allowed per Bot Job.
                    </td>
                    <td className={styles.helpCell}>
                      <button
                        type="button"
                        className={styles.helpPlaceholder}
                        aria-label="Open EXCEL GOTO execution flow help"
                        title="Open EXCEL GOTO flow"
                        onClick={() => setGraphHelp('EXCEL_GOTO')}
                      >
                        <CircleHelp size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">CHECKVALUE</th>
                    <td>
                      Uses two variables and an operator:{' '}
                      <strong>Left_Operand</strong> <strong>Operator</strong>{' '}
                      <strong>Right_Operand</strong>. It does not require a{' '}
                      <strong>Web Element</strong> parent.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">GET</th>
                    <td>
                      Reads the connected <strong>Web Element</strong>&apos;s value
                      and stores it in the selected variable. Requires a preceding{' '}
                      <strong>Web Element</strong> and one compatible{' '}
                      <strong>$String</strong> or <strong>#Numeric</strong>{' '}
                      variable. Variable ownership does not restrict selection.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">SET</th>
                    <td>
                      Reads the selected variable&apos;s value and writes it into the
                      connected <strong>Web Element</strong>. Requires a preceding
                      writable <strong>Web Element</strong> and one compatible{' '}
                      <strong>$String</strong> or <strong>#Numeric</strong>{' '}
                      variable.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">LOOP</th>
                    <td>
                      May connect to any preceding <strong>Web Element</strong> or
                      command in the same Block. When executed, it waits for its
                      configured interval and jumps to that parent until its
                      iteration count finishes.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">GOTO</th>
                    <td>
                      Targets another Block. It cannot target its own containing
                      Block. It jumps according to its configured count.
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">REFRESH LOOP</th>
                    <td>
                      Uses the same anchor rules as <strong>LOOP</strong>. It
                      refreshes the browser, waits for the configured interval,
                      and jumps to its parent until its iteration count finishes.
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <p className={styles.scopeNote}>
            Resolve X Connections counts and applies only the connections shown
            by the current Block filter. Select All blocks to resolve the full
            frozen scope.
          </p>
        </div>
        </section>
      </div>
      {graphHelp && (
        <VariablesConnectionGraphHelpModal
          kind={graphHelp}
          onClose={() => setGraphHelp(null)}
        />
      )}
    </>
  );
};

export default VariablesConnectionsHelpModal;
