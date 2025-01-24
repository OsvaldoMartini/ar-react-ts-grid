import React, { useEffect, useState } from "react";

const WebSocketClient = ({ port = 8080 }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(`ws://localhost:${port}/websocket`);

    // Set up WebSocket event listeners
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setStatus("Connected");
    };

    ws.onmessage = (event) => {
      console.log("Message received:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setStatus("Disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Store WebSocket instance in state
    setSocket(ws);

    // Cleanup function to close WebSocket on component unmount
    return () => {
      ws.close();
    };
  }, [port]);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "echo", body: inputMessage });
      socket.send(message);
      console.log("Message sent:", message);
      setInputMessage("");
    } else {
      console.error("WebSocket is not open");
    }
  };

  const sendBroadcastMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const broadcastMessage = JSON.stringify({ type: "broadcast", body: inputMessage });
      socket.send(broadcastMessage);
      console.log("Broadcast message sent:", broadcastMessage);
      setInputMessage("");
    } else {
      console.error("WebSocket is not open");
    }
  };

  return (
    <div>
      <h2>WebSocket Client</h2>
      <p>Status: {status}</p>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send Ping</button>
        <button onClick={sendBroadcastMessage}>Broadcast</button>
      </div>
      <div>
        <h3>Messages</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketClient;
