import React, { useMemo } from 'react';
import GridTempA, { type GridTempAColumn } from './GridTemp_A';
import type { OCRTestRow } from './ocr/OCRResults.types';
import styles from './OCRResultsGrid.module.scss';

type Props = {
  rows: readonly OCRTestRow[];
  approved: ReadonlySet<string>;
  selectedPath?: string | null;
  onToggleApproved: (path: string) => void;
  onSelect: (row: OCRTestRow) => void;
};

const OCRResultsGrid: React.FC<Props> = ({
  rows,
  approved,
  selectedPath,
  onToggleApproved,
  onSelect,
}) => {
  const columns = useMemo<readonly GridTempAColumn<OCRTestRow>[]>(() => [
    {
      id: 'approved',
      header: 'Approved',
      width: 86,
      alignment: 'center',
      renderCell: row => (
        <input
          className={styles.approvalCheckbox}
          aria-label={`Approve ${row.definedName}`}
          type="checkbox"
          checked={approved.has(row.xPath)}
          onChange={() => onToggleApproved(row.xPath)}
        />
      ),
      sortValue: row => approved.has(row.xPath),
      headerTitle: 'Click to sort',
    },
    {
      id: 'name',
      header: 'Name',
      width: 170,
      renderCell: row => row.definedName,
      sortValue: row => row.definedName || '',
      searchValue: row => [row.definedName, row.xPath],
      title: row => row.definedName,
      headerTitle: 'Click to sort',
    },
    {
      id: 'quality',
      header: 'Quality',
      width: 130,
      renderCell: row => <span data-quality={row.quality}>{row.quality}</span>,
      sortValue: row => row.quality || '',
      title: row => row.quality,
      headerTitle: 'Click to sort',
    },
    {
      id: 'tag',
      header: 'Tag',
      width: 110,
      renderCell: row => row.tag,
      sortValue: row => row.tag || '',
      searchValue: row => row.tag,
      title: row => row.tag,
      headerTitle: 'Click to sort',
    },
    {
      id: 'domText',
      header: 'DOM text',
      width: 220,
      renderCell: row => row.domText,
      sortValue: row => row.domText || '',
      searchValue: row => row.domText,
      title: row => row.domText,
      headerTitle: 'Click to sort',
    },
    {
      id: 'ocrText',
      header: 'OCR text',
      width: 220,
      renderCell: row => row.ocrText,
      sortValue: row => row.ocrText || '',
      searchValue: row => row.ocrText,
      title: row => row.ocrText,
      headerTitle: 'Click to sort',
    },
  ], [approved, onToggleApproved]);

  return (
    <GridTempA
      title="OCR result rows"
      rows={rows}
      columns={columns}
      rowKey={row => row.xPath}
      emptyMessage="No OCR result rows available"
      find={{
        inputId: 'ocr-results-find',
        label: 'Find:',
        placeholder: 'Name, Tag, DOM text, OCR text or XPath',
        clearTitle: 'Clear OCR Results Find',
        noMatchesMessage: 'No OCR results match Find',
      }}
      className={styles.grid}
      minTableWidth={936}
      maxViewportHeight="none"
      selectedRowKey={selectedPath}
      onRowClick={onSelect}
      ariaLabel="OCR result rows"
      testId="ocr-results-grid"
    />
  );
};

export default OCRResultsGrid;
