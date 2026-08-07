import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import WebElementTypeToggle from './WebElementTypeToggle';

describe('WebElementTypeToggle', () => {
  it('reports the next execution type without owning the selected value', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <WebElementTypeToggle value="INPUT" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /execution type input/i }));

    expect(onChange).toHaveBeenCalledWith('OUTPUT');
    expect(screen.getByText('INPUT')).toBeInTheDocument();

    rerender(<WebElementTypeToggle value="OUTPUT" onChange={onChange} />);
    expect(screen.getByText('OUTPUT')).toBeInTheDocument();
  });

  it('cycles OUTPUT to CLICK and CLICK to INPUT', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <WebElementTypeToggle value="OUTPUT" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenLastCalledWith('CLICK');

    rerender(<WebElementTypeToggle value="CLICK" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenLastCalledWith('INPUT');
  });

  it('blocks interaction and exposes busy state while pending', () => {
    const onChange = jest.fn();
    render(
      <WebElementTypeToggle value="CLICK" onChange={onChange} pending />,
    );

    const toggle = screen.getByRole('button');
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
