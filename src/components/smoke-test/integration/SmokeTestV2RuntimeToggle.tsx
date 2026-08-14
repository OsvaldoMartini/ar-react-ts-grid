import React from 'react';
import { ServerCog } from 'lucide-react';
import styles from './SmokeTestV2RuntimeToggle.module.scss';

export type V2RuntimeState = 'UNKNOWN' | 'STOPPED' | 'STARTING' | 'READY' | 'READY_EXTERNAL' | 'ERROR';

type Props = {
  state: V2RuntimeState;
  pending?: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

const SmokeTestV2RuntimeToggle: React.FC<Props> = ({
  state,
  pending = false,
  disabled = false,
  onToggle,
}) => {
  const ready = state === 'READY' || state === 'READY_EXTERNAL';
  const label = pending ? 'WAIT' : ready ? 'ON' : 'OFF';
  return (
    <button
      type="button"
      className={styles.toggle}
      data-ready={ready}
      disabled={disabled || pending}
      aria-pressed={ready}
      aria-label={`${ready ? 'Stop' : 'Start'} TypeScript Playwright V2 runtime`}
      title={ready
        ? state === 'READY_EXTERNAL'
          ? 'The V2 runtime is externally managed and cannot be stopped here.'
          : 'Stop the local Node V2 runtime. Active V2 runs must finish first.'
        : 'Start the local Node V2 runtime and wait until it is ready.'}
      onClick={onToggle}
    >
      <ServerCog size={14} aria-hidden="true" />
      <span><strong>{label}</strong><small>V2 Runtime</small></span>
    </button>
  );
};

export default SmokeTestV2RuntimeToggle;
