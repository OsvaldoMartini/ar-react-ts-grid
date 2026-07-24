import { fireEvent, render, screen } from '@testing-library/react';
import MemoryAddButton from './MemoryAddButton';

describe('MemoryAddButton', () => {
  it('renders a "+" and fires onClick', () => {
    const onClick = jest.fn();
    render(<MemoryAddButton onClick={onClick} title="Add step to memory list" />);
    const button = screen.getByRole('button', { name: '+' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when told to', () => {
    render(<MemoryAddButton onClick={() => {}} disabled />);
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });
});
