import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { BotJobGraphMutationCapability } from './useBotJobInstructionGraphMutation';

export const GRID_ITEM_TEST_ACTION_OPERATION = 'gridItem.testAction' as const;
export const GRID_ITEM_TEST_ACTION_RESPONSE = 'gridItem.testActionResponse' as const;
export const GRID_ITEM_TEST_ACTION_CONTRACT_VERSION = 1 as const;
export const GRID_ITEM_TEST_ACTION_TIMEOUT_MS = 25_000;

export type GridItemTestAction = 'CLICK' | 'INPUT';

const GRID_ITEM_WEB_ELEMENT_ACTIONS = new Set([
  'I',
  'INPUT',
  'O',
  'OUTPUT',
  'C',
  'CLICK',
  'A',
  'ANCHOR',
  'W',
  'OTHER',
]);

export const GRID_ITEM_TEST_ACTIONS: readonly GridItemTestAction[] = [
  'INPUT',
  'CLICK',
];

export const gridItemTestActionsForInstruction = (
  instructionAction: unknown,
): readonly GridItemTestAction[] => {
  if (typeof instructionAction !== 'string') return [];
  const action = instructionAction.split(':', 1)[0].trim().toUpperCase();
  return GRID_ITEM_WEB_ELEMENT_ACTIONS.has(action)
    ? GRID_ITEM_TEST_ACTIONS
    : [];
};

export type GridItemTestActionResult = {
  ok: boolean;
  requestId: string;
  instructionId: number;
  action: GridItemTestAction;
  message: string;
  error: string;
  code: string;
  valueSource: string;
  datasetMode: string;
  excelRowIndex: number | null;
  column: string;
};

type UseGridItemTestActionOptions = {
  webSocket: WebSocket | null;
  connected: boolean;
  messages: readonly string[];
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  capability: BotJobGraphMutationCapability | null;
  onResult: (result: GridItemTestActionResult) => void;
  transportSessionId?: string;
  timeoutMs?: number;
};

type PendingTestAction = {
  requestId: string;
  homeBankingId: number;
  botJobId: number;
  instructionId: number;
  action: GridItemTestAction;
  workspaceEpoch: number | null;
  transportSessionId: string;
  webSocket: WebSocket;
  timeoutId: ReturnType<typeof setTimeout>;
};

type TestActionRequest = {
  contractVersion: typeof GRID_ITEM_TEST_ACTION_CONTRACT_VERSION;
  requestId: string;
  homeBankingId: number;
  botJobId: number;
  instructionId: number;
  action: GridItemTestAction;
  excelRowIndex: number;
  workspaceEpoch?: number;
  baseGraphVersion?: number;
  graphRevision?: string;
};

const BOT_JOB_SESSION_ID = 'botJobTasks';
let requestSequence = 0;

