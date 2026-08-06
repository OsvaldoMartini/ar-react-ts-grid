export type BotJobWorkspaceSurface = 'botJob' | 'components' | 'preScan';

export type BotJobWorkspaceAction =
  | 'REFRESH'
  | 'SHOW_BOT_JOB'
  | 'SHOW_COMPONENTS'
  | 'SHOW_VARIABLES'
  | 'SHOW_EXCEL_DATA'
  | 'SHOW_SMOKE_TEST'
  | 'SHOW_RUNTIME_VARIABLES'
  | 'HIDE_COMPONENTS'
  | 'SHOW_PRE_SCAN'
  | 'OPEN_ORGANIZATIONS'
  | 'CLOSE';

export type BotJobToolbarAction =
  | 'OPEN_EXCEL'
  | 'GENERATE_EXCEL'
  | 'OPEN_REPORT'
  | 'SET_NAVIGATION_TIME'
  | 'LAUNCH'
  | 'REFRESH_BLOCKS'
  | 'TEST_RUN'
  | 'STOP_TEST_RUN'
  | 'EXPORT_JOB'
  | 'IMPORT_JOB'
  | 'CHOOSE_TRANSFER_PATH'
  | 'CREATE_BAT';

export type BotJobExecutionMode = 'ALL' | 'ONE';

export type BotJobRuntimeMemoryPolicy = 'KEEP' | 'RESET';

export type BotJobToolbarPayload = Record<string, string | number | boolean | null | undefined>;

export type BotJobWorkspaceStatusTone = 'neutral' | 'success' | 'warning' | 'error';

export type ExecutionPreflightEnforcement = 'WARN';

export type ExecutionPreflightStatus =
  | 'READY'
  | 'WOULD_BLOCK'
  | 'UNAVAILABLE';

export type ExecutionPreflightOutcome =
  | 'READY'
  | 'WARN'
  | 'BLOCKED'
  | 'UNAVAILABLE';

export type ExecutionPreflightIssueDisposition =
  | 'VARIABLE_DIAGNOSTIC'
  | 'STRUCTURAL_START_FAILURE';

export type ExecutionPreflightIssueSeverity =
  | 'WARNING'
  | 'BLOCKING';

export type ExecutionPreflightRunScopeKind =
  | 'ALL'
  | 'ONE'
  | 'FROM_BLOCK';

export interface ExecutionPreflightOwner {
  homeBankingId: number;
  botJobId: number;
}

export interface ExecutionPreflightRunScope {
  kind: ExecutionPreflightRunScopeKind;
  selectedBlockId: number | null;
}

export interface ExecutionPreflightIssue {
  code: string;
  kind: string;
  blockId: number | null;
  instructionId: number | null;
  message: string;
  severity?: ExecutionPreflightIssueSeverity;
  disposition?: ExecutionPreflightIssueDisposition;
}

/**
 * Authoritative backend observation captured immediately before execution.
 *
 * WARN is intentionally observational: it reports what a future hard gate
 * would refuse, while the current TEST RUN or LAUNCH still starts exactly
 * once.
 */
export interface ExecutionPreflightReport {
  enforcement: ExecutionPreflightEnforcement;
  status: ExecutionPreflightStatus;
  outcome?: ExecutionPreflightOutcome;
  stage: string;
  owner: ExecutionPreflightOwner | null;
  runScope: ExecutionPreflightRunScope | null;
  graphVersion: number | null;
  contentRevision: string | null;
  reachableBlockIds: number[];
  reachableInstructionIds: number[];
  totalIssues: number;
  variableDiagnosticCount?: number;
  structuralStartFailureCount?: number;
  issues: ExecutionPreflightIssue[];
  unavailableReason: string | null;
}

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
  canUseFileActions: boolean;
  canOpenOrganizations: boolean;
}

export interface BotJobDetailsState {
  revision: number;
  metadataRevision: number;
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
  transferPathConfigured: boolean;
  environments: BotJobEnvironment[];
  blocks: BotJobBlockSummary[];
  capabilities: BotJobCapabilities;
  executionState: BotJobExecutionState;
  activeSurface: BotJobWorkspaceSurface;
  componentsVisible: boolean;
}

export interface BotJobMetadataDraft {
  expectedMetadataRevision: number;
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
  action?: BotJobWorkspaceAction | BotJobToolbarAction;
  selectedPath?: string;
  executionPreflight?: ExecutionPreflightReport;
  errorCode?: string | null;
  fieldErrors?: Record<string, string>;
}

export interface BotJobExecutionPauseRequest {
  requestId: string;
  botJobId: number;
  workspaceEpoch: number;
  executionId: number;
  executionAttemptId: number;
  title: string;
  header: string;
  blockName: string;
  instructionName: string;
  body: string;
  continueLabel: string;
  stopLabel: string;
}

export type BotJobExecutionPauseDecision = 'CONTINUE' | 'STOP';

export interface BotJobDetailsEnvelope {
  sessionId: string;
  operationId: string;
  homeBankingId?: number;
  body: BotJobDetailsResponse;
}
