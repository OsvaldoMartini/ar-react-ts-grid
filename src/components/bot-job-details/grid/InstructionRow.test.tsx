import React, { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DraggableProvided } from 'react-beautiful-dnd';
import InstructionRow from './InstructionRow';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';

const provided = {
  innerRef: () => {},
  draggableProps: {} as DraggableProvided['draggableProps'],
  dragHandleProps: {} as DraggableProvided['dragHandleProps'],
} as DraggableProvided;

const instruction = {
  id: 7,
  actions: 'GOTO',
  instructionActive: true,
  instructionOrderNumber: 3,
  refreshLoop: false,
  loopOnly: false,
  name: 'Go',
  clientNamed: '',
} as unknown as BlockLoopInstructionLoadDTO;

const baseProps = {
  provided,
  instruction,
  capability: { canMove: true, canAdd: true, canDelete: true },
  findText: '',
  dropdownOpen: false,
  isExecuting: false,
  isEditing: false,
  instructionName: '',
  nameInputRef: createRef<HTMLInputElement>(),
  renderHighlighted: (text: string) => <>{text}</>,
  operations: null,
  deviceOptionsRow: null,
  editButton: null,
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
});
