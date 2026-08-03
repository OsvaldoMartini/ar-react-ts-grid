import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PencilLine, X } from 'lucide-react';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import InstructionCommandBadge from '../bot-job-details/grid/InstructionCommandBadge';
import { instructionCommandPresentation } from '../bot-job-details/grid/domain/instructionCommandPresentation';
import type {
  ComponentEditorBlockOption,
  ComponentEditorCommand,
  ComponentEditorVariableOption,
} from './componentEditor.types';
import { commandEditorPlacementOptions } from './commandEditorPlacement';
import { commandEditorPlacementFromValue } from './commandEditorPlacement';
import { COMMAND_EDITOR_COMMAND_OPTIONS } from './commandEditorCommandOptions';
import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import {
  commandEditorBaseDraft,
  commandEditorConfiguration,
  isCommandEditorBaseDraftValid,
} from './commandEditorDraft';
import LoopCommandEditor from './editors/LoopCommandEditor';
import RefreshLoopCommandEditor from './editors/RefreshLoopCommandEditor';
import WaitCommandEditor from './editors/WaitCommandEditor';
import CheckValueCommandEditor from './editors/CheckValueCommandEditor';
import ExternalCheckCommandEditor from './editors/ExternalCheckCommandEditor';
import ExcelWriteCommandEditor from './editors/ExcelWriteCommandEditor';
import GotoCommandEditor from './editors/GotoCommandEditor';
import SwipeCommandEditor from './editors/SwipeCommandEditor';
import ConditionalCommandEditor from './editors/ConditionalCommandEditor';
import CommandEditorRelationshipWarningModal from './CommandEditorRelationshipWarningModal';
import {
  commandEditorRelationshipImpact,
  hasCommandEditorRelationshipImpact,
  type CommandEditorRelationshipImpact,
} from './commandEditorRelationshipImpact';
import type {
  CommandEditorMutationAction,
  CommandEditorMutationIntent,
} from './commandEditorMutation';
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
  variables?: readonly ComponentEditorVariableOption[];
  returnFocusElement?: HTMLElement | null;
  children?: React.ReactNode;
  pending?: boolean;
  onSubmit?: (intent: CommandEditorMutationIntent) => void;
  enabledActions?: readonly CommandEditorMutationAction[];
  mode?: 'EDIT' | 'CREATE';
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
  variables = [],
  returnFocusElement = null,
  children,
  pending = false,
  onSubmit,
  enabledActions = ['UPDATE', 'COPY_NEW'],
  mode = 'EDIT',
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const initialTargetBlockId = command.blockId ?? 0;
  const [targetBlockId, setTargetBlockId] = useState(initialTargetBlockId);
  const [placementValue, setPlacementValue] = useState(
    mode === 'CREATE' ? 'END' : 'KEEP',
  );
  const originalCommandCode = canonicalInstructionAction(command.action);
  const [selectedCommandCode, setSelectedCommandCode] = useState(originalCommandCode);
  const [draft, setDraft] = useState(() => commandEditorBaseDraft(command));
  const commandChanged = selectedCommandCode !== originalCommandCode;
  const [relationshipWarning, setRelationshipWarning] = useState<{
    impact: CommandEditorRelationshipImpact;
    intent: CommandEditorMutationIntent;
  } | null>(null);
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
  const commandSearchOptions = useMemo<SearchBoxOption[]>(() => {
    const catalog = COMMAND_EDITOR_COMMAND_OPTIONS.some(
      option => option.code === originalCommandCode,
    )
      ? COMMAND_EDITOR_COMMAND_OPTIONS
      : [
          { code: originalCommandCode, label: command.action || originalCommandCode },
          ...COMMAND_EDITOR_COMMAND_OPTIONS,
        ];
    return catalog.map(option => ({
      value: option.code,
      label: option.label,
      icon: <InstructionCommandBadge action={option.code} iconOnly />,
      sublabel: `command code ${option.code}`,
      badges: option.code === originalCommandCode
        ? [{ text: 'CURRENT', tone: 'green' as const }]
        : [],
      keywords: `${option.code} ${option.label}`,
    }));
  }, [command.action, originalCommandCode]);
  const selectCommand = (value: string | null) => {
    if (value === null || value === selectedCommandCode) return;
    setSelectedCommandCode(value);
    setDraft(current => value === originalCommandCode
      ? commandEditorBaseDraft(command)
      : {
          ...current,
          action: value,
          operation: '',
          configuration: commandEditorConfiguration(value, '', null, null),
        });
  };
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
    setPlacementValue(mode === 'CREATE' ? 'END' : 'KEEP');
    setRelationshipWarning(null);
    setSelectedCommandCode(canonicalInstructionAction(command.action));
    setDraft({
      name: command.instructionName,
      action: command.action,
      operation: command.operation,
      configuration: commandEditorConfiguration(
        command.action,
        command.operation,
        command.onHoldSeconds,
        command.storedConfiguration,
        command.variableId ?? null,
      ),
    });
  }, [
    command.action,
    command.blockId,
    command.instructionId,
    command.instructionName,
    command.onHoldSeconds,
    command.operation,
    command.storedConfiguration,
    command.variableId,
    mode,
  ]);

  const configurationEditor = draft.configuration.kind === 'LOOP'
    ? (
        <LoopCommandEditor
          value={draft.configuration}
          disabled={pending}
          onChange={(configuration) => setDraft(current => ({
            ...current,
            configuration,
          }))}
        />
      )
    : draft.configuration.kind === 'REFRESH_LOOP'
      ? (
          <RefreshLoopCommandEditor
            value={draft.configuration}
            disabled={pending}
            onChange={(configuration) => setDraft(current => ({
              ...current,
              configuration,
            }))}
          />
        )
      : draft.configuration.kind === 'WAIT'
        ? (
            <WaitCommandEditor
              value={draft.configuration}
              disabled={pending}
              onChange={(configuration) => setDraft(current => ({
                ...current,
                configuration,
              }))}
            />
          )
        : draft.configuration.kind === 'CHECK_VALUE'
          ? (
              <CheckValueCommandEditor
                value={draft.configuration}
                variables={variables}
                disabled={pending}
                onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
              />
            )
          : draft.configuration.kind === 'EXTERNAL_CHECK'
            ? (
                <ExternalCheckCommandEditor
                  value={draft.configuration}
                  variables={variables}
                  disabled={pending}
                  onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
                />
              )
            : draft.configuration.kind === 'EXCEL_WRITE'
              ? (
                  <ExcelWriteCommandEditor
                    value={draft.configuration}
                    disabled={pending}
                    onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
                  />
                )
              : draft.configuration.kind === 'GOTO'
                ? (
                    <GotoCommandEditor
                      value={draft.configuration}
                      disabled={pending}
                      onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
                    />
                  )
                : draft.configuration.kind === 'SWIPE'
                  ? (
                      <SwipeCommandEditor
                        value={draft.configuration}
                        disabled={pending}
                        onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
                      />
                    )
                  : draft.configuration.kind === 'CONDITIONAL'
                    ? (
                        <ConditionalCommandEditor
                          value={draft.configuration}
                          variables={variables}
                          disabled={pending}
                          onChange={(configuration) => setDraft(current => ({ ...current, configuration }))}
                        />
                      )
        : null;

  const placement = commandEditorPlacementFromValue(
    placementOptions,
    placementValue,
  );
  const canSubmit = Boolean(
    onSubmit
    && !pending
    && targetBlockId > 0
    && placement
    && isCommandEditorBaseDraftValid(draft),
  );
  const submit = (action: CommandEditorMutationAction) => {
    if (!canSubmit || !placement || !onSubmit || !enabledActions.includes(action)) return;
    const submittedPlacement = action === 'COPY_NEW' && placement.kind === 'KEEP'
      ? { kind: 'AFTER_INSTRUCTION' as const, instructionId: command.instructionId }
      : placement;
    const intent: CommandEditorMutationIntent = {
      action,
      sourceInstructionId: command.instructionId,
      targetBlockId,
      placement: submittedPlacement,
      draft: { ...draft, name: draft.name.trim() },
      allowRelationshipDisconnect: false,
    };
    if (action === 'UPDATE') {
      const impact = commandEditorRelationshipImpact(
        command,
        targetBlockId,
        submittedPlacement,
        commands,
      );
      if (hasCommandEditorRelationshipImpact(impact)) {
        setRelationshipWarning({
          impact,
          intent: { ...intent, allowRelationshipDisconnect: true },
        });
        return;
      }
    }
    onSubmit(intent);
  };

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
            <p id={descriptionId}>
              {mode === 'CREATE'
                ? 'Add a new disconnected command to the active Bot Job.'
                : 'Review and update the selected command configuration.'}
            </p>
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
            <b>{mode === 'CREATE' ? 'ADD MODE' : 'EDIT MODE'}</b>
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

          <SearchBox
            label="Command"
            placeholder="Search command name or code..."
            headerRight="Command catalog"
            countLabel={count => `${count} COMMAND${count === 1 ? '' : 'S'}`}
            options={commandSearchOptions}
            value={selectedCommandCode}
            onChange={selectCommand}
          />

          <section className={styles.selectedCommand} aria-label="Selected command">
            <div>
              <span>{mode === 'CREATE' ? 'New command' : 'Selected command'}</span>
              <strong>
                {mode === 'CREATE'
                  ? instructionCommandPresentation(selectedCommandCode).label
                  : `#${command.instructionOrder ?? '?'} ${command.instructionName}`}
              </strong>
            </div>
            <div>
              <span>Command</span>
              <strong>
                {command.action || 'Unknown'}
                {commandChanged ? ` → ${selectedCommandCode}` : ''}
              </strong>
            </div>
            <div>
              <span>Instruction ID</span>
              <strong>{mode === 'CREATE' ? 'NEW' : command.instructionId}</strong>
            </div>
            <div>
              <span>Block</span>
              <strong>
                #{command.blockOrder ?? '?'} {command.blockName || 'Unknown Block'}
              </strong>
            </div>
          </section>

          {(configurationEditor || children) && (
            <section className={styles.editorContent} aria-label="Command configuration">
              {configurationEditor}
              {children}
            </section>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} disabled={pending} onClick={onClose}>
            CANCEL
          </button>
          {mode === 'CREATE' ? (
            <button
              type="button"
              className={styles.updateButton}
              disabled={!canSubmit || !enabledActions.includes('CREATE_NEW')}
              title={onSubmit ? 'Add a new disconnected command' : 'Command persistence is not connected yet'}
              onClick={() => submit('CREATE_NEW')}
            >
              ADD COMMAND
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.copyButton}
                disabled={!canSubmit || !enabledActions.includes('COPY_NEW')}
                title={onSubmit ? 'Create a disconnected copy with a new instruction ID' : 'Command persistence is not connected yet'}
                onClick={() => submit('COPY_NEW')}
              >
                COPY NEW
              </button>
              <button
                type="button"
                className={styles.updateButton}
                disabled={!canSubmit || !enabledActions.includes('UPDATE')}
                title={onSubmit ? 'Update the selected instruction' : 'Command persistence is not connected yet'}
                onClick={() => submit('UPDATE')}
              >
                UPDATE
              </button>
            </>
          )}
        </footer>
      </section>
      {relationshipWarning && (
        <CommandEditorRelationshipWarningModal
          impact={relationshipWarning.impact}
          onCancel={() => setRelationshipWarning(null)}
          onContinue={() => {
            const intent = relationshipWarning.intent;
            setRelationshipWarning(null);
            onSubmit?.(intent);
          }}
        />
      )}
    </div>
  );
};

export default ComponentEditorModal;
