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

  it('remains fully visible and clickable when a legacy caller passes dimmed', () => {
    const onClick = jest.fn();
    render(<DeleteButton onClick={onClick} alt="d" dimmed />);
    const icon = screen.getByAltText('d');
    expect(icon).not.toHaveStyle('opacity: 0.35');
    fireEvent.click(icon);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
