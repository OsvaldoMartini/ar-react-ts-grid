import React, { useState } from 'react';
import { BarChart2, FileText, Flame, PlusCircle } from 'lucide-react';
import QuestionsCard from '../QuestionsCard';
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
  const [generateConfirmationOpen, setGenerateConfirmationOpen] = useState(false);
  const enabled = Boolean(connected && state?.capabilities.canUseFileActions && !pendingAction && !busy);
  const generate = () => {
    setGenerateConfirmationOpen(true);
  };
  const confirmGenerate = () => {
    setGenerateConfirmationOpen(false);
    onAction('GENERATE_EXCEL', { confirmed: true });
  };

  return (
    <>
    <div className={styles.actions} role="group" aria-label="Job files">
      <button
        type="button"
        className={styles.excelButton}
        title="Excel — Open job data"
        disabled={!enabled}
        onClick={() => onAction('OPEN_EXCEL')}
      >
        <FileText size={16} aria-hidden="true" />
        Excel
      </button>
      <button
        type="button"
        className={styles.generateButton}
        title="Generate — Rebuild spreadsheet"
        disabled={!enabled}
        onClick={generate}
      >
        <PlusCircle size={16} aria-hidden="true" />
        Generate
      </button>
      <button
        type="button"
        className={styles.reportButton}
        title="Report — Choose and open"
        disabled={!enabled}
        onClick={() => onAction('OPEN_REPORT')}
      >
        <BarChart2 size={16} aria-hidden="true" />
        Report
      </button>
      <button
        type="button"
        className={styles.batButton}
        aria-label="Create BAT"
        title="Create BAT — Write local launcher"
        disabled={!enabled}
        onClick={() => onAction('CREATE_BAT')}
      >
        <Flame size={16} aria-hidden="true" />
      </button>
    </div>
    {generateConfirmationOpen && (
      <QuestionsCard
        mode="confirm"
        header="Generate Excel file?"
        body="Existing job data may be replaced."
        extraMsg="The workbook for the current Bot Job will be rebuilt."
        okLabel="Generate"
        onCancel={() => setGenerateConfirmationOpen(false)}
        onSubmit={confirmGenerate}
      />
    )}
    </>
  );
};

export default BotJobDataActions;
