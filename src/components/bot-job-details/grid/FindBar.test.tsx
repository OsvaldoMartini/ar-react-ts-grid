import { fireEvent, render, screen } from '@testing-library/react';
import FindBar from './FindBar';

describe('FindBar', () => {
  it('renders the label and input, with no clear button when empty', () => {
    render(<FindBar value="" onChange={() => {}} />);
    expect(screen.getByText('Find:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type to find…')).toHaveValue('');
    expect(screen.queryByLabelText('Clear find')).not.toBeInTheDocument();
  });

  it('reports typing through onChange', () => {
    const onChange = jest.fn();
    render(<FindBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Type to find…'), {
      target: { value: 'login' },
    });
    expect(onChange).toHaveBeenCalledWith('login');
  });

  it('shows the clear button when there is a value and clears on click', () => {
    const onChange = jest.fn();
    render(<FindBar value="login" onChange={onChange} />);
    const clear = screen.getByLabelText('Clear find');
    expect(clear).toBeInTheDocument();
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith('');
  });
});
