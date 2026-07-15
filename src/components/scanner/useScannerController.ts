import { useCallback, useEffect, useRef, useState } from 'react';
import { canRequestScannerAction } from './Scanner.actionRequest';
import { scannerActionResponseStatus } from './Scanner.actionResponse';
import { scannerActionPendingStatus } from './Scanner.actionStatus';
import {
  isMatchingScannerBootstrapResponse,
  scannerBootstrapResponseStatus,
} from './Scanner.bootstrapResponse';
import { canRequestScannerBootstrap } from './Scanner.bootstrapRequest';
import { scannerControllerResetState } from './Scanner.controllerState';
import {
  SCANNER_ACTION_SEND_FAILURE_MESSAGE,
  SCANNER_ACTION_TIMEOUT_MESSAGE,
  SCANNER_BOOTSTRAP_SEND_FAILURE_MESSAGE,
  SCANNER_BOOTSTRAP_TIMEOUT_MESSAGE,
  SCANNER_SOCKET_DISCONNECTED_MESSAGE,
  scannerErrorMessage,
} from './Scanner.controllerStatus';
import { parseScannerEnvelope, reduceScannerState } from './Scanner.contract';
import { scannerPendingMessages } from './Scanner.messageCursor';
import {
  SCANNER_ACTION_COMMAND,
  SCANNER_ACTION_RESPONSE,
  SCANNER_BOOTSTRAP_COMMAND,
  SCANNER_BOOTSTRAP_RESPONSE,
  SCANNER_STATE_EVENT,
} from './Scanner.operations';
import { scannerRequestId } from './Scanner.requestId';
import { isMatchingScannerActionResponse } from './Scanner.responseMatching';
import { scannerTransportMessage } from './Scanner.transport';
import type { PendingScannerAction } from './Scanner.responseMatching';
import type { ScannerAction, ScannerActionPayload, ScannerState, ScannerStatusTone } from './Scanner.types';

interface ControllerOptions {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  enabled?: boolean;
}

export interface ScannerControllerState {
  state: ScannerState | null;
  loadingState: boolean;
  pendingAction: ScannerAction | null;
  completedAction: ScannerAction | null;
  status: string;
  statusTone: ScannerStatusTone;
  sendAction: (action: ScannerAction, payload?: ScannerActionPayload) => void;
  retryBootstrap: () => void;
}

const RESPONSE_TIMEOUT_MS = 10000;
const STATUS_RESET_MS = 3500;

function clearTimer(ref: { current: ReturnType<typeof setTimeout> | null }): void {
  if (ref.current) clearTimeout(ref.current);
  ref.current = null;
}

