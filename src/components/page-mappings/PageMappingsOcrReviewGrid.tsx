import React, { useMemo } from 'react';
import GridTempA, { type GridTempAColumn } from '../GridTemp_A';
import type { PageMappingsOcrReviewRow } from './PageMappingsOcrReview.types';
import {
  pageMappingsOcrRowKey,
  pageMappingsOcrRowPersistable,
} from './PageMappingsOcrReview.types';
import styles from './PageMappingsOcrReviewGrid.module.scss';

type Props = {
  rows: readonly PageMappingsOcrReviewRow[];
  totalCount?: number;
  selected: ReadonlySet<string>;
  drafts: Readonly<Record<string, string>>;
  disabled?: boolean;
  onToggle: (row: PageMappingsOcrReviewRow) => void;
  onDraft: (row: PageMappingsOcrReviewRow, value: string) => void;
};

const qualityLabel = (value: string): string => value.replaceAll('_', ' ');

const PageMappingsOcrReviewGrid: React.FC<Props> = ({
  rows,
  totalCount = rows.length,
  selected,
  drafts,
  disabled = false,
  onToggle,
  onDraft,
}) => {
  const columns = useMemo<readonly GridTempAColumn<PageMappingsOcrReviewRow>[]>(() => [
    {
      id: 'selected',
      header: 'Use',
      width: 58,
      alignment: 'center',
      renderCell: row => {
        const key = pageMappingsOcrRowKey(row);
        return <input
          type="checkbox"
          className={styles.checkbox}
          checked={selected.has(key)}
          disabled={disabled || !pageMappingsOcrRowPersistable(row)}
          aria-label={`Use OCR name for ${row.clientNamed || row.definedName || `element ${row.elementIndex + 1}`}`}
          onClick={event => event.stopPropagation()}
          onChange={() => onToggle(row)}
        />;
      },
      sortValue: row => selected.has(pageMappingsOcrRowKey(row)),
      headerTitle: 'Click to sort',
    },
    {
      id: 'name',
      header: 'Current name',
      width: 180,
      renderCell: row => <span className={styles.ellipsis}>{row.clientNamed || row.definedName || 'Unnamed'}</span>,
      sortValue: row => row.clientNamed || row.definedName,
      searchValue: row => [row.clientNamed, row.definedName, row.xPath],
      title: row => row.clientNamed || row.definedName,
      headerTitle: 'Click to sort',
    },
    {
      id: 'quality',
      header: 'Quality',
      width: 128,
      renderCell: row => <span className={styles.quality} data-quality={row.quality}>{qualityLabel(row.quality)}</span>,
      sortValue: row => row.quality,
      searchValue: row => row.quality,
      title: row => qualityLabel(row.quality),
      headerTitle: 'Click to sort',
    },
    {
      id: 'tag',
      header: 'Tag',
      width: 82,
      renderCell: row => row.tag,
      sortValue: row => row.tag,
      searchValue: row => row.tag,
      title: row => row.tag,
      headerTitle: 'Click to sort',
    },
    {
      id: 'domText',
      header: 'DOM text',
      width: 190,
      renderCell: row => <span className={styles.ellipsis}>{row.domText}</span>,
      sortValue: row => row.domText,
      searchValue: row => row.domText,
      title: row => row.domText,
      headerTitle: 'Click to sort',
    },
    {
      id: 'ocrText',
      header: 'OCR text',
      width: 190,
      renderCell: row => <span className={styles.ellipsis}>{row.ocrText}</span>,
      sortValue: row => row.ocrText,
      searchValue: row => row.ocrText,
      title: row => row.ocrText,
      headerTitle: 'Click to sort',
    },
    {
      id: 'proposed',
      header: 'Proposed name',
      width: 220,
      renderCell: row => {
        const key = pageMappingsOcrRowKey(row);
        return <input
          type="text"
          className={styles.draft}
          value={drafts[key] ?? ''}
          maxLength={255}
          disabled={disabled || !pageMappingsOcrRowPersistable(row)}
          aria-label={`Proposed name for ${row.definedName || `element ${row.elementIndex + 1}`}`}
          onClick={event => event.stopPropagation()}
          onChange={event => onDraft(row, event.target.value)}
        />;
      },
      sortValue: row => drafts[pageMappingsOcrRowKey(row)] || '',
      searchValue: row => drafts[pageMappingsOcrRowKey(row)] || '',
      title: row => drafts[pageMappingsOcrRowKey(row)] || '',
      headerTitle: 'Click to sort',
    },
  ], [disabled, drafts, onDraft, onToggle, selected]);

  return <GridTempA
    title="OCR comparison"
    rows={rows}
    columns={columns}
    rowKey={pageMappingsOcrRowKey}
    count={totalCount > rows.length ? `${rows.length} / ${totalCount}` : rows.length}
    emptyMessage="No captured elements were available for OCR Review."
    find={{
      inputId: 'page-mappings-ocr-review-find',
      label: 'Find:',
      placeholder: 'Name, quality, tag, DOM, OCR or XPath',
      clearTitle: 'Clear OCR Review Find',
      noMatchesMessage: 'No OCR Review rows match Find',
    }}
    className={styles.grid}
    minTableWidth={1_048}
    maxViewportHeight="min(48dvh, 520px)"
    ariaLabel="Page Mappings OCR Review rows"
    testId="page-mappings-ocr-review-grid"
  />;
};

export default PageMappingsOcrReviewGrid;
