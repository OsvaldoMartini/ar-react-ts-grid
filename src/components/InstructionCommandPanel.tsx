import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './InstructionCommandPanel.module.scss';
import { instructionDisplayLabel } from './instructionDisplay';

export type CommandPanelInstruction = {
  id: number;
  name: string;
  actions: string;
  operation?: string | null;
  blockId: number;
  blockName: string;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  variableId?: number | null;
  parentId?: number | null;
  parentBlockId?: number | null;
  onHoldSeconds?: number | null;
};

export type CommandDraft = {
  mode: 'before' | 'after' | 'edit';
  action: string;
  name: string;
  hold?: number;
  operator: string;
  interval: number;
  count: number;
  variableId?: number;
  parentId?: number;
  parentBlockId?: number;
  graphRevision: string;
};

export type CommandEditorContext = {
  sessionId: string;
  targetSessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  botJobName: string | null;
  bindingEpoch?: string | number;
  selectionRevision?: number;
};

export type CommandEditorVariableRow = {
  id?: number;
  type: string;
  name: string;
  value: string;
  instructionId?: number;
  localFormat?: string;
  delimiter?: string;
  usedVars?: string;
};

export type CommandEditorWebFieldRow = {
  id: number;
  name: string;
  actions: string;
  tagName?: string;
  blockId: number;
  blockName?: string;
};

export type CommandEditorBlockRow = {
  id: number;
  name: string;
  blockOrderNumber?: number;
};

export type CommandEditorCommandDefinition = {
  code: string;
  label: string;
  target: string;
  fields: string[];
  allowedTags?: string[];
  allowedVariableTypes?: string[];
  insertAllowed?: boolean;
  editAllowed?: boolean;
  disabledReason?: string;
};

export type CommandEditorStoredDraft = Omit<CommandDraft, 'mode'> & { warnings?: string[] };

export type CommandEditorSnapshot = {
  selectedBlockId: number;
  selectedInstructionId: number;
  selectionRevision?: number;
  graphRevision: string;
  variables: CommandEditorVariableRow[];
  webFields: CommandEditorWebFieldRow[];
  blocks: CommandEditorBlockRow[];
  instructions: CommandPanelInstruction[];
  commands: CommandEditorCommandDefinition[];
  draft?: CommandEditorStoredDraft | null;
  rowCapabilities?: {
    canInsertElseIf?: boolean;
    canSplit?: boolean;
  };
};

export type InstructionCommandPanelProps = {
  instruction: CommandPanelInstruction;
  onClose: () => void;
  onSplit?: (graphRevision: string) => void;
  onInsertElseIf?: (graphRevision: string) => void;
  onApplyCommand: (draft: CommandDraft) => void;
  messages: string[];
  context: CommandEditorContext;
  onSocketCommand: (type: string, body: Record<string, unknown>) => void;
  variant?: 'floating' | 'page';
  initialSnapshot?: CommandEditorSnapshot;
  selectionPending?: boolean;
  onSelectInstruction?: (blockId: number, instructionId: number) => void;
};

type VariableRow = CommandEditorVariableRow;
type WebFieldRow = CommandEditorWebFieldRow;
type BlockRow = CommandEditorBlockRow;
type CommandDefinition = CommandEditorCommandDefinition;
type StoredCommandDraft = CommandEditorStoredDraft;
type SplitPreviewRow = { id: number; order: number; name: string; action: string; parentId?: number | null };
type SplitPreview = { graphRevision: string; retainedRows: SplitPreviewRow[]; movedRows: SplitPreviewRow[]; retainedCount: number; movedCount: number };
const supportsTag = (command: CommandDefinition, tagName: string) => !command.allowedTags?.length || command.allowedTags.includes(tagName);

