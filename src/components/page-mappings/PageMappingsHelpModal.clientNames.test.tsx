import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PageMappingsHelpModal from './PageMappingsHelpModal';

test('separates client-name and instruction rules from workspace rules', () => {
  render(<PageMappingsHelpModal onClose={jest.fn()} />);

  expect(screen.getByRole('tab', { name: 'Workspace Rules' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Ownership and history')).toBeInTheDocument();
  expect(screen.queryByText('Canonical and client names')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: 'Client Names & Instructions' }));

  expect(screen.getByRole('tab', { name: 'Client Names & Instructions' }))
    .toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Canonical and client names')).toBeInTheDocument();
  expect(screen.getByText('From a capture to Bot Job instructions')).toBeInTheDocument();
  expect(screen.getByText(/Once saved, Rescan and OCR Review must preserve it/)).toBeInTheDocument();
  expect(screen.getByText(/A shared alias does not automatically join unrelated elements/)).toBeInTheDocument();
});
