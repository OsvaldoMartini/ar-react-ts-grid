import React, { useEffect, useState } from 'react';
import { Download, FolderOpen, Upload } from 'lucide-react';
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

const BotJobFileActions: React.FC<Props> = ({
  state, connected, pendingAction, busy = false, transferPath, onAction,
}) => {
  const [restoreDate, setRestoreDate] = useState(today);
  const [path, setPath] = useState(transferPath);
  useEffect(() => setPath(transferPath), [transferPath]);

  const enabled = Boolean(connected && state?.capabilities.canUseFileActions && !pendingAction && !busy);
  const canTransfer = enabled && Boolean(path);
  const exportJob = () => {
    if (window.confirm('Export this Bot Job to the selected folder?')) {
      onAction('EXPORT_JOB', { transferPath: path, confirmed: true });
    }
  };
  const importJob = () => {
    if (window.confirm('Import the ' + restoreDate + ' Bot Job backup? Existing data can change.')) {
      onAction('IMPORT_JOB', { transferPath: path, restoreDate, confirmed: true });
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="job-transfer-title">
      <div className={styles.heading}>
        <h2 id="job-transfer-title">Transfer</h2>
        <p>Export or restore a scoped Bot Job backup.</p>
      </div>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
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
        <label className={styles.pathField} htmlFor="bot-job-transfer-path">
          Transfer folder
          <div className={styles.pathInput}>
            <input
              id="bot-job-transfer-path"
              value={path}
              readOnly
              placeholder={state?.transferPathConfigured
                ? 'Choose the configured export folder for this session'
                : 'Choose an export/import folder'}
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
        <div className={styles.actions}>
          <button type="button" disabled={!canTransfer} onClick={exportJob}>
            <Download size={17} aria-hidden="true" /> Export
          </button>
          <button type="button" className={styles.importButton} disabled={!canTransfer || !restoreDate} onClick={importJob}>
            <Upload size={17} aria-hidden="true" /> Import
          </button>
        </div>
      </form>
    </section>
  );
};

export default BotJobFileActions;
