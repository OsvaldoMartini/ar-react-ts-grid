import { act, renderHook } from '@testing-library/react';
import { useGridAlerts } from './useGridAlerts';

describe('useGridAlerts', () => {
  it('starts with a default (non-error) alert state', () => {
    const { result } = renderHook(() => useGridAlerts());
    expect(result.current.errorFlag).toBe(false);
    expect(result.current.alertMessageHeader).toBeNull();
    expect(result.current.pendingDeleteBlockId).toBeNull();
    expect(result.current.alertOnConfirm).toBeUndefined();
  });

  it('lets callers set alert fields', () => {
    const { result } = renderHook(() => useGridAlerts());
    act(() => {
      result.current.setAlertMessageHeader('Delete Block');
      result.current.setErrorFlag(true);
      result.current.setPendingDeleteBlockId(7);
      result.current.setAlertOnConfirm(() => () => {});
    });
    expect(result.current.alertMessageHeader).toBe('Delete Block');
    expect(result.current.errorFlag).toBe(true);
    expect(result.current.pendingDeleteBlockId).toBe(7);
    expect(result.current.alertOnConfirm).toBeInstanceOf(Function);
  });

  it('handleClose clears the error, header/body, pending delete and confirm', () => {
    const { result } = renderHook(() => useGridAlerts());
    act(() => {
      result.current.setErrorFlag(true);
      result.current.setAlertMessageHeader('X');
      result.current.setPendingDeleteBlockId(3);
      result.current.setAlertOnConfirm(() => () => {});
    });
    act(() => result.current.handleClose());
    expect(result.current.errorFlag).toBe(false);
    expect(result.current.alertMessageHeader).toBe('');
    expect(result.current.pendingDeleteBlockId).toBeNull();
    expect(result.current.alertOnConfirm).toBeUndefined();
    expect(result.current.alertDismissed).toBe(true);
  });
});
