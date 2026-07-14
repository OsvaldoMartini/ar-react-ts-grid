import { useCallback, useEffect, useRef, useState } from 'react';
import { parseScannerEnvelope, reduceScannerState } from './Scanner.contract';
import type { ScannerAction, ScannerState, ScannerStatusTone } from './Scanner.types';

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
  sendAction: (action: ScannerAction) => void;
  retryBootstrap: () => void;
}

type PendingAction = { requestId: string; action: ScannerAction };

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
  const pendingActionRef = useRef<PendingAction | null>(null);
  const bootstrapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<ScannerState | null>(null);
  const [loadingState, setLoadingState] = useState(enabled);
  const [pendingAction, setPendingAction] = useState<ScannerAction | null>(null);
  const [completedAction, setCompletedAction] = useState<ScannerAction | null>(null);
  const [status, setStatus] = useState(enabled ? 'Loading scanner state' : 'Ready');
  const [statusTone, setStatusTone] = useState<ScannerStatusTone>('neutral');

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
    return `${Date.now()}-${requestSequenceRef.current}-scanner-${label}`;
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
    clearTimer(bootstrapTimeoutRef);
    clearTimer(actionTimeoutRef);
    clearTimer(statusResetRef);
    setState(null);
    setPendingAction(null);
    setCompletedAction(null);
    setLoadingState(enabled);
    setStatus(enabled ? 'Loading scanner state' : 'Ready');
    setStatusTone('neutral');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botJobId, enabled, sessionId]);

  const requestBootstrap = useCallback((force: boolean) => {
    if (!enabled || !connected || !webSocket || webSocket.readyState !== WebSocket.OPEN || !botJobId || botJobId <= 0) {
      return;
    }
    if (!force && bootstrapSocketRef.current === webSocket) return;
    clearTimer(bootstrapTimeoutRef);
    const bootstrapRequestId = requestId('bootstrap');
    bootstrapSocketRef.current = webSocket;
    bootstrapRequestRef.current = bootstrapRequestId;
    setLoadingState(true);
    setStatus('Loading scanner state');
    setStatusTone('neutral');
    try {
      send('scanner.bootstrap', { requestId: bootstrapRequestId, botJobId });
      bootstrapTimeoutRef.current = setTimeout(() => {
        if (bootstrapRequestRef.current !== bootstrapRequestId) return;
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        setTransientStatus('The backend did not return scanner state', 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      bootstrapSocketRef.current = null;
      bootstrapRequestRef.current = null;
      setLoadingState(false);
      setTransientStatus(error instanceof Error ? error.message : 'Could not load scanner state', 'error');
    }
  }, [botJobId, connected, enabled, requestId, send, setTransientStatus, webSocket]);

  useEffect(() => {
    requestBootstrap(false);
  }, [requestBootstrap]);

  useEffect(() => {
    if (!enabled || !botJobId || botJobId <= 0) return;
    if (processedMessagesRef.current > messages.length) processedMessagesRef.current = 0;
    const pending = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;
    pending.forEach((raw) => {
      const envelope = parseScannerEnvelope(raw, sessionId, botJobId);
      if (!envelope) return;
      const { operationId, body } = envelope;
      if (operationId === 'scanner.state') {
        setState((current) => reduceScannerState(current, body.state));
        return;
      }
      if (operationId === 'scanner.bootstrapResponse') {
        if (!bootstrapRequestRef.current || body.requestId !== bootstrapRequestRef.current) return;
        clearTimer(bootstrapTimeoutRef);
        bootstrapRequestRef.current = null;
        setLoadingState(false);
        if (body.ok && body.state) {
          setState((current) => reduceScannerState(current, body.state));
          setTransientStatus(body.message || 'Scanner state loaded', 'success');
        } else {
          setTransientStatus(body.message || 'Could not load scanner state', 'error');
        }
        return;
      }
      if (operationId === 'scanner.actionResponse') {
        const pendingActionValue = pendingActionRef.current;
        if (!pendingActionValue || body.requestId !== pendingActionValue.requestId || body.action !== pendingActionValue.action) {
          return;
        }
        clearTimer(actionTimeoutRef);
        pendingActionRef.current = null;
        setPendingAction(null);
        if (body.ok && body.state) {
          setState((current) => reduceScannerState(current, body.state));
          setCompletedAction(body.action || null);
          setTransientStatus(body.message || 'Scanner action completed', 'success');
        } else {
          setCompletedAction(null);
          setTransientStatus(body.message || 'Scanner action failed', 'error');
        }
      }
    });
  }, [botJobId, enabled, messages, sessionId, setTransientStatus]);

  const sendAction = useCallback((action: ScannerAction) => {
    if (!enabled || !botJobId || pendingActionRef.current) return;
    clearTimer(actionTimeoutRef);
    const actionRequestId = requestId(action.toLowerCase());
    pendingActionRef.current = { requestId: actionRequestId, action };
    setPendingAction(action);
    setCompletedAction(null);
    setStatus(action === 'REFRESH_STATE' ? 'Refreshing scanner state' : 'Clearing scanner grid');
    setStatusTone('neutral');
    try {
      send('scanner.action', { action, botJobId, requestId: actionRequestId });
      actionTimeoutRef.current = setTimeout(() => {
        if (pendingActionRef.current?.requestId !== actionRequestId) return;
        pendingActionRef.current = null;
        setPendingAction(null);
        setTransientStatus('The backend did not answer the scanner action', 'error');
      }, RESPONSE_TIMEOUT_MS);
    } catch (error) {
      pendingActionRef.current = null;
      setPendingAction(null);
      setTransientStatus(error instanceof Error ? error.message : 'Could not send scanner action', 'error');
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
