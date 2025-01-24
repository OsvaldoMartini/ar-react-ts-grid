import React, { useState, useEffect, useRef } from "react";
import AlertModal from "./AlertModal";

const ErrorTest: React.FC = () => {
  const [socketPort] = useState(8080); // Example port
  const [connected, setConnected] = useState(false);
  const [lastMessages, setLastMessages] = useState<any[]>([]);
  const lastMessagesRef = useRef<any[]>(lastMessages);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const [alertDismissed, setAlertDismissed] = useState(false);
  const [errorFlag, setErrorFlag] = useState(false);
  const [alertMessageHeader, setAlertMessageHeader] = useState("");
  const [alertMessageBody, setAlertMessageBody] = useState("");
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

          // Close the alert modal when connected
          setErrorFlag(false);
          setAlertDismissed(true);
          setAlertMessageHeader("");
          setAlertMessageBody("");

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
          console.log("WebSocket message received:", event.data);
          let body = event.data;

          // Remove null character if it exists
          if (body.endsWith("\u0000")) {
            body = body.slice(0, -1);
          }

          if (body) {
            try {
              const parsedBody = JSON.parse(body);
              const updatedMessages = [...lastMessagesRef.current, parsedBody];
              if (updatedMessages.length <= 5) {
                setLastMessages(updatedMessages);
              }
            } catch (parseError) {
              console.warn("Non-JSON message received:", body);
              const updatedMessages = [...lastMessagesRef.current, body];
              if (updatedMessages.length <= 5) {
                setLastMessages(updatedMessages);
              }
              setAlertMessageHeader("WebSocket Error");
              setErrorFlag(true);
              setAlertMessageBody(`WebSocket: ${body}`);
            }
          }
        };

        ws.onerror = (error: Event) => {
          console.error("WebSocket error:", error);
          setAlertMessageHeader("WebSocket Error");
          setErrorFlag(true);
          setAlertMessageBody(
            `WebSocket connection failed. ${reconnectAttempts} - Attempt.`
          );
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setConnected(false);

          if (attempts < 10) {
            attempts++;
            setReconnectAttempts(attempts);
            console.log(`Reconnecting attempt ${attempts}...`);
            setAlertMessageBody(`${attempts} - Attempt to reconnect.`);
            createWebSocket(); // Retry connection
          } else {
            setAlertMessageHeader("WebSocket Error");
            setErrorFlag(true);
            setAlertMessageBody(
              "10 Attempts to Reconnect with the WebSocket.\nPlease contact the Administrator."
            );
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
    setAlertMessageHeader("");
    setAlertMessageBody("");
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
