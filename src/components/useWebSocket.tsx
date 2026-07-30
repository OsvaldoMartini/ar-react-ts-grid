import { useEffect, useRef, useState } from 'react';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 10000;
const PING_INTERVAL_MS = 15000;

type ApplicationControlOperation = 'application.shutdown' | 'application.workspaceClose';

interface WorkspaceFocusRequest {
  nativeWindowTitleToken: string;
}

const NATIVE_FOCUS_TITLE_PATTERN = /^ARWEB_FOCUS_[0-9a-f]{32}$/i;
const NATIVE_FOCUS_TITLE_RESTORE_MS = 3500;
let nativeFocusOriginalTitle: string | null = null;
let nativeFocusTitleRestoreTimer: ReturnType<typeof setTimeout> | null = null;

const workspaceFocusRequest = (
  rawMessage: unknown,
  currentSessionId: string,
): WorkspaceFocusRequest | null => {
  if (typeof rawMessage !== 'string') return null;
  try {
    const envelope = JSON.parse(rawMessage);
    const operationId = envelope?.operationId || envelope?.type;
    if (operationId !== 'application.workspaceFocus') return null;

    const body = typeof envelope?.body === 'string'
      ? JSON.parse(envelope.body)
      : envelope?.body;
    const targetSessionId = typeof body?.targetSessionId === 'string'
      ? body.targetSessionId
      : typeof body?.targetSession === 'string'
        ? body.targetSession
        : typeof body?.sessionId === 'string'
          ? body.sessionId
          : '';
    if (targetSessionId && targetSessionId !== currentSessionId) return null;
    const requestedTitleToken = typeof body?.nativeWindowTitleToken === 'string'
      ? body.nativeWindowTitleToken
      : '';
    return {
      nativeWindowTitleToken: NATIVE_FOCUS_TITLE_PATTERN.test(requestedTitleToken)
        ? requestedTitleToken
        : '',
    };
  } catch {
    return null;
  }
};

const exposeNativeWindowFocusToken = (titleToken: string) => {
  if (!titleToken) return;
  if (nativeFocusTitleRestoreTimer) {
    clearTimeout(nativeFocusTitleRestoreTimer);
  }
  if (nativeFocusOriginalTitle === null) {
    nativeFocusOriginalTitle = document.title;
  }
  document.title = titleToken;
  nativeFocusTitleRestoreTimer = setTimeout(() => {
    if (document.title === titleToken && nativeFocusOriginalTitle !== null) {
      document.title = nativeFocusOriginalTitle;
    }
    nativeFocusOriginalTitle = null;
    nativeFocusTitleRestoreTimer = null;
  }, NATIVE_FOCUS_TITLE_RESTORE_MS);
};

const applicationControlOperation = (
  rawMessage: unknown,
  currentSessionId: string,
): ApplicationControlOperation | null => {
  if (typeof rawMessage !== 'string') return null;
  try {
    const envelope = JSON.parse(rawMessage);
    const operationId = envelope?.operationId || envelope?.type;
    if (operationId === 'application.shutdown') return operationId;
    if (operationId !== 'application.workspaceClose') return null;

    const body = typeof envelope?.body === 'string'
      ? JSON.parse(envelope.body)
      : envelope?.body;
    const targetSessionId = typeof body?.targetSessionId === 'string'
      ? body.targetSessionId
      : typeof body?.targetSession === 'string'
        ? body.targetSession
        : typeof body?.sessionId === 'string'
          ? body.sessionId
          : '';
    return targetSessionId && targetSessionId !== currentSessionId
      ? null
      : operationId;
  } catch {
    return null;
  }
};

