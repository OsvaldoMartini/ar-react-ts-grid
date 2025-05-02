const WebSocket = require("ws");
const fs = require("fs");
const https = require("https");

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
  // Send a test message after connection is opened
  const testMessage = "Test message from JavaScript";
  console.log(`Sending message: ${testMessage}`);
  ws.send(testMessage);

  // Start sending pings every 15 seconds
  startPing(ws);
}

// Function to send ping message every 15 seconds
function startPing(ws) {
  // Send a ping message to the WebSocket server every 15 seconds
  function ping() {
    if (ws.readyState === WebSocket.OPEN) {
      console.log("Sending ping...");
      ws.send("ping--socket-javascript"); // Send a ping message (customize this message as needed)
    } else {
      console.log("WebSocket is not connected, skipping ping.");
    }

    // Schedule the next ping in 15 seconds
    setTimeout(ping, 5000); // Send the next ping after 15 seconds
  }

  // Start the first ping
  ping();
}

// Main function to establish WebSocket connection
function main() {
  const brokerUrl =
    "wss://localhost:61757/websocket?sessionId=javascript-session"; // WebSocket URL
  console.log(`Connecting to WebSocket at ${brokerUrl}...`);

  // SSL certificate path
  // const certPath = "C:/ARWeb/ARWeb-Scanner/javaFX/allinweb.pem"; // Path to your CA certificate in PEM format
  const certPath = "allinweb.pem"; // Path to your CA certificate in PEM format
  const agent = new https.Agent({
    // ca: fs.readFileSync(certPath),
    rejectUnauthorized: false, // Ensure SSL certificate is verified
  });

  // Create the WebSocket client
  const ws = new WebSocket(brokerUrl, { agent });

  // Setup event listeners for the WebSocket client
  ws.on("open", () => onOpen(ws));
  ws.on("message", (message) => onMessage(ws, message));
  ws.on("error", (error) => onError(ws, error));
  ws.on("close", (code, reason) => onClose(ws, code, reason));
}

// Run the main function
main();
