import React, { useEffect, useMemo, useState } from 'react';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import InstructionCommandBadge from '../bot-job-details/grid/InstructionCommandBadge';
import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
} from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import CheckValueCommandEditor from '../command-editor/editors/CheckValueCommandEditor';
import ConditionalCommandEditor from '../command-editor/editors/ConditionalCommandEditor';
import ExcelWriteCommandEditor from '../command-editor/editors/ExcelWriteCommandEditor';
import ExternalCheckCommandEditor from '../command-editor/editors/ExternalCheckCommandEditor';
import GotoCommandEditor from '../command-editor/editors/GotoCommandEditor';
import LoopCommandEditor from '../command-editor/editors/LoopCommandEditor';
import RefreshLoopCommandEditor from '../command-editor/editors/RefreshLoopCommandEditor';
import SwipeCommandEditor from '../command-editor/editors/SwipeCommandEditor';
import WaitCommandEditor from '../command-editor/editors/WaitCommandEditor';
import CommandVariableBindingsEditor from '../command-editor/editors/CommandVariableBindingsEditor';
import CommandEditorConditionalFamilyWarningModal from '../command-editor/CommandEditorConditionalFamilyWarningModal';
import CommandEditorRelationshipWarningModal from '../command-editor/CommandEditorRelationshipWarningModal';
import {
  commandEditorConditionalFamilyImpact,
  isCommandEditorConditionalBoundary,
  type CommandEditorConditionalFamilyImpact,
} from '../command-editor/commandEditorConditionalFamilyImpact';
import {
  commandEditorBaseDraft,
  commandEditorConfiguration,
  isCommandEditorBaseDraftValid,
} from '../command-editor/commandEditorDraft';
import type {
  CommandEditorMutationAction,
  CommandEditorMutationIntent,
} from '../command-editor/commandEditorMutation';
import type {
  ComponentEditorCommand,
  ComponentEditorVariableSlot,
} from '../command-editor/componentEditor.types';
import {
  commandEditorVariableBindings,
  updateCommandEditorVariableBinding,
} from '../command-editor/commandEditorVariableBindings';
import {
  commandEditorPlacementFromValue,
  commandEditorPlacementOptions,
} from '../command-editor/commandEditorPlacement';
import { COMMAND_EDITOR_COMMAND_OPTIONS } from '../command-editor/commandEditorCommandOptions';
import {
  commandEditorRelationshipImpact,
  hasCommandEditorRelationshipImpact,
  type CommandEditorRelationshipImpact,
} from '../command-editor/commandEditorRelationshipImpact';
import type { CommandEditorPageSnapshot } from './commandEditorPageSnapshot';
import styles from './CommandEditorPageBody.module.scss';

export interface CommandEditorPageBodyStatus {
  level: 'ok' | 'warn' | 'error';
  text: string;
}

interface Props {
  botJobId: number;
  botJobName: string;
  scopeLabel: string;
  snapshot: CommandEditorPageSnapshot;
  status: CommandEditorPageBodyStatus | null;
  pending: boolean;
  mode?: 'EDIT' | 'CREATE';
  createTargetBlockId?: number | null;
  onSubmit?: (intent: CommandEditorMutationIntent) => void;
  onCancel: () => void;
}

