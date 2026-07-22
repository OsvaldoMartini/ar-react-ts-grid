import { useEffect, useRef, useState } from 'react';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 10000;
const PING_INTERVAL_MS = 15000;

const isApplicationShutdownMessage = (rawMessage: unknown): boolean => {
  if (typeof rawMessage !== 'string') return false;
  try {
    const envelope = JSON.parse(rawMessage);
    return envelope?.operationId === 'application.shutdown';
  } catch {
    return false;
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
        if (isApplicationShutdownMessage(event.data)) {
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
            socket.close(1000, 'Application shutdown');
          } catch {
            // The backend may already have closed the transport.
          }
          window.close();
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

      socket.onclose = () => {
        if (socketRef.current !== socket) return;

        console.warn('⚠️ WebSocket closed');
        socketRef.current = null;
        stopPing();
        setConnected(false);
        setWebSocket((current) => (current === socket ? null : current));

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
