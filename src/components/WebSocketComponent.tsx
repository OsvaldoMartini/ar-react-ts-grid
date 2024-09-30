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

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: "ws://localhost:8080/websocket", // Your WebSocket endpoint
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = (frame) => {
      console.log("Connected: " + frame);
      setConnected(true);

      // Subscribe to a topic (e.g., "/topic/messages")
      stompClient.subscribe("/topic/messages", (message: IMessage) => {
        console.log("Full STOMP message: ", message);

        if (message.body) {
          // Parse the received JSON into an array of BlockLoopInstructionLoadDTO
          const parsedData: BlockLoopInstructionLoadDTO[] = JSON.parse(message.body);
          console.log("Parsed data: ", parsedData);

          setInstructions(parsedData);
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
    </div>
  );
};

export default WebSocketComponent;
