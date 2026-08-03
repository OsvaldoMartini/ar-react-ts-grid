import React from 'react';
import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import styles from './InstructionIntrinsicValues.module.scss';

export interface InstructionIntrinsicValuesProps {
  action: string;
  operation?: string | null;
  onHoldSeconds?: number | null;
  remainingCount?: number | null;
}

type IntrinsicValuePresentation = {
  rows: readonly { label: string; value: string }[];
  title: string;
};

export const instructionIntrinsicValuePresentation = ({
  action,
  operation,
  onHoldSeconds,
}: InstructionIntrinsicValuesProps): IntrinsicValuePresentation | null => {
  const canonicalAction = canonicalInstructionAction(action);
  const normalizedOperation = operation?.trim() ?? '';

  if (
    (canonicalAction === 'LOOP' || canonicalAction === 'REFRESH_LOOP')
    && normalizedOperation
  ) {
    const [interval, iterations] = normalizedOperation
      .split(':')
      .map(part => part.trim());
    if (interval && iterations) {
      return {
        rows: [
          { label: 'T:', value: `${interval}s` },
          { label: 'L:', value: iterations },
        ],
        title: `Time ${interval}s - Loop ${iterations} times`,
      };
    }
  }

  if (canonicalAction === 'GOTO' && normalizedOperation) {
    return {
      rows: [{ label: 'L:', value: normalizedOperation }],
      title: `GOTO limit ${normalizedOperation}`,
    };
  }

  if (
    (canonicalAction === 'SWIPE_UP' || canonicalAction === 'SWIPE_DOWN')
    && normalizedOperation
  ) {
    return {
      rows: [{ label: 'R:', value: normalizedOperation }],
      title: `Swipe ${normalizedOperation} time(s)`,
    };
  }

  if (
    canonicalAction === 'H'
    && typeof onHoldSeconds === 'number'
    && Number.isFinite(onHoldSeconds)
    && onHoldSeconds > 0
  ) {
    return {
      rows: [{ label: 'S:', value: String(onHoldSeconds) }],
      title: `Wait ${onHoldSeconds} second(s)`,
    };
  }

  return null;
};

const InstructionIntrinsicValues: React.FC<InstructionIntrinsicValuesProps> = (props) => {
  const presentation = instructionIntrinsicValuePresentation(props);
  if (presentation === null) return null;
  const canonicalAction = canonicalInstructionAction(props.action);
  const rendersCountdown = canonicalAction === 'LOOP'
    || canonicalAction === 'REFRESH_LOOP'
    || canonicalAction === 'GOTO';

  return (
    <span className={styles.values} title={presentation.title}>
      {presentation.rows.map(row => (
        <span key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.number}>
            {rendersCountdown
              && row.label === 'L:'
              && typeof props.remainingCount === 'number'
                ? props.remainingCount
                : row.value}
          </span>
        </span>
      ))}
    </span>
  );
};

export default InstructionIntrinsicValues;
