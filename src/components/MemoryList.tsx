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
import ConfirmationDialog from './ConfirmationDialog';
import DetachedPageShell from './DetachedPageShell';
import {
  memoryListRequiresTargetBlock,
  type MemoryListItem,
  type MemoryListItemIcon,
  type MemoryListSnapshot,
} from './memoryList.contract';
import PagesOpenButton from './PagesOpenButton';
import { useMemoryListDrag } from './useMemoryListDrag';
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
  | {
      action: 'CREATE_BLOCK_AND_APPLY';
      blockName: string;
      position: CreateBlockPosition;
    };

type OperationFeedback = {
  id: number;
  title: string;
  message: string;
  detail?: string;
  error: boolean;
};

type PendingMemoryListCommand = {
  requestId: string;
  action: MemoryListCommand['action'];
  blockName?: string;
};

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

function createAndApplyFeedback(
  body: any,
  pending: PendingMemoryListCommand,
): Omit<OperationFeedback, 'id'> {
  const committed = body?.ok !== false && body?.committed === true;
  const synchronized = body?.synchronized !== false;
  const responseMessage = String(
    body?.message
    || body?.error
    || (committed
      ? 'The block was created and the Memory List instructions were applied.'
      : 'The block and instructions could not be applied.'),
  );

  if (!committed) {
    const blockWasCreated = body?.blockCreated === true
      || Number(body?.createdBlockId) > 0;
    return {
      title: 'Create and Apply Failed',
      message: responseMessage,
      detail: blockWasCreated
        ? 'The backend reported that the block was created, but the instructions were not fully applied. Refresh before retrying.'
        : 'The Memory List rows remain available. Review the message and try again.',
      error: true,
    };
  }

  const createdBlockId = Number(body?.createdBlockId);
  const createdBlockName = String(body?.createdBlockName || pending.blockName || '').trim();
  const blockLabel = createdBlockName
    ? `"${createdBlockName}"${createdBlockId > 0 ? ` (ID ${createdBlockId})` : ''}`
    : createdBlockId > 0
      ? `block ID ${createdBlockId}`
      : 'the new block';
  const appliedCount = Number(body?.appliedCount);
  const hasAppliedCount = Number.isFinite(appliedCount) && appliedCount >= 0;
  const appliedLabel = hasAppliedCount
    ? `${appliedCount} Memory List item${appliedCount === 1 ? '' : 's'}`
    : 'The Memory List items';
  const appliedVerb = appliedCount === 1 ? 'was' : 'were';

  return {
    title: synchronized
      ? 'Block Created and Instructions Applied'
      : 'Instructions Applied - Refresh Pending',
    message: responseMessage,
    detail: synchronized
      ? `${appliedLabel} ${appliedVerb} applied to ${blockLabel}.`
      : `${appliedLabel} ${appliedVerb} applied to ${blockLabel}. The database operation succeeded, but Bot Job Details is still waiting for its authoritative refresh.`,
    error: false,
  };
}

const MemoryList: React.FC<MemoryListProps> = ({ socketPort, sessionId, onClose, demoMode = false }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const commandSequenceRef = useRef(0);
  const feedbackSequenceRef = useRef(0);
  const pendingCommandRef = useRef<PendingMemoryListCommand | null>(null);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snapshot, setSnapshot] = useState<MemoryListSnapshot>(demoMode ? DEMO_SNAPSHOT : EMPTY_SNAPSHOT);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState('');
  const [pendingAction, setPendingAction] = useState<MemoryListCommand['action'] | null>(null);
  const [operationFeedback, setOperationFeedback] = useState<OperationFeedback | null>(null);

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

    pendingCommandRef.current = {
      requestId,
      action: command.action,
      blockName: 'blockName' in command ? command.blockName : undefined,
    };
    setPendingAction(command.action);
    setLocalStatus(command.action === 'APPLY'
      ? 'Applying...'
      : command.action === 'CREATE_BLOCK_AND_APPLY'
        ? 'Creating block and applying instructions...'
        : `${command.action.replaceAll('_', ' ')}...`);
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
          if (pending.action === 'CREATE_BLOCK_AND_APPLY') {
            const feedback = createAndApplyFeedback(body, pending);
            feedbackSequenceRef.current += 1;
            setOperationFeedback({
              id: feedbackSequenceRef.current,
              ...feedback,
            });
            const committed = body?.ok !== false && body?.committed === true;
            if (committed) setCreateBlockOpen(false);
            setLocalStatus(committed
              ? ''
              : String(body?.message || body?.error || 'The Memory List action was refused.'));
          } else {
            setLocalStatus(body?.ok === false
              ? String(body?.message || body?.error || 'The Memory List action was refused.')
              : '');
          }
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
    setOperationFeedback(null);
    if (sendCommand({ action: 'CREATE_BLOCK_AND_APPLY', blockName, position }) && demoMode) {
      setCreateBlockOpen(false);
    }
  };

  // The detached Memory List owns its native drag lifecycle. Stable row keys make
  // it safe when an authoritative realtime snapshot arrives during a drag.
  const commitMemoryReorder = useCallback((nextItems: MemoryListItem[]) => {
    const orderedItemKeys = nextItems.map(item => item.key);
    if (!sendCommand({ action: 'REORDER', orderedItemKeys })) return false;
    setSnapshot(current => ({ ...current, items: nextItems }));
    return true;
  }, [sendCommand]);
  const {
    overItemKey,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleRowDragEnd,
  } = useMemoryListDrag({
    items: snapshot.items,
    busy: snapshot.busy || pendingAction !== null,
    onReorder: commitMemoryReorder,
    onRefusal: setLocalStatus,
  });

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
                    onDragStart={event => handleRowDragStart(item.key, event)}
                    onDragOver={event => handleRowDragOver(item.key, event)}
                    onDrop={event => handleRowDrop(item.key, event)}
                    className={[
                      styles.item,
                      item.active === false ? styles.inactiveItem : '',
                      overItemKey === item.key ? styles.draggingItem : '',
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
            pending={pendingAction === 'CREATE_BLOCK_AND_APPLY'}
            submitting={uiBusy}
            submitLabel="Create & Apply"
            submittingLabel="Creating and applying..."
          />
        )}
        {operationFeedback && (
          <ConfirmationDialog
            key={operationFeedback.id}
            alert
            title={operationFeedback.title}
            message={operationFeedback.message}
            detail={operationFeedback.detail}
            error={operationFeedback.error}
            confirmLabel="Close"
            showHeaderClose
            onCancel={() => setOperationFeedback(null)}
            onConfirm={() => setOperationFeedback(null)}
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default MemoryList;
