import React from 'react';
import { Boxes, Coffee } from 'lucide-react';
import type { SmokeTestIntegrationRuntimeMode } from './smokeTestIntegration.contract';
import styles from './SmokeTestRuntimeModeToggle.module.scss';

type Props = {
  mode: SmokeTestIntegrationRuntimeMode;
  disabled?: boolean;
  onChange: (mode: SmokeTestIntegrationRuntimeMode) => void;
};

const SmokeTestRuntimeModeToggle: React.FC<Props> = ({
  mode,
  disabled = false,
  onChange,
}) => (
  <button
    type="button"
    className={styles.toggle}
    data-mode={mode}
    disabled={disabled}
    aria-label={mode === 'JAVA_V1'
      ? 'Integration runtime Java V1 shared browser'
      : 'Integration runtime TypeScript Playwright V2 isolated browser'}
    title={mode === 'JAVA_V1'
      ? 'Java V1 uses the established shared Playwright page. Select to use isolated V2.'
      : 'V2 uses one isolated Node and Playwright session for this run. Select to use Java V1.'}
    onClick={() => onChange(
      mode === 'JAVA_V1' ? 'TYPESCRIPT_PLAYWRIGHT_V2' : 'JAVA_V1',
    )}
  >
    <span className={styles.option} data-selected={mode === 'JAVA_V1'}>
      <Coffee size={14} aria-hidden="true" />
      <span><strong>Java</strong><small>V1 Shared</small></span>
    </span>
    <span className={styles.option} data-selected={mode === 'TYPESCRIPT_PLAYWRIGHT_V2'}>
      <Boxes size={14} aria-hidden="true" />
      <span><strong>V2</strong><small>Isolated</small></span>
    </span>
  </button>
);

export default SmokeTestRuntimeModeToggle;
