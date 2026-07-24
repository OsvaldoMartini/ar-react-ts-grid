import { fireEvent, render, screen } from '@testing-library/react';
import DeleteButton from './DeleteButton';

describe('DeleteButton', () => {
  it('fires onClick and shows the title', () => {
    const onClick = jest.fn();
    render(<DeleteButton onClick={onClick} title="Delete instruction" alt="delete" />);
    const icon = screen.getByAltText('delete');
    expect(icon).toHaveAttribute('title', 'Delete instruction');
    fireEvent.click(icon);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('dims to 0.35 opacity when not allowed, full opacity otherwise', () => {
    const { rerender } = render(<DeleteButton onClick={() => {}} alt="d" dimmed />);
    expect(screen.getByAltText('d')).toHaveStyle('opacity: 0.35');
    rerender(<DeleteButton onClick={() => {}} alt="d" />);
    expect(screen.getByAltText('d')).toHaveStyle('opacity: 1');
  });
});
