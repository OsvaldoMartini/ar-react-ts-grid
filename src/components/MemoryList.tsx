import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from 'react-beautiful-dnd';
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
import type {
  MemoryListItemIcon,
  MemoryListSnapshot,
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
  const [snapshot, setSnapshot] = useState<MemoryListSnapshot>(demoMode ? DEMO_SNAPSHOT : EMPTY_SNAPSHOT);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState('');

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

  const sendCommand = useCallback((command: MemoryListCommand) => {
    if (!snapshot.ownerEpoch) {
      setLocalStatus('Memory List data is not ready.');
      return;
    }
    if (send('memoryList.command', { ...command, ownerEpoch: snapshot.ownerEpoch })) {
      setLocalStatus(command.action === 'APPLY' ? 'Applying...' : '');
    }
  }, [send, snapshot.ownerEpoch]);

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
          setLocalStatus('');
        } else if (operationId === 'memoryList.commandResponse') {
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
  }, [messages]);

  useEffect(() => {
    if (error) setLocalStatus(error);
  }, [error]);

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
    sendCommand({ action: 'CREATE_BLOCK', blockName, position });
    setCreateBlockOpen(false);
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    // [MemoryList][drag] runtime monitor — visible in the jar's DevTools console.
    // Tells you exactly where a drag stops: no destination, busy list, index math,
    // the REORDER send, and (in the message handler) the backend ok/fail response.
    console.log('[MemoryList][drag] dragEnd', {
      draggableId: result.draggableId,
      source: result.source?.index,
      destination: result.destination?.index,
      busy: snapshot.busy,
      itemCount: snapshot.items.length,
      ownerEpoch: snapshot.ownerEpoch,
    });
    if (!result.destination || snapshot.busy) {
      console.warn('[MemoryList][drag] aborted before reorder', {
        hasDestination: Boolean(result.destination),
        busy: snapshot.busy,
      });
      return;
    }

    const sourceIndex = snapshot.items.findIndex(item => item.key === result.draggableId);
    const destinationIndex = result.destination.index;
    if (
      sourceIndex < 0
      || destinationIndex < 0
      || destinationIndex >= snapshot.items.length
      || sourceIndex === destinationIndex
    ) {
      console.warn('[MemoryList][drag] no-op reorder', { sourceIndex, destinationIndex });
      return;
    }

    const nextItems = [...snapshot.items];
    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(destinationIndex, 0, movedItem);
    setSnapshot(current => ({ ...current, items: nextItems }));
    const orderedItemKeys = nextItems.map(item => item.key);
    console.log('[MemoryList][drag] sending REORDER', { sourceIndex, destinationIndex, orderedItemKeys });
    sendCommand({ action: 'REORDER', orderedItemKeys });
  }, [sendCommand, snapshot.busy, snapshot.items, snapshot.ownerEpoch]);

  const sourceLabel = snapshot.sourceKind === 'MIXED'
    ? 'Bot Job instructions + Page Scanner elements'
    : snapshot.sourceKind === 'PAGE_SCANNER'
      ? 'Page Scanner elements'
      : 'Bot Job instructions';
  const statusText = localStatus
    || snapshot.status
    || (connected ? 'Memory List ready' : 'Connecting to Memory List...');
  const statusClass = localStatus || error
    ? styles.statusError
    : snapshot.busy
      ? styles.statusWarn
      : styles.statusOk;
  const applyDisabled = snapshot.busy
    || snapshot.canApply === false
    || snapshot.targetBlockId === null
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
              disabled={snapshot.busy}
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
              disabled={snapshot.items.length === 0 || snapshot.busy}
              onClick={() => sendCommand({ action: 'CLEAR' })}
            >
              Clear all
            </button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="memory-list-items">
              {provided => (
                <section
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={styles.list}
                  aria-label="Memory List items"
                >
                  {snapshot.items.length === 0 ? (
                    <div className={styles.empty}>{snapshot.emptyMessage}</div>
                  ) : (
                    snapshot.items.map((item, index) => {
                      const icon = item.icon ? ITEM_ICONS[item.icon] : undefined;
                      return (
                        <Draggable
                          key={item.key}
                          draggableId={item.key}
                          index={index}
                          isDragDisabled={snapshot.busy}
                        >
                          {(dragProvided, dragState) => (
                            <article
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={[
                                styles.item,
                                item.active === false ? styles.inactiveItem : '',
                                dragState.isDragging ? styles.draggingItem : '',
                              ].filter(Boolean).join(' ')}
                            >
                              <button
                                type="button"
                                className={styles.dragHandle}
                                title="Drag to reorder; arrow keys also move while dragging"
                                aria-label={`Reorder ${item.label}`}
                                disabled={snapshot.busy}
                                {...dragProvided.dragHandleProps}
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
                                disabled={snapshot.busy}
                                onClick={() => sendCommand({ action: 'REMOVE', itemKey: item.key })}
                              >
                                X
                              </button>
                            </article>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </section>
              )}
            </Droppable>
          </DragDropContext>

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
              {snapshot.busy ? 'Applying...' : 'Apply'}
            </button>
          </footer>
        </section>

        {createBlockOpen && (
          <CreateNewBlock
            blocks={snapshot.blocks}
            onCreate={handleCreateBlock}
            onClose={() => setCreateBlockOpen(false)}
            submitting={snapshot.busy}
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default MemoryList;
