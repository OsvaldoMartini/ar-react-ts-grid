import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MainDashboard from './MainDashboard';

const mockSend = jest.fn();
let mockMessages: string[] = [];

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: 1,
      send: mockSend,
    },
    connected: true,
    messages: mockMessages,
    error: null,
  }),
}));

const requests = (type: string) => mockSend.mock.calls
  .map(([payload]) => JSON.parse(payload))
  .filter(message => message.type === type);

const shutdownRequests = () => requests('mainDashboard.exit');

const listResponse = (botJobs: unknown[]) => JSON.stringify({
  operationId: 'mainDashboard.listResponse',
  body: JSON.stringify({ botJobs }),
});

beforeEach(() => {
  mockSend.mockClear();
  mockMessages = [];
});

test('requests application shutdown once when Exit is clicked', () => {
  render(<MainDashboard socketPort={7357} sessionId="mainDashboard" />);

  fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Exit' }));

  expect(shutdownRequests()).toHaveLength(1);
  expect(JSON.parse(shutdownRequests()[0].body)).toEqual({ reason: 'EXIT_BUTTON' });
});

test('uses GridTemp_A while preserving dashboard sorting, selection, open, delete, and filtering', async () => {
  mockMessages = [listResponse([
    {
      id: 202,
      name: 'Alpha Mobile',
      description: 'Mobile onboarding',
      active: false,
      organizationName: 'Mobile Bank',
      environmentUrl: 'https://mobile.example.test',
      priority: 'Android',
      blockCount: 2,
      launchable: false,
    },
    {
      id: 101,
      name: 'Zulu Web',
      description: 'Web checkout',
      active: true,
      organizationName: 'Web Bank',
      environmentName: 'Production',
      priority: 'Web App',
      blockCount: 9,
      launchable: true,
    },
  ])];

  render(<MainDashboard socketPort={7357} sessionId="mainDashboard" />);

  const grid = await screen.findByTestId('main-dashboard-bot-jobs-grid');
  const viewport = screen.getByTestId('main-dashboard-bot-jobs-grid-viewport');
  const rowIdOrder = () => within(grid)
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0].textContent);

  expect(viewport).toHaveStyle({ maxHeight: 'none' });
  expect(within(grid).getByRole('table')).toHaveStyle({ minWidth: '1060px' });
  expect(screen.getByTestId('main-dashboard-bot-jobs-grid-count')).toHaveTextContent('2');
  expect(within(grid).getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  expect(within(grid).getAllByTitle('Delete Bot Job')).toHaveLength(2);
  expect(rowIdOrder()).toEqual(['101', '202']);

  const nameHeader = within(grid).getByRole('columnheader', { name: 'Name' });
  const nameSortButton = within(nameHeader).getByRole('button', { name: 'Name' });
  expect(nameHeader).toHaveAttribute('title', 'Click to sort');

  fireEvent.click(nameSortButton);
  expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  expect(rowIdOrder()).toEqual(['202', '101']);

  fireEvent.click(nameSortButton);
  expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  expect(rowIdOrder()).toEqual(['101', '202']);

  fireEvent.click(nameSortButton);
  expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  expect(rowIdOrder()).toEqual(['202', '101']);

  const mobileRow = screen.getByText('Alpha Mobile').closest('tr');
  expect(mobileRow).not.toBeNull();
  fireEvent.click(mobileRow!);
  expect(screen.getByRole('button', { name: 'Clone Job' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Open Job' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Launch' })).toBeDisabled();

  mockSend.mockClear();
  fireEvent.doubleClick(mobileRow!);
  expect(requests('mainDashboard.openBotJob')).toHaveLength(1);
  expect(JSON.parse(requests('mainDashboard.openBotJob')[0].body)).toEqual({ botJobId: 202 });

  mockSend.mockClear();
  const mobileDelete = within(mobileRow!).getByTitle('Delete Bot Job');
  fireEvent.doubleClick(mobileDelete);
  expect(requests('mainDashboard.openBotJob')).toHaveLength(0);

  fireEvent.click(mobileDelete);
  expect(screen.getByText('(202) Alpha Mobile')).toBeInTheDocument();
  expect(requests('mainDashboard.openBotJob')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(requests('mainDashboard.deleteBotJob')).toHaveLength(1);
  expect(JSON.parse(requests('mainDashboard.deleteBotJob')[0].body)).toEqual({ botJobId: 202 });

  const find = within(grid).getByLabelText('Find:');
  const table = within(grid).getByRole('table');
  const visibleJobNames = () => within(table)
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[1]?.textContent);

  expect(find).toHaveAttribute('id', 'main-dashboard-find');
  expect(find).toHaveAttribute(
    'placeholder',
    'Name, Description, Organization, Environment, Type or Status',
  );

  for (const [query, expectedName] of [
    ['Mobile onboarding', 'Alpha Mobile'],
    ['Mobile Bank', 'Alpha Mobile'],
    ['https://mobile.example.test', 'Alpha Mobile'],
    ['Android', 'Alpha Mobile'],
    ['Inactive', 'Alpha Mobile'],
    ['Web checkout', 'Zulu Web'],
    ['Production', 'Zulu Web'],
    ['Web App', 'Zulu Web'],
    ['Active', 'Zulu Web'],
  ]) {
    fireEvent.change(find, { target: { value: query } });
    expect(visibleJobNames()).toEqual([expectedName]);
    expect(screen.getByTestId('main-dashboard-bot-jobs-grid-count')).toHaveTextContent('1 / 2');
  }

  fireEvent.change(find, { target: { value: 'not present' } });
  expect(screen.getByTestId('main-dashboard-bot-jobs-grid-count')).toHaveTextContent('0 / 2');
  expect(screen.getByText('No Bot Jobs match Find')).toBeInTheDocument();

  fireEvent.click(within(grid).getByRole('button', { name: 'Clear Find' }));
  expect(find).toHaveValue('');
  expect(visibleJobNames()).toEqual(['Alpha Mobile', 'Zulu Web']);
  expect(screen.getByTestId('main-dashboard-bot-jobs-grid-count')).toHaveTextContent('2');
});
