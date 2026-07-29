import { act, renderHook } from '@testing-library/react';
import { useBlockCollapse } from './useBlockCollapse';

describe('useBlockCollapse', () => {
  it('starts with nothing collapsed', () => {
    const { result } = renderHook(() => useBlockCollapse());
    expect(result.current.collapsedBlocks.size).toBe(0);
    expect(result.current.isCollapsed(5)).toBe(false);
  });

  it('toggles a block collapsed and back', () => {
    const { result } = renderHook(() => useBlockCollapse());
    act(() => result.current.toggleBlockCollapsed(5));
    expect(result.current.isCollapsed(5)).toBe(true);
    expect(result.current.collapsedBlocks.has(5)).toBe(true);
    act(() => result.current.toggleBlockCollapsed(5));
    expect(result.current.isCollapsed(5)).toBe(false);
  });

  it('tracks multiple blocks independently', () => {
    const { result } = renderHook(() => useBlockCollapse());
    act(() => result.current.toggleBlockCollapsed(1));
    act(() => result.current.toggleBlockCollapsed(2));
    expect(result.current.isCollapsed(1)).toBe(true);
    expect(result.current.isCollapsed(2)).toBe(true);
    expect(result.current.isCollapsed(3)).toBe(false);
  });

  it('expands only a collapsed block and is idempotent for an open block', () => {
    const { result } = renderHook(() => useBlockCollapse());
    const initialSet = result.current.collapsedBlocks;

    act(() => result.current.expandBlock(5));
    expect(result.current.collapsedBlocks).toBe(initialSet);

    act(() => result.current.toggleBlockCollapsed(5));
    expect(result.current.isCollapsed(5)).toBe(true);
    act(() => result.current.expandBlock(5));
    expect(result.current.isCollapsed(5)).toBe(false);

    const expandedSet = result.current.collapsedBlocks;
    act(() => result.current.expandBlock(5));
    expect(result.current.collapsedBlocks).toBe(expandedSet);
  });
});
