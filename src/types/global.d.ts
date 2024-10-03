// global.d.ts

// Extend the Window interface to include receiveDataFromJava and javaBridge
export interface Window {
  receiveDataFromJava: (jsonData: string, socketPort: number) => void;
  javaBridge?: {
    sendDataToJava: (data: string) => void;
  };
}
