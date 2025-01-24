import React, { useEffect, useState } from "react";

const WebSocketComponentClient = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    // Connect to the WebSocket server
    const ws = new WebSocket('ws://localhost:8080/websocket');

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received from server:", message);
      setMessages((prev) => [...prev, `Server: ${message.message}`]);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket && name.trim() !== "") {
      const message = { name };
      socket.send(JSON.stringify(message));
      setMessages((prev) => [...prev, `You: Hello, ${name}`]);
      setName(""); // Clear input
    }
  };

  return (
    <div>
      <h2>WebSocket Chat</h2>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponentClient;
