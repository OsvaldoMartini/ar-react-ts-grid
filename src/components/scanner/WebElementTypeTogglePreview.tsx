import React from 'react';

import clickImage from '../../assets/click.png';
import inputImage from '../../assets/input_field.png';
import outputImage from '../../assets/output1.png';
import styles from './WebElementTypeTogglePreview.module.scss';

export type WebElementExecutionTypePreview = 'INPUT' | 'OUTPUT' | 'CLICK';

interface WebElementTypeTogglePreviewProps {
  className?: string;
  value: WebElementExecutionTypePreview;
}

const TYPE_PRESENTATION: Record<
  WebElementExecutionTypePreview,
  { icon: string; label: string }
> = {
  INPUT: { icon: inputImage, label: 'INPUT' },
  OUTPUT: { icon: outputImage, label: 'OUTPUT' },
  CLICK: { icon: clickImage, label: 'CLICK' },
};

const TYPE_ORDER: WebElementExecutionTypePreview[] = ['INPUT', 'OUTPUT', 'CLICK'];

const WebElementTypeTogglePreview: React.FC<WebElementTypeTogglePreviewProps> = ({
  className,
  value,
}) => {
  const presentation = TYPE_PRESENTATION[value];
  const classNames = [styles.preview, styles[value.toLowerCase()], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      aria-label={`Execution type preview: ${presentation.label}`}
      title="Execution type preview: INPUT / OUTPUT / CLICK"
      disabled
    >
      <span className={styles.currentType}>
        <img src={presentation.icon} alt="" aria-hidden="true" />
        <strong>{presentation.label}</strong>
      </span>
      <span className={styles.positions} aria-hidden="true">
        {TYPE_ORDER.map((type) => (
          <i key={type} className={type === value ? styles.selectedPosition : undefined} />
        ))}
      </span>
    </button>
  );
};

export default WebElementTypeTogglePreview;
