import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '../useWebSocket';
import {
  isBotJobWindowSession,
  parseBotJobWindowTarget,
  type BotJobWindowTarget,
} from './BotJobWindow.contract';

interface BotJobWindowControlProps {
  socketPort: number;
  sessionId: string;
  onTarget: (target: BotJobWindowTarget) => void;
}

const parseBody = (body: unknown): unknown => {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const ConnectedBotJobWindowControl: React.FC<BotJobWindowControlProps> = ({
  socketPort,
  sessionId,
  onTarget,
}) => {
  const { messages } = useWebSocket(socketPort, sessionId);
  const lastProcessedIndexRef = useRef(0);

  useEffect(() => {
    if (messages.length < lastProcessedIndexRef.current) {
      lastProcessedIndexRef.current = 0;
    }
    for (let index = lastProcessedIndexRef.current; index < messages.length; index += 1) {
      try {
        const envelope = JSON.parse(messages[index]);
        if (
          envelope?.operationId !== 'botJobDetails.windowTarget'
          || envelope?.sessionId !== sessionId
        ) continue;
        const target = parseBotJobWindowTarget(parseBody(envelope.body));
        if (target) onTarget(target);
      } catch {
        // Ignore malformed control messages; the active workspace remains unchanged.
      }
    }
    lastProcessedIndexRef.current = messages.length;
  }, [messages, onTarget, sessionId]);

  return null;
};

const BotJobWindowControl: React.FC<BotJobWindowControlProps> = (props) => {
  if (
    props.socketPort <= 0
    || !isBotJobWindowSession(props.sessionId)
  ) return null;
  return <ConnectedBotJobWindowControl {...props} />;
};

export default BotJobWindowControl;