export const useWebSocket = (socketPort: number, sessionId: string) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setConnected(false);
    setWebSocket(null);
    setMessages([]);
    setError(null);

    if (socketPort <= 0 || !sessionId) {
      return () => {
        disposedRef.current = true;
      };
    }

    const stopPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const startPing = (socket: WebSocket) => {
      stopPing();
      pingIntervalRef.current = setInterval(() => {
        if (
          disposedRef.current ||
          socketRef.current !== socket ||
          socket.readyState !== WebSocket.OPEN
        ) {
          stopPing();
          return;
        }

        try {
          socket.send(`ping-${sessionId}`);
          console.log('ping sent');
        } catch (pingError) {
          console.error('Failed to send ping:', pingError);
        }
      }, PING_INTERVAL_MS);
    };

    const scheduleReconnect = (connect: () => void) => {
      if (disposedRef.current || reconnectTimeoutRef.current) return;

      const nextAttempt = reconnectAttemptsRef.current + 1;
      if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
        setError('❌ Max reconnect attempts reached.');
        return;
      }

      reconnectAttemptsRef.current = nextAttempt;
      setReconnectAttempts(nextAttempt);
      const delay = Math.min(
        RECONNECT_DELAY_MS * Math.max(0, nextAttempt - 1),
        MAX_RECONNECT_DELAY_MS,
      );
      console.log(`🔄 Attempting to reconnect in ${delay / 1000} seconds...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    const connectWebSocket = () => {
      if (disposedRef.current) return;

      const currentSocket = socketRef.current;
      if (
        currentSocket &&
        currentSocket.readyState !== WebSocket.CLOSED
      ) {
        return;
      }

      let socket: WebSocket;
      try {
        socket = new WebSocket(`ws://localhost:${socketPort}/websocket?sessionId=${sessionId}`);
      } catch (connectionError) {
        setError(connectionError instanceof Error ? connectionError.message : 'WebSocket connection failed');
        scheduleReconnect(connectWebSocket);
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (disposedRef.current || socketRef.current !== socket) {
          try {
            socket.close();
          } catch {
            // The connection is already unavailable.
          }
          return;
        }

        console.log(`✅ WebSocket connected for session: ${sessionId}`);
        clearReconnectTimeout();
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        setError(null);
        setConnected(true);
        setWebSocket(socket);
        startPing(socket);
      };

      socket.onmessage = (event) => {
        if (disposedRef.current || socketRef.current !== socket) return;
        const focusRequest = workspaceFocusRequest(event.data, sessionId);
        if (focusRequest) {
          exposeNativeWindowFocusToken(focusRequest.nativeWindowTitleToken);
          try {
            window.focus();
          } catch (focusError) {
            console.error('Could not focus the AR Web workspace window:', focusError);
          }
          return;
        }
        const controlOperation = applicationControlOperation(event.data, sessionId);
        if (controlOperation) {
          disposedRef.current = true;
          clearReconnectTimeout();
          stopPing();
          socketRef.current = null;
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          setConnected(false);
          setWebSocket(null);
          try {
            socket.close(
              1000,
              controlOperation === 'application.shutdown'
                ? 'Application shutdown'
                : 'Workspace closed',
            );
          } catch {
            // The backend may already have closed the transport.
          }
          try {
            window.close();
          } catch (closeError) {
            console.error(
              controlOperation === 'application.shutdown'
                ? 'Could not close the AR Web application window:'
                : 'Could not close the AR Web workspace window:',
              closeError,
            );
          }
          return;
        }
        setMessages((previous) => [...previous, event.data]);
      };

      socket.onerror = () => {
        if (!disposedRef.current && socketRef.current === socket) {
          console.error('❌ WebSocket error');
          setError('WebSocket encountered an error');
        }
      };

      socket.onclose = (event) => {
        if (socketRef.current !== socket) return;

        console.warn('⚠️ WebSocket closed');
        socketRef.current = null;
        stopPing();
        setConnected(false);
        setWebSocket((current) => (current === socket ? null : current));

        if (
          event.code === 1000
          && event.reason === 'Superseded by a newer tab'
        ) {
          disposedRef.current = true;
          clearReconnectTimeout();
          setError('This workspace was replaced by a newer tab.');
          return;
        }

        if (!disposedRef.current) {
          scheduleReconnect(connectWebSocket);
        }
      };
    };

    connectWebSocket();

    return () => {
      disposedRef.current = true;
      clearReconnectTimeout();
      stopPing();

      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        try {
          socket.close();
        } catch {
          // Closing a socket that failed during construction is best-effort cleanup.
        }
      }
    };
  }, [socketPort, sessionId]);

  return { webSocket, connected, reconnectAttempts, messages, error };
};
