import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import GridTemp_A, { GridTempAColumn } from './GridTemp_A';

type Row = {
  id: number;
  organization: string;
  activeJobs: number;
  active: boolean;
};

const rows: Row[] = [
  { id: 2, organization: 'Banca Stato', activeJobs: 18, active: false },
  { id: 1, organization: 'VP Bank', activeJobs: 0, active: true },
];

const columns: GridTempAColumn<Row>[] = [
  {
    id: 'id',
    header: 'ID',
    renderCell: row => row.id,
    sortValue: row => row.id,
    searchValue: row => row.id,
    width: 70,
  },
  {
    id: 'organization',
    header: 'Organization',
    renderCell: row => row.organization,
    sortValue: row => row.organization,
    searchValue: row => row.organization,
    title: row => row.organization,
    width: 220,
  },
  {
    id: 'activeJobs',
    header: 'Active Jobs',
    renderCell: row => row.activeJobs,
    sortValue: row => row.activeJobs,
    searchValue: row => row.activeJobs,
    alignment: 'right',
    width: 110,
  },
  {
    id: 'status',
    header: 'Status',
    renderCell: row => row.active ? 'Active' : 'Inactive',
    sortValue: row => row.active ? 0 : 1,
    searchValue: row => row.active ? 'Active' : 'Inactive',
    searchMode: 'exact',
    width: 90,
  },
];

test('renders a contained scroll viewport and omits Actions when none are supplied', () => {
  render(
    <GridTemp_A
      title="Organizations"
      rows={rows}
      columns={columns}
      rowKey={row => row.id}
      minTableWidth={900}
      maxViewportHeight={260}
    />,
  );

  expect(screen.getByText('Organizations')).toBeInTheDocument();
  expect(screen.getByTestId('grid-temp-a-count')).toHaveTextContent('2');
  expect(screen.queryByRole('textbox', { name: 'Find:' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  expect(screen.getByTestId('grid-temp-a-viewport')).toHaveStyle({
    maxHeight: '260px',
  });
  expect(screen.getByRole('table')).toHaveStyle({ minWidth: '900px' });
});

test('accepts an Actions renderer without triggering the row click', () => {
  const onRowClick = jest.fn();
  const onDelete = jest.fn();
  render(
    <GridTemp_A
      title="Organizations"
      rows={rows}
      columns={columns}
      rowKey={row => row.id}
      onRowClick={onRowClick}
      actions={{
        render: row => (
          <button type="button" onClick={() => onDelete(row.id)}>
            Delete {row.id}
          </button>
        ),
      }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Delete 2' }));

  expect(onDelete).toHaveBeenCalledWith(2);
  expect(onRowClick).not.toHaveBeenCalled();
  expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
});

test('sorts a sortable column ascending, descending, and back to source order', () => {
  render(
    <GridTemp_A
      title="Organizations"
      rows={rows}
      columns={columns}
      rowKey={row => row.id}
    />,
  );

  const organizationSort = screen.getByRole('button', { name: 'Organization' });
  const organizationCells = () =>
    within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1)
      .map(row => within(row).getAllByRole('cell')[1].textContent);

  fireEvent.click(organizationSort);
  expect(organizationCells()).toEqual(['Banca Stato', 'VP Bank']);

  fireEvent.click(organizationSort);
  expect(organizationCells()).toEqual(['VP Bank', 'Banca Stato']);

  fireEvent.click(organizationSort);
  expect(organizationCells()).toEqual(['Banca Stato', 'VP Bank']);
});

test('filters configured columns, supports multiple terms, and clears Find', () => {
  render(
    <GridTemp_A
      title="Organizations"
      rows={rows}
      columns={columns}
      rowKey={row => row.id}
      find={{
        inputId: 'organizations-find',
        placeholder: 'Organization, jobs, or status',
        noMatchesMessage: 'No organizations match Find',
      }}
    />,
  );

  const table = screen.getByRole('table');
  const find = screen.getByRole('textbox', { name: 'Find:' });
  const visibleOrganizations = () => within(table)
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[1]?.textContent);

  expect(find).toHaveAttribute('id', 'organizations-find');
  expect(find).toHaveAttribute('placeholder', 'Organization, jobs, or status');

  fireEvent.change(find, { target: { value: 'banca 18' } });
  expect(visibleOrganizations()).toEqual(['Banca Stato']);
  expect(screen.getByTestId('grid-temp-a-count')).toHaveTextContent('1 / 2');

  fireEvent.change(find, { target: { value: 'Active' } });
  expect(visibleOrganizations()).toEqual(['VP Bank']);
  expect(screen.queryByText('Banca Stato')).not.toBeInTheDocument();

  fireEvent.change(find, { target: { value: 'missing' } });
  expect(screen.getByText('No organizations match Find')).toBeInTheDocument();
  expect(screen.getByTestId('grid-temp-a-count')).toHaveTextContent('0 / 2');

  fireEvent.click(screen.getByRole('button', { name: 'Clear Find' }));
  expect(find).toHaveValue('');
  expect(visibleOrganizations()).toEqual(['Banca Stato', 'VP Bank']);
  expect(screen.getByTestId('grid-temp-a-count')).toHaveTextContent('2');
});
