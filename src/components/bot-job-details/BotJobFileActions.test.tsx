import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobFileActions from './BotJobFileActions';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

test('opens the export modal, chooses a folder, and sends the confirmed export payload', () => {
  const onAction = jest.fn();
  const view = render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath=""
      onAction={onAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));

  expect(screen.getByRole('button', { name: 'Confirm export' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Choose transfer folder' }));
  expect(onAction).toHaveBeenLastCalledWith('CHOOSE_TRANSFER_PATH');

  view.rerender(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath={'D:\\exports\\payments'}
      onAction={onAction}
    />,
  );
  expect(screen.getByLabelText('Destination folder')).toHaveValue('D:\\exports\\payments');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm export' }));

  expect(onAction).toHaveBeenCalledWith('EXPORT_JOB', {
    transferPath: 'D:\\exports\\payments', confirmed: true,
  });
  expect(screen.queryByLabelText('Destination folder')).not.toBeInTheDocument();
});

test('opens the import modal with a restore date and sends the confirmed import payload', () => {
  const onAction = jest.fn();
  render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath={'D:\\exports\\payments'}
      onAction={onAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Import' }));
  expect(screen.getByLabelText('Source folder')).toHaveValue('D:\\exports\\payments');
  fireEvent.change(screen.getByLabelText('Restore date'), { target: { value: '2026-07-11' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }));

  expect(onAction).toHaveBeenCalledWith('IMPORT_JOB', {
    transferPath: 'D:\\exports\\payments', restoreDate: '2026-07-11', confirmed: true,
  });
});

test('Cancel closes the modal without dispatching a transfer command', () => {
  const onAction = jest.fn();
  render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath={'D:\\exports'}
      onAction={onAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onAction).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Destination folder')).not.toBeInTheDocument();
});

test('a pending toolbar action disables Export and Import so the modal cannot be opened', () => {
  const onAction = jest.fn();
  render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction="EXPORT_JOB"
      transferPath={'D:\\exports'}
      onAction={onAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
});
