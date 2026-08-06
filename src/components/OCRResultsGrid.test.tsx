import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import OCRResultsGrid from './OCRResultsGrid';
import type { OCRTestRow } from './ocr/OCRResults.types';

const rows: OCRTestRow[] = [
  {
    definedName: 'user',
    quality: 'NONE',
    tag: 'input',
    domText: 'Customer number',
    ocrText: 'Customer ID',
    xPath: '/html/input',
  },
  {
    definedName: 'login',
    quality: 'EXACT_CONTAIN',
    tag: 'button',
    domText: 'Log in',
    ocrText: 'Login now',
    xPath: '/html/button',
  },
];

const renderGrid = () => render(
  <OCRResultsGrid
    rows={rows}
    approved={new Set(['/html/button'])}
    selectedPath="/html/input"
    onToggleApproved={jest.fn()}
    onSelect={jest.fn()}
  />,
);

test('filters Name, Tag, DOM text, OCR text, and XPath and clears Find', () => {
  renderGrid();
  const find = screen.getByRole('textbox', { name: 'Find:' });
  const visibleNames = () => within(screen.getByRole('table', { name: 'OCR result rows' }))
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[1]?.textContent);

  const cases: Array<[string, string[]]> = [
    ['UsEr', ['user']],
    ['button', ['login']],
    ['customer number', ['user']],
    ['now', ['login']],
    ['/html/input', ['user']],
  ];
  cases.forEach(([query, expected]) => {
    fireEvent.change(find, { target: { value: query } });
    expect(visibleNames()).toEqual(expected);
    expect(screen.getByTestId('ocr-results-grid-count')).toHaveTextContent('1 / 2');
  });

  fireEvent.change(find, { target: { value: 'missing value' } });
  expect(screen.getByText('No OCR results match Find')).toBeInTheDocument();
  expect(screen.getByTestId('ocr-results-grid-count')).toHaveTextContent('0 / 2');

  fireEvent.click(screen.getByRole('button', { name: 'Clear OCR Results Find' }));
  expect(find).toHaveValue('');
  expect(visibleNames()).toEqual(['user', 'login']);
});

test('uses the Bot Jobs three-state sorting pattern for every visible column', () => {
  renderGrid();
  const grid = screen.getByTestId('ocr-results-grid');
  const visibleNames = () => within(grid)
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[1]?.textContent);

  ['Approved', 'Name', 'Quality', 'Tag', 'DOM text', 'OCR text'].forEach(label => {
    expect(within(grid).getByRole('button', { name: label })).toBeInTheDocument();
  });

  const nameHeader = within(grid).getByRole('columnheader', { name: 'Name' });
  const nameSort = within(nameHeader).getByRole('button', { name: 'Name' });

  fireEvent.click(nameSort);
  expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  expect(visibleNames()).toEqual(['login', 'user']);

  fireEvent.click(nameSort);
  expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  expect(visibleNames()).toEqual(['user', 'login']);

  fireEvent.click(nameSort);
  expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  expect(visibleNames()).toEqual(['user', 'login']);
});
