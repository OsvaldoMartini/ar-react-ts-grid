const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");

// Configuration
const FRONTEND_PORT = 8080; // Port for your browser to connect to (ws://localhost:8080)
const BACKEND_URL = "ws://localhost:64479/websocket?sessionId=botJobTasks";

// Create a WebSocket server to accept frontend connections
const wss = new WebSocket.Server({ port: FRONTEND_PORT }, () => {
  console.log(
    `✅ WebSocket proxy server running at ws://localhost:${FRONTEND_PORT}`
  );
});

wss.on("connection", (frontendSocket) => {
  console.log("🌐 Frontend client connected");

  // Create backend WebSocket client (to original secure server)
  const backendSocket = new WebSocket(BACKEND_URL, {
    agent: new https.Agent({
      rejectUnauthorized: false, // Accept self-signed certs
    }),
  });

  // Forward messages from frontend → backend
  frontendSocket.on("message", (message) => {
    console.log("➡️ Forwarding message to backend:", message);
    if (backendSocket.readyState === WebSocket.OPEN) {
      backendSocket.send(message);
    }
  });

  // Forward messages from backend → frontend
  backendSocket.on("message", (message) => {
    console.log("⬅️ Forwarding message to frontend:", message);
    if (frontendSocket.readyState === WebSocket.OPEN) {
      frontendSocket.send(message);
    }
  });

  backendSocket.on("open", () => {
    console.log("🔗 Connected to backend WebSocket");
  });

  backendSocket.on("error", (err) => {
    console.error("❌ Backend WebSocket error:", err.message);
    frontendSocket.send("Error: Backend connection failed.");
  });

  backendSocket.on("close", () => {
    console.warn("⚠️ Backend WebSocket closed");
    if (frontendSocket.readyState === WebSocket.OPEN) {
      frontendSocket.close();
    }
  });

  frontendSocket.on("close", () => {
    console.log("🚪 Frontend WebSocket closed");
    if (backendSocket.readyState === WebSocket.OPEN) {
      backendSocket.close();
    }
  });
});
