import React from 'react';
import styles from './BlockCollapseToggle.module.scss';

export interface BlockCollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** The minus/plus icon: a horizontal bar, plus a vertical bar when collapsed. */
const CollapseToggleIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    {collapsed && <path d="M12 5v14" />}
  </svg>
);

/**
 * Collapse/expand badge for a block header. Extracted verbatim from GridItem
 * (the inline CollapseToggleIcon moved here). Presentational only.
 */
const BlockCollapseToggle: React.FC<BlockCollapseToggleProps> = ({ collapsed, onToggle }) => (
  <button
    type="button"
    className={styles.badge}
    title={collapsed ? 'Expand block' : 'Collapse block'}
    onClick={onToggle}
  >
    <CollapseToggleIcon collapsed={collapsed} />
  </button>
);

export default BlockCollapseToggle;
