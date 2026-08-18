import type { BotJobDetailsState } from './BotJobDetails.types';

export const botJobDetailsTestState: BotJobDetailsState = {
  revision: 7,
  metadataRevision: 3,
  botJobId: 42,
  name: 'Payments',
  description: 'Payment flow',
  projectType: 'Web App',
  active: true,
  homeBankingId: 5,
  organizationName: 'Bank',
  homeUrlId: 8,
  environmentName: 'TEST',
  environmentUrl: 'https://test.example',
  navigationTimeSeconds: 2,
  transferPathConfigured: true,
  environments: [
    { id: 8, name: 'TEST', url: 'https://test.example', homeBankingId: 5, organizationName: 'Bank' },
  ],
  blocks: [
    { id: 11, order: 1, name: 'Login', description: '', typeId: 1, active: true, waitSeconds: 0 },
    { id: 12, order: 2, name: 'Payment', description: '', typeId: 1, active: true, waitSeconds: 0 },
  ],
  capabilities: {
    canUseWorkspaceActions: true,
    canEditMetadata: true,
    canUsePreScan: true,
    canShowComponents: true,
    canExecute: true,
    canLaunch: true,
    canUseFileActions: true,
    canOpenOrganizations: true,
  },
  executionState: 'IDLE',
  activeSurface: 'botJob',
  componentsVisible: false,
};
