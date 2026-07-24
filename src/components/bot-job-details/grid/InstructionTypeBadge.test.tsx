import React from 'react';
import { render } from '@testing-library/react';
import InstructionTypeBadge from './InstructionTypeBadge';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';

const make = (over: Partial<BlockLoopInstructionLoadDTO>): BlockLoopInstructionLoadDTO =>
  ({ id: 1, name: 'Step', clientNamed: '', actions: '', tagName: '', ...over } as unknown as BlockLoopInstructionLoadDTO);

const passthrough = (text: string) => <>{text}</>;

describe('InstructionTypeBadge', () => {
  it('renders an icon for a known action (GOTO)', () => {
    const { container } = render(
      <InstructionTypeBadge instruction={make({ actions: 'GOTO' })} findText="" renderHighlighted={passthrough} />,
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders bold text and no icon for an unknown action', () => {
    const { container } = render(
      <InstructionTypeBadge instruction={make({ actions: 'MYSTERY' })} findText="" renderHighlighted={passthrough} />,
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('span')).toHaveStyle('font-weight: bold');
  });

  it('delegates the label to renderHighlighted', () => {
    const spy = jest.fn((text: string) => <>{text}</>);
    render(
      <InstructionTypeBadge instruction={make({ actions: 'GOTO', name: 'MyGoto' })} findText="q" renderHighlighted={spy} />,
    );
    expect(spy).toHaveBeenCalled();
  });
});
