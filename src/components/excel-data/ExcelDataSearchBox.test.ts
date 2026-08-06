import { filterExcelDataBlocks, type SearchableExcelBlock } from './ExcelDataSearchBox';

const blocks: SearchableExcelBlock[] = [{
  name: 'Payments',
  columns: ['IBAN', 'Account holder'],
  rows: [
    { index: 0, values: { IBAN: 'CH12 3456', 'Account holder': 'Alice' } },
    { index: 1, values: { IBAN: 'CH98 7654', 'Account holder': 'Bob' } },
  ],
}, {
  name: 'Login',
  columns: ['Username'],
  rows: [{ index: 0, values: { Username: 'operator@example.test' } }],
}];

test('filters by column name while preserving every row for that column', () => {
  expect(filterExcelDataBlocks(blocks, 'iban')).toEqual([{
    name: 'Payments',
    columns: ['IBAN'],
    rows: blocks[0].rows,
  }]);
});

test('filters by an existing value to its column and matching row', () => {
  expect(filterExcelDataBlocks(blocks, 'bob')).toEqual([{
    name: 'Payments',
    columns: ['Account holder'],
    rows: [blocks[0].rows[1]],
  }]);
});

test('filters by Block name and clearing restores the complete projection', () => {
  expect(filterExcelDataBlocks(blocks, 'login')).toEqual([blocks[1]]);
  expect(filterExcelDataBlocks(blocks, '')).toEqual(blocks);
});
