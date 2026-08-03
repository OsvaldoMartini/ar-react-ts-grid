import React from 'react';
import { canonicalInstructionAction } from './domain/instructionRelationshipPolicy';
import styles from './InstructionCommandValues.module.scss';

export interface InstructionCommandValuesProps {
  action: string | null | undefined;
  operation?: string | null;
  onHoldSeconds?: number | null;
  className?: string;
}

type CommandValuePresentation = {
  title: string;
  rows: readonly { label: string; value: string }[];
};

const commandValuePresentation = ({
  action,
  operation,
  onHoldSeconds,
}: InstructionCommandValuesProps): CommandValuePresentation | null => {
  const canonicalAction = canonicalInstructionAction(action ?? '');
  const operationText = (operation ?? '').trim();

  if (
    (canonicalAction === 'LOOP' || canonicalAction === 'REFRESH_LOOP')
    && operationText
  ) {
    const [interval, iterations] = operationText
      .split(':')
      .map(part => part.trim());
    if (interval && iterations) {
      return {
        title: `Time ${interval}s · Loop ${iterations} times`,
        rows: [
          { label: 'T:', value: `${interval}s` },
          { label: 'L:', value: iterations },
        ],
      };
    }
  }

  if (canonicalAction === 'GOTO' && operationText) {
    return {
      title: `GOTO limit ${operationText}`,
      rows: [{ label: 'L:', value: operationText }],
    };
  }

  if (
    (canonicalAction === 'SWIPE_UP' || canonicalAction === 'SWIPE_DOWN')
    && operationText
  ) {
    return {
      title: `Swipe ${operationText} time(s)`,
      rows: [{ label: 'R:', value: operationText }],
    };
  }

  if (
    canonicalAction === 'H'
    && typeof onHoldSeconds === 'number'
    && onHoldSeconds > 0
  ) {
    return {
      title: `Wait ${onHoldSeconds} second(s)`,
      rows: [{ label: 'S:', value: String(onHoldSeconds) }],
    };
  }

  return null;
};

const InstructionCommandValues: React.FC<InstructionCommandValuesProps> = props => {
  const presentation = commandValuePresentation(props);
  if (!presentation) return null;

  const className = [styles.values, props.className].filter(Boolean).join(' ');
  return (
    <span className={className} title={presentation.title}>
      {presentation.rows.map(row => (
        <span key={row.label} className={styles.valueRow}>
          <span className={styles.valueLabel}>{row.label}</span>
          <span className={styles.valueNumber}>{row.value}</span>
        </span>
      ))}
    </span>
  );
};

export default InstructionCommandValues;
