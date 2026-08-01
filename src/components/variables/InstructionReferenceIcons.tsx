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
}) => {
  if (references.length === 0) return null;

  return (
    <span className={styles.icons} aria-label="Connected instruction references">
      {references.map((reference) => {
        const presentation = REFERENCE_PRESENTATION[reference.action];
        return (
          <img
            key={`${reference.action}:${reference.instructionId}`}
            src={presentation.image}
            alt=""
            className={styles.icon}
            data-command-icon={presentation.icon}
            title={`${presentation.label} (ID ${reference.instructionId}) connected to this Web Element`}
          />
        );
      })}
    </span>
  );
};

export default InstructionReferenceIcons;
