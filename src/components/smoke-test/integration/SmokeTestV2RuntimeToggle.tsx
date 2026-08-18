import React from 'react';
import { ServerCog } from 'lucide-react';
import styles from './SmokeTestV2RuntimeToggle.module.scss';

export type V2RuntimeState = 'UNKNOWN' | 'STOPPED' | 'STARTING' | 'READY' | 'READY_EXTERNAL' | 'ERROR';

type Props = {
  state: V2RuntimeState;
  pending?: boolean;
  disabled?: boolean;
  attention?: boolean;
  onToggle: () => void;
};

const SmokeTestV2RuntimeToggle: React.FC<Props> = ({
  state,
  pending = false,
  disabled = false,
  attention = false,
  onToggle,
}) => {
  const ready = state === 'READY' || state === 'READY_EXTERNAL';
  const label = pending ? 'WAIT' : ready ? 'ON' : 'OFF';
  return (
    <button
      type="button"
      className={styles.toggle}
      data-ready={ready}
      data-attention={attention && !ready}
      disabled={disabled || pending}
      aria-pressed={ready}
      aria-label="Open live runtime instances"
      title="Open live Java V1 and TypeScript V2 runtime instances"
      onClick={onToggle}
    >
      <ServerCog size={14} aria-hidden="true" />
      <span><strong>{label}</strong><small>SERVER</small></span>
    </button>
  );
};

export default SmokeTestV2RuntimeToggle;
