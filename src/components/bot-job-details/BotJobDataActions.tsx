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
    <section className={styles.panel} aria-label="Job files">
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.excelButton}
          title="Open job data"
          disabled={!enabled}
          onClick={() => onAction('OPEN_EXCEL')}
        >
          <FileText size={18} aria-hidden="true" />
          <strong>Excel</strong>
        </button>
        <button
          type="button"
          className={styles.generateButton}
          title="Rebuild spreadsheet"
          disabled={!enabled}
          onClick={generate}
        >
          <PlusCircle size={18} aria-hidden="true" />
          <strong>Generate</strong>
        </button>
        <button
          type="button"
          className={styles.reportButton}
          title="Choose and open"
          disabled={!enabled}
          onClick={() => onAction('OPEN_REPORT')}
        >
          <BarChart2 size={18} aria-hidden="true" />
          <strong>Report</strong>
        </button>
        <button
          type="button"
          className={styles.batButton}
          title="Write local launcher"
          disabled={!enabled}
          onClick={() => onAction('CREATE_BAT')}
        >
          <Flame size={18} aria-hidden="true" />
          <strong>Create BAT</strong>
        </button>
      </div>
    </section>
  );
};

export default BotJobDataActions;
