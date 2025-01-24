const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 9090 }, () => {
  console.log("WebSocket server is running on ws://localhost:9090");
});

server.on("connection", (socket) => {
  console.log("Client connected");

  // Handle incoming messages
  socket.on("message", (message) => {
    console.log("Received from client:", message);

    // Echo the message back to the client
    const parsedMessage = JSON.parse(message);
    const response = {
      message: `Hello, ${parsedMessage.name}!`,
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(response));
  });

  // Handle client disconnection
  socket.on("close", () => {
    console.log("Client disconnected");
  });
});
