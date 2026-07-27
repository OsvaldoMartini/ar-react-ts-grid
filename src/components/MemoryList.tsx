import React, { useCallback, useEffect, useRef, useState } from 'react';
import clickImage from '../assets/click.png';
import excelImage from '../assets/excel.png';
import inputImage from '../assets/input_field.png';
import linkImage from '../assets/links-icon.png';
import outPutImage from '../assets/output1.png';
import screenImage from '../assets/screen.png';
import waitImage from '../assets/wait.png';
import CreateNewBlock, {
  type CreateBlockPosition,
} from './CreateNewBlock';
import DetachedPageShell from './DetachedPageShell';
import {
  memoryListRequiresTargetBlock,
  type MemoryListItemIcon,
  type MemoryListSnapshot,
} from './memoryList.contract';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './MemoryList.module.scss';

export const MEMORY_LIST_SESSION_ID = 'memoryListManager';

interface MemoryListProps {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
  /**
   * Synthetic offline mode: seed the real Memory List with fake rows and keep all
   * commands local so drag & drop can be exercised without the Java backend.
   * Reached via ?memoryListDemo=1 in `npm start`.
   */
  demoMode?: boolean;
}

type MemoryListCommand =
  | { action: 'SELECT_BLOCK'; blockId: number | null }
  | { action: 'REMOVE'; itemKey: string }
  | { action: 'CLEAR' }
  | { action: 'APPLY'; targetBlockId: number | null }
  | { action: 'REORDER'; orderedItemKeys: string[] }
  | { action: 'CREATE_BLOCK'; blockName: string; position: CreateBlockPosition };

const EMPTY_SNAPSHOT: MemoryListSnapshot = {
  ownerEpoch: '',
  sourceKind: 'BOT_JOB',
  homeBankingId: -1,
  botJobId: -1,
  botJobName: '',
  items: [],
  blocks: [],
  targetBlockId: null,
  emptyMessage: 'No items have been added to Memory List.',
  status: 'Waiting for Memory List data',
  busy: false,
  canApply: false,
};

// Synthetic 10-row snapshot for offline drag & drop testing (demoMode / ?memoryListDemo=1).
const DEMO_SNAPSHOT: MemoryListSnapshot = {
  ...EMPTY_SNAPSHOT,
  ownerEpoch: 'demo-epoch',
  sourceKind: 'MIXED',
  homeBankingId: 1,
  botJobId: 999,
  botJobName: 'Synthetic Demo Job',
  items: Array.from({ length: 10 }, (_, index) => {
    const n = index + 1;
    const fromScanner = n % 2 === 0;
    return {
      key: `${fromScanner ? 'PAGE_SCANNER' : 'BOT_JOB'}:${n}`,
      sourceKind: fromScanner ? 'PAGE_SCANNER' : 'BOT_JOB',
      sourceItemKey: String(n),
      label: `Memory item ${n}`,
      detail: fromScanner ? `scanned element #${n}` : `instruction #${n}`,
      icon: (['click', 'input', 'link', 'output', 'screen', 'wait', 'excel'] as MemoryListItemIcon[])[index % 7],
      active: true,
    };
  }),
  blocks: [
    { blockId: 1, blockName: 'Block A', blockOrderNumber: 1 },
    { blockId: 2, blockName: 'Block B', blockOrderNumber: 2 },
  ],
  targetBlockId: 1,
  status: 'Synthetic Memory List (offline demo — no backend)',
  canApply: true,
};

const ITEM_ICONS: Partial<Record<MemoryListItemIcon, string>> = {
  click: clickImage,
  excel: excelImage,
  input: inputImage,
  link: linkImage,
  output: outPutImage,
  screen: screenImage,
  wait: waitImage,
};

function parseMessage(raw: string): { operationId?: string; body: any } {
  const outer = JSON.parse(raw);
  const operationId = outer.operationId || outer.type;
  const body = typeof outer.body === 'string' ? JSON.parse(outer.body) : outer.body ?? outer;
  return { operationId, body };
}

