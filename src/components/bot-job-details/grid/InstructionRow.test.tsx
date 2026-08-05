import React, { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InstructionRow from './InstructionRow';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';

const instruction = {
  id: 7,
  blockId: 11,
  actions: 'GOTO',
  instructionActive: true,
  instructionOrderNumber: 3,
  refreshLoop: false,
  loopOnly: false,
  name: 'Go',
  clientNamed: '',
} as unknown as BlockLoopInstructionLoadDTO;

const baseProps = {
  instruction,
  capability: { canMove: true, canAdd: true, canDelete: true },
  findText: '',
  onRowDragStart: () => {},
  onRowDragOver: () => {},
  onRowDrop: () => {},
  onRowDragEnd: () => {},
  dropdownOpen: false,
  isExecuting: false,
  isEditing: false,
  instructionName: '',
  nameInputRef: createRef<HTMLInputElement>(),
  renderHighlighted: (text: string) => <>{text}</>,
  operations: null,
  deviceOptionsRow: null,
  editButton: null,
  commandEditButton: null,
  moveButtons: null,
  testClick: null,
  onChangeName: () => {},
  onSaveName: () => {},
  onMoveUp: () => {},
  onMoveDown: () => {},
  onToggleStatus: () => {},
  onAddToMemory: () => {},
  onRemove: () => {},
  onOpenCommandEditor: () => {},
};

describe('InstructionRow', () => {
  it('renders the drag handle, type badge and delete, and fires onRemove', () => {
    const onRemove = jest.fn();
    render(<InstructionRow {...baseProps} onRemove={onRemove} />);
    expect(screen.getByLabelText('Move instruction 3')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Delete instruction'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows the inline name editor when editing', () => {
    render(<InstructionRow {...baseProps} isEditing instructionName="editing" />);
    expect(screen.getByDisplayValue('editing')).toBeInTheDocument();
  });

  it('shows the status toggle (not the editor) when not editing', () => {
    render(<InstructionRow {...baseProps} />);
    expect(screen.getByAltText('Active')).toBeInTheDocument();
  });

  it('shows the Memory-specific refusal reason on a disabled add button', () => {
    render(<InstructionRow
      {...baseProps}
      capability={{
        canMove: true,
        canAdd: false,
        canDelete: true,
        addReason: 'Refresh the dependency graph.',
      }}
    />);
    expect(screen.getByTitle('Refresh the dependency graph.')).toBeDisabled();
  });

  it('exposes stable focus markers without entering the normal tab order', () => {
    const { container } = render(<InstructionRow {...baseProps} />);
    expect(container.firstChild).toHaveAttribute('data-focus-target', 'instruction');
    expect(container.firstChild).toHaveAttribute('data-block-id', '11');
    expect(container.firstChild).toHaveAttribute('data-instruction-id', '7');
    expect(container.firstChild).toHaveAttribute('tabindex', '-1');
  });
});