const normalizeInstruction = (row: any): CommandPanelInstruction | null => {
  const id = Number(row?.id);
  const blockId = Number(row?.blockId);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(blockId) || blockId <= 0) {
    return null;
  }
  return {
    id,
    name: String(row?.name || ''),
    actions: String(row?.actions || ''),
    operation: row?.operation == null ? null : String(row.operation),
    blockId,
    blockName: String(row?.blockName || ''),
    blockOrderNumber: Number(row?.blockOrderNumber) || 1,
    instructionOrderNumber: Number(row?.instructionOrderNumber) || 1,
    variableId: row?.variableId == null ? null : Number(row.variableId),
    parentId: row?.parentId == null ? null : Number(row.parentId),
    parentBlockId: row?.parentBlockId == null ? null : Number(row.parentBlockId),
    onHoldSeconds: row?.onHoldSeconds == null ? null : Number(row.onHoldSeconds),
  };
};

export const commandEditorSnapshotFromPayload = (payload: any): CommandEditorSnapshot | null => {
  const body = payload?.snapshot && typeof payload.snapshot === 'object'
    ? { ...payload, ...payload.snapshot }
    : payload;
  if (
    body?.ok === false
    || !Array.isArray(body?.variables)
    || !Array.isArray(body?.webFields)
    || !Array.isArray(body?.blocks)
    || !Array.isArray(body?.instructions)
    || !Array.isArray(body?.commands)
    || typeof body?.graphRevision !== 'string'
  ) {
    return null;
  }

  const instructions: CommandPanelInstruction[] = (body.instructions as any[])
    .map((row: any) => normalizeInstruction(row))
    .filter((row: CommandPanelInstruction | null): row is CommandPanelInstruction => row != null);
  const selectedInstructionId = Number(
    body?.selectedInstructionId ?? body?.instruction?.id,
  );
  const selectedBlockId = Number(
    body?.selectedBlockId ?? body?.instruction?.blockId,
  );
  if (
    !Number.isSafeInteger(selectedInstructionId)
    || selectedInstructionId <= 0
    || !Number.isSafeInteger(selectedBlockId)
    || selectedBlockId <= 0
    || !instructions.some(row =>
      row.id === selectedInstructionId && row.blockId === selectedBlockId)
  ) {
    return null;
  }

  return {
    selectedBlockId,
    selectedInstructionId,
    selectionRevision: Number.isSafeInteger(Number(body?.selectionRevision))
      ? Number(body.selectionRevision)
      : undefined,
    graphRevision: body.graphRevision,
    variables: body.variables,
    webFields: body.webFields,
    blocks: body.blocks,
    instructions,
    commands: body.commands,
    draft: body?.draft ?? null,
    rowCapabilities: body?.rowCapabilities || {},
  };
};

