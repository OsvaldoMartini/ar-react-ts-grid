export const BOT_JOB_WINDOW_SESSION_PREFIX = 'bot-job-window-';

const BOT_JOB_WINDOW_SESSION_PATTERN = new RegExp(
  `^${BOT_JOB_WINDOW_SESSION_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
);

export interface BotJobWindowTarget {
  botJobId: number;
  workspaceEpoch: number;
}

export const isBotJobWindowSession = (sessionId: string): boolean =>
  BOT_JOB_WINDOW_SESSION_PATTERN.test(sessionId);

export const parseBotJobWindowTarget = (body: unknown): BotJobWindowTarget | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const candidate = body as Record<string, unknown>;
  const botJobId = candidate.botJobId;
  const workspaceEpoch = candidate.workspaceEpoch;
  if (typeof botJobId !== 'number' || typeof workspaceEpoch !== 'number') return null;
  if (!Number.isSafeInteger(botJobId) || botJobId <= 0) return null;
  if (!Number.isSafeInteger(workspaceEpoch) || workspaceEpoch <= 0) return null;
  return { botJobId, workspaceEpoch };
};

export const botJobWindowTargetUrl = (
  currentUrl: string,
  sessionId: string,
  botJobId: number,
): string => {
  if (!isBotJobWindowSession(sessionId)) {
    throw new Error('A valid Bot Job window control session is required');
  }
  if (!Number.isSafeInteger(botJobId) || botJobId <= 0) {
    throw new Error('A positive Bot Job ID is required');
  }
  const target = new URL(currentUrl);
  target.searchParams.set('desktopShell', '1');
  target.searchParams.set('openBotJob', String(botJobId));
  target.searchParams.set('botJobWindowSession', sessionId);
  return target.toString();
};
