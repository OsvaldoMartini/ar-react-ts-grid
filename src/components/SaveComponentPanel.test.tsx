import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SaveComponentPanel from './SaveComponentPanel';

const context = { blockId: 10, blockName: 'Payments', blockOrderNumber: 2,
  instructions: [{ id: 100, blockId: 10, blockOrderNumber: 2, instructionOrderNumber: 1 }] };

test('hydrates defaults and submits trimmed values', () => {
  const onSubmit = jest.fn();
  render(<SaveComponentPanel context={context} onSubmit={onSubmit} onClose={jest.fn()}/>);
  expect(screen.getByLabelText('Component name')).toHaveValue('Payments');
  expect(screen.getByLabelText('Description')).toHaveValue('Payments description');
  fireEvent.change(screen.getByLabelText('Component name'), { target: { value: ' Payment component ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save component' }));
  expect(onSubmit).toHaveBeenCalledWith('Payment component', 'Payments description');
});

test('requires name and description', () => {
  const onSubmit = jest.fn();
  render(<SaveComponentPanel context={context} onSubmit={onSubmit} onClose={jest.fn()}/>);
  fireEvent.change(screen.getByLabelText('Component name'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save component' }));
  expect(screen.getByText('Component name is required.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('closes without submission', () => {
  const onClose = jest.fn();
  render(<SaveComponentPanel context={context} onSubmit={jest.fn()} onClose={onClose}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
