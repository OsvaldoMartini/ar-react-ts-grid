import { useEffect, useRef, useState } from 'react';

interface OpenAIMessage {
  type: string;
  messages?: any[];
  [key: string]: any;
}

export const useOpenAIWebSocket = (apiKey: string) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (webSocket) return;

    const ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", [
      "v1.realtime",
    ]);

    ws.onopen = () => {
      console.log("✅ Connected to OpenAI");
      setConnected(true);
      setWebSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    ws.onerror = (event) => {
      console.error("❌ WebSocket error", event);
      setError("WebSocket error");
    };

    ws.onclose = () => {
      console.warn("🔌 OpenAI WebSocket closed");
      setConnected(false);
      setWebSocket(null);

      // Auto-reconnect logic (optional)
      reconnectTimeout.current = setTimeout(() => {
        console.log("🔄 Reconnecting to OpenAI...");
        connectWebSocket();
      }, 5000);
    };

    // Set headers after opening using the `Sec-WebSocket-Protocol`
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        type: "authorization",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      }));
    });
  };

  const sendMessage = (text: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        type: "message",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text }],
          },
        ],
      };
      webSocket.send(JSON.stringify(message));
    } else {
      console.warn("❌ WebSocket not connected");
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      webSocket?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return {
    webSocket,
    connected,
    messages,
    error,
    sendMessage,
  };
};
