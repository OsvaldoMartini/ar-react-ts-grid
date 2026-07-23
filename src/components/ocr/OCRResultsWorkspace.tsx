import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OCRParameter } from '../OCRConfigPanel';
import OCRTestResultsPanel, { type OCRTestResult } from '../OCRTestResultsPanel';
import { OCR_RESULTS_WORKSPACE_KIND } from '../scanner/Scanner.sessions';
import { useWebSocket } from '../useWebSocket';
import {
  OCR_WORKSPACE_WINDOW_RETARGET_OPERATION,
  ocrWorkspaceRetarget,
  type OcrWorkspaceRetarget,
} from './OCRWorkspace.contract';

type Props = {
  socketPort: number;
  sessionId: string;
  onWorkspaceRetarget: (target: OcrWorkspaceRetarget) => void;
  onClose?: () => void;
  onWorkspaceNotice?: (message: string) => void;
};

type WorkspaceContext = {
  homeBankingId: number;
  botJobId?: number;
  homeUrlId?: number;
  parameters: OCRParameter[];
};

type SocketEnvelope = {
  operationId?: string;
  sessionId?: string;
  homeBankingId?: number;
  body?: unknown;
};

const emptyResult = (source: string): OCRTestResult => ({
  source,
  wordCount: 0,
  counts: {},
  rows: [],
});

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const responseError = (body: any, fallback: string) => String(body?.error || body?.message || fallback);

const OCRResultsWorkspace: React.FC<Props> = ({
  socketPort,
  sessionId,
  onWorkspaceRetarget,
  onClose,
  onWorkspaceNotice,
}) => {
  const { webSocket, connected, messages, error: socketError } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const bootstrappedSocketRef = useRef<WebSocket | null>(null);
  const retiredSessionRef = useRef(false);
  const [context, setContext] = useState<WorkspaceContext | null>(null);
  const [result, setResult] = useState<OCRTestResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'AR Web - OCR Results';
  }, []);

  const sendCommand = useCallback((
    type: string,
    body: Record<string, unknown> = {},
    homeBankingId = context?.homeBankingId ?? -1,
  ) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setBusy(false);
      setError('WebSocket is not connected.');
      return false;
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      homeBankingId,
      body: JSON.stringify(body),
    }));
    return true;
  }, [context?.homeBankingId, sessionId, webSocket]);

  useEffect(() => {
    if (!connected || !webSocket || bootstrappedSocketRef.current === webSocket) return;
    bootstrappedSocketRef.current = webSocket;
    setBusy(true);
    setError('');
    sendCommand('ocrWorkspace.bootstrap');
  }, [connected, sendCommand, webSocket]);

  useEffect(() => {
    if (retiredSessionRef.current) return;
    if (processedMessageCountRef.current > messages.length) processedMessageCountRef.current = 0;

    for (let index = processedMessageCountRef.current; index < messages.length; index += 1) {
      try {
        const envelope = JSON.parse(messages[index]) as SocketEnvelope;
        if (envelope.sessionId && envelope.sessionId !== sessionId) continue;
        const body: any = parseJson(envelope.body);

        switch (envelope.operationId) {
          case OCR_WORKSPACE_WINDOW_RETARGET_OPERATION: {
            const retarget = ocrWorkspaceRetarget(
              body,
              sessionId,
              OCR_RESULTS_WORKSPACE_KIND,
            );
            if (retarget) {
              onWorkspaceRetarget(retarget);
              if (retarget.sessionId !== sessionId) {
                retiredSessionRef.current = true;
                processedMessageCountRef.current = messages.length;
                return;
              }
            } else {
              console.warn('OCR Results ignored an invalid workspace retarget message.');
            }
            break;
          }

          case 'ocrWorkspace.bootstrapResponse': {
            if (body?.ok === false || body?.kind !== OCR_RESULTS_WORKSPACE_KIND) {
              setBusy(false);
              setError(responseError(body, 'OCR Results workspace could not be opened.'));
              break;
            }
            if (
              body?.alreadyOpen === true
              || body?.reused === true
              || body?.focusOnly === true
              || (typeof body?.message === 'string' && /already open/i.test(body.message))
            ) {
              const notice = String(body?.message || 'OCR Results workspace already open.');
              setError(notice);
              onWorkspaceNotice?.(notice);
            }
            const homeBankingId = Number(body.homeBankingId ?? envelope.homeBankingId ?? -1);
            if (!Number.isFinite(homeBankingId) || homeBankingId <= 0) {
              setBusy(false);
              setError('OCR Results did not receive a valid organization.');
              break;
            }
            const botJobId = Number(body.botJobId || 0);
            const homeUrlId = Number(body.homeUrlId || 0);
            const nextContext: WorkspaceContext = {
              homeBankingId,
              ...(botJobId > 0 ? { botJobId } : {}),
              ...(homeUrlId > 0 ? { homeUrlId } : {}),
              parameters: Array.isArray(body.parameters) ? body.parameters : [],
            };
            setContext(nextContext);
            setBusy(true);
            setError('');
            sendCommand('ocrTest.run', {
              homeBankingId,
              ...(nextContext.botJobId ? { botJobId: nextContext.botJobId } : {}),
              ...(nextContext.homeUrlId ? { homeUrlId: nextContext.homeUrlId } : {}),
              parameters: nextContext.parameters,
            }, homeBankingId);
            break;
          }

          case 'ocrTest.runResponse':
            setBusy(false);
            if (!body?.ok) {
              setError(responseError(body, 'OCR test failed.'));
              break;
            }
            setResult({
              source: String(body.source || 'OCR test result'),
              wordCount: Number(body.wordCount || 0),
              counts: body.counts || {},
              rows: Array.isArray(body.rows) ? body.rows : [],
              ...(body.annotatedImage ? { annotatedImage: String(body.annotatedImage) } : {}),
            });
            setError('');
            break;

          case 'ocrWorkspace.applySuggestionsResponse':
            setBusy(false);
            if (body?.ok && body?.published) {
              onClose?.();
            } else {
              setError(responseError(body, 'OCR suggestions could not be applied.'));
            }
            break;

          case 'license.requiredResponse':
            setBusy(false);
            setError(responseError(body, 'An active license is required.'));
            break;

          default:
            break;
        }
      } catch (parseError) {
        console.warn('OCR Results ignored an invalid socket message.', parseError);
      }
    }
    processedMessageCountRef.current = messages.length;
  }, [messages, onClose, onWorkspaceRetarget, sendCommand, sessionId]);

  const displayResult = result || emptyResult(
    error || socketError || (busy ? 'Loading OCR result...' : 'No OCR result available.'),
  );

  return (
    <OCRTestResultsPanel
      result={displayResult}
      onAccept={suggestions => {
        if (busy || !context) return;
        setBusy(true);
        setError('');
        sendCommand('ocrWorkspace.applySuggestions', { suggestions });
      }}
      onClose={onClose ?? (() => void 0)}
    />
  );
};

export default OCRResultsWorkspace;
