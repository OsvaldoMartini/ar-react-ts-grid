import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { WebElementExecutionType } from '../../../webElementExecutionType';
import type { BotJobGraphMutationCapability } from './useBotJobInstructionGraphMutation';

export const GRID_ITEM_WEB_ELEMENT_TYPE_OPERATION = 'gridItem.webElementType.update' as const;
export const GRID_ITEM_WEB_ELEMENT_TYPE_RESPONSE = 'gridItem.webElementType.updateResponse' as const;
export const GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION = 1 as const;
export const GRID_ITEM_WEB_ELEMENT_TYPE_TIMEOUT_MS = 25_000;

const BOT_JOB_SESSION_ID = 'botJobTasks';
const WEB_ELEMENT_TYPES = new Set<WebElementExecutionType>([
  'INPUT',
  'OUTPUT',
  'CLICK',
]);

export const gridItemWebElementTypeForAction = (
  instructionAction: unknown,
): WebElementExecutionType | null => {
  if (typeof instructionAction !== 'string') return null;
  const action = instructionAction.split(':', 1)[0].trim().toUpperCase();
  if (action === 'I' || action === 'INPUT') return 'INPUT';
  if (action === 'O' || action === 'OUTPUT') return 'OUTPUT';
  if (
    action === 'C'
    || action === 'CLICK'
    || action === 'W'
    || action === 'OTHER'
  ) return 'CLICK';
  return null;
};

export type GridItemWebElementTypeResult = {
  ok: boolean;
  requestId: string;
  instructionId: number;
  expectedType: WebElementExecutionType;
  replacementType: WebElementExecutionType;
  changed: boolean;
  committedType: WebElementExecutionType | null;
  committedAction: string;
  message: string;
  code: string;
  resyncRequired: boolean;
};

type UseGridItemWebElementTypeOptions = {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  capability: BotJobGraphMutationCapability | null;
  onResult: (result: GridItemWebElementTypeResult) => void;
  timeoutMs?: number;
};

type PendingMutation = {
  requestId: string;
  homeBankingId: number;
  botJobId: number;
  instructionId: number;
  expectedType: WebElementExecutionType;
  replacementType: WebElementExecutionType;
  workspaceEpoch: number;
  graphVersion: number;
  graphRevision: string;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
};

type MutationRequest = {
  contractVersion: typeof GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION;
  requestId: string;
  homeBankingId: number;
  botJobId: number;
  instructionId: number;
  workspaceEpoch: number;
  baseGraphVersion: number;
  graphRevision: string;
  expectedType: WebElementExecutionType;
  replacementType: WebElementExecutionType;
};

let requestSequence = 0;

const nextRequestId = (instructionId: number): string => {
  requestSequence = requestSequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : requestSequence + 1;
  return [
    Date.now().toString(36),
    instructionId,
    'grid-web-element-type',
    requestSequence.toString(36),
  ].join('-');
};

const objectValue = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const parsedJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const textValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const positiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const nonNegativeInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

const webElementType = (value: unknown): WebElementExecutionType | null => {
  const normalized = textValue(value).toUpperCase() as WebElementExecutionType;
  return WEB_ELEMENT_TYPES.has(normalized) ? normalized : null;
};

const matchingCapability = (
  capability: BotJobGraphMutationCapability | null,
  homeBankingId: number,
  botJobId: number,
): BotJobGraphMutationCapability | null => {
  if (!capability?.enabled) return null;
  return capability.ownerAssertion.workspaceKind === 'BOT_JOB'
    && capability.ownerAssertion.homeBankingId === homeBankingId
    && capability.ownerAssertion.botJobId === botJobId
    && Number.isSafeInteger(capability.workspaceEpoch)
    && capability.workspaceEpoch > 0
    && Number.isSafeInteger(capability.graphVersion)
    && capability.graphVersion >= 0
    && capability.graphRevision.trim().length > 0
    ? capability
    : null;
};

