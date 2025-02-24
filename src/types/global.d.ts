// global.d.ts

// Extend the Window interface to include receiveDataFromJava and javaBridge
export interface Window {
  receiveDataFromJava: (jsonDataA: string, sessionIdName:string, isElementDTO: boolean, socketPort: number) => void;
  javaBridge?: {
    sendDataToJava: (data: string) => void;
  };
}