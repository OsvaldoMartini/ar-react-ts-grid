import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, RefreshCw } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import SmokeTestConnectionReview from './smoke-test/SmokeTestConnectionReview';
import SmokeTestSimulationWorkspace from './smoke-test/SmokeTestSimulationWorkspace';
import type { ExcelDataMode } from './excel-data/ExcelDataModeToggle';
import SmokeTestExecutionModeToggle from './smoke-test/integration/SmokeTestExecutionModeToggle';
import SmokeTestRuntimeModeToggle from './smoke-test/integration/SmokeTestRuntimeModeToggle';
import SmokeTestPagePolicyToggle from './smoke-test/integration/SmokeTestPagePolicyToggle';
import SmokeTestV2RuntimeToggle, {
  type V2RuntimeState,
} from './smoke-test/integration/SmokeTestV2RuntimeToggle';
import SmokeTestRuntimeInstancesModal, {
  type SmokeTestRuntimeInstance,
} from './smoke-test/integration/SmokeTestRuntimeInstancesModal';
import { useSmokeTestIntegrationRun } from './smoke-test/integration/useSmokeTestIntegrationRun';
import {
  readSmokeRuntimePreference,
  writeSmokeRuntimePreference,
} from './smoke-test/integration/smokeRuntimePreference';
import type {
  SmokeTestExecutionMode,
  SmokeTestIntegrationPagePolicy,
  SmokeTestIntegrationRuntimeMode,
} from './smoke-test/integration/smokeTestIntegration.contract';
import { useWebSocket } from './useWebSocket';
import { buildVariablesExecutionFlowReview } from './variables/domain/variablesExecutionFlowReview';
import type {
  VariablesSmokeTestPosition,
  VariablesSmokeTestStatus,
} from './variables/domain/variablesSmokeTestTypes';
import type { CommandRemainingByInstructionId } from './variables/Engine/controlFlowCommand.types';
import { useVariablesRuntimeMemory } from './variables/useVariablesRuntimeMemory';
import type { ExcelWriteManagerState } from './excel-write-manager/domain/excelWriteManager';
import {
  useVariablesInstructionStatus,
  type VariablesInstructionStatusResult,
} from './variables/useVariablesInstructionStatus';
import {
  useGridItemTestAction,
  type GridItemTestAction,
  type GridItemTestActionResult,
} from './bot-job-details/grid/hooks/useGridItemTestAction';
import {
  useGridItemWebElementType,
  type GridItemWebElementTypeResult,
} from './bot-job-details/grid/hooks/useGridItemWebElementType';
import type { BotJobGraphMutationCapability } from './bot-job-details/grid/hooks/useBotJobInstructionGraphMutation';
import type { WebElementExecutionType } from './webElementExecutionType';
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

