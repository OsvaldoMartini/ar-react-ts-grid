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
