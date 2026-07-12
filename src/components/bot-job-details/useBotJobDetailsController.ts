import { useCallback, useEffect, useRef, useState } from 'react';
import type { BotJobWorkspaceAction, BotJobWorkspaceStatusTone } from './BotJobDetails.types';

interface ControllerOptions {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
}

interface ControllerState {
  pendingAction: BotJobWorkspaceAction | null;
  status: string;
  statusTone: BotJobWorkspaceStatusTone;
  sendAction: (action: BotJobWorkspaceAction) => void;
}

function parseBody(message: any): any {
  if (typeof message?.body !== 'string') return message?.body ?? {};
  try {
    return JSON.parse(message.body);
  } catch {
    return {};
  }
}

export function useBotJobDetailsController(options: ControllerOptions): ControllerState {
  const { webSocket, connected, messages, sessionId, homeBankingId, botJobId } = options;
  const processedMessagesRef = useRef(0);
  const pendingRequestRef = useRef<{ requestId: string; action: BotJobWorkspaceAction } | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingAction, setPendingAction] = useState<BotJobWorkspaceAction | null>(null);
  const [status, setStatus] = useState('Ready');
  const [statusTone, setStatusTone] = useState<BotJobWorkspaceStatusTone>('neutral');

  useEffect(() => {
    if (processedMessagesRef.current > messages.length) processedMessagesRef.current = 0;
    const nextMessages = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    nextMessages.forEach((raw) => {
      try {
        const envelope = JSON.parse(raw);
        if (envelope.sessionId !== sessionId || envelope.operationId !== 'botJobDetails.actionResponse') return;
        const body = parseBody(envelope);
        const pendingRequest = pendingRequestRef.current;
        if (!pendingRequest || body.requestId !== pendingRequest.requestId) return;
        if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
        pendingRequestRef.current = null;
        setPendingAction(null);
        setStatus(body.message || (body.ok === false ? 'Action failed' : 'Action accepted'));
        setStatusTone(body.ok === false ? 'error' : 'success');
        if (statusResetRef.current) clearTimeout(statusResetRef.current);
        statusResetRef.current = setTimeout(() => {
          setStatus('Ready');
          setStatusTone('neutral');
        }, 3500);
      } catch {
        // Other grid protocols own their messages; malformed/unrelated data is ignored here.
      }
    });
  }, [messages, sessionId]);

  useEffect(() => {
    if (!connected) {
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      if (statusResetRef.current) clearTimeout(statusResetRef.current);
      pendingRequestRef.current = null;
      setPendingAction(null);
      setStatus('Waiting for backend connection');
      setStatusTone('warning');
    } else if (status === 'Waiting for backend connection') {
      setStatus('Ready');
      setStatusTone('neutral');
    }
  }, [connected, status]);

  useEffect(() => () => {
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    if (statusResetRef.current) clearTimeout(statusResetRef.current);
  }, []);

  const sendAction = useCallback((action: BotJobWorkspaceAction) => {
    if (!webSocket || !connected || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Backend socket is not connected');
      setStatusTone('error');
      return;
    }
    if (!botJobId || botJobId <= 0) {
      setStatus('Bot Job identity is unavailable');
      setStatusTone('error');
      return;
    }

    const requestId = `${Date.now()}-${action.toLowerCase()}`;
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    if (statusResetRef.current) clearTimeout(statusResetRef.current);
    pendingRequestRef.current = { requestId, action };
    setPendingAction(action);
    setStatus(`Sending ${action.toLowerCase().replaceAll('_', ' ')}…`);
    setStatusTone('neutral');
    try {
      webSocket.send(JSON.stringify({
        type: 'botJobDetails.action',
        sessionId,
        homeBankingId,
        body: JSON.stringify({ action, botJobId, requestId }),
      }));
      responseTimeoutRef.current = setTimeout(() => {
        if (pendingRequestRef.current?.requestId !== requestId) return;
        pendingRequestRef.current = null;
        setPendingAction(null);
        setStatus('The backend did not acknowledge the action');
        setStatusTone('error');
      }, 10000);
    } catch (sendError) {
      pendingRequestRef.current = null;
      setPendingAction(null);
      setStatus(sendError instanceof Error ? sendError.message : 'Could not send the workspace action');
      setStatusTone('error');
    }
  }, [botJobId, connected, homeBankingId, sessionId, webSocket]);

  return { pendingAction, status, statusTone, sendAction };
}
