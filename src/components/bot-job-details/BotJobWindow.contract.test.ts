import {
  BOT_JOB_WINDOW_SESSION_PREFIX,
  botJobWindowTargetUrl,
  isBotJobWindowSession,
  parseBotJobWindowTarget,
} from './BotJobWindow.contract';

const SESSION = 'bot-job-window-123e4567-e89b-42d3-a456-426614174000';

test('accepts only coordinator-issued Bot Job window UUID sessions', () => {
  expect(BOT_JOB_WINDOW_SESSION_PREFIX).toBe('bot-job-window-');
  expect(isBotJobWindowSession(SESSION)).toBe(true);
  expect(isBotJobWindowSession(SESSION.toUpperCase())).toBe(false);
  expect(isBotJobWindowSession('bot-job-window-not-a-uuid')).toBe(false);
  expect(isBotJobWindowSession('page-scanner-123e4567-e89b-42d3-a456-426614174000')).toBe(false);
});

test('parses only positive safe Bot Job window targets', () => {
  expect(parseBotJobWindowTarget({ botJobId: 42, workspaceEpoch: 9 })).toEqual({
    botJobId: 42,
    workspaceEpoch: 9,
  });
  expect(parseBotJobWindowTarget({ botJobId: 0, workspaceEpoch: 9 })).toBeNull();
  expect(parseBotJobWindowTarget({ botJobId: 42, workspaceEpoch: -1 })).toBeNull();
  expect(parseBotJobWindowTarget({ botJobId: 'not-a-job', workspaceEpoch: 9 })).toBeNull();
  expect(parseBotJobWindowTarget({ botJobId: '42', workspaceEpoch: 9 })).toBeNull();
});

test('updates the same Bot Job native route without dropping its control session', () => {
  const next = new URL(botJobWindowTargetUrl(
    'http://127.0.0.1:53972/?desktopShell=1&openBotJob=41&botJobWindowSession=old',
    SESSION,
    42,
  ));
  expect(next.searchParams.get('desktopShell')).toBe('1');
  expect(next.searchParams.get('openBotJob')).toBe('42');
  expect(next.searchParams.get('botJobWindowSession')).toBe(SESSION);
});
