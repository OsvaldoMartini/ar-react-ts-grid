import { useEffect, useRef, useState } from 'react';

const MEMORY_LIST_COUNT_OPERATIONS = new Set([
  'memoryList.summaryResponse',
  'memoryList.summaryChanged',
  'memoryList.openResponse',
  'memoryList.syncResponse',
]);

interface UseMemoryListSummaryOptions {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  workspaceEpoch: number | null;
}

const parseBody = (envelope: any): any => {
  if (typeof envelope?.body !== 'string') return envelope?.body ?? envelope;
  try {
    return JSON.parse(envelope.body);
  } catch {
    return null;
  }
};

const bodyItemCount = (body: any): number | null => {
  const direct = Number(body?.itemCount ?? body?.count);
  if (Number.isSafeInteger(direct) && direct >= 0) return direct;
  if (Array.isArray(body?.items)) return body.items.length;
  if (Array.isArray(body?.snapshot?.items)) return body.snapshot.items.length;
  return null;
};

/**
 * Reads the backend-owned aggregate Memory List count without copying its items
 * into producer pages. The subscription is scoped to one Bot Job and renewed
 * after every socket reconnect or workspace retarget.
 */
export const useMemoryListSummary = ({
  webSocket,
  connected,
  messages,
  sessionId,
  homeBankingId,
  botJobId,
  workspaceEpoch,
}: UseMemoryListSummaryOptions): number => {
  const [itemCount, setItemCount] = useState(0);
  const processedMessageCountRef = useRef(0);
  const subscriptionKeyRef = useRef('');

  useEffect(() => {
    setItemCount(0);
    subscriptionKeyRef.current = '';
  }, [botJobId, homeBankingId, sessionId, webSocket, workspaceEpoch]);

  useEffect(() => {
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN
      || botJobId === null || botJobId <= 0 || homeBankingId <= 0
      || (workspaceEpoch !== null
        && (!Number.isSafeInteger(workspaceEpoch) || workspaceEpoch <= 0))) return;
    const subscriptionKey = `${sessionId}:${homeBankingId}:${botJobId}:${workspaceEpoch}`;
    if (subscriptionKeyRef.current === subscriptionKey) return;
    subscriptionKeyRef.current = subscriptionKey;
    try {
      webSocket.send(JSON.stringify({
        type: 'memoryList.summary',
        sessionId,
        homeBankingId,
        body: JSON.stringify({
          homeBankingId,
          botJobId,
          ...(workspaceEpoch === null ? {} : { workspaceEpoch }),
        }),
      }));
    } catch {
      subscriptionKeyRef.current = '';
    }
  }, [botJobId, connected, homeBankingId, sessionId, webSocket, workspaceEpoch]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const envelope = JSON.parse(raw);
        const operation = String(envelope?.operationId ?? envelope?.type ?? '');
        if (!MEMORY_LIST_COUNT_OPERATIONS.has(operation)) return;
        if (envelope?.sessionId && envelope.sessionId !== sessionId) return;
        const body = parseBody(envelope);
        if (!body || body.ok === false) return;
        const messageBotJobId = Number(body.botJobId ?? body.snapshot?.botJobId);
        const messageHomeBankingId = Number(
          body.homeBankingId ?? body.snapshot?.homeBankingId,
        );
        if (messageBotJobId !== botJobId) return;
        if (Number.isSafeInteger(messageHomeBankingId)
          && messageHomeBankingId > 0
          && messageHomeBankingId !== homeBankingId) return;
        const messageWorkspaceEpoch = Number(
          body.workspaceEpoch ?? body.snapshot?.workspaceEpoch,
        );
        if (workspaceEpoch !== null && messageWorkspaceEpoch !== workspaceEpoch) return;
        const nextItemCount = bodyItemCount(body);
        if (nextItemCount !== null) setItemCount(nextItemCount);
      } catch {
        // Other workspace messages are intentionally ignored.
      }
    });
  }, [botJobId, homeBankingId, messages, sessionId, workspaceEpoch]);

  return itemCount;
};

export default useMemoryListSummary;
