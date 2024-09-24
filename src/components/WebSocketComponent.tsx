import React, { useEffect, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";



const WebSocketComponent: React.FC = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");

  useEffect(() => {
    // Create a STOMP client
    const stompClient: Client = new Client({
      brokerURL: "ws://localhost:8080/websocket2", // Your WebSocket URL
      reconnectDelay: 5000, // Try reconnecting after 5 seconds if the connection fails
      heartbeatIncoming: 4000, // Heartbeat configuration
      heartbeatOutgoing: 4000,
      debug: (str: string) => {
        console.log("STOMP: " + str);
      },
    });

    // Handle connection success
    stompClient.onConnect = (frame) => {
      console.log("Connected: " + frame);
      setConnected(true);

      // Subscribe to a topic (e.g., "/topic/messages")
      stompClient.subscribe("/topic/messages", (message: IMessage) => {
        if (message.body) {
          setMessages((prevMessages) => [...prevMessages, message.body]);
          console.log("Received message: ", message.body);
        }
      });
    };

    // Handle STOMP errors
    stompClient.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    // Activate the connection
    stompClient.activate();
    setClient(stompClient);

    // Cleanup when component unmounts
    return () => {
      stompClient.deactivate();
    };
  }, []);

  const sendMessage = () => {
    if (client && connected) {
      // Send a message to the server (e.g., "/app/send")
      client.publish({
        destination: "/app/send", // Adjust the destination as per server config
        body: inputMessage,
      });
      console.log("Message sent: ", inputMessage);
      setInputMessage(""); // Clear the input after sending
    }
  };

  return (
    <div>
      <h1>STOMP WebSocket Example</h1>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
