import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import BotJobDetailsHeader from '../bot-job-details/BotJobDetailsHeader';
import { botJobDetailsTestState } from '../bot-job-details/BotJobDetails.testData';
import PageScannerExecutionControls from './PageScannerExecutionControls';

beforeEach(() => {
  window.localStorage.clear();
});

test('runs the selected Bot Job block from Page Scanner through the shared toolbar actions', () => {
  const onToolbarAction = jest.fn();
  const view = render(
    <PageScannerExecutionControls
      connected
      jobState={botJobDetailsTestState}
      onToolbarAction={onToolbarAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Test run' }));
  expect(onToolbarAction).toHaveBeenLastCalledWith('TEST_RUN', {
    executionMode: 'ALL',
    blockId: 0,
  });

  fireEvent.change(screen.getByRole('combobox', { name: 'Page Scanner starting block' }), {
    target: { value: '12' },
  });
  expect(screen.getByRole('button', { name: 'Page Scanner execution mode: ONE' })).toHaveTextContent('ONE');
  fireEvent.click(screen.getByRole('button', { name: 'Test run' }));
  expect(onToolbarAction).toHaveBeenLastCalledWith('TEST_RUN', {
    executionMode: 'ONE',
    blockId: 12,
  });

  fireEvent.click(screen.getByRole('button', { name: 'Reload Page Scanner blocks' }));
  expect(onToolbarAction).toHaveBeenLastCalledWith('REFRESH_BLOCKS');

  view.rerender(
    <PageScannerExecutionControls
      connected
      jobState={{ ...botJobDetailsTestState, executionState: 'RUNNING' }}
      onToolbarAction={onToolbarAction}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  const confirmation = screen.getByRole('dialog', { name: 'Stop Test Run' });
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Stop' }));
  expect(onToolbarAction).toHaveBeenLastCalledWith('STOP_TEST_RUN');
});

test('synchronizes selected block and ONE mode across open execution control surfaces', () => {
  render(
    <>
      <PageScannerExecutionControls
        connected
        jobState={botJobDetailsTestState}
        onToolbarAction={jest.fn()}
      />
      <PageScannerExecutionControls
        connected
        jobState={botJobDetailsTestState}
        onToolbarAction={jest.fn()}
      />
    </>,
  );

  const selects = screen.getAllByRole('combobox', { name: 'Page Scanner starting block' }) as HTMLSelectElement[];
  fireEvent.change(selects[0], { target: { value: '12' } });

  expect(selects[1]).toHaveValue('12');
  expect(screen.getAllByRole('button', { name: 'Page Scanner execution mode: ONE' })).toHaveLength(2);
});

test('synchronizes Bot Job Details selection into Page Scanner controls', () => {
  const scannerToolbarAction = jest.fn();
  render(
    <>
      <BotJobDetailsHeader
        botJobId={botJobDetailsTestState.botJobId}
        botJobName={botJobDetailsTestState.name}
        activeSurface="botJob"
        connected
        onAction={jest.fn()}
        jobState={botJobDetailsTestState}
        pendingToolbarAction={null}
        onToolbarAction={jest.fn()}
      />
      <PageScannerExecutionControls
        connected
        jobState={botJobDetailsTestState}
        onToolbarAction={scannerToolbarAction}
      />
    </>,
  );

  fireEvent.change(screen.getByRole('combobox', { name: 'Starting block' }), {
    target: { value: '12' },
  });

  expect(screen.getByRole('combobox', { name: 'Page Scanner starting block' })).toHaveValue('12');
  expect(screen.getByRole('button', { name: 'Page Scanner execution mode: ONE' })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Test run' })[1]);
  expect(scannerToolbarAction).toHaveBeenLastCalledWith('TEST_RUN', {
    executionMode: 'ONE',
    blockId: 12,
  });
});
