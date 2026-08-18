import React from 'react';
import { FlaskConical, PlugZap } from 'lucide-react';
import type { SmokeTestExecutionMode } from './smokeTestIntegration.contract';
import styles from './SmokeTestExecutionModeToggle.module.scss';

type Props = {
  mode: SmokeTestExecutionMode;
  disabled?: boolean;
  onChange: (mode: SmokeTestExecutionMode) => void;
};

const SmokeTestExecutionModeToggle: React.FC<Props> = ({ mode, disabled = false, onChange }) => (
  <button
    type="button"
    className={styles.toggle}
    data-mode={mode}
    disabled={disabled}
    aria-label={`Execution mode ${mode}`}
    title={mode === 'SMOKE'
      ? 'SMOKE runs the local TypeScript simulation without a Web page.'
      : 'INTEGRATION sends each instruction through the backend WebSocket to Playwright.'}
    onClick={() => onChange(mode === 'SMOKE' ? 'INTEGRATION' : 'SMOKE')}
  >
    <span className={styles.option} data-selected={mode === 'SMOKE'}>
      <FlaskConical size={13} aria-hidden="true" /> Smoke Test
    </span>
    <span className={styles.option} data-selected={mode === 'INTEGRATION'}>
      <PlugZap size={13} aria-hidden="true" /> Integration
    </span>
  </button>
);

export default SmokeTestExecutionModeToggle;
