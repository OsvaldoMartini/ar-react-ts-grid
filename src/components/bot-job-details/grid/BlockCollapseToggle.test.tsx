import { fireEvent, render, screen } from '@testing-library/react';
import BlockCollapseToggle from './BlockCollapseToggle';

describe('BlockCollapseToggle', () => {
  it('labels itself "Collapse block" when expanded and calls onToggle on click', () => {
    const onToggle = jest.fn();
    render(<BlockCollapseToggle collapsed={false} onToggle={onToggle} />);
    const button = screen.getByTitle('Collapse block');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('labels itself "Expand block" and shows the vertical bar when collapsed', () => {
    const { container } = render(<BlockCollapseToggle collapsed onToggle={() => {}} />);
    expect(screen.getByTitle('Expand block')).toBeInTheDocument();
    // collapsed => the plus sign has two <path> segments (horizontal + vertical).
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('shows a single bar (minus) when expanded', () => {
    const { container } = render(<BlockCollapseToggle collapsed={false} onToggle={() => {}} />);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});