export function useScannerController(options: ControllerOptions): ScannerControllerState {
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
  const pendingActionRef = useRef<PendingScannerAction | null>(null);
  const bootstrapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetState = scannerControllerResetState(enabled);
  const [state, setState] = useState<ScannerState | null>(null);
  const [loadingState, setLoadingState] = useState(resetState.loadingState);
  const [pendingAction, setPendingAction] = useState<ScannerAction | null>(null);
  const [completedAction, setCompletedAction] = useState<ScannerAction | null>(null);
  const [status, setStatus] = useState(resetState.status);
  const [statusTone, setStatusTone] = useState<ScannerStatusTone>(resetState.statusTone);

  const setTransientStatus = useCallback((message: string, tone: ScannerStatusTone) => {
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

  const requestId = useCallback((label: string) => {
    requestSequenceRef.current += 1;
    return scannerRequestId(Date.now(), requestSequenceRef.current, label);
  }, []);

  const send = useCallback((type: string, requestBody: Record<string, unknown>) => {
    if (!webSocket || !connected || webSocket.readyState !== WebSocket.OPEN) {
      throw new Error(SCANNER_SOCKET_DISCONNECTED_MESSAGE);
    }
    webSocket.send(scannerTransportMessage(type, sessionId, homeBankingId, requestBody));
  }, [connected, homeBankingId, sessionId, webSocket]);

  useEffect(() => {
    processedMessagesRef.current = messages.length;
    bootstrapSocketRef.current = null;
    bootstrapRequestRef.current = null;
    pendingActionRef.current = null;
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(statusResetRef);
    setState(null);
    setPendingAction(null);
    setCompletedAction(null);
    setLoadingState(resetState.loadingState);
    setStatus(resetState.status);
    setStatusTone(resetState.statusTone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botJobId, enabled, sessionId]);

  const requestBootstrap = useCallback((force: boolean) => {
    if (!canRequestScannerBootstrap({
      enabled,
      connected,
      socketReadyState: webSocket?.readyState ?? null,
      openReadyState: WebSocket.OPEN,
      botJobId,
      force,
      alreadyBootstrappedOnSocket: bootstrapSocketRef.current === webSocket,
    })) return;
    clearTimer(bootstrapTimeoutRef);
    const bootstrapRequestId = requestId('bootstrap');
    bootstrapSocketRef.current = webSocket;
    bootstrapRequestRef.current = bootstrapRequestId;
    setLoadingState(true);
    setStatus('Loading scanner state');
    setStatusTone('neutral');
    try {
      send(SCANNER_BOOTSTRAP_COMMAND, { requestId: bootstrapRequestId, botJobId });
      bootstrapTimeoutRef.current = setTimeout(() => {
        if (bootstrapRequestRef.current !== bootstrapRequestId) return;
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        setTransientStatus(SCANNER_BOOTSTRAP_TIMEOUT_MESSAGE, 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      bootstrapSocketRef.current = null;
      bootstrapRequestRef.current = null;
      setLoadingState(false);
      setTransientStatus(scannerErrorMessage(error, SCANNER_BOOTSTRAP_SEND_FAILURE_MESSAGE), 'error');
    }
  }, [botJobId, connected, enabled, requestId, send, setTransientStatus, webSocket]);

  useEffect(() => {
    requestBootstrap(false);
  }, [requestBootstrap]);

  useEffect(() => {
    if (!enabled || !botJobId || botJobId <= 0) return;
    const cursor = scannerPendingMessages(messages, processedMessagesRef.current);
    processedMessagesRef.current = cursor.nextProcessedCount;
    cursor.pendingMessages.forEach((raw) => {
      const envelope = parseScannerEnvelope(raw, sessionId, botJobId);
      if (!envelope) return;
      const { operationId, body } = envelope;
      if (operationId === SCANNER_STATE_EVENT) {
        setState((current) => reduceScannerState(current, body.state));
        return;
      }
      if (operationId === SCANNER_BOOTSTRAP_RESPONSE) {
        if (!isMatchingScannerBootstrapResponse(body, bootstrapRequestRef.current)) return;
        clearTimer(bootstrapTimeoutRef);
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        if (body.ok && body.state) {
          setState((current) => reduceScannerState(current, body.state));
        }
        const nextStatus = scannerBootstrapResponseStatus(body);
        setTransientStatus(nextStatus.message, nextStatus.tone);
        return;
      }
      if (operationId === SCANNER_ACTION_RESPONSE) {
        if (!isMatchingScannerActionResponse(body, pendingActionRef.current)) return;
        clearTimer(actionTimeoutRef);
        pendingActionRef.current = null;
        setPendingAction(null);
        if (body.ok && body.state) {
          setState((current) => reduceScannerState(current, body.state));
          setCompletedAction(body.action || null);
        } else {
          setCompletedAction(null);
        }
        const nextStatus = scannerActionResponseStatus(body);
        setTransientStatus(nextStatus.message, nextStatus.tone);
      }
    });
  }, [botJobId, enabled, messages, sessionId, setTransientStatus]);

  const sendAction = useCallback((action: ScannerAction, payload: ScannerActionPayload = {}) => {
    if (!canRequestScannerAction({
      enabled,
      botJobId,
      hasPendingAction: Boolean(pendingActionRef.current),
    })) return;
    clearTimer(actionTimeoutRef);
    const actionRequestId = requestId(action.toLowerCase());
    pendingActionRef.current = { requestId: actionRequestId, action };
    setPendingAction(action);
    setCompletedAction(null);
    setStatus(scannerActionPendingStatus(action));
    setStatusTone('neutral');
    try {
      send(SCANNER_ACTION_COMMAND, { ...payload, action, botJobId, requestId: actionRequestId });
      actionTimeoutRef.current = setTimeout(() => {
        if (pendingActionRef.current?.requestId !== actionRequestId) return;
        pendingActionRef.current = null;
        setPendingAction(null);
        setTransientStatus(SCANNER_ACTION_TIMEOUT_MESSAGE, 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      pendingActionRef.current = null;
      setPendingAction(null);
      setTransientStatus(scannerErrorMessage(error, SCANNER_ACTION_SEND_FAILURE_MESSAGE), 'error');
    }
  }, [botJobId, enabled, requestId, send, setTransientStatus]);

  useEffect(() => () => {
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(statusResetRef);
  }, []);

  return {
    state,
    loadingState,
    pendingAction,
    completedAction,
    status,
    statusTone,
    sendAction,
    retryBootstrap: () => requestBootstrap(true),
  };
}
