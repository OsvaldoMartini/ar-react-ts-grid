import React from 'react';
import { render, screen } from '@testing-library/react';
import InstructionList from './InstructionList';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';

const ins = (over: Partial<BlockLoopInstructionLoadDTO>): BlockLoopInstructionLoadDTO =>
  ({ id: 1, actions: 'C', name: '', ...over } as unknown as BlockLoopInstructionLoadDTO);

const renderList = (
  instructions: BlockLoopInstructionLoadDTO[],
  props: Partial<React.ComponentProps<typeof InstructionList>> = {},
) =>
  render(
    <InstructionList
      droppableId="1"
      instructions={instructions}
      blockName="Block A"
      findText=""
      dropZone="none"
      instructionMatchesFind={(instruction, query) =>
        (instruction.name ?? '').toLowerCase().includes(query)}
      onListDragOver={() => {}}
      onListDrop={() => {}}
      renderRow={(instruction) => <div data-testid={`row-${instruction.id}`}>{instruction.name}</div>}
      {...props}
    />,
  );

describe('InstructionList', () => {
  it('renders a row per instruction and skips EXCEL GOTO', () => {
    renderList([ins({ id: 1, name: 'One' }), ins({ id: 2, actions: 'EXCEL GOTO', name: 'skip' }), ins({ id: 3, name: 'Three' })]);
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('row-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('row-3')).toBeInTheDocument();
  });

  it('hides rows that do not match the find query (block name not matching)', () => {
    renderList([ins({ id: 1, name: 'Login' }), ins({ id: 2, name: 'Logout' })], { findText: 'login' });
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('row-2')).not.toBeInTheDocument();
  });

  it('keeps every row when the block name matches the query', () => {
    renderList([ins({ id: 1, name: 'x' }), ins({ id: 2, name: 'y' })], { findText: 'block' });
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });
});
