import { render } from '@testing-library/react';
import ExecutionStateOverlay from './ExecutionStateOverlay';

describe('ExecutionStateOverlay', () => {
  it('renders the base overlay when no state is available', () => {
    const { container } = render(<ExecutionStateOverlay />);
    const overlay = container.querySelector('[data-execution-overlay="true"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).not.toHaveAttribute('data-state');
  });

  it.each(['green', 'red', 'yellow'])('normalizes and exposes the %s state', state => {
    const { container } = render(<ExecutionStateOverlay state={state.toUpperCase()} />);
    expect(container.querySelector('[data-execution-overlay="true"]')).toHaveAttribute(
      'data-state',
      state,
    );
  });

  it('keeps an unknown state as a base overlay', () => {
    const { container } = render(<ExecutionStateOverlay state="unknown" />);
    const overlay = container.querySelector('[data-execution-overlay="true"]');
    expect(overlay).toHaveAttribute('data-state', 'unknown');
    expect(overlay?.className.split(' ')).toHaveLength(1);
  });
});
