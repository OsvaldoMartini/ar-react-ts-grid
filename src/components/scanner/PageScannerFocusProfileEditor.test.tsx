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
    onClose: jest.fn(),
    ...overrides,
  };
  return { ...render(<PageScannerFocusProfileEditor {...props} />), props };
};

test('saves an existing profile with the exact trimmed transport fields', () => {
  const onSave = jest.fn();
  renderEditor({ onSave });

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  QA buttons  ' } });
  fireEvent.change(screen.getByLabelText('Search terms'), { target: { value: '  button, a  ' } });
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
  expect(screen.getByLabelText('Search terms')).toHaveValue('[data-bank-control]');
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
  expect(screen.getByLabelText('Search terms')).toHaveValue('');
});

test('keeps the factory default blank and protected from save or delete', () => {
  renderEditor({ selectedProfileKey: 'factory-default' });

  expect(screen.getByText(/always scans with blank search terms/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Search terms')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
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
