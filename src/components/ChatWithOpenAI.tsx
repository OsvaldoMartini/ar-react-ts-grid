import React, { useState } from 'react';
import { useOpenAIWebSocket } from './useOpenAIWebSocket';

const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY || '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';

const ChatWithOpenAI = () => {
  const { connected, messages, sendMessage, error } = useOpenAIWebSocket(OPENAI_KEY);
  const [input, setInput] = useState("");

  const handleSend = () => {
    sendMessage(input);
    setInput("");
  };

  return (
    <div>
      <h2>🧠 Chat with GPT-4o</h2>
      <div>Connection: {connected ? "Connected" : "Disconnected"}</div>
      <div>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={handleSend}>Send</button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChatWithOpenAI;
