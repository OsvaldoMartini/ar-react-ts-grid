import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './ExcelDataSearchBox.module.scss';

export interface SearchableExcelRow {
  index: number;
  values: Record<string, string | null>;
}

export interface SearchableExcelBlock {
  name: string;
  columns: string[];
  rows: SearchableExcelRow[];
}

const normalizedTokens = (query: string): string[] =>
  query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

const containsAll = (value: string, tokens: readonly string[]): boolean => {
  const normalized = value.toLocaleLowerCase();
  return tokens.every(token => normalized.includes(token));
};

export function filterExcelDataBlocks<T extends SearchableExcelBlock>(
  blocks: readonly T[],
  query: string,
): T[] {
  const tokens = normalizedTokens(query);
  if (tokens.length === 0) return blocks.slice();

  return blocks.flatMap((block) => {
    const blockMatch = containsAll(block.name, tokens);
    const structuralColumns = new Set(block.columns.filter(column =>
      blockMatch || containsAll(`${block.name} ${column}`, tokens)));
    const columns = block.columns.filter((column) => {
      if (structuralColumns.has(column)) return true;
      return block.rows.some(row =>
        containsAll(`${block.name} ${column} ${row.values[column] ?? ''}`, tokens));
    });
    if (columns.length === 0) return [];

    const rows = blockMatch || structuralColumns.size > 0
      ? block.rows
      : block.rows.filter(row => columns.some(column =>
          containsAll(`${block.name} ${column} ${row.values[column] ?? ''}`, tokens)));
    if (rows.length === 0) return [];
    return [{ ...block, columns, rows } as T];
  });
}

interface ExcelDataSearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
  blockCount: number;
  columnCount: number;
  rowCount: number;
  disabled?: boolean;
}

const ExcelDataSearchBox: React.FC<ExcelDataSearchBoxProps> = ({
  query,
  onQueryChange,
  blockCount,
  columnCount,
  rowCount,
  disabled = false,
}) => (
  <section className={styles.search} aria-label="Search Excel data">
    <label htmlFor="excel-data-search">Search Excel data</label>
    <div className={styles.control}>
      <Search size={17} aria-hidden="true" />
      <input
        id="excel-data-search"
        type="search"
        value={query}
        disabled={disabled}
        placeholder="Search Block, column, or existing value (for example IBAN)…"
        onChange={event => onQueryChange(event.currentTarget.value)}
      />
      {query && (
        <button type="button" aria-label="Clear Excel data search" onClick={() => onQueryChange('')}>
          <X size={15} aria-hidden="true" /> Clear
        </button>
      )}
    </div>
    <span aria-live="polite">
      {blockCount} Block{blockCount === 1 ? '' : 's'} · {columnCount} column{columnCount === 1 ? '' : 's'} · {rowCount} row{rowCount === 1 ? '' : 's'}
    </span>
  </section>
);

export default ExcelDataSearchBox;
