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
  operation: string;
  hold: number;
  variableId?: number;
  parentBlockId?: number;
};

type Props = {
  instruction: CommandPanelInstruction;
  allowSplit: boolean;
  allowElseIf: boolean;
  onClose: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onSplit?: () => void;
  onInsertElseIf?: () => void;
  onDelete: () => void;
  onApplyCommand: (draft: CommandDraft) => void;
  messages: string[];
  context: { sessionId: string; targetSessionId: string; homeBankingId: number; botJobId: number | null; botJobName: string | null };
  onSocketCommand: (type: string, body: Record<string, unknown>) => void;
};

type VariableRow = { id?: number; type: string; name: string; value: string; localFormat?: string; delimiter?: string; usedVars?: string };

const COMMANDS = [
  ['SET', 'Set Value'], ['GET', 'Get Value'], ['CK', 'Check Value'],
  ['PDF CHECK', 'PDF Check'], ['CSV CHECK', 'CSV Check'], ['E', 'Extract Field'],
  ['IF', 'IF'], ['GOTO', 'GOTO'], ['EXCEL GOTO', 'Excel GOTO'],
  ['LOOP', 'Loop'], ['REFRESH_LOOP', 'Refresh Loop'], ['REFRESH', 'Refresh'],
  ['NEXT_ENTER', 'Next / Enter'], ['SWIPE_UP', 'Swipe Up'], ['SWIPE_DOWN', 'Swipe Down'],
  ['HOLD', 'Wait'], ['PAUSE', 'Pause'], ['QUIT', 'Close Browser'], ['SCREEN', 'Screenshot'],
];

const InstructionCommandPanel: React.FC<Props> = (props) => {
  const { instruction } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'actions' | 'command' | 'variables'>('actions');
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth - 520), y: 90 });
  const [mode, setMode] = useState<'before' | 'after' | 'edit'>('after');
  const [action, setAction] = useState(instruction.actions || 'SET');
  const [name, setName] = useState(instruction.name || 'New Command');
  const [operation, setOperation] = useState(instruction.operation || '');
  const [hold, setHold] = useState(5);
  const [variables, setVariables] = useState<VariableRow[]>([]);
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
      if (!String(envelope.operationId || '').startsWith('variableEditor.')) return;
      const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
      if (Array.isArray(body?.variables)) setVariables(body.variables);
      setVariableStatus(body?.ok ? (body.message || '') : (body?.error || 'Variable operation failed.'));
    } catch (_) {
      // Other socket messages are handled by the owning grid.
    }
  }, [props.messages]);

  const selectedLabel = useMemo(
    () => COMMANDS.find(([code]) => code === action)?.[1] || action,
    [action]
  );

  const openCommand = (nextMode: 'before' | 'after' | 'edit') => {
    setMode(nextMode);
    if (nextMode !== 'edit') {
      setAction('SET');
      setName('Set Value');
      setOperation('');
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
            <button onClick={() => openCommand('edit')}><b>Edit command</b><span>Update {instruction.actions || 'this instruction'}</span></button>
            <button onClick={props.onInsertBefore}><b>Insert empty step before</b><span>Use the existing placeholder workflow</span></button>
            <button onClick={props.onInsertAfter}><b>Insert empty step after</b><span>Use the existing placeholder workflow</span></button>
            {props.allowSplit && props.onSplit && <button onClick={props.onSplit}><b>Split component</b><span>Move the selected sequence into a component</span></button>}
            {props.allowElseIf && props.onInsertElseIf && <button onClick={props.onInsertElseIf}><b>Insert ElseIf</b><span>Extend the current conditional structure</span></button>}
            <button className={styles.dangerAction} onClick={props.onDelete}><b>Delete instruction</b><span>Confirmation is required</span></button>
          </div>
        )}

        {view === 'command' && (
          <div className={styles.form}>
            <label>Placement<select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="before">Before selected step</option><option value="after">After selected step</option><option value="edit">Update selected step</option></select></label>
            <label>Command<select value={action} onChange={(e) => { const value = e.target.value; setAction(value); setName(COMMANDS.find(([code]) => code === value)?.[1] || value); }}>
              {COMMANDS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select></label>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Operation / value<input value={operation} onChange={(e) => setOperation(e.target.value)} placeholder="Variable, locator, comparison, count, or target" /></label>
            {action === 'HOLD' && <label>Wait seconds<input type="number" min={1} max={9999} value={hold} onChange={(e) => setHold(Number(e.target.value))} /></label>}
            <div className={styles.preview}><span>Preview</span><b>{selectedLabel}</b><code>{operation || 'No additional value'}</code></div>
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
                <button onClick={() => { setOperation(`${variable.type === '#Numeric' ? '#' : '$'}${variable.name}`); setView('command'); }}>Use in command</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {view === 'command' && <footer className={styles.footer}>
        <button type="button" onClick={() => setView('actions')}>Back</button>
        <button type="button" className={styles.primary} disabled={!name.trim() || !action} onClick={() => props.onApplyCommand({ mode, action, name: name.trim(), operation: operation.trim(), hold })}>Apply</button>
      </footer>}
    </div>
  );
};

export default InstructionCommandPanel;
