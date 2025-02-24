import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (socketPort: number, sessionId: string) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (webSocket) return; // Prevent multiple instances

    const ws = new WebSocket(`ws://localhost:${socketPort}/websocket?sessionId=${sessionId}`);

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for session: ${sessionId}`);
      setConnected(true);
      setReconnectAttempts(0);
      setWebSocket(ws);
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onerror = () => {
      console.error('❌ WebSocket error');
      setError('WebSocket encountered an error');
    };

    ws.onclose = () => {
      console.warn('⚠️ WebSocket closed');
      setConnected(false);
      setWebSocket(null);

      if (reconnectAttempts < 5) {
        const delay = Math.min(2000 * reconnectAttempts, 10000); // Exponential backoff
        console.log(`🔄 Attempting to reconnect in ${delay / 1000} seconds...`);

        reconnectTimeout.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connectWebSocket(); // Retry connection
        }, delay);
      } else {
        setError('❌ Max reconnect attempts reached.');
      }
    };
  };

  useEffect(() => {
    connectWebSocket(); // Establish the initial connection

    return () => {
      if (webSocket) {
        webSocket.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [socketPort, sessionId]); // Re-run effect if port or sessionId changes

  return { webSocket, connected, reconnectAttempts, messages, error };
};
