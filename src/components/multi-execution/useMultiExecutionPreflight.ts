import { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeVariablesWorkspaceSnapshot,
  type VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';

export type MultiExecutionDataMode = 'REAL' | 'SYNTHETIC';

export type MultiExecutionPreflightJob = {
  botJobId: number;
  homeBankingId: number;
  excelMode: MultiExecutionDataMode;
  ok: boolean;
  ready: boolean;
  botJobName: string;
  organizationName: string;
  planRevision: string;
  blockCount: number;
  instructionCount: number;
  endpointReady: boolean;
  runtimeConfigured: boolean;
  unsupportedActions: readonly string[];
  message: string;
  workspaceSnapshot: VariableWorkspaceSnapshot | null;
  datasetSnapshot: MultiExecutionDatasetSnapshot | null;
};

export type MultiExecutionDatasetSnapshot = {
  mode: MultiExecutionDataMode;
  datasetEpoch: number;
  datasetRevision: number;
  contentRevision: string;
  rowCount: number;
  blocks: readonly unknown[];
};

export type MultiExecutionPreflightState = {
  status: 'IDLE' | 'CHECKING' | 'READY' | 'BLOCKED' | 'FAILED';
  message: string;
  runtimeConfigured: boolean;
  maxParallelism: number;
  jobs: ReadonlyMap<number, MultiExecutionPreflightJob>;
  batchId: string;
};

type Draft = {
  id: number;
  homeBankingId?: number | null;
};

type Options = {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  messageGeneration: number;
  selectedJobs: readonly Draft[];
  modes: ReadonlyMap<number, MultiExecutionDataMode>;
};

const initialState: MultiExecutionPreflightState = {
  status: 'IDLE',
  message: 'Run preflight to validate every selected Bot Job.',
  runtimeConfigured: false,
  maxParallelism: 5,
  jobs: new Map(),
  batchId: '',
};

const parsedBody = (raw: string): { operation: string; body: any } => {
  const envelope = JSON.parse(raw);
  const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
  return { operation: String(envelope.operationId || envelope.type || ''), body: body ?? {} };
};

const finiteInteger = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
};

const parsedJob = (value: any): MultiExecutionPreflightJob | null => {
  const botJobId = finiteInteger(value?.botJobId);
  const homeBankingId = finiteInteger(value?.homeBankingId);
  const excelMode = value?.excelMode === 'SYNTHETIC' ? 'SYNTHETIC' : 'REAL';
  if (botJobId <= 0 || homeBankingId <= 0) return null;
  const unsupportedActions = Array.isArray(value?.unsupportedActions)
    ? value.unsupportedActions.map(String).filter(Boolean)
    : [];
  const workspaceSnapshot = normalizeVariablesWorkspaceSnapshot(value?.workspaceSnapshot);
  const dataset = value?.datasetSnapshot;
  const contentRevision = String(dataset?.contentRevision || '');
  const datasetSnapshot: MultiExecutionDatasetSnapshot | null = dataset
    && (dataset.mode === 'REAL' || dataset.mode === 'SYNTHETIC')
    && Number.isSafeInteger(Number(dataset.datasetEpoch))
    && Number(dataset.datasetEpoch) > 0
    && Number.isSafeInteger(Number(dataset.datasetRevision))
    && Number(dataset.datasetRevision) > 0
    && /^[a-f0-9]{64}$/i.test(contentRevision)
    && Number.isSafeInteger(Number(dataset.rowCount))
    && Number(dataset.rowCount) >= 0
    && Array.isArray(dataset.blocks)
    ? Object.freeze({
        mode: dataset.mode as MultiExecutionDataMode,
        datasetEpoch: Number(dataset.datasetEpoch),
        datasetRevision: Number(dataset.datasetRevision),
        contentRevision: contentRevision.toLocaleLowerCase(),
        rowCount: Number(dataset.rowCount),
        blocks: Object.freeze([...dataset.blocks]),
      })
    : null;
  return Object.freeze({
    botJobId,
    homeBankingId,
    excelMode,
    ok: value?.ok === true,
    ready: value?.ready === true,
    botJobName: String(value?.botJobName || ''),
    organizationName: String(value?.organizationName || ''),
    planRevision: String(value?.planRevision || ''),
    blockCount: Math.max(0, finiteInteger(value?.blockCount)),
    instructionCount: Math.max(0, finiteInteger(value?.instructionCount)),
    endpointReady: value?.endpointReady === true,
    runtimeConfigured: value?.runtimeConfigured === true,
    unsupportedActions: Object.freeze(unsupportedActions),
    message: String(value?.message || 'Preflight did not return a diagnostic.'),
    workspaceSnapshot,
    datasetSnapshot,
  });
};

