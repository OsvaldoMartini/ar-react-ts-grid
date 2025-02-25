import React, { useState } from "react";

const BrowserConsole: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const logMessage = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
    console.log(message); // Still logs to the browser console
  };

  return (
    <div>
      <button onClick={() => logMessage("Button clicked!")}>Log Message</button>
      <div style={{ background: "#222", color: "#0f0", padding: "10px", maxHeight: "200px", overflowY: "scroll" }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default BrowserConsole;
