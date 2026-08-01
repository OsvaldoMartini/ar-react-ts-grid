import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PencilLine, X } from 'lucide-react';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import styles from './ComponentEditorModal.module.scss';

export interface ComponentEditorBlockOption {
  blockId: number;
  blockOrder: number;
  blockName: string;
  commandCount: number;
  active?: boolean;
}

export interface ComponentEditorModalProps {
  botJobId: number;
  botJobName: string;
  scopeLabel: string;
  blocks: readonly ComponentEditorBlockOption[];
  commandCount: number;
  connectionCount: number;
  diagnosticCount: number;
  blockFilter?: number | null;
  onBlockFilterChange?: (blockId: number | null) => void;
  returnFocusElement?: HTMLElement | null;
  children?: React.ReactNode;
  onClose: () => void;
}

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const ComponentEditorModal: React.FC<ComponentEditorModalProps> = ({
  botJobId,
  botJobName,
  scopeLabel,
  blocks,
  commandCount,
  connectionCount,
  diagnosticCount,
  blockFilter: controlledBlockFilter,
  onBlockFilterChange,
  returnFocusElement = null,
  children,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [localBlockFilter, setLocalBlockFilter] = useState<number | null>(null);
  const blockFilter = controlledBlockFilter === undefined
    ? localBlockFilter
    : controlledBlockFilter;
  const returnFocusRef = useRef<HTMLElement | null>(
    returnFocusElement
    ?? (typeof document !== 'undefined'
      && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null),
  );

  const blockSearchOptions = useMemo<SearchBoxOption[]>(() => blocks.map(block => ({
    value: String(block.blockId),
    label: `#${block.blockOrder} ${block.blockName}`,
    sublabel: `${block.commandCount} command(s) · block ID ${block.blockId}`,
    badges: [block.active === false
      ? { text: 'INACTIVE', tone: 'red' as const }
      : { text: 'ACTIVE', tone: 'green' as const }],
    keywords: `${block.blockId} ${block.blockOrder} ${block.blockName}`,
  })), [blocks]);
  const visibleBlockCount = blockFilter === null
    ? blocks.length
    : blocks.some(block => block.blockId === blockFilter) ? 1 : 0;

  useEffect(() => {
    const returnFocusTarget = returnFocusRef.current;
    closeRef.current?.focus();
    return () => {
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.titleLine}>
              <PencilLine size={22} aria-hidden="true" />
              <h2 id={titleId}>Command Editor</h2>
            </div>
            <p id={descriptionId}>Review and update the selected command configuration.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeIcon}
            aria-label="Close Command Editor"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.context} aria-label="Command Editor context">
            <div><span>Bot Job</span><strong>#{botJobId} {botJobName}</strong></div>
            <div><span>Editor scope</span><strong>{scopeLabel}</strong></div>
            <b>EDIT MODE</b>
          </section>

          <section className={styles.summary} aria-label="Command Editor summary">
            <div><span>Blocks</span><strong>{visibleBlockCount}</strong></div>
            <div><span>Commands</span><strong>{commandCount}</strong></div>
            <div><span>Connections</span><strong>{connectionCount}</strong></div>
            <div><span>Diagnostics</span><strong>{diagnosticCount}</strong></div>
          </section>

          <SearchBox
            label="Block"
            placeholder="Search block name or number..."
            headerRight="Commands per block"
            countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
            allOptionLabel="All blocks"
            options={blockSearchOptions}
            value={blockFilter === null ? null : String(blockFilter)}
            onChange={(value) => {
              const nextBlockFilter = value === null ? null : Number(value);
              setLocalBlockFilter(nextBlockFilter);
              onBlockFilterChange?.(nextBlockFilter);
            }}
          />

          {children && (
            <section className={styles.editorContent} aria-label="Command configuration">
              {children}
            </section>
          )}
        </div>
      </section>
    </div>
  );
};

export default ComponentEditorModal;
