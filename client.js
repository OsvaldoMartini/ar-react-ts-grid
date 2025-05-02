const Stomp = require("stompjs");
const SockJS = require("sockjs-client");

const host = "localhost";
const port = 61757; // Adjust if using a different port

const sockJS = new SockJS(`http://${host}:${port}/wss`);
const client = Stomp.over(sockJS);

client.connect("", "", () => {
  console.log("Connected to STOMP server");

  const message = "Hello from client!";
  client.send("/topic/test", {}, message);
  console.log("Message sent:", message);

  client.disconnect();
});

client.on("error", (err) => {
  console.error("STOMP connection error:", err);
});

client.on("close", () => {
  console.log("STOMP connection closed");
});
