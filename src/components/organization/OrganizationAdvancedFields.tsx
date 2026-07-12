import React from 'react';
import styles from './OrganizationAdvancedFields.module.scss';

export interface OrganizationAdvancedValue {
  priority: string;
  searchConfig: string;
  optionsConfig: string;
}

interface OrganizationAdvancedFieldsProps {
  value: OrganizationAdvancedValue;
  onChange: (value: OrganizationAdvancedValue) => void;
  onLoadTemplate: () => void;
}

const OrganizationAdvancedFields: React.FC<OrganizationAdvancedFieldsProps> = ({
  value,
  onChange,
  onLoadTemplate,
}) => (
  <details className={styles.advanced}>
    <summary>Advanced scanner and WebDriver configuration</summary>
    <div className={styles.toolbar}>
      <p>These values control locator priority, scanner matching, and browser startup options.</p>
      <button type="button" onClick={onLoadTemplate}>Load defaults</button>
    </div>
    <div className={styles.grid}>
      <label>
        Locator priority
        <textarea
          value={value.priority}
          spellCheck={false}
          onChange={(event) => onChange({ ...value, priority: event.target.value })}
        />
      </label>
      <label>
        Scanner search configuration
        <textarea
          value={value.searchConfig}
          spellCheck={false}
          onChange={(event) => onChange({ ...value, searchConfig: event.target.value })}
        />
      </label>
      <label className={styles.wide}>
        WebDriver options
        <textarea
          value={value.optionsConfig}
          spellCheck={false}
          onChange={(event) => onChange({ ...value, optionsConfig: event.target.value })}
        />
      </label>
    </div>
  </details>
);

export default OrganizationAdvancedFields;
