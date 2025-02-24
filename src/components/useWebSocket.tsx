import { useState, useEffect } from 'react';

export const useWebSocket = (socketPort: number) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const createWebSocket = () => {
      try {
        // Initialize WebSocket connection
        ws = new WebSocket(`ws://localhost:${socketPort}/websocket`);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          setReconnectAttempts(0); // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          // Handle incoming WebSocket messages here
          console.log('Received message:', event.data);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          setConnected(false);

          // Retry connection if not maxed out
          if (reconnectAttempts < 100) {
            setReconnectAttempts((prev) => prev + 1);
            console.log(`Reconnecting attempt ${reconnectAttempts + 1}...`);
            createWebSocket(); // Retry connection
          } else {
            console.error('Max reconnect attempts reached.');
          }
        };

        // Set the WebSocket state
        setWebSocket(ws);
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    createWebSocket();

    // Cleanup function to close WebSocket connection on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [socketPort, reconnectAttempts]);

  return { webSocket, connected, reconnectAttempts };
};
