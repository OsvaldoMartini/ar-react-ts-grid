import React from 'react';
import { useWebSocket } from './useWebSocket';

export const MAIN_APPLICATION_CONTROL_SESSION = 'mainApplicationControl';

const DETACHED_WINDOW_PARAMETERS = [
  'openBotJob',
  'botJobWindowSession',
  'openOcr',
  'ocrSession',
  'openPageScanner',
  'pageScannerSession',
  'openWorkspace',
] as const;

export const isMainApplicationWindow = (search: string): boolean => {
  const parameters = new URLSearchParams(search);
  return !DETACHED_WINDOW_PARAMETERS.some(parameter => parameters.has(parameter));
};

interface MainApplicationControlProps {
  socketPort: number;
}

const MainApplicationControl: React.FC<MainApplicationControlProps> = ({ socketPort }) => {
  useWebSocket(socketPort, MAIN_APPLICATION_CONTROL_SESSION);
  return null;
};

export default MainApplicationControl;
