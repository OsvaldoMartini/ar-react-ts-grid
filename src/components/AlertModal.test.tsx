import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AlertModal from './AlertModal';

test('renders the orange Direct Steps RulesCard as an independent confirmation action', () => {
  const onConfirm = jest.fn();
  const onDirect = jest.fn();
  const onClose = jest.fn();

  render(
    <AlertModal
      header="Add connected instructions?"
      body={'#1 IF\n#2 ELSE\n#3 ENDIF'}
      extraMsg="Choose the complete group or only direct steps."
      onClose={onClose}
      onConfirm={onConfirm}
      alternateAction={{
        label: 'Only GET the Direct Steps',
        onAction: onDirect,
      }}
      imageSrc="alert.png"
      error={false}
    />,
  );

  fireEvent.click(screen.getByRole('button', {
    name: 'Only GET the Direct Steps',
  }));

  expect(onDirect).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

test('keeps a long row list inside the scrollable body and actions outside it', () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  const rows = Array.from({ length: 12 }, (_, index) => ({
    parentNameWithId: `#${index + 1} (${100 + index}) Row ${index + 1}`,
    connectionLabel: 'Action',
    actions: 'CLICK',
  }));

  const { container } = render(
    <AlertModal
      header="Delete instructions?"
      body={rows}
      extraMsg="Only the exact rows shown will be deleted."
      onClose={onClose}
      onConfirm={onConfirm}
      imageSrc="alert.png"
      error
    />,
  );

  const body = container.querySelector('.alert-body');
  const buttons = container.querySelector('.alert-buttons');
  expect(body).toHaveClass('is-array');
  expect(body?.querySelectorAll('.complex-message-row')).toHaveLength(12);
  expect(body?.contains(buttons)).toBe(false);

  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});
