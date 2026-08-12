import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AlertModal from './AlertModal';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import warningRedImage from '../assets/warning_red.png';
import AddVariableModal, { type AddVariableBatchDraft } from './variables/AddVariableModal';
import RuntimeMemoryPanel from './variables/RuntimeMemoryPanel';
import { orderRuntimeVariablesByExecution } from './variables/domain/variableExecutionOrder';
import { runtimeMemoryPanelItems } from './variables/runtimeMemoryPanelModel';
import { useVariablesRuntimeMemory } from './variables/useVariablesRuntimeMemory';
import { useVariablesCreate, type VariablesCreateResult } from './variables/useVariablesCreate';
import { useVariablesDelete, type VariablesDeleteResult } from './variables/useVariablesDelete';
import { useVariablesAutoResolve, type VariablesAutoResolveResult } from './variables/useVariablesAutoResolve';
import { useWebSocket } from './useWebSocket';
import {
  normalizeVariablesWorkspaceSnapshot,
  parseVariablesWorkspaceMessage,
  type VariableWorkspaceSnapshot,
} from './variablesWorkspace.contract';
import styles from './RuntimeVariablesPage.module.scss';

export const RUNTIME_VARIABLES_SESSION_ID = 'runtimeVariablesManager';

interface RuntimeVariablesPageProps {
  socketPort: number;
  sessionId: string;
  sourceBotJobId?: number;
  onClose?: () => void;
}

type Status = { level: 'ok' | 'warn' | 'error'; text: string };
type SnapshotOperation = 'variablesWorkspace.bootstrap' | 'variablesWorkspace.refresh';
type PendingRequest = { requestId: string; operation: SnapshotOperation };
type DeleteConfirmation = {
  mode: 'SINGLE' | 'ALL';
  variableIds: number[];
  title: string;
  body: string;
};

const REQUEST_SLOW_NOTICE_MS = 12_000;
const REQUEST_TIMEOUT_MS = 90_000;

const bodyObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const responseText = (body: Record<string, any> | null, fallback: string): string => {
  const value = typeof body?.error === 'string'
    ? body.error
    : typeof body?.message === 'string'
      ? body.message
      : '';
  return value.trim() || fallback;
};

