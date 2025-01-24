import React, { useState, useEffect, useRef } from 'react';
import AlertModal from './AlertModal';

const ErrorTest: React.FC = () => {
  const [socketPort] = useState(8080); // Example port
  const [connected, setConnected] = useState(false);
  const [lastMessages, setLastMessages] = useState<any[]>([]);
  const lastMessagesRef = useRef<any[]>(lastMessages);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const [alertDismissed, setAlertDismissed] = useState(false);
  const [errorFlag, setErrorFlag] = useState(false);
  const [alertMessageHeader, setAlertMessageHeader] = useState('');
  const [alertMessageBody, setAlertMessageBody] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0); // Track attempts

  // WebSocket connection effect
  useEffect(() => {
    if (errorFlag && !alertDismissed) return; // Wait for modal to be dismissed

    let ws: WebSocket | null = null;
    let attempts = reconnectAttempts; // Use local variable for attempts

    const createWebSocket = async () => {
      try {
        ws = new WebSocket(`ws://localhost:${socketPort}/websocket`);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnected(true);
          setReconnectAttempts(0); // Reset attempts on successful connection

          // Try to send the subscription message
          try {
            const subscriptionMessage = {
              type: "echo",
              body: "subscribe",
            };
            ws?.send(JSON.stringify(subscriptionMessage));
          } catch (sendError) {
            console.error("Failed to send subscription message:", sendError);
            setAlertMessageHeader("WebSocket Error");
            setErrorFlag(true);
            setAlertMessageBody("Failed to send subscription message.");
          }
        };

        ws.onmessage = (event: MessageEvent) => {
          // ... (existing message handling logic)
        };

        ws.onerror = (error: Event) => {
          console.error("WebSocket error:", error);
          setAlertMessageHeader("WebSocket Error");
          setErrorFlag(true);
          setAlertMessageBody("An error occurred with the WebSocket connection.");
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setConnected(false);

          if (attempts < 10) { // Attempt reconnection up to 10 times
            attempts++;
            setReconnectAttempts(attempts);
            console.log(`Reconnecting attempt ${attempts}...`);
            createWebSocket(); // Retry connection
          } else {
            setAlertMessageHeader("WebSocket Error");
            setErrorFlag(true);
            setAlertMessageBody("Failed to connect to WebSocket. Please Contact the Administrator.");
          }
        };

        setWebSocket(ws);
      } catch (initError) {
        console.error("Failed to initialize WebSocket:", initError);
        setAlertMessageHeader("WebSocket Initialization Error");
        setErrorFlag(true);
        setAlertMessageBody("Failed to initialize WebSocket connection.");
      }
    };

    createWebSocket();

    // Cleanup on component unmount or dependency change
    return () => {
      try {
        console.log("Cleaning up WebSocket...");
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch (cleanupError) {
        console.error("Error during WebSocket cleanup:", cleanupError);
      }
    };
  }, [socketPort, alertDismissed]);

  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
  };

  return (
    <div>
      {errorFlag && (
        <AlertModal
          header={alertMessageHeader}
          body={alertMessageBody}
          extraMsg="Click Close to retry."
          onClose={handleClose}
          imageSrc="/path/to/error-image.png"
          error={true}
        />
      )}
    </div>
  );
};

export default ErrorTest;