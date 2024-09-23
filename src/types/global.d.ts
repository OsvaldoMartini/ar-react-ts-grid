// global.d.ts

// Extend the Window interface to include receiveDataFromJava and javaBridge
export interface Window {
  receiveDataFromJava: (jsonData: string) => void;
  javaBridge?: {
    sendDataToJava: (data: string) => void;
  };
}
