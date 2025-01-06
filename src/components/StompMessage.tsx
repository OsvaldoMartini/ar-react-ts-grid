import React, { useState } from "react";
import { StompSessionProvider, useSubscription, useStompClient } from "react-stomp-hooks";
import responseTestDTO from "./MessageTypes";

// Define the App component
const StompMessage: React.FC = () => {
  const [socketPort, setSocketPort] = useState<number>(8080);

  return (
    // Initialize Stomp connection, will use SockJS for http(s) and WebSocket for ws(s)
    // The Connection can be used by all child components via the hooks or HOCs.
    <StompSessionProvider
      url={`ws://localhost:${socketPort}/websocket`}

    // All options supported by @stomp/stompjs can be used here
    >
      <SubscribingComponent />
      <SendingMessages />
    </StompSessionProvider>
  );
};


function SubscribingComponent() {
  const [lastMessage, setLastMessage] = useState("No message received yet");

  //Subscribe to /topic/test, and use handler for all received messages
  //Note that all subscriptions made through the library are automatically removed when their owning component gets unmounted.
  //If the STOMP connection itself is lost they are however restored on reconnect.
  //You can also supply an array as the first parameter, which will subscribe to all destinations in the array
  useSubscription("/topic/messages", (message) => setLastMessage(message.body));

  return <div>Last Message: {lastMessage}</div>;
}

// Define the SendingMessages component
const SendingMessages: React.FC = () => {
  // Get Instance of StompClient
  // This is the StompClient from @stomp/stompjs
  // Note: This will be undefined if the client is currently not connected
  const stompClient = useStompClient();

  const sendMessage = () => {
    if (stompClient) {
      // Send Message
      stompClient.publish({
        destination: "/app/echo",
        body: JSON.stringify(responseTestDTO),
      });
    } else {
      console.error("StompClient is not connected.");
    }
  };

  return <button onClick={sendMessage}>Send Message</button>;
};

export default StompMessage;
