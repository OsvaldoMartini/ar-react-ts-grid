const WebSocket = require("ws");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore self-signed cert

const ws = new WebSocket("wss://localhost:61757");

ws.on("open", () => {
  console.log("Connected to server");
  ws.send("Hello from client!");
});

ws.on("message", (data) => {
  console.log(`Received: ${data}`);
});

ws.on("close", () => {
  console.log("Disconnected");
});