const nextRequestId = (instructionId: number, action: GridItemTestAction): string => {
  requestSequence = requestSequence >= Number.MAX_SAFE_INTEGER
    ? 1
    : requestSequence + 1;
  return [
    Date.now().toString(36),
    instructionId,
    'grid-test',
    action.toLowerCase(),
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

const resultFromBody = (
  body: Record<string, unknown>,
  pending: PendingTestAction,
): GridItemTestActionResult => ({
  ok: body.ok === true,
  requestId: pending.requestId,
  instructionId: pending.instructionId,
  action: pending.action,
  message: textValue(body.message),
  error: textValue(body.error)
    || (body.ok === true ? '' : textValue(body.message)),
  code: textValue(body.code) || textValue(body.errorCode),
  valueSource: textValue(body.valueSource),
  datasetMode: textValue(body.datasetMode),
  excelRowIndex: nonNegativeInteger(body.excelRowIndex),
  column: textValue(body.column),
});

/**
 * Owns the isolated GridItem CLICK/INPUT test transport. The request contains
 * instruction identity only; locator resolution and INPUT value selection are
 * authoritative backend responsibilities.
 */
export const useGridItemTestAction = ({
  webSocket,
  connected,
  messages,
  sessionId,
  homeBankingId,
  botJobId,
  capability,
  onResult,
  transportSessionId = BOT_JOB_SESSION_ID,
  timeoutMs = GRID_ITEM_TEST_ACTION_TIMEOUT_MS,
}: UseGridItemTestActionOptions) => {
  const pendingRef = useRef<PendingTestAction | null>(null);
  const processedMessageCountRef = useRef(0);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [pendingInstructionId, setPendingInstructionId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<GridItemTestAction | null>(null);

  const clearPending = useCallback((): PendingTestAction | null => {
    const pending = pendingRef.current;
    if (!pending) return null;
    clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    setPendingRequestId(null);
    setPendingInstructionId(null);
    setPendingAction(null);
    return pending;
  }, []);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const currentBotJobId = positiveInteger(botJobId);
    const currentHomeBankingId = positiveInteger(homeBankingId);
    const authority = currentBotJobId === null
      ? null
      : matchingCapability(capability, homeBankingId, currentBotJobId);
    const workspaceChanged = currentBotJobId !== pending.botJobId
      || currentHomeBankingId !== pending.homeBankingId
      || (pending.workspaceEpoch !== null
        && authority?.workspaceEpoch !== pending.workspaceEpoch);
    if (
      !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || webSocket !== pending.webSocket
      || sessionId !== pending.transportSessionId
      || workspaceChanged
    ) {
      const cancelled = clearPending();
      if (!cancelled) return;
      onResult({
        ok: false,
        requestId: cancelled.requestId,
        instructionId: cancelled.instructionId,
        action: cancelled.action,
        message: '',
        error: workspaceChanged
          ? 'The instruction workspace changed before the test completed.'
          : 'The instruction-test connection closed before the test completed.',
        code: workspaceChanged ? 'WORKSPACE_CHANGED' : 'DISCONNECTED',
        valueSource: '',
        datasetMode: '',
        excelRowIndex: null,
        column: '',
      });
    }
  }, [
    botJobId,
    capability,
    clearPending,
    connected,
    homeBankingId,
    onResult,
    sessionId,
    transportSessionId,
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
    action: GridItemTestAction,
    excelRowIndex = 0,
  ): string | null => {
    const activeBotJobId = positiveInteger(botJobId);
    const activeHomeBankingId = positiveInteger(homeBankingId);
    const activeInstructionId = positiveInteger(instructionId);
    const activeExcelRowIndex = nonNegativeInteger(excelRowIndex);
    if (
      sessionId !== transportSessionId
      || !connected
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || activeBotJobId === null
      || activeHomeBankingId === null
      || activeInstructionId === null
      || activeExcelRowIndex === null
      || (action !== 'CLICK' && action !== 'INPUT')
      || pendingRef.current
    ) {
      return null;
    }

    const requestId = nextRequestId(activeInstructionId, action);
    const authority = matchingCapability(
      capability,
      activeHomeBankingId,
      activeBotJobId,
    );
    const request: TestActionRequest = {
      contractVersion: GRID_ITEM_TEST_ACTION_CONTRACT_VERSION,
      requestId,
      homeBankingId: activeHomeBankingId,
      botJobId: activeBotJobId,
      instructionId: activeInstructionId,
      action,
      excelRowIndex: activeExcelRowIndex,
      ...(authority ? {
        workspaceEpoch: authority.workspaceEpoch,
        baseGraphVersion: authority.graphVersion,
        graphRevision: authority.graphRevision,
      } : {}),
    };
    const timeoutId = setTimeout(() => {
      if (pendingRef.current?.requestId !== requestId) return;
      const timedOut = clearPending();
      if (!timedOut) return;
      onResult({
        ok: false,
        requestId,
        instructionId: activeInstructionId,
        action,
        message: '',
        error: 'The instruction test timed out before the backend responded.',
        code: 'TIMEOUT',
        valueSource: '',
        datasetMode: '',
        excelRowIndex: null,
        column: '',
      });
    }, timeoutMs);
    pendingRef.current = {
      requestId,
      homeBankingId: activeHomeBankingId,
      botJobId: activeBotJobId,
      instructionId: activeInstructionId,
      action,
      workspaceEpoch: authority?.workspaceEpoch ?? null,
      transportSessionId,
      webSocket,
      timeoutId,
    };
    setPendingRequestId(requestId);
    setPendingInstructionId(activeInstructionId);
    setPendingAction(action);

    try {
      webSocket.send(JSON.stringify({
        type: GRID_ITEM_TEST_ACTION_OPERATION,
        sessionId: transportSessionId,
        homeBankingId: activeHomeBankingId,
        body: JSON.stringify(request),
      }));
      return requestId;
    } catch {
      clearPending();
      onResult({
        ok: false,
        requestId,
        instructionId: activeInstructionId,
        action,
        message: '',
        error: 'The instruction-test request could not be sent.',
        code: 'SEND_FAILED',
        valueSource: '',
        datasetMode: '',
        excelRowIndex: null,
        column: '',
      });
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
    transportSessionId,
    webSocket,
  ]);

  const handleMessage = useCallback((raw: unknown): boolean => {
    const pending = pendingRef.current;
    if (!pending) return false;
    const envelope = objectValue(parsedJson(raw));
    if (!envelope) return false;
    const operation = textValue(envelope.operationId) || textValue(envelope.type);
    if (
      operation !== GRID_ITEM_TEST_ACTION_RESPONSE
      || textValue(envelope.sessionId) !== pending.transportSessionId
    ) {
      return false;
    }
    const body = objectValue(parsedJson(envelope.body));
    if (!body) return true;
    if (textValue(body.requestId) !== pending.requestId) return true;
    if (
      Number(body.contractVersion) !== GRID_ITEM_TEST_ACTION_CONTRACT_VERSION
      || positiveInteger(body.botJobId) !== pending.botJobId
      || positiveInteger(body.instructionId) !== pending.instructionId
      || textValue(body.action).toUpperCase() !== pending.action
      || typeof body.ok !== 'boolean'
    ) {
      return true;
    }
    const completed = clearPending();
    if (!completed) return true;
    onResult(resultFromBody(body, completed));
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
    pendingAction,
    submit,
    handleMessage,
  };
};
