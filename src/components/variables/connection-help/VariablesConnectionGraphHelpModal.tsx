import React, {
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import ExcelGotoHelpGraph from './ExcelGotoHelpGraph';
import IfFamilyHelpGraph from './IfFamilyHelpGraph';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

export type VariablesConnectionGraphKind = 'EXCEL_GOTO' | 'IF_FAMILY';

export interface VariablesConnectionGraphHelpModalProps {
  kind: VariablesConnectionGraphKind;
  onClose: () => void;
}

const VariablesConnectionGraphHelpModal: React.FC<
  VariablesConnectionGraphHelpModalProps
> = ({ kind, onClose }) => {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const excelGoto = kind === 'EXCEL_GOTO';
  const title = excelGoto
    ? 'EXCEL GOTO execution flow'
    : 'IF..ELSE..ENDIF family flow';

  return createPortal(
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
            <div>
              <span>Connection help graph</span>
              <h2 id={titleId}>{title}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label={`Close ${title}`}
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {excelGoto ? <ExcelGotoHelpGraph /> : <IfFamilyHelpGraph />}
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default VariablesConnectionGraphHelpModal;
