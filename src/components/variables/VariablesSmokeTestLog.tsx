import React from 'react';
import type { VariablesSmokeTestLogEntry } from './domain/variablesSmokeTestTypes';
import styles from './VariablesSmokeTestLog.module.scss';

export interface VariablesSmokeTestLogProps {
  entries: readonly VariablesSmokeTestLogEntry[];
}

const VariablesSmokeTestLog: React.FC<VariablesSmokeTestLogProps> = ({ entries }) => (
  <div className={styles.log} role="log" aria-live="polite" aria-label="Smoke Test log">
    {entries.length === 0 ? (
      <span className={styles.empty}>Run a Smoke Test to freeze the visible execution scope.</span>
    ) : entries.map(entry => (
      <article className={styles[entry.tone.toLocaleLowerCase()]} key={entry.id}>
        <time dateTime={entry.timestamp}>
          {new Date(entry.timestamp).toLocaleTimeString()}
        </time>
        <strong>{entry.tone}</strong>
        <p>{entry.message}</p>
      </article>
    ))}
  </div>
);

export default VariablesSmokeTestLog;

