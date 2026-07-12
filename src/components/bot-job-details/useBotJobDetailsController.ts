import { useCallback, useEffect, useRef, useState } from 'react';
import { parseBotJobDetailsEnvelope, reduceBotJobDetailsState } from './BotJobDetails.contract';
import type {
  BotJobDetailsState,
  BotJobMetadataDraft,
  BotJobToolbarAction,
  BotJobToolbarPayload,
  BotJobWorkspaceAction,
  BotJobWorkspaceStatusTone,
} from './BotJobDetails.types';

interface ControllerOptions {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  enabled?: boolean;
}

export interface BotJobDetailsControllerState {
  state: BotJobDetailsState | null;
  loadingState: boolean;
  savingMetadata: boolean;
  fieldErrors: Record<string, string>;
  metadataSavedRevision: number | null;
  pendingAction: BotJobWorkspaceAction | null;
  pendingToolbarAction: BotJobToolbarAction | null;
  transferPath: string;
  status: string;
  statusTone: BotJobWorkspaceStatusTone;
  sendAction: (action: BotJobWorkspaceAction) => void;
  sendToolbarAction: (action: BotJobToolbarAction, payload?: BotJobToolbarPayload) => void;
  saveMetadata: (draft: BotJobMetadataDraft) => void;
  refreshEnvironments: () => void;
  retryBootstrap: () => void;
}

type PendingAction = { requestId: string; action: BotJobWorkspaceAction };
type PendingToolbarAction = { requestId: string; action: BotJobToolbarAction };
type PendingMetadata = { requestId: string; kind: 'save' | 'environments' };

const RESPONSE_TIMEOUT_MS = 10000;
const STATUS_RESET_MS = 3500;
const TOOLBAR_TIMEOUT_MS: Partial<Record<BotJobToolbarAction, number>> = {
  GENERATE_EXCEL: 120000,
  EXPORT_JOB: 120000,
  IMPORT_JOB: 120000,
  LAUNCH: 30000,
  TEST_RUN: 30000,
  STOP_TEST_RUN: 30000,
};
const USER_DRIVEN_TOOLBAR_ACTIONS = new Set<BotJobToolbarAction>([
  'CHOOSE_TRANSFER_PATH',
  'OPEN_REPORT',
]);
const METADATA_RESPONSE_OPERATIONS: Record<PendingMetadata['kind'], string> = {
  save: 'botJobDetails.metadata.updateResponse',
  environments: 'botJobDetails.environments.refreshResponse',
};

type TimerRef = { current: ReturnType<typeof setTimeout> | null };

function clearTimer(ref: TimerRef): void {
  if (ref.current) clearTimeout(ref.current);
  ref.current = null;
}

function isWorkspaceSurface(value: unknown): value is BotJobDetailsState['activeSurface'] {
  return value === 'botJob' || value === 'components' || value === 'preScan';
}

function parseLicenseStatusChanged(raw: string, expectedSessionId: string): boolean | null {
  try {
    const envelope = JSON.parse(raw);
    if (envelope?.sessionId !== expectedSessionId || envelope?.operationId !== 'license.statusChanged') {
      return null;
    }
    const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
    return typeof body?.active === 'boolean' ? body.active : null;
  } catch {
    return null;
  }
}

