import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PageScannerFocusProfileEditor from './PageScannerFocusProfileEditor';
import {
  PAGE_SCANNER_CUSTOM_PROFILE_KEY,
  type PageScannerFocusProfile,
} from './PageScannerFocusProfile';

const profiles: PageScannerFocusProfile[] = [
  {
    id: 1,
    key: 'factory-default',
    label: 'All page scanner controls',
    searchTerms: '',
    sortOrder: 10,
    protected: true,
  },
  {
    id: 2,
    key: 'qa-controls',
    label: 'QA controls',
    searchTerms: 'button, [data-testid]',
    sortOrder: 20,
    protected: false,
  },
];

const renderEditor = (overrides: Partial<React.ComponentProps<typeof PageScannerFocusProfileEditor>> = {}) => {
  const props: React.ComponentProps<typeof PageScannerFocusProfileEditor> = {
    profiles,
    selectedProfileKey: 'qa-controls',
    onSelect: jest.fn(),
    onSave: jest.fn(),
    onDelete: jest.fn(),
    onRefresh: jest.fn(() => true),
    onClose: jest.fn(),
    ...overrides,
  };
  return { ...render(<PageScannerFocusProfileEditor {...props} />), props };
};

test('saves an existing profile with the exact trimmed transport fields', () => {
  const onSave = jest.fn();
  renderEditor({ onSave });

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  QA buttons  ' } });
  fireEvent.change(screen.getByLabelText('Search term 1'), { target: { value: '  button  ' } });
  fireEvent.change(screen.getByLabelText('Search term 2'), { target: { value: '  a  ' } });
  fireEvent.change(screen.getByLabelText('Order'), { target: { value: '41' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith({
    id: 2,
    key: 'qa-controls',
    label: 'QA buttons',
    searchTerms: 'button, a',
    sortOrder: 41,
  });
});

test('creates a slugged profile and carries the current custom search into New', () => {
  const onSave = jest.fn();
  renderEditor({
    selectedProfileKey: PAGE_SCANNER_CUSTOM_PROFILE_KEY,
    currentSearchTerms: '[data-bank-control]',
    onSave,
  });

  fireEvent.click(screen.getByRole('button', { name: 'New' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Depósitos QA' } });

  expect(screen.getByLabelText('Profile key')).toHaveValue('depositos-qa');
  expect(screen.getByLabelText('Search term 1')).toHaveValue('[data-bank-control]');
  expect(screen.getByLabelText('Pattern for search term 1')).toHaveValue('selector');
  expect(screen.getByLabelText('Order')).toHaveValue(30);

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith({
    key: 'depositos-qa',
    label: 'Depósitos QA',
    searchTerms: '[data-bank-control]',
    sortOrder: 30,
  });
});

test('hydrates a newly selected database profile after the controlled selection changes', () => {
  const onSelect = jest.fn();
  const view = renderEditor({ onSelect });

  fireEvent.change(screen.getByLabelText('Profile'), { target: { value: 'factory-default' } });
  expect(onSelect).toHaveBeenCalledWith('factory-default');

  view.rerender(
    <PageScannerFocusProfileEditor
      {...view.props}
      selectedProfileKey="factory-default"
    />,
  );
  expect(screen.getByLabelText('Name')).toHaveValue('All page scanner controls');
  expect(screen.queryByLabelText('Search term 1')).not.toBeInTheDocument();
  expect(screen.getByText(/No search terms/i)).toBeInTheDocument();
});

test('keeps the factory default blank and protected from save or delete', () => {
  renderEditor({ selectedProfileKey: 'factory-default' });

  expect(screen.getByText(/always scans with blank search terms/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add search term' })).toBeDisabled();
  expect(screen.queryByLabelText('Search term 1')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
});

test('adds typed rows and automatically serializes the attr prefix', () => {
  const onSave = jest.fn();
  renderEditor({ onSave });

  fireEvent.click(screen.getByRole('button', { name: 'Add search term' }));
  expect(screen.getByLabelText('Search term 3')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Pattern for search term 3'), { target: { value: 'attribute' } });
  fireEvent.change(screen.getByLabelText('Search term 3'), { target: { value: 'test-id' } });

  expect(screen.getByText(/saved as attr:test-id/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    searchTerms: 'button, [data-testid], attr:test-id',
  }));
});

test('removes individual rows and Enter auto-adds the next row', () => {
  const onSave = jest.fn();
  renderEditor({ onSave });

  fireEvent.click(screen.getByRole('button', { name: 'Remove search term 1' }));
  expect(screen.getByLabelText('Search term 1')).toHaveValue('[data-testid]');
  expect(screen.getByRole('status')).toHaveTextContent('Search term removed. 1 term ready');

  fireEvent.keyDown(screen.getByLabelText('Search term 1'), { key: 'Enter' });
  expect(screen.getByLabelText('Search term 2')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Search term 2'), { target: { value: 'input' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    searchTerms: '[data-testid], input',
  }));
});

test('shows row-specific attribute validation and blocks invalid saves', () => {
  const onSave = jest.fn();
  renderEditor({ onSave });

  fireEvent.change(screen.getByLabelText('Pattern for search term 1'), { target: { value: 'attribute' } });
  fireEvent.change(screen.getByLabelText('Search term 1'), { target: { value: 'data id' } });

  expect(screen.getByText(/Invalid attribute name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(onSave).not.toHaveBeenCalled();
});

test('refresh reloads authoritative database terms after the correlated request finishes', () => {
  const onRefresh = jest.fn(() => true);
  const view = renderEditor({ onRefresh });

  fireEvent.change(screen.getByLabelText('Search term 1'), { target: { value: 'unsaved-button' } });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh search terms from database' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('status')).toHaveTextContent('Refreshing saved search terms');

  view.rerender(<PageScannerFocusProfileEditor {...view.props} busy />);
  const refreshedProfiles = profiles.map(profile => (
    profile.key === 'qa-controls'
      ? { ...profile, searchTerms: 'input, attr:test-id' }
      : profile
  ));
  view.rerender(
    <PageScannerFocusProfileEditor
      {...view.props}
      profiles={refreshedProfiles}
      busy={false}
    />,
  );

  expect(screen.getByLabelText('Search term 1')).toHaveValue('input');
  expect(screen.getByLabelText('Pattern for search term 2')).toHaveValue('attribute');
  expect(screen.getByLabelText('Search term 2')).toHaveValue('test-id');
  expect(screen.getByRole('status')).toHaveTextContent('2 search terms refreshed from the database');
});

test('uses the React confirmation card before deleting a custom profile', () => {
  const onDelete = jest.fn();
  const nativeConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);
  renderEditor({ onDelete });

  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  const dialog = screen.getByRole('dialog', { name: 'Delete Page Scanner profile?' });
  expect(dialog).toHaveTextContent('Delete "QA controls"?');
  expect(nativeConfirm).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(onDelete).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
  expect(onDelete).toHaveBeenCalledWith(profiles[1]);
  expect(nativeConfirm).not.toHaveBeenCalled();
  nativeConfirm.mockRestore();
});

test('shows a correlated backend error and closes only through the supplied callback', () => {
  const onClose = jest.fn();
  renderEditor({ error: 'Profile key already exists.', onClose });

  expect(screen.getByRole('alert')).toHaveTextContent('Profile key already exists.');
  fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
