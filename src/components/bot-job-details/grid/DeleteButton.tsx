import React from 'react';
import crossImage from '../../../assets/cross.png';
import styles from './DeleteButton.module.scss';

export interface DeleteButtonProps {
  onClick: () => void;
  title?: string;
  /** Kept for caller compatibility; delete controls remain fully visible and clickable. */
  dimmed?: boolean;
  alt?: string;
}

/**
 * The ✕ delete icon, shared by block headers, instruction rows, and the Excel
 * GOTO row. Extracted verbatim from GridItem's `.crossButton` images. The caller
 * decides what is deleted. Delete controls remain fully visible and clickable.
 */
const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, title, alt = '' }) => (
  <img
    src={crossImage}
    alt={alt}
    className={styles.button}
    title={title}
    onClick={onClick}
  />
);

export default DeleteButton;
