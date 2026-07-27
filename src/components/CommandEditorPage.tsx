import React, { useCallback, useEffect, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import InstructionCommandPanel, {
  commandEditorSnapshotFromPayload,
  type CommandDraft,
  type CommandEditorSnapshot,
  type CommandPanelInstruction,
} from './InstructionCommandPanel';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './CommandEditorPage.module.scss';

export const COMMAND_EDITOR_SESSION_ID = 'commandEditorManager';

type CommandEditorTarget = {
  bindingEpoch: string;
  targetSessionId: 'botJobTasks' | 'componentTasks';
  workspaceEpoch: number;
  selectionRevision: number;
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  instruction: CommandPanelInstruction;
};

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

type WorkspaceState = 'loading' | 'ready' | 'empty' | 'error';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const parseEnvelope = (raw: string): { operationId: string; body: any } => {
  const envelope = JSON.parse(raw);
  const body = typeof envelope?.body === 'string'
    ? JSON.parse(envelope.body)
    : envelope?.body ?? envelope;
  return {
    operationId: String(envelope?.operationId || envelope?.type || ''),
    body,
  };
};

const parseTarget = (body: any): CommandEditorTarget | null => {
  const candidate = body?.target && typeof body.target === 'object'
    ? body.target
    : body;
  const instruction = candidate?.instruction;
  const bindingEpoch = String(candidate?.bindingEpoch || '').trim();
  const targetSessionId = String(candidate?.targetSessionId || '').trim();
  const supportedTarget =
    targetSessionId === 'botJobTasks' || targetSessionId === 'componentTasks';
  const homeBankingId = Number(candidate?.homeBankingId);
  const botJobId = Number(candidate?.botJobId);
  const workspaceEpoch = Number(candidate?.workspaceEpoch);

  if (
    candidate?.ok === false
    || !bindingEpoch
    || !supportedTarget
    || !Number.isSafeInteger(homeBankingId)
    || homeBankingId <= 0
    || !Number.isSafeInteger(botJobId)
    || botJobId <= 0
    || !Number.isSafeInteger(workspaceEpoch)
    || workspaceEpoch <= 0
    || !instruction
    || !Number.isSafeInteger(Number(instruction.id))
    || Number(instruction.id) <= 0
    || !Number.isSafeInteger(Number(instruction.blockId))
    || Number(instruction.blockId) <= 0
  ) {
    return null;
  }

  return {
    bindingEpoch,
    targetSessionId: targetSessionId as CommandEditorTarget['targetSessionId'],
    homeBankingId,
    botJobId,
    workspaceEpoch,
    selectionRevision: Number(candidate?.selectionRevision) || 0,
    botJobName: String(candidate?.botJobName || ''),
    instruction: {
      id: Number(instruction.id),
      name: String(instruction.name || ''),
      actions: String(instruction.actions || ''),
      operation: instruction.operation == null ? null : String(instruction.operation),
      blockId: Number(instruction.blockId),
      blockName: String(instruction.blockName || ''),
      blockOrderNumber: Number(instruction.blockOrderNumber) || 1,
      instructionOrderNumber: Number(instruction.instructionOrderNumber) || 1,
      variableId: instruction.variableId == null ? null : Number(instruction.variableId),
      parentId: instruction.parentId == null ? null : Number(instruction.parentId),
      parentBlockId: instruction.parentBlockId == null ? null : Number(instruction.parentBlockId),
      onHoldSeconds: instruction.onHoldSeconds == null ? null : Number(instruction.onHoldSeconds),
    },
  };
};

const CommandEditorPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  const { webSocket, connected, reconnectAttempts, messages, error } =
    useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const pendingBootstrapRequestRef = useRef<string | null>(null);
  const pendingSelectRequestRef = useRef<string | null>(null);
  const pendingApplyRequestRef = useRef<string | null>(null);
  const pendingElseIfRequestRef = useRef<string | null>(null);
  const targetRef = useRef<CommandEditorTarget | null>(null);
  const [target, setTarget] = useState<CommandEditorTarget | null>(null);
  const [snapshot, setSnapshot] = useState<CommandEditorSnapshot | null>(null);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('loading');
  const [selectionPending, setSelectionPending] = useState(false);
  const [panelMessages, setPanelMessages] = useState<string[]>([]);
  const [panelEpoch, setPanelEpoch] = useState(0);
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for an instruction',
  });

  const send = useCallback((
    type: string,
    body: Record<string, unknown> = {},
    homeBankingId?: number,
  ) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus({ level: 'error', text: 'Command Editor is not connected.' });
      return false;
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      homeBankingId: homeBankingId ?? targetRef.current?.homeBankingId ?? -1,
      body: JSON.stringify(body),
    }));
    return true;
  }, [sessionId, webSocket]);

  const requestWorkspaceBootstrap = useCallback((current?: CommandEditorTarget | null) => {
    const requestId = `${Date.now()}-command-editor-bootstrap`;
    pendingBootstrapRequestRef.current = requestId;
    setWorkspaceState('loading');
    const sent = send('commandEditor.workspaceBootstrap', {
      requestId,
      ...(current?.bindingEpoch ? { bindingEpoch: current.bindingEpoch } : {}),
      ...(current?.selectionRevision
        ? { selectionRevision: current.selectionRevision }
        : {}),
    }, current?.homeBankingId);
    if (!sent) {
      pendingBootstrapRequestRef.current = null;
      setWorkspaceState('error');
    }
  }, [send]);

  useEffect(() => {
    if (!connected) return;
    // A reconnected manager transport receives a new backend binding epoch. Bootstrap without the
    // previous epoch so the server can return the new authoritative binding and full snapshot.
    requestWorkspaceBootstrap();
  }, [connected, requestWorkspaceBootstrap]);

  const resetPanel = useCallback(() => {
    setPanelMessages([]);
    setPanelEpoch(current => current + 1);
  }, []);

  const acceptWorkspaceSnapshot = useCallback((
    body: any,
    nextTarget: CommandEditorTarget,
  ) => {
    const nextSnapshot = commandEditorSnapshotFromPayload(body);
    if (
      !nextSnapshot
      || nextSnapshot.selectedInstructionId !== nextTarget.instruction.id
      || nextSnapshot.selectedBlockId !== nextTarget.instruction.blockId
      || (
        nextSnapshot.selectionRevision != null
        && nextSnapshot.selectionRevision !== nextTarget.selectionRevision
      )
    ) {
      return false;
    }

    // Set the ref before mounting the target-dependent panel. Socket commands fired by child
    // effects in this render must observe the same binding as the rendered snapshot.
    targetRef.current = nextTarget;
    setTarget(nextTarget);
    setSnapshot(nextSnapshot);
    setPanelMessages([]);
    setPanelEpoch(current => current + 1);
    setSelectionPending(false);
    setWorkspaceState(
      nextSnapshot.blocks.length === 0
      || nextSnapshot.instructions.length === 0
      || nextSnapshot.commands.length === 0
        ? 'empty'
        : 'ready',
    );
    setStatus({
      level: 'ok',
      text: String(body?.message || 'Command Editor loaded'),
    });
    return true;
  }, []);

  useEffect(() => {
    if (processedMessagesRef.current > messages.length) {
      processedMessagesRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const { operationId, body } = parseEnvelope(raw);
        if ([
          'commandEditor.workspaceBootstrapResponse',
          'commandEditor.workspaceTarget',
          'commandEditor.selectResponse',
          'commandEditor.snapshot',
        ].includes(operationId)) {
          const responseRequestId = String(body?.requestId || '');
          if (
            operationId === 'commandEditor.workspaceBootstrapResponse'
            && (
              !pendingBootstrapRequestRef.current
              || responseRequestId !== pendingBootstrapRequestRef.current
            )
          ) {
            return;
          }
          if (
            operationId === 'commandEditor.selectResponse'
            && (
              !pendingSelectRequestRef.current
              || responseRequestId !== pendingSelectRequestRef.current
            )
          ) {
            return;
          }
          if (body?.ok === false) {
            if (operationId === 'commandEditor.selectResponse') {
              pendingSelectRequestRef.current = null;
              setSelectionPending(false);
            } else {
              if (operationId === 'commandEditor.workspaceBootstrapResponse') {
                pendingBootstrapRequestRef.current = null;
              }
              setWorkspaceState('error');
            }
            setStatus({
              level: 'error',
              text: String(body?.error || body?.message || 'The Command Editor target is unavailable.'),
            });
            return;
          }

          const nextTarget = parseTarget(body);
          if (!nextTarget) {
            pendingBootstrapRequestRef.current = null;
            pendingSelectRequestRef.current = null;
            pendingApplyRequestRef.current = null;
            pendingElseIfRequestRef.current = null;
            targetRef.current = null;
            setTarget(null);
            setSnapshot(null);
            setPanelMessages([]);
            setSelectionPending(false);
            setWorkspaceState('error');
            setStatus({
              level: 'error',
              text: String(body?.error || body?.message || 'The Command Editor target is unavailable.'),
            });
            return;
          }

          const currentTarget = targetRef.current;
          if (
            operationId === 'commandEditor.snapshot'
            && currentTarget
            && nextTarget.bindingEpoch !== currentTarget.bindingEpoch
          ) {
            return;
          }
          if (!acceptWorkspaceSnapshot(body, nextTarget)) {
            // Older workspaceTarget payloads carried only the target. Preserve compatibility while
            // keeping the full snapshot response as the one atomic hydration boundary.
            if (operationId === 'commandEditor.workspaceTarget') {
              targetRef.current = nextTarget;
              setTarget(nextTarget);
              setSnapshot(null);
              setWorkspaceState('loading');
              requestWorkspaceBootstrap(nextTarget);
              return;
            }
            pendingBootstrapRequestRef.current = null;
            pendingSelectRequestRef.current = null;
            setSelectionPending(false);
            setWorkspaceState('error');
            setStatus({
              level: 'error',
              text: 'The Command Editor response did not contain a complete workspace snapshot.',
            });
            return;
          }
          if (operationId === 'commandEditor.workspaceBootstrapResponse') {
            pendingBootstrapRequestRef.current = null;
          }
          if (operationId === 'commandEditor.selectResponse') {
            pendingSelectRequestRef.current = null;
          }
          if (operationId === 'commandEditor.workspaceTarget') {
            pendingBootstrapRequestRef.current = null;
            pendingSelectRequestRef.current = null;
          }
          pendingApplyRequestRef.current = null;
          pendingElseIfRequestRef.current = null;
          return;
        }

        if (
          operationId === 'commandEditor.errorResponse'
          || operationId === 'license.requiredResponse'
        ) {
          const bootstrapWasPending = pendingBootstrapRequestRef.current != null;
          pendingBootstrapRequestRef.current = null;
          pendingSelectRequestRef.current = null;
          setStatus({
            level: 'error',
            text: String(
              body?.error
              || body?.message
              || body?.status
              || 'The Command Editor operation was refused.',
            ),
          });
          setSelectionPending(false);
          if (bootstrapWasPending || !snapshot) setWorkspaceState('error');
          return;
        }

        if (operationId === 'commandEditor.applyResponse') {
          const currentTarget = targetRef.current;
          const pendingRequestId = pendingApplyRequestRef.current;
          const responseRequestId = String(body?.requestId || '');
          if (
            !currentTarget
            || !pendingRequestId
            || !responseRequestId
            || responseRequestId !== pendingRequestId
            || String(body?.bindingEpoch || '') !== currentTarget.bindingEpoch
          ) {
            return;
          }
          pendingApplyRequestRef.current = null;
          if (body?.ok === false) {
            setStatus({
              level: 'error',
              text: String(body?.error || 'The command could not be saved.'),
            });
          } else {
            setStatus({
              level: 'ok',
              text: String(body?.message || 'Command saved'),
            });
            resetPanel();
            requestWorkspaceBootstrap(currentTarget);
          }
          return;
        }

        if (operationId === 'commandEditor.insertElseIfResponse') {
          const currentTarget = targetRef.current;
          const pendingRequestId = pendingElseIfRequestRef.current;
          const responseRequestId = String(body?.requestId || '');
          if (
            !currentTarget
            || !pendingRequestId
            || !responseRequestId
            || responseRequestId !== pendingRequestId
            || String(body?.bindingEpoch || '') !== currentTarget.bindingEpoch
          ) {
            return;
          }
          pendingElseIfRequestRef.current = null;
          if (body?.ok === false) {
            setStatus({
              level: 'error',
              text: String(body?.error || 'ELSEIF could not be inserted.'),
            });
          } else {
            setStatus({
              level: 'ok',
              text: String(body?.message || 'ELSEIF inserted'),
            });
            resetPanel();
            requestWorkspaceBootstrap(currentTarget);
          }
          return;
        }

        if (
          operationId === 'commandEditor.bootstrapResponse'
          || operationId.startsWith('variableEditor.')
          || operationId.startsWith('instructionGraph.')
        ) {
          const currentTarget = targetRef.current;
          if (
            !currentTarget
            || String(body?.bindingEpoch || '') !== currentTarget.bindingEpoch
          ) {
            return;
          }
          setPanelMessages(current => [...current, raw]);
          if (body?.ok === false) {
            setStatus({
              level: 'error',
              text: String(body?.error || 'The Command Editor operation was refused.'),
            });
          }
        }
      } catch (messageError) {
        console.error('Could not read Command Editor response:', messageError);
        setStatus({
          level: 'error',
          text: 'The Command Editor response could not be read.',
        });
      }
    });
  }, [
    acceptWorkspaceSnapshot,
    messages,
    requestWorkspaceBootstrap,
    resetPanel,
    snapshot,
  ]);

  useEffect(() => {
    if (error) {
      setWorkspaceState('error');
      setStatus({ level: 'error', text: error });
    }
  }, [error]);

  const applyCommand = useCallback((draft: CommandDraft) => {
    const current = targetRef.current;
    if (!current || pendingApplyRequestRef.current) return;
    const requestId = `${Date.now()}-${current.instruction.id}-command`;
    pendingApplyRequestRef.current = requestId;
    const sent = send('commandEditor.apply', {
      ...draft,
      requestId,
      bindingEpoch: current.bindingEpoch,
      selectionRevision: current.selectionRevision,
    }, current.homeBankingId);
    if (sent) {
      setStatus({ level: 'warn', text: 'Saving command...' });
    } else {
      pendingApplyRequestRef.current = null;
    }
  }, [send]);

  const sendPanelCommand = useCallback((
    type: string,
    body: Record<string, unknown>,
  ) => {
    const current = targetRef.current;
    if (!current) return;
    send(type, {
      ...body,
      bindingEpoch: current.bindingEpoch,
      selectionRevision: current.selectionRevision,
    }, current.homeBankingId);
  }, [send]);

  const insertElseIf = useCallback((graphRevision: string) => {
    const current = targetRef.current;
    if (!current || pendingElseIfRequestRef.current) return;
    const requestId = `${Date.now()}-elseif-${current.instruction.id}`;
    pendingElseIfRequestRef.current = requestId;
    if (send('commandEditor.insertElseIf', {
      requestId,
      bindingEpoch: current.bindingEpoch,
      selectionRevision: current.selectionRevision,
      graphRevision,
    }, current.homeBankingId)) {
      setStatus({ level: 'warn', text: 'Inserting ELSEIF...' });
    } else {
      pendingElseIfRequestRef.current = null;
    }
  }, [send]);

  const selectInstruction = useCallback((blockId: number, instructionId: number) => {
    const current = targetRef.current;
    if (
      !current
      || pendingSelectRequestRef.current
      || !Number.isSafeInteger(blockId)
      || blockId <= 0
      || !Number.isSafeInteger(instructionId)
      || instructionId <= 0
      || (
        current.instruction.blockId === blockId
        && current.instruction.id === instructionId
      )
    ) {
      return;
    }

    const requestId = `${Date.now()}-${blockId}-${instructionId}-command-editor-select`;
    pendingSelectRequestRef.current = requestId;
    setSelectionPending(true);
    setStatus({ level: 'warn', text: 'Loading selected instruction...' });
    const sent = send('commandEditor.select', {
      requestId,
      bindingEpoch: current.bindingEpoch,
      selectionRevision: current.selectionRevision,
      selectedBlockId: blockId,
      selectedInstructionId: instructionId,
    }, current.homeBankingId);
    if (!sent) {
      pendingSelectRequestRef.current = null;
      setSelectionPending(false);
    }
  }, [send]);

  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'warn'
      ? styles.statusWarn
      : styles.statusOk;
  const subtitle = target
    ? `${target.botJobName || `Bot Job ${target.botJobId}`} — #${target.instruction.instructionOrderNumber} ${target.instruction.name}`
    : 'Commands, waits, loops, navigation, pauses, and variables';

  return (
    <DetachedPageShell
      title="Command Editor"
      testId="command-editor-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Command Editor</h1>
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
                title="Close only this Command Editor window"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </header>

          <section className={styles.content}>
            {workspaceState === 'loading' ? (
              <div className={styles.workspaceFeedback} role="status">
                <strong>Loading Command Editor...</strong>
                <span>Blocks, instructions, Web Fields, commands, and variables are loading together.</span>
              </div>
            ) : workspaceState === 'error' ? (
              <div className={styles.workspaceFeedback} role="alert">
                <strong>Command Editor could not load</strong>
                <span>{status.text}</span>
                <button
                  type="button"
                  className={styles.retryButton}
                  disabled={!connected}
                  onClick={() => requestWorkspaceBootstrap(targetRef.current)}
                >
                  Retry
                </button>
              </div>
            ) : workspaceState === 'empty' ? (
              <div className={styles.workspaceFeedback} role="status">
                <strong>No editable Command Editor data is available</strong>
                <span>The selected Bot Job has no complete Block, Instruction, or command catalogue.</span>
                <button
                  type="button"
                  className={styles.retryButton}
                  disabled={!connected}
                  onClick={() => requestWorkspaceBootstrap(targetRef.current)}
                >
                  Refresh
                </button>
              </div>
            ) : !target || !snapshot ? (
              <div className={styles.empty}>
                Select the blue arrow beside an instruction in Bot Job Details.
              </div>
            ) : (
              <InstructionCommandPanel
                key={`${target.bindingEpoch}:${panelEpoch}`}
                variant="page"
                instruction={target.instruction}
                onClose={() => undefined}
                onInsertElseIf={insertElseIf}
                onApplyCommand={applyCommand}
                messages={panelMessages}
                initialSnapshot={snapshot}
                selectionPending={selectionPending}
                onSelectInstruction={selectInstruction}
                context={{
                  sessionId,
                  targetSessionId: target.targetSessionId,
                  homeBankingId: target.homeBankingId,
                  botJobId: target.botJobId,
                  botJobName: target.botJobName,
                  bindingEpoch: target.bindingEpoch,
                  selectionRevision: target.selectionRevision,
                }}
                onSocketCommand={sendPanelCommand}
              />
            )}
          </section>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default CommandEditorPage;
