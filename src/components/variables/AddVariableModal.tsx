import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Database, X } from 'lucide-react';
import { RulesCard } from '../RulesCard';
import styles from './AddVariableModal.module.scss';

export interface AddVariableDraft {
  name: string;
}

interface AddVariableModalProps {
  existingNames: readonly string[];
  pending?: boolean;
  onSubmit: (draft: AddVariableDraft) => void;
  onCancel: () => void;
}

const AddVariableModal: React.FC<AddVariableModalProps> = ({
  existingNames,
  pending = false,
  onSubmit,
  onCancel,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const normalizedName = name.trim();
  const duplicate = normalizedName !== ''
    && existingNames.some(existing =>
      existing.trim().localeCompare(normalizedName, undefined, {
        sensitivity: 'accent',
        usage: 'search',
      }) === 0);
  const valid = normalizedName !== '' && !duplicate && !pending;

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const cancel = () => {
    if (!pending) onCancel();
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      name: normalizedName,
    });
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
      >
        <header className={styles.header}>
          <div>
            <div className={styles.titleLine}>
              <Database size={19} aria-hidden="true" />
              <h2 id={titleId}>Add Variable</h2>
            </div>
            <p id={descriptionId}>
              Define a producer-free Bot Job variable. It starts as VOID and
              can be edited from Runtime Memory after creation.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Cancel add variable"
            title="Cancel"
            disabled={pending}
            onClick={cancel}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <label className={styles.field}>
            <span>Variable name</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              disabled={pending}
              aria-invalid={duplicate}
              placeholder="Enter a unique variable name"
              onChange={event => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && valid) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
          </label>
          {duplicate && (
            <p className={styles.error} role="alert">
              A variable with this name already exists in the Bot Job.
            </p>
          )}

          <div className={styles.rawNotice}>
            New variables always begin as VOID. Entering a runtime value later
            preserves the exact text, including a legitimate empty string.
          </div>
        </div>

        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={pending}
            onClick={cancel}
          >
            Cancel
          </button>
          <RulesCard
            event={{
              color: 'green',
              rules: pending ? 'CREATING...' : 'CREATE VARIABLE',
              ts: 0,
            }}
            animate={false}
            pulse={false}
            glow={false}
            border
            icon={false}
            disabled={!valid}
            onClick={submit}
            title="Create the variable in this Bot Job"
          />
        </footer>
      </section>
    </div>
  );
};

export default AddVariableModal;
