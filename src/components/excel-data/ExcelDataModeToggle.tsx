import React from 'react';
import { Database, FlaskConical } from 'lucide-react';
import styles from './ExcelDataModeToggle.module.scss';

export type ExcelDataMode = 'REAL' | 'SYNTHETIC';

type Props = {
  mode: ExcelDataMode;
  disabled?: boolean;
  onChange: (mode: ExcelDataMode) => void;
};

const ExcelDataModeToggle: React.FC<Props> = ({ mode, disabled = false, onChange }) => {
  const synthetic = mode === 'SYNTHETIC';
  return <button type="button"
    className={`${styles.toggle} ${synthetic ? styles.synthetic : styles.real}`}
    aria-label={`Excel execution data: ${synthetic ? 'Synthetic Data' : 'Real Data'}`}
    title={`Use ${synthetic ? 'Real Data' : 'Synthetic Data'}`}
    disabled={disabled}
    onClick={() => onChange(synthetic ? 'REAL' : 'SYNTHETIC')}>
    {synthetic ? <FlaskConical size={14} /> : <Database size={14} />}
    <span><strong>{synthetic ? 'Synthetic' : 'Real'}</strong><small>Data</small></span>
  </button>;
};

export default ExcelDataModeToggle;
