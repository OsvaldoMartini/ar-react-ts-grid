import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './SmokeTestWebPageRefreshButton.module.scss';

type Props = {
  disabled: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

const SmokeTestWebPageRefreshButton: React.FC<Props> = ({
  disabled,
  refreshing,
  onRefresh,
}) => (
  <button
    type="button"
    className={styles.button}
    aria-label="Refresh the active Playwright web page"
    title="Refresh the active Bot Job page in Playwright"
    disabled={disabled}
    onClick={onRefresh}
  >
    <RefreshCw className={refreshing ? styles.spinning : undefined} size={14} aria-hidden="true" />
    <span>
      <strong>{refreshing ? 'Refreshing' : 'Refresh'}</strong>
      <small>Web Page</small>
    </span>
  </button>
);

export default SmokeTestWebPageRefreshButton;
