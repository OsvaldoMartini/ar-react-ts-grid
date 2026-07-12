import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobMetadataEditor from './BotJobMetadataEditor';
import type { BotJobDetailsState } from './BotJobDetails.types';

const state: BotJobDetailsState = {
  revision: 3,
  botJobId: 42,
  name: 'Payments',
  description: 'Payment flow',
  projectType: 'Web App',
  active: true,
  homeBankingId: 7,
  organizationName: 'Bank',
  homeUrlId: 8,
  environmentName: 'TEST',
  environmentUrl: 'https://test.example',
  navigationTimeSeconds: 2,
  environments: [
    { id: 8, name: 'TEST', url: 'https://test.example', homeBankingId: 7, organizationName: 'Bank' },
    { id: 9, name: 'QA', url: 'https://qa.example', homeBankingId: 7, organizationName: 'Bank' },
  ],
  blocks: [],
  capabilities: {
    canUseWorkspaceActions: true,
    canEditMetadata: true,
    canUsePreScan: true,
    canShowComponents: true,
    canExecute: true,
    canLaunch: true,
    canOpenOrganizations: true,
  },
  executionState: 'IDLE',
  activeSurface: 'botJob',
  componentsVisible: false,
};

test('edits and submits name, description, and stable environment id', () => {
  const onSave = jest.fn();
  render(
    <BotJobMetadataEditor
      state={state}
      loading={false}
      connected
      saving={false}
      onSave={onSave}
      onRefreshEnvironments={jest.fn()}
      onOpenOrganizations={jest.fn()}
      onRetry={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Bot Job name'), { target: { value: 'Payments QA' } });
  fireEvent.change(screen.getByLabelText('Environment'), { target: { value: '9' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith({
    expectedRevision: 3, name: 'Payments QA', description: 'Payment flow', homeUrlId: 9,
  });
});

test('gates edit and organization management from backend capabilities', () => {
  const restricted = {
    ...state,
    capabilities: {
      ...state.capabilities,
      canUseWorkspaceActions: false,
      canEditMetadata: false,
      canOpenOrganizations: false,
    },
  };
  render(
    <BotJobMetadataEditor
      state={restricted}
      loading={false}
      connected
      saving={false}
      onSave={jest.fn()}
      onRefreshEnvironments={jest.fn()}
      onOpenOrganizations={jest.fn()}
      onRetry={jest.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Refresh environments' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Manage environments' })).toBeDisabled();
});
