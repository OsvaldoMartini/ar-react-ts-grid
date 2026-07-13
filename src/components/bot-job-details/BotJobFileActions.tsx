import React, { useEffect, useState } from 'react';
import { Download, FolderOpen, Upload, X } from 'lucide-react';
import type { BotJobDetailsState, BotJobToolbarAction, BotJobToolbarPayload } from './BotJobDetails.types';
import styles from './BotJobFileActions.module.scss';

interface Props {
  state: BotJobDetailsState | null;
  connected: boolean;
  pendingAction: BotJobToolbarAction | null;
  busy?: boolean;
  transferPath: string;
  onAction: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

type TransferMode = 'export' | 'import' | null;

const BotJobFileActions: React.FC<Props> = ({
  state, connected, pendingAction, busy = false, transferPath, onAction,
}) => {
  const [restoreDate, setRestoreDate] = useState(today);
  const [path, setPath] = useState(transferPath);
  const [openMode, setOpenMode] = useState<TransferMode>(null);
  useEffect(() => setPath(transferPath), [transferPath]);

  const enabled = Boolean(connected && state?.capabilities.canUseFileActions && !pendingAction && !busy);
  const canConfirm = enabled && Boolean(path) && (openMode !== 'import' || Boolean(restoreDate));

  const confirmTransfer = () => {
    if (!canConfirm) return;
    if (openMode === 'export') {
      onAction('EXPORT_JOB', { transferPath: path, confirmed: true });
    } else if (openMode === 'import') {
      onAction('IMPORT_JOB', { transferPath: path, restoreDate, confirmed: true });
    }
    setOpenMode(null);
  };

  return (
    <section className={styles.panel} aria-labelledby="job-transfer-title">
      <div className={styles.heading} title="Export or restore a scoped Bot Job backup.">
        <h2 id="job-transfer-title">Transfer</h2>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.exportButton} disabled={!enabled} onClick={() => setOpenMode('export')}>
          <Download size={17} aria-hidden="true" /> Export
        </button>
        <button type="button" className={styles.importButton} disabled={!enabled} onClick={() => setOpenMode('import')}>
          <Upload size={17} aria-hidden="true" /> Import
        </button>
      </div>

      {openMode && (
        <div className={styles.backdrop} role="presentation">
          <section
            className={styles.modal}
            aria-label={openMode === 'export' ? 'Export Bot Job' : 'Import Bot Job'}
          >
            <header className={openMode === 'export' ? styles.modalHeaderExport : styles.modalHeaderImport}>
              {openMode === 'export' ? <Download size={19} aria-hidden="true" /> : <Upload size={19} aria-hidden="true" />}
              <span>{openMode === 'export' ? 'Export Bot Job' : 'Import Bot Job'}</span>
              <button type="button" aria-label="Close" title="Close" onClick={() => setOpenMode(null)}>
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.modalForm}>
              {openMode === 'import' && (
                <label className={styles.dateField} htmlFor="bot-job-restore-date">
                  Restore date
                  <input
                    id="bot-job-restore-date"
                    type="date"
                    value={restoreDate}
                    disabled={!enabled}
                    onChange={(event) => setRestoreDate(event.target.value)}
                  />
                </label>
              )}
              <label className={styles.pathField} htmlFor="bot-job-transfer-path">
                {openMode === 'export' ? 'Destination folder' : 'Source folder'}
                <div className={styles.pathInput}>
                  <input
                    id="bot-job-transfer-path"
                    value={path}
                    readOnly
                    placeholder="Choose an exporting/importing folder"
                  />
                  <button
                    type="button"
                    aria-label="Choose transfer folder"
                    title="Choose transfer folder"
                    disabled={!enabled}
                    onClick={() => onAction('CHOOSE_TRANSFER_PATH')}
                  >
                    <FolderOpen size={18} aria-hidden="true" />
                  </button>
                </div>
              </label>
              <p className={styles.modalWarning}>
                {openMode === 'export'
                  ? 'Existing job data in the destination folder may be replaced.'
                  : 'Existing job data can change after import.'}
              </p>
            </div>
            <footer className={styles.modalFooter}>
              <button type="button" className={styles.cancelButton} onClick={() => setOpenMode(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={openMode === 'export' ? styles.exportButton : styles.importButton}
                aria-label={openMode === 'export' ? 'Confirm export' : 'Confirm import'}
                disabled={!canConfirm}
                onClick={confirmTransfer}
              >
                {openMode === 'export' ? 'Export' : 'Import'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
};

export default BotJobFileActions;
