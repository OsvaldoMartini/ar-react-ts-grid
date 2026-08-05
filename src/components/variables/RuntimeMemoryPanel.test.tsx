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

test('renders the ID, Name, Value, and row-action columns', () => {
  render(
    <RuntimeMemoryPanel
      items={items}
      onCommitValue={jest.fn()}
      onRequestDelete={jest.fn()}
    />,
  );

  expect(screen.getByRole('columnheader', { name: 'ID' }))
    .toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Name' }))
    .toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Value' }))
    .toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Actions' }))
    .toBeInTheDocument();
  expect(screen.getByRole('button', {
    name: 'Delete variable Account owner',
  })).toBeInTheDocument();
});

test('routes ADD, AUTO, CLEAR, ALL, and row delete independently', () => {
  const onRequestAdd = jest.fn();
  const onRequestAuto = jest.fn();
  const onRequestClearAll = jest.fn();
  const onRequestDelete = jest.fn();
  const onRequestDeleteAll = jest.fn();
  render(
    <RuntimeMemoryPanel
      items={items}
      onCommitValue={jest.fn()}
      onRequestAdd={onRequestAdd}
      onRequestAuto={onRequestAuto}
      onRequestClearAll={onRequestClearAll}
      onRequestDelete={onRequestDelete}
      onRequestDeleteAll={onRequestDeleteAll}
    />,
  );

  fireEvent.click(screen.getByRole('button', {
    name: 'Delete variable Account owner',
  }));
  expect(onRequestDelete).toHaveBeenCalledTimes(1);
  expect(onRequestDelete).toHaveBeenCalledWith(12);
  expect(onRequestDeleteAll).not.toHaveBeenCalled();
  expect(onRequestAdd).not.toHaveBeenCalled();
  expect(onRequestClearAll).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', {
    name: 'Clear all variable values',
  }));
  expect(onRequestClearAll).toHaveBeenCalledTimes(1);
  expect(onRequestDeleteAll).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', {
    name: 'Delete all variables',
  }));
  expect(onRequestDeleteAll).toHaveBeenCalledTimes(1);
  expect(onRequestDelete).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Add variable' }));
  expect(onRequestAdd).toHaveBeenCalledTimes(1);
  expect(onRequestDeleteAll).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Add variable' }))
    .toHaveTextContent('ADD');

  fireEvent.click(screen.getByRole('button', { name: 'Auto resolve variables' }));
  expect(onRequestAuto).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Clear all variable values' }))
    .toHaveTextContent('CLEAR');
  expect(screen.getByRole('button', { name: 'Delete all variables' }))
    .toHaveTextContent('ALL');
});

test('opens concise Memory variable rules help', () => {
  render(<RuntimeMemoryPanel items={items} onCommitValue={jest.fn()} />);

  const helpButton = screen.getByRole('button', {
    name: 'Open Memory variable rules',
  });
  expect(helpButton).toHaveTextContent('?');
  fireEvent.click(helpButton);
  expect(screen.getByRole('dialog', { name: 'Memory variable rules' }))
    .toBeInTheDocument();
  expect(screen.getByText('Share one variable set')).toBeInTheDocument();
  expect(screen.getByText('Delete every variable')).toBeInTheDocument();
  expect(screen.getByText(/Variables are free to come and go/i))
    .toBeInTheDocument();
});

test('keeps destructive actions available while another deletion is pending', () => {
  render(
    <RuntimeMemoryPanel
      items={items}
      onCommitValue={jest.fn()}
      onRequestDelete={jest.fn()}
      onRequestDeleteAll={jest.fn()}
      deletingVariableIds={new Set([12])}
    />,
  );

  expect(screen.getByRole('button', {
    name: 'Delete variable Account owner',
  })).toBeEnabled();
  expect(screen.getByRole('button', {
    name: 'Delete all variables',
  })).toBeEnabled();
  expect(screen.getByRole('button', {
    name: 'Delete variable Payment amount',
  })).toBeEnabled();
});
