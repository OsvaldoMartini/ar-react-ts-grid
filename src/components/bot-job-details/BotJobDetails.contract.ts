import type {
  BotJobDetailsEnvelope,
  BotJobDetailsResponse,
  BotJobDetailsState,
  BotJobExecutionPauseRequest,
  ExecutionPreflightIssue,
  ExecutionPreflightReport,
} from './BotJobDetails.types';

const BOT_JOB_DETAILS_OPERATIONS = new Set([
  'pageScannerWorkspace.openResponse',
  'botJobDetails.actionResponse',
  'botJobDetails.toolbar.actionResponse',
  'botJobDetails.bootstrapResponse',
  'botJobDetails.metadata.updateResponse',
  'botJobDetails.environments.refreshResponse',
  'botJobDetails.state',
]);

const EXECUTION_STATES = new Set([
  'UNKNOWN', 'IDLE', 'STARTING', 'RUNNING', 'STOPPING', 'PASSED', 'FAILED', 'INTERRUPTED',
]);

const WORKSPACE_SURFACES = new Set(['botJob', 'components', 'preScan']);

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInteger(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || isInteger(value, 1);
}

function isIntegerArray(value: unknown, minimum = 1): value is number[] {
  return Array.isArray(value)
    && value.every(item => isInteger(item, minimum));
}

function hasBooleanFields(value: unknown, fields: string[]): boolean {
  return isRecord(value) && fields.every((field) => typeof value[field] === 'boolean');
}

function isEnvironment(value: unknown): boolean {
  return isRecord(value)
    && isInteger(value.id, 1)
    && typeof value.name === 'string'
    && typeof value.url === 'string'
    && isInteger(value.homeBankingId, 1)
    && typeof value.organizationName === 'string';
}

function isBlock(value: unknown): boolean {
  return isRecord(value)
    && isInteger(value.id, 1)
    && isInteger(value.order, 0)
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && isInteger(value.typeId, 0)
    && typeof value.active === 'boolean'
    && isInteger(value.waitSeconds, 0);
}

function isExecutionPreflightIssue(value: unknown): value is ExecutionPreflightIssue {
  return isRecord(value)
    && typeof value.code === 'string'
    && value.code.trim().length > 0
    && typeof value.kind === 'string'
    && value.kind.trim().length > 0
    && isNullablePositiveInteger(value.blockId)
    && isNullablePositiveInteger(value.instructionId)
    && typeof value.message === 'string'
    && value.message.trim().length > 0;
}

export function isExecutionPreflightReport(
  value: unknown,
): value is ExecutionPreflightReport {
  if (!isRecord(value)
    || value.enforcement !== 'WARN'
    || !['READY', 'WOULD_BLOCK', 'UNAVAILABLE'].includes(value.status)
    || typeof value.stage !== 'string'
    || value.stage.trim().length === 0
    || !isIntegerArray(value.reachableBlockIds)
    || !isIntegerArray(value.reachableInstructionIds)
    || !isInteger(value.totalIssues, 0)
    || !Array.isArray(value.issues)
    || !value.issues.every(isExecutionPreflightIssue)
    || value.totalIssues < value.issues.length
    || !(value.graphVersion === null || isInteger(value.graphVersion, 0))
    || !(value.contentRevision === null || typeof value.contentRevision === 'string')
    || !(value.unavailableReason === null || typeof value.unavailableReason === 'string')) {
    return false;
  }

  const ownerValid = value.owner === null
    || (isRecord(value.owner)
      && isInteger(value.owner.homeBankingId, 1)
      && isInteger(value.owner.botJobId, 1));
  const scopeValid = value.runScope === null
    || (isRecord(value.runScope)
      && ['ALL', 'ONE', 'FROM_BLOCK'].includes(value.runScope.kind)
      && isNullablePositiveInteger(value.runScope.selectedBlockId)
      && (value.runScope.kind === 'ALL'
        ? value.runScope.selectedBlockId === null
        : isInteger(value.runScope.selectedBlockId, 1)));
  if (!ownerValid || !scopeValid) return false;

  if (value.status === 'UNAVAILABLE') {
    return value.owner === null
      && value.runScope === null
      && value.contentRevision === null
      && value.graphVersion === null
      && value.reachableBlockIds.length === 0
      && value.reachableInstructionIds.length === 0
      && value.totalIssues === 0
      && value.issues.length === 0
      && typeof value.unavailableReason === 'string'
      && value.unavailableReason.trim().length > 0;
  }

  return value.owner !== null
    && value.runScope !== null
    && typeof value.contentRevision === 'string'
    && value.contentRevision.trim().length > 0
    && value.unavailableReason === null
    && (value.status === 'READY'
      ? value.totalIssues === 0 && value.issues.length === 0
      : value.totalIssues > 0);
}

