import { fireEvent, render, screen } from '@testing-library/react';
import BlockStatusToggle from './BlockStatusToggle';

describe('BlockStatusToggle', () => {
  it('renders the active state', () => {
    render(<BlockStatusToggle active onToggle={() => {}} />);
    expect(screen.getByAltText('Active')).toBeInTheDocument();
    expect(screen.queryByAltText('Inactive')).not.toBeInTheDocument();
  });

  it('renders the inactive state', () => {
    render(<BlockStatusToggle active={false} onToggle={() => {}} />);
    expect(screen.getByAltText('Inactive')).toBeInTheDocument();
    expect(screen.queryByAltText('Active')).not.toBeInTheDocument();
  });

  it('requests one toggle for one click', () => {
    const onToggle = jest.fn();
    render(<BlockStatusToggle active onToggle={onToggle} />);
    fireEvent.click(screen.getByAltText('Active'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
