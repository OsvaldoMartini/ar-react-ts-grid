import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './InstructionCommandPanel.module.scss';

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
};

export type CommandDraft = {
  mode: 'before' | 'after' | 'edit';
  action: string;
  name: string;
  hold: number;
  operator: string;
  interval: number;
  count: number;
  variableId?: number;
  parentId?: number;
  parentBlockId?: number;
};

type Props = {
  instruction: CommandPanelInstruction;
  allowSplit: boolean;
  allowElseIf: boolean;
  onClose: () => void;
  onSplit?: () => void;
  onInsertElseIf?: () => void;
  onApplyCommand: (draft: CommandDraft) => void;
  messages: string[];
  context: { sessionId: string; targetSessionId: string; homeBankingId: number; botJobId: number | null; botJobName: string | null };
  onSocketCommand: (type: string, body: Record<string, unknown>) => void;
};

type VariableRow = { id?: number; type: string; name: string; value: string; instructionId?: number; localFormat?: string; delimiter?: string; usedVars?: string };
type WebFieldRow = { id: number; name: string; actions: string; tagName?: string; blockId: number; blockName?: string };
type BlockRow = { id: number; name: string; blockOrderNumber?: number };
type CommandDefinition = { code: string; label: string; target: string; fields: string[] };

const FALLBACK_COMMANDS: CommandDefinition[] = [
  { code: 'SET', label: 'Set Value', target: 'variable', fields: ['webField', 'variable'] },
  { code: 'GET', label: 'Get Value', target: 'variable', fields: ['webField', 'variable'] },
  { code: 'CK', label: 'Check Value', target: 'variable', fields: ['webField', 'variable', 'operator'] },
  { code: 'GOTO', label: 'GOTO', target: 'block', fields: ['block', 'count'] },
  { code: 'H', label: 'Wait', target: 'number', fields: ['hold'] },
];
const SPECIAL_ACTIONS = new Set(['SET', 'GET', 'CK', 'Q', 'P', 'H', 'E', 'GOTO', 'IF', 'ELSEIF', 'ELSE', 'ENDIF', 'PAUSE', 'REFRESH', 'LOOP', 'REFRESH_LOOP', 'NEXT_ENTER', 'SWIPE_UP', 'SWIPE_DOWN', 'EXCEL GOTO', 'NEXT ROW', 'CSV CHECK', 'PDF CHECK']);

