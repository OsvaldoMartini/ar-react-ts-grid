import React from 'react';
import activeImage from '../../../assets/active3.png';
import inactiveImage from '../../../assets/inactive2.png';
import styles from './BlockStatusToggle.module.scss';

export interface BlockStatusToggleProps {
  active: boolean;
  onToggle: () => void;
}

/**
 * Active/inactive control for a Bot Job Details block header.
 * State ownership and persistence remain in GridItem.
 */
const BlockStatusToggle: React.FC<BlockStatusToggleProps> = ({ active, onToggle }) => (
  <img
    src={active ? activeImage : inactiveImage}
    alt={active ? 'Active' : 'Inactive'}
    className={styles.button}
    onClick={onToggle}
  />
);

export default BlockStatusToggle;
