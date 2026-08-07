import React from 'react';
import styles from './ScrollingBannerText.module.scss';

type Props = {
  children: React.ReactNode;
  text: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Keeps long row labels moving inside their own bounded viewport. */
const ScrollingBannerText: React.FC<Props> = ({ children, text, className, style }) => {
  const moving = text.trim().length > 24;
  return (
    <span className={`${styles.viewport} ${moving ? styles.moving : ''} ${className ?? ''}`} title={text || undefined} style={style}>
      <span className={styles.track}>
        <span className={styles.copy}>{children}</span>
        {moving && <span className={styles.copy} aria-hidden="true">{children}</span>}
      </span>
    </span>
  );
};

export default ScrollingBannerText;
