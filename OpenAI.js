import WebSocket from "ws";
const OPENAI_KEY =
  "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";
const url =
  "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + OPENAI_KEY,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", function open() {
  console.log("Connected to server.");
});

ws.on("message", function incoming(message) {
  console.log(JSON.parse(message.toString()));
});

ws.on("close", () => {
  console.log("Connection closed.");
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});
