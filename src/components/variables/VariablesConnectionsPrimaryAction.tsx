import type { FC } from 'react';
import { RulesCard, type RulesCardEvent } from '../RulesCard';
import styles from './VariablesConnectionsPrimaryAction.module.scss';

export type VariablesConnectionsPrimaryActionProps = Readonly<{
  scopeLabel: string;
  onReview: () => void;
}>;

const reviewConnectionsEvent: RulesCardEvent = Object.freeze({
  color: 'green',
  rules: 'REVIEW ALL CONNECTIONS',
  ts: 0,
});

/**
 * Isolated read-only entry point for the complete Variables execution review.
 *
 * This action intentionally has no mutation or movement disabled state. Its
 * caller controls whether it is rendered by providing a loaded snapshot.
 */
export const VariablesConnectionsPrimaryAction: FC<
  VariablesConnectionsPrimaryActionProps
> = ({ scopeLabel, onReview }) => (
  <RulesCard
    event={reviewConnectionsEvent}
    className={styles.reviewAction}
    ariaLabel={`Review connections for ${scopeLabel}`}
    animate={false}
    pulse
    glow
    border
    onClick={(event) => {
      // Preserve a deterministic return-focus target for the review modal.
      event.currentTarget.focus();
      onReview();
    }}
    title={`Review connections for ${scopeLabel}`}
  />
);

export default VariablesConnectionsPrimaryAction;
