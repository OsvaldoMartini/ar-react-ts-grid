import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExcelDataRowControl from './ExcelDataRowControl';

const dataTransfer = () => ({
  effectAllowed: 'none',
  dropEffect: 'none',
  setData: jest.fn(),
});

test('reports the original row index for selection and native drag events', () => {
  const onSelect = jest.fn();
  const onDragStart = jest.fn();
  const onDragOver = jest.fn();
  const onDrop = jest.fn();
  const onDragEnd = jest.fn();
  const transfer = dataTransfer();

  render(
    <table><tbody><tr>
      <ExcelDataRowControl
        rowIndex={7}
        groupName="excel-data-block-login"
        selected={false}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />
    </tr></tbody></table>,
  );

  fireEvent.click(screen.getByRole('radio', { name: 'Select row 8 for execution' }));
  expect(onSelect).toHaveBeenCalledWith(7);

  const handle = screen.getByRole('button', { name: 'Move row 8' });
  fireEvent.dragStart(handle, { dataTransfer: transfer });
  expect(transfer.setData).toHaveBeenCalledWith('text/plain', '7');
  expect(onDragStart).toHaveBeenCalledWith(7);

  const cell = screen.getByRole('cell');
  fireEvent.dragOver(cell, { dataTransfer: transfer });
  fireEvent.drop(cell, { dataTransfer: transfer });
  fireEvent.dragEnd(handle, { dataTransfer: transfer });
  expect(onDragOver).toHaveBeenCalledWith(7);
  expect(onDrop).toHaveBeenCalledWith(7);
  expect(onDragEnd).toHaveBeenCalledTimes(1);
});

test('renders the authoritative selection and blocks interaction while disabled', () => {
  const onSelect = jest.fn();
  const onDragStart = jest.fn();
  const onDragOver = jest.fn();
  const onDrop = jest.fn();
  const onDragEnd = jest.fn();

  render(
    <table><tbody><tr>
      <ExcelDataRowControl
        rowIndex={0}
        groupName="excel-data-block-login"
        selected
        disabled
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />
    </tr></tbody></table>,
  );

  expect(screen.getByRole('radio', { name: 'Select row 1 for execution' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Select row 1 for execution' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Move row 1' })).toBeDisabled();
  expect(onSelect).not.toHaveBeenCalled();
  expect(onDragStart).not.toHaveBeenCalled();
});

test('allows the same authoritative logical row to be checked once per Block table', () => {
  const noop = jest.fn();
  render(<>
    <table><tbody><tr><ExcelDataRowControl
      rowIndex={2}
      groupName="excel-data-block-one"
      selected
      onSelect={noop}
      onDragStart={noop}
      onDragOver={noop}
      onDrop={noop}
      onDragEnd={noop}
    /></tr></tbody></table>
    <table><tbody><tr><ExcelDataRowControl
      rowIndex={2}
      groupName="excel-data-block-two"
      selected
      onSelect={noop}
      onDragStart={noop}
      onDragOver={noop}
      onDrop={noop}
      onDragEnd={noop}
    /></tr></tbody></table>
  </>);

  const selectedRows = screen.getAllByRole('radio', { name: 'Select row 3 for execution' });
  expect(selectedRows).toHaveLength(2);
  selectedRows.forEach(row => expect(row).toBeChecked());
});
