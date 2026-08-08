import React from 'react';

import clickImage from '../../assets/click.png';
import inputImage from '../../assets/input_field.png';
import outputImage from '../../assets/output1.png';
import {
  nextPageScannerElementExecutionType,
  PAGE_SCANNER_ELEMENT_EXECUTION_TYPES,
  type PageScannerElementExecutionType,
} from './PageScannerElementExecutionType';
import styles from './PageScannerElementTypeToggle.module.scss';

export interface PageScannerElementTypeToggleProps {
  className?: string;
  value: PageScannerElementExecutionType;
  onChange: (value: PageScannerElementExecutionType) => void;
  disabled?: boolean;
}

const TYPE_PRESENTATION: Record<
  PageScannerElementExecutionType,
  { icon: string; label: string }
> = {
  INPUT: { icon: inputImage, label: 'INPUT' },
  OUTPUT: { icon: outputImage, label: 'OUTPUT' },
  CLICK: { icon: clickImage, label: 'CLICK' },
};

const PageScannerElementTypeToggle: React.FC<PageScannerElementTypeToggleProps> = ({
  className,
  value,
  onChange,
  disabled = false,
}) => {
  const presentation = TYPE_PRESENTATION[value];
  const nextValue = nextPageScannerElementExecutionType(value);
  const classNames = [
    styles.toggle,
    styles[value.toLowerCase()],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      aria-label={`Scanner execution type ${presentation.label}. Change to ${nextValue}.`}
      title={`Scanner execution type: ${presentation.label}. Click to change to ${nextValue}.`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onChange(nextValue);
      }}
    >
      <span className={styles.currentType}>
        <img src={presentation.icon} alt="" aria-hidden="true" />
        <strong>{presentation.label}</strong>
      </span>
      <span className={styles.positions} aria-hidden="true">
        {PAGE_SCANNER_ELEMENT_EXECUTION_TYPES.map((type) => (
          <i key={type} className={type === value ? styles.selectedPosition : undefined} />
        ))}
      </span>
    </button>
  );
};

export default PageScannerElementTypeToggle;
