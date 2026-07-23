import React, { useEffect } from 'react';
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
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (alert) onConfirm();
      else onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onCancel, onConfirm]);

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role={alert || error ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <div id="confirmation-dialog-title" className={styles.header}>{title}</div>
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
