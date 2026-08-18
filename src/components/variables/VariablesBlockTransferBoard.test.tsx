import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VariablesBlockTransferBoard, {
  VARIABLES_INSTRUCTION_DRAG_MIME,
} from './VariablesBlockTransferBoard';

const blocks = [
  { id: 30, name: 'Empty', order: 3, active: false },
  { id: 20, name: 'Target', order: 2, active: true },
  { id: 10, name: 'Source', order: 1, active: true },
];

const layoutRows = [
  {
    instructionId: 100,
    blockId: 10,
    blockOrderNumber: 1,
    instructionOrderNumber: 1,
  },
  {
    instructionId: 101,
    blockId: 10,
    blockOrderNumber: 1,
    instructionOrderNumber: 2,
  },
  {
    instructionId: 201,
    blockId: 20,
    blockOrderNumber: 2,
    instructionOrderNumber: 1,
  },
];

const transfer = (instructionId: number) => ({
  types: [VARIABLES_INSTRUCTION_DRAG_MIME],
  effectAllowed: 'move',
  dropEffect: 'move',
  getData: (type: string) =>
    type === VARIABLES_INSTRUCTION_DRAG_MIME ? String(instructionId) : '',
  setData: jest.fn(),
});

test('renders every authoritative Block in order, including empty Blocks', () => {
  render(
    <VariablesBlockTransferBoard
      blocks={blocks}
      layoutRows={layoutRows}
      onTransferIntent={jest.fn()}
    />,
  );

  const cards = screen.getAllByTestId(/variables-transfer-block-/);
  expect(cards.map(card => card.getAttribute('data-testid'))).toEqual([
    'variables-transfer-block-10',
    'variables-transfer-block-20',
    'variables-transfer-block-30',
  ]);
  expect(cards[0]).toHaveTextContent('2 instructions');
  expect(cards[1]).toHaveTextContent('1 instruction');
  expect(cards[2]).toHaveTextContent('0 instructions');
});

test('emits the exact source instruction and target Block on drop', () => {
  const onTransferIntent = jest.fn();
  render(
    <VariablesBlockTransferBoard
      blocks={blocks}
      layoutRows={layoutRows}
      onTransferIntent={onTransferIntent}
    />,
  );
  const target = screen.getByTestId('variables-transfer-block-20');
  const dataTransfer = transfer(101);

  fireEvent.dragOver(target, { dataTransfer });
  expect(screen.getByText('Release to choose action')).toBeInTheDocument();
  fireEvent.drop(target, { dataTransfer });

  expect(onTransferIntent).toHaveBeenCalledWith({
    sourceInstructionId: 101,
    targetBlockId: 20,
  });
});

test('does not accept a drop while mutation is disabled', () => {
  const onTransferIntent = jest.fn();
  render(
    <VariablesBlockTransferBoard
      blocks={blocks}
      layoutRows={layoutRows}
      disabled
      unavailableReason="Saving..."
      onTransferIntent={onTransferIntent}
    />,
  );

  fireEvent.drop(screen.getByTestId('variables-transfer-block-20'), {
    dataTransfer: transfer(101),
  });

  expect(onTransferIntent).not.toHaveBeenCalled();
  expect(screen.getByText('Saving...')).toBeInTheDocument();
});
