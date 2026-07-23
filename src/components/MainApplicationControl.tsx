import React, { useEffect, useRef } from 'react';
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
  onSessionOpen?: (targetSession: string, port: number, botJobId?: number) => void;
}

const MainApplicationControl: React.FC<MainApplicationControlProps> = ({
  socketPort,
  onSessionOpen,
}) => {
  const { messages } = useWebSocket(socketPort, MAIN_APPLICATION_CONTROL_SESSION);
  const processedMessageCountRef = useRef(0);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const nextMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    for (const raw of nextMessages) {
      try {
        const envelope = JSON.parse(raw);
        const operationId = envelope?.operationId || envelope?.type;
        const body = typeof envelope?.body === 'string'
          ? JSON.parse(envelope.body)
          : envelope?.body ?? {};

        if (operationId === 'react.session.open') {
          const targetSession = typeof body?.targetSession === 'string'
            ? body.targetSession.trim()
            : '';
          const port = Number(body?.port);
          const botJobId = body?.botJobId === undefined ? undefined : Number(body.botJobId);
          if (targetSession && Number.isInteger(port) && port > 0) {
            onSessionOpen?.(
              targetSession,
              port,
              botJobId !== undefined && Number.isFinite(botJobId) ? botJobId : undefined,
            );
          }
        } else if (operationId !== 'application.workspaceFocus') {
          continue;
        }

        try {
          window.focus();
        } catch {
          // Bringing an existing native window to the front is best-effort.
        }
      } catch (messageError) {
        console.warn('Main application control ignored socket message', messageError, raw);
      }
    }
  }, [messages, onSessionOpen]);

  return null;
};

export default MainApplicationControl;
