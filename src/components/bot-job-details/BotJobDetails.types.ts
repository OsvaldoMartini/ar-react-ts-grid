export type BotJobWorkspaceSurface = 'botJob' | 'components' | 'preScan';

export type BotJobWorkspaceAction =
  | 'REFRESH'
  | 'SHOW_BOT_JOB'
  | 'SHOW_COMPONENTS'
  | 'HIDE_COMPONENTS'
  | 'SHOW_PRE_SCAN'
  | 'CLOSE';

export type BotJobWorkspaceStatusTone = 'neutral' | 'success' | 'warning' | 'error';
