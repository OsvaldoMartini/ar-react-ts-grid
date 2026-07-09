import React, { useMemo, useState } from 'react';
import styles from './OCRPanel.module.scss';
import { ElementDTO } from './instructionsMockData';

export interface OCRPanelProps {
  /** Block label shown in the header (e.g. "Button", "Input Text"). */
  title: string;
  /** All elements of the block under review. */
  elements: ElementDTO[];
  /** Returns the pre-OCR scanned text (attributeData['scanned-text']) or null. */
  scannedTextOf: (el: ElementDTO) => string | null;
  /** Agree (useScanned=false) keeps the OCR name; Defer (useScanned=true) restores the scanned text. */
  onDecision: (el: ElementDTO, useScanned: boolean) => void;
  onClose: () => void;
}

const ROWS_PER_PAGE = 10;

/**
 * Floating, non-modal, draggable per-block OCR review panel: scanned (DOM) text vs the
 * OCR-resolved name, with per-row Agree / Defer. Find (with clear "x") stays fixed under
 * the header; the row list is paginated like the dashboard blocks.
 */
const OCRPanel: React.FC<OCRPanelProps> = ({ title, elements, scannedTextOf, onDecision, onClose }) => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 140, y: 150 });
  const [findText, setFindText] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = pos.x;
    const startTop = pos.y;
    const onMove = (moveEvent: MouseEvent) => {
      setPos({
        x: Math.max(0, startLeft + moveEvent.clientX - startX),
        y: Math.max(0, startTop + moveEvent.clientY - startY),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const q = findText.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      elements.filter((el) => {
        if (!q) return true;
        const scanned = scannedTextOf(el) ?? '';
        return (
          (el.someText ?? '').toLowerCase().includes(q) ||
          scanned.toLowerCase().includes(q) ||
          (((el as any).definedName as string) ?? '').toLowerCase().includes(q)
        );
      }),
    [elements, q, scannedTextOf]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className={styles.panel} style={{ left: pos.x, top: pos.y }}>
      <div className={styles.header} onMouseDown={startDrag}>
        <span className={styles.title}>
          OCR Review — {title} ({filtered.length})
        </span>
        <button
          type="button"
          className={styles.headerBtn}
          title="Close"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Fixed find row — same input + clear "x" pattern as the dashboard grid */}
      <div className={styles.findRow}>
        <span className={styles.findLabel}>Find:</span>
        <div className={styles.findInputWrap}>
          <input
            className={styles.findInput}
            type="text"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setPage(1);
            }}
            placeholder="Type to find…"
          />
          {findText.length > 0 && (
            <button
              type="button"
              className={styles.findClear}
              aria-label="Clear find"
              title="Clear find"
              onClick={() => {
                setFindText('');
                setPage(1);
              }}
            >
              X
            </button>
          )}
        </div>
      </div>

      <div className={styles.columns}>
        <span>Scanned (DOM)</span>
        <span></span>
        <span>OCR resolved</span>
        <span></span>
      </div>

      <div className={styles.list}>
        {pageRows.length === 0 ? (
          <div className={styles.empty}>No matches{q ? ` for “${findText}”` : ''}</div>
        ) : (
          pageRows.map((el) => {
            const scanned = scannedTextOf(el);
            return (
              <div key={`${el.id}-${el.xPath}`} className={styles.row}>
                <span className={styles.scannedText} title={scanned ?? 'OCR did not change this element'}>
                  {scanned ?? <span className={styles.dimmedDash}>—</span>}
                </span>
                <span className={styles.arrow}>→</span>
                <span className={styles.currentText} title={el.someText || ''}>
                  {el.someText}
                </span>
                {scanned ? (
                  <span className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.agreeBtn}
                      title="Agree — keep the OCR-resolved name"
                      onClick={() => onDecision(el, false)}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className={styles.deferBtn}
                      title="Defer — keep the scanned (DOM) text instead"
                      onClick={() => onDecision(el, true)}
                    >
                      ✗
                    </button>
                  </span>
                ) : (
                  <span className={styles.sameBadge}>same</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {filtered.length > ROWS_PER_PAGE && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Prev
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OCRPanel;
