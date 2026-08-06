import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, RefreshCw } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import SmokeTestConnectionReview from './smoke-test/SmokeTestConnectionReview';
import SmokeTestSimulationWorkspace from './smoke-test/SmokeTestSimulationWorkspace';
import { useWebSocket } from './useWebSocket';
import { buildVariablesExecutionFlowReview } from './variables/domain/variablesExecutionFlowReview';
import type { VariablesSmokeTestPosition } from './variables/domain/variablesSmokeTestTypes';
import type { CommandRemainingByInstructionId } from './variables/Engine/controlFlowCommand.types';
import { useVariablesRuntimeMemory } from './variables/useVariablesRuntimeMemory';
import {
  normalizeVariablesWorkspaceSnapshot,
  parseVariablesWorkspaceMessage,
  type VariableWorkspaceSnapshot,
} from './variablesWorkspace.contract';
import styles from './SmokeTestPage.module.scss';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

type PendingRequest = {
  requestId: string;
  operation: 'variablesWorkspace.bootstrap' | 'variablesWorkspace.refresh';
};

const REQUEST_TIMEOUT_MS = 12_000;

const bodyObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const statusText = (body: Record<string, any> | null, fallback: string): string => {
  const candidate = typeof body?.error === 'string'
    ? body.error
    : typeof body?.message === 'string'
      ? body.message
      : '';
  return candidate.trim() || fallback;
};

const SmokeTestPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => {
    document.title = 'Smoke Test';
  }, []);

  const sourceBotJobId = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('sourceBotJobId');
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, []);
  const {
    webSocket,
    connected,
    reconnectAttempts,
    messages,
  } = useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const requestSequenceRef = useRef(0);
  const pendingRef = useRef<PendingRequest | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<VariableWorkspaceSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<VariableWorkspaceSnapshot | null>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [blockFilters, setBlockFilters] = useState<number[]>([]);
  const [activeSmokePosition, setActiveSmokePosition] =
    useState<VariablesSmokeTestPosition | null>(null);
  const [smokeExecutionTrace, setSmokeExecutionTrace] =
    useState<readonly VariablesSmokeTestPosition[]>([]);
  const [commandRemainingByInstructionId, setCommandRemainingByInstructionId] =
    useState<CommandRemainingByInstructionId>({});
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for Smoke Test workspace',
  });

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    pendingRef.current = null;
    setPending(null);
  }, []);

  const replaceSnapshot = useCallback((next: VariableWorkspaceSnapshot) => {
    const previous = snapshotRef.current;
    snapshotRef.current = next;
    setSnapshot(next);
    setBlockFilters(current => previous === null
      ? next.blocks.map(block => block.id)
      : current.filter(blockId => next.blocks.some(block => block.id === blockId)));
  }, []);

  const replaceRuntimeMemory = useCallback((
    runtimeMemory: VariableWorkspaceSnapshot['runtimeMemory'],
  ) => {
    const current = snapshotRef.current;
    if (!current || runtimeMemory.revision < current.runtimeMemory.revision) return;
    replaceSnapshot({ ...current, runtimeMemory });
  }, [replaceSnapshot]);

  const {
    updateValue: updateRuntimeValue,
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

  const sendSnapshotRequest = useCallback((
    operation: PendingRequest['operation'],
  ): boolean => {
    if (
      sourceBotJobId === null
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingRef.current !== null
    ) {
      return false;
    }
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-smoke-test-${requestSequenceRef.current}`;
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
    timeoutRef.current = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      clearPending();
      setStatus({
        level: 'error',
        text: 'The Smoke Test snapshot request timed out.',
      });
    }, REQUEST_TIMEOUT_MS);
    setStatus({
      level: 'warn',
      text: operation.endsWith('refresh')
        ? 'Refreshing Smoke Test data...'
        : 'Loading Smoke Test data...',
    });
    return true;
  }, [clearPending, sessionId, sourceBotJobId, webSocket]);

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
    if (processedMessagesRef.current > messages.length) {
      processedMessagesRef.current = 0;
    }
    const unread = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;
    unread.forEach((raw) => {
      if (handleRuntimeMemoryMessage(raw)) return;
      let envelope;
      try {
        envelope = parseVariablesWorkspaceMessage(String(raw));
      } catch (_) {
        return;
      }
      if (
        envelope.operationId !== 'variablesWorkspace.bootstrapResponse'
        && envelope.operationId !== 'variablesWorkspace.refreshResponse'
        && envelope.operationId !== 'variablesWorkspace.snapshot'
      ) {
        return;
      }
      const body = bodyObject(envelope.body);
      if (envelope.operationId.endsWith('Response')) {
        const current = pendingRef.current;
        if (!current || body?.requestId !== current.requestId) return;
        clearPending();
      }
      if (body?.ok === false) {
        setStatus({
          level: 'error',
          text: statusText(body, 'Smoke Test data could not be loaded.'),
        });
        return;
      }
      const normalized = normalizeVariablesWorkspaceSnapshot(envelope.body);
      if (!normalized || normalized.botJob.id !== sourceBotJobId) {
        setStatus({
          level: 'error',
          text: 'The Smoke Test snapshot did not match the requested Bot Job.',
        });
        return;
      }
      replaceSnapshot(normalized);
      setStatus({
        level: 'ok',
        text: statusText(body, 'Smoke Test workspace ready.'),
      });
    });
  }, [
    clearPending,
    handleRuntimeMemoryMessage,
    messages,
    replaceSnapshot,
    sourceBotJobId,
  ]);

  const review = useMemo(
    () => snapshot ? buildVariablesExecutionFlowReview(snapshot) : null,
    [snapshot],
  );
  const openRuntimeVariables = useCallback(() => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !snapshotRef.current) {
      setStatus({
        level: 'error',
        text: 'Runtime Variables could not be opened because Smoke Test is disconnected.',
      });
      return;
    }
    webSocket.send(JSON.stringify({
      type: 'runtimeVariablesWorkspace.open',
      sessionId,
      body: JSON.stringify({
        requestId: `${Date.now()}-smoke-runtime-open`,
        bindingEpoch: snapshotRef.current.bindingEpoch,
        workspaceEpoch: snapshotRef.current.workspaceEpoch,
      }),
    }));
  }, [sessionId, webSocket]);
  useEffect(() => {
    setActiveSmokePosition(null);
    setSmokeExecutionTrace([]);
    setCommandRemainingByInstructionId({});
  }, [snapshot?.botJob.id, snapshot?.graphRevision]);
  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'ok'
      ? styles.statusOk
      : styles.statusWarn;
  const subtitle = snapshot
    ? `#${snapshot.botJob.id} ${snapshot.botJob.name}`
    : sourceBotJobId === null
      ? 'No Bot Job was selected'
      : `Bot Job #${sourceBotJobId}`;

  return (
    <DetachedPageShell
      title="Smoke Test"
      testId="smoke-test-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <div className={styles.titleLine}>
                <AppWindow size={18} aria-hidden="true" />
                <h1 className={styles.title}>Smoke Test</h1>
                <span className={styles.scopePill}>Bot Job scope</span>
              </div>
              <p className={styles.subtitle} title={subtitle}>{subtitle}</p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">
                {connected
                  ? status.text
                  : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`}
              </div>
              <PagesOpenButton
                webSocket={webSocket}
                connected={connected}
                messages={messages}
                sessionId={sessionId}
              />
              <button
                type="button"
                className={styles.closeButton}
                title="Close only this Smoke Test window"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </header>

          <section className={styles.toolbar} data-floating-drag-ignore="true">
            <div className={styles.summaryStrip} aria-label="Smoke Test summary">
              <span><b>{snapshot?.blocks.length ?? 0}</b> Blocks</span>
              <span><b>{snapshot?.commands.length ?? 0}</b> Commands</span>
              <span><b>{snapshot?.edges.length ?? 0}</b> Connections</span>
              <span><b>{snapshot?.diagnostics.length ?? 0}</b> Diagnostics</span>
            </div>
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.refreshButton}
                disabled={!connected || pending !== null || sourceBotJobId === null}
                onClick={() => sendSnapshotRequest('variablesWorkspace.refresh')}
              >
                <RefreshCw className={pending ? styles.loadingIcon : ''} size={15} />
                {pending ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </section>

          {!review ? (
            <section className={styles.centerState}>
              {status.level === 'error' ? (
                <>
                  <strong>Smoke Test data could not be loaded</strong>
                  <span>{status.text}</span>
                  <button
                    type="button"
                    onClick={() => sendSnapshotRequest('variablesWorkspace.bootstrap')}
                    disabled={!connected || pending !== null || sourceBotJobId === null}
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <RefreshCw className={styles.loadingIcon} size={28} />
                  <strong>Loading Smoke Test workspace...</strong>
                  <span>Reading the Bot Job execution and relationship snapshot.</span>
                </>
              )}
            </section>
          ) : (
            <section className={styles.workspace}>
              <SmokeTestConnectionReview
                review={review}
                scopeLabel="Complete Bot Job"
                blockFilters={blockFilters}
                onBlockFiltersChange={setBlockFilters}
                activeSmokePosition={activeSmokePosition}
                smokeExecutionTrace={smokeExecutionTrace}
                commandRemainingByInstructionId={commandRemainingByInstructionId}
                embedded
                onClose={() => undefined}
              />
              <SmokeTestSimulationWorkspace
                review={review}
                selectedBlockIds={blockFilters}
                runtimeWriteAvailable={connected}
                onCommitRuntimeValue={updateRuntimeValue}
                onActivePositionChange={setActiveSmokePosition}
                onExecutionTraceChange={setSmokeExecutionTrace}
                onCommandRemainingChange={setCommandRemainingByInstructionId}
                onRunStart={openRuntimeVariables}
              />
            </section>
          )}
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default SmokeTestPage;
