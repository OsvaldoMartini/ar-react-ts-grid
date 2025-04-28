import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (socketPort: number, sessionId: string) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null); // Ref for the ping interval

  const connectWebSocket = () => {
    if (webSocket) return; // Prevent multiple instances

    const ws = new WebSocket(`ws://localhost:${socketPort}/websocket?sessionId=${sessionId}`);

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for session: ${sessionId}`);
      setConnected(true);
      setReconnectAttempts(0);
      setWebSocket(ws);
      // Start sending ping messages
      startPing(ws);
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
      stopPing(); // Clear the ping interval

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

  const startPing = (ws: WebSocket) => {
    pingInterval.current = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send('ping-' + sessionId); // Or a more structured ping message, e.g., { type: 'ping' }
          console.log('ping sent');
        } catch (error) {
          console.error('Failed to send ping:', error);
          //  Handle error, e.g., consider closing and reconnecting.
        }
      } else {
        //  Consider clearing the interval if the socket is not open
        stopPing();
      }
    }, 15000); // Send ping every 15 seconds (15000 milliseconds)
  };

  const stopPing = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
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
      stopPing(); // Clear the ping interval when the component unmounts
    };
  }, [socketPort, sessionId]); // Re-run effect if port or sessionId changes

  return { webSocket, connected, reconnectAttempts, messages, error };
};
