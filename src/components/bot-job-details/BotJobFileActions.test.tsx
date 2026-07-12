import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobFileActions from './BotJobFileActions';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

afterEach(() => {
  jest.restoreAllMocks();
});

test('chooses a session transfer path and sends confirmed export/import payloads', () => {
  const onAction = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  const view = render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath=""
      onAction={onAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
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
  expect(screen.getByLabelText('Transfer folder')).toHaveValue('D:\\exports\\payments');
  fireEvent.change(screen.getByLabelText('Restore date'), { target: { value: '2026-07-11' } });
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  fireEvent.click(screen.getByRole('button', { name: 'Import' }));

  expect(onAction).toHaveBeenCalledWith('EXPORT_JOB', {
    transferPath: 'D:\\exports\\payments', confirmed: true,
  });
  expect(onAction).toHaveBeenCalledWith('IMPORT_JOB', {
    transferPath: 'D:\\exports\\payments', restoreDate: '2026-07-11', confirmed: true,
  });
});

test('cancellation suppresses transfer commands and a pending toolbar action disables the form', () => {
  const onAction = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  const view = render(
    <BotJobFileActions
      state={state}
      connected
      pendingAction={null}
      transferPath={'D:\\exports'}
      onAction={onAction}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  fireEvent.click(screen.getByRole('button', { name: 'Import' }));
  expect(onAction).not.toHaveBeenCalled();

  view.rerender(
    <BotJobFileActions
      state={state}
      connected
      pendingAction="EXPORT_JOB"
      transferPath={'D:\\exports'}
      onAction={onAction}
    />,
  );
  expect(screen.getByLabelText('Restore date')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Choose transfer folder' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
});
