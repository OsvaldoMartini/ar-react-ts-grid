import React from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { instructionMatchesFind, useInstructionFind } from './useInstructionFind';
import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

const ins = (over: Partial<BlockLoopInstructionLoadDTO>): BlockLoopInstructionLoadDTO =>
  ({ id: 1, name: '', actions: 'C', ...over } as unknown as BlockLoopInstructionLoadDTO);

describe('instructionMatchesFind', () => {
  it('matches by name, case-insensitive; misses when absent', () => {
    expect(instructionMatchesFind(ins({ name: 'Login button' }), 'login')).toBe(true);
    expect(instructionMatchesFind(ins({ name: 'Logout' }), 'zzz')).toBe(false);
  });
});

describe('useInstructionFind', () => {
  it('holds and updates findText', () => {
    const { result } = renderHook(() => useInstructionFind());
    expect(result.current.findText).toBe('');
    act(() => result.current.setFindText('login'));
    expect(result.current.findText).toBe('login');
  });

  it('renderHighlighted returns plain text when the query is empty or absent', () => {
    const { result } = renderHook(() => useInstructionFind());
    expect(result.current.renderHighlighted('Continue', '')).toBe('Continue');
    expect(result.current.renderHighlighted('Continue', 'zzz')).toBe('Continue');
  });

  it('renderHighlighted wraps the matched substring in a <mark>', () => {
    const { result } = renderHook(() => useInstructionFind());
    const { container } = render(<>{result.current.renderHighlighted('Continue', 'tin')}</>);
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveTextContent('tin');
    expect(container).toHaveTextContent('Continue');
  });
});
