import { useEffect, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";

interface BlockLoopInstructionLoadDTO {
  botJobId: number;
  id: number;
  instructionOrderNumber: number;
  name: string;
  description: string;
  blockId: number;
  blockOrderNumber: number;
  blockName: string;
  actions: string;
}

const WebSocketComponent = () => {
  const [instructions, setInstructions] = useState<BlockLoopInstructionLoadDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const [messageToSend, setMessageToSend] = useState(""); // State to store the message to send
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]); // State to store received messages
  const [client, setClient] = useState<Client | null>(null); // Store the stomp client

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: "ws://localhost:8080/websocket", // Your WebSocket endpoint
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = (frame) => {
      console.log("Connected: " + frame);
      setConnected(true);
      setClient(stompClient); // Set client to state

      // Subscribe to a topic (e.g., "/topic/messages")
      stompClient.subscribe("/topic/messages", (message: IMessage) => {
        console.log("Full STOMP message: ", message);

        if (message.body) {
          // Parse the received JSON into an array of BlockLoopInstructionLoadDTO
          const parsedData: BlockLoopInstructionLoadDTO[] = JSON.parse(message.body);
          console.log("Parsed data: ", parsedData);

          setInstructions(parsedData);

          // Add message body to received messages list
          setReceivedMessages((prevMessages) => [...prevMessages, message.body]);
        } else {
          console.log("No message body received");
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // Function to handle sending a message
  const sendMessage = () => {
    if (client && connected && messageToSend.trim()) {
      client.publish({
        destination: "/topic/messages", // Same topic you're subscribed to
        body: messageToSend, // Send the message typed in the textbox
      });
      console.log("Sent message: ", messageToSend);
      setMessageToSend(""); // Clear the input after sending
    }
  };

  return (
    <div>
      <h2>Received Instructions</h2>
      {connected ? <p>Connected to WebSocket</p> : <p>Connecting...</p>}

      <ul>
        {instructions.map((instruction, index) => (
          <li key={index}>
            {instruction.name} - {instruction.description} - Block: {instruction.blockName}
          </li>
        ))}
      </ul>

      {/* Input for sending a message */}
      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          value={messageToSend}
          onChange={(e) => setMessageToSend(e.target.value)} // Update state as the user types
          placeholder="Type your message here..."
        />
        <button onClick={sendMessage} disabled={!connected}>Send Message</button>
      </div>

      {/* Section to display received messages */}
      <div style={{ marginTop: "20px" }}>
        <h3>Received Messages</h3>
        <ul>
          {receivedMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
