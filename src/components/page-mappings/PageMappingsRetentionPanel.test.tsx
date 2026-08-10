import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PageMappingsRetentionPanel, {
  type PageMappingsRetentionState,
} from './PageMappingsRetentionPanel';

const retention: PageMappingsRetentionState = {
  retentionDays: 14,
  maxUnpinnedPerPage: 4,
  enabled: true,
  readyCount: 3,
  pinnedCount: 1,
  eligibleCount: 2,
};

const panel = (
  authoritativeRevision: string,
  authoritativeRetention: PageMappingsRetentionState = retention,
) => (
  <PageMappingsRetentionPanel
    retention={authoritativeRetention}
    storageReady
    authoritativeRevision={authoritativeRevision}
    reloadRequired={false}
    busy={false}
    pendingOperation={null}
    onSave={jest.fn()}
    onPurge={jest.fn()}
  />
);

test('resets an unsaved draft when a new authoritative revision republishes the same policy', () => {
  const view = render(panel('binding-a:bootstrap-1'));
  const days = screen.getByLabelText('Retain days');
  const maximum = screen.getByLabelText('Max unpinned / page');

  fireEvent.change(days, { target: { value: '30' } });
  fireEvent.change(maximum, { target: { value: '8' } });
  expect(days).toHaveValue(30);
  expect(maximum).toHaveValue(8);
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

  view.rerender(panel('binding-a:bootstrap-2'));

  expect(screen.getByLabelText('Retain days')).toHaveValue(14);
  expect(screen.getByLabelText('Max unpinned / page')).toHaveValue(4);
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('resets an unsaved draft when authoritative retention state changes outside the policy', () => {
  const view = render(panel('binding-a:bootstrap-1'));
  fireEvent.change(screen.getByLabelText('Max unpinned / page'), {
    target: { value: '8' },
  });
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

  view.rerender(panel('binding-a:bootstrap-1', {
    ...retention,
    readyCount: 4,
    eligibleCount: 3,
  }));

  expect(screen.getByLabelText('Retain days')).toHaveValue(14);
  expect(screen.getByLabelText('Max unpinned / page')).toHaveValue(4);
  expect(screen.getByText('3 eligible for this Bot Job')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
});
