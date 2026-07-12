import React from 'react';
import { BarChart2, FileText, Flame, PlusCircle } from 'lucide-react';
import type { BotJobDetailsState, BotJobToolbarAction, BotJobToolbarPayload } from './BotJobDetails.types';
import styles from './BotJobDataActions.module.scss';

interface Props {
  state: BotJobDetailsState | null;
  connected: boolean;
  pendingAction: BotJobToolbarAction | null;
  busy?: boolean;
  onAction: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
}

const BotJobDataActions: React.FC<Props> = ({ state, connected, pendingAction, busy = false, onAction }) => {
  const enabled = Boolean(connected && state?.capabilities.canUseFileActions && !pendingAction && !busy);
  const generate = () => {
    if (window.confirm('Generate the Excel file? Existing job data may be replaced.')) {
      onAction('GENERATE_EXCEL', { confirmed: true });
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="job-files-title">
      <div className={styles.heading}>
        <h2 id="job-files-title">Job files</h2>
        <p>Spreadsheet, report, and portable launcher actions.</p>
      </div>
      <div className={styles.actions}>
        <button type="button" disabled={!enabled} onClick={() => onAction('OPEN_EXCEL')}>
          <FileText size={18} aria-hidden="true" />
          <span><strong>Excel</strong><small>Open job data</small></span>
        </button>
        <button type="button" disabled={!enabled} onClick={generate}>
          <PlusCircle size={18} aria-hidden="true" />
          <span><strong>Generate</strong><small>Rebuild spreadsheet</small></span>
        </button>
        <button type="button" disabled={!enabled} onClick={() => onAction('OPEN_REPORT')}>
          <BarChart2 size={18} aria-hidden="true" />
          <span><strong>Report</strong><small>Choose and open</small></span>
        </button>
        <button type="button" disabled={!enabled} onClick={() => onAction('CREATE_BAT')}>
          <Flame size={18} aria-hidden="true" />
          <span><strong>Create BAT</strong><small>Write local launcher</small></span>
        </button>
      </div>
    </section>
  );
};

export default BotJobDataActions;