const CommandEditorPageBody: React.FC<Props> = ({
  botJobId,
  botJobName,
  scopeLabel,
  snapshot,
  status,
  pending,
  mode = 'EDIT',
  createTargetBlockId = null,
  onSubmit,
  onCancel,
}) => {
  const selectedCommand = snapshot.commands.find(
    candidate => candidate.instructionId === snapshot.selectedInstructionId,
  );
  const availableBlocks = useMemo(() => snapshot.blocks.length > 0
    ? snapshot.blocks
    : [{
        blockId: 0,
        blockOrder: 1,
        blockName: 'Default Block (created with command)',
        commandCount: 0,
        active: true,
      }], [snapshot.blocks]);
  const initialTargetBlockId = mode === 'CREATE'
    ? (availableBlocks.some(block => block.blockId === createTargetBlockId)
      ? Number(createTargetBlockId)
      : availableBlocks[0]?.blockId ?? 0)
    : selectedCommand?.blockId ?? 0;
  const createCommand = useMemo<ComponentEditorCommand>(() => {
    const block = availableBlocks.find(candidate => candidate.blockId === initialTargetBlockId)
      ?? availableBlocks[0];
    return {
      instructionId: 0,
      instructionOrder: null,
      instructionName: 'GetValue',
      action: 'GET',
      operation: '',
      onHoldSeconds: null,
      blockId: block?.blockId ?? 0,
      blockOrder: block?.blockOrder ?? 1,
      blockName: block?.blockName ?? 'Default Block (created with command)',
      active: true,
      parentId: null,
      parentBlockId: null,
      variableId: null,
      variableSlots: [],
      storedConfiguration: null,
    };
  }, [availableBlocks, initialTargetBlockId]);
  const command = mode === 'CREATE' ? createCommand : selectedCommand;
  const [targetBlockId, setTargetBlockId] = useState(initialTargetBlockId);
  const [placementValue, setPlacementValue] = useState(
    mode === 'CREATE' ? (initialTargetBlockId > 0 ? 'TOP' : 'END') : 'KEEP',
  );
  const originalCommandCode = canonicalInstructionAction(command?.action ?? '');
  const [selectedCommandCode, setSelectedCommandCode] = useState(originalCommandCode);
  const [draft, setDraft] = useState(() => command
    ? commandEditorBaseDraft(command)
    : null);
  const [variableBindings, setVariableBindings] = useState(() => command
    ? commandEditorVariableBindings(command, command.action)
    : []);
  const [relationshipWarning, setRelationshipWarning] = useState<{
    impact: CommandEditorRelationshipImpact;
    intent: CommandEditorMutationIntent;
  } | null>(null);
  const [conditionalFamilyWarning, setConditionalFamilyWarning] = useState<{
    impact: CommandEditorConditionalFamilyImpact;
    intent: CommandEditorMutationIntent;
  } | null>(null);

  const commandChanged = selectedCommandCode !== originalCommandCode;
  const lockCommandSelection = mode === 'EDIT' && command
    ? instructionRelationshipPolicy(command.action).role === 'WEB_ELEMENT'
    : false;
  const blockSearchOptions = useMemo<SearchBoxOption[]>(() =>
    availableBlocks.map(block => ({
      value: String(block.blockId),
      label: `#${block.blockOrder} ${block.blockName}`,
      sublabel: `${block.commandCount} command(s) · block ID ${block.blockId}`,
      badges: [block.active === false
        ? { text: 'INACTIVE', tone: 'red' as const }
        : { text: 'ACTIVE', tone: 'green' as const }],
      keywords: `${block.blockId} ${block.blockOrder} ${block.blockName}`,
    })), [availableBlocks]);
  const commandSearchOptions = useMemo<SearchBoxOption[]>(() => {
    if (!command) return [];
    const catalog = COMMAND_EDITOR_COMMAND_OPTIONS.some(
      option => option.code === originalCommandCode,
    )
      ? COMMAND_EDITOR_COMMAND_OPTIONS
      : [
          { code: originalCommandCode, label: command.action || originalCommandCode },
          ...COMMAND_EDITOR_COMMAND_OPTIONS,
        ];
    return catalog
      .filter(option => mode === 'CREATE'
        || !isCommandEditorConditionalBoundary(option.code)
        || option.code === originalCommandCode)
      .map(option => ({
        value: option.code,
        label: option.label,
        icon: <InstructionCommandBadge action={option.code} iconOnly />,
        sublabel: `command code ${option.code}`,
        badges: option.code === originalCommandCode
          ? [{ text: 'CURRENT', tone: 'green' as const }]
          : [],
        keywords: `${option.code} ${option.label}`,
      }));
  }, [command, mode, originalCommandCode]);

  const conditionalImpactPreview = useMemo(
    () => mode === 'EDIT' && command
      ? commandEditorConditionalFamilyImpact(command, selectedCommandCode, snapshot.commands)
      : null,
    [command, mode, selectedCommandCode, snapshot.commands],
  );
  const conditionalPositionLocked = Boolean(
    mode === 'EDIT'
    && command
    && isCommandEditorConditionalBoundary(originalCommandCode)
    && !commandChanged,
  );
  const placementOptions = useMemo(() => command
    ? commandEditorPlacementOptions(
        command,
        targetBlockId,
        snapshot.commands,
        conditionalImpactPreview?.boundariesToDelete.map(
          boundary => boundary.instructionId,
        ) ?? [],
      ).filter(option => mode === 'CREATE'
        ? option.placement.kind !== 'KEEP'
        : !conditionalPositionLocked || option.placement.kind === 'KEEP')
    : [], [
      command,
      conditionalImpactPreview,
      conditionalPositionLocked,
      mode,
      snapshot.commands,
      targetBlockId,
    ]);

  useEffect(() => {
    if (!command) return;
    const nextTargetBlockId = mode === 'CREATE'
      ? initialTargetBlockId
      : command.blockId ?? 0;
    setTargetBlockId(nextTargetBlockId);
    setPlacementValue(mode === 'CREATE'
      ? (nextTargetBlockId > 0 ? 'TOP' : 'END')
      : 'KEEP');
    setRelationshipWarning(null);
    setConditionalFamilyWarning(null);
    setSelectedCommandCode(canonicalInstructionAction(command.action));
    setVariableBindings(commandEditorVariableBindings(command, command.action));
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
  }, [command, initialTargetBlockId, mode]);

  useEffect(() => {
    if (!command || !conditionalPositionLocked) return;
    setTargetBlockId(command.blockId ?? 0);
    setPlacementValue('KEEP');
  }, [command, conditionalPositionLocked]);

  useEffect(() => {
    if (placementOptions.some(option => option.value === placementValue)) return;
    const fallback = placementOptions.find(option => option.value === 'KEEP')
      ?? placementOptions.find(option => option.value === 'END')
      ?? placementOptions[0];
    if (fallback) setPlacementValue(fallback.value);
  }, [placementOptions, placementValue]);

  if (!command || !draft) {
    return (
      <div className={styles.unavailable} role="alert">
        The selected instruction is not available in this Command Editor snapshot.
      </div>
    );
  }

  const selectCommand = (value: string | null) => {
    if (lockCommandSelection || value === null || value === selectedCommandCode) return;
    setSelectedCommandCode(value);
    setVariableBindings(commandEditorVariableBindings(command, value));
    setDraft(current => {
      if (!current) return current;
      return value === originalCommandCode
        ? commandEditorBaseDraft(command)
        : {
            ...current,
            action: value,
            operation: '',
            configuration: commandEditorConfiguration(value, '', null, null),
          };
    });
  };

  const setDesiredVariableBinding = (
    slot: ComponentEditorVariableSlot,
    variableId: number | null,
  ) => {
    setVariableBindings(current => updateCommandEditorVariableBinding(
      current,
      slot,
      variableId,
    ));
    if (slot !== 'LEFT' && slot !== 'RIGHT') return;
    setDraft(current => {
      if (!current) return current;
      const configuration = current.configuration;
      if (
        configuration.kind !== 'CHECK_VALUE'
        && configuration.kind !== 'EXTERNAL_CHECK'
      ) {
        return current;
      }
      return {
        ...current,
        configuration: slot === 'LEFT'
          ? { ...configuration, leftVariableId: variableId }
          : {
              ...configuration,
              operandKind: 'VARIABLE',
              operandRawValue: '',
              operandVariableId: variableId,
            },
      };
    });
  };

  const configurationEditor = draft.configuration.kind === 'LOOP'
    ? (
        <LoopCommandEditor
          value={draft.configuration}
          disabled={pending}
          onChange={configuration => setDraft(current => current
            ? { ...current, configuration }
            : current)}
        />
      )
    : draft.configuration.kind === 'REFRESH_LOOP'
      ? (
          <RefreshLoopCommandEditor
            value={draft.configuration}
            disabled={pending}
            onChange={configuration => setDraft(current => current
              ? { ...current, configuration }
              : current)}
          />
        )
      : draft.configuration.kind === 'WAIT'
        ? (
            <WaitCommandEditor
              value={draft.configuration}
              disabled={pending}
              onChange={configuration => setDraft(current => current
                ? { ...current, configuration }
                : current)}
            />
          )
        : draft.configuration.kind === 'CHECK_VALUE'
          ? (
              <CheckValueCommandEditor
                value={draft.configuration}
                disabled={pending}
                onChange={configuration => setDraft(current => current
                  ? { ...current, configuration }
                  : current)}
              />
            )
          : draft.configuration.kind === 'EXTERNAL_CHECK'
            ? (
                <ExternalCheckCommandEditor
                  value={draft.configuration}
                  disabled={pending}
                  onChange={configuration => setDraft(current => current
                    ? { ...current, configuration }
                    : current)}
                />
              )
            : draft.configuration.kind === 'EXCEL_WRITE'
              ? (
                  <ExcelWriteCommandEditor
                    value={draft.configuration}
                    disabled={pending}
                    onChange={configuration => setDraft(current => current
                      ? { ...current, configuration }
                      : current)}
                  />
                )
              : draft.configuration.kind === 'GOTO'
                ? (
                    <GotoCommandEditor
                      value={draft.configuration}
                      disabled={pending}
                      onChange={configuration => setDraft(current => current
                        ? { ...current, configuration }
                        : current)}
                    />
                  )
                : draft.configuration.kind === 'SWIPE'
                  ? (
                      <SwipeCommandEditor
                        value={draft.configuration}
                        disabled={pending}
                        onChange={configuration => setDraft(current => current
                          ? { ...current, configuration }
                          : current)}
                      />
                    )
                  : draft.configuration.kind === 'CONDITIONAL'
                    ? (
                        <ConditionalCommandEditor
                          value={draft.configuration}
                          variables={snapshot.variables}
                          disabled={pending}
                          onChange={configuration => setDraft(current => current
                            ? { ...current, configuration }
                            : current)}
                        />
                    )
                    : null;

  const variableBindingsEditor = variableBindings.length > 0
    ? (
        <CommandVariableBindingsEditor
          bindings={variableBindings}
          variables={snapshot.variables}
          disabled={pending}
          disconnectedOnly={mode === 'CREATE'}
          onChange={setDesiredVariableBinding}
        />
      )
    : null;

  const targetBlock = availableBlocks.find(block => block.blockId === targetBlockId) ?? null;
  const targetCommandCount = snapshot.commands.filter(
    candidate => candidate.blockId === targetBlockId,
  ).length;
  const placement = commandEditorPlacementFromValue(placementOptions, placementValue);
  const canSubmit = Boolean(
    onSubmit
    && !pending
    && (targetBlockId > 0 || (mode === 'CREATE' && targetBlockId === 0))
    && placement
    && isCommandEditorBaseDraftValid(draft)
    && !(
      conditionalPositionLocked
      && (targetBlockId !== command.blockId || placement?.kind !== 'KEEP')
    )
    && !(
      mode === 'EDIT'
      && ['ELSE', 'ENDIF'].includes(originalCommandCode)
      && !commandChanged
    ),
  );

  const submit = (action: CommandEditorMutationAction) => {
    if (!canSubmit || !placement || !onSubmit) return;
    const submittedPlacement = action === 'COPY_NEW' && placement.kind === 'KEEP'
      ? { kind: 'AFTER_INSTRUCTION' as const, instructionId: command.instructionId }
      : placement;
    const intent: CommandEditorMutationIntent = {
      action,
      sourceInstructionId: command.instructionId,
      targetBlockId,
      placement: submittedPlacement,
      draft: { ...draft, name: draft.name.trim() },
      variableBindings: action === 'UPDATE' ? variableBindings : [],
      allowRelationshipDisconnect: false,
      allowConditionalFamilyDissolve: false,
      conditionalFamilyDeleteIds: [],
    };
    if (action === 'UPDATE') {
      const conditionalImpact = commandEditorConditionalFamilyImpact(
        command,
        draft.action,
        snapshot.commands,
      );
      if (conditionalImpact) {
        setConditionalFamilyWarning({
          impact: conditionalImpact,
          intent: {
            ...intent,
            allowRelationshipDisconnect: true,
            allowConditionalFamilyDissolve: true,
            conditionalFamilyDeleteIds: conditionalImpact.boundariesToDelete.map(
              boundary => boundary.instructionId,
            ),
          },
        });
        return;
      }
      const impact = commandEditorRelationshipImpact(
        command,
        targetBlockId,
        submittedPlacement,
        snapshot.commands,
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

  return (
    <section className={styles.editor} aria-label="Command Editor workspace">
      <div className={styles.body}>
        <section className={styles.context} aria-label="Command Editor context">
          <div><span>Bot Job</span><strong>#{botJobId} {botJobName}</strong></div>
          <div><span>Original position</span><strong>{scopeLabel}</strong></div>
          <b>{mode === 'CREATE' ? 'ADD MODE' : 'EDIT MODE'}</b>
        </section>

        <section className={styles.summary} aria-label="Command Editor summary">
          <div><span>Target Block</span><strong>{targetBlock ? `#${targetBlock.blockOrder}` : '-'}</strong></div>
          <div><span>Target commands</span><strong>{targetCommandCount}</strong></div>
          <div><span>Connections</span><strong>{snapshot.connectionCount}</strong></div>
          <div><span>Diagnostics</span><strong>{snapshot.diagnosticCount}</strong></div>
        </section>

        <SearchBox
          label="Target Block"
          placeholder="Search target block name or number..."
          headerRight="Commands per block"
          countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
          options={blockSearchOptions}
          value={targetBlockId >= 0 ? String(targetBlockId) : null}
          onChange={(value) => {
            if (value === null || conditionalPositionLocked) return;
            const nextTargetBlockId = Number(value);
            if (
              !Number.isSafeInteger(nextTargetBlockId)
              || nextTargetBlockId < 0
              || (nextTargetBlockId === 0 && mode !== 'CREATE')
            ) return;
            setTargetBlockId(nextTargetBlockId);
            setPlacementValue(mode === 'CREATE'
              ? (nextTargetBlockId > 0 ? 'TOP' : 'END')
              : nextTargetBlockId !== command.blockId ? 'TOP' : 'KEEP');
          }}
        />

        <label className={styles.placementField}>
          <span>Placement</span>
          <select
            aria-label="Command placement"
            value={placementValue}
            disabled={pending}
            onChange={event => setPlacementValue(event.target.value)}
          >
            {placementOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <SearchBox
          label="Command"
          labelClassName={styles.commandLabel}
          placeholder="Search command name or code..."
          headerRight="Command catalog"
          countLabel={count => `${count} COMMAND${count === 1 ? '' : 'S'}`}
          options={commandSearchOptions}
          value={selectedCommandCode}
          onChange={selectCommand}
          disabled={lockCommandSelection || pending}
        />

        {lockCommandSelection && (
          <p className={styles.commandLockedNotice} role="note">
            Web Element type is locked. It cannot be changed into a command;
            Placement, UPDATE, and COPY NEW remain available.
          </p>
        )}

        <section className={styles.selectedCommand} aria-label="Selected command">
          <div>
            <span>Selected command</span>
            {lockCommandSelection ? (
              <strong className={styles.selectedInstructionIdentity}>
                <InstructionCommandBadge action={command.action} iconOnly />
                ({command.instructionId}) {command.instructionName}
              </strong>
            ) : (
              <strong>{mode === 'CREATE'
                ? `New command · ${command.instructionName}`
                : `#${command.instructionOrder ?? '?'} ${command.instructionName}`}</strong>
            )}
          </div>
          <div>
            <span>Command</span>
            <strong>
              {command.action || 'Unknown'}
              {commandChanged ? ` → ${selectedCommandCode}` : ''}
            </strong>
          </div>
          <div><span>Instruction ID</span><strong>{mode === 'CREATE' ? 'NEW' : command.instructionId}</strong></div>
          <div>
            <span>Block</span>
            <strong>{mode === 'CREATE'
              ? `#${targetBlock?.blockOrder ?? '?'} ${targetBlock?.blockName || 'Unknown Block'}`
              : `#${command.blockOrder ?? '?'} ${command.blockName || 'Unknown Block'}`}</strong>
          </div>
        </section>

        {(variableBindingsEditor || configurationEditor) && (
          <section className={styles.editorContent} aria-label="Command configuration">
            {variableBindingsEditor}
            {configurationEditor}
          </section>
        )}
      </div>

      <footer className={styles.footer}>
        {status && (
          <div
            role="status"
            className={`${styles.status} ${status.level === 'ok'
              ? styles.statusOk
              : status.level === 'warn'
                ? styles.statusWarn
                : styles.statusError}`}
          >
            {status.text}
          </div>
        )}
        <button type="button" className={styles.cancelButton} disabled={pending} onClick={onCancel}>
          CANCEL
        </button>
        {mode === 'CREATE' ? (
          <button
            type="button"
            className={styles.updateButton}
            disabled={!canSubmit}
            title={onSubmit
              ? 'Create this disconnected command'
              : 'Command persistence is not available for this workspace'}
            onClick={() => submit('CREATE_NEW')}
          >
            CREATE NEW
          </button>
        ) : (
          <>
            <button
              type="button"
              className={styles.copyButton}
              disabled={!canSubmit || isCommandEditorConditionalBoundary(originalCommandCode)}
              title={isCommandEditorConditionalBoundary(originalCommandCode)
                ? 'Copy the complete IF family through Block transfer'
                : onSubmit
                  ? 'Create a disconnected copy with a new instruction ID'
                  : 'Command persistence is not available for this workspace'}
              onClick={() => submit('COPY_NEW')}
            >
              COPY NEW
            </button>
            <button
              type="button"
              className={styles.updateButton}
              disabled={!canSubmit}
              title={onSubmit
                ? 'Update the selected instruction'
                : 'Command persistence is not available for this workspace'}
              onClick={() => submit('UPDATE')}
            >
              UPDATE
            </button>
          </>
        )}
      </footer>

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
      {conditionalFamilyWarning && (
        <CommandEditorConditionalFamilyWarningModal
          impact={conditionalFamilyWarning.impact}
          onCancel={() => setConditionalFamilyWarning(null)}
          onContinue={() => {
            const intent = conditionalFamilyWarning.intent;
            setConditionalFamilyWarning(null);
            onSubmit?.(intent);
          }}
        />
      )}
    </section>
  );
};

export default CommandEditorPageBody;
