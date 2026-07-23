import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TemplateForm from './TemplateForm';
import { useWebSocket } from './useWebSocket';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

beforeEach(() => {
  mockedUseWebSocket.mockReturnValue({
    webSocket: null,
    connected: false,
    reconnectAttempts: 0,
    messages: [],
    error: null,
  });
});

test('closes only the detached template workspace', () => {
  const onClose = jest.fn();
  render(
    <TemplateForm
      socketPort={7357}
      sessionId="aTemplateManager"
      showCloseAction
      onClose={onClose}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Exit' })).not.toBeInTheDocument();
});

test('renders TEMP Organizations through GridTemp_A without an Actions column', async () => {
  mockedUseWebSocket.mockReturnValue({
    webSocket: null,
    connected: false,
    reconnectAttempts: 0,
    messages: [JSON.stringify({
      operationId: 'config.bootstrapResponse',
      body: JSON.stringify({
        organizations: [
          {
            id: 2,
            name: 'Banca Stato',
            activeJobs: 18,
            url: 'https://www.inlinea.ch/auth/ui/app/auth/flow/web-app/password',
          },
          {
            id: 1,
            name: 'VP Bank',
            activeJobs: 0,
            url: null,
          },
        ],
      }),
    })],
    error: null,
  });

  render(
    <TemplateForm
      socketPort={7357}
      sessionId="aTemplateManager"
    />,
  );

  const grid = await screen.findByTestId('template-organizations-grid');
  const viewport = screen.getByTestId('template-organizations-grid-viewport');
  const table = within(grid).getByRole('table', { name: 'TEMP Organizations' });
  const rowIdOrder = () => within(table)
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0].textContent);

  expect(screen.getByTestId('template-organizations-grid-count')).toHaveTextContent('2');
  expect(viewport).toHaveStyle({ maxHeight: 'min(42dvh, 360px)' });
  expect(table).toHaveStyle({ minWidth: '620px' });
  expect(within(table).getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  expect(within(table).getByRole('columnheader', { name: 'Organization' })).toBeInTheDocument();
  expect(within(table).getByRole('columnheader', { name: 'Active Jobs' })).toBeInTheDocument();
  expect(within(table).getByRole('columnheader', { name: 'URL Baseline' })).toBeInTheDocument();
  expect(within(table).queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  expect(within(table).getByTitle('VP Bank')).toHaveTextContent('VP Bank');
  expect(within(table).getByTitle('Banca Stato')).toHaveTextContent('Banca Stato');
  expect(within(table).getByTitle('https://www.inlinea.ch/auth/ui/app/auth/flow/web-app/password'))
    .toHaveTextContent('https://www.inlinea.ch/auth/ui/app/auth/flow/web-app/password');
  expect(within(table).getByText('-', { exact: true })).toBeInTheDocument();
  expect(rowIdOrder()).toEqual(['1', '2']);

  fireEvent.click(within(table).getByRole('button', { name: 'Organization' }));
  expect(rowIdOrder()).toEqual(['2', '1']);

  const find = within(grid).getByRole('textbox', { name: 'Find:' });
  expect(find).toHaveAttribute('id', 'template-organizations-find');
  fireEvent.change(find, { target: { value: 'banca 18 inlinea' } });
  expect(rowIdOrder()).toEqual(['2']);
  expect(screen.getByTestId('template-organizations-grid-count')).toHaveTextContent('1 / 2');

  fireEvent.change(find, { target: { value: 'missing' } });
  expect(within(grid).getByText('No organizations match Find')).toBeInTheDocument();
  expect(screen.getByTestId('template-organizations-grid-count')).toHaveTextContent('0 / 2');

  fireEvent.click(within(grid).getByRole('button', { name: 'Clear Find' }));
  expect(find).toHaveValue('');
  expect(rowIdOrder()).toEqual(['2', '1']);
  expect(screen.getByTestId('template-organizations-grid-count')).toHaveTextContent('2');
});

test('keeps the TEMP Organizations grid visible when no data is loaded', () => {
  render(
    <TemplateForm
      socketPort={7357}
      sessionId="aTemplateManager"
    />,
  );

  const grid = screen.getByTestId('template-organizations-grid');
  expect(screen.getByTestId('template-organizations-grid-count')).toHaveTextContent('0');
  expect(within(grid).getByText('No organizations loaded')).toBeInTheDocument();
  expect(within(grid).queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
});