export function useBotJobDetailsController(options: ControllerOptions): BotJobDetailsControllerState {
  const {
    webSocket,
    connected,
    messages,
    sessionId,
    homeBankingId,
    botJobId,
    enabled = true,
  } = options;
  const processedMessagesRef = useRef(0);
  const requestSequenceRef = useRef(0);
  const bootstrapSocketRef = useRef<WebSocket | null>(null);
  const bootstrapRequestRef = useRef<string | null>(null);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const pendingToolbarActionRef = useRef<PendingToolbarAction | null>(null);
  const pendingMetadataRef = useRef<PendingMetadata | null>(null);
  const bootstrapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metadataTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<BotJobDetailsState | null>(null);
  const [loadingState, setLoadingState] = useState(enabled);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [metadataSavedRevision, setMetadataSavedRevision] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<BotJobWorkspaceAction | null>(null);
  const [pendingToolbarAction, setPendingToolbarAction] = useState<BotJobToolbarAction | null>(null);
  const [transferPath, setTransferPath] = useState('');
  const [status, setStatus] = useState(enabled ? 'Loading Bot Job details' : 'Ready');
  const [statusTone, setStatusTone] = useState<BotJobWorkspaceStatusTone>('neutral');

  const setTransientStatus = useCallback((message: string, tone: BotJobWorkspaceStatusTone) => {
    clearTimer(statusResetRef);
    setStatus(message);
    setStatusTone(tone);
    if (tone === 'success') {
      statusResetRef.current = setTimeout(() => {
        setStatus('Ready');
        setStatusTone('neutral');
      }, STATUS_RESET_MS);
    }
  }, []);

  const invalidateLicenseCapabilities = useCallback(() => {
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(toolbarTimeoutRef);
    clearTimer(metadataTimeoutRef);
    bootstrapRequestRef.current = null;
    pendingActionRef.current = null;
    pendingToolbarActionRef.current = null;
    pendingMetadataRef.current = null;
    setLoadingState(false);
    setPendingAction(null);
    setPendingToolbarAction(null);
    setSavingMetadata(false);
    setFieldErrors({});
    setState((current) => current ? {
      ...current,
      capabilities: {
        ...current.capabilities,
        canUseWorkspaceActions: false,
        canEditMetadata: false,
        canUsePreScan: false,
        canShowComponents: false,
        canExecute: false,
        canLaunch: false,
        canUseFileActions: false,
        canOpenOrganizations: false,
      },
    } : current);
  }, []);

  const requestId = useCallback((label: string) => {
    requestSequenceRef.current += 1;
    return `${Date.now()}-${requestSequenceRef.current}-${label}`;
  }, []);

  const send = useCallback((type: string, requestBody: Record<string, unknown>) => {
    if (!webSocket || !connected || webSocket.readyState !== WebSocket.OPEN) {
      throw new Error('Backend socket is not connected');
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      homeBankingId,
      body: JSON.stringify(requestBody),
    }));
  }, [connected, homeBankingId, sessionId, webSocket]);

  useEffect(() => {
    processedMessagesRef.current = messages.length;
    bootstrapSocketRef.current = null;
    bootstrapRequestRef.current = null;
    pendingActionRef.current = null;
    pendingToolbarActionRef.current = null;
    pendingMetadataRef.current = null;
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(toolbarTimeoutRef);
    clearTimer(metadataTimeoutRef);
    clearTimer(statusResetRef);
    setState(null);
    setPendingAction(null);
    setPendingToolbarAction(null);
    setTransferPath('');
    setSavingMetadata(false);
    setFieldErrors({});
    setMetadataSavedRevision(null);
    setLoadingState(enabled);
    setStatus(enabled ? 'Loading Bot Job details' : 'Ready');
    setStatusTone('neutral');
    // Messages are intentionally part of the reset cursor, but not an identity dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botJobId, enabled, sessionId]);

  const requestBootstrap = useCallback((force: boolean) => {
    if (!enabled || !connected || !webSocket || webSocket.readyState !== WebSocket.OPEN || !botJobId || botJobId <= 0) {
      return;
    }
    if (!force && bootstrapSocketRef.current === webSocket) return;
    clearTimer(bootstrapTimeoutRef);
    clearTimer(statusResetRef);
    const bootstrapRequestId = requestId('bootstrap');
    bootstrapSocketRef.current = webSocket;
    bootstrapRequestRef.current = bootstrapRequestId;
    setLoadingState(true);
    setStatus('Loading Bot Job details');
    setStatusTone('neutral');
    try {
      send('botJobDetails.bootstrap', { requestId: bootstrapRequestId, botJobId });
      bootstrapTimeoutRef.current = setTimeout(() => {
        if (bootstrapRequestRef.current !== bootstrapRequestId) return;
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        setTransientStatus('The backend did not return Bot Job details', 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      bootstrapSocketRef.current = null;
      bootstrapRequestRef.current = null;
      setLoadingState(false);
      setTransientStatus(error instanceof Error ? error.message : 'Could not load Bot Job details', 'error');
    }
  }, [botJobId, connected, enabled, requestId, send, setTransientStatus, webSocket]);

  useEffect(() => {
    requestBootstrap(false);
  }, [requestBootstrap]);

  useEffect(() => {
    if (!enabled || !botJobId || botJobId <= 0) return;
    if (processedMessagesRef.current > messages.length) processedMessagesRef.current = 0;
    const nextMessages = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    nextMessages.forEach((raw) => {
      const licenseActive = parseLicenseStatusChanged(raw, sessionId);
      if (licenseActive !== null) {
        if (licenseActive) {
          requestBootstrap(true);
        } else {
          invalidateLicenseCapabilities();
          setTransientStatus('License activation is required for Bot Job actions', 'error');
        }
        return;
      }

      const envelope = parseBotJobDetailsEnvelope(raw, sessionId, botJobId);
      if (!envelope) return;
      const { operationId, body } = envelope;

      if (operationId === 'botJobDetails.state') {
        if (body.state) {
          setState((current) => reduceBotJobDetailsState(current, body.state));
        }
        return;
      }

      if (operationId === 'botJobDetails.bootstrapResponse') {
        if (!bootstrapRequestRef.current || body.requestId !== bootstrapRequestRef.current) return;
        clearTimer(bootstrapTimeoutRef);
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        if (body.state) {
          setState((current) => {
            if (current && body.state!.revision < current.revision) return current;
            return body.state!;
          });
        }
        if (body.ok === false) {
          if (body.errorCode === 'LICENSE_REQUIRED') invalidateLicenseCapabilities();
          setTransientStatus(body.message || 'Unable to load Bot Job details', 'error');
        } else {
          setTransientStatus(body.message || 'Bot Job details loaded', 'success');
        }
        return;
      }

      if (operationId === 'botJobDetails.actionResponse') {
        const pending = pendingActionRef.current;
        const actionMatches = body.action === pending?.action
          || (body.ok === false && body.action == null);
        if (!pending || body.requestId !== pending.requestId || !actionMatches) return;
        clearTimer(actionTimeoutRef);
        pendingActionRef.current = null;
        setPendingAction(null);
        if (body.state) {
          setState((current) => reduceBotJobDetailsState(current, body.state));
        }
        const activeSurface = body.activeSurface;
        if (body.ok !== false && isWorkspaceSurface(activeSurface)) {
          setState((current) => current ? {
            ...current,
            activeSurface,
            componentsVisible: body.componentsVisible === true,
          } : current);
        }
        setTransientStatus(
          body.message || (body.ok === false ? 'Action failed' : 'Action accepted'),
          body.ok === false ? 'error' : 'success',
        );
        if (body.errorCode === 'LICENSE_REQUIRED') invalidateLicenseCapabilities();
        return;
      }

      if (operationId === 'botJobDetails.toolbar.actionResponse') {
        const pending = pendingToolbarActionRef.current;
        const actionMatches = body.action === pending?.action
          || (body.ok === false && body.action == null);
        if (!pending || body.requestId !== pending.requestId || !actionMatches) return;
        clearTimer(toolbarTimeoutRef);
        pendingToolbarActionRef.current = null;
        setPendingToolbarAction(null);
        if (body.state) {
          setState((current) => reduceBotJobDetailsState(current, body.state));
        }
        if (typeof body.selectedPath === 'string' && body.selectedPath.trim()) {
          setTransferPath(body.selectedPath);
        }
        setTransientStatus(
          body.message || (body.ok === false ? 'Toolbar action failed' : 'Toolbar action completed'),
          body.ok === false ? 'error' : 'success',
        );
        if (body.errorCode === 'LICENSE_REQUIRED') invalidateLicenseCapabilities();
        return;
      }

      const pending = pendingMetadataRef.current;
      if (
        !pending ||
        body.requestId !== pending.requestId ||
        operationId !== METADATA_RESPONSE_OPERATIONS[pending.kind]
      ) return;
      clearTimer(metadataTimeoutRef);
      pendingMetadataRef.current = null;
      setSavingMetadata(false);
      setFieldErrors(body.fieldErrors || {});
      if (body.state) {
        setState((current) => reduceBotJobDetailsState(current, body.state));
      }
      if (body.ok === false) {
        if (body.errorCode === 'LICENSE_REQUIRED') invalidateLicenseCapabilities();
        if (
          operationId === 'botJobDetails.metadata.updateResponse'
          && body.errorCode === 'DESKTOP_STATE_SYNC_FAILED'
          && body.state
        ) {
          setMetadataSavedRevision(body.state.metadataRevision);
        }
        setTransientStatus(body.message || 'Bot Job details were not saved', 'error');
      } else {
        if (operationId === 'botJobDetails.metadata.updateResponse' && body.state) {
          setMetadataSavedRevision(body.state.metadataRevision);
        }
        setTransientStatus(body.message || 'Bot Job details updated', 'success');
      }
    });
  }, [botJobId, enabled, invalidateLicenseCapabilities, messages, requestBootstrap, sessionId, setTransientStatus]);

  useEffect(() => {
    if (!enabled) return;
    if (!connected) {
      clearTimer(bootstrapTimeoutRef);
      clearTimer(actionTimeoutRef);
      clearTimer(toolbarTimeoutRef);
      clearTimer(metadataTimeoutRef);
      clearTimer(statusResetRef);
      bootstrapSocketRef.current = null;
      bootstrapRequestRef.current = null;
      pendingActionRef.current = null;
      pendingToolbarActionRef.current = null;
      pendingMetadataRef.current = null;
      setPendingAction(null);
      setPendingToolbarAction(null);
      setSavingMetadata(false);
      setLoadingState(true);
      setStatus('Waiting for backend connection');
      setStatusTone('warning');
    } else if (status === 'Waiting for backend connection') {
      setStatus('Loading Bot Job details');
      setStatusTone('neutral');
    }
  }, [connected, enabled, status]);

  useEffect(() => () => {
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(toolbarTimeoutRef);
    clearTimer(metadataTimeoutRef);
    clearTimer(statusResetRef);
  }, []);

  const sendAction = useCallback((action: BotJobWorkspaceAction) => {
    if (!enabled || !botJobId || botJobId <= 0) {
      setTransientStatus('Bot Job identity is unavailable', 'error');
      return;
    }
    const operationPending = Boolean(
      pendingActionRef.current || pendingToolbarActionRef.current || pendingMetadataRef.current,
    );
    if (operationPending && action !== 'CLOSE') {
      setTransientStatus('Wait for the current Bot Job operation to finish', 'warning');
      return;
    }
    if (action === 'CLOSE' && operationPending) {
      clearTimer(actionTimeoutRef);
      clearTimer(toolbarTimeoutRef);
      clearTimer(metadataTimeoutRef);
      pendingActionRef.current = null;
      pendingToolbarActionRef.current = null;
      pendingMetadataRef.current = null;
      setPendingAction(null);
      setPendingToolbarAction(null);
      setSavingMetadata(false);
    }
    const actionRequestId = requestId(action.toLowerCase());
    clearTimer(actionTimeoutRef);
    clearTimer(statusResetRef);
    pendingActionRef.current = { requestId: actionRequestId, action };
    setPendingAction(action);
    setStatus(`Sending ${action.toLowerCase().replaceAll('_', ' ')}…`);
    setStatusTone('neutral');
    try {
      send('botJobDetails.action', { action, botJobId, requestId: actionRequestId });
      actionTimeoutRef.current = setTimeout(() => {
        if (pendingActionRef.current?.requestId !== actionRequestId) return;
        pendingActionRef.current = null;
        setPendingAction(null);
        setTransientStatus('The backend did not acknowledge the action', 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      pendingActionRef.current = null;
      setPendingAction(null);
      setTransientStatus(error instanceof Error ? error.message : 'Could not send the workspace action', 'error');
    }
  }, [botJobId, enabled, requestId, send, setTransientStatus]);

  const sendToolbarAction = useCallback((
    action: BotJobToolbarAction,
    payload: BotJobToolbarPayload = {},
  ) => {
    if (!enabled || !botJobId || botJobId <= 0) {
      setTransientStatus('Bot Job identity is unavailable', 'error');
      return;
    }
    const stopDuringStartup = action === 'STOP_TEST_RUN'
      && pendingToolbarActionRef.current?.action === 'TEST_RUN'
      && !pendingActionRef.current
      && !pendingMetadataRef.current;
    if ((pendingActionRef.current || pendingToolbarActionRef.current || pendingMetadataRef.current)
      && !stopDuringStartup) {
      setTransientStatus('Wait for the current Bot Job operation to finish', 'warning');
      return;
    }
    if (stopDuringStartup) {
      clearTimer(toolbarTimeoutRef);
      pendingToolbarActionRef.current = null;
      setPendingToolbarAction(null);
    }
    const toolbarRequestId = requestId(action.toLowerCase());
    clearTimer(toolbarTimeoutRef);
    clearTimer(statusResetRef);
    pendingToolbarActionRef.current = { requestId: toolbarRequestId, action };
    setPendingToolbarAction(action);
    setStatus(`Running ${action.toLowerCase().replaceAll('_', ' ')}…`);
    setStatusTone('neutral');
    try {
      send('botJobDetails.toolbar.action', {
        ...payload,
        action,
        botJobId,
        requestId: toolbarRequestId,
      });
      if (!USER_DRIVEN_TOOLBAR_ACTIONS.has(action)) {
        toolbarTimeoutRef.current = setTimeout(() => {
          if (pendingToolbarActionRef.current?.requestId !== toolbarRequestId) return;
          pendingToolbarActionRef.current = null;
          setPendingToolbarAction(null);
          setTransientStatus('The backend did not finish the toolbar action', 'error');
        }, TOOLBAR_TIMEOUT_MS[action] ?? RESPONSE_TIMEOUT_MS);
      }
    } catch (error) {
      pendingToolbarActionRef.current = null;
      setPendingToolbarAction(null);
      setTransientStatus(error instanceof Error ? error.message : 'Could not run the toolbar action', 'error');
    }
  }, [botJobId, enabled, requestId, send, setTransientStatus]);

  const sendMetadataRequest = useCallback((
    type: 'botJobDetails.metadata.update' | 'botJobDetails.environments.refresh',
    kind: PendingMetadata['kind'],
    payload: Record<string, unknown>,
  ) => {
    if (!enabled || !botJobId || botJobId <= 0) {
      setTransientStatus('Bot Job identity is unavailable', 'error');
      return;
    }
    if (pendingActionRef.current || pendingToolbarActionRef.current || pendingMetadataRef.current) {
      setTransientStatus('Wait for the current Bot Job operation to finish', 'warning');
      return;
    }
    const metadataRequestId = requestId(kind);
    clearTimer(metadataTimeoutRef);
    clearTimer(statusResetRef);
    pendingMetadataRef.current = { requestId: metadataRequestId, kind };
    setSavingMetadata(true);
    setFieldErrors({});
    setMetadataSavedRevision(null);
    try {
      send(type, { ...payload, botJobId, requestId: metadataRequestId });
      metadataTimeoutRef.current = setTimeout(() => {
        if (pendingMetadataRef.current?.requestId !== metadataRequestId) return;
        pendingMetadataRef.current = null;
        setSavingMetadata(false);
        setTransientStatus('The backend did not acknowledge the metadata request', 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      pendingMetadataRef.current = null;
      setSavingMetadata(false);
      setTransientStatus(error instanceof Error ? error.message : 'Could not update Bot Job details', 'error');
    }
  }, [botJobId, enabled, requestId, send, setTransientStatus]);

  const saveMetadata = useCallback((draft: BotJobMetadataDraft) => {
    if (!state) {
      setTransientStatus('Bot Job details are still loading', 'warning');
      return;
    }
    sendMetadataRequest('botJobDetails.metadata.update', 'save', {
      expectedMetadataRevision: draft.expectedMetadataRevision,
      name: draft.name,
      description: draft.description,
      homeUrlId: draft.homeUrlId,
    });
  }, [sendMetadataRequest, setTransientStatus, state]);

  const refreshEnvironments = useCallback(() => {
    sendMetadataRequest('botJobDetails.environments.refresh', 'environments', {});
  }, [sendMetadataRequest]);

  const retryBootstrap = useCallback(() => {
    requestBootstrap(true);
  }, [requestBootstrap]);

  return {
    state,
    loadingState,
    savingMetadata,
    fieldErrors,
    metadataSavedRevision,
    pendingAction,
    pendingToolbarAction,
    transferPath,
    status,
    statusTone,
    sendAction,
    sendToolbarAction,
    saveMetadata,
    refreshEnvironments,
    retryBootstrap,
  };
}
