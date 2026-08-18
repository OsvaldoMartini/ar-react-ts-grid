import React, { useEffect, useRef, useState } from 'react';
import './questions-card.scss';

/**
 * QuestionsCard — modal dialog that replaces window.prompt / confirm / alert
 * for in-tab CRUD flows (e.g. naming a use case, confirming a delete).
 *
 * JCEF blocks native browser dialogs, so any place that previously called
 * window.prompt(...) etc. needs to render this component conditionally
 * instead. Three modes:
 *
 *   - "prompt"  → header + message + text input + Cancel/OK
 *   - "confirm" → header + message + Cancel/OK (OK turns red when destructive)
 *   - "alert"   → header + message + OK only
 *
 * Modeled on AlertModal.tsx (same visual family, same SCSS file lives next
 * to it). Pure controlled component: parent owns the open/closed state and
 * handles the values via the onSubmit / onCancel callbacks.
 */

export type QuestionsCardMode = 'prompt' | 'confirm' | 'alert';

export interface QuestionsCardProps {
  mode: QuestionsCardMode;

  /** Bold header line at the top of the card. */
  header: string;
  /** Main message body — supports newlines. */
  body: string;
  /** Optional small line under the body (e.g. validation hint, error text). */
  extraMsg?: string;

  /** Prompt mode only: pre-filled value. */
  defaultValue?: string;
  /** Prompt mode only: input placeholder. */
  placeholder?: string;
  /** Prompt mode only: small label above the input. */
  inputLabel?: string;

  /** Override default OK button label ("OK" / "Confirm" / "Submit"). */
  okLabel?: string;
  /** Override default Cancel button label ("Cancel"). */
  cancelLabel?: string;

  /** Confirm mode: when true, OK button is red (destructive action). */
  destructive?: boolean;

  /** Footer styling toggle — matches AlertModal's red/blue treatment. */
  error?: boolean;

  /**
   * For "prompt": called with the trimmed input value (caller decides
   * what to do with empty strings — we don't filter).
   * For "confirm" / "alert": called with empty string when the user
   * presses OK.
   */
  onSubmit: (value: string) => void;

  /** Triggered by the Cancel button or Esc. Not called for "alert" mode
   *  (which has only OK — that calls onSubmit). */
  onCancel: () => void;
}

const QuestionsCard: React.FC<QuestionsCardProps> = ({
  mode, header, body, extraMsg,
  defaultValue, placeholder, inputLabel,
  okLabel, cancelLabel,
  destructive, error,
  onSubmit, onCancel,
}) => {
  const [value, setValue] = useState(defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset value when defaultValue changes (re-opens the modal with new context).
  useEffect(() => { setValue(defaultValue ?? ''); }, [defaultValue]);

  // Auto-focus the input on prompt; auto-focus OK on confirm/alert (so Enter works).
  useEffect(() => {
    if (mode === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  // Esc cancels (or closes alert), Enter submits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (mode === 'alert') onSubmit('');
        else onCancel();
      } else if (e.key === 'Enter' && mode !== 'prompt') {
        // For prompt, Enter is handled by the input's onKeyDown to keep IME composition correct.
        e.preventDefault();
        onSubmit(value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, value, onSubmit, onCancel]);

  const okText = okLabel ?? (mode === 'confirm' ? 'Confirm' : mode === 'alert' ? 'OK' : 'Submit');
  const cancelText = cancelLabel ?? 'Cancel';

  const handleSubmit = () => onSubmit(mode === 'prompt' ? value : '');

  return (
    <>
      <div className="questions-card-backdrop" onClick={mode === 'alert' ? () => onSubmit('') : onCancel} />
      <div className="questions-card" role="dialog" aria-modal="true" aria-labelledby="qc-header">
        <div className="qc-content">
          <h3 id="qc-header" className="qc-header">{header}</h3>

          <p className={`qc-body ${error ? 'error' : 'success'}`}>{body}</p>

          {mode === 'prompt' && (
            <div className="qc-input-row">
              {inputLabel && <label className="qc-input-label">{inputLabel}</label>}
              <input
                ref={inputRef}
                className="qc-input"
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSubmit(value);
                  }
                }}
                placeholder={placeholder}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}

          {extraMsg && (
            <div className={`qc-footer ${error ? 'error' : 'success'}`}>
              <p>{extraMsg}</p>
            </div>
          )}

          <div className="qc-buttons">
            {mode !== 'alert' && (
              <button onClick={onCancel} className="qc-btn qc-btn--cancel" type="button">
                {cancelText}
              </button>
            )}
            <button
              onClick={handleSubmit}
              className={`qc-btn qc-btn--ok${destructive ? ' qc-btn--destructive' : ''}`}
              type="button"
              autoFocus={mode !== 'prompt'}
            >
              {okText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestionsCard;
