import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CommandEditorConditionalFamilyImpact } from './commandEditorConditionalFamilyImpact';
import styles from './CommandEditorRelationshipWarningModal.module.scss';

interface Props {
  impact: CommandEditorConditionalFamilyImpact;
  onContinue: () => void;
  onCancel: () => void;
}

const CommandEditorConditionalFamilyWarningModal: React.FC<Props> = ({
  impact,
  onContinue,
  onCancel,
}) => (
  <div className={styles.backdrop} role="presentation">
    <section
      className={styles.dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="command-editor-conditional-warning-title"
    >
      <AlertTriangle size={34} aria-hidden="true" />
      <h3 id="command-editor-conditional-warning-title">Remove IF Family?</h3>
      <p>
        Instruction #{impact.selectedInstructionId} will become {impact.targetAction}.
        The other structural boundaries must be removed first.
      </p>
      <ul>
        {impact.boundariesToDelete.map(boundary => (
          <li key={boundary.instructionId}>
            #{boundary.instructionOrder ?? '?'} {canonicalLabel(boundary.action)}
            {' '}(ID {boundary.instructionId})
          </li>
        ))}
      </ul>
      <p className={styles.result}>
        Positional body commands remain unchanged. Continue removes only the listed
        IF/ELSEIF/ELSE/ENDIF boundaries, then updates the selected command atomically.
      </p>
      <footer>
        <button type="button" className={styles.cancel} onClick={onCancel}>CANCEL</button>
        <button type="button" className={styles.continue} onClick={onContinue}>CONTINUE</button>
      </footer>
    </section>
  </div>
);

const canonicalLabel = (action: string): string => action.trim().toUpperCase();

export default CommandEditorConditionalFamilyWarningModal;