const InstructionCommandPanel: React.FC<InstructionCommandPanelProps> = (props) => {
  const { instruction } = props;
  const pageVariant = props.variant === 'page';
  const initialSnapshot = props.initialSnapshot;
  const panelRef = useRef<HTMLDivElement>(null);
  const processedMessagesRef = useRef(Math.max(0, props.messages.length - 1));
  const [view, setView] = useState<'actions' | 'command' | 'variables'>('actions');
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth - 520), y: 90 });
  const [mode, setMode] = useState<'before' | 'after' | 'edit'>('after');
  const [action, setAction] = useState(instruction.actions || 'SET');
  const [name, setName] = useState(instruction.name || 'New Command');
  const [hold, setHold] = useState(5);
  const [operator, setOperator] = useState('=');
  const [interval, setIntervalValue] = useState(1);
  const [count, setCount] = useState(1);
  const [variables, setVariables] = useState<VariableRow[]>(() => initialSnapshot?.variables || []);
  const [webFields, setWebFields] = useState<WebFieldRow[]>(() => initialSnapshot?.webFields || []);
  const [blocks, setBlocks] = useState<BlockRow[]>(() => initialSnapshot?.blocks || []);
  const [instructions, setInstructions] = useState<CommandPanelInstruction[]>(
    () => initialSnapshot?.instructions || [instruction],
  );
  const [commands, setCommands] = useState<CommandDefinition[]>(() => initialSnapshot?.commands || []);
  const [workspaceBlockId, setWorkspaceBlockId] = useState(
    () => initialSnapshot?.selectedBlockId || instruction.blockId,
  );
  const [selectedWebFieldId, setSelectedWebFieldId] = useState<number | undefined>(
    () => initialSnapshot?.draft?.parentId ?? instruction.parentId ?? undefined,
  );
  const [selectedVariableId, setSelectedVariableId] = useState<number | undefined>(
    () => initialSnapshot?.draft?.variableId ?? instruction.variableId ?? undefined,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<number | undefined>(
    () => initialSnapshot?.draft?.parentBlockId ?? instruction.parentBlockId ?? undefined,
  );
  const [variable, setVariable] = useState<VariableRow>({ type: '$String', name: '', value: '$EMPTY' });
  const [variableStatus, setVariableStatus] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<VariableRow | null>(null);
  const [storedDraft, setStoredDraft] = useState<StoredCommandDraft | null>(
    () => initialSnapshot?.draft || null,
  );
  const [graphRevision, setGraphRevision] = useState(initialSnapshot?.graphRevision || '');
  const [canInsertElseIf, setCanInsertElseIf] = useState(
    initialSnapshot?.rowCapabilities?.canInsertElseIf === true,
  );
  const [canSplit, setCanSplit] = useState(
    initialSnapshot?.rowCapabilities?.canSplit === true,
  );
  const [splitPreview, setSplitPreview] = useState<SplitPreview | null>(null);
  const [splitStatus, setSplitStatus] = useState('');

  const requestSplitPreview = () => {
    setSplitPreview(null);
    setSplitStatus('Checking split...');
    props.onSocketCommand('instructionGraph.previewSplit', {
      ...props.context,
      requestId: `${Date.now()}-split-preview-${instruction.id}`,
      instructionId: instruction.id,
      graphRevision,
    });
  };

  const requestCommandBootstrap = () => props.onSocketCommand('commandEditor.bootstrap', {
    ...props.context,
    instructionId: instruction.id,
    instructionName: instruction.name,
    instructionActions: instruction.actions,
    blockId: instruction.blockId,
  });

  const hydrateSnapshot = (snapshot: CommandEditorSnapshot) => {
    const nextDraft = snapshot.draft || null;
    setVariables(snapshot.variables);
    setWebFields(snapshot.webFields);
    setBlocks(snapshot.blocks);
    setInstructions(snapshot.instructions);
    setCommands(snapshot.commands);
    setWorkspaceBlockId(snapshot.selectedBlockId);
    setStoredDraft(nextDraft);
    setGraphRevision(snapshot.graphRevision);
    setCanInsertElseIf(snapshot.rowCapabilities?.canInsertElseIf === true);
    setCanSplit(snapshot.rowCapabilities?.canSplit === true);
    setSelectedWebFieldId(current => {
      const sameBlock = snapshot.webFields.filter(row => row.blockId === snapshot.selectedBlockId);
      if (nextDraft?.parentId && sameBlock.some(row => row.id === nextDraft.parentId)) {
        return nextDraft.parentId;
      }
      if (current && sameBlock.some(row => row.id === current)) return current;
      if (instruction.parentId && sameBlock.some(row => row.id === instruction.parentId)) {
        return instruction.parentId;
      }
      return sameBlock.some(row => row.id === instruction.id) ? instruction.id : undefined;
    });
    setSelectedVariableId(nextDraft?.variableId ?? instruction.variableId ?? undefined);
    setSelectedBlockId(nextDraft?.parentBlockId ?? instruction.parentBlockId ?? undefined);
  };

  const clamp = (next: { x: number; y: number }) => {
    const width = panelRef.current?.offsetWidth || 480;
    const height = panelRef.current?.offsetHeight || 520;
    return {
      x: Math.max(8, Math.min(next.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(next.y, window.innerHeight - Math.min(height, window.innerHeight - 16) - 8)),
    };
  };

  useEffect(() => {
    if (pageVariant) return;
    const onResize = () => setPos((current) => clamp(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pageVariant]);

  useEffect(() => {
    if (pageVariant) return;
    requestCommandBootstrap();
  }, [instruction.id, pageVariant]);

  useEffect(() => {
    if (!initialSnapshot) return;
    hydrateSnapshot(initialSnapshot);
  }, [initialSnapshot, instruction.id]);

  useEffect(() => {
    if (view !== 'variables') return;
    props.onSocketCommand('variableEditor.bootstrap', {
      ...props.context,
      instructionId: instruction.id,
      instructionName: instruction.name,
    });
  }, [view, instruction.id]);

  useEffect(() => {
    if (processedMessagesRef.current > props.messages.length) {
      processedMessagesRef.current = 0;
    }
    const pendingMessages = props.messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = props.messages.length;

    pendingMessages.forEach((message) => {
      try {
        const envelope = JSON.parse(message);
        const operationId = String(envelope.operationId || '');
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
        if ([
          'commandEditor.bootstrapResponse',
          'commandEditor.workspaceBootstrapResponse',
          'commandEditor.workspaceTarget',
          'commandEditor.selectResponse',
          'commandEditor.snapshot',
        ].includes(operationId)) {
          const snapshot = commandEditorSnapshotFromPayload(body);
          if (snapshot) {
            hydrateSnapshot(snapshot);
            return;
          }
          if (operationId !== 'commandEditor.bootstrapResponse') return;
          if (Array.isArray(body?.variables)) setVariables(body.variables.filter((row: VariableRow & { error?: string }) => !row.error));
          if (Array.isArray(body?.webFields)) {
            const loadedWebFields = body.webFields as WebFieldRow[];
            setWebFields(loadedWebFields);
            setSelectedWebFieldId(current => {
              const sameBlock = loadedWebFields.filter(row => row.blockId === instruction.blockId);
              if (body?.draft?.parentId && sameBlock.some(row => row.id === Number(body.draft.parentId))) {
                return Number(body.draft.parentId);
              }
              if (current && sameBlock.some(row => row.id === current)) return current;
              if (instruction.parentId && sameBlock.some(row => row.id === instruction.parentId)) {
                return instruction.parentId;
              }
              return sameBlock.some(row => row.id === instruction.id) ? instruction.id : undefined;
            });
          }
          if (Array.isArray(body?.blocks)) setBlocks(body.blocks);
          if (Array.isArray(body?.commands)) setCommands(body.commands);
          setStoredDraft(body?.draft || null);
          setSelectedVariableId(body?.draft?.variableId ?? instruction.variableId ?? undefined);
          setSelectedBlockId(body?.draft?.parentBlockId ?? instruction.parentBlockId ?? undefined);
          if (typeof body?.graphRevision === 'string') setGraphRevision(body.graphRevision);
          setCanInsertElseIf(body?.rowCapabilities?.canInsertElseIf === true);
          setCanSplit(body?.rowCapabilities?.canSplit === true);
          return;
        }
        if (operationId === 'instructionGraph.previewSplitResponse') {
          if (body?.ok && Array.isArray(body?.retainedRows) && Array.isArray(body?.movedRows)) {
            setSplitPreview(body as SplitPreview);
            setSplitStatus('');
          } else {
            setSplitPreview(null);
            setSplitStatus(body?.error || 'Split preview was refused.');
          }
          return;
        }
        if (operationId.startsWith('variableEditor.')) {
          if (Array.isArray(body?.variables)) setVariables(body.variables);
          setVariableStatus(body?.ok ? (body.message || '') : (body?.error || 'Variable operation failed.'));
          if (body?.ok && ['variableEditor.saveResponse', 'variableEditor.deleteResponse'].includes(operationId)) {
            if (operationId === 'variableEditor.deleteResponse') setDeleteCandidate(null);
            setGraphRevision('');
            requestCommandBootstrap();
          }
        }
      } catch (_) {
        // Other socket messages are handled by the owning grid.
      }
    });
  }, [props.messages]);

  const selectableBlocks = useMemo(
    () => [...blocks].sort((left, right) =>
      (left.blockOrderNumber || Number.MAX_SAFE_INTEGER)
      - (right.blockOrderNumber || Number.MAX_SAFE_INTEGER)
      || left.id - right.id),
    [blocks],
  );
  const workspaceInstructions = useMemo(
    () => instructions
      .filter(row => row.blockId === workspaceBlockId)
      .sort((left, right) =>
        left.instructionOrderNumber - right.instructionOrderNumber || left.id - right.id),
    [instructions, workspaceBlockId],
  );
  const selectWorkspaceBlock = (blockId: number) => {
    if (!Number.isSafeInteger(blockId) || blockId <= 0) return;
    const firstInstruction = instructions
      .filter(row => row.blockId === blockId)
      .sort((left, right) =>
        left.instructionOrderNumber - right.instructionOrderNumber || left.id - right.id)[0];
    if (!firstInstruction) return;
    props.onSelectInstruction?.(blockId, firstInstruction.id);
  };

  const selectedLabel = useMemo(
    () => commands.find(command => command.code === action)?.label || action,
    [action, commands]
  );
  const selectedWebField = webFields.find(row => row.id === selectedWebFieldId && row.blockId === instruction.blockId);
  const selectedWebFieldTag = (selectedWebField?.tagName || '').toLowerCase();
  const availableCommands = useMemo(
    () => commands.filter(command => {
      const modeAllowed = mode === 'edit' ? command.editAllowed !== false : command.insertAllowed !== false;
      return modeAllowed && supportsTag(command, selectedWebFieldTag);
    }),
    [commands, mode, selectedWebFieldTag]
  );
  const selectedCommand = commands.find(command => command.code === action);
  const commandFields = selectedCommand?.fields || [];
  const requiresWebField = commandFields.includes('webField');
  const requiresVariable = commandFields.includes('variable');
  const requiresBlock = commandFields.includes('block');
  const requiresOperator = commandFields.includes('operator');
  const requiresIntervalAndCount = commandFields.includes('interval') && commandFields.includes('count');
  const requiresCount = commandFields.includes('count') && !commandFields.includes('interval');
  useEffect(() => {
    if (availableCommands.length === 0 || availableCommands.some(command => command.code === action)) return;
    setAction(availableCommands[0].code);
    setName(availableCommands[0].label);
  }, [availableCommands, action]);
  const relatedVariables = useMemo(
    () => variables.filter(row =>
      (!selectedWebFieldId || row.instructionId === selectedWebFieldId)
      && (selectedCommand?.allowedVariableTypes || []).includes(row.type)),
    [variables, selectedWebFieldId, selectedCommand]
  );
  useEffect(() => {
    if (!selectedVariableId || relatedVariables.some(row => row.id === selectedVariableId)) return;
    setSelectedVariableId(undefined);
  }, [relatedVariables, selectedVariableId]);
  const canEditSelected = storedDraft != null && commands.some(command => command.editAllowed === true);
  const commandsReady = graphRevision.length > 0 && commands.length > 0;
  const variableUsageCount = Number.parseInt(variable.usedVars || '0', 10) || 0;

  const openCommand = (nextMode: 'before' | 'after' | 'edit') => {
    setMode(nextMode);
    if (nextMode === 'edit' && storedDraft) {
      setAction(storedDraft.action);
      setName(storedDraft.name);
      setHold(storedDraft.hold ?? 5);
      setOperator(storedDraft.operator);
      setIntervalValue(storedDraft.interval);
      setCount(storedDraft.count);
      setSelectedVariableId(storedDraft.variableId);
      setSelectedWebFieldId(storedDraft.parentId);
      setSelectedBlockId(storedDraft.parentBlockId);
      setView('command');
      return;
    }
    const allowed = commands.filter(command =>
      (nextMode === 'edit' ? command.editAllowed !== false : command.insertAllowed !== false)
      && supportsTag(command, selectedWebFieldTag));
    if (nextMode !== 'edit' || !allowed.some(command => command.code === action)) {
      const preferredAction = allowed.some(command => command.code === 'SET') ? 'SET' : 'GET';
      const defaultAction = allowed.some(command => command.code === preferredAction) ? preferredAction : (allowed[0]?.code || '');
      setAction(defaultAction);
      setName(commands.find(command => command.code === defaultAction)?.label || defaultAction);
    }
    setHold(5);
    setOperator('=');
    setIntervalValue(1);
    setCount(1);
    setView('command');
  };

  const startDrag = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    const origin = pos;
    const start = { x: event.clientX, y: event.clientY };
    const move = (e: MouseEvent) => setPos(clamp({
      x: origin.x + e.clientX - start.x,
      y: origin.y + e.clientY - start.y,
    }));
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${pageVariant ? styles.pagePanel : ''}`}
      style={pageVariant ? undefined : { left: pos.x, top: pos.y }}
    >
      {!pageVariant && <header className={styles.header} onMouseDown={startDrag}>
        <div>
          <strong>Instruction commands</strong>
          <span>#{instruction.instructionOrderNumber} {instructionDisplayLabel(instruction)}</span>
        </div>
        <button type="button" className={styles.iconButton} onClick={props.onClose} title="Close">×</button>
      </header>}

      {pageVariant && (
        <section className={styles.selectionBar} aria-label="Command Editor selection">
          <label>
            Block
            <select
              aria-label="Command Editor Block"
              value={workspaceBlockId}
              disabled={props.selectionPending}
              onChange={(event) => selectWorkspaceBlock(Number(event.target.value))}
            >
              {selectableBlocks.map(block => {
                const instructionCount = instructions.filter(row => row.blockId === block.id).length;
                return (
                  <option key={block.id} value={block.id} disabled={instructionCount === 0}>
                    #{block.blockOrderNumber || ''} {block.name}
                    {instructionCount === 0 ? ' (empty)' : ''}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Instruction
            <select
              aria-label="Command Editor Instruction"
              value={instruction.id}
              disabled={props.selectionPending || workspaceInstructions.length === 0}
              onChange={(event) => {
                const instructionId = Number(event.target.value);
                if (Number.isSafeInteger(instructionId) && instructionId > 0) {
                  props.onSelectInstruction?.(workspaceBlockId, instructionId);
                }
              }}
            >
              {workspaceInstructions.map(row => (
                <option key={row.id} value={row.id}>
                  #{row.instructionOrderNumber} {instructionDisplayLabel(row)} [{row.actions || 'Web Field'}]
                </option>
              ))}
            </select>
          </label>
          <span className={styles.selectionStatus} role="status">
            {props.selectionPending
              ? 'Loading selection...'
              : `${instructions.length} instruction${instructions.length === 1 ? '' : 's'} loaded`}
          </span>
        </section>
      )}

      <nav className={styles.tabs}>
        <button className={view === 'actions' ? styles.activeTab : ''} onClick={() => setView('actions')}>Actions</button>
        <button className={view === 'command' ? styles.activeTab : ''} onClick={() => setView('command')}>Command</button>
        <button className={view === 'variables' ? styles.activeTab : ''} onClick={() => setView('variables')}>Variables</button>
      </nav>

      <main className={styles.body}>
        {view === 'actions' && (
          <div className={styles.actionGrid}>
            <button disabled={!commandsReady} onClick={() => openCommand('before')}><b>Add command before</b><span>Create and insert a configured operation</span></button>
            <button disabled={!commandsReady} onClick={() => openCommand('after')}><b>Add command after</b><span>Create and insert a configured operation</span></button>
            {canEditSelected && <button onClick={() => openCommand('edit')}><b>Edit command</b><span>Update {instruction.actions || 'this instruction'}</span></button>}
            {canSplit && props.onSplit && <button disabled={!graphRevision} onClick={requestSplitPreview}><b>Split component</b><span>Preview the exact sequence before moving it</span></button>}
            {canInsertElseIf && props.onInsertElseIf && <button disabled={!graphRevision} onClick={() => props.onInsertElseIf?.(graphRevision)}><b>Insert ElseIf</b><span>Extend the current conditional structure</span></button>}
          </div>
        )}
        {view === 'actions' && splitStatus && <p className={styles.status}>{splitStatus}</p>}
        {view === 'actions' && splitPreview && (
          <section className={styles.splitPreview} aria-label="Split preview">
            <header><b>Confirm split</b><span>{splitPreview.movedCount} instructions will move</span></header>
            <div className={styles.splitColumns}>
              <div><strong>Keep ({splitPreview.retainedCount})</strong>{splitPreview.retainedRows.map(row => <span key={row.id}>#{row.order} {row.name} <small>{row.action}</small></span>)}</div>
              <div><strong>Move ({splitPreview.movedCount})</strong>{splitPreview.movedRows.map(row => <span key={row.id}>#{row.order} {row.name} <small>{row.action}</small></span>)}</div>
            </div>
            <footer><button type="button" onClick={() => setSplitPreview(null)}>Cancel</button><button type="button" className={styles.primary} onClick={() => props.onSplit?.(splitPreview.graphRevision)}>Apply split</button></footer>
          </section>
        )}

        {view === 'command' && (
          <div className={styles.form}>
            <label>Placement<select value={mode} onChange={(e) => { const nextMode = e.target.value as typeof mode; if (nextMode === 'edit' || mode === 'edit') openCommand(nextMode); else setMode(nextMode); }}><option value="before">Before selected step</option><option value="after">After selected step</option>{canEditSelected && <option value="edit">Update selected step</option>}</select></label>
            <label>Command<select value={action} onChange={(e) => { const value = e.target.value; setAction(value); setName(commands.find(command => command.code === value)?.label || value); setHold(5); setOperator('='); setIntervalValue(1); setCount(1); }}>
              {availableCommands.map(command => <option key={command.code} value={command.code}>{command.label}</option>)}
            </select></label>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <div className={styles.anchorSummary}>
              <span>Reference instruction</span>
              <b>#{instruction.instructionOrderNumber} ({instruction.id}) {instructionDisplayLabel(instruction)}</b>
              <small>{instruction.blockName}</small>
            </div>
            {storedDraft?.warnings && storedDraft.warnings.length > 0 && (
              <div className={styles.codecWarnings} role="status">
                <strong>Historical operation warning</strong>
                {storedDraft.warnings.map((warning, index) => <span key={`${warning}-${index}`}>{warning}</span>)}
              </div>
            )}
            {requiresWebField && <label>Web Field<select value={selectedWebField?.id || ''} onChange={(e) => { setSelectedWebFieldId(Number(e.target.value) || undefined); setSelectedVariableId(undefined); }}>
              <option value="">Select Web Field</option>
              {webFields.filter(row => row.blockId === instruction.blockId).map(row => <option key={row.id} value={row.id}>#{row.id} {row.name} [{row.tagName || row.actions}]</option>)}
            </select></label>}
            {requiresVariable && <label>Variable<select value={selectedVariableId || ''} onChange={(e) => setSelectedVariableId(Number(e.target.value) || undefined)}>
              <option value="">Select Variable</option>
              {relatedVariables.map(row => <option key={row.id} value={row.id}>{row.type === '#Numeric' ? '#' : '$'}{row.name} = {row.value}</option>)}
            </select></label>}
            {requiresBlock && <label>Destination Block<select value={selectedBlockId || ''} onChange={(e) => setSelectedBlockId(Number(e.target.value) || undefined)}>
              <option value="">Select Block</option>
              {blocks.filter(row => row.id !== instruction.blockId).map(row => <option key={row.id} value={row.id}>#{row.blockOrderNumber || ''} {row.name}</option>)}
            </select></label>}
            {requiresOperator && <label>Operator<select value={operator} onChange={(e) => setOperator(e.target.value)}><option value="=">Equals</option><option value="!=">Not equal</option><option value=">">Greater than</option><option value="<">Less than</option><option value=">=">Greater or equal</option><option value="<=">Less or equal</option></select></label>}
            {requiresIntervalAndCount && <><label>Interval seconds<input type="number" min={1} max={9999} value={interval} onChange={(e) => setIntervalValue(Number(e.target.value))} /></label><label>Iterations<input type="number" min={1} max={9999} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label></>}
            {requiresCount && <label>{action === 'GOTO' ? 'GOTO count' : 'Repetitions'}<input type="number" min={1} max={9999} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>}
            {commandFields.includes('hold') && <label>Wait seconds<input type="number" min={1} max={9999} value={hold} onChange={(e) => setHold(Number(e.target.value))} /></label>}
            <div className={styles.preview}><span>Preview</span><b>{selectedLabel}</b><code>Operation is generated and validated by Java</code></div>
          </div>
        )}

        {view === 'variables' && (
          <div className={styles.variablesWorkspace}>
            <div className={styles.variableList}>
              <div className={styles.variableListHeader}><strong>Variables</strong><button onClick={() => { setDeleteCandidate(null); setVariable({ type: '$String', name: '', value: '$EMPTY' }); }}>New</button></div>
              {variables.length === 0 && <span className={styles.emptyText}>No variables available for this instruction.</span>}
              {variables.map((row) => <button key={row.id} className={variable.id === row.id ? styles.selectedVariable : ''} onClick={() => { setDeleteCandidate(null); setVariable(row); }}><b>{row.type === '#Numeric' ? '#' : '$'}{row.name}</b><span>{row.value || '$EMPTY'}</span><small>{row.usedVars || '0'} use(s)</small></button>)}
            </div>
            <div className={styles.variableForm}>
              <label>Type<select value={variable.type} onChange={(e) => setVariable({ ...variable, type: e.target.value })}><option value="$String">String</option><option value="#Numeric">Numeric</option></select></label>
              <label>Name<input value={variable.name} onChange={(e) => setVariable({ ...variable, name: e.target.value })} /></label>
              <label>Value<input value={variable.value} onChange={(e) => setVariable({ ...variable, value: e.target.value })} /></label>
              {variable.type === '#Numeric' && <label>Number format<select value={variable.localFormat || ''} onChange={(e) => setVariable({ ...variable, localFormat: e.target.value })}><option value="">None</option><option value="US">American (9,999.99)</option><option value="EU">European (9.999,99)</option></select></label>}
              <label>CSV delimiter<select value={variable.delimiter || ''} onChange={(e) => setVariable({ ...variable, delimiter: e.target.value })}><option value="">None</option><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select></label>
              {variableStatus && <p className={styles.status}>{variableStatus}</p>}
              {deleteCandidate && <div className={styles.deleteConfirm} role="alertdialog" aria-label="Confirm variable deletion">
                <b>Delete ${deleteCandidate.name}?</b>
                <span>This variable has no reported instruction references. Java will verify usage again before deletion.</span>
                <div><button onClick={() => setDeleteCandidate(null)}>Cancel</button><button className={styles.confirmDelete} onClick={() => props.onSocketCommand('variableEditor.delete', { ...props.context, requestId: `${Date.now()}-variable-delete-${deleteCandidate.id}`, instructionId: instruction.id, instructionName: instruction.name, variableId: deleteCandidate.id })}>Delete</button></div>
              </div>}
              <div className={styles.variableButtons}>
                {variable.id != null && <button className={styles.deleteButton} disabled={variableUsageCount > 0} title={variableUsageCount > 0 ? `Used by ${variableUsageCount} instruction(s)` : 'Delete variable'} onClick={() => setDeleteCandidate(variable)}>Delete</button>}
                <button className={styles.primary} disabled={!variable.name.trim()} onClick={() => props.onSocketCommand('variableEditor.save', { ...props.context, requestId: `${Date.now()}-variable-save-${variable.id ?? 'new'}`, instructionId: instruction.id, instructionName: instruction.name, variable })}>{variable.id == null ? 'Create' : 'Update'}</button>
                <button disabled={!selectedCommand?.allowedVariableTypes?.includes(variable.type)} title={selectedCommand?.allowedVariableTypes?.includes(variable.type) ? 'Use variable in command' : 'Variable type is not compatible with this command'} onClick={() => { setSelectedVariableId(variable.id); if (variable.instructionId) setSelectedWebFieldId(variable.instructionId); setView('command'); }}>Use in command</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {view === 'command' && <footer className={styles.footer}>
        <button type="button" onClick={() => setView('actions')}>Back</button>
        <button type="button" className={styles.primary} disabled={!graphRevision || !name.trim() || !action || (requiresWebField && !selectedWebField) || (requiresVariable && !selectedVariableId) || (requiresBlock && !selectedBlockId)} onClick={() => props.onApplyCommand({ mode, action, name: name.trim(), hold: commandFields.includes('hold') ? hold : undefined, operator, interval, count, parentId: requiresWebField ? selectedWebField?.id : undefined, variableId: requiresVariable ? selectedVariableId : undefined, parentBlockId: requiresBlock ? selectedBlockId : undefined, graphRevision })}>Apply</button>
      </footer>}
    </div>
  );
};

export default InstructionCommandPanel;
