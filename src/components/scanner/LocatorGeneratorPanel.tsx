import React, { useMemo, useState } from 'react';
import type { ElementDTO } from '../instructionsMockData';
import {
  pageScannerLocatorElementKey,
  pageScannerLocatorElementLabel,
  type LocatorResult,
} from './PageScannerLocator';
import styles from './LocatorGeneratorPanel.module.scss';

type Props = {
  open: boolean;
  position: { x: number; y: number };
  elements: ElementDTO[];
  targetKey: string;
  results: LocatorResult[];
  busy: boolean;
  applying: boolean;
  error: string;
  warning: string;
  feedback: string;
  onOpen: () => void;
  onClose: () => void;
  onDragStart: (event: React.MouseEvent) => void;
  onTargetChange: (elementKey: string) => void;
  onGenerate: (html: string) => void;
  onApplyXPath: (result: LocatorResult) => void;
  onAddElementDTO: (result: LocatorResult, index: number) => void;
  onAddAllElementDTO: () => void;
  onClearFeedback: () => void;
};

const LocatorGeneratorPanel: React.FC<Props> = ({
  open,
  position,
  elements,
  targetKey,
  results,
  busy,
  applying,
  error,
  warning,
  feedback,
  onOpen,
  onClose,
  onDragStart,
  onTargetChange,
  onGenerate,
  onApplyXPath,
  onAddElementDTO,
  onAddAllElementDTO,
  onClearFeedback,
}) => {
  const [html, setHtml] = useState('');
  const target = useMemo(
    () => elements.find((element) => pageScannerLocatorElementKey(element) === targetKey) || null,
    [elements, targetKey],
  );

  const clear = () => {
    setHtml('');
    onClearFeedback();
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherActive : ''}`}
        aria-label="Open Locator Generator"
        aria-expanded={open}
        onClick={onOpen}
      >
        Locator Gen
      </button>
      {open && (
        <section
          className={styles.panel}
          style={{ left: position.x, top: position.y }}
          aria-label="Locator Generator"
        >
          <header className={styles.header} onMouseDown={onDragStart}>
            <span className={styles.title}>Locator Generator</span>
            <button
              type="button"
              className={styles.headerButton}
              aria-label="Close Locator Generator"
              title="Close"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onClose}
            >
              X
            </button>
          </header>
          <div className={styles.body}>
            <p className={styles.help}>
              Paste the HTML for colliding controls, generate stable ElementDTO candidates, then add
              them to Memory List or update one selected scanned row with the generated XPath.
            </p>

            <label className={styles.fieldLabel}>
              Target scanned element
              <select
                className={styles.select}
                aria-label="Target scanned element"
                value={targetKey}
                disabled={applying}
                onChange={(event) => onTargetChange(event.target.value)}
              >
                <option value="">Select an element before applying XPath...</option>
                {elements.map((element) => {
                  const key = pageScannerLocatorElementKey(element);
                  return <option key={key} value={key}>{pageScannerLocatorElementLabel(element)}</option>;
                })}
              </select>
            </label>
            {target?.customXPath && (
              <div className={styles.currentXPath} title={target.customXPath}>
                Current XPath: {target.customXPath}
              </div>
            )}

            <label className={styles.fieldLabel}>
              Control HTML
              <textarea
                className={styles.htmlInput}
                aria-label="Control HTML"
                value={html}
                onChange={(event) => setHtml(event.target.value)}
                placeholder="<select name='amount'>...</select><input name='amount'/>"
                spellCheck={false}
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={busy || applying || !html.trim()}
                onClick={() => onGenerate(html)}
              >
                {busy ? 'Generating...' : 'Generate'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={busy || applying}
                onClick={clear}
              >
                Clear
              </button>
            </div>

            {error && <div className={styles.error} role="alert">{error}</div>}
            {warning && <div className={styles.warning} role="status">{warning}</div>}
            {feedback && <div className={styles.success} role="status">{feedback}</div>}

            <div className={styles.results} aria-label="Generated locators">
              {results.length > 0 && (
                <div className={styles.resultsToolbar}>
                  <span className={styles.resultsCount}>{results.length} ElementDTO candidate{results.length === 1 ? '' : 's'}</span>
                  <button
                    type="button"
                    className={styles.applyButton}
                    disabled={busy || applying}
                    onClick={onAddAllElementDTO}
                  >
                    Apply All ElementDTOs
                  </button>
                </div>
              )}
              {results.map((result, index) => (
                <article className={styles.result} key={`${result.xpath}-${index}`}>
                  <div className={styles.resultTitle}>
                    {result.tagName} - {result.controlKind}
                    {(result.someText || result.label) ? ` - ${result.someText || result.label}` : ''}
                    {result.positional && <span className={styles.fragile}>positional (fragile)</span>}
                  </div>
                  <div className={styles.semanticRow}>
                    <span>SomeText: {result.someText || result.label || '-'}</span>
                    <span>Defined Name: {result.definedName || '-'}</span>
                  </div>
                  <div className={styles.locatorRow}>
                    <span className={styles.locatorKind}>XPath</span>
                    <input
                      className={styles.locatorValue}
                      aria-label={`XPath result ${index + 1}`}
                      readOnly
                      value={result.xpath}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <button
                      type="button"
                      className={styles.applyButton}
                      disabled={!target || busy || applying}
                      title={target ? 'Apply this XPath to the selected scanned element' : 'Select a scanned element first'}
                      onClick={() => onApplyXPath(result)}
                    >
                      {applying ? 'Applying...' : 'Apply XPath'}
                    </button>
                    <button
                      type="button"
                      className={styles.applyButton}
                      disabled={busy || applying}
                      onClick={() => onAddElementDTO(result, index)}
                    >
                      Add ElementDTO
                    </button>
                  </div>
                  <div className={styles.locatorRow}>
                    <span className={styles.locatorKind}>CSS</span>
                    <input
                      className={styles.locatorValue}
                      aria-label={`CSS result ${index + 1}`}
                      readOnly
                      value={result.css}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <span className={styles.cssOnly}>ElementDTO cssSelector</span>
                  </div>
                  {result.note && <p className={styles.note}>{result.note}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default LocatorGeneratorPanel;
