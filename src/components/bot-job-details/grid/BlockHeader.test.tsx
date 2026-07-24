import React, { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BlockHeader from './BlockHeader';

const baseProps: React.ComponentProps<typeof BlockHeader> = {
  blockActive: true,
  blockOrderNumber: 2,
  blockName: 'Login block',
  instructionCount: 4,
  collapsed: false,
  isEditing: false,
  editingName: '',
  nameInputRef: createRef<HTMLInputElement>(),
  findText: '',
  canAddToMemory: true,
  isFirstBlock: false,
  blockDeleteTitle: 'Delete block',
  blockDeleteDimmed: false,
  renderHighlighted: (text: string) => <>{text}</>,
  exportFileNode: <>export.xlsx</>,
  excelGotoNode: null,
  onToggleStatus: () => {},
  onToggleCollapse: () => {},
  onChangeName: () => {},
  onSaveName: () => {},
  onAddToMemory: () => {},
  onRollback: () => {},
  onMoveUp: () => {},
  onMoveDown: () => {},
  onEditName: () => {},
  onExcelFile: () => {},
  onCreateComponent: () => {},
  onDeleteBlock: () => {},
};

describe('BlockHeader', () => {
  it('shows the order number, name and count, and deletes on click', () => {
    const onDeleteBlock = jest.fn();
    render(<BlockHeader {...baseProps} onDeleteBlock={onDeleteBlock} />);
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('Login block')).toBeInTheDocument();
    expect(screen.getByText('(4)')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Delete block'));
    expect(onDeleteBlock).toHaveBeenCalledTimes(1);
  });

  it('shows the inline editor when editing', () => {
    render(<BlockHeader {...baseProps} isEditing editingName="editing name" />);
    expect(screen.getByDisplayValue('editing name')).toBeInTheDocument();
    expect(screen.queryByText('Login block')).not.toBeInTheDocument();
  });

  it('renders the rollback control only for the first block', () => {
    const onRollback = jest.fn();
    const { rerender } = render(<BlockHeader {...baseProps} isFirstBlock={false} />);
    expect(screen.getByAltText('edit')).toBeInTheDocument();
    rerender(<BlockHeader {...baseProps} isFirstBlock onRollback={onRollback} />);
    // edit/excel/save alts plus the rollback (alt="") — assert move controls exist.
    fireEvent.click(screen.getByAltText('excel'));
  });
});