const RuntimeVariablesPage: React.FC<RuntimeVariablesPageProps> = ({
  socketPort,
  sessionId,
  sourceBotJobId: sourceBotJobIdProp,
  onClose,
}) => {
  useEffect(() => { document.title = 'RuntTime Variables'; }, []);

  const initialSourceBotJobId = useMemo(() => {
    if (Number.isInteger(sourceBotJobIdProp) && Number(sourceBotJobIdProp) > 0) {
      return Number(sourceBotJobIdProp);
    }
    const parsed = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [sourceBotJobIdProp]);
  const [sourceBotJobId, setSourceBotJobId] = useState<number | null>(
    initialSourceBotJobId,
  );
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const requestSequenceRef = useRef(0);
  const pendingRef = useRef<PendingRequest | null>(null);
  const slowNoticeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<VariableWorkspaceSnapshot | null>(null);
  const createSubmitRef = useRef<(draft: { name: string }) => string | null>(() => null);
  const createQueueRef = useRef<string[]>([]);
  const [snapshot, setSnapshot] = useState<VariableWorkspaceSnapshot | null>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [addVariableOpen, setAddVariableOpen] = useState(false);
  const [addVariableSuccessVersion, setAddVariableSuccessVersion] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [deletingVariableIds, setDeletingVariableIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for Runtime Variables workspace',
  });

  const clearPending = useCallback(() => {
    if (slowNoticeRef.current !== null) clearTimeout(slowNoticeRef.current);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    slowNoticeRef.current = null;
    timeoutRef.current = null;
    pendingRef.current = null;
    setPending(null);
  }, []);

  const replaceSnapshot = useCallback((next: VariableWorkspaceSnapshot) => {
    const botJobChanged = snapshotRef.current !== null
      && snapshotRef.current.botJob.id !== next.botJob.id;
    snapshotRef.current = next;
    setSnapshot(next);
    if (botJobChanged) {
      clearPending();
      createQueueRef.current = [];
      setClearConfirmation(false);
      setAddVariableOpen(false);
      setDeleteConfirmation(null);
      setDeletingVariableIds(new Set());
    }
  }, [clearPending]);

  const replaceRuntimeMemory = useCallback((
    runtimeMemory: VariableWorkspaceSnapshot['runtimeMemory'],
  ) => {
    const current = snapshotRef.current;
    if (!current || runtimeMemory.revision < current.runtimeMemory.revision) return;
    replaceSnapshot({ ...current, runtimeMemory });
  }, [replaceSnapshot]);

  const {
    pendingVariableIds,
    pendingClearAll,
    updateValue,
    clearAllValues,
    handleMessage: handleRuntimeMemoryMessage,
    resetPending: resetRuntimeMemory,
  } = useVariablesRuntimeMemory({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onMemory: replaceRuntimeMemory,
    onStatus: setStatus,
  });

  useEffect(() => {
    resetRuntimeMemory();
  }, [resetRuntimeMemory, sourceBotJobId]);

  const sendSnapshotRequest = useCallback((operation: SnapshotOperation): boolean => {
    if (sourceBotJobId === null || !webSocket
      || webSocket.readyState !== WebSocket.OPEN || pendingRef.current) return false;
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-runtime-variables-${requestSequenceRef.current}`;
    const next = { requestId, operation };
    pendingRef.current = next;
    setPending(next);
    webSocket.send(JSON.stringify({
      type: operation,
      sessionId,
      body: JSON.stringify({
        requestId,
        botJobId: sourceBotJobId,
        bindingEpoch: operation.endsWith('refresh')
          ? snapshotRef.current?.bindingEpoch ?? ''
          : '',
      }),
    }));
    slowNoticeRef.current = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      setStatus({
        level: 'warn',
        text: operation.endsWith('refresh')
          ? 'Runtime Variables is still refreshing...'
          : 'Runtime Variables is still loading while Integration prepares the Playwright page...',
      });
    }, REQUEST_SLOW_NOTICE_MS);
    timeoutRef.current = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      setStatus({ level: 'error', text: 'The Runtime Variables request timed out.' });
    }, REQUEST_TIMEOUT_MS);
    setStatus({
      level: 'warn',
      text: operation.endsWith('refresh')
        ? 'Refreshing runtime variables...'
        : 'Loading runtime variables...',
    });
    return true;
  }, [clearPending, sessionId, sourceBotJobId, webSocket]);

  const refreshAfterDefinitionChange = useCallback(() => {
    sendSnapshotRequest('variablesWorkspace.refresh');
  }, [sendSnapshotRequest]);

  const handleCreateResult = useCallback((result: VariablesCreateResult) => {
    if (!result.ok) {
      createQueueRef.current = [];
      setStatus({ level: 'error', text: result.error || 'Variable was not created.' });
      return;
    }
    const remaining = createQueueRef.current.slice(1);
    createQueueRef.current = remaining;
    setAddVariableSuccessVersion(version => version + 1);
    if (remaining.length > 0) {
      createSubmitRef.current({ name: remaining[0] });
      return;
    }
    setStatus({ level: 'ok', text: result.message || 'Variable created.' });
    refreshAfterDefinitionChange();
  }, [refreshAfterDefinitionChange]);
  const {
    pendingRequestId: pendingCreateRequestId,
    submit: submitVariableCreate,
    handleMessage: handleCreateMessage,
  } = useVariablesCreate({
    webSocket, connected, sessionId, snapshot, onResult: handleCreateResult,
  });
  createSubmitRef.current = submitVariableCreate;

  const handleDeleteResult = useCallback((result: VariablesDeleteResult) => {
    setDeletingVariableIds(new Set());
    if (!result.ok) {
      setStatus({ level: 'error', text: result.error || 'Variables were not deleted.' });
      return;
    }
    setStatus({ level: 'ok', text: result.message || 'Variables deleted.' });
    refreshAfterDefinitionChange();
  }, [refreshAfterDefinitionChange]);
  const {
    pendingRequestId: pendingDeleteRequestId,
    submit: submitVariableDelete,
    handleMessage: handleDeleteMessage,
  } = useVariablesDelete({
    webSocket, connected, sessionId, snapshot, onResult: handleDeleteResult,
  });

  const handleAutoResolveResult = useCallback((result: VariablesAutoResolveResult) => {
    if (!result.ok) {
      setStatus({ level: 'error', text: result.error || 'Variables were not auto-resolved.' });
      return;
    }
    setStatus({ level: 'ok', text: result.message || 'Variables auto-resolved.' });
    refreshAfterDefinitionChange();
  }, [refreshAfterDefinitionChange]);
  const {
    pendingRequestId: pendingAutoRequestId,
    submit: submitAutoResolve,
    handleMessage: handleAutoResolveMessage,
  } = useVariablesAutoResolve({
    webSocket, connected, sessionId, snapshot, onResult: handleAutoResolveResult,
  });

  useEffect(() => {
    if (!connected) {
      clearPending();
      resetRuntimeMemory();
      return;
    }
    sendSnapshotRequest('variablesWorkspace.bootstrap');
  }, [clearPending, connected, resetRuntimeMemory, sendSnapshotRequest]);

  useEffect(() => () => clearPending(), [clearPending]);

  useEffect(() => {
    if (processedMessagesRef.current > messages.length) processedMessagesRef.current = 0;
    const unread = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;
    unread.forEach(raw => {
      if (handleRuntimeMemoryMessage(raw)) return;
      if (handleCreateMessage(raw)) return;
      if (handleDeleteMessage(raw)) return;
      if (handleAutoResolveMessage(raw)) return;
      let envelope;
      try {
        envelope = parseVariablesWorkspaceMessage(String(raw));
      } catch (_) {
        return;
      }
      if (![
        'variablesWorkspace.bootstrapResponse',
        'variablesWorkspace.refreshResponse',
        'variablesWorkspace.snapshot',
      ].includes(envelope.operationId ?? '')) return;
      const body = bodyObject(envelope.body);
      if (envelope.operationId?.endsWith('Response')) {
        const current = pendingRef.current;
        if (!current || body?.requestId !== current.requestId) return;
        clearPending();
      }
      if (body?.ok === false) {
        setStatus({
          level: 'error',
          text: responseText(body, 'Runtime Variables could not be loaded.'),
        });
        return;
      }
      const normalized = normalizeVariablesWorkspaceSnapshot(envelope.body);
      if (!normalized || (envelope.operationId?.endsWith('Response')
        && normalized.botJob.id !== sourceBotJobId)) {
        setStatus({ level: 'error', text: 'Runtime Variables returned the wrong Bot Job.' });
        return;
      }
      setSourceBotJobId(normalized.botJob.id);
      replaceSnapshot(normalized);
      setStatus({ level: 'ok', text: responseText(body, 'Runtime Variables ready.') });
    });
  }, [
    clearPending,
    handleAutoResolveMessage,
    handleCreateMessage,
    handleDeleteMessage,
    handleRuntimeMemoryMessage,
    messages,
    replaceSnapshot,
    sourceBotJobId,
  ]);

  const orderedRuntimeMemory = useMemo(
    () => snapshot
      ? orderRuntimeVariablesByExecution(snapshot.runtimeMemory.variables, snapshot.variables)
      : [],
    [snapshot],
  );
  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'ok'
      ? styles.statusOk
      : styles.statusWarn;
  const subtitle = snapshot
    ? `#${snapshot.botJob.id} ${snapshot.botJob.name}`
    : sourceBotJobId ? `Bot Job #${sourceBotJobId}` : 'No Bot Job selected';

  const confirmClear = () => {
    if (clearAllValues()) setClearConfirmation(false);
  };

  const submitNewVariables = (draft: AddVariableBatchDraft) => {
    const names = draft.variables.map(variable => variable.name.trim()).filter(Boolean);
    if (names.length === 0 || pendingCreateRequestId !== null) return;
    createQueueRef.current = names;
    if (!submitVariableCreate({ name: names[0] })) {
      createQueueRef.current = [];
      setStatus({ level: 'error', text: 'Variable creation could not be started.' });
    }
  };

  const requestDelete = (variableId: number) => {
    const variable = snapshot?.variables.find(candidate => candidate.id === variableId);
    if (!variable) return;
    setDeleteConfirmation({
      mode: 'SINGLE',
      variableIds: [variableId],
      title: 'Delete Variable?',
      body: `Delete variable #${variableId} “${variable.name}”? Its instruction bindings will be cleared.`,
    });
  };

  const requestDeleteAll = () => {
    const variableIds = snapshot?.variables.map(variable => variable.id) ?? [];
    if (variableIds.length === 0) {
      setStatus({ level: 'warn', text: 'No variables are available to delete.' });
      return;
    }
    setDeleteConfirmation({
      mode: 'ALL',
      variableIds,
      title: 'Delete All Variables?',
      body: `Delete all ${variableIds.length} variables and disconnect their instruction slots?`,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation || pendingDeleteRequestId !== null) return;
    const requestId = submitVariableDelete(
      deleteConfirmation.mode,
      deleteConfirmation.variableIds,
    );
    if (!requestId) {
      setStatus({ level: 'error', text: 'Variable deletion could not be started.' });
      return;
    }
    setDeletingVariableIds(new Set(deleteConfirmation.variableIds));
    setDeleteConfirmation(null);
  };

  const startAutoResolve = () => {
    if (!snapshot || pendingAutoRequestId !== null) return;
    const instructionIds = snapshot.commands
      .map(command => command.id)
      .filter((id): id is number => id !== null && Number.isInteger(id) && id > 0);
    const requestId = submitAutoResolve(
      instructionIds,
      snapshot.preferences?.variableResolutionMode ?? 'DISTINCT',
      'RESOLVE',
    );
    if (!requestId) {
      setStatus({ level: 'error', text: 'Variable auto-resolution could not be started.' });
    } else {
      setStatus({ level: 'warn', text: 'Creating and connecting missing variables...' });
    }
  };

  return (
    <DetachedPageShell title="Runtime Variables" testId="runtime-variables-page"
      onClose={undefined} showCloseButton={false}>
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Runtime Variables</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">{status.text}</div>
              <button type="button" className={styles.refreshButton}
                disabled={!connected || pending !== null}
                onClick={() => sendSnapshotRequest('variablesWorkspace.refresh')}>
                <RefreshCw size={14} aria-hidden="true" /> Refresh
              </button>
              <PagesOpenButton webSocket={webSocket} connected={connected}
                messages={messages} sessionId={sessionId} />
              <button type="button" className={styles.closeButton} onClick={onClose}>Close</button>
            </div>
          </header>

          <section className={styles.content} aria-label="Runtime variable memory">
            {snapshot ? (
              <RuntimeMemoryPanel
                key={`runtime-variables:${snapshot.botJob.homeBankingId}:${snapshot.botJob.id}`}
                items={runtimeMemoryPanelItems(orderedRuntimeMemory)}
                disabled={!connected}
                disabledReason={!connected
                  ? 'Runtime Variables is reconnecting. Values remain visible.'
                  : undefined}
                pendingVariableIds={pendingVariableIds}
                onCommitValue={updateValue}
                onRequestClearAll={() => setClearConfirmation(true)}
                clearingValues={pendingClearAll}
                onRequestAdd={() => setAddVariableOpen(true)}
                onRequestAuto={startAutoResolve}
                onRequestDelete={requestDelete}
                onRequestDeleteAll={requestDeleteAll}
                deletingVariableIds={deletingVariableIds}
                deleteDisabled={false}
              />
            ) : (
              <div className={styles.emptyState}>
                <RefreshCw className={pending ? styles.loadingIcon : undefined}
                  size={24} aria-hidden="true" />
                <strong>{sourceBotJobId ? 'Loading runtime variables...' : 'No Bot Job selected'}</strong>
                <span>{status.text}</span>
              </div>
            )}
          </section>
        </section>
        {snapshot && clearConfirmation && (
          <AlertModal
            header="Clear All Variable Values?"
            body={`Reset all ${snapshot.runtimeMemory.variables.length} runtime value(s) to VOID?`}
            extraMsg={'Variable definitions and instruction relationships are preserved. Empty VALUE("") is different from VOID.'}
            onClose={() => setClearConfirmation(false)}
            onConfirm={confirmClear}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error
          />
        )}
        {snapshot && addVariableOpen && (
          <AddVariableModal
            existingNames={snapshot.variables.map(variable => variable.name)}
            pending={pendingCreateRequestId !== null}
            successVersion={addVariableSuccessVersion}
            onSubmit={submitNewVariables}
            onCancel={() => {
              if (pendingCreateRequestId === null) setAddVariableOpen(false);
            }}
          />
        )}
        {deleteConfirmation && (
          <AlertModal
            header={deleteConfirmation.title}
            body={deleteConfirmation.body}
            extraMsg="Variables may be recreated and reconnected later. Commands and Web Elements remain available."
            onClose={() => {
              if (pendingDeleteRequestId === null) setDeleteConfirmation(null);
            }}
            onConfirm={confirmDelete}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default RuntimeVariablesPage;
