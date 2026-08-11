import React from 'react';
import { Route } from 'lucide-react';
import type { SmokeTestIntegrationPagePolicy } from './smokeTestIntegration.contract';
import styles from './SmokeTestPagePolicyToggle.module.scss';

type Props = {
  policy: SmokeTestIntegrationPagePolicy;
  disabled?: boolean;
  onChange: (policy: SmokeTestIntegrationPagePolicy) => void;
};

const SmokeTestPagePolicyToggle: React.FC<Props> = ({ policy, disabled = false, onChange }) => {
  const continuing = policy === 'PRESERVE_ACTIVE';
  return (
    <button
      type="button"
      className={styles.toggle}
      data-enabled={continuing}
      disabled={disabled}
      aria-pressed={continuing}
      aria-label={`Continue current Playwright page ${continuing ? 'enabled' : 'disabled'}`}
      title={continuing
        ? 'Continue from the current same-site Playwright page without reloading.'
        : 'Reload the selected Bot Job URL before Integration starts.'}
      onClick={() => onChange(continuing ? 'RELOAD_SELECTED' : 'PRESERVE_ACTIVE')}
    >
      <Route size={14} aria-hidden="true" />
      <span><strong>{continuing ? 'ON' : 'OFF'}</strong><small>Continue Page</small></span>
    </button>
  );
};

export default SmokeTestPagePolicyToggle;
