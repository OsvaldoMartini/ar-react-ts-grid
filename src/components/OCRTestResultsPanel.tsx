import React, { useMemo, useState } from 'react';
import { CheckCheck, ScanSearch, X } from 'lucide-react';
import styles from './OCRTestResultsPanel.module.scss';

export type OCRTestRow = {
  definedName: string;
  quality: string;
  tag: string;
  domText: string;
  ocrText: string;
  xPath: string;
};

export type OCRTestResult = {
  source: string;
  wordCount: number;
  counts: Record<string, number>;
  rows: OCRTestRow[];
  annotatedImage?: string;
};

type Props = {
  result: OCRTestResult;
  onAccept: (suggestions: Array<{ xPath: string; clientNamed: string }>) => void;
  onClose: () => void;
};

const OCRTestResultsPanel: React.FC<Props> = ({ result, onAccept, onClose }) => {
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<OCRTestRow | null>(result.rows[0] || null);
  const all = approved.size === result.rows.length;
  const suggestions = useMemo(() => result.rows
    .filter(row => (
      approved.has(row.xPath)
      && row.ocrText.trim()
      && row.ocrText.trim().toLowerCase() !== row.definedName?.trim().toLowerCase()
    ))
    .map(row => ({ xPath: row.xPath, clientNamed: row.ocrText.trim() })), [approved, result.rows]);

  const toggle = (path: string) => setApproved(current => {
    const next = new Set(current);
    next.has(path) ? next.delete(path) : next.add(path);
    return next;
  });

  return (
    <section
      className={styles.panel}
      aria-label="OCR test results"
      data-testid="ocr-results-workspace"
    >
      <header
        className={styles.header}
        data-testid="ocr-results-header"
      >
        <div className={styles.heading}>
          <ScanSearch size={20} aria-hidden="true" />
          <span>
            <strong>OCR test results</strong>
            <small>{result.source} · {result.wordCount} words · {approved.size}/{result.rows.length} approved</small>
          </span>
        </div>
        <button
          type="button"
          title="Close OCR test results"
          aria-label="Close OCR test results"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.summary}>
        {['EXACT_CONTAIN', 'OVERLAP', 'PROXIMITY', 'NONE'].map(quality => (
          <span key={quality} data-quality={quality}>
            {quality.replace('_', ' ')} <b>{result.counts[quality] || 0}</b>
          </span>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Approved</th><th>Name</th><th>Quality</th><th>Tag</th><th>DOM text</th><th>OCR text</th></tr></thead>
            <tbody>
              {result.rows.map(row => (
                <tr
                  key={row.xPath}
                  onClick={() => setSelected(row)}
                  className={selected?.xPath === row.xPath ? styles.selected : ''}
                >
                  <td><input aria-label={`Approve ${row.definedName}`} type="checkbox" checked={approved.has(row.xPath)} onChange={() => toggle(row.xPath)} /></td>
                  <td>{row.definedName}</td>
                  <td><span data-quality={row.quality}>{row.quality}</span></td>
                  <td>{row.tag}</td>
                  <td>{row.domText}</td>
                  <td>{row.ocrText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside>
          {result.annotatedImage
            ? <img src={result.annotatedImage} alt="OCR annotated scanner result" />
            : <p>No annotated image generated.</p>}
        </aside>
      </div>

      <div className={styles.xpath}>
        <strong>Full XPath</strong>
        <input readOnly value={selected?.xPath || ''} />
      </div>

      <footer>
        <button onClick={() => setApproved(all ? new Set() : new Set(result.rows.map(row => row.xPath)))}>
          {all ? 'Clear all' : 'Mark all approved'}
        </button>
        <span />
        <button className={styles.primary} disabled={!suggestions.length} onClick={() => onAccept(suggestions)}>
          <CheckCheck size={15} aria-hidden="true" />Accept OCR names ({suggestions.length})
        </button>
      </footer>
    </section>
  );
};

export default OCRTestResultsPanel;
