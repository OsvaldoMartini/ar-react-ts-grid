// global.d.ts

// Extend the Window interface to include receiveDataFromJava and javaBridge
export interface Window {
  receiveDataFromJava: (jsonDataA: string, socketPort: number, sessionIdFromJava: string) => void;
  javaBridge?: {
    sendDataToJava: (data: string) => void;
  };
}