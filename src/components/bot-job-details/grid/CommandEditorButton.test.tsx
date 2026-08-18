import { fireEvent, render, screen } from '@testing-library/react';
import CommandEditorButton from './CommandEditorButton';

describe('CommandEditorButton', () => {
  it('fires onClick when the arrow is clicked', () => {
    const onClick = jest.fn();
    render(<CommandEditorButton onClick={onClick} />);
    fireEvent.click(screen.getByAltText('Open Command Editor'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses the default title/alt and accepts overrides', () => {
    const { rerender } = render(<CommandEditorButton onClick={() => {}} />);
    expect(screen.getByTitle('Open Command Editor')).toBeInTheDocument();
    rerender(<CommandEditorButton onClick={() => {}} title="Edit" alt="Edit" />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
  });
});
