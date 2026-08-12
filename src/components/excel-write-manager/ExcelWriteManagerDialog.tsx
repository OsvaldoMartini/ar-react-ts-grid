import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import FloatingWorkspaceFrame from '../workspace/FloatingWorkspaceFrame';
import type {
  ExcelWriteFlushPolicy,
  ExcelWriteManagerState,
} from './domain/excelWriteManager';
import ExcelWriteManagerWorkspace from './ExcelWriteManagerWorkspace';
import styles from './ExcelWriteManagerDialog.module.scss';

type Props = {
  state: ExcelWriteManagerState;
  busy: boolean;
  policyLocked: boolean;
  onPolicyChange: (policy: ExcelWriteFlushPolicy) => void;
  onCellChange: (fileId: string, rowIndex: number, column: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

const ExcelWriteManagerDialog: React.FC<Props> = ({
  state,
  busy,
  policyLocked,
  onPolicyChange,
  onCellChange,
  onSave,
  onClose,
}) => {
  return (
    <FloatingWorkspaceFrame
      className={styles.pane}
      role="region"
      aria-labelledby="excel-writer-manager-title"
      initialPosition={() => ({
        x: Math.max(16, window.innerWidth - Math.min(1080, window.innerWidth - 32) - 24),
        y: 72,
      })}
    >
        <header data-floating-workspace-drag-handle>
          <div><FileSpreadsheet size={21} /><span><small>React execution memory</small>
            <h2 id="excel-writer-manager-title">ExcelWriter Manager</h2></span></div>
          <button type="button" aria-label="Close ExcelWriter Manager"
            data-floating-drag-ignore="true"
            disabled={busy} onClick={onClose}><X size={18} /></button>
        </header>
        <ExcelWriteManagerWorkspace state={state} busy={busy} policyLocked={policyLocked}
          onPolicyChange={onPolicyChange} onCellChange={onCellChange} onSave={onSave} />
    </FloatingWorkspaceFrame>
  );
};

export default ExcelWriteManagerDialog;
