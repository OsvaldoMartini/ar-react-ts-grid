import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchBox, { type SearchBoxOption } from './SearchBox';

const options: SearchBoxOption[] = [
  {
    value: '7',
    label: '#1 Login',
    sublabel: '3 variable link(s) · block ID 7',
    badges: [{ text: 'ACTIVE', tone: 'green' }],
    keywords: '7',
  },
  {
    value: '8',
    label: '#2 Check payment',
    sublabel: '5 variable link(s) · block ID 8',
    badges: [{ text: 'INACTIVE', tone: 'red' }],
    keywords: '8',
  },
  {
    value: '9',
    label: '#3 Logout',
    sublabel: '0 variable link(s) · block ID 9',
    badges: [{ text: 'ACTIVE', tone: 'green' }],
    keywords: '9',
  },
];

const renderBox = (onChange = jest.fn(), value: string | null = null) => {
  render(
    <SearchBox
      label="Block"
      placeholder="Search block name or number..."
      allOptionLabel="All blocks"
      countLabel={count => `${count} BLOCKS`}
      options={options}
      value={value}
      onChange={onChange}
    />,
  );
  return onChange;
};

test('opens on click and lists every option with a result count', () => {
  renderBox();
  fireEvent.click(screen.getByRole('combobox'));

  expect(screen.getByText('3 BLOCKS')).toBeInTheDocument();
  expect(screen.getByText('#1 Login')).toBeInTheDocument();
  expect(screen.getByText('#2 Check payment')).toBeInTheDocument();
  expect(screen.getByText('#3 Logout')).toBeInTheDocument();
  expect(screen.getByText('All blocks')).toBeInTheDocument();
});

test('token search auto-filters options across label, sublabel, and badges', () => {
  renderBox();
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'check pay' } });

  expect(screen.getByText('1 BLOCKS')).toBeInTheDocument();
  expect(screen.getByText('#2 Check payment')).toBeInTheDocument();
  expect(screen.queryByText('#1 Login')).toBeNull();

  fireEvent.change(input, { target: { value: 'inactive' } });
  expect(screen.getByText('#2 Check payment')).toBeInTheDocument();
  expect(screen.queryByText('#3 Logout')).toBeNull();
});

test('selecting an option commits its value and closes the list', () => {
  const onChange = renderBox();
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('#2 Check payment'));

  expect(onChange).toHaveBeenCalledWith('8');
  expect(screen.queryByRole('listbox')).toBeNull();
});

test('the All pseudo-option clears the selection with null', () => {
  const onChange = renderBox(jest.fn(), '8');
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('All blocks'));

  expect(onChange).toHaveBeenCalledWith(null);
});

test('keyboard navigation selects with ArrowDown and Enter', () => {
  const onChange = renderBox();
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  // Index 0 is "All blocks"; two ArrowDowns land on the second real option.
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(onChange).toHaveBeenCalledWith('8');
});

test('shows a no-matches message for an unmatched query', () => {
  renderBox();
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'zzz' } });

  expect(screen.getByText('0 BLOCKS')).toBeInTheDocument();
  expect(screen.getByText(/No matches for/)).toBeInTheDocument();
});
