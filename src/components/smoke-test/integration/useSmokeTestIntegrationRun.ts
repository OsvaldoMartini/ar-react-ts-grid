import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExcelDataMode } from '../../excel-data/ExcelDataModeToggle';
import type {
  VariablesSmokeTestPlan,
} from '../../variables/domain/variablesSmokeTestTypes';
import {
  parseVariablesWorkspaceMessage,
  type VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import {
  buildSmokeTestIntegrationRefreshRequest,
  buildSmokeTestIntegrationForceStopRequest,
  parseSmokeTestIntegrationForceStopResponse,
  buildSmokeTestIntegrationStartRequest,
  parseSmokeTestIntegrationRefreshResponse,
  parseSmokeTestIntegrationStartResponse,
  parseSmokeTestIntegrationStepResponse,
  parseSmokeTestLocatorRecoveryResponse,
  parseSmokeTestIntegrationExcelWriteResponse,
  parseSmokeTestIntegrationTerminalResponse,
  SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
  type SmokeTestIntegrationRun,
  type SmokeTestIntegrationPagePolicy,
  type SmokeTestIntegrationRuntimeMode,
  type SmokeTestIntegrationStepRequest,
  type SmokeTestIntegrationStepResult,
  type SmokeTestIntegrationExcelWriteArtifact,
  type SmokeTestLocatorRecoveryDecision,
  type SmokeTestLocatorRecoveryResult,
  type SmokeTestIntegrationForceStopResult,
} from './smokeTestIntegration.contract';

const START_TIMEOUT_MS = 75_000;
const V2_START_TIMEOUT_MS = 75_000;
const STEP_TIMEOUT_MS = 90_000;
const TERMINAL_TIMEOUT_MS = 15_000;

type Phase =
  | 'IDLE'
  | 'REFRESHING'
  | 'STARTING'
  | 'READY'
  | 'EXECUTING'
  | 'STOPPING'
  | 'FINISHING'
  | 'CLEANUP_REQUIRED';

export class SmokeTestExternalRuntimeControlError extends Error {
  readonly action: 'STOP' | 'KILL';

  constructor(action: 'STOP' | 'KILL') {
    super(`Runtime Instances ${action} retired the active Integration run.`);
    this.name = 'SmokeTestExternalRuntimeControlError';
    this.action = action;
  }
}

type PendingRequest = {
  operation: 'start' | 'refresh' | 'step' | 'recover' | 'excelWrite' | 'stop' | 'forceStop' | 'finish';
  requestId: string;
  responseOperation: string;
  resolve: (body: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export type SmokeTestIntegrationController = {
  phase: Phase;
  activeRun: SmokeTestIntegrationRun | null;
  error: string | null;
  refreshPage: () => Promise<string>;
  start: (
    plan: VariablesSmokeTestPlan,
    excelMode: ExcelDataMode,
    runtimeMode: SmokeTestIntegrationRuntimeMode,
    runtimeWrites: boolean,
    pagePolicy?: SmokeTestIntegrationPagePolicy,
  ) => Promise<SmokeTestIntegrationRun>;
  executeStep: (
    instructionId: number,
    excelRowIndex?: number,
    recoveryVerificationEnabled?: boolean,
  ) => Promise<SmokeTestIntegrationStepResult>;
  recoverStep: (
    sequence: number,
    instructionId: number,
    recoveryCandidateId: string,
    decision: SmokeTestLocatorRecoveryDecision,
  ) => Promise<SmokeTestLocatorRecoveryResult>;
  saveExcelWrite: (artifact: SmokeTestIntegrationExcelWriteArtifact) => Promise<string>;
  stop: (reason?: string) => Promise<void>;
  forceStop: () => Promise<SmokeTestIntegrationForceStopResult>;
  retireExternalRun: (runId: string, action: 'STOP' | 'KILL') => boolean;
  finish: () => Promise<void>;
};

type Arguments = {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly unknown[];
  messageGeneration?: number;
  sessionId: string;
  snapshot: VariableWorkspaceSnapshot | null;
  startContext?: Readonly<{ multiBatchId: string }>;
};

const bodyObject = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export const useSmokeTestIntegrationRun = ({
  webSocket,
  connected,
  messages,
  messageGeneration = 0,
  sessionId,
  snapshot,
  startContext,
}: Arguments): SmokeTestIntegrationController => {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [activeRun, setActiveRun] = useState<SmokeTestIntegrationRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRunRef = useRef<SmokeTestIntegrationRun | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);
  const processedMessagesRef = useRef(0);
  const processedMessageGenerationRef = useRef(messageGeneration);
  const requestSequenceRef = useRef(0);
  const stepSequenceRef = useRef(0);
  const generationRef = useRef(0);
  const terminalInFlightRef = useRef(false);

  const replaceRun = useCallback((run: SmokeTestIntegrationRun | null) => {
    activeRunRef.current = run;
    setActiveRun(run);
  }, []);

  const nextRequestId = useCallback((operation: string) => {
    requestSequenceRef.current += 1;
    return `${Date.now()}-smoke-integration-${operation}-${requestSequenceRef.current}`;
  }, []);

  const clearPending = useCallback((reason?: Error) => {
    const pending = pendingRef.current;
    if (pending === null) return;
    pendingRef.current = null;
    clearTimeout(pending.timeout);
    if (reason) pending.reject(reason);
  }, []);

  const request = useCallback(<T, B extends { requestId: string }>(
    operation: PendingRequest['operation'],
    responseOperation: string,
    body: B,
    timeoutMs: number,
    parse: (payload: unknown) => T,
  ): Promise<T> => {
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Smoke Test Integration is disconnected.'));
    }
    if (pendingRef.current !== null) {
      return Promise.reject(new Error('Wait for the current Integration request to finish.'));
    }
    const requestId = body.requestId;
    const generation = generationRef.current;
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const pending = pendingRef.current;
        if (pending?.requestId !== requestId) return;
        pendingRef.current = null;
        const timeoutError = new Error(
          `Smoke Test Integration ${operation} timed out. The instruction was not retried.`,
        );
        setError(timeoutError.message);
        setPhase(operation === 'start'
          ? 'IDLE'
          : operation === 'step'
            ? 'READY'
            : 'CLEANUP_REQUIRED');
        if (operation === 'start') replaceRun(null);
        reject(timeoutError);
      }, timeoutMs);
      const pendingRequest: PendingRequest = {
        operation,
        requestId,
        responseOperation,
        timeout,
        resolve: (payload) => {
          if (generation !== generationRef.current) {
            reject(new Error('The Integration run was replaced before the response arrived.'));
            return;
          }
          try {
            resolve(parse(payload));
          } catch (parseError) {
            reject(parseError instanceof Error
              ? parseError
              : new Error('Smoke Test Integration returned an invalid response.'));
          }
        },
        reject,
      };
      pendingRef.current = pendingRequest;
      try {
        webSocket.send(JSON.stringify({
          type: `smokeTest.integration.${operation}`,
          sessionId,
          homeBankingId: snapshot?.botJob.homeBankingId ?? -1,
          body: JSON.stringify(body),
        }));
      } catch (sendFailure) {
        if (pendingRef.current === pendingRequest) pendingRef.current = null;
        clearTimeout(timeout);
        reject(sendFailure instanceof Error
          ? sendFailure
          : new Error('Smoke Test Integration could not send its WebSocket request.'));
      }
    });
  }, [connected, replaceRun, sessionId, snapshot?.botJob.homeBankingId, webSocket]);

  useEffect(() => {
    if (processedMessageGenerationRef.current !== messageGeneration) {
      processedMessageGenerationRef.current = messageGeneration;
      processedMessagesRef.current = 0;
    }
    if (processedMessagesRef.current > messages.length) processedMessagesRef.current = 0;
    const unread = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;
    unread.forEach((raw) => {
      let envelope;
      try {
        envelope = parseVariablesWorkspaceMessage(String(raw));
      } catch (_) {
        return;
      }
      const pending = pendingRef.current;
      if (pending === null || envelope.operationId !== pending.responseOperation) return;
      const body = bodyObject(envelope.body);
      if (body?.requestId !== pending.requestId) return;
      pendingRef.current = null;
      clearTimeout(pending.timeout);
      pending.resolve(envelope.body);
    });
  }, [messageGeneration, messages]);

  useEffect(() => {
    if (connected) return;
    generationRef.current += 1;
    terminalInFlightRef.current = false;
    clearPending(new Error('Smoke Test Integration disconnected.'));
    replaceRun(null);
    setPhase('IDLE');
  }, [clearPending, connected, replaceRun]);

  useEffect(() => {
    generationRef.current += 1;
    terminalInFlightRef.current = false;
    clearPending(new Error('The Smoke Test Bot Job changed.'));
    replaceRun(null);
    setPhase('IDLE');
    stepSequenceRef.current = 0;
  }, [clearPending, replaceRun, snapshot?.bindingEpoch, snapshot?.botJob.id]);

  useEffect(() => () => {
    generationRef.current += 1;
    clearPending(new Error('Smoke Test Integration closed.'));
  }, [clearPending]);

  const start = useCallback(async (
    plan: VariablesSmokeTestPlan,
    excelMode: ExcelDataMode,
    runtimeMode: SmokeTestIntegrationRuntimeMode,
    runtimeWrites: boolean,
    pagePolicy: SmokeTestIntegrationPagePolicy = 'PRESERVE_ACTIVE',
  ) => {
    if (!snapshot) throw new Error('Smoke Test Integration has no authoritative workspace snapshot.');
    if (activeRunRef.current !== null) {
      const cleanupError = new Error(
        'The previous Integration run still requires Stop or Finish cleanup.',
      );
      setError(cleanupError.message);
      setPhase('CLEANUP_REQUIRED');
      throw cleanupError;
    }
    generationRef.current += 1;
    const startGeneration = generationRef.current;
    clearPending(new Error('A new Integration run replaced the pending request.'));
    replaceRun(null);
    setError(null);
    setPhase('STARTING');
    stepSequenceRef.current = 0;
    const requestId = nextRequestId('start');
    try {
      const baseBody = buildSmokeTestIntegrationStartRequest(
        requestId,
        plan,
        snapshot.bindingEpoch,
        snapshot.workspaceEpoch,
        excelMode,
        runtimeMode,
        runtimeWrites,
        pagePolicy,
      );
      const body = startContext === undefined
        ? baseBody
        : { ...baseBody, multiBatchId: startContext.multiBatchId };
      const run = await request(
        'start',
        'smokeTest.integration.startResponse',
        body,
        runtimeMode === 'TYPESCRIPT_PLAYWRIGHT_V2' ? V2_START_TIMEOUT_MS : START_TIMEOUT_MS,
        payload => parseSmokeTestIntegrationStartResponse(payload, requestId),
      );
      if (run.bindingEpoch !== snapshot.bindingEpoch
          || run.workspaceEpoch !== snapshot.workspaceEpoch
          || run.homeBankingId !== plan.homeBankingId
          || run.botJobId !== plan.botJobId
          || run.graphRevision !== plan.graphRevision
          || run.datasetMode !== excelMode
          || run.runtimeMode !== runtimeMode
          || run.pagePolicy !== pagePolicy
          || run.durableRuntimeWrites !== runtimeWrites) {
        throw new Error('Integration start response does not match the frozen Smoke Test request.');
      }
      replaceRun(run);
      setPhase('READY');
      return run;
    } catch (failure) {
      const nextError = failure instanceof Error ? failure : new Error('Integration could not start.');
      if (generationRef.current === startGeneration) {
        setError(nextError.message);
        replaceRun(null);
        setPhase('IDLE');
      }
      throw nextError;
    }
  }, [clearPending, nextRequestId, replaceRun, request, snapshot, startContext]);

  const refreshPage = useCallback(async () => {
    if (!snapshot) {
      throw new Error('Smoke Test has no authoritative workspace snapshot.');
    }
    if (activeRunRef.current !== null) {
      throw new Error('Stop or finish the Integration run before refreshing the web page.');
    }
    const requestId = nextRequestId('refresh');
    const body = buildSmokeTestIntegrationRefreshRequest(requestId, snapshot);
    setError(null);
    setPhase('REFRESHING');
    try {
      const message = await request(
        'refresh',
        'smokeTest.integration.refreshResponse',
        body,
        START_TIMEOUT_MS,
        payload => parseSmokeTestIntegrationRefreshResponse(payload, body),
      );
      setPhase('IDLE');
      return message;
    } catch (failure) {
      const nextError = failure instanceof Error
        ? failure
        : new Error('The Playwright web page could not be refreshed.');
      setError(nextError.message);
      setPhase('IDLE');
      throw nextError;
    }
  }, [nextRequestId, request, snapshot]);

  const executeStep = useCallback(async (
    instructionId: number,
    excelRowIndex = 0,
    recoveryVerificationEnabled = true,
  ) => {
    const run = activeRunRef.current;
    if (run === null) throw new Error('Smoke Test Integration has not started.');
    stepSequenceRef.current += 1;
    const sequence = stepSequenceRef.current;
    const requestId = nextRequestId('step');
    const body: SmokeTestIntegrationStepRequest = {
      contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
      requestId,
      runId: run.runId,
      sequence,
      instructionId,
      excelRowIndex,
      recoveryVerificationEnabled,
    };
    setPhase('EXECUTING');
    try {
      const result = await request(
        'step',
        'smokeTest.integration.stepResponse',
        body,
        STEP_TIMEOUT_MS,
        payload => parseSmokeTestIntegrationStepResponse(payload, {
          ...body,
          integrationEpoch: run.integrationEpoch,
        }),
      );
      if (!terminalInFlightRef.current) setPhase('READY');
      return result;
    } catch (failure) {
      const nextError = failure instanceof Error ? failure : new Error('Integration step failed.');
      if (nextError instanceof SmokeTestExternalRuntimeControlError) {
        setError(null);
        setPhase('IDLE');
        throw nextError;
      }
      setError(nextError.message);
      if (!terminalInFlightRef.current) setPhase('READY');
      throw nextError;
    }
  }, [nextRequestId, request]);

  const saveExcelWrite = useCallback(async (artifact: SmokeTestIntegrationExcelWriteArtifact) => {
    const run = activeRunRef.current;
    if (run === null) throw new Error('Smoke Test Integration has not started.');
    const requestId = nextRequestId('excel-write');
    return request(
      'excelWrite',
      'smokeTest.integration.excelWriteResponse',
      { contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION, requestId, runId: run.runId, ...artifact },
      STEP_TIMEOUT_MS,
      payload => parseSmokeTestIntegrationExcelWriteResponse(payload, requestId, run.runId, artifact.sha256),
    );
  }, [nextRequestId, request]);

  const recoverStep = useCallback(async (
    sequence: number,
    instructionId: number,
    recoveryCandidateId: string,
    decision: SmokeTestLocatorRecoveryDecision,
  ) => {
    const run = activeRunRef.current;
    if (run === null) throw new Error('Smoke Test Integration has not started.');
    const requestId = nextRequestId('recover');
    setPhase('EXECUTING');
    try {
      const result = await request(
        'recover',
        'smokeTest.integration.recoverResponse',
        {
          contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
          requestId,
          runId: run.runId,
          sequence,
          instructionId,
          recoveryCandidateId,
          decision,
        },
        STEP_TIMEOUT_MS,
        payload => parseSmokeTestLocatorRecoveryResponse(payload, {
          requestId,
          runId: run.runId,
          integrationEpoch: run.integrationEpoch,
          sequence,
          instructionId,
        }),
      );
      if (!terminalInFlightRef.current) setPhase('READY');
      return result;
    } catch (failure) {
      const nextError = failure instanceof Error ? failure : new Error('Locator recovery failed.');
      setError(nextError.message);
      if (!terminalInFlightRef.current) setPhase('READY');
      throw nextError;
    }
  }, [nextRequestId, request]);

  const terminal = useCallback(async (operation: 'stop' | 'finish', _reason?: string) => {
    if (terminalInFlightRef.current) return;
    const run = activeRunRef.current;
    if (run === null) return;
    terminalInFlightRef.current = true;
    generationRef.current += 1;
    clearPending(new Error(`Integration ${operation} cancelled the pending step.`));
    setPhase(operation === 'stop' ? 'STOPPING' : 'FINISHING');
    const requestId = nextRequestId(operation);
    const body = {
      contractVersion: SMOKE_TEST_INTEGRATION_CONTRACT_VERSION,
      requestId,
      runId: run.runId,
      ...(operation === 'finish' ? { lastSequence: stepSequenceRef.current } : {}),
    };
    try {
      await request(
        operation,
        `smokeTest.integration.${operation}Response`,
        body,
        TERMINAL_TIMEOUT_MS,
        payload => parseSmokeTestIntegrationTerminalResponse(
          payload,
          operation,
          requestId,
          run.runId,
          run.integrationEpoch,
        ),
      );
      setError(null);
      replaceRun(null);
      setPhase('IDLE');
    } catch (failure) {
      const nextError = failure instanceof Error
        ? failure
        : new Error(`Integration ${operation} cleanup was not acknowledged.`);
      setError(nextError.message);
      setPhase('CLEANUP_REQUIRED');
      throw nextError;
    } finally {
      terminalInFlightRef.current = false;
    }
  }, [clearPending, nextRequestId, replaceRun, request]);

  const stop = useCallback((reason?: string) => terminal('stop', reason), [terminal]);
  const forceStop = useCallback(async () => {
    if (!snapshot) throw new Error('Smoke Test has no authoritative workspace snapshot.');
    terminalInFlightRef.current = true;
    generationRef.current += 1;
    clearPending(new Error('Emergency Stop cancelled the pending Integration operation.'));
    setPhase('STOPPING');
    const requestId = nextRequestId('force-stop');
    const body = buildSmokeTestIntegrationForceStopRequest(requestId, snapshot);
    try {
      const result = await request(
        'forceStop',
        'smokeTest.integration.forceStopResponse',
        body,
        TERMINAL_TIMEOUT_MS,
        payload => parseSmokeTestIntegrationForceStopResponse(payload, body),
      );
      replaceRun(null);
      setError(null);
      setPhase('IDLE');
      return result;
    } catch (failure) {
      const nextError = failure instanceof Error
        ? failure
        : new Error('Emergency Stop was not acknowledged.');
      setError(nextError.message);
      setPhase('CLEANUP_REQUIRED');
      throw nextError;
    } finally {
      terminalInFlightRef.current = false;
    }
  }, [clearPending, nextRequestId, replaceRun, request, snapshot]);
  const retireExternalRun = useCallback((runId: string, action: 'STOP' | 'KILL') => {
    const current = activeRunRef.current;
    if (current === null || current.runId !== runId) return false;
    generationRef.current += 1;
    terminalInFlightRef.current = false;
    clearPending(new SmokeTestExternalRuntimeControlError(action));
    replaceRun(null);
    setError(null);
    setPhase('IDLE');
    return true;
  }, [clearPending, replaceRun]);
  const finish = useCallback(() => terminal('finish'), [terminal]);

  return {
    phase,
    activeRun,
    error,
    refreshPage,
    start,
    executeStep,
    recoverStep,
    saveExcelWrite,
    stop,
    forceStop,
    retireExternalRun,
    finish,
  };
};
