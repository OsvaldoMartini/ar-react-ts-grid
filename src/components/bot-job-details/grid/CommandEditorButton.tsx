import React from 'react';
import menuDownImage from '../../../assets/menu-down.png';
import styles from './CommandEditorButton.module.scss';

export interface CommandEditorButtonProps {
  onClick: () => void;
  title?: string;
  alt?: string;
}

/**
 * The per-instruction-row arrow that opens the Command Editor. Extracted verbatim
 * from GridItem's `.dropdownColumn`/`.dropdownArrow` block. Presentational only.
 */
const CommandEditorButton: React.FC<CommandEditorButtonProps> = ({
  onClick,
  title = 'Open Command Editor',
  alt = 'Open Command Editor',
}) => (
  <div className={styles.column}>
    <img src={menuDownImage} className={styles.arrow} alt={alt} title={title} onClick={onClick} />
  </div>
);

export default CommandEditorButton;