const InstructionCommandPanel: React.FC<Props> = (props) => {
  const { instruction } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'actions' | 'command' | 'variables'>('actions');
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth - 520), y: 90 });
  const [mode, setMode] = useState<'before' | 'after' | 'edit'>('after');
  const [action, setAction] = useState(instruction.actions || 'SET');
  const [name, setName] = useState(instruction.name || 'New Command');
  const [hold, setHold] = useState(5);
  const [operator, setOperator] = useState('=');
  const [interval, setIntervalValue] = useState(1);
  const [count, setCount] = useState(1);
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [webFields, setWebFields] = useState<WebFieldRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [commands, setCommands] = useState<CommandDefinition[]>(FALLBACK_COMMANDS);
  const [selectedWebFieldId, setSelectedWebFieldId] = useState<number | undefined>(instruction.parentId || instruction.id);
  const [selectedVariableId, setSelectedVariableId] = useState<number | undefined>(instruction.variableId || undefined);
  const [selectedBlockId, setSelectedBlockId] = useState<number | undefined>(instruction.parentBlockId || undefined);
  const [variable, setVariable] = useState<VariableRow>({ type: '$String', name: '', value: '$EMPTY' });
  const [variableStatus, setVariableStatus] = useState('');

  const clamp = (next: { x: number; y: number }) => {
    const width = panelRef.current?.offsetWidth || 480;
    const height = panelRef.current?.offsetHeight || 520;
    return {
      x: Math.max(8, Math.min(next.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(next.y, window.innerHeight - Math.min(height, window.innerHeight - 16) - 8)),
    };
  };

  useEffect(() => {
    const onResize = () => setPos((current) => clamp(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    props.onSocketCommand('commandEditor.bootstrap', {
      ...props.context,
      instructionId: instruction.id,
      instructionName: instruction.name,
      blockId: instruction.blockId,
    });
  }, [instruction.id]);

  useEffect(() => {
    if (view !== 'variables') return;
    props.onSocketCommand('variableEditor.bootstrap', {
      ...props.context,
      instructionId: instruction.id,
      instructionName: instruction.name,
    });
  }, [view, instruction.id]);

  useEffect(() => {
    if (!props.messages.length) return;
    try {
      const envelope = JSON.parse(props.messages[props.messages.length - 1]);
      const operationId = String(envelope.operationId || '');
      const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
      if (operationId === 'commandEditor.bootstrapResponse') {
        if (Array.isArray(body?.variables)) setVariables(body.variables.filter((row: VariableRow & { error?: string }) => !row.error));
        if (Array.isArray(body?.webFields)) setWebFields(body.webFields);
        if (Array.isArray(body?.blocks)) setBlocks(body.blocks);
        if (Array.isArray(body?.commands) && body.commands.length > 0) setCommands(body.commands);
        return;
      }
      if (operationId.startsWith('variableEditor.')) {
        if (Array.isArray(body?.variables)) setVariables(body.variables);
        setVariableStatus(body?.ok ? (body.message || '') : (body?.error || 'Variable operation failed.'));
      }
    } catch (_) {
      // Other socket messages are handled by the owning grid.
    }
  }, [props.messages]);

  const selectedLabel = useMemo(
    () => commands.find(command => command.code === action)?.label || action,
    [action, commands]
  );
  const selectedWebField = webFields.find(row => row.id === selectedWebFieldId);
  const selectedWebFieldTag = (selectedWebField?.tagName || '').toLowerCase();
  const availableCommands = useMemo(
    () => commands.filter(command => command.code !== 'SET' || ['input', 'select', 'textarea'].includes(selectedWebFieldTag)),
    [commands, selectedWebFieldTag]
  );
  const selectedCommand = commands.find(command => command.code === action);
  const commandFields = selectedCommand?.fields || [];
  const requiresWebField = commandFields.includes('webField');
  const requiresVariable = commandFields.includes('variable');
  const requiresBlock = commandFields.includes('block');
  const requiresOperator = commandFields.includes('operator');
  const requiresIntervalAndCount = commandFields.includes('interval') && commandFields.includes('count');
  const requiresCount = commandFields.includes('count') && !commandFields.includes('interval');
  const relatedVariables = useMemo(
    () => variables.filter(row => !selectedWebFieldId || row.instructionId === selectedWebFieldId),
    [variables, selectedWebFieldId]
  );
  const isCommandRow = SPECIAL_ACTIONS.has((instruction.actions || '').split(':', 1)[0].toUpperCase());

  const openCommand = (nextMode: 'before' | 'after' | 'edit') => {
    setMode(nextMode);
    if (nextMode !== 'edit') {
      const defaultAction = ['input', 'select', 'textarea'].includes(selectedWebFieldTag) ? 'SET' : 'GET';
      setAction(defaultAction);
      setName(defaultAction === 'SET' ? 'Set Value' : 'Get Value');
    }
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
    <div ref={panelRef} className={styles.panel} style={{ left: pos.x, top: pos.y }}>
      <header className={styles.header} onMouseDown={startDrag}>
        <div>
          <strong>Instruction commands</strong>
          <span>#{instruction.instructionOrderNumber} {instruction.name}</span>
        </div>
        <button type="button" className={styles.iconButton} onClick={props.onClose} title="Close">×</button>
      </header>

      <nav className={styles.tabs}>
        <button className={view === 'actions' ? styles.activeTab : ''} onClick={() => setView('actions')}>Actions</button>
        <button className={view === 'command' ? styles.activeTab : ''} onClick={() => setView('command')}>Command</button>
        <button className={view === 'variables' ? styles.activeTab : ''} onClick={() => setView('variables')}>Variables</button>
      </nav>

      <main className={styles.body}>
        {view === 'actions' && (
          <div className={styles.actionGrid}>
            <button onClick={() => openCommand('before')}><b>Add command before</b><span>Create and insert a configured operation</span></button>
            <button onClick={() => openCommand('after')}><b>Add command after</b><span>Create and insert a configured operation</span></button>
            {isCommandRow && !['IF', 'ELSEIF', 'ELSE', 'ENDIF'].includes(instruction.actions) && <button onClick={() => openCommand('edit')}><b>Edit command</b><span>Update {instruction.actions || 'this instruction'}</span></button>}
            {props.allowSplit && props.onSplit && <button onClick={props.onSplit}><b>Split component</b><span>Move the selected sequence into a component</span></button>}
            {props.allowElseIf && props.onInsertElseIf && <button onClick={props.onInsertElseIf}><b>Insert ElseIf</b><span>Extend the current conditional structure</span></button>}
          </div>
        )}

        {view === 'command' && (
          <div className={styles.form}>
            <label>Placement<select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="before">Before selected step</option><option value="after">After selected step</option><option value="edit">Update selected step</option></select></label>
            <label>Command<select value={action} onChange={(e) => { const value = e.target.value; setAction(value); setName(commands.find(command => command.code === value)?.label || value); }}>
              {availableCommands.map(command => <option key={command.code} value={command.code}>{command.label}</option>)}
            </select></label>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <div className={styles.anchorSummary}>
              <span>Reference instruction</span>
              <b>#{instruction.instructionOrderNumber} ({instruction.id}) {instruction.name}</b>
              <small>{instruction.blockName}</small>
            </div>
            {requiresWebField && <label>Web Field<select value={selectedWebFieldId || ''} onChange={(e) => { setSelectedWebFieldId(Number(e.target.value) || undefined); setSelectedVariableId(undefined); }}>
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
              <div className={styles.variableListHeader}><strong>Variables</strong><button onClick={() => setVariable({ type: '$String', name: '', value: '$EMPTY' })}>New</button></div>
              {variables.length === 0 && <span className={styles.emptyText}>No variables available for this instruction.</span>}
              {variables.map((row) => <button key={row.id} className={variable.id === row.id ? styles.selectedVariable : ''} onClick={() => setVariable(row)}><b>{row.type === '#Numeric' ? '#' : '$'}{row.name}</b><span>{row.value || '$EMPTY'}</span><small>{row.usedVars || '0'} use(s)</small></button>)}
            </div>
            <div className={styles.variableForm}>
              <label>Type<select value={variable.type} onChange={(e) => setVariable({ ...variable, type: e.target.value })}><option value="$String">String</option><option value="#Numeric">Numeric</option></select></label>
              <label>Name<input value={variable.name} onChange={(e) => setVariable({ ...variable, name: e.target.value })} /></label>
              <label>Value<input value={variable.value} onChange={(e) => setVariable({ ...variable, value: e.target.value })} /></label>
              {variable.type === '#Numeric' && <label>Number format<select value={variable.localFormat || ''} onChange={(e) => setVariable({ ...variable, localFormat: e.target.value })}><option value="">None</option><option value="US">American (9,999.99)</option><option value="EU">European (9.999,99)</option></select></label>}
              <label>CSV delimiter<select value={variable.delimiter || ''} onChange={(e) => setVariable({ ...variable, delimiter: e.target.value })}><option value="">None</option><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select></label>
              {variableStatus && <p className={styles.status}>{variableStatus}</p>}
              <div className={styles.variableButtons}>
                {variable.id != null && <button className={styles.deleteButton} onClick={() => { if (window.confirm(`Delete variable ${variable.name}?`)) props.onSocketCommand('variableEditor.delete', { ...props.context, instructionId: instruction.id, instructionName: instruction.name, variableId: variable.id }); }}>Delete</button>}
                <button className={styles.primary} disabled={!variable.name.trim()} onClick={() => props.onSocketCommand('variableEditor.save', { ...props.context, instructionId: instruction.id, instructionName: instruction.name, variable })}>{variable.id == null ? 'Create' : 'Update'}</button>
                <button onClick={() => { setSelectedVariableId(variable.id); if (variable.instructionId) setSelectedWebFieldId(variable.instructionId); setView('command'); }}>Use in command</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {view === 'command' && <footer className={styles.footer}>
        <button type="button" onClick={() => setView('actions')}>Back</button>
        <button type="button" className={styles.primary} disabled={!name.trim() || !action || (requiresWebField && !selectedWebFieldId) || (requiresVariable && !selectedVariableId) || (requiresBlock && !selectedBlockId)} onClick={() => props.onApplyCommand({ mode, action, name: name.trim(), hold, operator, interval, count, parentId: selectedWebFieldId, variableId: selectedVariableId, parentBlockId: selectedBlockId })}>Apply</button>
      </footer>}
    </div>
  );
};

export default InstructionCommandPanel;
