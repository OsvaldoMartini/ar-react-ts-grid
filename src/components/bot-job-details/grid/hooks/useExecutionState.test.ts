import { act, renderHook } from '@testing-library/react';
import { useExecutionState } from './useExecutionState';

describe('useExecutionState', () => {
  it('starts idle (id 0, no state)', () => {
    const { result } = renderHook(() => useExecutionState());
    expect(result.current.executionId).toBe(0);
    expect(result.current.executionState).toBeUndefined();
  });

  it('tracks the executing instruction id and status', () => {
    const { result } = renderHook(() => useExecutionState());
    act(() => {
      result.current.setExecutionId(42);
      result.current.setExecutionState('running');
    });
    expect(result.current.executionId).toBe(42);
    expect(result.current.executionState).toBe('running');
  });
});
