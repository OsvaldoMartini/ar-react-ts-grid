import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PencilLine, X } from 'lucide-react';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import type {
  ComponentEditorBlockOption,
  ComponentEditorCommand,
} from './componentEditor.types';
import { commandEditorPlacementOptions } from './commandEditorPlacement';
import styles from './ComponentEditorModal.module.scss';

export interface ComponentEditorModalProps {
  botJobId: number;
  botJobName: string;
  scopeLabel: string;
  blocks: readonly ComponentEditorBlockOption[];
  connectionCount: number;
  diagnosticCount: number;
  command: ComponentEditorCommand;
  commands: readonly ComponentEditorCommand[];
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
  connectionCount,
  diagnosticCount,
  command,
  commands,
  returnFocusElement = null,
  children,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const initialTargetBlockId = command.blockId ?? 0;
  const [targetBlockId, setTargetBlockId] = useState(initialTargetBlockId);
  const [placementValue, setPlacementValue] = useState('KEEP');
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
  const targetBlock = blocks.find(block => block.blockId === targetBlockId) ?? null;
  const targetCommandCount = commands.filter(
    candidate => candidate.blockId === targetBlockId,
  ).length;
  const placementOptions = useMemo(
    () => commandEditorPlacementOptions(command, targetBlockId, commands),
    [command, commands, targetBlockId],
  );

  useEffect(() => {
    const nextTargetBlockId = command.blockId ?? 0;
    setTargetBlockId(nextTargetBlockId);
    setPlacementValue('KEEP');
  }, [command.blockId, command.instructionId]);

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
            <div><span>Original position</span><strong>{scopeLabel}</strong></div>
            <b>EDIT MODE</b>
          </section>

          <section className={styles.summary} aria-label="Command Editor summary">
            <div><span>Target Block</span><strong>{targetBlock ? `#${targetBlock.blockOrder}` : '-'}</strong></div>
            <div><span>Target commands</span><strong>{targetCommandCount}</strong></div>
            <div><span>Connections</span><strong>{connectionCount}</strong></div>
            <div><span>Diagnostics</span><strong>{diagnosticCount}</strong></div>
          </section>

          <SearchBox
            label="Target Block"
            placeholder="Search target block name or number..."
            headerRight="Commands per block"
            countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
            options={blockSearchOptions}
            value={targetBlockId > 0 ? String(targetBlockId) : null}
            onChange={(value) => {
              if (value === null) return;
              const nextTargetBlockId = Number(value);
              if (!Number.isSafeInteger(nextTargetBlockId) || nextTargetBlockId <= 0) return;
              setTargetBlockId(nextTargetBlockId);
              setPlacementValue(nextTargetBlockId === command.blockId ? 'KEEP' : 'END');
            }}
          />

          <label className={styles.placementField}>
            <span>Placement</span>
            <select
              value={placementValue}
              onChange={(event) => setPlacementValue(event.target.value)}
            >
              {placementOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <section className={styles.selectedCommand} aria-label="Selected command">
            <div>
              <span>Selected command</span>
              <strong>
                #{command.instructionOrder ?? '?'} {command.instructionName}
              </strong>
            </div>
            <div>
              <span>Command</span>
              <strong>{command.action || 'Unknown'}</strong>
            </div>
            <div>
              <span>Instruction ID</span>
              <strong>{command.instructionId}</strong>
            </div>
            <div>
              <span>Block</span>
              <strong>
                #{command.blockOrder ?? '?'} {command.blockName || 'Unknown Block'}
              </strong>
            </div>
          </section>

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
