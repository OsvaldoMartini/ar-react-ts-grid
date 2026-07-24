import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InlineNameEditor from './InlineNameEditor';

describe('InlineNameEditor', () => {
  it('renders the current value and reports edits', () => {
    const onChange = jest.fn();
    render(<InlineNameEditor value="Block A" onChange={onChange} onSave={() => {}} />);
    const input = screen.getByDisplayValue('Block A');
    fireEvent.change(input, { target: { value: 'Block B' } });
    expect(onChange).toHaveBeenCalledWith('Block B');
  });

  it('saves on Enter and on clicking the save icon', () => {
    const onSave = jest.fn();
    render(<InlineNameEditor value="name" onChange={() => {}} onSave={onSave} saveAlt="save" />);
    fireEvent.keyDown(screen.getByDisplayValue('name'), { key: 'Enter' });
    fireEvent.click(screen.getByAltText('save'));
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('does not save on other keys', () => {
    const onSave = jest.fn();
    render(<InlineNameEditor value="name" onChange={() => {}} onSave={onSave} />);
    fireEvent.keyDown(screen.getByDisplayValue('name'), { key: 'a' });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('forwards the input ref for autofocus', () => {
    const ref = createRef<HTMLInputElement>();
    render(<InlineNameEditor value="" onChange={() => {}} onSave={() => {}} inputRef={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
