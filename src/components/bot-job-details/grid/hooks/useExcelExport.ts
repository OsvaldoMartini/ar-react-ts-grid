import { useRef, useState } from 'react';
import { ExcelExportContext } from '../../../ExcelExportPanel';
import { ComplexMessage } from '../../../instructionsMockData';
import warningRedImage from '../../../../assets/warning_red.png';

/** Alert setters this hook needs to surface a folder-picker / save failure. */
export interface ExcelExportAlertDeps {
  setAlertImage: React.Dispatch<React.SetStateAction<string>>;
  setAlertClass: React.Dispatch<React.SetStateAction<string>>;
  setErrorFlag: React.Dispatch<React.SetStateAction<boolean>>;
  setAlertMessageHeader: React.Dispatch<React.SetStateAction<string | null>>;
  setAlertMessageBody: React.Dispatch<React.SetStateAction<string | ComplexMessage[]>>;
  setAlertMessageFooter: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseExcelExportDeps {
  webSocket: WebSocket | null;
  connected: boolean;
  sessionId: string;
  homeBankingId: number;
  botJobId: number | null;
  botJobName: string | null;
  alerts: ExcelExportAlertDeps;
}

export interface ExcelExportDraft {
  directory: string;
  filename: string;
  fileType: '.xlsx' | '.csv';
  delimiter: ',' | '|';
  clear?: boolean;
}

export interface UseExcelExport {
  excelExportContext: ExcelExportContext | null;
  setExcelExportContext: React.Dispatch<React.SetStateAction<ExcelExportContext | null>>;
  excelExportDirectory: string | undefined;
  setExcelExportDirectory: React.Dispatch<React.SetStateAction<string | undefined>>;
  choosingExcelExportDirectory: boolean;
  setChoosingExcelExportDirectory: React.Dispatch<React.SetStateAction<boolean>>;
  /** Request id for the in-flight folder-picker call (reconciled by the WS response effect). */
  pendingExcelExportDirectoryRequestRef: React.MutableRefObject<string | null>;
  /** Open the Excel Export panel for a block. */
  handleExcelFileBlockName: (
    blockId: number,
    blockName: string,
    blockOrderNumber: number,
    exportFile?: string,
  ) => void;
  /** Send an excelExport.save (or .clear) for the current context. */
  submitExcelExport: (draft: ExcelExportDraft) => void;
  /** Ask the backend to open the native folder picker. */
  chooseExcelExportDirectory: (directory: string) => void;
  /** Close the panel and reset its transient state. */
  closeExcelExport: () => void;
}

/**
 * Phase 6, step 6 — the Excel Export panel for the Bot Job Details grid: the open
 * context, chosen/pending directory, and the save / choose-directory / close
 * handlers. Extracted verbatim from GridItem; WebSocket + alert setters are passed
 * in. The excelExport.* WS responses stay in GridItem's WS effect and consume this
 * hook's ref/setters. No behavior change.
 */
export function useExcelExport(deps: UseExcelExportDeps): UseExcelExport {
  const { webSocket, connected, sessionId, homeBankingId, botJobId, botJobName, alerts } = deps;

  const [excelExportContext, setExcelExportContext] = useState<ExcelExportContext | null>(null);
  const [excelExportDirectory, setExcelExportDirectory] = useState<string | undefined>(undefined);
  const [choosingExcelExportDirectory, setChoosingExcelExportDirectory] = useState(false);
  const pendingExcelExportDirectoryRequestRef = useRef<string | null>(null);

  const handleExcelFileBlockName = (
    blockId: number,
    blockName: string,
    blockOrderNumber: number,
    exportFile?: string,
  ) => {
    pendingExcelExportDirectoryRequestRef.current = null;
    setChoosingExcelExportDirectory(false);
    setExcelExportDirectory(undefined);
    setExcelExportContext({ blockId, blockName, blockOrderNumber, exportFile });
  };

  const submitExcelExport = (draft: ExcelExportDraft) => {
    if (!excelExportContext || !webSocket || !connected || !botJobId) return;
    webSocket.send(JSON.stringify({
      type: draft.clear ? 'excelExport.clear' : 'excelExport.save', sessionId, homeBankingId,
      body: JSON.stringify({ ...excelExportContext, ...draft, requestId: `${Date.now()}-excel-${excelExportContext.blockId}`,
        sessionId, botJobId, botJobName, homeBankingId }),
    }));
    setExcelExportContext(null);
  };

  const chooseExcelExportDirectory = (directory: string) => {
    if (!excelExportContext || !webSocket || !connected || !botJobId || choosingExcelExportDirectory) return;
    const requestId = `${Date.now()}-excel-directory-${excelExportContext.blockId}`;
    pendingExcelExportDirectoryRequestRef.current = requestId;
    setChoosingExcelExportDirectory(true);
    try {
      webSocket.send(JSON.stringify({
        type: 'excelExport.chooseDirectory', sessionId, homeBankingId,
        body: JSON.stringify({ ...excelExportContext, directory, requestId,
          sessionId, botJobId, botJobName, homeBankingId }),
      }));
    } catch (error) {
      pendingExcelExportDirectoryRequestRef.current = null;
      setChoosingExcelExportDirectory(false);
      alerts.setAlertImage(warningRedImage); alerts.setAlertClass('construction-image'); alerts.setErrorFlag(true);
      alerts.setAlertMessageHeader('Excel Export Folder Not Selected');
      alerts.setAlertMessageBody('The backend connection could not open the destination folder selector.');
      alerts.setAlertMessageFooter('Check the connection and try Browse again.');
    }
  };

  const closeExcelExport = () => {
    pendingExcelExportDirectoryRequestRef.current = null;
    setChoosingExcelExportDirectory(false);
    setExcelExportDirectory(undefined);
    setExcelExportContext(null);
  };

  return {
    excelExportContext,
    setExcelExportContext,
    excelExportDirectory,
    setExcelExportDirectory,
    choosingExcelExportDirectory,
    setChoosingExcelExportDirectory,
    pendingExcelExportDirectoryRequestRef,
    handleExcelFileBlockName,
    submitExcelExport,
    chooseExcelExportDirectory,
    closeExcelExport,
  };
}
