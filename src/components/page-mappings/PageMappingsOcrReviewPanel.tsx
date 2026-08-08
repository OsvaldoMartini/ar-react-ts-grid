import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageMappingsOcrReviewGrid from './PageMappingsOcrReviewGrid';
import type {
  PageMappingsOcrAliasChange,
  PageMappingsOcrReviewResult,
  PageMappingsOcrReviewRow,
} from './PageMappingsOcrReview.types';
import {
  pageMappingsOcrRowKey,
  pageMappingsOcrRowPersistable,
} from './PageMappingsOcrReview.types';
import styles from './PageMappingsOcrReviewPanel.module.scss';

const QUALITY_ORDER = ['EXACT_CONTAIN', 'OVERLAP', 'PROXIMITY', 'NONE'] as const;
const MAX_APPLY_CHANGES = 1_000;
const MAX_REVIEWABLE_ROWS = 1_000;
const MAX_VISIBLE_WORDS = 2_000;

type Props = {
  result: PageMappingsOcrReviewResult | null;
  captureImage: string | null;
  busy: boolean;
  applying: boolean;
  message: string;
  canRun: boolean;
  onRun: () => void;
  onApply: (changes: PageMappingsOcrAliasChange[]) => void;
};

const proposedName = (row: PageMappingsOcrReviewRow): string =>
  row.ocrText.trim() || row.clientNamed || '';

const normalizedAlias = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const changedFromCurrent = (row: PageMappingsOcrReviewRow, draft: string): boolean =>
  normalizedAlias(draft) !== (row.clientNamed || null);

const defaultSelection = (rows: readonly PageMappingsOcrReviewRow[]): Set<string> => {
  const selected = new Set<string>();
  for (const row of rows) {
    if (selected.size >= MAX_APPLY_CHANGES) break;
    const draft = proposedName(row);
    if (pageMappingsOcrRowPersistable(row) && row.ocrText.trim() && changedFromCurrent(row, draft)) {
      selected.add(pageMappingsOcrRowKey(row));
    }
  }
  return selected;
};

const defaultDrafts = (rows: readonly PageMappingsOcrReviewRow[]): Record<string, string> =>
  rows.reduce((drafts, row) => {
    drafts[pageMappingsOcrRowKey(row)] = proposedName(row);
    return drafts;
  }, {} as Record<string, string>);

