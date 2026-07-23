import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import styles from './GridTemp_A.module.scss';

export type GridTempAAlignment = 'left' | 'center' | 'right';
export type GridTempASortDirection = 'asc' | 'desc';

export interface GridTempASort {
  columnId: string;
  direction: GridTempASortDirection;
}

export interface GridTempAColumn<TRow> {
  id: string;
  header: React.ReactNode;
  renderCell: (row: TRow, rowIndex: number) => React.ReactNode;
  sortValue?: (row: TRow) => string | number | boolean | null | undefined;
  title?: (row: TRow) => string | undefined;
  headerTitle?: string;
  width?: React.CSSProperties['width'];
  alignment?: GridTempAAlignment;
  className?: string;
}

export interface GridTempAActions<TRow> {
  render: (row: TRow, rowIndex: number) => React.ReactNode;
  header?: React.ReactNode;
  width?: React.CSSProperties['width'];
  alignment?: GridTempAAlignment;
  className?: string;
}

export interface GridTempAProps<TRow> {
  title: React.ReactNode;
  rows: readonly TRow[];
  columns: readonly GridTempAColumn<TRow>[];
  rowKey: (row: TRow, rowIndex: number) => React.Key;
  actions?: GridTempAActions<TRow>;
  count?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
  className?: string;
  minTableWidth?: React.CSSProperties['minWidth'];
  maxViewportHeight?: React.CSSProperties['maxHeight'];
  selectedRowKey?: React.Key | null;
  initialSort?: GridTempASort | null;
  sort?: GridTempASort | null;
  onSortChange?: (sort: GridTempASort | null) => void;
  onRowClick?: (row: TRow, rowIndex: number) => void;
  onRowDoubleClick?: (row: TRow, rowIndex: number) => void;
  rowClassName?: (row: TRow, rowIndex: number) => string | undefined;
}

interface IndexedRow<TRow> {
  row: TRow;
  originalIndex: number;
}

const compareValues = (
  left: string | number | boolean | null | undefined,
  right: string | number | boolean | null | undefined,
): number => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
};

const joinClasses = (...classNames: Array<string | false | null | undefined>): string =>
  classNames.filter(Boolean).join(' ');

function GridTemp_A<TRow>({
  title,
  rows,
  columns,
  rowKey,
  actions,
  count,
  emptyMessage = 'No records available',
  ariaLabel,
  testId = 'grid-temp-a',
  className,
  minTableWidth = 720,
  maxViewportHeight = 'min(46dvh, 440px)',
  selectedRowKey,
  initialSort = null,
  sort,
  onSortChange,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
}: GridTempAProps<TRow>): React.ReactElement {
  const [internalSort, setInternalSort] = useState<GridTempASort | null>(initialSort);
  const currentSort = sort === undefined ? internalSort : sort;

  const visibleRows = useMemo(() => {
    const indexedRows: Array<IndexedRow<TRow>> = rows.map((row, originalIndex) => ({
      row,
      originalIndex,
    }));
    if (!currentSort) return indexedRows;

    const column = columns.find(candidate => candidate.id === currentSort.columnId);
    if (!column?.sortValue) return indexedRows;

    const direction = currentSort.direction === 'asc' ? 1 : -1;
    return indexedRows.sort((left, right) => {
      const comparison = compareValues(column.sortValue?.(left.row), column.sortValue?.(right.row));
      return comparison === 0
        ? left.originalIndex - right.originalIndex
        : comparison * direction;
    });
  }, [columns, currentSort, rows]);

  const updateSort = (column: GridTempAColumn<TRow>) => {
    if (!column.sortValue) return;

    let nextSort: GridTempASort | null;
    if (!currentSort || currentSort.columnId !== column.id) {
      nextSort = { columnId: column.id, direction: 'asc' };
    } else if (currentSort.direction === 'asc') {
      nextSort = { columnId: column.id, direction: 'desc' };
    } else {
      nextSort = null;
    }

    if (sort === undefined) setInternalSort(nextSort);
    onSortChange?.(nextSort);
  };

  const interactiveRows = Boolean(onRowClick || onRowDoubleClick);
  const totalColumnCount = columns.length + (actions ? 1 : 0);

  return (
    <section
      className={joinClasses(styles.panel, className)}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <header className={styles.panelHeader}>
        <span className={styles.panelTitle}>{title}</span>
        <span className={styles.badge} data-testid={`${testId}-count`}>
          {count ?? rows.length}
        </span>
      </header>

      <div
        className={styles.viewport}
        style={{ maxHeight: maxViewportHeight }}
        data-testid={`${testId}-viewport`}
      >
        <table
          className={styles.grid}
          style={{ minWidth: minTableWidth }}
          aria-label={ariaLabel}
        >
          <colgroup>
            {columns.map(column => (
              <col key={column.id} style={{ width: column.width }} />
            ))}
            {actions && <col style={{ width: actions.width }} />}
          </colgroup>
          <thead>
            <tr>
              {columns.map(column => {
                const activeSort = currentSort?.columnId === column.id ? currentSort : null;
                const ariaSort = activeSort
                  ? activeSort.direction === 'asc' ? 'ascending' : 'descending'
                  : 'none';
                return (
                  <th
                    key={column.id}
                    className={joinClasses(
                      column.sortValue && styles.sortableHeader,
                      column.className,
                    )}
                    style={{ textAlign: column.alignment || 'left' }}
                    title={column.headerTitle}
                    aria-sort={column.sortValue ? ariaSort : undefined}
                    scope="col"
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => updateSort(column)}
                        title={column.headerTitle || 'Click to sort'}
                      >
                        <span className={styles.headerLabel}>{column.header}</span>
                        <span className={styles.sortIndicator} aria-hidden="true">
                          {activeSort?.direction === 'asc' ? (
                            <ArrowUp size={18} strokeWidth={2.5} />
                          ) : activeSort?.direction === 'desc' ? (
                            <ArrowDown size={18} strokeWidth={2.5} />
                          ) : (
                            <ArrowUpDown size={18} strokeWidth={2.5} className={styles.idleSortIcon} />
                          )}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {actions && (
                <th
                  className={actions.className}
                  style={{ textAlign: actions.alignment || 'center' }}
                  scope="col"
                >
                  {actions.header ?? 'Actions'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={totalColumnCount}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map(({ row, originalIndex }) => {
                const key = rowKey(row, originalIndex);
                return (
                  <tr
                    key={key}
                    className={joinClasses(
                      interactiveRows && styles.interactiveRow,
                      selectedRowKey === key && styles.selectedRow,
                      rowClassName?.(row, originalIndex),
                    )}
                    onClick={onRowClick ? () => onRowClick(row, originalIndex) : undefined}
                    onDoubleClick={onRowDoubleClick
                      ? () => onRowDoubleClick(row, originalIndex)
                      : undefined}
                  >
                    {columns.map(column => (
                      <td
                        key={column.id}
                        className={column.className}
                        style={{ textAlign: column.alignment || 'left' }}
                        title={column.title?.(row)}
                      >
                        {column.renderCell(row, originalIndex)}
                      </td>
                    ))}
                    {actions && (
                      <td
                        className={joinClasses(styles.actionsCell, actions.className)}
                        style={{ textAlign: actions.alignment || 'center' }}
                        onClick={event => event.stopPropagation()}
                        onDoubleClick={event => event.stopPropagation()}
                      >
                        {actions.render(row, originalIndex)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default GridTemp_A;
