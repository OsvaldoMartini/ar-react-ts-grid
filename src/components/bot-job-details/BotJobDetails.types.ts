export type BotJobWorkspaceSurface = 'botJob' | 'components' | 'preScan';

export type BotJobWorkspaceAction =
  | 'REFRESH'
  | 'SHOW_BOT_JOB'
  | 'SHOW_COMPONENTS'
  | 'HIDE_COMPONENTS'
  | 'SHOW_PRE_SCAN'
  | 'OPEN_ORGANIZATIONS'
  | 'CLOSE';

export type BotJobWorkspaceStatusTone = 'neutral' | 'success' | 'warning' | 'error';

export type BotJobExecutionState =
  | 'UNKNOWN'
  | 'IDLE'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'PASSED'
  | 'FAILED'
  | 'INTERRUPTED';

export interface BotJobEnvironment {
  id: number;
  name: string;
  url: string;
  homeBankingId: number;
  organizationName: string;
}

export interface BotJobBlockSummary {
  id: number;
  order: number;
  name: string;
  description: string;
  typeId: number;
  active: boolean;
  waitSeconds: number;
}

export interface BotJobCapabilities {
  canUseWorkspaceActions: boolean;
  canEditMetadata: boolean;
  canUsePreScan: boolean;
  canShowComponents: boolean;
  canExecute: boolean;
  canLaunch: boolean;
  canOpenOrganizations: boolean;
}

export interface BotJobDetailsState {
  revision: number;
  botJobId: number;
  name: string;
  description: string;
  projectType: string;
  active: boolean;
  homeBankingId: number;
  organizationName: string;
  homeUrlId: number;
  environmentName: string;
  environmentUrl: string;
  navigationTimeSeconds: number;
  environments: BotJobEnvironment[];
  blocks: BotJobBlockSummary[];
  capabilities: BotJobCapabilities;
  executionState: BotJobExecutionState;
  activeSurface: BotJobWorkspaceSurface;
  componentsVisible: boolean;
}

export interface BotJobMetadataDraft {
  expectedRevision: number;
  name: string;
  description: string;
  homeUrlId: number;
}

export interface BotJobDetailsResponse {
  ok: boolean;
  message?: string;
  requestId?: string;
  botJobId: number;
  state?: BotJobDetailsState | null;
  activeSurface?: BotJobWorkspaceSurface;
  componentsVisible?: boolean;
  action?: BotJobWorkspaceAction;
  errorCode?: string | null;
  fieldErrors?: Record<string, string>;
}

export interface BotJobDetailsEnvelope {
  sessionId: string;
  operationId: string;
  homeBankingId?: number;
  body: BotJobDetailsResponse;
}
