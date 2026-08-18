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

export interface AddVariableBatchDraft {
  variables: readonly AddVariableDraft[];
}

interface AddVariableModalProps {
  existingNames: readonly string[];
  pending?: boolean;
  successVersion?: number;
  onSubmit: (draft: AddVariableBatchDraft) => void;
  onCancel: () => void;
}

const normalizedKey = (value: string): string =>
  value.trim().toLocaleLowerCase();

const nextAvailableVariableName = (
  names: readonly string[],
): string => {
  const occupied = new Set(names.map(normalizedKey).filter(Boolean));
  let sequence = 1;
  while (occupied.has(`variable_${sequence}`)) sequence += 1;
  return `Variable_${sequence}`;
};

const AddVariableModal: React.FC<AddVariableModalProps> = ({
  existingNames,
  pending = false,
  successVersion = 0,
  onSubmit,
  onCancel,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const submittedNamesRef = useRef<string[]>([]);
  const previousSuccessVersionRef = useRef(successVersion);
  const [stagedNames, setStagedNames] = useState<string[]>([]);
  const [name, setName] = useState(() =>
    nextAvailableVariableName(existingNames));
  const [nameEdited, setNameEdited] = useState(false);
  const normalizedName = name.trim();
  const occupiedNames = [...existingNames, ...stagedNames];
  const duplicate = normalizedName !== ''
    && occupiedNames.some(existing =>
      normalizedKey(existing) === normalizedKey(normalizedName));
  const valid = normalizedName !== '' && !duplicate && !pending;
  const canCreate = !pending && (stagedNames.length > 0 || valid);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (successVersion === previousSuccessVersionRef.current) return;
    previousSuccessVersionRef.current = successVersion;
    const submittedNames = submittedNamesRef.current;
    submittedNamesRef.current = [];
    setStagedNames([]);
    setName(nextAvailableVariableName([
      ...existingNames,
      ...submittedNames,
    ]));
    setNameEdited(false);
    nameInputRef.current?.focus();
  }, [existingNames, successVersion]);

  const cancel = () => {
    if (!pending) onCancel();
  };

  const stage = () => {
    if (!valid) return;
    const nextStagedNames = [...stagedNames, normalizedName];
    setStagedNames(nextStagedNames);
    setName(nextAvailableVariableName([
      ...existingNames,
      ...nextStagedNames,
    ]));
    setNameEdited(false);
    nameInputRef.current?.focus();
  };

  const submit = () => {
    if (!canCreate) return;
    const includeCurrent = valid
      && (stagedNames.length === 0 || nameEdited);
    const names = includeCurrent
      ? [...stagedNames, normalizedName]
      : [...stagedNames];
    submittedNamesRef.current = names;
    onSubmit({
      variables: names.map(variableName => ({ name: variableName })),
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
            <span className={styles.nameEntry}>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                disabled={pending}
                aria-invalid={duplicate}
                onChange={event => {
                  setName(event.target.value);
                  setNameEdited(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && valid) {
                    event.preventDefault();
                    stage();
                  }
                }}
              />
              <button
                type="button"
                className={styles.addButton}
                disabled={!valid}
                onClick={stage}
                title="Stage this variable and prepare the next name"
              >
                ADD
              </button>
            </span>
          </label>
          {duplicate && (
            <p className={styles.error} role="alert">
              A variable with this name already exists in the Bot Job.
            </p>
          )}

          {stagedNames.length > 0 && (
            <section className={styles.staged} aria-label="Variables ready to create">
              <header>
                <span>Ready to create</span>
                <strong>{stagedNames.length}</strong>
              </header>
              <div>
                {stagedNames.map(stagedName => (
                  <span className={styles.stagedName} key={normalizedKey(stagedName)}>
                    {stagedName}
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={`Remove ${stagedName}`}
                      title={`Remove ${stagedName}`}
                      onClick={() => setStagedNames(current =>
                        current.filter(candidate => candidate !== stagedName))}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </section>
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
            disabled={!canCreate}
            onClick={submit}
            title="Create all prepared variables in this Bot Job"
          />
        </footer>
      </section>
    </div>
  );
};

export default AddVariableModal;
