import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExcelExportPanel from './ExcelExportPanel';

const context = { blockId: 10, blockName: 'Payments', blockOrderNumber: 2, exportFile: 'C:/exports/report.csv:|' };

test('hydrates a Windows CSV export and submits edited fields', () => {
  const onSubmit = jest.fn();
  render(<ExcelExportPanel context={context} onSubmit={onSubmit} onClose={jest.fn()}/>);
  expect(screen.getByLabelText('Export directory')).toHaveValue('C:/exports');
  expect(screen.getByLabelText('File name')).toHaveValue('report.csv');
  expect(screen.getByLabelText('File type')).toHaveValue('.csv');
  expect(screen.getByLabelText('Delimiter')).toHaveValue('|');
  fireEvent.change(screen.getByLabelText('File name'), { target: { value: 'daily report' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ filename: 'daily report', fileType: '.csv', delimiter: '|' }));
});

test('requires directory and filename before save', () => {
  const onSubmit = jest.fn();
  render(<ExcelExportPanel context={{...context,exportFile:''}} onSubmit={onSubmit} onClose={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Directory and filename are required.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('submits clear and closes independently', () => {
  const onSubmit = jest.fn(); const onClose = jest.fn();
  render(<ExcelExportPanel context={context} onSubmit={onSubmit} onClose={onClose}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ clear: true }));
  fireEvent.click(screen.getByTitle('Close'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
