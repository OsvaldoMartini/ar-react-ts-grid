import React, { useEffect, useRef } from 'react';
import type { VariablesSmokeTestLogEntry } from './domain/variablesSmokeTestTypes';
import styles from './VariablesSmokeTestLog.module.scss';

export interface VariablesSmokeTestLogProps {
  entries: readonly VariablesSmokeTestLogEntry[];
}

const VariablesSmokeTestLog: React.FC<VariablesSmokeTestLogProps> = ({ entries }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log !== null) log.scrollTop = log.scrollHeight;
  }, [entries]);

  return (
  <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-label="Smoke Test log">
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
};

export default VariablesSmokeTestLog;
