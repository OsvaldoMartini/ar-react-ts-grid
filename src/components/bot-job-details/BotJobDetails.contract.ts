import type {
  BotJobDetailsEnvelope,
  BotJobDetailsResponse,
  BotJobDetailsState,
} from './BotJobDetails.types';

const BOT_JOB_DETAILS_OPERATIONS = new Set([
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
  return {
    sessionId: expectedSessionId,
    operationId,
    homeBankingId: typeof outer.homeBankingId === 'number' ? outer.homeBankingId : undefined,
    body,
  };
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
