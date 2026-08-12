import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExcelWriteManagerDialog from './ExcelWriteManagerDialog';
import type { ExcelWriteManagerState } from './domain/excelWriteManager';

const state: ExcelWriteManagerState = Object.freeze({
  policy: 'END_EXECUTION',
  files: Object.freeze([Object.freeze({
    fileId: 'c:/exports/test.xlsx',
    outputFile: 'C:/exports/test.xlsx:,',
    displayName: 'test.xlsx',
    finalFormat: 'XLSX',
    delimiter: ',',
    columns: Object.freeze(['User']),
    rows: Object.freeze([Object.freeze({ User: '577212' })]),
    instructionIds: Object.freeze([1772]),
    touchedBlockIds: Object.freeze([7]),
    revision: 1,
    dirty: true,
    flushState: 'MEMORY',
    message: 'Held in React memory.',
  })]),
});

test('renders ExcelWriter as a modeless floating workspace without blocking its owner page', () => {
  const ownerAction = jest.fn();
  render(<>
    <button type="button" onClick={ownerAction}>Owner action</button>
    <ExcelWriteManagerDialog state={state} busy={false} policyLocked={false}
      onPolicyChange={jest.fn()} onCellChange={jest.fn()} onSave={jest.fn()} onClose={jest.fn()} />
  </>);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'ExcelWriter Manager' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Owner action' }));
  expect(ownerAction).toHaveBeenCalledTimes(1);
});
