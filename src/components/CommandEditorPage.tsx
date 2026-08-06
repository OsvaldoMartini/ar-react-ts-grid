import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import CommandEditorPageBody from './command-editor-page/CommandEditorPageBody';
import type { CommandEditorMutationIntent } from './command-editor/commandEditorMutation';
import {
  useCommandEditorVariableSave,
  type CommandEditorVariableSaveResult,
} from './command-editor/useCommandEditorVariableSave';
import {
  commandEditorPageInstructionFromPayload,
  commandEditorPageSnapshotFromPayload,
  type CommandEditorPageInstruction,
  type CommandEditorPageSnapshot,
} from './command-editor-page/commandEditorPageSnapshot';
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
  instruction: CommandEditorPageInstruction;
};

type PendingMutation = {
  requestId: string;
  responseType: 'variablesWorkspace.commandEditor.updateResponse'
    | 'variablesWorkspace.commandEditor.copyResponse';
  bindingEpoch: string;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
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

const COMMAND_MUTATION_TIMEOUT_MS = 15_000;

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
  const instruction = commandEditorPageInstructionFromPayload(candidate?.instruction);
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
    instruction,
  };
};

const CommandEditorPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  const { webSocket, connected, reconnectAttempts, messages, error } =
    useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const pendingBootstrapRequestRef = useRef<string | null>(null);
  const pendingMutationRef = useRef<PendingMutation | null>(null);
  const targetRef = useRef<CommandEditorTarget | null>(null);
  const [target, setTarget] = useState<CommandEditorTarget | null>(null);
  const [snapshot, setSnapshot] = useState<CommandEditorPageSnapshot | null>(null);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('loading');
  const [bodyEpoch, setBodyEpoch] = useState(0);
  const [mutationPending, setMutationPending] = useState(false);
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for an instruction',
  });

  const clearPendingMutation = useCallback(() => {
    const pending = pendingMutationRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingMutationRef.current = null;
    setMutationPending(false);
    return pending;
  }, []);

  const send = useCallback((
    type: string,
    body: Record<string, unknown> = {},
    homeBankingId?: number,
  ) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus({ level: 'error', text: 'Command Editor is not connected.' });
      return false;
    }
    try {
      webSocket.send(JSON.stringify({
        type,
        sessionId,
        homeBankingId: homeBankingId ?? targetRef.current?.homeBankingId ?? -1,
        body: JSON.stringify(body),
      }));
      return true;
    } catch (_) {
      setStatus({ level: 'error', text: 'The Command Editor request could not be sent.' });
      return false;
    }
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

  const variableSaveAuthority = useMemo(() => {
    const capability = snapshot?.graphCapability;
    if (!target || !capability || target.targetSessionId !== 'botJobTasks') return null;
    return {
      sessionId,
      bindingEpoch: target.bindingEpoch,
      workspaceEpoch: capability.workspaceEpoch,
      graphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      ownerAssertion: capability.ownerAssertion,
      botJobName: target.botJobName,
      targetSessionId: target.targetSessionId,
      selectionRevision: target.selectionRevision,
    } as const;
  }, [sessionId, snapshot?.graphCapability, target]);

  const handleVariableSaveResult = useCallback((result: CommandEditorVariableSaveResult) => {
    const current = targetRef.current;
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? 'Command and variable connections saved.'
        : `The ${result.stage.toLocaleLowerCase()} save was refused.`),
    });
    if (current) requestWorkspaceBootstrap(current);
  }, [requestWorkspaceBootstrap]);

  const {
    pendingRequestId: pendingVariableSaveRequestId,
    submit: submitVariableSave,
    handleMessage: handleVariableSaveMessage,
  } = useCommandEditorVariableSave({
    webSocket,
    connected,
    authority: variableSaveAuthority,
    onResult: handleVariableSaveResult,
  });

  useEffect(() => {
    if (!connected) return;
    // A reconnected manager transport receives a new backend binding epoch. Bootstrap without the
    // previous epoch so the server can return the new authoritative binding and full snapshot.
    requestWorkspaceBootstrap();
  }, [connected, requestWorkspaceBootstrap]);

  const acceptWorkspaceSnapshot = useCallback((
    body: any,
    nextTarget: CommandEditorTarget,
  ) => {
    const nextSnapshot = commandEditorPageSnapshotFromPayload(body);
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
    clearPendingMutation();
    setTarget(nextTarget);
    setSnapshot(nextSnapshot);
    setBodyEpoch(current => current + 1);
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
  }, [clearPendingMutation]);

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
          if (body?.ok === false) {
            if (operationId === 'commandEditor.workspaceBootstrapResponse') {
              pendingBootstrapRequestRef.current = null;
            }
            setWorkspaceState('error');
            setStatus({
              level: 'error',
              text: String(body?.error || body?.message || 'The Command Editor target is unavailable.'),
            });
            return;
          }

          const nextTarget = parseTarget(body);
          if (!nextTarget) {
            pendingBootstrapRequestRef.current = null;
            clearPendingMutation();
            targetRef.current = null;
            setTarget(null);
            setSnapshot(null);
            setMutationPending(false);
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
          if (operationId === 'commandEditor.workspaceTarget') {
            pendingBootstrapRequestRef.current = null;
          }
          return;
        }

        if (handleVariableSaveMessage(raw)) return;

        if (
          operationId === 'variablesWorkspace.commandEditor.updateResponse'
          || operationId === 'variablesWorkspace.commandEditor.copyResponse'
        ) {
          const pending = pendingMutationRef.current;
          const currentTarget = targetRef.current;
          const responseBindingEpoch = String(body?.bindingEpoch || '');
          if (
            !pending
            || !currentTarget
            || operationId !== pending.responseType
            || String(body?.requestId || '') !== pending.requestId
            || (
              responseBindingEpoch.length > 0
              && responseBindingEpoch !== pending.bindingEpoch
            )
          ) {
            return;
          }
          clearPendingMutation();
          if (body?.ok === true && body?.committed !== false) {
            setStatus({
              level: 'ok',
              text: String(body?.message || (operationId.includes('.copy')
                ? 'Command copied'
                : 'Command updated')),
            });
            requestWorkspaceBootstrap(currentTarget);
          } else {
            const errorCode = String(body?.errorCode || '').trim();
            setStatus({
              level: 'error',
              text: String(body?.message || body?.error || 'The command could not be saved.'),
            });
            if (
              body?.resyncRequired === true
              || /_GRAPH_(?:VERSION|REVISION)_STALE$/.test(errorCode)
            ) {
              requestWorkspaceBootstrap(currentTarget);
            }
          }
          return;
        }

        if (
          operationId === 'commandEditor.errorResponse'
          || operationId === 'license.requiredResponse'
        ) {
          const bootstrapWasPending = pendingBootstrapRequestRef.current != null;
          pendingBootstrapRequestRef.current = null;
          clearPendingMutation();
          setStatus({
            level: 'error',
            text: String(
              body?.error
              || body?.message
              || body?.status
              || 'The Command Editor operation was refused.',
            ),
          });
          if (bootstrapWasPending || !snapshot) setWorkspaceState('error');
          return;
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
    clearPendingMutation,
    handleVariableSaveMessage,
    messages,
    requestWorkspaceBootstrap,
    snapshot,
  ]);

  useEffect(() => {
    if (error) {
      setWorkspaceState('error');
      setStatus({ level: 'error', text: error });
    }
  }, [error]);

  useEffect(() => {
    const pending = pendingMutationRef.current;
    if (!pending) return;
    if (
      !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
    ) {
      clearPendingMutation();
      setStatus({
        level: 'error',
        text: 'The Command Editor connection changed before the command was saved.',
      });
    }
  }, [clearPendingMutation, connected, webSocket]);

  useEffect(() => () => {
    const pending = pendingMutationRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingMutationRef.current = null;
  }, []);

  const submitCommandMutation = useCallback((intent: CommandEditorMutationIntent) => {
    const current = targetRef.current;
    const capability = snapshot?.graphCapability;
    if (
      !current
      || !capability
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || pendingMutationRef.current
    ) {
      setStatus({
        level: 'error',
        text: 'Command persistence is not available for this workspace.',
      });
      return;
    }
    if (
      capability.ownerAssertion.homeBankingId !== current.homeBankingId
      || capability.ownerAssertion.botJobId !== current.botJobId
    ) {
      setStatus({
        level: 'error',
        text: 'The Command Editor graph authority does not match the active Bot Job.',
      });
      return;
    }

    const copy = intent.action === 'COPY_NEW';
    const botJobVariableUpdate = !copy && current.targetSessionId === 'botJobTasks';
    if (botJobVariableUpdate) {
      const requestId = submitVariableSave(intent);
      if (requestId) {
        setStatus({ level: 'warn', text: 'Updating command and variable connections...' });
      } else {
        setStatus({
          level: 'error',
          text: 'Command and variable persistence is not available for this workspace.',
        });
      }
      return;
    }
    const operationType = copy
      ? 'variablesWorkspace.commandEditor.copy'
      : 'variablesWorkspace.commandEditor.update';
    const responseType = copy
      ? 'variablesWorkspace.commandEditor.copyResponse' as const
      : 'variablesWorkspace.commandEditor.updateResponse' as const;
    const requestId = `${Date.now()}-command-editor-page-${copy ? 'copy' : 'update'}-${intent.sourceInstructionId}`;
    const configuration = intent.draft.configuration.kind === 'LEGACY'
      ? { kind: 'NONE' }
      : intent.draft.configuration;
    const common = {
      contractVersion: 1,
      requestId,
      bindingEpoch: current.bindingEpoch,
      selectionRevision: current.selectionRevision,
      targetSessionId: current.targetSessionId,
      homeBankingId: current.homeBankingId,
      botJobId: current.botJobId,
      botJobName: current.botJobName,
      workspaceEpoch: capability.workspaceEpoch,
      baseGraphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      sourceInstructionId: intent.sourceInstructionId,
      targetBlockId: intent.targetBlockId,
      placement: {
        kind: intent.placement.kind,
        referenceInstructionId: intent.placement.kind === 'AFTER_INSTRUCTION'
          ? intent.placement.instructionId
          : null,
      },
      configuration,
      targetAction: intent.draft.action,
    };
    const body = copy
      ? { ...common, createBlank: false }
      : {
          ...common,
          allowRelationshipDisconnect: intent.allowRelationshipDisconnect,
          allowConditionalFamilyDissolve: intent.allowConditionalFamilyDissolve,
          conditionalFamilyDeleteIds: [...intent.conditionalFamilyDeleteIds],
        };
    const timeoutId = setTimeout(() => {
      if (pendingMutationRef.current?.requestId !== requestId) return;
      clearPendingMutation();
      setStatus({
        level: 'error',
        text: 'Command persistence timed out. Reloading authoritative Command Editor state.',
      });
      // A lost acknowledgement is an ambiguous commit, especially for COPY NEW. Reload before
      // permitting another mutation so a retry cannot create a second copy.
      requestWorkspaceBootstrap(current);
    }, COMMAND_MUTATION_TIMEOUT_MS);
    pendingMutationRef.current = {
      requestId,
      responseType,
      bindingEpoch: current.bindingEpoch,
      webSocket,
      timeoutId,
    };
    setMutationPending(true);
    setStatus({ level: 'warn', text: copy ? 'Copying command...' : 'Updating command...' });
    const sent = send(operationType, body, current.homeBankingId);
    if (!sent) {
      clearPendingMutation();
    }
  }, [
    clearPendingMutation,
    connected,
    requestWorkspaceBootstrap,
    send,
    snapshot,
    submitVariableSave,
    webSocket,
  ]);

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
              <CommandEditorPageBody
                key={`${target.bindingEpoch}:${target.selectionRevision}:${bodyEpoch}`}
                botJobId={target.botJobId}
                botJobName={target.botJobName}
                scopeLabel={`#${target.instruction.blockOrderNumber} ${target.instruction.blockName} · #${target.instruction.instructionOrderNumber} instruction`}
                snapshot={snapshot}
                status={status}
                pending={mutationPending || pendingVariableSaveRequestId !== null}
                onSubmit={snapshot.graphCapability ? submitCommandMutation : undefined}
                onCancel={() => {
                  if (mutationPending || pendingVariableSaveRequestId !== null) return;
                  if (onClose) {
                    onClose();
                  } else {
                    setBodyEpoch(current => current + 1);
                    setStatus({ level: 'warn', text: 'Unsaved Command Editor changes were reset.' });
                  }
                }}
              />
            )}
          </section>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default CommandEditorPage;
