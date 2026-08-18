import React from 'react';
import refreshLoopImage from '../../assets/refresh-loop.png';
import refreshOnlyImage from '../../assets/refresh-only.png';
import styles from './InstructionReferenceIcons.module.scss';

export interface InstructionReferenceIcon {
  instructionId: number;
  action: 'LOOP' | 'REFRESH_LOOP';
}

interface InstructionReferenceIconsProps {
  references: readonly InstructionReferenceIcon[];
  disabled?: boolean;
  onReferenceClick?: (reference: InstructionReferenceIcon) => void;
}

const REFERENCE_PRESENTATION = {
  LOOP: {
    image: refreshOnlyImage,
    label: 'Loop',
    icon: 'REFRESH',
  },
  REFRESH_LOOP: {
    image: refreshLoopImage,
    label: 'Refresh Loop',
    icon: 'REFRESH_LOOP',
  },
} as const;

const InstructionReferenceIcons: React.FC<InstructionReferenceIconsProps> = ({
  references,
  disabled = false,
  onReferenceClick,
}) => {
  if (references.length === 0) return null;

  return (
    <span className={styles.icons} aria-label="Connected instruction references">
      {references.map((reference) => {
        const presentation = REFERENCE_PRESENTATION[reference.action];
        return (
          <button
            key={`${reference.action}:${reference.instructionId}`}
            type="button"
            className={styles.iconButton}
            aria-label={`Change ${presentation.label} connection for instruction ${reference.instructionId}`}
            title={`${presentation.label} (ID ${reference.instructionId}) connected to this Web Element`}
            disabled={disabled || !onReferenceClick}
            onMouseDown={event => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onReferenceClick?.(reference);
            }}
          >
            <img
              src={presentation.image}
              alt=""
              className={styles.icon}
              data-command-icon={presentation.icon}
            />
          </button>
        );
      })}
    </span>
  );
};

export default InstructionReferenceIcons;
