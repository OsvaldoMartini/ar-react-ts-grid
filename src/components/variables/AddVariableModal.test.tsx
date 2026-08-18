import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AddVariableModal from './AddVariableModal';

test('creates a producer-free variable that begins as VOID', () => {
  const onSubmit = jest.fn();
  render(
    <AddVariableModal
      existingNames={[]}
      onSubmit={onSubmit}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText('Variable name'), {
    target: { value: '  payment_text  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'CREATE VARIABLE' }));
  expect(onSubmit).toHaveBeenLastCalledWith({
    name: 'payment_text',
  });
  expect(screen.queryByLabelText('Exact initial value')).not.toBeInTheDocument();
});

test('rejects an existing variable name without changing its case', () => {
  const onSubmit = jest.fn();
  render(
    <AddVariableModal
      existingNames={['Account Value']}
      onSubmit={onSubmit}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText('Variable name'), {
    target: { value: 'account value' },
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'A variable with this name already exists',
  );
  expect(screen.getByRole('button', { name: 'CREATE VARIABLE' })).toBeDisabled();
});
