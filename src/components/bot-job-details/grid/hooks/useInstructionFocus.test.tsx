import React, { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  InstructionFocusResult,
  useInstructionFocus,
} from './useInstructionFocus';

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

afterEach(() => {
  jest.useRealTimers();
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

const FocusHarness = ({
  excelGoto = false,
  onResult,
}: {
  excelGoto?: boolean;
  onResult: (result: InstructionFocusResult) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [find, setFind] = useState('hidden');
  const focusInstruction = useInstructionFocus({
    containerRef,
    expandBlock: () => setCollapsed(false),
    clearFind: () => setFind(''),
    highlightDurationMs: 20,
    onResult,
  });

  return (
    <>
      <span data-testid="find">{find}</span>
      <button
        type="button"
        onClick={() => focusInstruction({ blockId: 11, instructionId: 7 })}
      >
        Focus
      </button>
      <div ref={containerRef}>
        <div data-focus-target="block" data-block-id="11" tabIndex={-1}>
          Block
          {!collapsed && !excelGoto ? (
            <div
              data-focus-target="instruction"
              data-block-id="11"
              data-instruction-id="7"
              tabIndex={-1}
            >
              Instruction
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

describe('useInstructionFocus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('clears Find, expands, focuses, and scrolls the requested instruction', () => {
    const onResult = jest.fn();
    render(<FocusHarness onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
    expect(screen.getByTestId('find')).toHaveTextContent('');

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText('Instruction')).toHaveFocus();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(onResult).toHaveBeenCalledWith('instruction');
  });

  it('focuses the owning block when EXCEL GOTO has no normal row', () => {
    const onResult = jest.fn();
    render(<FocusHarness excelGoto onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText('Block')).toHaveFocus();
    expect(onResult).toHaveBeenCalledWith('block');
  });
});
