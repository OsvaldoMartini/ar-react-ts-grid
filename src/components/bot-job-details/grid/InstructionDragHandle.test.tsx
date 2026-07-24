import { fireEvent, render, screen } from '@testing-library/react';
import InstructionDragHandle from './InstructionDragHandle';

const setup = (over: Partial<React.ComponentProps<typeof InstructionDragHandle>> = {}) => {
  const onMoveUp = jest.fn();
  const onMoveDown = jest.fn();
  render(
    <InstructionDragHandle
      ariaLabel="Move instruction 1"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      {...over}
    />,
  );
  return { onMoveUp, onMoveDown, button: screen.getByLabelText('Move instruction 1') };
};

describe('InstructionDragHandle', () => {
  it('moves up on Alt+ArrowUp and down on Alt+ArrowDown', () => {
    const { onMoveUp, onMoveDown, button } = setup();
    fireEvent.keyUp(button, { key: 'ArrowUp', altKey: true });
    fireEvent.keyUp(button, { key: 'ArrowDown', altKey: true });
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('ignores arrows without Alt', () => {
    const { onMoveUp, onMoveDown, button } = setup();
    fireEvent.keyUp(button, { key: 'ArrowUp' });
    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).not.toHaveBeenCalled();
  });

  it('renders disabled when told to', () => {
    const { button } = setup({ disabled: true });
    expect(button).toBeDisabled();
  });
});
