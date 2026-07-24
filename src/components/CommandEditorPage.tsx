import React, { useCallback, useEffect, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import InstructionCommandPanel, {
  type CommandDraft,
  type CommandPanelInstruction,
} from './InstructionCommandPanel';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './CommandEditorPage.module.scss';

export const COMMAND_EDITOR_SESSION_ID = 'commandEditorManager';

type CommandEditorTarget = {
  bindingEpoch: string;
  targetSessionId: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  instruction: CommandPanelInstruction;
};

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

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
  const homeBankingId = Number(candidate?.homeBankingId);
  const botJobId = Number(candidate?.botJobId);
  const workspaceEpoch = Number(candidate?.workspaceEpoch);

  if (
    candidate?.ok === false
    || !bindingEpoch
    || targetSessionId !== 'botJobTasks'
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
    targetSessionId,
    homeBankingId,
    botJobId,
    workspaceEpoch,
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
  const pendingApplyRequestRef = useRef<string | null>(null);
  const pendingElseIfRequestRef = useRef<string | null>(null);
  const targetRef = useRef<CommandEditorTarget | null>(null);
  const [target, setTarget] = useState<CommandEditorTarget | null>(null);
  const [panelMessages, setPanelMessages] = useState<string[]>([]);
  const [panelEpoch, setPanelEpoch] = useState(0);
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for an instruction',
  });

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

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

  useEffect(() => {
    if (!connected) return;
    send('commandEditor.workspaceBootstrap', {
      requestId: `${Date.now()}-command-editor-bootstrap`,
    });
  }, [connected, send]);

  const resetPanel = useCallback(() => {
    setPanelMessages([]);
    setPanelEpoch(current => current + 1);
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
        if (
          operationId === 'commandEditor.workspaceBootstrapResponse'
          || operationId === 'commandEditor.workspaceTarget'
        ) {
          const nextTarget = parseTarget(body);
          if (!nextTarget) {
            pendingApplyRequestRef.current = null;
            pendingElseIfRequestRef.current = null;
            setTarget(null);
            setPanelMessages([]);
            setStatus({
              level: 'error',
              text: String(body?.error || body?.message || 'The Command Editor target is unavailable.'),
            });
            return;
          }
          pendingApplyRequestRef.current = null;
          pendingElseIfRequestRef.current = null;
          setTarget(nextTarget);
          setPanelMessages([]);
          setPanelEpoch(current => current + 1);
          setStatus({
            level: 'ok',
            text: String(body?.message || 'Command Editor loaded'),
          });
          return;
        }

        if (
          operationId === 'commandEditor.errorResponse'
          || operationId === 'license.requiredResponse'
        ) {
          setStatus({
            level: 'error',
            text: String(
              body?.error
              || body?.message
              || body?.status
              || 'The Command Editor operation was refused.',
            ),
          });
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
            send('commandEditor.workspaceBootstrap', {
              requestId: `${Date.now()}-command-editor-refresh`,
              bindingEpoch: currentTarget.bindingEpoch,
            }, currentTarget.homeBankingId);
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
            send('commandEditor.workspaceBootstrap', {
              requestId: `${Date.now()}-command-editor-refresh`,
              bindingEpoch: currentTarget.bindingEpoch,
            }, currentTarget.homeBankingId);
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
  }, [messages, resetPanel, send]);

  useEffect(() => {
    if (error) setStatus({ level: 'error', text: error });
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
      graphRevision,
    }, current.homeBankingId)) {
      setStatus({ level: 'warn', text: 'Inserting ELSEIF...' });
    } else {
      pendingElseIfRequestRef.current = null;
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
            {!target ? (
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
                context={{
                  sessionId,
                  targetSessionId: target.targetSessionId,
                  homeBankingId: target.homeBankingId,
                  botJobId: target.botJobId,
                  botJobName: target.botJobName,
                  bindingEpoch: target.bindingEpoch,
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
