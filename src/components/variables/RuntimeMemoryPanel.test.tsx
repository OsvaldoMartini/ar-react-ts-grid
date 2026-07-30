import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import RuntimeMemoryPanel, {
  type RuntimeMemoryPanelItem,
} from './RuntimeMemoryPanel';

const items: RuntimeMemoryPanelItem[] = [
  {
    variableId: 12,
    name: 'Account owner',
    state: 'VALUE',
    value: 'Osvaldo',
  },
  {
    variableId: 34,
    name: 'Payment amount',
    state: 'VALUE',
    value: '125.00',
  },
  {
    variableId: 56,
    name: 'Missing producer',
    state: 'VOID',
    value: null,
    voidReason: 'NO_PRODUCER',
  },
];

test('filters runtime memory by variable name or ID but never by value', () => {
  render(<RuntimeMemoryPanel items={items} onCommitValue={jest.fn()} />);

  const search = screen.getByRole('searchbox', {
    name: 'Search memory variables',
  });

  fireEvent.change(search, { target: { value: 'Payment amount' } });
  expect(screen.getByText('Payment amount')).toBeInTheDocument();
  expect(screen.queryByText('Account owner')).not.toBeInTheDocument();
  expect(screen.getByText('1 / 3')).toBeInTheDocument();

  fireEvent.change(search, { target: { value: '56' } });
  expect(screen.getByText('Missing producer')).toBeInTheDocument();
  expect(screen.queryByText('Payment amount')).not.toBeInTheDocument();

  fireEvent.change(search, { target: { value: '125.00' } });
  expect(screen.queryByText('Payment amount')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'No memory variables match this search.',
  );
});

test('clearing runtime memory search restores all rows', () => {
  render(<RuntimeMemoryPanel items={items} onCommitValue={jest.fn()} />);

  const search = screen.getByRole('searchbox', {
    name: 'Search memory variables',
  });
  fireEvent.change(search, { target: { value: 'no-match' } });
  expect(screen.getByRole('status')).toHaveTextContent(
    'No memory variables match this search.',
  );

  fireEvent.change(search, { target: { value: '' } });
  expect(screen.getByText('Account owner')).toBeInTheDocument();
  expect(screen.getByText('Payment amount')).toBeInTheDocument();
  expect(screen.getByText('Missing producer')).toBeInTheDocument();
  expect(screen.queryByText('No memory variables match this search.'))
    .not.toBeInTheDocument();
});