type SupportingWorkspacesPending = {
  requestId: string;
  resolve: () => void;
  reject: (failure: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type ExcelDataModePending = {
  requestId: string;
  mode: ExcelDataMode;
  timeout: ReturnType<typeof setTimeout>;
};

type V2RuntimePending = {
  requestId: string;
  action: 'STATUS' | 'START' | 'STOP';
  timeout: ReturnType<typeof setTimeout>;
};

type RuntimeInstancesPending = {
  requestId: string;
  kind: 'LIST' | 'CONTROL';
  runId: string | null;
  action: 'STOP' | 'KILL' | null;
  timeout: ReturnType<typeof setTimeout>;
};

const REQUEST_TIMEOUT_MS = 12_000;
const SUPPORTING_WORKSPACES_TIMEOUT_MS = 45_000;

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

  const initialSourceBotJobId = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('sourceBotJobId');
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, []);
  const [sourceBotJobId, setSourceBotJobId] = useState<number | null>(initialSourceBotJobId);
  const {
    webSocket,
    connected,
    reconnectAttempts,
    messages,
    messageGeneration,
  } = useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const processedMessageGenerationRef = useRef(messageGeneration ?? 0);
  const requestSequenceRef = useRef(0);
  const pendingRef = useRef<PendingRequest | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supportingWorkspacesPendingRef = useRef<SupportingWorkspacesPending | null>(null);
  const excelDataModePendingRef = useRef<ExcelDataModePending | null>(null);
  const v2RuntimePendingRef = useRef<V2RuntimePending | null>(null);
  const runtimeInstancesPendingRef = useRef<RuntimeInstancesPending | null>(null);
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
  const [excelDataMode, setExcelDataMode] = useState<ExcelDataMode>('REAL');
  const [excelDataModePending, setExcelDataModePending] = useState(false);
  const [executionMode, setExecutionMode] = useState<SmokeTestExecutionMode>('SMOKE');
  const [integrationRuntimeMode, setIntegrationRuntimeMode] =
    useState<SmokeTestIntegrationRuntimeMode>('JAVA_V1');
  const [integrationPagePolicy, setIntegrationPagePolicy] =
    useState<SmokeTestIntegrationPagePolicy>('PRESERVE_ACTIVE');
  const [smokeRunStatus, setSmokeRunStatus] = useState<VariablesSmokeTestStatus>('IDLE');
  const [locatorRecoveryVerificationEnabled, setLocatorRecoveryVerificationEnabled] = useState(true);
  const [v2RuntimeState, setV2RuntimeState] = useState<V2RuntimeState>('UNKNOWN');
  const [v2RuntimePending, setV2RuntimePending] = useState(false);
  const [runtimeInstancesOpen, setRuntimeInstancesOpen] = useState(false);
  const [runtimeInstances, setRuntimeInstances] = useState<readonly SmokeTestRuntimeInstance[]>([]);
  const [runtimeInstancesLoading, setRuntimeInstancesLoading] = useState(false);
  const [runtimeInstancePendingRunId, setRuntimeInstancePendingRunId] = useState<string | null>(null);
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

  const rejectSupportingWorkspaces = useCallback((message: string) => {
    const current = supportingWorkspacesPendingRef.current;
    if (current === null) return;
    supportingWorkspacesPendingRef.current = null;
    clearTimeout(current.timeout);
    current.reject(new Error(message));
  }, []);

  const clearExcelDataModePending = useCallback(() => {
    const current = excelDataModePendingRef.current;
    if (current !== null) clearTimeout(current.timeout);
    excelDataModePendingRef.current = null;
    setExcelDataModePending(false);
  }, []);

  const clearV2RuntimePending = useCallback(() => {
    const current = v2RuntimePendingRef.current;
    if (current !== null) clearTimeout(current.timeout);
    v2RuntimePendingRef.current = null;
    setV2RuntimePending(false);
  }, []);

  const clearRuntimeInstancesPending = useCallback(() => {
    const current = runtimeInstancesPendingRef.current;
    if (current !== null) clearTimeout(current.timeout);
    runtimeInstancesPendingRef.current = null;
    setRuntimeInstancesLoading(false);
    setRuntimeInstancePendingRunId(null);
  }, []);

  const replaceSnapshot = useCallback((next: VariableWorkspaceSnapshot) => {
    const previous = snapshotRef.current;
    const botJobChanged = previous !== null && previous.botJob.id !== next.botJob.id;
    snapshotRef.current = next;
    setSnapshot(next);
    if (previous === null || botJobChanged) {
      setIntegrationRuntimeMode(readSmokeRuntimePreference(
        next.botJob.homeBankingId,
        next.botJob.id,
      ));
    }
    setBlockFilters(current => previous === null || botJobChanged
      ? next.blocks.map(block => block.id)
      : current.filter(blockId => next.blocks.some(block => block.id === blockId)));
    if (botJobChanged) {
      clearPending();
      clearExcelDataModePending();
      clearV2RuntimePending();
      clearRuntimeInstancesPending();
      setV2RuntimeState('UNKNOWN');
      setActiveSmokePosition(null);
      setSmokeExecutionTrace([]);
      setCommandRemainingByInstructionId({});
    }
  }, [clearExcelDataModePending, clearPending, clearV2RuntimePending]);

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
  const integration = useSmokeTestIntegrationRun({
    webSocket,
    connected,
    messages,
    messageGeneration,
    sessionId,
    snapshot,
  });
  const instructionTestCapability = useMemo<BotJobGraphMutationCapability | null>(() => {
    const capability = snapshot?.mutationCapability;
    if (!snapshot || !capability?.enabled) return null;
    return {
      enabled: true,
      contractVersion: capability.contractVersion,
      workspaceEpoch: snapshot.workspaceEpoch,
      graphVersion: capability.graphVersion,
      graphRevision: capability.graphRevision,
      ownerAssertion: capability.ownerAssertion,
    };
  }, [snapshot]);
  const handleInstructionTestResult = useCallback((result: GridItemTestActionResult) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || result.error || (result.ok
        ? `Test ${result.action.toLowerCase()} completed.`
        : `Test ${result.action.toLowerCase()} was refused${result.code ? ` (${result.code})` : ''}.`),
    });
  }, []);
  const {
    pendingRequestId: pendingInstructionTestRequestId,
    pendingInstructionId: pendingInstructionTestId,
    pendingAction: pendingInstructionTestAction,
    submit: submitInstructionTest,
  } = useGridItemTestAction({
    webSocket,
    connected,
    messages,
    sessionId,
    transportSessionId: sessionId,
    bindingEpoch: snapshot?.bindingEpoch ?? '',
    homeBankingId: snapshot?.botJob.homeBankingId ?? 0,
    botJobId: snapshot?.botJob.id ?? null,
    capability: instructionTestCapability,
    onResult: handleInstructionTestResult,
  });
  const handleWebElementTypeResult = useCallback((
    result: GridItemWebElementTypeResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? `Execution type changed to ${result.committedType}.`
        : `Execution type was not changed${result.code ? ` (${result.code})` : ''}.`),
    });
  }, []);
  const {
    pendingRequestId: pendingWebElementTypeRequestId,
    pendingInstructionId: pendingWebElementTypeInstructionId,
    submit: submitWebElementType,
  } = useGridItemWebElementType({
    webSocket,
    connected,
    messages,
    sessionId,
    transportSessionId: sessionId,
    bindingEpoch: snapshot?.bindingEpoch ?? '',
    homeBankingId: snapshot?.botJob.homeBankingId ?? 0,
    botJobId: snapshot?.botJob.id ?? null,
    capability: instructionTestCapability,
    onResult: handleWebElementTypeResult,
  });
  const handleInstructionStatusResult = useCallback((
    result: VariablesInstructionStatusResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? `Command ${result.active ? 'activated' : 'deactivated'}.`
        : 'The command status was not changed.'),
    });
  }, []);
  const {
    pendingInstructionId: pendingStatusInstructionId,
    submit: submitInstructionStatus,
    handleMessage: handleInstructionStatusMessage,
  } = useVariablesInstructionStatus({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleInstructionStatusResult,
  });

  useEffect(() => {
    resetRuntimeMemory();
  }, [resetRuntimeMemory, sourceBotJobId]);

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

  const requestV2Runtime = useCallback((action: 'STATUS' | 'START' | 'STOP') => {
    const current = snapshotRef.current;
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN
      || !current || v2RuntimePendingRef.current !== null) return false;
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-smoke-v2-runtime-${requestSequenceRef.current}`;
    const timeout = setTimeout(() => {
      if (v2RuntimePendingRef.current?.requestId !== requestId) return;
      v2RuntimePendingRef.current = null;
      setV2RuntimePending(false);
      setV2RuntimeState('ERROR');
      setStatus({ level: 'error', text: 'Execution V2 runtime control timed out.' });
    }, 25_000);
    v2RuntimePendingRef.current = { requestId, action, timeout };
    setV2RuntimePending(true);
    webSocket.send(JSON.stringify({
      type: action === 'STATUS'
        ? 'smokeTest.integration.runtimeStatus'
        : 'smokeTest.integration.runtimeControl',
      sessionId,
      body: JSON.stringify({
        requestId,
        action,
        bindingEpoch: current.bindingEpoch,
        workspaceEpoch: current.workspaceEpoch,
        homeBankingId: current.botJob.homeBankingId,
        botJobId: current.botJob.id,
        graphRevision: current.graphRevision,
      }),
    }));
    return true;
  }, [connected, sessionId, webSocket]);

  const requestRuntimeInstances = useCallback((control?: { runId: string; action: 'STOP' | 'KILL' }) => {
    const current = snapshotRef.current;
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN
      || !current || runtimeInstancesPendingRef.current !== null) return false;
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-smoke-runtime-instances-${requestSequenceRef.current}`;
    const kind = control ? 'CONTROL' : 'LIST';
    const timeout = setTimeout(() => {
      if (runtimeInstancesPendingRef.current?.requestId !== requestId) return;
      clearRuntimeInstancesPending();
      setStatus({ level: 'error', text: 'Runtime instance request timed out.' });
    }, 15_000);
    runtimeInstancesPendingRef.current = {
      requestId,
      kind,
      runId: control?.runId ?? null,
      action: control?.action ?? null,
      timeout,
    };
    setRuntimeInstancesLoading(kind === 'LIST');
    setRuntimeInstancePendingRunId(control?.runId ?? null);
    webSocket.send(JSON.stringify({
      type: control
        ? 'smokeTest.integration.runtimeInstanceControl'
        : 'smokeTest.integration.runtimeInstances',
      sessionId,
      body: JSON.stringify({
        requestId,
        ...(control ?? {}),
        bindingEpoch: current.bindingEpoch,
        workspaceEpoch: current.workspaceEpoch,
        homeBankingId: current.botJob.homeBankingId,
        botJobId: current.botJob.id,
        graphRevision: current.graphRevision,
      }),
    }));
    return true;
  }, [clearRuntimeInstancesPending, connected, sessionId, webSocket]);

  useEffect(() => {
    if (!runtimeInstancesOpen) return undefined;
    const interval = window.setInterval(() => requestRuntimeInstances(), 2_000);
    return () => window.clearInterval(interval);
  }, [requestRuntimeInstances, runtimeInstancesOpen]);

  useEffect(() => {
    if (connected && snapshot) requestV2Runtime('STATUS');
  }, [connected, requestV2Runtime, snapshot]);

  useEffect(() => {
    if (!connected) {
      clearPending();
      clearExcelDataModePending();
      clearV2RuntimePending();
      rejectSupportingWorkspaces('Smoke Test disconnected while preparing its supporting pages.');
      resetRuntimeMemory();
      return;
    }
    sendSnapshotRequest('variablesWorkspace.bootstrap');
  }, [clearExcelDataModePending, clearPending, clearRuntimeInstancesPending, clearV2RuntimePending, connected, rejectSupportingWorkspaces, resetRuntimeMemory, sendSnapshotRequest]);

  useEffect(() => () => {
    clearPending();
    clearExcelDataModePending();
    clearV2RuntimePending();
    clearRuntimeInstancesPending();
    rejectSupportingWorkspaces('Smoke Test closed while preparing its supporting pages.');
  }, [clearExcelDataModePending, clearPending, clearRuntimeInstancesPending, clearV2RuntimePending, rejectSupportingWorkspaces]);

  useEffect(() => {
    if (processedMessageGenerationRef.current !== (messageGeneration ?? 0)) {
      processedMessageGenerationRef.current = messageGeneration ?? 0;
      processedMessagesRef.current = 0;
    } else if (processedMessagesRef.current > messages.length) {
      processedMessagesRef.current = 0;
    }
    const unread = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;
    unread.forEach((raw) => {
      if (handleRuntimeMemoryMessage(raw)) return;
      if (handleInstructionStatusMessage(raw)) return;
      let envelope;
      try {
        envelope = parseVariablesWorkspaceMessage(String(raw));
      } catch (_) {
        return;
      }
      const body = bodyObject(envelope.body);
      if (envelope.operationId === 'smokeTest.integration.runtimeInstancesResponse'
        || envelope.operationId === 'smokeTest.integration.runtimeInstanceControlResponse') {
        const current = runtimeInstancesPendingRef.current;
        if (current === null || body?.requestId !== current.requestId) return;
        if (current.kind === 'CONTROL' && body?.runId !== current.runId) return;
        clearTimeout(current.timeout);
        runtimeInstancesPendingRef.current = null;
        setRuntimeInstancesLoading(false);
        setRuntimeInstancePendingRunId(null);
        if (body?.ok === false) {
          setStatus({ level: 'error', text: statusText(body, 'Runtime instance control was refused.') });
          return;
        }
        if (current.kind === 'LIST') {
          setRuntimeInstances(Array.isArray(body?.instances) ? body.instances as SmokeTestRuntimeInstance[] : []);
        } else {
          if (current.runId !== null && current.action !== null) {
            integration.retireExternalRun(current.runId, current.action);
          }
          setStatus({ level: 'ok', text: statusText(body, 'Runtime instance stopped.') });
          setTimeout(() => requestRuntimeInstances(), 0);
        }
        return;
      }
      if (envelope.operationId === 'smokeTest.integration.runtimeStatusResponse'
        || envelope.operationId === 'smokeTest.integration.runtimeControlResponse') {
        const current = v2RuntimePendingRef.current;
        if (current === null || body?.requestId !== current.requestId) return;
        if (body?.ok === false && body?.state === undefined) {
          clearTimeout(current.timeout);
          v2RuntimePendingRef.current = null;
          setV2RuntimePending(false);
          setV2RuntimeState('ERROR');
          setStatus({
            level: 'error',
            text: statusText(body, 'Execution V2 runtime control was refused.'),
          });
          return;
        }
        const owner = snapshotRef.current;
        if (!owner
          || body?.bindingEpoch !== owner.bindingEpoch
          || body?.workspaceEpoch !== owner.workspaceEpoch
          || body?.homeBankingId !== owner.botJob.homeBankingId
          || body?.botJobId !== owner.botJob.id
          || body?.graphRevision !== owner.graphRevision) return;
        clearTimeout(current.timeout);
        v2RuntimePendingRef.current = null;
        setV2RuntimePending(false);
        const nextState = typeof body?.state === 'string' ? body.state : 'ERROR';
        if (['STOPPED', 'STARTING', 'READY', 'READY_EXTERNAL'].includes(nextState)) {
          setV2RuntimeState(nextState as V2RuntimeState);
        } else {
          setV2RuntimeState('ERROR');
        }
        setStatus({
          level: body?.ok === false ? 'error' : nextState.startsWith('READY') ? 'ok' : 'warn',
          text: statusText(body, `Execution V2 runtime is ${nextState.toLowerCase()}.`),
        });
        return;
      }
      if (envelope.operationId === 'smokeTest.supportingWorkspaces.prepareResponse') {
        const current = supportingWorkspacesPendingRef.current;
        if (current === null || body?.requestId !== current.requestId) return;
        supportingWorkspacesPendingRef.current = null;
        clearTimeout(current.timeout);
        if (body?.ok === false) {
          const message = statusText(body, 'Smoke Test supporting pages are not ready.');
          setStatus({ level: 'error', text: message });
          current.reject(new Error(message));
        } else {
          setStatus({
            level: 'ok',
            text: 'Runtime Variables, Excel Data, and ExcelWriter Manager are ready.',
          });
          current.resolve();
        }
        return;
      }
      if (envelope.operationId === 'excelWriterWorkspace.stateResponse') {
        if (body?.ok === false) {
          setStatus({
            level: 'error',
            text: statusText(body, 'ExcelWriter Manager state could not be synchronized.'),
          });
        }
        return;
      }
      if (envelope.operationId === 'excelDataWorkspace.mode.updateResponse') {
        const current = excelDataModePendingRef.current;
        if (current === null || body?.requestId !== current.requestId) return;
        clearExcelDataModePending();
        if (body?.ok === false
          || body?.botJobId !== sourceBotJobId
          || body?.mode !== current.mode) {
          setStatus({
            level: 'error',
            text: statusText(body, 'The Excel Data mode change was not confirmed.'),
          });
          return;
        }
        setExcelDataMode(current.mode);
        setStatus({
          level: 'ok',
          text: `${current.mode === 'REAL' ? 'Real' : 'Synthetic'} Excel Data memory selected.`,
        });
        return;
      }
      if ([
        'excelDataWorkspace.openResponse',
        'excelDataWorkspace.mode.readResponse',
        'excelData.mode.changed',
      ].includes(envelope.operationId ?? '')) {
        if (body?.ok !== false && body?.botJobId === sourceBotJobId
          && (body?.mode === 'REAL' || body?.mode === 'SYNTHETIC')) {
          setExcelDataMode(body.mode);
          const current = excelDataModePendingRef.current;
          if (envelope.operationId === 'excelData.mode.changed'
            && current?.mode === body.mode) {
            clearExcelDataModePending();
            setStatus({
              level: 'ok',
              text: `${body.mode === 'REAL' ? 'Real' : 'Synthetic'} Excel Data memory selected.`,
            });
          }
        }
        return;
      }
      if (envelope.operationId === 'excelWriterWorkspace.openResponse') {
        setStatus({
          level: body?.ok === false ? 'error' : 'ok',
          text: statusText(body, body?.ok === false
            ? 'ExcelWriter Manager could not be opened.'
            : 'ExcelWriter Manager opened for this Bot Job.'),
        });
        return;
      }
      if (
        envelope.operationId !== 'variablesWorkspace.bootstrapResponse'
        && envelope.operationId !== 'variablesWorkspace.refreshResponse'
        && envelope.operationId !== 'variablesWorkspace.snapshot'
      ) {
        return;
      }
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
      if (!normalized || (envelope.operationId.endsWith('Response')
        && normalized.botJob.id !== sourceBotJobId)) {
        setStatus({
          level: 'error',
          text: 'The Smoke Test snapshot did not match the requested Bot Job.',
        });
        return;
      }
      setSourceBotJobId(normalized.botJob.id);
      replaceSnapshot(normalized);
      setStatus({
        level: 'ok',
        text: statusText(body, 'Smoke Test workspace ready.'),
      });
    });
  }, [
    clearPending,
    clearExcelDataModePending,
    handleRuntimeMemoryMessage,
    handleInstructionStatusMessage,
    integration.retireExternalRun,
    messageGeneration,
    messages,
    replaceSnapshot,
    requestRuntimeInstances,
    sourceBotJobId,
  ]);

  const review = useMemo(
    () => snapshot ? buildVariablesExecutionFlowReview(snapshot) : null,
    [snapshot],
  );
  const openSupportingWorkspaces = useCallback((): Promise<void> => {
    const current = snapshotRef.current;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !current) {
      const message = 'Supporting pages could not be prepared because Smoke Test is disconnected.';
      setStatus({ level: 'error', text: message });
      return Promise.reject(new Error(message));
    }
    if (supportingWorkspacesPendingRef.current !== null) {
      return Promise.reject(new Error('Supporting pages are already being prepared.'));
    }
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-smoke-supporting-${requestSequenceRef.current}`;
    setStatus({
      level: 'warn',
      text: 'Opening Runtime Variables, Excel Data, and ExcelWriter Manager...',
    });
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (supportingWorkspacesPendingRef.current?.requestId !== requestId) return;
        supportingWorkspacesPendingRef.current = null;
        const message = 'Supporting pages did not become ready before the timeout.';
        setStatus({ level: 'error', text: message });
        reject(new Error(message));
      }, SUPPORTING_WORKSPACES_TIMEOUT_MS);
      supportingWorkspacesPendingRef.current = { requestId, resolve, reject, timeout };
      try {
        webSocket.send(JSON.stringify({
          type: 'smokeTest.supportingWorkspaces.prepare',
          sessionId,
          body: JSON.stringify({
            requestId,
            bindingEpoch: current.bindingEpoch,
            workspaceEpoch: current.workspaceEpoch,
            homeBankingId: current.botJob.homeBankingId,
            botJobId: current.botJob.id,
            graphRevision: current.graphRevision,
          }),
        }));
      } catch (failure) {
        supportingWorkspacesPendingRef.current = null;
        clearTimeout(timeout);
        const message = failure instanceof Error
          ? failure.message
          : 'Supporting pages request could not be sent.';
        setStatus({ level: 'error', text: message });
        reject(new Error(message));
      }
    });
  }, [sessionId, webSocket]);
  const openExcelWriterManager = useCallback(() => {
    const current = snapshotRef.current;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !current) {
      setStatus({ level: 'error', text: 'ExcelWriter Manager could not be opened because Smoke Test is disconnected.' });
      return;
    }
    webSocket.send(JSON.stringify({
      type: 'excelWriterWorkspace.open',
      sessionId,
      body: JSON.stringify({
        requestId: `${Date.now()}-smoke-excel-writer-open`,
        bindingEpoch: current.bindingEpoch,
        workspaceEpoch: current.workspaceEpoch,
        homeBankingId: current.botJob.homeBankingId,
        botJobId: current.botJob.id,
      }),
    }));
  }, [sessionId, webSocket]);
  const publishExcelWriterState = useCallback((
    state: ExcelWriteManagerState,
    busy: boolean,
    policyLocked: boolean,
  ): boolean => {
    const current = snapshotRef.current;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !current) return false;
    try {
      webSocket.send(JSON.stringify({
        type: 'excelWriterWorkspace.state',
        sessionId,
        body: JSON.stringify({
          bindingEpoch: current.bindingEpoch,
          workspaceEpoch: current.workspaceEpoch,
          homeBankingId: current.botJob.homeBankingId,
          botJobId: current.botJob.id,
          state,
          busy,
          policyLocked,
        }),
      }));
      return true;
    } catch (failure) {
      setStatus({
        level: 'error',
        text: failure instanceof Error
          ? failure.message
          : 'ExcelWriter Manager state could not be synchronized.',
      });
      return false;
    }
  }, [sessionId, webSocket]);
  const updateExcelDataMode = useCallback((mode: ExcelDataMode) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN
      || excelDataModePendingRef.current !== null) return;
    requestSequenceRef.current += 1;
    const requestId = `${Date.now()}-smoke-excel-mode-${requestSequenceRef.current}`;
    const timeout = setTimeout(() => {
      if (excelDataModePendingRef.current?.requestId !== requestId) return;
      setStatus({
        level: 'error',
        text: 'The Excel Data mode change timed out. Test Input remains unavailable; Reload Smoke Test before retrying.',
      });
    }, REQUEST_TIMEOUT_MS);
    excelDataModePendingRef.current = { requestId, mode, timeout };
    setExcelDataModePending(true);
    setStatus({ level: 'warn', text: 'Confirming the Excel Data memory mode...' });
    try {
      webSocket.send(JSON.stringify({
        type: 'excelDataWorkspace.mode.update',
        sessionId,
        body: JSON.stringify({ requestId, mode }),
      }));
    } catch (failure) {
      clearExcelDataModePending();
      setStatus({
        level: 'error',
        text: failure instanceof Error
          ? failure.message
          : 'The Excel Data mode change could not be sent.',
      });
    }
  }, [clearExcelDataModePending, sessionId, webSocket]);
  useEffect(() => {
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN || !snapshot?.botJob.id) return;
    webSocket.send(JSON.stringify({
      type: 'excelDataWorkspace.mode.read',
      sessionId,
      body: JSON.stringify({ requestId: `${Date.now()}-smoke-excel-mode-read` }),
    }));
  }, [connected, sessionId, snapshot?.botJob.id, webSocket]);
  useEffect(() => {
    setActiveSmokePosition(null);
    setSmokeExecutionTrace([]);
    setCommandRemainingByInstructionId({});
  }, [snapshot?.botJob.id, snapshot?.graphRevision]);
  useEffect(() => {
    if (!integration.error) return;
    setStatus({ level: 'error', text: integration.error });
  }, [integration.error]);
  const smokeRunActive = smokeRunStatus === 'STARTING'
    || smokeRunStatus === 'RUNNING'
    || smokeRunStatus === 'STOPPING';
  const instructionActionsDisabled = !connected
    || pending !== null
    || instructionTestCapability === null
    || smokeRunActive
    || integration.phase !== 'IDLE'
    || pendingInstructionTestRequestId !== null
    || pendingWebElementTypeRequestId !== null
    || pendingStatusInstructionId !== null;
  const testInstruction = useCallback((
    instructionId: number,
    action: GridItemTestAction,
  ) => {
    if (instructionActionsDisabled || (action === 'INPUT' && excelDataModePending)) return;
    submitInstructionTest(instructionId, action, 0);
  }, [excelDataModePending, instructionActionsDisabled, submitInstructionTest]);
  const toggleInstructionStatus = useCallback((
    instructionId: number,
    currentActive: boolean,
  ) => {
    if (instructionActionsDisabled || !snapshot) return;
    const instruction = snapshot.commands.find(command => command.id === instructionId);
    if (!instruction) {
      setStatus({ level: 'error', text: 'The selected command is no longer available.' });
      return;
    }
    submitInstructionStatus(instruction, !currentActive);
  }, [instructionActionsDisabled, snapshot, submitInstructionStatus]);
  const changeInstructionType = useCallback((
    instructionId: number,
    currentType: WebElementExecutionType,
    replacementType: WebElementExecutionType,
  ) => {
    if (instructionActionsDisabled) return;
    submitWebElementType(instructionId, currentType, replacementType);
  }, [instructionActionsDisabled, submitWebElementType]);
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
              <div className={styles.statusStack}>
                {executionMode === 'INTEGRATION' && (
                  <span className={styles.runtimeStatus} data-mode={integrationRuntimeMode}>
                    Runtime: {integrationRuntimeMode === 'TYPESCRIPT_PLAYWRIGHT_V2'
                      ? 'V2 Isolated'
                      : 'Java V1 Shared'}
                  </span>
                )}
                <div className={`${styles.status} ${statusClass}`} role="status">
                  {connected
                    ? status.text
                    : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`}
                </div>
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
              <SmokeTestExecutionModeToggle
                mode={executionMode}
                disabled={smokeRunActive || integration.phase !== 'IDLE'}
                onChange={setExecutionMode}
              />
              {executionMode === 'INTEGRATION' && (
                <SmokeTestRuntimeModeToggle
                  mode={integrationRuntimeMode}
                  disabled={smokeRunActive || integration.phase !== 'IDLE'}
                  onChange={(mode) => {
                    setIntegrationRuntimeMode(mode);
                    const owner = snapshotRef.current?.botJob;
                    if (owner) writeSmokeRuntimePreference(owner.homeBankingId, owner.id, mode);
                    if (mode === 'TYPESCRIPT_PLAYWRIGHT_V2') {
                      setIntegrationPagePolicy('RELOAD_SELECTED');
                    }
                  }}
                />
              )}
              {executionMode === 'INTEGRATION' && (
                <SmokeTestPagePolicyToggle
                  policy={integrationPagePolicy}
                  disabled={integrationRuntimeMode === 'TYPESCRIPT_PLAYWRIGHT_V2'
                    || smokeRunActive
                    || integration.phase !== 'IDLE'}
                  onChange={setIntegrationPagePolicy}
                />
              )}
              {executionMode === 'INTEGRATION' && (
                <SmokeTestV2RuntimeToggle
                  state={v2RuntimeState}
                  pending={v2RuntimePending}
                  attention={integrationRuntimeMode === 'TYPESCRIPT_PLAYWRIGHT_V2'
                    && v2RuntimeState !== 'READY'
                    && v2RuntimeState !== 'READY_EXTERNAL'}
                  disabled={!connected
                    || snapshot === null}
                  onToggle={() => {
                    setRuntimeInstancesOpen(true);
                    requestRuntimeInstances();
                  }}
                />
              )}
              <button
                type="button"
                className={styles.refreshButton}
                disabled={!connected
                  || pending !== null
                  || sourceBotJobId === null
                  || smokeRunActive}
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
              <SmokeTestSimulationWorkspace
                review={review}
                selectedBlockIds={blockFilters}
                runtimeWriteAvailable={connected}
                onCommitRuntimeValue={updateRuntimeValue}
                onActivePositionChange={setActiveSmokePosition}
                onExecutionTraceChange={setSmokeExecutionTrace}
                onCommandRemainingChange={setCommandRemainingByInstructionId}
                onRunStart={openSupportingWorkspaces}
                onOpenExcelWriterManager={openExcelWriterManager}
                excelWriterMessages={messages}
                excelWriterMessageGeneration={messageGeneration ?? 0}
                onPublishExcelWriterState={publishExcelWriterState}
                excelDataMode={excelDataMode}
                excelDataModePending={excelDataModePending}
                onExcelDataModeChange={updateExcelDataMode}
                executionMode={executionMode}
                integrationRuntimeMode={integrationRuntimeMode}
                v2RuntimeReady={v2RuntimeState === 'READY'
                  || v2RuntimeState === 'READY_EXTERNAL'}
                integrationPagePolicy={integrationPagePolicy}
                integration={integration}
                locatorRecoveryVerificationEnabled={locatorRecoveryVerificationEnabled}
                onLocatorRecoveryVerificationChange={setLocatorRecoveryVerificationEnabled}
                onStatusChange={setSmokeRunStatus}
              />
              <SmokeTestConnectionReview
                review={review}
                scopeLabel="Complete Bot Job"
                blockFilters={blockFilters}
                onBlockFiltersChange={setBlockFilters}
                activeSmokePosition={activeSmokePosition}
                smokeExecutionTrace={smokeExecutionTrace}
                commandRemainingByInstructionId={commandRemainingByInstructionId}
                actionsDisabled={instructionActionsDisabled}
                inputTestDisabled={excelDataModePending}
                pendingTestInstructionId={pendingInstructionTestId}
                pendingTestAction={pendingInstructionTestAction}
                pendingWebElementTypeInstructionId={pendingWebElementTypeInstructionId}
                pendingStatusInstructionId={pendingStatusInstructionId}
                onTestInstruction={testInstruction}
                onChangeInstructionType={changeInstructionType}
                onToggleInstructionStatus={toggleInstructionStatus}
                locatorRecoveryVerificationEnabled={locatorRecoveryVerificationEnabled}
                onLocatorRecoveryVerificationChange={setLocatorRecoveryVerificationEnabled}
                embedded
                onClose={() => undefined}
              />
            </section>
          )}
          {runtimeInstancesOpen && (
            <SmokeTestRuntimeInstancesModal
              instances={runtimeInstances}
              loading={runtimeInstancesLoading}
              pendingRunId={runtimeInstancePendingRunId}
              serverState={v2RuntimeState}
              serverPending={v2RuntimePending}
              onServerToggle={() => requestV2Runtime(v2RuntimeState === 'READY' ? 'STOP' : 'START')}
              onRefresh={() => requestRuntimeInstances()}
              onControl={(runId, action) => requestRuntimeInstances({ runId, action })}
              onClose={() => setRuntimeInstancesOpen(false)}
            />
          )}
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default SmokeTestPage;
