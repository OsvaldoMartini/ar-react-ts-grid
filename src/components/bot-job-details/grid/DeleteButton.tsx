import React from 'react';
import crossImage from '../../../assets/cross.png';
import styles from './DeleteButton.module.scss';

export interface DeleteButtonProps {
  onClick: () => void;
  title?: string;
  /** Dim the icon (to 0.35 opacity) when the delete is not currently allowed. */
  dimmed?: boolean;
  alt?: string;
}

/**
 * The ✕ delete icon, shared by block headers, instruction rows, and the Excel
 * GOTO row. Extracted verbatim from GridItem's `.crossButton` images. The caller
 * decides what is deleted and whether it is allowed (dimmed).
 */
const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, title, dimmed = false, alt = '' }) => (
  <img
    src={crossImage}
    alt={alt}
    className={styles.button}
    title={title}
    style={{ opacity: dimmed ? 0.35 : 1 }}
    onClick={onClick}
  />
);

export default DeleteButton;
