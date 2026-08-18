import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CommandEditorRelationshipImpact } from './commandEditorRelationshipImpact';
import styles from './CommandEditorRelationshipWarningModal.module.scss';

interface CommandEditorRelationshipWarningModalProps {
  impact: CommandEditorRelationshipImpact;
  onContinue: () => void;
  onCancel: () => void;
}

const CommandEditorRelationshipWarningModal: React.FC<
  CommandEditorRelationshipWarningModalProps
> = ({ impact, onContinue, onCancel }) => (
  <div className={styles.backdrop} role="presentation">
    <section
      className={styles.dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="command-editor-relationship-warning-title"
    >
      <AlertTriangle size={34} aria-hidden="true" />
      <h3 id="command-editor-relationship-warning-title">Connection Will Be Disconnected</h3>
      <p>The selected placement breaks an instruction relationship.</p>
      <ul>
        {impact.messages.map(message => <li key={message}>{message}</li>)}
      </ul>
      <p className={styles.result}>
        Continue will move the instruction and clear only the invalid parent or Block connection.
        You can reconnect it later with Resolve Connections.
      </p>
      <footer>
        <button type="button" className={styles.cancel} onClick={onCancel}>CANCEL</button>
        <button type="button" className={styles.continue} onClick={onContinue}>CONTINUE</button>
      </footer>
    </section>
  </div>
);

export default CommandEditorRelationshipWarningModal;
