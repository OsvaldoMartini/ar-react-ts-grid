import React, { useCallback, useEffect, useRef, useState } from 'react';
import OCRConfigPanel, {
  type OCRConfigData,
  type OCRParameter,
} from '../OCRConfigPanel';
import PagesOpenButton from '../PagesOpenButton';
import {
  OCR_CONFIG_WORKSPACE_KIND,
  OCR_RESULTS_WORKSPACE_KIND,
} from '../scanner/Scanner.sessions';
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
  homeUrlId?: number;
};

type SocketEnvelope = {
  operationId?: string;
  sessionId?: string;
  homeBankingId?: number;
  body?: unknown;
};

const EMPTY_CONFIG: OCRConfigData = {
  profiles: [],
  categories: [],
  parameters: [],
};

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const messageError = (body: any, fallback: string) => String(body?.error || body?.message || fallback);

const OCRConfigWorkspace: React.FC<Props> = ({
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
  const [config, setConfig] = useState<OCRConfigData>(EMPTY_CONFIG);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'OCR Configuration';
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

  const reloadConfig = useCallback((scope: WorkspaceContext) => {
    setBusy(true);
    sendCommand('ocrConfig.bootstrap', {
      homeBankingId: scope.homeBankingId,
      ...(scope.homeUrlId ? { homeUrlId: scope.homeUrlId } : {}),
    }, scope.homeBankingId);
  }, [sendCommand]);

  useEffect(() => {
    if (retiredSessionRef.current) return;
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }

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
              OCR_CONFIG_WORKSPACE_KIND,
            );
            if (retarget) {
              onWorkspaceRetarget(retarget);
              if (retarget.sessionId !== sessionId) {
                retiredSessionRef.current = true;
                processedMessageCountRef.current = messages.length;
                return;
              }
            } else {
              console.warn('OCR Configuration ignored an invalid workspace retarget message.');
            }
            break;
          }

          case 'ocrWorkspace.bootstrapResponse': {
            if (body?.ok === false) {
              setBusy(false);
              setError(messageError(body, 'OCR workspace could not be opened.'));
              break;
            }
            const payload = body?.context || body?.scope || body || {};
            const homeBankingId = Number(payload.homeBankingId ?? envelope.homeBankingId ?? -1);
            if (!Number.isFinite(homeBankingId) || homeBankingId <= 0) {
              setBusy(false);
              setError('OCR workspace did not receive a valid organization.');
              break;
            }
            const rawHomeUrlId = Number(payload.homeUrlId || 0);
            const nextContext: WorkspaceContext = {
              homeBankingId,
              ...(rawHomeUrlId > 0 ? { homeUrlId: rawHomeUrlId } : {}),
            };
            setContext(nextContext);
            setError('');
            reloadConfig(nextContext);
            break;
          }

          case 'ocrConfig.bootstrapResponse':
          case 'ocrConfig.profileResponse': {
            setBusy(false);
            if (!body?.ok) {
              setError(messageError(body, 'OCR configuration could not be loaded.'));
              break;
            }
            setConfig(previous => ({
              profiles: body.profiles || previous.profiles || [],
              activeProfileId: body.profile?.id ?? body.activeProfileId ?? previous.activeProfileId,
              categories: body.categories || previous.categories || [],
              parameters: body.parameters || [],
            }));
            setError('');
            break;
          }

          case 'ocrConfig.saveResponse':
          case 'ocrConfig.deleteResponse': {
            if (!body?.ok) {
              setBusy(false);
              setError(messageError(body, 'OCR profile operation failed.'));
              break;
            }
            if (context) reloadConfig(context);
            break;
          }

          case 'ocrConfig.cleanupPreviewResponse': {
            setBusy(false);
            if (!body?.ok) {
              setError(messageError(body, 'Cleanup preview failed.'));
              break;
            }
            const candidates = Array.isArray(body.candidates) ? body.candidates : [];
            if (candidates.length === 0) {
              setError('No orphan locators found.');
              break;
            }
            const details = candidates
              .slice(0, 10)
              .map((item: any) => `${item.definedName}: ${item.reason}`)
              .join('\n');
            if (window.confirm(
              `Delete ${candidates.length} orphan locator(s)?\n\n${details}${candidates.length > 10 ? '\n...' : ''}`,
            )) {
              setBusy(true);
              sendCommand('ocrConfig.cleanupApply', {
                homeBankingId: context?.homeBankingId,
                confirmed: true,
              });
            }
            break;
          }

          case 'ocrConfig.cleanupApplyResponse':
            setBusy(false);
            setError(body?.ok
              ? `Cleanup complete: ${Number(body.deleted || 0)} locator(s) deleted.`
              : messageError(body, 'Cleanup failed.'));
            break;

          case 'ocrWorkspace.openResponse':
            setBusy(false);
            if (body?.ok === false) {
              setError(messageError(body, 'OCR Results could not be opened.'));
            } else if (
              body?.alreadyOpen === true
              || body?.reused === true
              || body?.focusOnly === true
              || (typeof body?.message === 'string' && /already open/i.test(body.message))
            ) {
              const notice = String(body?.message || 'OCR Results workspace already open.');
              setError(notice);
              onWorkspaceNotice?.(notice);
            } else {
              setError('');
            }
            break;

          case 'license.requiredResponse':
            setBusy(false);
            setError(messageError(body, 'An active license is required.'));
            break;

          default:
            break;
        }
      } catch (parseError) {
        console.warn('OCR configuration ignored an invalid socket message.', parseError);
      }
    }

    processedMessageCountRef.current = messages.length;
  }, [context, messages, onWorkspaceRetarget, reloadConfig, sendCommand, sessionId]);

  const saveConfig = (draft: {
    profileId?: number;
    name: string;
    description: string;
    parameters: OCRParameter[];
    asNew: boolean;
  }) => {
    if (!context) return;
    setBusy(true);
    setError('');
    sendCommand('ocrConfig.save', {
      ...draft,
      homeBankingId: context.homeBankingId,
      ...(context.homeUrlId ? { homeUrlId: context.homeUrlId } : {}),
    });
  };

  const deleteConfig = (profileId: number) => {
    if (!context || !window.confirm('Delete this OCR profile?')) return;
    setBusy(true);
    setError('');
    sendCommand('ocrConfig.delete', { profileId, confirmed: true });
  };

  const openResults = (parameters: OCRParameter[]) => {
    if (!context) return;
    setBusy(true);
    setError('');
    sendCommand('ocrWorkspace.open', {
      kind: OCR_RESULTS_WORKSPACE_KIND,
      homeBankingId: context.homeBankingId,
      ...(context.homeUrlId ? { homeUrlId: context.homeUrlId } : {}),
      parameters,
    });
  };

  return (
    <OCRConfigPanel
      data={config}
      busy={busy || !connected || !context}
      error={error || socketError || ''}
      onSelect={profileId => {
        setBusy(true);
        setError('');
        sendCommand('ocrConfig.profile', { profileId });
      }}
      onSave={saveConfig}
      onDelete={deleteConfig}
      onCleanup={() => {
        if (!context) return;
        setBusy(true);
        setError('');
        sendCommand('ocrConfig.cleanupPreview', { homeBankingId: context.homeBankingId });
      }}
      onTest={openResults}
      onClose={onClose ?? (() => void 0)}
      headerAction={(
        <PagesOpenButton
          webSocket={webSocket}
          connected={connected}
          messages={messages}
          sessionId={sessionId}
        />
      )}
    />
  );
};

export default OCRConfigWorkspace;