export const useMultiExecutionPreflight = ({
  webSocket,
  connected,
  messages,
  messageGeneration,
  selectedJobs,
  modes,
}: Options) => {
  const [state, setState] = useState<MultiExecutionPreflightState>(initialState);
  const pendingRequestRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const cursorRef = useRef(messages.length);
  const generationRef = useRef(messageGeneration);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const invalidate = useCallback(() => {
    pendingRequestRef.current = null;
    clearTimeoutRef();
    setState(initialState);
  }, [clearTimeoutRef]);

  const runPreflight = useCallback(() => {
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setState({ ...initialState, status: 'FAILED', message: 'Main Dashboard is disconnected.' });
      return;
    }
    const requestId = `multi-preflight-${Date.now()}-${crypto.randomUUID()}`;
    const jobs = selectedJobs.map(job => ({
      botJobId: job.id,
      homeBankingId: Number(job.homeBankingId),
      excelMode: modes.get(job.id) ?? 'REAL',
    }));
    if (jobs.some(job => !Number.isSafeInteger(job.homeBankingId) || job.homeBankingId <= 0)) {
      setState({ ...initialState, status: 'FAILED', message: 'A selected Bot Job has no valid organization owner.' });
      return;
    }
    pendingRequestRef.current = requestId;
    setState({ ...initialState, status: 'CHECKING', message: 'Validating selected Bot Jobs…' });
    try {
      webSocket.send(JSON.stringify({
        type: 'mainDashboard.multiExecution.preflight',
        sessionId: 'mainDashboard',
        body: JSON.stringify({ contractVersion: 1, requestId, jobs }),
      }));
    } catch (failure) {
      pendingRequestRef.current = null;
      setState({
        ...initialState,
        status: 'FAILED',
        message: failure instanceof Error ? failure.message : 'Multi-run preflight could not be sent.',
      });
      return;
    }
    clearTimeoutRef();
    timeoutRef.current = window.setTimeout(() => {
      if (pendingRequestRef.current !== requestId) return;
      pendingRequestRef.current = null;
      setState({ ...initialState, status: 'FAILED', message: 'Multi-run preflight timed out.' });
    }, 30_000);
  }, [clearTimeoutRef, connected, modes, selectedJobs, webSocket]);

  useEffect(() => {
    if (generationRef.current !== messageGeneration) {
      generationRef.current = messageGeneration;
      cursorRef.current = 0;
    } else if (cursorRef.current > messages.length) {
      cursorRef.current = 0;
    }
    const unread = messages.slice(cursorRef.current);
    cursorRef.current = messages.length;
    unread.forEach(raw => {
      try {
        const { operation, body } = parsedBody(raw);
        if (operation !== 'mainDashboard.multiExecution.preflightResponse') return;
        if (!pendingRequestRef.current || body?.requestId !== pendingRequestRef.current) return;
        pendingRequestRef.current = null;
        clearTimeoutRef();
        const parsedJobs: MultiExecutionPreflightJob[] = Array.isArray(body?.jobs)
          ? body.jobs.map(parsedJob).filter((job: MultiExecutionPreflightJob | null): job is MultiExecutionPreflightJob => job !== null)
          : [];
        const jobsById = new Map<number, MultiExecutionPreflightJob>(
          parsedJobs.map(job => [job.botJobId, job] as const),
        );
        const complete = parsedJobs.length === selectedJobs.length
          && selectedJobs.every(job => jobsById.has(job.id));
        const batchId = String(body?.batchId || '');
        const prepared = complete && parsedJobs.every(job => job.workspaceSnapshot !== null
          && job.datasetSnapshot !== null
          && job.datasetSnapshot.mode === job.excelMode);
        const ready = body?.ok === true && body?.ready === true && prepared
          && /^[a-f0-9-]{36}$/i.test(batchId);
        setState({
          status: ready ? 'READY' : body?.ok === true ? 'BLOCKED' : 'FAILED',
          message: complete
            ? String(body?.message || (ready ? 'Preflight ready.' : 'Preflight blocked.'))
            : 'Preflight returned an incomplete selected-job result.',
          runtimeConfigured: body?.runtimeConfigured === true,
          maxParallelism: Math.max(1, Math.min(5, finiteInteger(body?.maxParallelism, 5))),
          jobs: jobsById,
          batchId: ready ? batchId : '',
        });
      } catch (_) {
        // Unrelated or malformed workspace messages cannot settle this correlated request.
      }
    });
  }, [clearTimeoutRef, messageGeneration, messages, selectedJobs]);

  useEffect(() => () => clearTimeoutRef(), [clearTimeoutRef]);

  return { state, runPreflight, invalidate };
};