const failedResult = (
  pending: PendingMutation,
  code: string,
  message: string,
): GridItemWebElementTypeResult => ({
  ok: false,
  requestId: pending.requestId,
  instructionId: pending.instructionId,
  expectedType: pending.expectedType,
  replacementType: pending.replacementType,
  changed: false,
  committedType: null,
  committedAction: '',
  message,
  code,
  resyncRequired: false,
});

/**
 * Owns the compact persisted GridItem Web Element type mutation. The hook does
 * not mutate grid rows optimistically: a successful acknowledgement releases
 * pending state, while the authoritative `updateInstructions` snapshot remains
 * responsible for changing the rendered action/type.
 */
export const useGridItemWebElementType = ({
  webSocket,
  connected,
  messages,
  sessionId,
  homeBankingId,
  botJobId,
  capability,
  onResult,
  timeoutMs = GRID_ITEM_WEB_ELEMENT_TYPE_TIMEOUT_MS,
}: UseGridItemWebElementTypeOptions) => {
  const pendingRef = useRef<PendingMutation | null>(null);
  const processedMessageCountRef = useRef(0);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [pendingInstructionId, setPendingInstructionId] = useState<number | null>(null);
  const [pendingReplacementType, setPendingReplacementType] =
    useState<WebElementExecutionType | null>(null);

  const clearPending = useCallback((): PendingMutation | null => {
    const pending = pendingRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    setPendingInstructionId(null);
    setPendingReplacementType(null);
    return pending;
  }, []);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const activeBotJobId = positiveInteger(botJobId);
    const activeHomeBankingId = positiveInteger(homeBankingId);
    const authority = activeBotJobId === null || activeHomeBankingId === null
      ? null
      : matchingCapability(capability, activeHomeBankingId, activeBotJobId);
    const workspaceChanged = activeBotJobId !== pending.botJobId
      || activeHomeBankingId !== pending.homeBankingId
      || authority?.workspaceEpoch !== pending.workspaceEpoch;
    if (
      !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || sessionId !== BOT_JOB_SESSION_ID
      || workspaceChanged
    ) {
      const cancelled = clearPending();
      if (!cancelled) return;
      onResult(failedResult(
        cancelled,
        workspaceChanged ? 'WORKSPACE_CHANGED' : 'DISCONNECTED',
        workspaceChanged
          ? 'The Bot Job workspace changed before the Web Element type was saved.'
          : 'The Bot Job connection closed before the Web Element type was saved.',
      ));
    }
  }, [
    botJobId,
    capability,
    clearPending,
    connected,
    homeBankingId,
    onResult,
    sessionId,
    webSocket,
  ]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
  }, []);

  const submit = useCallback((
    instructionId: number,
    expectedType: WebElementExecutionType,
    replacementType: WebElementExecutionType,
  ): string | null => {
    const activeBotJobId = positiveInteger(botJobId);
    const activeHomeBankingId = positiveInteger(homeBankingId);
    const activeInstructionId = positiveInteger(instructionId);
    const authority = activeBotJobId === null || activeHomeBankingId === null
      ? null
      : matchingCapability(capability, activeHomeBankingId, activeBotJobId);
    if (
      sessionId !== BOT_JOB_SESSION_ID
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || activeBotJobId === null
      || activeHomeBankingId === null
      || activeInstructionId === null
      || !WEB_ELEMENT_TYPES.has(expectedType)
      || !WEB_ELEMENT_TYPES.has(replacementType)
      || expectedType === replacementType
      || !authority
      || pendingRef.current
    ) {
      return null;
    }

    const requestId = nextRequestId(activeInstructionId);
    const request: MutationRequest = {
      contractVersion: GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION,
      requestId,
      homeBankingId: activeHomeBankingId,
      botJobId: activeBotJobId,
      instructionId: activeInstructionId,
      workspaceEpoch: authority.workspaceEpoch,
      baseGraphVersion: authority.graphVersion,
      graphRevision: authority.graphRevision,
      expectedType,
      replacementType,
    };
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      const timedOut = clearPending();
      if (!timedOut) return;
      onResult(failedResult(
        timedOut,
        'TIMEOUT',
        'The Web Element type update timed out before the backend responded.',
      ));
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      homeBankingId: activeHomeBankingId,
      botJobId: activeBotJobId,
      instructionId: activeInstructionId,
      expectedType,
      replacementType,
      workspaceEpoch: authority.workspaceEpoch,
      graphVersion: authority.graphVersion,
      graphRevision: authority.graphRevision,
      webSocket,
      timeoutId,
    };
    setPendingRequestId(requestId);
    setPendingInstructionId(activeInstructionId);
    setPendingReplacementType(replacementType);

    try {
      webSocket.send(JSON.stringify({
        type: GRID_ITEM_WEB_ELEMENT_TYPE_OPERATION,
        sessionId: BOT_JOB_SESSION_ID,
        homeBankingId: activeHomeBankingId,
        body: JSON.stringify(request),
      }));
      return requestId;
    } catch {
      const failed = clearPending();
      if (failed) {
        onResult(failedResult(
          failed,
          'SEND_FAILED',
          'The Web Element type update could not be sent.',
        ));
      }
      return null;
    }
  }, [
    botJobId,
    capability,
    clearPending,
    connected,
    homeBankingId,
    onResult,
    sessionId,
    timeoutMs,
    webSocket,
  ]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    const pending = pendingRef.current;
    if (!pending) return false;
    const envelope = objectValue(parsedJson(raw));
    if (!envelope) return false;
    const operation = textValue(envelope.operationId) || textValue(envelope.type);
    if (
      operation !== GRID_ITEM_WEB_ELEMENT_TYPE_RESPONSE
      || textValue(envelope.sessionId) !== BOT_JOB_SESSION_ID
    ) {
      return false;
    }
    const body = objectValue(parsedJson(envelope.body));
    if (!body) return true;
    if (textValue(body.requestId) !== pending.requestId) return true;

    if (Number(body.contractVersion) !== GRID_ITEM_WEB_ELEMENT_TYPE_CONTRACT_VERSION) {
      const failed = clearPending();
      if (failed) onResult(failedResult(
        failed,
        'INVALID_RESPONSE',
        'The backend returned an incompatible Web Element type response.',
      ));
      return true;
    }
    if (body.ok === false) {
      const failed = clearPending();
      if (failed) onResult({
        ...failedResult(
          failed,
          textValue(body.code) || 'REFUSED',
          textValue(body.message) || 'The backend refused the Web Element type update.',
        ),
        resyncRequired: body.resyncRequired === true,
      });
      return true;
    }

    const previousType = webElementType(body.previousType);
    const committedType = webElementType(body.committedType);
    const responseInstructionId = positiveInteger(body.instructionId);
    const responseWorkspaceEpoch = positiveInteger(body.workspaceEpoch);
    const responseGraphVersion = nonNegativeInteger(body.graphVersion);
    const responseGraphRevision = textValue(body.graphRevision);
    const committedAction = textValue(body.committedAction);
    if (
      body.ok !== true
      || responseInstructionId !== pending.instructionId
      || previousType !== pending.expectedType
      || committedType !== pending.replacementType
      || responseWorkspaceEpoch !== pending.workspaceEpoch
      || responseGraphVersion === null
      || !responseGraphRevision
      || !committedAction
      || typeof body.changed !== 'boolean'
      || typeof body.resyncRequired !== 'boolean'
    ) {
      const failed = clearPending();
      if (failed) onResult(failedResult(
        failed,
        'INVALID_RESPONSE',
        'The backend returned an invalid Web Element type acknowledgement.',
      ));
      return true;
    }

    const completed = clearPending();
    if (!completed) return true;
    onResult({
      ok: true,
      requestId: completed.requestId,
      instructionId: completed.instructionId,
      expectedType: completed.expectedType,
      replacementType: completed.replacementType,
      changed: body.changed,
      committedType,
      committedAction,
      message: textValue(body.message),
      code: '',
      resyncRequired: body.resyncRequired,
    });
    return true;
  }, [clearPending, onResult]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;
    pendingMessages.forEach(handleMessage);
  }, [handleMessage, messages]);

  return {
    pendingRequestId,
    pendingInstructionId,
    pendingReplacementType,
    submit,
    handleMessage,
  };
};
