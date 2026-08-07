import React from 'react';

import clickImage from '../../assets/click.png';
import inputImage from '../../assets/input_field.png';
import outputImage from '../../assets/output1.png';
import {
  nextWebElementExecutionType,
  type WebElementExecutionType,
  WEB_ELEMENT_EXECUTION_TYPES,
} from '../webElementExecutionType';
import styles from './WebElementTypeToggle.module.scss';

export interface WebElementTypeToggleProps {
  className?: string;
  value: WebElementExecutionType;
  onChange: (value: WebElementExecutionType) => void;
  disabled?: boolean;
  pending?: boolean;
}

const TYPE_PRESENTATION: Record<
  WebElementExecutionType,
  { icon: string; label: string }
> = {
  INPUT: { icon: inputImage, label: 'INPUT' },
  OUTPUT: { icon: outputImage, label: 'OUTPUT' },
  CLICK: { icon: clickImage, label: 'CLICK' },
};

const WebElementTypeToggle: React.FC<WebElementTypeToggleProps> = ({
  className,
  value,
  onChange,
  disabled = false,
  pending = false,
}) => {
  const presentation = TYPE_PRESENTATION[value];
  const nextValue = nextWebElementExecutionType(value);
  const classNames = [
    styles.toggle,
    styles[value.toLowerCase()],
    pending ? styles.pending : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      aria-busy={pending || undefined}
      aria-label={pending
        ? `Updating execution type ${presentation.label}.`
        : `Execution type ${presentation.label}. Change to ${nextValue}.`}
      title={pending
        ? `Updating execution type: ${presentation.label}.`
        : `Execution type: ${presentation.label}. Click to change to ${nextValue}.`}
      disabled={disabled || pending}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled || pending) return;
        onChange(nextValue);
      }}
    >
      <span className={styles.currentType}>
        <img src={presentation.icon} alt="" aria-hidden="true" />
        <strong>{presentation.label}</strong>
      </span>
      <span className={styles.positions} aria-hidden="true">
        {WEB_ELEMENT_EXECUTION_TYPES.map((type) => (
          <i key={type} className={type === value ? styles.selectedPosition : undefined} />
        ))}
      </span>
    </button>
  );
};

export default WebElementTypeToggle;
