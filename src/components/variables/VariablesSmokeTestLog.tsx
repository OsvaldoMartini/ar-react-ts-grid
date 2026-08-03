import React, { useEffect, useRef } from 'react';
import type { VariablesSmokeTestLogEntry } from './domain/variablesSmokeTestTypes';
import styles from './VariablesSmokeTestLog.module.scss';

export interface VariablesSmokeTestLogProps {
  entries: readonly VariablesSmokeTestLogEntry[];
  sequenceLabel?: string;
}

const VariablesSmokeTestLog: React.FC<VariablesSmokeTestLogProps> = ({
  entries,
  sequenceLabel = 'NEXT',
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log !== null) log.scrollTop = log.scrollHeight;
  }, [entries]);

  return (
  <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-label="Smoke Test log">
    {entries.length === 0 ? (
      <span className={styles.empty}>Run a Smoke Test to freeze the visible execution scope.</span>
    ) : entries.map((entry) => {
      const separator = entry.message.indexOf(': ');
      const position = separator < 0
        ? `Step ${entry.sequence}`
        : entry.message.slice(0, separator);
      const detail = separator < 0
        ? entry.message
        : entry.message.slice(separator + 2);
      return (
        <article className={styles[entry.tone.toLocaleLowerCase()]} key={entry.id}>
          <div className={styles.sequence}>
            <span>{sequenceLabel}</span>
            <b>{entry.sequence}</b>
          </div>
          <div className={styles.result}>
            <header>
              <time dateTime={entry.timestamp}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </time>
              <strong>{entry.tone}</strong>
            </header>
            <h4>{position}</h4>
            <p>{detail}</p>
          </div>
        </article>
      );
    })}
  </div>
  );
};

export default VariablesSmokeTestLog;