const MemoryList: React.FC<MemoryListProps> = ({ socketPort, sessionId, onClose, demoMode = false }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const commandSequenceRef = useRef(0);
  const pendingCommandRef = useRef<{
    requestId: string;
    action: MemoryListCommand['action'];
  } | null>(null);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snapshot, setSnapshot] = useState<MemoryListSnapshot>(demoMode ? DEMO_SNAPSHOT : EMPTY_SNAPSHOT);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState('');
  const [pendingAction, setPendingAction] = useState<MemoryListCommand['action'] | null>(null);

  const send = useCallback((type: string, body: unknown = {}) => {
    // Offline demo keeps every command local; the optimistic state update is the result.
    if (demoMode) {
      console.log('[MemoryList][drag] demoMode local command', { type, body });
      return true;
    }
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setLocalStatus('Memory List is not connected.');
      return false;
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      homeBankingId: snapshot.homeBankingId,
      body: JSON.stringify(body),
    }));
    return true;
  }, [demoMode, sessionId, snapshot.homeBankingId, webSocket]);

  const clearPendingCommand = useCallback(() => {
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }
    pendingCommandRef.current = null;
    setPendingAction(null);
  }, []);

  const sendCommand = useCallback((command: MemoryListCommand): boolean => {
    if (!snapshot.ownerEpoch) {
      setLocalStatus('Memory List data is not ready.');
      return false;
    }
    if (pendingCommandRef.current) {
      setLocalStatus(`${pendingCommandRef.current.action.replaceAll('_', ' ')} is still in progress.`);
      return false;
    }

    const requestId = `memory-list-${Date.now()}-${++commandSequenceRef.current}-${command.action.toLowerCase()}`;
    const sent = send('memoryList.command', {
      ...command,
      requestId,
      ownerEpoch: snapshot.ownerEpoch,
    });
    if (!sent) return false;

    if (demoMode) {
      setLocalStatus('');
      return true;
    }

    pendingCommandRef.current = { requestId, action: command.action };
    setPendingAction(command.action);
    setLocalStatus(command.action === 'APPLY' ? 'Applying...' : `${command.action.replaceAll('_', ' ')}...`);
    commandTimeoutRef.current = setTimeout(() => {
      if (pendingCommandRef.current?.requestId !== requestId) return;
      commandTimeoutRef.current = null;
      setLocalStatus(
        `${command.action.replaceAll('_', ' ')} is still waiting for backend confirmation. `
        + 'Reopen the Memory List before retrying if the connection was lost.',
      );
    }, 15000);
    return true;
  }, [demoMode, send, snapshot.ownerEpoch]);

  useEffect(() => {
    if (!demoMode && connected) send('memoryList.bootstrap');
  }, [connected, demoMode, send]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const { operationId, body } = parseMessage(raw);
        if (operationId === 'memoryList.snapshot') {
          setSnapshot({
            ...EMPTY_SNAPSHOT,
            ...body,
            items: Array.isArray(body?.items) ? body.items : [],
            blocks: Array.isArray(body?.blocks) ? body.blocks : [],
            targetBlockId: Number(body?.targetBlockId) > 0 ? Number(body.targetBlockId) : null,
          });
          if (!pendingCommandRef.current) setLocalStatus('');
        } else if (operationId === 'memoryList.commandResponse') {
          const pending = pendingCommandRef.current;
          if (!pending || String(body?.requestId || '') !== pending.requestId) return;
          clearPendingCommand();
          setLocalStatus(body?.ok === false
            ? String(body?.message || body?.error || 'The Memory List action was refused.')
            : '');
        } else if (operationId === 'memoryList.focus') {
          try {
            window.focus();
          } catch {
            // Native window focus is best-effort and may be refused by the window manager.
          }
        }
      } catch (messageError) {
        console.error('Could not read Memory List message:', messageError);
        setLocalStatus('The Memory List response could not be read.');
      }
    });
  }, [clearPendingCommand, messages]);

  useEffect(() => {
    if (!error) return;
    setLocalStatus(pendingCommandRef.current
      ? `${error} The current action remains locked until backend confirmation or this Memory List is reopened.`
      : error);
  }, [error]);

  useEffect(() => () => {
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    commandTimeoutRef.current = null;
    pendingCommandRef.current = null;
  }, []);

  const handleTargetChange = (value: string) => {
    if (value === '__create__') {
      setCreateBlockOpen(true);
      return;
    }
    const blockId = value === '' ? null : Number(value);
    setSnapshot(current => ({ ...current, targetBlockId: blockId }));
    sendCommand({ action: 'SELECT_BLOCK', blockId });
  };

  const handleCreateBlock = (blockName: string, position: CreateBlockPosition) => {
    if (sendCommand({ action: 'CREATE_BLOCK', blockName, position })) {
      setCreateBlockOpen(false);
    }
  };

  // Native HTML5 drag & drop — no react-beautiful-dnd. rbd depends on
  // requestAnimationFrame, which the browser pauses for hidden/occluded tabs, so
  // its drag silently died there. Plain draggable rows work in any tab state and
  // are trivially observable. dragIndexRef is the row being carried; overIndex is
  // the row it is hovering, used only for the drop-target highlight.
  const dragIndexRef = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Pure reorder core: move the row at `from` to `to`, optimistically update the
  // snapshot, and send REORDER. Every step logs to [MemoryList][drag]. Also exposed
  // as window.__mlReorder(from, to) so the whole pipeline can be triggered/verified
  // without a physical drag (e.g. in an occluded tab or an automated test).
  const reorderByIndex = useCallback((from: number, to: number) => {
    const items = snapshot.items;
    console.log(`[MemoryList][drag] REORDER requested ${from} -> ${to}`, {
      itemCount: items.length,
      busy: snapshot.busy,
      order: items.map(item => item.key),
    });
    if (snapshot.busy || pendingCommandRef.current) {
      console.warn('[MemoryList][drag] blocked: list is busy');
      return false;
    }
    if (
      from < 0 || to < 0
      || from >= items.length || to >= items.length
      || from === to
    ) {
      console.warn('[MemoryList][drag] no-op reorder (same slot or out of range)', { from, to });
      return false;
    }
    const previousOrder = items.map(item => item.key);
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, movedItem);
    setSnapshot(current => ({ ...current, items: nextItems }));
    const orderedItemKeys = nextItems.map(item => item.key);
    console.log(
      `[MemoryList][drag] REORDERED "${movedItem.label}" ${from} -> ${to}; sending REORDER command`,
      { previousOrder, orderedItemKeys },
    );
    sendCommand({ action: 'REORDER', orderedItemKeys });
    return true;
  }, [sendCommand, snapshot.busy, snapshot.items]);

  // Diagnostic hook: window.__mlReorder(from, to) reorders without a physical drag.
  useEffect(() => {
    (window as any).__mlReorder = reorderByIndex;
    return () => {
      if ((window as any).__mlReorder === reorderByIndex) delete (window as any).__mlReorder;
    };
  }, [reorderByIndex]);

  const handleRowDragStart = useCallback((index: number, event: React.DragEvent) => {
    if (snapshot.busy) {
      event.preventDefault();
      return;
    }
    dragIndexRef.current = index;
    setOverIndex(index);
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index)); // Firefox needs a payload
    } catch {
      // Some environments restrict dataTransfer; the ref still carries the index.
    }
    const label = snapshot.items[index]?.label ?? index;
    console.log(`[MemoryList][drag] GRABBED "${label}" at index ${index}`);
  }, [snapshot.busy, snapshot.items]);

  const handleRowDragOver = useCallback((index: number, event: React.DragEvent) => {
    event.preventDefault(); // required to allow a drop
    event.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) {
      setOverIndex(index);
      console.log(`[MemoryList][drag] MOVE over index ${index}`);
    }
  }, [overIndex]);

  const handleRowDrop = useCallback((index: number, event: React.DragEvent) => {
    event.preventDefault();
    const from = dragIndexRef.current;
    console.log(`[MemoryList][drag] DROP on index ${index} (carrying ${from})`);
    if (from !== null) reorderByIndex(from, index);
    dragIndexRef.current = null;
    setOverIndex(null);
  }, [reorderByIndex]);

  const handleRowDragEnd = useCallback(() => {
    if (dragIndexRef.current !== null) {
      console.log('[MemoryList][drag] RELEASED without a valid drop target — no reorder');
    }
    dragIndexRef.current = null;
    setOverIndex(null);
  }, []);

  const sourceLabel = snapshot.sourceKind === 'MIXED'
    ? 'Bot Job instructions + Page Scanner elements + reusable Components'
    : snapshot.sourceKind === 'PAGE_SCANNER'
      ? 'Page Scanner elements'
      : snapshot.sourceKind === 'COMPONENT'
        ? 'Reusable Component instructions'
        : 'Bot Job instructions';
  const statusText = localStatus
    || snapshot.status
    || (connected ? 'Memory List ready' : 'Connecting to Memory List...');
  const statusClass = localStatus || error
    ? styles.statusError
    : snapshot.busy
      ? styles.statusWarn
      : styles.statusOk;
  const targetBlockRequired = memoryListRequiresTargetBlock(snapshot.items);
  const commandPending = pendingAction !== null;
  const uiBusy = snapshot.busy || commandPending;
  const applyDisabled = uiBusy
    || snapshot.canApply === false
    || (targetBlockRequired && snapshot.targetBlockId === null)
    || snapshot.items.length === 0;

  return (
    <DetachedPageShell
      title="Memory List"
      testId="memory-list-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Memory List</h1>
              <p className={styles.subtitle}>
                {snapshot.botJobName
                  ? `${sourceLabel} — ${snapshot.botJobName}`
                  : sourceLabel}
              </p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">
                {statusText}
              </div>
              <PagesOpenButton
                webSocket={webSocket}
                connected={connected}
                messages={messages}
                sessionId={sessionId}
              />
              <button type="button" className={styles.closeButton} onClick={onClose}>
                Close
              </button>
            </div>
          </header>

          <div className={styles.targetRow}>
            <label htmlFor="memory-list-target-block">Block:</label>
            <select
              id="memory-list-target-block"
              value={snapshot.targetBlockId ?? ''}
              onChange={event => handleTargetChange(event.target.value)}
              disabled={uiBusy}
            >
              <option value="">Select target block...</option>
              <option value="__create__">+ Create new block...</option>
              {snapshot.blocks.map(block => (
                <option key={block.blockId} value={block.blockId}>
                  #{block.blockOrderNumber} {block.blockName}
                </option>
              ))}
            </select>
            <span className={styles.count}>{snapshot.items.length}</span>
            <button
              type="button"
              className={styles.clearButton}
              disabled={snapshot.items.length === 0 || uiBusy}
              onClick={() => sendCommand({ action: 'CLEAR' })}
            >
              Clear all
            </button>
          </div>

          <section
            className={styles.list}
            aria-label="Memory List items"
            onDragEnd={handleRowDragEnd}
          >
            {snapshot.items.length === 0 ? (
              <div className={styles.empty}>{snapshot.emptyMessage}</div>
            ) : (
              snapshot.items.map((item, index) => {
                const icon = item.icon ? ITEM_ICONS[item.icon] : undefined;
                return (
                  <article
                    key={item.key}
                    data-memory-item-key={item.key}
                    draggable={!uiBusy}
                    onDragStart={event => handleRowDragStart(index, event)}
                    onDragOver={event => handleRowDragOver(index, event)}
                    onDrop={event => handleRowDrop(index, event)}
                    className={[
                      styles.item,
                      item.active === false ? styles.inactiveItem : '',
                      overIndex === index ? styles.draggingItem : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className={styles.dragHandle}
                      title="Drag to reorder"
                      aria-label={`Reorder ${item.label}`}
                      disabled={uiBusy}
                    >
                      ≡
                    </button>
                    <span className={styles.order}>{index + 1}.</span>
                    {icon && <img src={icon} alt="" className={styles.itemIcon} />}
                    <span className={styles.itemText}>
                      <strong title={item.label}>{item.label}</strong>
                      {item.detail && <small title={item.detail}>{item.detail}</small>}
                    </span>
                    {item.active === false && <span className={styles.inactiveBadge}>Inactive</span>}
                    <button
                      type="button"
                      className={styles.removeButton}
                      title="Remove from memory list"
                      aria-label={`Remove ${item.label} from memory list`}
                      disabled={uiBusy}
                      onClick={() => sendCommand({ action: 'REMOVE', itemKey: item.key })}
                    >
                      X
                    </button>
                  </article>
                );
              })
            )}
          </section>

          <footer className={styles.footer}>
            <span>{snapshot.items.length} item{snapshot.items.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              className={styles.applyButton}
              disabled={applyDisabled}
              onClick={() => sendCommand({
                action: 'APPLY',
                targetBlockId: snapshot.targetBlockId,
              })}
            >
              {pendingAction === 'APPLY' ? 'Applying...' : 'Apply'}
            </button>
          </footer>
        </section>

        {createBlockOpen && (
          <CreateNewBlock
            blocks={snapshot.blocks}
            onCreate={handleCreateBlock}
            onClose={() => setCreateBlockOpen(false)}
            submitting={uiBusy}
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default MemoryList;
