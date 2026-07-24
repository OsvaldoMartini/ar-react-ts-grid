import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BlockCard from './BlockCard';

const baseProps = {
  blockDraggable: true,
  onBlockDragStart: () => {},
  onBlockDragOver: () => {},
  onBlockDrop: () => {},
  onBlockDragEnd: () => {},
  collapsed: false,
  header: <div>Header content</div>,
  list: <div>List content</div>,
};

describe('BlockCard', () => {
  it('renders header and list when expanded', () => {
    render(<BlockCard {...baseProps} />);
    expect(screen.getByText('Header content')).toBeInTheDocument();
    expect(screen.getByText('List content')).toBeInTheDocument();
  });

  it('hides the list when collapsed', () => {
    render(<BlockCard {...baseProps} collapsed />);
    expect(screen.getByText('Header content')).toBeInTheDocument();
    expect(screen.queryByText('List content')).not.toBeInTheDocument();
  });

  it('starts a block drag from the header and drops on the card', () => {
    const onBlockDragStart = jest.fn();
    const onBlockDrop = jest.fn();
    const { container } = render(
      <BlockCard {...baseProps} onBlockDragStart={onBlockDragStart} onBlockDrop={onBlockDrop} />,
    );
    const headerHost = screen.getByText('Header content').closest('[draggable]');
    fireEvent.dragStart(headerHost as Element);
    expect(onBlockDragStart).toHaveBeenCalledTimes(1);
    fireEvent.drop(container.firstChild as Element);
    expect(onBlockDrop).toHaveBeenCalledTimes(1);
  });

  it('does not make the header draggable when disabled', () => {
    render(<BlockCard {...baseProps} blockDraggable={false} />);
    const headerHost = screen.getByText('Header content').closest('[draggable]');
    expect(headerHost).toHaveAttribute('draggable', 'false');
  });
});
