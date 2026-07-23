import React from 'react';
import { render } from '@testing-library/react';
import MainApplicationControl, {
  MAIN_APPLICATION_CONTROL_SESSION,
  isMainApplicationWindow,
} from './MainApplicationControl';
import { useWebSocket } from './useWebSocket';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

test('opens the stable main application lifecycle session', () => {
  mockedUseWebSocket.mockReturnValue({
    webSocket: null,
    connected: false,
    reconnectAttempts: 0,
    messages: [],
    error: null,
  });

  render(<MainApplicationControl socketPort={7357} />);

  expect(mockedUseWebSocket).toHaveBeenCalledWith(7357, MAIN_APPLICATION_CONTROL_SESSION);
  expect(MAIN_APPLICATION_CONTROL_SESSION).toBe('mainApplicationControl');
});

test.each([
  '?desktopShell=1&openBotJob=20&botJobWindowSession=botJobWindow-1',
  '?desktopShell=1&openOcr=config&ocrSession=ocrConfig-1',
  '?desktopShell=1&openPageScanner=preScan&pageScannerSession=pageScanner-1',
  '?desktopShell=1&openWorkspace=aTemplateManager',
])('does not classify a detached workspace as the main application window: %s', search => {
  expect(isMainApplicationWindow(search)).toBe(false);
});

test('keeps the lifecycle session across root-shell views', () => {
  expect(isMainApplicationWindow('')).toBe(true);
  expect(isMainApplicationWindow('?desktopShell=1')).toBe(true);
});