const PageMappingsOcrReviewPanel: React.FC<Props> = ({
  result,
  captureImage,
  busy,
  applying,
  message,
  canRun,
  onRun,
  onApply,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const reviewableRows = useMemo(
    () => result?.rows.slice(0, MAX_REVIEWABLE_ROWS) || [],
    [result],
  );

  useEffect(() => {
    setSelected(defaultSelection(reviewableRows));
    setDrafts(defaultDrafts(reviewableRows));
  }, [reviewableRows]);

  useEffect(() => {
    setImageSize({ width: 0, height: 0 });
  }, [captureImage]);

  const toggle = useCallback((row: PageMappingsOcrReviewRow) => {
    const key = pageMappingsOcrRowKey(row);
    setSelected(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < MAX_APPLY_CHANGES) {
        next.add(key);
      }
      return next;
    });
  }, []);

  const updateDraft = useCallback((row: PageMappingsOcrReviewRow, value: string) => {
    const key = pageMappingsOcrRowKey(row);
    setDrafts(current => ({ ...current, [key]: value }));
  }, []);

  const changes = useMemo<PageMappingsOcrAliasChange[]>(() => {
    if (!result) return [];
    return reviewableRows
      .filter(row => selected.has(pageMappingsOcrRowKey(row)) && pageMappingsOcrRowPersistable(row))
      .map(row => ({
        scannedElementId: row.scannedElementId,
        elementHash: row.elementHash,
        expectedLastScannedAt: row.expectedLastScannedAt,
        expectedScanCount: row.expectedScanCount,
        expectedClientNamed: row.clientNamed,
        clientNamed: normalizedAlias(drafts[pageMappingsOcrRowKey(row)] || ''),
      }))
      .filter((change, index) => {
        const row = reviewableRows.find(candidate => candidate.scannedElementId === change.scannedElementId);
        return index < MAX_APPLY_CHANGES && Boolean(row && change.clientNamed !== (row.clientNamed || null));
      });
  }, [drafts, result, reviewableRows, selected]);

  const selectAll = useCallback(() => {
    if (!result) return;
    setSelected(current => {
      if (current.size > 0) return new Set();
      const next = new Set<string>();
      for (const row of reviewableRows) {
        if (next.size >= MAX_APPLY_CHANGES) break;
        const draft = drafts[pageMappingsOcrRowKey(row)] || '';
        if (pageMappingsOcrRowPersistable(row) && changedFromCurrent(row, draft)) {
          next.add(pageMappingsOcrRowKey(row));
        }
      }
      return next;
    });
  }, [drafts, result, reviewableRows]);

  const operationBusy = busy || applying;
  const overlayWords = result?.words.slice(0, MAX_VISIBLE_WORDS) || [];

  return <section className={styles.panel} aria-label="OCR Review">
    <header className={styles.header}>
      <div>
        <p>IMMUTABLE CAPTURE OCR</p>
        <h3>OCR Review</h3>
        <span>Compare recognized text with the selected capture before saving client names.</span>
      </div>
      <button type="button" onClick={onRun} disabled={!canRun || operationBusy}>
        {busy ? 'Running OCR...' : result ? 'Run again' : 'Run OCR Review'}
      </button>
    </header>

    <div className={styles.status} role="status">{message || (result ? result.message : 'Ready to review the selected capture.')}</div>

    {result && <>
      <div className={styles.summary}>
        <span>{result.wordCount} OCR words</span>
        {QUALITY_ORDER.map(item => <span key={item} data-quality={item}>
          {item.replaceAll('_', ' ')} <strong>{result.counts[item] || 0}</strong>
        </span>)}
      </div>

      {captureImage && <div className={styles.imageStage}>
        <img
          src={captureImage}
          alt="Selected immutable capture for OCR Review"
          onLoad={event => setImageSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })}
        />
        {imageSize.width > 0 && imageSize.height > 0 && overlayWords.map((word, index) => <span
          key={`${word.x}:${word.y}:${index}`}
          className={styles.word}
          title={`${word.text} (${Math.round(word.confidence)}%)`}
          style={{
            left: `${Math.max(0, word.x) / imageSize.width * 100}%`,
            top: `${Math.max(0, word.y) / imageSize.height * 100}%`,
            width: `${Math.min(word.width, imageSize.width) / imageSize.width * 100}%`,
            height: `${Math.min(word.height, imageSize.height) / imageSize.height * 100}%`,
          }}
        />)}
      </div>}
      {result.words.length > MAX_VISIBLE_WORDS && <p className={styles.limitNotice}>
        Showing the first {MAX_VISIBLE_WORDS.toLocaleString()} OCR word boxes to keep the review responsive.
      </p>}
      {result.rows.length > reviewableRows.length && <p className={styles.limitNotice}>
        Review and Apply are limited to the first {reviewableRows.length.toLocaleString()} visible rows in this capture.
      </p>}

      <PageMappingsOcrReviewGrid
        rows={reviewableRows}
        totalCount={result.rows.length}
        selected={selected}
        drafts={drafts}
        disabled={operationBusy}
        onToggle={toggle}
        onDraft={updateDraft}
      />

      <footer className={styles.footer}>
        <button type="button" onClick={selectAll} disabled={operationBusy || !reviewableRows.length}>
          {selected.size ? 'Clear selected' : 'Select changed names'}
        </button>
        <span>{selected.size} selected · {changes.length} changes</span>
        <button
          type="button"
          className={styles.apply}
          disabled={operationBusy || !changes.length}
          onClick={() => onApply(changes)}
        >{applying ? 'Saving...' : `Apply names (${changes.length})`}</button>
      </footer>
    </>}
  </section>;
};

export default PageMappingsOcrReviewPanel;
