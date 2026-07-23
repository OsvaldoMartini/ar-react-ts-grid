import React, { useCallback, useEffect } from 'react';
import styles from './ConfirmationDialog.module.scss';

type Props = {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  error?: boolean;
  alert?: boolean;
  showHeaderClose?: boolean;
  autoDismissMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmationDialog: React.FC<Props> = ({
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  error = false,
  alert = false,
  showHeaderClose = false,
  autoDismissMs,
  onConfirm,
  onCancel,
}) => {
  const dismiss = useCallback(() => {
    if (alert) onConfirm();
    else onCancel();
  }, [alert, onCancel, onConfirm]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  useEffect(() => {
    if (!alert || !autoDismissMs || autoDismissMs <= 0) return undefined;
    const timer = window.setTimeout(dismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [alert, autoDismissMs, dismiss]);

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role={alert || error ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <div className={styles.header}>
          <span id="confirmation-dialog-title">{title}</span>
          {showHeaderClose && (
            <button
              type="button"
              className={styles.headerCloseButton}
              aria-label="Close"
              title="Close"
              onClick={dismiss}
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.body}>
          <p>{message}</p>
          {detail && (
            <p className={`${styles.detail} ${error ? styles.error : ''}`}>{detail}</p>
          )}
        </div>
        <footer className={styles.footer}>
          {!alert && (
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            className={destructive || error ? styles.dangerButton : styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default ConfirmationDialog;
