import { act, renderHook } from '@testing-library/react';
import { useExcelExport, UseExcelExportDeps } from './useExcelExport';

const noopAlerts = {
  setAlertImage: jest.fn(),
  setAlertClass: jest.fn(),
  setErrorFlag: jest.fn(),
  setAlertMessageHeader: jest.fn(),
  setAlertMessageBody: jest.fn(),
  setAlertMessageFooter: jest.fn(),
};

const makeDeps = (over: Partial<UseExcelExportDeps> = {}): UseExcelExportDeps => ({
  webSocket: null,
  connected: false,
  sessionId: 'botJobTasks',
  homeBankingId: 1,
  botJobId: 7,
  botJobName: 'Job',
  alerts: noopAlerts,
  ...over,
});

describe('useExcelExport', () => {
  it('starts closed with no context / directory', () => {
    const { result } = renderHook(() => useExcelExport(makeDeps()));
    expect(result.current.excelExportContext).toBeNull();
    expect(result.current.excelExportDirectory).toBeUndefined();
    expect(result.current.choosingExcelExportDirectory).toBe(false);
  });

  it('handleExcelFileBlockName opens the panel for a block and resets transients', () => {
    const { result } = renderHook(() => useExcelExport(makeDeps()));
    act(() => {
      result.current.setChoosingExcelExportDirectory(true);
      result.current.setExcelExportDirectory('C:/old');
    });
    act(() => result.current.handleExcelFileBlockName(5, 'Block 5', 2, 'out.xlsx'));
    expect(result.current.excelExportContext).toEqual({
      blockId: 5, blockName: 'Block 5', blockOrderNumber: 2, exportFile: 'out.xlsx',
    });
    expect(result.current.choosingExcelExportDirectory).toBe(false);
    expect(result.current.excelExportDirectory).toBeUndefined();
  });

  it('submitExcelExport sends save + clears context when connected', () => {
    const send = jest.fn();
    const ws = { send } as unknown as WebSocket;
    const { result } = renderHook(() =>
      useExcelExport(makeDeps({ webSocket: ws, connected: true })),
    );
    act(() => result.current.handleExcelFileBlockName(5, 'Block 5', 2, 'out.xlsx'));
    act(() =>
      result.current.submitExcelExport({
        directory: 'C:/x', filename: 'f', fileType: '.xlsx', delimiter: ',',
      }),
    );
    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0]);
    expect(payload.type).toBe('excelExport.save');
    expect(result.current.excelExportContext).toBeNull();
  });

  it('closeExcelExport resets everything', () => {
    const { result } = renderHook(() => useExcelExport(makeDeps()));
    act(() => result.current.handleExcelFileBlockName(5, 'Block 5', 2));
    act(() => result.current.closeExcelExport());
    expect(result.current.excelExportContext).toBeNull();
    expect(result.current.excelExportDirectory).toBeUndefined();
    expect(result.current.choosingExcelExportDirectory).toBe(false);
  });
});
