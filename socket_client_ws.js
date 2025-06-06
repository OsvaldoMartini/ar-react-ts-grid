const WebSocket = require("ws");

// Function to handle incoming messages from the WebSocket server
function onMessage(ws, message) {
  console.log(`Received message: ${message}`);
}

// Function to handle WebSocket errors
function onError(ws, error) {
  console.error(`Error: ${error}`);
}

// Function to handle WebSocket closure
function onClose(ws, code, reason) {
  console.log("WebSocket closed");
}

// Function to handle WebSocket connection open event
function onOpen(ws) {
  console.log("WebSocket connection opened");
  const testMessage = "Test message from JavaScript";
  console.log(`Sending message: ${testMessage}`);
  ws.send(testMessage);
  startPing(ws);
}

// Function to send ping message every 5 seconds
function startPing(ws) {
  function ping() {
    if (ws.readyState === WebSocket.OPEN) {
      console.log("Sending ping...");
      ws.send("ping-socket-javascript");
    } else {
      console.log("WebSocket is not connected, skipping ping.");
    }
    setTimeout(ping, 5000);
  }

  ping();
}

// Main function to establish WebSocket connection
function main() {
  const brokerUrl =
    "ws://localhost:56567/websocket?sessionId=javascript-session"; // Notice: ws:// instead of wss://
  console.log(`Connecting to WebSocket at ${brokerUrl}...`);

  // Create the WebSocket client without HTTPS agent
  const ws = new WebSocket(brokerUrl);

  // Setup event listeners
  ws.on("open", () => onOpen(ws));
  ws.on("message", (message) => onMessage(ws, message));
  ws.on("error", (error) => onError(ws, error));
  ws.on("close", (code, reason) => onClose(ws, code, reason));
}

main();