function isBotJobDetailsState(value: unknown, expectedBotJobId: number): value is BotJobDetailsState {
  if (!isRecord(value)) return false;
  return isInteger(value.revision, 1)
    && isInteger(value.metadataRevision, 1)
    && isInteger(value.botJobId, 1)
    && value.botJobId === expectedBotJobId
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.projectType === 'string'
    && typeof value.active === 'boolean'
    && isInteger(value.homeBankingId, 1)
    && typeof value.organizationName === 'string'
    && isInteger(value.homeUrlId, 0)
    && typeof value.environmentName === 'string'
    && typeof value.environmentUrl === 'string'
    && isInteger(value.navigationTimeSeconds, 0)
    && typeof value.transferPathConfigured === 'boolean'
    && Array.isArray(value.environments)
    && value.environments.every(isEnvironment)
    && Array.isArray(value.blocks)
    && value.blocks.every(isBlock)
    && hasBooleanFields(value.capabilities, [
      'canUseWorkspaceActions',
      'canEditMetadata',
      'canUsePreScan',
      'canShowComponents',
      'canExecute',
      'canLaunch',
      'canUseFileActions',
      'canOpenOrganizations',
    ])
    && typeof value.executionState === 'string'
    && EXECUTION_STATES.has(value.executionState)
    && typeof value.activeSurface === 'string'
    && WORKSPACE_SURFACES.has(value.activeSurface)
    && typeof value.componentsVisible === 'boolean';
}

function parseJsonObject(value: unknown): Record<string, any> | null {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;
}

export function parseBotJobDetailsEnvelope(
  raw: string,
  expectedSessionId: string,
  expectedBotJobId: number,
): BotJobDetailsEnvelope | null {
  const outer = parseJsonObject(raw);
  if (!outer || outer.sessionId !== expectedSessionId) return null;
  const operationId = typeof outer.operationId === 'string' ? outer.operationId : '';
  if (!BOT_JOB_DETAILS_OPERATIONS.has(operationId)) return null;
  const body = parseJsonObject(outer.body) as BotJobDetailsResponse | null;
  if (!body || !isInteger(body.botJobId, 1) || body.botJobId !== expectedBotJobId) return null;
  if (body.state != null && !isBotJobDetailsState(body.state, expectedBotJobId)) return null;
  if (body.executionPreflight !== undefined
    && !isExecutionPreflightReport(body.executionPreflight)) return null;
  if (body.executionPreflight?.owner
    && body.executionPreflight.owner.botJobId !== expectedBotJobId) return null;
  if (body.executionPreflight?.owner
    && isInteger(outer.homeBankingId, 1)
    && body.executionPreflight.owner.homeBankingId !== outer.homeBankingId) return null;
  return {
    sessionId: expectedSessionId,
    operationId,
    homeBankingId: typeof outer.homeBankingId === 'number' ? outer.homeBankingId : undefined,
    body,
  };
}

export function parseBotJobExecutionPauseRequest(
  raw: string,
  expectedSessionId: string,
  expectedBotJobId: number,
): BotJobExecutionPauseRequest | null {
  const outer = parseJsonObject(raw);
  if (
    !outer
    || outer.sessionId !== expectedSessionId
    || outer.operationId !== 'botJobExecution.pause.request'
  ) return null;
  const body = parseJsonObject(outer.body);
  if (!body) return null;
  const valid = typeof body.requestId === 'string'
    && body.requestId.trim().length > 0
    && isInteger(body.botJobId, 1)
    && body.botJobId === expectedBotJobId
    && isInteger(body.workspaceEpoch, 1)
    && isInteger(body.executionId, 1)
    && isInteger(body.executionAttemptId, 0)
    && typeof body.title === 'string'
    && typeof body.header === 'string'
    && typeof body.blockName === 'string'
    && typeof body.instructionName === 'string'
    && typeof body.body === 'string'
    && typeof body.continueLabel === 'string'
    && body.continueLabel.trim().length > 0
    && typeof body.stopLabel === 'string'
    && body.stopLabel.trim().length > 0;
  return valid ? body as BotJobExecutionPauseRequest : null;
}

export function reduceBotJobDetailsState(
  current: BotJobDetailsState | null,
  incoming: BotJobDetailsState | null | undefined,
): BotJobDetailsState | null {
  if (!incoming || !isBotJobDetailsState(incoming, incoming.botJobId)) return current;
  if (current && incoming.botJobId !== current.botJobId) return current;
  if (current && incoming.revision <= current.revision) return current;
  return incoming;
}
