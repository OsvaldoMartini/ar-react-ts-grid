const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");

const port = 61757;

// Load self-signed cert and key
const server = https.createServer({
  cert: fs.readFileSync("C:/ARWeb/ARWeb-Scanner/javaFX/cert_self_signed.pem"),
  key: fs.readFileSync("C:/ARWeb/ARWeb-Scanner/javaFX/key_self_signed.pem"),
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (message) => {
    console.log(`Received message: ${message}`);
    socket.send(`Server received: ${message}`);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error(`WebSocket error: ${error}`);
  });
});

server.listen(port, () => {
  console.log(`Secure WebSocket server is running on wss://localhost:${port}`);
});
