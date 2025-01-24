const Stomp = require("stompjs");
const SockJS = require("sockjs-client");

const host = "localhost";
const port = 15674; // Adjust if using a different port

const sockJS = new SockJS(`http://${host}:${port}/ws`);
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
