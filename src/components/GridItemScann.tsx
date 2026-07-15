import React, { useState, useEffect, useRef } from 'react';
import { ComplexMessage, ElementDTO } from './instructionsMockData';
import crossImage from '../assets/cross.png';
import pickItemImage from '../assets/pick-item5.png';
import saveImage from "../assets/save.png";
import editImage from '../assets/edit.png';
import constructionImage from '../assets/construction.png';
import clickImage from "../assets/click.png";
import linkImage from "../assets/links-icon.png";
import inputImage from "../assets/input_field.png";
import outPutImage from "../assets/output1.png";
import testInputImage from "../assets/testInput.png";
import clickTestImage from "../assets/clickTest2.png";
import warningRedImage from '../assets/warning_red.png';
import CompForce from './CompForce';
import AlertModal from './AlertModal';
import DomReviewModal, { type DomReviewData, type DomReviewAction } from './DomReviewModal';
import SupportRequestModal, { type SupportRequestData, type SupportRequestAction } from './SupportRequestModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';
import NameDropdown from './NameDropdown';
import CreateNewBlock, { CreateBlockOption, CreateBlockPosition } from './CreateNewBlock';
import OCRPanel from './OCRPanel';
import OCRConfigPanel, { OCRConfigData, OCRParameter } from './OCRConfigPanel';
import OCRTestResultsPanel, { OCRTestResult } from './OCRTestResultsPanel';
import BotJobDetailsChrome from './bot-job-details/BotJobDetailsChrome';
import { useBotJobDetailsController } from './bot-job-details/useBotJobDetailsController';
import ScannerWorkspaceHeader from './scanner/ScannerWorkspaceHeader';
import { useScannerController } from './scanner/useScannerController';
import { SCANNER_SEARCH_TERMS_OPERATION } from './scanner/Scanner.operations';
import {
  SCANNER_ELEMENT_PANE_SESSION_ID,
  PRE_SCANNER_GRID_SESSION_ID,
  SCANNER_GRID_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from './scanner/Scanner.sessions';
import styles from './GridItemScann.module.scss';


interface GridItemScannProps {
  homeBankingIdInitial: number;
  botJobIdInitial: number;
  botJobNameInitial: string;
  dataDTO: ElementDTO[];
  socketPort: number;
  sessionId: string;
  mode?: 'scanner' | 'preScan';
}

// Canonical group buckets. The scanner's DECIDED category (typeElement) wins over
// the raw tag, so a <select> classified as clickable lands in the Button group and
// nothing ever mints a one-off group like "Select Text" (mat-select, svg, option…).
// Undecided elements render as Output — same convention as the AR Web Factory pane
// (input → input, click → button, link → a, output → label).
const groupTagFor = (item: ElementDTO): string => {
  const tag = (item.tagName ?? '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return 'input';
  if (tag === 'button') return 'button';
  if (tag === 'a' || tag === 'link') return 'a';
  if (tag === 'label') return 'label';

  const type = ((item as any).typeElement ?? '').toLowerCase();
  if (type === 'input') return 'input';
  if (type === 'button') return 'button';
  if (type === 'a' || type === 'link') return 'a';
  return 'label';
};

const groupByTagName = (data: ElementDTO[]) => {
  return data.reduce((result, item) => {
    const groupTag = groupTagFor(item);
    if (!result[groupTag]) {
      result[groupTag] = { tagName: groupTag, elements: [] };
    }
    result[groupTag].elements.push(item);
    return result;
  }, {} as Record<string, { tagName: string; elements: ElementDTO[] }>);
};

const normalizeBlockOptions = (blocks: CreateBlockOption[]): CreateBlockOption[] => {
  const byBlockId = new Map<number, CreateBlockOption>();
  blocks.forEach((block) => {
    if (block.blockId > 0) byBlockId.set(block.blockId, block);
  });
  return Array.from(byBlockId.values()).sort((a, b) => a.blockOrderNumber - b.blockOrderNumber);
};

const blockOptionsFromPayload = (payload: any): CreateBlockOption[] => {
  const rawBlocks = Array.isArray(payload?.blocks) ? payload.blocks : [];
  return rawBlocks
    .map((block: any) => ({
      blockId: Number(block.blockId),
      blockOrderNumber: Number(block.blockOrderNumber),
      blockName: String(block.blockName ?? ''),
    }))
    .filter((block: CreateBlockOption) =>
      Number.isFinite(block.blockId)
      && block.blockId > 0
      && Number.isFinite(block.blockOrderNumber)
      && block.blockName.length > 0
    );
};

const SCANNER_TEST_INPUT_VALUE = 'abc';
type PreScanStatus = {
  // 'waiting' = browser opening / page loading & settling; 'running' = actual scan.
  status: 'idle' | 'waiting' | 'running' | 'done' | 'empty' | 'failed';
  message: string;
  elementCount: number;
};

const PRE_SCAN_FOCUS_PROFILES = [
  { value: 'factory-default', label: 'All page scanner controls', searchText: '' },
  { value: 'all-interactive', label: 'All interactive controls', searchText: 'button, a, select, option, input, textarea, role, aria-haspopup, data-testid' },
  { value: 'select-options', label: 'Select options', searchText: 'select, option, combobox, listbox' },
  { value: 'inputs', label: 'Inputs and textareas', searchText: 'input, textarea, textbox, contenteditable' },
  { value: 'clickables', label: 'Buttons and clickables', searchText: 'button, link, menuitem, tab, treeitem, svg' },
  { value: 'outputs', label: 'Labels and outputs', searchText: 'label, span, p, div, h1, h2, h3, output' },
  { value: 'data-ids', label: 'Data/test id attributes', searchText: 'data-testid, data-test, data-cy, data-qa, id, name' },
];

const GridItemScann: React.FC<GridItemScannProps> = ({ homeBankingIdInitial, botJobIdInitial, botJobNameInitial, dataDTO, socketPort, sessionId, mode = 'scanner' }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);

  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(dataDTO);
  const [elementGrouped, setElementGrouped] = useState<Record<string, { tagName: string; elements: ElementDTO[] }>>({});
  const [isElementGrouped, setIsElementGrouped] = useState<boolean>(false);

  const [errorFlag, setErrorFlag] = useState<boolean>(false)
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  // const [showAttributes, setShowAttributes] = useState(false);
  const [findText, setFindText] = useState<string>('');
  const [dashboardSearchText, setDashboardSearchText] = useState<string>(PRE_SCAN_FOCUS_PROFILES[0].searchText);
  const [dashboardFocus, setDashboardFocus] = useState<string>(PRE_SCAN_FOCUS_PROFILES[0].value);
  const [dashboardSearchHidden, setDashboardSearchHidden] = useState<boolean>(false);
  const [preScanStatus, setPreScanStatus] = useState<PreScanStatus>({
    status: 'idle',
    message: 'Ready',
    elementCount: 0,
  });
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const isPreScanMode = mode === 'preScan' || sessionId.includes(PRE_SCANNER_GRID_SESSION_ID);
  const botJobHeader = useBotJobDetailsController({
    webSocket, connected, messages, sessionId, homeBankingId, botJobId, enabled: isPreScanMode,
  });
  const scannerController = useScannerController({
    webSocket, connected, messages, sessionId, homeBankingId, botJobId, enabled: !isPreScanMode,
  });

  useEffect(() => {
    if (!botJobHeader.state) return;
    setBotJobId(botJobHeader.state.botJobId);
    setBotJobName(botJobHeader.state.name);
    setHomeBankingId(botJobHeader.state.homeBankingId);
  }, [botJobHeader.state]);

  useEffect(() => {
    if (!scannerController.state) return;
    setBotJobId(scannerController.state.botJobId);
    setBotJobName(scannerController.state.botJobName);
    setHomeBankingId(scannerController.state.homeBankingId);
  }, [scannerController.state]);

  // Per-block display mode (preScan dashboard): 'name' = normal display chain,
  // 'id' = raw DOM id (locator planning), 'testid' = testing attribute
  // (data-testid & friends) so test-automation-friendly elements are visible.
  const [blockViewModes, setBlockViewModes] = useState<Record<string, 'name' | 'id' | 'testid'>>({});

  const toggleBlockViewMode = (blockKey: string, nextMode: 'id' | 'testid') => {
    setBlockViewModes((prev) => ({
      ...prev,
      [blockKey]: prev[blockKey] === nextMode ? 'name' : nextMode,
    }));
  };

  // 'onetrust-accept-btn-handler' -> 'onetrust accept btn handler' (tooltip helper).
  const humanizeId = (raw: string): string =>
    raw
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();

  // First testing attribute the scanner captured for this element, if any.
  const testAttributeOf = (el: ElementDTO): { name: string; value: string } | null => {
    const attrs = (el as any).attributeData as Array<{ name: string; value: string }> | undefined;
    if (!Array.isArray(attrs)) return null;
    const wanted = ['data-testid', 'data-test-id', 'test-id', 'data-cy', 'data-qa'];
    for (const attrName of wanted) {
      const hit = attrs.find((a) => a && a.name === attrName && a.value && a.value.length > 0);
      if (hit) return { name: hit.name, value: hit.value };
    }
    return null;
  };

  const toggleBlockCollapsed = (key: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const CollapseToggleIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      {collapsed && <path d="M12 5v14" />}
    </svg>
  );

  // const totalPages = Math.max(1, Math.ceil(Object.entries(elementGrouped).length / rowsPerPage));
  // const paginatedData = Object.entries(elementGrouped).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const [blockPages, setBlockPages] = useState<Record<string, number>>({});
  const [blockCurrentPages, setBlockCurrentPages] = useState<Record<string, number>>({});
  const [blockRowsPerPage, setBlockRowsPerPage] = useState<number>(10);
  const elementDTORef = useRef<HTMLInputElement>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementTagName, setEditingElementTagName] = useState<string | null>(null);
  const [elementName, setElementName] = useState<string>('');
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Keep-selection state for the "Delete Unchecked" workflow. Each entry is the
  // id of an element the user marked "Keep" via the per-row checkbox. Clicking
  // "Delete Unchecked" prunes every element NOT in this set. State is purely
  // local — no WebSocket push; the backend sees the remaining elements on the
  // next Insert All / Save.
  const [keepSelectedIds, setKeepSelectedIds] = useState<Set<number>>(new Set());
  const [pendingDeleteCount, setPendingDeleteCount] = useState<number | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const lastProcessedIndexRef = useRef(0);

  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);
  const [domReviewData, setDomReviewData] = useState<DomReviewData | null>(null);
  const [supportReqData, setSupportReqData] = useState<SupportRequestData | null>(null);
  const [elementsSupportReqData, setElementsSupportReqData] = useState<SupportRequestData | null>(null);
  const clickedSupportElementRef = useRef<ElementDTO | null>(null);
  const [memoryElements, setMemoryElements] = useState<ElementDTO[]>([]);
  const [memoryPanelOpen, setMemoryPanelOpen] = useState<boolean>(false);
  const [memoryPanelPos, setMemoryPanelPos] = useState<{ x: number; y: number }>({ x: 80, y: 120 });
  const [memoryTargetBlockId, setMemoryTargetBlockId] = useState<number | null>(null);
  const [memoryBlockOptions, setMemoryBlockOptions] = useState<CreateBlockOption[]>([]);
  const [createBlockOpen, setCreateBlockOpen] = useState<boolean>(false);

  const memoryElementKey = (element: ElementDTO) =>
    `${element.xPath || ''}||${element.tagName || ''}||${element.typeElement || ''}||${element.attributeType || ''}||${element.someText || ''}`;

  const handleAddElementToMemory = (element: ElementDTO) => {
    const key = memoryElementKey(element);
    setMemoryElements((prev) =>
      prev.some((item) => memoryElementKey(item) === key) ? prev : [...prev, element]
    );
    setMemoryPanelOpen(true);
  };

  const handleAddElementBlockToMemory = (elements: ElementDTO[]) => {
    setMemoryElements((prev) => {
      const seen = new Set(prev.map(memoryElementKey));
      const next = [...prev];
      elements.forEach((element) => {
        const key = memoryElementKey(element);
        if (!seen.has(key)) {
          seen.add(key);
          next.push(element);
        }
      });
      return next;
    });
    setMemoryPanelOpen(true);
  };

  const handleRemoveElementFromMemory = (element: ElementDTO) => {
    const key = memoryElementKey(element);
    setMemoryElements((prev) => prev.filter((item) => memoryElementKey(item) !== key));
  };

  const startMemoryPanelDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = memoryPanelPos.x;
    const startTop = memoryPanelPos.y;
    const onMove = (moveEvent: MouseEvent) => {
      setMemoryPanelPos({
        x: Math.max(0, startLeft + moveEvent.clientX - startX),
        y: Math.max(0, startTop + moveEvent.clientY - startY),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── OCR review panel (preScan): per-block floating OCRPanel where the client agrees
  // with the OCR-resolved name or keeps the scanned DOM text, per element. The
  // backend stashes the pre-OCR text in attributeData['scanned-text'] whenever the
  // resolver changed it; rows without it are shown as "same".
  const [ocrReviewBlock, setOcrReviewBlock] = useState<string | null>(null);
  const [ocrConfig, setOcrConfig] = useState<OCRConfigData | null>(null);
  const [ocrConfigBusy, setOcrConfigBusy] = useState(false);
  const [ocrConfigError, setOcrConfigError] = useState('');
  const [ocrTestResult, setOcrTestResult] = useState<OCRTestResult | null>(null);

  const scannedTextOf = (el: ElementDTO): string | null => {
    const attrs = (el as any).attributeData as Array<{ name: string; value: string }> | undefined;
    if (!Array.isArray(attrs)) return null;
    const hit = attrs.find((a) => a && a.name === 'scanned-text' && a.value && a.value.length > 0);
    return hit ? hit.value : null;
  };

  // FE approximation of the backend TextSimilarity.slug used for definedName.
  const slugifyName = (text: string): string =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

  // Agree (useScanned=false): keep the OCR-resolved name. Defer (useScanned=true):
  // restore the scanned DOM text as someText + definedName. Either way the
  // scanned-text marker is consumed so the row reads as settled.
  const applyOcrDecision = (target: ElementDTO, useScanned: boolean) => {
    const scanned = scannedTextOf(target);
    const updateEl = (el: ElementDTO): ElementDTO => {
      if (el.id !== target.id || el.xPath !== target.xPath) return el;
      const attrs = (((el as any).attributeData || []) as Array<{ name: string; value: string }>)
        .filter((a) => a && a.name !== 'scanned-text');
      const next: any = { ...el, attributeData: attrs };
      if (useScanned && scanned) {
        next.someText = scanned;
        next.definedName = slugifyName(scanned);
      }
      return next as ElementDTO;
    };
    setElementDTO((prev) => prev.map(updateEl));
    setElementGrouped((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = { ...updated[key], elements: updated[key].elements.map(updateEl) };
      }
      return updated;
    });
  };
  const acceptOcrSuggestions = (suggestions:Array<{xPath:string;clientNamed:string}>) => {
    const values = new Map(suggestions.map(item=>[item.xPath,item.clientNamed]));
    const apply = (element:ElementDTO):ElementDTO => values.has(element.xPath) ? {...element,clientNamed:values.get(element.xPath)} as ElementDTO : element;
    setElementDTO(previous=>previous.map(apply));
    setElementGrouped(previous=>Object.fromEntries(Object.entries(previous).map(([key,group])=>[key,{...group,elements:group.elements.map(apply)}])));
    setOcrTestResult(null);
  };

  const handleApplyMemory = () => {
    if (memoryTargetBlockId === null || memoryElements.length === 0) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected. Cannot apply scanner memory list.');
      return;
    }

    const targetBlock = memoryBlockOptions.find((block) => block.blockId === memoryTargetBlockId);
    if (!targetBlock) return;

    const message = {
      type: 'SEND_ALL_ELEMENTS_DTO',
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
      blockId: targetBlock.blockId,
      blockName: targetBlock.blockName,
      blockOrderNumber: targetBlock.blockOrderNumber,
      elementDetails: memoryElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('Sent scanner memory apply:', message);
      setMemoryElements([]);
    } catch (error) {
      console.error('Error sending scanner memory apply:', error);
    }
  };

  const handleCreateNewBlock = (newBlockName: string, position: CreateBlockPosition) => {
    const message = {
      type: 'BLOCK_CREATE',
      botJobId,
      botJobName,
      homeBankingId,
      sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
      blockName: newBlockName,
      insertPosition: position.type === 'end' ? 'END' : 'BEFORE',
      beforeBlockId: position.type === 'before' ? position.blockId : -1,
      beforeBlockOrderNumber: position.type === 'before' ? position.blockOrderNumber : -1,
    };

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.log('Cannot send BLOCK_CREATE: WebSocket is not connected', message);
      return;
    }

    try {
      webSocket.send(JSON.stringify(message));
      console.log('Sent BLOCK_CREATE from scanner memory:', message);
      setCreateBlockOpen(false);
    } catch (err) {
      console.log('Error sending BLOCK_CREATE from scanner memory:', err);
    }
  };

  const handleNextBlockPage = (typeElement: string) => {
    setBlockCurrentPages((prev) => ({
      ...prev,
      [typeElement]: Math.min((prev[typeElement] || 1) + 1, blockPages[typeElement] || 1),
    }));
  };

  const handlePrevBlockPage = (typeElement: string) => {
    setBlockCurrentPages((prev) => ({
      ...prev,
      [typeElement]: Math.max((prev[typeElement] || 1) - 1, 1),
    }));
  };

  useEffect(() => {
    if (!isSendingAll) return;
    const t = setTimeout(() => {
      setIsSendingAll(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isSendingAll]);

  useEffect(() => {
    if (!isUpdatingAll) return;
    const t = setTimeout(() => {
      setIsUpdatingAll(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isUpdatingAll]);

  useEffect(() => {
    const newBlockPages: Record<string, number> = {};
    Object.entries(elementGrouped).forEach(([typeElement, elementData]) => {
      newBlockPages[typeElement] = Math.max(1, Math.ceil(elementData.elements.length / blockRowsPerPage));
    });
    setBlockPages(newBlockPages);

    // Preserve the page the user was viewing in each block. Previously this
    // effect unconditionally reset every block to page 1 on EVERY elementGrouped
    // change — so toggling a force_coords badge, renaming a row, or deleting
    // one snapped all blocks back to page 1. Now:
    //   - existing blocks keep their current page (clamped to the new max in
    //     case the element count shrank and the page no longer exists),
    //   - newly-appeared blocks start at page 1,
    //   - blocks that disappeared are dropped.
    setBlockCurrentPages(prev => {
      const next: Record<string, number> = {};
      for (const key of Object.keys(elementGrouped)) {
        const maxPage = newBlockPages[key] || 1;
        const prevPage = prev[key];
        next[key] = prevPage == null ? 1 : Math.min(Math.max(prevPage, 1), maxPage);
      }
      return next;
    });
  }, [elementGrouped, blockRowsPerPage]);

  useEffect(() => {
    console.log("Updated elementGrouped:", elementGrouped);
  }, [elementGrouped]);


  useEffect(() => {
    if (messages.length === 0) return;

    const tryParse = (val: any) => {
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    // Accept messages for this component from multiple sessions your backend may use.
    const acceptedSessions = new Set([
      sessionId, // the one passed as prop
      SCANNER_GRID_SESSION_ID,
      PRE_SCANNER_GRID_SESSION_ID,
      SCANNER_TOOL_SESSION_ID,
      SCANNER_ELEMENT_PANE_SESSION_ID,
    ]);

    // ✅ process only NEW messages since last effect run
    for (let i = lastProcessedIndexRef.current; i < messages.length; i++) {
      const msg = messages[i];
      console.log("RECEIVED -> WebSocket message", msg);

      try {
        const parsedMessage = JSON.parse(msg);

        if (typeof parsedMessage.homeBankingId === "number") {
          setHomeBankingId(parsedMessage.homeBankingId);
        }

        if (!acceptedSessions.has(parsedMessage.sessionId)) continue;

        const bodyData = tryParse(parsedMessage.body);

        switch (parsedMessage.operationId) {
          case "preScanStatus": {
            const status = String(bodyData?.status ?? 'idle') as PreScanStatus['status'];
            setPreScanStatus({
              status: ['idle', 'waiting', 'running', 'done', 'empty', 'failed'].includes(status) ? status : 'idle',
              message: String(bodyData?.message ?? ''),
              elementCount: Number(bodyData?.elementCount ?? 0),
            });
            break;
          }

          case SCANNER_SEARCH_TERMS_OPERATION: {
            setIsSendingAll(false);
            setIsUpdatingAll(false);

           const detailsData = Array.isArray(bodyData?.elementDetails)
            ? bodyData.elementDetails
            : Array.isArray(bodyData?.details)
              ? bodyData.details
              : [];


            if (detailsData.length === 0) {
              // Clear (explicit empty payload from Java - e.g. Clean List button)
              setElementDTO([]);
              setElementGrouped({});
              setBotJobId(bodyData?.botJobId);
              setBotJobName(bodyData?.botJobName);
            } else {
              // Accumulate chunks — each scan arrives as N messages of ~25 elements.
              // Dedup by (xPath + tagName); Clean List button empties the grid.
              setElementDTO((prev) => {
                const seen = new Set(
                  prev.map((el: any) => `${el.xPath}||${el.tagName}`)
                );
                const merged = [...prev];
                let nextId = prev.reduce(
                  (max: number, el: any) => Math.max(max, el.id || 0),
                  0
                );
                for (const el of detailsData) {
                  const key = `${el.xPath}||${el.tagName}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    merged.push({ ...el, id: ++nextId });
                  }
                }
                return merged;
              });
              if (typeof bodyData?.botJobId !== "undefined") setBotJobId(bodyData?.botJobId);
              if (typeof bodyData?.botJobName !== "undefined") setBotJobName(bodyData?.botJobName);
            }

            setMemoryBlockOptions((prev) => normalizeBlockOptions([
              ...prev,
              ...blockOptionsFromPayload(bodyData),
            ]));
            setIsElementGrouped(false);
            break;
          }

          case "clonedElement":
          case "addPickOne": {
            setIsSendingAll(false);
            setIsUpdatingAll(false);

            const newElements = bodyData?.elementDetails;
            setBotJobId(bodyData?.botJobId);
            setBotJobName(bodyData?.botJobName);

            if (newElements && Array.isArray(newElements) && newElements.length > 0) {
              setElementDTO((prevElements) => {
                let updatedElements = [...prevElements];

                const maxId = prevElements.reduce((max, el) => Math.max(max, el.id || 0), 0);
                let nextId = maxId + 1;

                newElements.forEach((newElement: any) => {
                  const isDup = updatedElements.some(
                    (el) => el.xPath === newElement.xPath && el.tagName === newElement.tagName
                  );
                  if (!isDup) {
                    const elementToAdd = { ...newElement, id: nextId++ };

                    let insertIndex = -1;
                    if (prevElements.length > 0 && bodyData?.afterXPath) {
                      insertIndex = prevElements.findIndex(
                        (el) => el.xPath === bodyData.afterXPath
                      );
                    }

                    if (insertIndex !== -1) {
                      updatedElements.splice(insertIndex + 1, 0, elementToAdd);
                    } else {
                      updatedElements.push(elementToAdd);
                    }
                  }
                });

                return updatedElements;
              });
            }

            setIsElementGrouped(false);
            break;
          }

          case "activate-insert-all": {
            setIsSendingAll(false);
            break;
          }

          // Roadmap 2 follow-on: AROcrTestResultsPane "Accept OCR Name" button delivers a list of
          // {xPath, clientNamed} pairs derived from approved EXACT_CONTAIN rows. Apply each suggestion
          // to the matching ElementDTO so the picker shows the OCR-derived label and the next big save
          // (NEW_ELEMENT_DTO) carries it as instruction.client_named on the backend INSERT.
          case "applyOcrSuggestions": {
            const suggestions: Array<{ xPath: string; clientNamed: string }> = Array.isArray(bodyData?.suggestions)
              ? bodyData.suggestions
              : [];
            if (suggestions.length === 0) break;
            const byXPath = new Map<string, string>();
            for (const s of suggestions) {
              if (s && typeof s.xPath === 'string' && typeof s.clientNamed === 'string') {
                byXPath.set(s.xPath, s.clientNamed);
              }
            }
            setElementDTO((prev) =>
              prev.map((el) => {
                const proposed = byXPath.get(el.xPath);
                return proposed && proposed.length > 0 ? { ...el, clientNamed: proposed } : el;
              })
            );
            // Trigger a re-grouping so the row labels refresh from the new clientNamed values.
            setIsElementGrouped(false);
            console.log(`[applyOcrSuggestions] applied ${byXPath.size} OCR-derived clientNamed value(s).`);
            break;
          }

          case "ocrConfig.bootstrapResponse":
          case "ocrConfig.profileResponse": {
            setOcrConfigBusy(false);
            if (!bodyData?.ok) { setOcrConfigError(String(bodyData?.error || 'OCR configuration could not be loaded.')); break; }
            setOcrConfig(previous => ({
              profiles: bodyData.profiles || previous?.profiles || [],
              activeProfileId: bodyData.profile?.id ?? bodyData.activeProfileId ?? previous?.activeProfileId,
              categories: bodyData.categories || previous?.categories || [],
              parameters: bodyData.parameters || [],
            }));
            setOcrConfigError('');
            break;
          }
          case "ocrConfig.saveResponse":
          case "ocrConfig.deleteResponse": {
            setOcrConfigBusy(false);
            if (!bodyData?.ok) { setOcrConfigError(String(bodyData?.error || 'OCR profile operation failed.')); break; }
            sendOcrConfigCommand('ocrConfig.bootstrap', { homeBankingId });
            break;
          }
          case "ocrConfig.cleanupPreviewResponse": {
            setOcrConfigBusy(false);
            if (!bodyData?.ok) { setOcrConfigError(String(bodyData?.error || 'Cleanup preview failed.')); break; }
            const candidates = Array.isArray(bodyData.candidates) ? bodyData.candidates : [];
            if (!candidates.length) { setOcrConfigError('No orphan locators found.'); break; }
            const details = candidates.slice(0,10).map((item:any)=>`${item.definedName}: ${item.reason}`).join('\n');
            if (window.confirm(`Delete ${candidates.length} orphan locator(s)?\n\n${details}${candidates.length>10?'\n...':''}`)) {
              sendOcrConfigCommand('ocrConfig.cleanupApply',{homeBankingId,confirmed:true});
            }
            break;
          }
          case "ocrConfig.cleanupApplyResponse": {
            setOcrConfigBusy(false);
            setOcrConfigError(bodyData?.ok ? `Cleanup complete: ${Number(bodyData.deleted||0)} locator(s) deleted.` : String(bodyData?.error || 'Cleanup failed.'));
            break;
          }
          case "ocrTest.runResponse": {
            setOcrConfigBusy(false);
            if (!bodyData?.ok) { setOcrConfigError(String(bodyData?.error || 'OCR test failed.')); break; }
            setOcrTestResult(bodyData as OCRTestResult);
            break;
          }
          case "openOcrConfig": {
            openOcrConfig({
              homeBankingId: Number(bodyData?.homeBankingId || homeBankingId),
              homeUrlId: Number(bodyData?.homeUrlId || 0) || undefined,
            });
            break;
          }

          case "activate-update-all": {
            setIsUpdatingAll(false);
            break;
          }

          case "blocksUpdate": {
            setMemoryBlockOptions((prev) => normalizeBlockOptions([
              ...prev,
              ...blockOptionsFromPayload(bodyData),
            ]));
            const createdBlockId = Number(bodyData?.blockId ?? bodyData?.createdBlockId);
            if (Number.isFinite(createdBlockId) && createdBlockId > 0) {
              setMemoryTargetBlockId(createdBlockId);
              setCreateBlockOpen(false);
            }
            break;
          }

          case "SEND_DOM_REVIEW": {
            const reviewData: DomReviewData = {
              url: bodyData?.url || '',
              title: bodyData?.title || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
              htmlSizeKb: bodyData?.htmlSizeKb || 0,
            };
            setDomReviewData(reviewData);
            break;
          }

          case "REQUEST_SUPPORT": {
            const reqData: SupportRequestData = {
              url: bodyData?.url || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
            };
            setSupportReqData(reqData);
            break;
          }

          case "REQUEST_SUPPORT_ELEMENTS": {
            const reqData: SupportRequestData = {
              url: bodyData?.url || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
            };
            setElementsSupportReqData(reqData);
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }

    // ✅ mark all messages as processed
    lastProcessedIndexRef.current = messages.length;
  }, [messages, sessionId]);

  useEffect(() => {
    //console.log("UseEffect -> editingInstructionId");
    if (editingElementId && elementDTORef.current) {
      elementDTORef.current.focus();
    }
  }, [editingElementId]);

  // Roadmap 3 Phase 3d safety net: when entering edit mode, re-seed elementName
  // from the EXACT row in elementDTO state (clientNamed > definedName > someText > tagName).
  // The setState chain in handleEditInstruction normally seeds it correctly, but if the
  // input ever appears empty, this effect keeps the controlled value in sync with the
  // actual data and selects the text so the user can type to overwrite or cursor-edit.
  useEffect(() => {
    if (!editingElementId || !editingElementTagName) return;
    const row = elementDTO.find(
      (el) => el.xPath === editingElementId && el.tagName === editingElementTagName
    );
    if (!row) return;
    const cn = (row as any).clientNamed;
    const dn = (row as any).definedName;
    const st = row.someText;
    const seed = (cn && cn.length > 0) ? cn
               : (dn && dn.length > 0) ? dn
               : (st && st.trim().length > 0) ? st
               : (row.tagName ?? "");
    setElementName(seed);
    console.log("[GridItemScann edit-mode seed] row:", row, " seed:", seed);
    // Select the seeded text so the user can either type to replace or arrow to edit.
    requestAnimationFrame(() => {
      if (elementDTORef.current) elementDTORef.current.select();
    });
  }, [editingElementId, editingElementTagName, elementDTO]);

  useEffect(() => {
    if (!isElementGrouped && elementDTO && elementDTO.length > 0) {
      setElementGrouped(groupByTagName(elementDTO));
      setIsElementGrouped(true);
    }
  }, [elementDTO, isElementGrouped]);


  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
  };

  const handlesSendAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSendingAll(true); // 🔒 Disable the button after first click

    // Flatten the elementGrouped object to get all ElementDTOs
    const allElements = Object.values(elementGrouped).flatMap(group => group.elements);

    const message = {
      type: "SEND_ALL_ELEMENTS_DTO",
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
      elementDetails: allElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent CREATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsSendingAll(false); // re-enable if send fails
    }
  };

  const handlesUpdateAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsUpdatingAll(true); // 🔒 Disable the button after first click

    // Flatten the elementGrouped object to get all ElementDTOs
    const allElements = Object.values(elementGrouped).flatMap(group => group.elements);

    const message = {
      type: "UPDATE_ALL_ELEMENTS_DTO",
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
      elementDetails: allElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent UPDATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsUpdatingAll(false); // re-enable if send fails
    }
  };

  const handleRowSelectedClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    elementDTO: ElementDTO,
    action: string
  ) => {
    event.stopPropagation();

    sendWebSocketMessage(elementDTO, action);

  };

  const sendWebSocketMessage = (elementDTO: ElementDTO, action: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }
    // const sessionDestine = action === "HOVERED_ROW"
    //   ? `scannerTool-${homeBankingId}`
    //   : `scanner-element-pane-${homeBankingId}`;

    const sessionDestine = action === "HOVERED_ROW"
      ? SCANNER_TOOL_SESSION_ID
      : SCANNER_ELEMENT_PANE_SESSION_ID;

    const message: Record<string, unknown> = {
      type: action,
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: sessionDestine,
      elementDetails: [elementDTO],
    };

    // Pre-scan single-row save: there is no legacy pane to prompt for a block, so the
    // save must carry the Memory List's selected target block. Without one the backend
    // apply (correctly) rejects the insert — surface that here instead.
    if (action === 'NEW_ELEMENT_DTO' && isPreScanMode) {
      const targetBlock = memoryBlockOptions.find((block) => block.blockId === memoryTargetBlockId);
      if (!targetBlock) {
        setAlertMessageHeader('Select a target block first');
        setAlertMessageBody(
          'Open the Memory List and choose the block that should receive this element, then save again.'
        );
        return;
      }
      message.blockId = targetBlock.blockId;
      message.blockName = targetBlock.blockName;
      message.blockOrderNumber = targetBlock.blockOrderNumber;
    }

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent element DTO:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
    }
  };

  const isInputTextBlock = (typeElement: string) =>
    ["input", "textarea"].includes(typeElement.toLowerCase());

  const withScannerTestInputValue = (elementDTO: ElementDTO): ElementDTO => ({
    ...elementDTO,
    defaultValue: SCANNER_TEST_INPUT_VALUE,
  });

  const handleBlockTestInputClick = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>,
    elements: ElementDTO[]
  ) => {
    event.stopPropagation();
    elements.forEach((element) => {
      sendWebSocketMessage(withScannerTestInputValue(element), "TEST_INPUT_DTO");
    });
  };

  // ── Keep-selection handlers (used by the per-row checkbox + header buttons) ──
  const toggleKeep = (id: number) => {
    setKeepSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const keepAll = () => {
    setKeepSelectedIds(new Set(elementDTO.map(el => el.id)));
  };

  const clearKeeps = () => {
    setKeepSelectedIds(new Set());
  };

  /** How many currently-visible elements are NOT marked Keep and would be removed. */
  const uncheckedCount = (): number => {
    let n = 0;
    for (const el of elementDTO) if (!keepSelectedIds.has(el.id)) n++;
    return n;
  };

  /** Opens the confirmation. Commit happens in {@link confirmDeleteUnchecked}. */
  const requestDeleteUnchecked = () => {
    const toDelete = uncheckedCount();
    if (toDelete === 0) return;
    setPendingDeleteCount(toDelete);
  };

  const confirmDeleteUnchecked = () => {
    const keep = keepSelectedIds;
    setElementDTO(prev => prev.filter(el => keep.has(el.id)));
    setElementGrouped(prevGrouped => {
      const updated = { ...prevGrouped };
      for (const tagName of Object.keys(updated)) {
        const filteredElements = updated[tagName].elements.filter(el => keep.has(el.id));
        if (filteredElements.length === 0) {
          delete updated[tagName];
        } else {
          updated[tagName] = { ...updated[tagName], elements: filteredElements };
        }
      }
      return updated;
    });
    setPendingDeleteCount(null);
  };

  const cancelDeleteUnchecked = () => {
    setPendingDeleteCount(null);
  };

  const handleClearGridAll = () => {
    setElementDTO([]);
    setElementGrouped({});
    setKeepSelectedIds(new Set());
    setIsElementGrouped(false);
  };

  useEffect(() => {
    if (scannerController.completedAction === 'CLEAR_GRID') {
      handleClearGridAll();
    }
  }, [scannerController.completedAction]);

  const sendDashboardCommand = (type: string, extra: Record<string, unknown> = {}) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected. Cannot send dashboard command.");
      return;
    }

    const message = {
      type,
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: PRE_SCANNER_GRID_SESSION_ID,
      focusProfile: dashboardFocus,
      searchTerms: dashboardSearchText,
      searchHiddenFields: dashboardSearchHidden,
      ...extra,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("Sent pre-scan dashboard command:", message);
    } catch (error) {
      console.error("Error sending pre-scan dashboard command:", error);
    }
  };

  const sendOcrConfigCommand = (type:string, body:Record<string,unknown>) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) { setOcrConfigError('WebSocket is not connected.'); return; }
    setOcrConfigBusy(true);
    webSocket.send(JSON.stringify({type,sessionId,homeBankingId,body:JSON.stringify(body)}));
  };
  const openOcrConfig = (scope:Record<string,unknown>={homeBankingId}) => { setOcrConfigError(''); setOcrConfig({profiles:[],categories:[],parameters:[]}); sendOcrConfigCommand('ocrConfig.bootstrap',scope); };
  const saveOcrConfig = (draft:{profileId?:number;name:string;description:string;parameters:OCRParameter[];asNew:boolean}) => sendOcrConfigCommand('ocrConfig.save',{...draft,homeBankingId});
  const deleteOcrConfig = (profileId:number) => { if(window.confirm('Delete this OCR profile?')) sendOcrConfigCommand('ocrConfig.delete',{profileId,confirmed:true}); };

  const handleDashboardFocusChange = (value: string) => {
    setDashboardFocus(value);
    const profile = PRE_SCAN_FOCUS_PROFILES.find((item) => item.value === value);
    if (profile) {
      setDashboardSearchText(profile.searchText);
    }
  };

  const handleDashboardClearGrid = () => {
    handleClearGridAll();
    sendDashboardCommand('PRE_SCAN_CLEAR_GRID');
  };

  const handleRemoveElementDTO = (elementToRemove: ElementDTO) => {
    console.log("Removing elementDTO:", elementToRemove);

    // Update elementDTO state
    setElementDTO((prevElements) =>
      prevElements.filter((element) => element !== elementToRemove)
    );

    // Update elementGrouped state
    setElementGrouped((prevGrouped) => {
      const updatedGrouped = { ...prevGrouped };

      for (const tagName in updatedGrouped) {
        updatedGrouped[tagName].elements = updatedGrouped[tagName].elements.filter(
          (element) => element !== elementToRemove
        );

        // If the group is empty after removal, you might want to remove the group
        if (updatedGrouped[tagName].elements.length === 0) {
          delete updatedGrouped[tagName];
        }
      }

      return updatedGrouped;
    });
  };


  const handleRemoveRowsBlock = (blockTagName: string) => {
    console.log("Removing block:", blockTagName);

    // Groups are keyed by the decided category, so removal must match the same
    // bucket, not the raw tagName.
    setElementDTO((prevElements) =>
      prevElements.filter((element) => groupTagFor(element) !== blockTagName)
    );

    setElementGrouped((prevGrouped) => {
      const updatedGrouped = { ...prevGrouped };
      delete updatedGrouped[blockTagName]; // Remove the entire group
      return updatedGrouped;
    });
  };

  const getElementBlockText = (typeElement: string): string => {
    const lowerTag = typeElement ? typeElement.toLowerCase() : "";

    if (["input", "textarea"].includes(lowerTag)) {
      return "Input Text";
    }
    if (lowerTag === "button") {
      return "Button";
    }
    if (lowerTag === "a" || lowerTag === "link") {
      return "Link";
    }
    if (lowerTag === "label") {
      return "Output";
    }

    // Never mint a new group label from an unknown tag (was: "Select Text" for
    // <select>). Groups are canonical buckets; anything else reads as Output.
    return "Output";
  };



  const getInstructionElement = (
    instruction: ElementDTO,
    viewMode: 'name' | 'id' | 'testid' = 'name'
  ): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let imageClass : string = styles.operations; // Default class for images

    // Icon follows the decided category (same bucket as the group), so e.g. a
    // <select> classified clickable shows the click icon, not the output one.
    const tag = groupTagFor(instruction);

    if (tag === "input") {
      imageSrc = inputImage;
      imageClass = styles.inputImage;
    } else if (tag === "button") {
      imageSrc = clickImage;
      imageClass = styles.clickImage;
    } else if (tag === "a" || tag === "link") {
      imageSrc = linkImage;
      imageClass = styles.linkImage;
    } else {
      imageSrc = outPutImage;
      imageClass = styles.outputImage;
    }

    // Roadmap 3 Phase 3d display chain:
    //   clientNamed (user override) > definedName (resolver slug) > someText (visible label) > tagName
    // someText + definedName come from the JS-injection ElementDTO and must stay frozen.
    const overrideName =
      ((instruction as any).clientNamed && (instruction as any).clientNamed.length > 0)
        ? (instruction as any).clientNamed
        : ((instruction as any).definedName && (instruction as any).definedName.length > 0)
          ? (instruction as any).definedName
          : null;
    text = overrideName
      ? overrideName
      : (instruction.someText?.trim() ? instruction.someText : instruction.tagName);

    // If someText exists and contains commas or semicolons, split it into an array and format it correctly
    const dataNames = instruction.someText
      ?.split(/[;,]/) // Split by both "," and ";"
      .map(item => item.trim()) // Trim whitespace
      .filter(Boolean) // Remove empty values
      .map(item => {
        // Ensure the name is no longer than 150 characters
        const name = item.length > 150 ? item.substring(0, 150) : item;
        return { name, value: name };
      }); // Convert to { name, value }

    // When clientNamed/definedName is set, surface that as the single display value rather than
    // falling back to the someText comma-split list.
    const displayText = overrideName
      ? overrideName
      : (dataNames?.length === 1 ? dataNames[0].name : text);

    // Block header "id" / "id-test" view modes (preScan dashboard): swap the label for
    // the raw DOM id (locator planning) or the testing attribute. Dimmed dash marks
    // elements without one — the client instantly sees what is automatable by id/test-id.
    if (viewMode === 'id' || viewMode === 'testid') {
      let value: string | null = null;
      let tooltip = '';
      let isGenerated = false;
      if (viewMode === 'id') {
        value = instruction.attribId && instruction.attribId.length > 0 ? instruction.attribId : null;
        if (value) {
          tooltip = `${humanizeId(value)}\n${displayText}`;
        } else {
          // No DOM id: fall back to the scanner's deterministic generated-id
          // (strongest attributes: name > aria-label > href segment > text > type).
          const attrs = (instruction as any).attributeData as Array<{ name: string; value: string }> | undefined;
          const generated = Array.isArray(attrs)
            ? attrs.find((a) => a && a.name === 'generated-id' && a.value && a.value.length > 0)
            : undefined;
          if (generated) {
            value = generated.value;
            isGenerated = true;
            tooltip = `generated id (element has no DOM id)\n${displayText}`;
          }
        }
      } else {
        const testAttr = testAttributeOf(instruction);
        value = testAttr ? testAttr.value : null;
        if (value && testAttr) tooltip = `${testAttr.name}\n${displayText}`;
      }
      return (
        <div className={styles.instructionType}>
          {imageSrc && <img src={imageSrc} alt="" className={imageClass} />}
          {value ? (
            <span className={isGenerated ? styles.idGeneratedText : styles.idValueText} title={tooltip}>
              {value}
            </span>
          ) : (
            <span className={styles.dimmedDash} title={String(displayText ?? '')}>—</span>
          )}
        </div>
      );
    }

    return (
      <div className={styles.instructionType}>
        {imageSrc && <img src={imageSrc} alt="" className={imageClass} />}

        {/* Roadmap 3 Phase 3d: when the user has set a display label (clientNamed) or the
            resolver produced a definedName, ALWAYS surface that as a single span — the
            comma-split NameDropdown only kicks in for raw multi-token someText with no
            override. Without this gate, picking a value from the dropdown would visually
            replace the user's chosen label every render. */}
        {(!overrideName && dataNames?.length > 1) ? (
          <div className="attribute-name">
            <NameDropdown dataArray={dataNames} onChange={handleNameChange} />
          </div>
        ) : (
          <span>{displayText}</span>
        )}
      </div>
    );
  };




  const getInstructionTypeElement = (typeElement: string): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let imageClass : string = styles.operations; // Default class for images

    // Set the image source based on the tag name
    if (typeElement === "input" || typeElement === "textarea") {
      imageSrc = inputImage;
      imageClass = styles.inputImage;
    } else if (typeElement === "button") {
      imageSrc = clickImage;
      imageClass = styles.clickImage;
    } else if (typeElement === "a" || typeElement === "link") {
      imageSrc = linkImage;
      imageClass = styles.clickImage;
    } else {
      imageSrc = outPutImage;
      imageClass = styles.outputImage;
    }

    // Set the text based on the instruction properties
    text = getElementBlockText(typeElement);

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return (
      <div className={styles.instructionType}>
        {imageSrc && (
          <>
            <img src={imageSrc} alt="" className={imageClass} />
            <span>{text}</span>
          </>
        )}
        {!imageSrc && <span>{text}</span>}
      </div>
    );
  };




  const handleNameChange = (value: string) => {
    console.log('Selected name:', value);
  };

  const handleAttributeChange = (value: string) => {
    console.log('Selected attribute:', value);
  };


  const handleEditInstruction = (elementEdit: ElementDTO) => {
    setEditingElementId(elementEdit.xPath);
    setEditingElementTagName(elementEdit.tagName);
    // Roadmap 3 Phase 3d: edit field operates on the user's "easy name" (clientNamed).
    // Seed it with the EXACT value the display chain renders so the user always sees
    // their current label and can edit it — clientNamed > definedName > someText > tagName.
    // someText + definedName themselves stay immutable on the ElementDTO; only clientNamed
    // changes when the user types and saves.
    const cn = (elementEdit as any).clientNamed;
    const dn = (elementEdit as any).definedName;
    const st = elementEdit.someText;
    const seed = (cn && cn.length > 0) ? cn
               : (dn && dn.length > 0) ? dn
               : (st && st.trim().length > 0) ? st
               : (elementEdit.tagName ?? "");
    setElementName(seed);
  };
  const handleSaveInstruction = (selectedElement: ElementDTO) => {
    // Find the instruction to get blockId and botJobId
    console.log("handleSaveInstruction", selectedElement);
    const elementToUpdate = elementDTO.find(element => selectedElement.id === element.id);

    if (!elementToUpdate) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Element not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Element with TagName ${selectedElement.tagName} not found`);
      return;
    }

    const { id } = selectedElement;
    // Roadmap 3 Phase 3d: someText and definedName are frozen at JS-injection time
    // and must NEVER be overwritten — they're what the backend writes to instruction.name.
    // The renamed value the user typed lives in clientNamed (the easy display label),
    // which the backend persists into instruction.client_named on save.
    // If the user typed nothing OR typed back exactly what the display chain would have
    // produced from immutable fields (definedName / someText / tagName), clear the
    // override (null) so the row reverts to the canonical name.
    const typed = (elementName ?? "").trim();
    const updatedElements = elementDTO.map((element) => {
      if (element.id !== id) return element;
      const dn = (element as any).definedName as string | null | undefined;
      const st = element.someText ?? "";
      const tn = element.tagName ?? "";
      const noOverride =
        typed.length === 0 || typed === dn || typed === st || typed === tn;
      return { ...element, clientNamed: noOverride ? null : typed };
    });

    setElementDTO(updatedElements);
    setIsElementGrouped(false); // Trigger re-grouping
    setEditingElementId(null); // Exit edit mode
    setEditingElementTagName(null); // Exit edit mode
  };


  const renderEditButton = (elementDTO: ElementDTO, editImage: string,) => {
    return (
      <img
        src={editImage}
        alt="edit"
        className={styles.editButton}
        onClick={() => handleEditInstruction(elementDTO)}  // Trigger edit mode
      />
    );
  };

  // ── force_coordinates flag toggles (F / E / T / N / S) ─────────────────────
  // The UI is in CompForce; this handler just reconciles state. We update BOTH
  // `elementDTO` (source of truth) and `elementGrouped` (what the list renders
  // from) so the badge flips immediately without rebuilding the grouped map.
  // No WebSocket send here — the flags ride out on the NEW_ELEMENT_DTO /
  // UPDATE_* message when the user clicks the save button on a scanned element.
  const handleElementForceChange = (elementId: number, nextForceCoordinates: string) => {
    setElementDTO(prev =>
      prev.map(el => (el.id === elementId ? { ...el, forceCoordinates: nextForceCoordinates } : el))
    );
    setElementGrouped(prevGrouped => {
      const updated = { ...prevGrouped };
      for (const tagName in updated) {
        updated[tagName] = {
          ...updated[tagName],
          elements: updated[tagName].elements.map(el =>
            el.id === elementId ? { ...el, forceCoordinates: nextForceCoordinates } : el
          ),
        };
      }
      return updated;
    });
  };


  const handleRowHover = (elementDTO: ElementDTO) => {
    console.clear(); // Clear previous logs to only show the current hovered row
    console.log('Hovered Row:', elementDTO);

    setHoveredRow(elementDTO);

    // sendWebSocketMessage(elementDTO, "HOVERED_ROW");

    setHoveredRowsList((prevList) => {
      if (!prevList.find((el) => el.id === elementDTO.id)) {
        return [...prevList, elementDTO];
      }
      return prevList;
    });
  };

  const handleRowLeave = () => {
    setHoveredRow(null);
  };


  const handleSupportRequestAction = (action: SupportRequestAction, message: string) => {
    setSupportReqData(null);
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'SUPPORT_REQUEST_RESPONSE',
        sessionId,
        homeBankingId,
        action,
        message,
      }));
    }
  };

  const requestElementsSupport = (clicked: ElementDTO) => {
    clickedSupportElementRef.current = clicked;
    // Ask backend for context (pc/email/url) — reuses the same pattern as REQUEST_SUPPORT.
    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'REQUEST_SUPPORT_ELEMENTS',
        sessionId,
        homeBankingId,
      }));
    } else {
      // Fallback: open modal immediately with blank context.
      setElementsSupportReqData({ url: '', pcName: '', email: '' });
    }
  };

  const handleElementsSupportRequestAction = (action: SupportRequestAction, message: string) => {
    const clicked = clickedSupportElementRef.current;
    setElementsSupportReqData(null);
    clickedSupportElementRef.current = null;
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'SUPPORT_REQUEST_ELEMENTS_RESPONSE',
        sessionId,
        homeBankingId,
        action,
        message,
        // Only the clicked element — backend will pull its live outerHTML.
        elementDetails: clicked ? [clicked] : [],
      }));
    }
  };

  const handleDomReviewAction = (action: DomReviewAction) => {
    setDomReviewData(null);
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'DOM_REVIEW_RESPONSE',
        sessionId,
        homeBankingId,
        action,
      };
      webSocket.send(JSON.stringify(message));
    }
  };

  const matchesFind = (el: ElementDTO, q: string): boolean => {
    if (!q) return true;
    const fields = [
      el.tagName,
      (el as any).nameLabel,
      (el as any).nameField,
      (el as any).clientNamed,
      (el as any).definedName,
      (el as any).someText,
      (el as any).attribId,
      (el as any).attribName,
      el.xPath,
    ];
    return fields.some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
  };

  return (
    <div className={styles.gridContainer}>
      {isPreScanMode ? (
        <BotJobDetailsChrome
          fallbackBotJobId={botJobId}
          fallbackBotJobName={botJobName}
          fallbackSurface="preScan"
          connected={connected}
          controller={botJobHeader}
        />
      ) : (
        <ScannerWorkspaceHeader
          botJobName={botJobName}
          connected={connected}
          reconnectAttempts={reconnectAttempts}
          error={error}
          scannerState={scannerController.state}
          loading={scannerController.loadingState}
          pendingAction={scannerController.pendingAction}
          status={scannerController.status}
          statusTone={scannerController.statusTone}
          onAction={scannerController.sendAction}
          onOpenOcrConfig={() => openOcrConfig()}
        />
      )}
      {isPreScanMode && (
        <div className={styles.preScanDashboard}>
          <div className={`${styles.preScanStatus} ${styles[`preScanStatus_${preScanStatus.status}`]}`}>
            <span className={styles.preScanStatusLabel}>
              {preScanStatus.status === 'running'
                ? 'Scanning'
                : preScanStatus.status === 'waiting'
                  ? 'Waiting'
                  : preScanStatus.status}
            </span>
            <span className={styles.preScanStatusMessage}>{preScanStatus.message}</span>
            {preScanStatus.elementCount > 0 && (
              <span className={styles.preScanStatusCount}>{preScanStatus.elementCount}</span>
            )}
          </div>

          <div className={styles.preScanToolbar}>
            <button
              type="button"
              className={styles.preScanPrimaryButton}
              onClick={() => sendDashboardCommand('PRE_SCAN_PAGE')}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Run the Playwright page scanner for the selected URL"
            >
              Page Scanner
            </button>
            <button
              type="button"
              className={styles.preScanIconButton}
              onClick={()=>openOcrConfig()}
              title="OCR Configuration"
            >
              OCR Config
            </button>
            <button
              type="button"
              className={styles.preScanButton}
              onClick={()=>sendOcrConfigCommand('ocrTest.run',{homeBankingId,parameters:[]})}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting' || ocrConfigBusy}
              title="Open highlighted OCR results for the newest page scan"
            >
              OCR Results
            </button>
            <button
              type="button"
              className={styles.preScanButton}
              onClick={() => sendDashboardCommand('PRE_SCAN_REFRESH_PAGE')}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Refresh the pre-scan browser page"
            >
              Refresh Web Page
            </button>
            <button
              type="button"
              className={`${styles.preScanButton} ${styles.preScanHiddenControl}`}
              onClick={() => sendDashboardCommand('PRE_SCAN_SEND_DOM_REVIEW')}
              title="Send sanitized HTML for review"
            >
              Send Pure HTML Review
            </button>
            <button
              type="button"
              className={`${styles.preScanButton} ${styles.preScanHiddenControl}`}
              onClick={() => sendDashboardCommand('PRE_SCAN_REQUEST_SUPPORT')}
              title="Request support for the current page"
            >
              Request Support
            </button>
            <button
              type="button"
              className={styles.preScanDangerButton}
              onClick={handleDashboardClearGrid}
              disabled={elementDTO.length === 0}
              title="Clear the dashboard grid"
            >
              Clear Grid
            </button>
          </div>

          <div className={styles.preScanSearchRow}>
            <label className={styles.preScanLabel}>
              Focus:
              <select
                className={styles.preScanSelect}
                value={dashboardFocus}
                onChange={(event) => handleDashboardFocusChange(event.target.value)}
              >
                {PRE_SCAN_FOCUS_PROFILES.map((profile) => (
                  <option key={profile.value} value={profile.value}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.preScanLabel}>
              Search by:
              <input
                className={styles.preScanSearchInput}
                type="text"
                value={dashboardSearchText}
                onChange={(event) => setDashboardSearchText(event.target.value)}
                placeholder="button, label, input, data-testid"
              />
            </label>
            <label className={`${styles.preScanToggle} ${styles.preScanHiddenControl}`}>
              <input
                type="checkbox"
                checked={dashboardSearchHidden}
                onChange={(event) => setDashboardSearchHidden(event.target.checked)}
              />
              Search Hidden Fields
            </label>
            <button
              type="button"
              className={styles.preScanPrimaryButton}
              onClick={() => sendDashboardCommand('PRE_SCAN_PAGE')}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Run scanner with current focus and search terms"
            >
              Search
            </button>
          </div>
        </div>
      )}
      <div className={styles.gridFindRow}>
        <span className={styles.gridFindLabel}>Find:</span>
        <div className={styles.gridFindInputWrap}>
          <input
            className={styles.gridFindInput}
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Type to find…"
          />
          {findText.length > 0 && (
            <button
              type="button"
              className={styles.gridFindClear}
              aria-label="Clear find"
              title="Clear find"
              onClick={() => setFindText('')}
            >
              X
            </button>
          )}
        </div>
      </div>
      {/* DOM Review Modal */}
      {domReviewData && (
        <DomReviewModal data={domReviewData} onAction={handleDomReviewAction} />
      )}

      {/* Support Request Modal */}
      {supportReqData && (
        <SupportRequestModal data={supportReqData} onAction={handleSupportRequestAction} />
      )}

      {elementsSupportReqData && (
        <SupportRequestModal data={elementsSupportReqData} onAction={handleElementsSupportRequestAction} />
      )}

      {/* Alert Modal (as before) */}
      {alertMessageBody && alertMessageBody.length > 0 && (
        <AlertModal
          header={alertMessageHeader || ''}
          body={alertMessageBody || ''}
          extraMsg={alertMessageFooter || ''}
          onClose={handleClose}
          imageSrc={alertImage}
          imageClass={alertClass}
          error={errorFlag}
        />
      )}

      {/* Delete-Unchecked confirmation. The AlertModal renders Confirm/Cancel
          buttons when onConfirm is provided. */}
      {pendingDeleteCount !== null && (
        <AlertModal
          header="Delete Unchecked Elements?"
          body={`You are about to delete ${pendingDeleteCount} element${pendingDeleteCount === 1 ? '' : 's'} that are NOT marked Keep.`}
          extraMsg={`${keepSelectedIds.size} element${keepSelectedIds.size === 1 ? '' : 's'} will be kept. This only affects the list in this pane — it does not touch the database.`}
          onClose={cancelDeleteUnchecked}
          onConfirm={confirmDeleteUnchecked}
          imageSrc={warningRedImage}
          imageClass="warning-image"
          error={true}
        />
      )}

      {ocrReviewBlock && elementGrouped[ocrReviewBlock] && (
        <OCRPanel
          title={String(getElementBlockText(ocrReviewBlock))}
          elements={elementGrouped[ocrReviewBlock].elements}
          scannedTextOf={scannedTextOf}
          onDecision={applyOcrDecision}
          onClose={() => setOcrReviewBlock(null)}
        />
      )}

      {memoryPanelOpen && (
        <div
          className={styles.memoryPanel}
          style={{ left: memoryPanelPos.x, top: memoryPanelPos.y }}
        >
          <div className={styles.memoryPanelHeader} onMouseDown={startMemoryPanelDrag}>
            <span className={styles.memoryPanelTitle}>
              Memory List ({memoryElements.length})
            </span>
            <button
              type="button"
              className={styles.memoryPanelHeaderBtn}
              title="Clear all"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setMemoryElements([])}
            >
              Del
            </button>
            <button
              type="button"
              className={styles.memoryPanelHeaderBtn}
              title="Close"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setMemoryPanelOpen(false)}
            >
              x
            </button>
          </div>
          <div className={styles.memoryPanelSelectRow}>
            <span className={styles.memoryPanelSelectLabel}>Block:</span>
            <select
              className={styles.memoryPanelSelect}
              value={memoryTargetBlockId ?? ''}
              onChange={(e) => {
                if (e.target.value === '__create__') {
                  setCreateBlockOpen(true);
                  return;
                }
                setMemoryTargetBlockId(e.target.value === '' ? null : Number(e.target.value));
              }}
            >
              <option value="">Select target block...</option>
              <option value="__create__">+ Create new block...</option>
              {memoryBlockOptions.map((block) => (
                <option key={block.blockId} value={block.blockId}>
                  #{block.blockOrderNumber} {block.blockName}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.memoryPanelList}>
            {memoryElements.length === 0 ? (
              <div className={styles.memoryPanelEmpty}>
                Click "+" on a web element to add it here
              </div>
            ) : (
              memoryElements.map((element, i) => (
                <div key={memoryElementKey(element)} className={styles.memoryPanelRow}>
                  <span className={styles.memoryPanelOrder}>{i + 1}.</span>
                  {getInstructionElement(element)}
                  <button
                    type="button"
                    className={styles.memoryPanelRemove}
                    title="Remove from memory list"
                    onClick={() => handleRemoveElementFromMemory(element)}
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
          <div className={styles.memoryPanelFooter}>
            <button
              type="button"
              className={styles.memoryApplyButton}
              disabled={
                memoryTargetBlockId === null
                || memoryElements.length === 0
                || !memoryBlockOptions.some((block) => block.blockId === memoryTargetBlockId)
              }
              onClick={handleApplyMemory}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {createBlockOpen && (
        <CreateNewBlock
          blocks={memoryBlockOptions}
          onCreate={handleCreateNewBlock}
          onClose={() => setCreateBlockOpen(false)}
        />
      )}

      <div className={styles.gridScroll}>
        <div className={styles.gridContent}>
        {elementDTO.length === 0 ? (
          // No data message (as before)
          <div className={styles.block}>
            <div className={`${styles.blockHeader} ${styles.colorComponent2}`}>Scanned Web Elements</div>
            <div className={styles.instructionItem}> </div>
            <div className={styles.block}>
              <div className={styles.noDataMessage}>No data found</div>
            </div>
          </div>
        ) : (
          <>
            {/* Toggle Button and Pagination Controls on the same row */}
            <div className={styles.controlsRow}>
            {/* Pane-dependent bulk actions, hidden in preScan mode: Insert All sends no
                blockId (Memory List "+" → Apply is the single insert path) and Update All
                is a scanner-element-pane-only path — both dead ends without AR Web Factory. */}
            {!isPreScanMode && (
              <>
                <button
                  className={`${styles.sendAllButton} ${isSendingAll ? styles.sending : ''}`}
                  onClick={handlesSendAllClick}
                  disabled={isSendingAll}
                >
                  {isSendingAll ? 'Sending...' : 'Insert All Elements'}
                </button>
                <button
                  className={`${styles.updateAllButton} ${isUpdatingAll ? styles.updating : ''}`}
                  onClick={handlesUpdateAllClick}
                  disabled={isUpdatingAll}
                >
                  {isUpdatingAll ? 'Updating...' : 'Update All Elements'}
                </button>
              </>
            )}
            {/* <button className={styles.attributesButton} onClick={() => setShowAttributes(!showAttributes)}>
              {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
            </button> */}
            <button
              className={styles.attributesButton}
              onClick={keepAll}
              title="Mark every element as Keep"
              disabled={keepSelectedIds.size === elementDTO.length && elementDTO.length > 0}
            >
              Keep All
            </button>
            <button
              className={styles.attributesButton}
              onClick={clearKeeps}
              title="Clear the Keep checkboxes"
              disabled={keepSelectedIds.size === 0}
            >
              Clear Keeps
            </button>
            <button
              className={styles.attributesButton}
              onClick={requestDeleteUnchecked}
              disabled={uncheckedCount() === 0}
              style={{
                backgroundColor: uncheckedCount() === 0 ? undefined : '#D32F2F',
                color: uncheckedCount() === 0 ? undefined : '#fff',
                fontWeight: 600,
              }}
              title="Delete every element that is NOT marked Keep"
            >
              Delete Unchecked ({uncheckedCount()})
            </button>
            <button
              className={styles.attributesButton}
              onClick={handleClearGridAll}
              disabled={elementDTO.length === 0}
              style={{
                backgroundColor: elementDTO.length === 0 ? undefined : '#37474F',
                color: elementDTO.length === 0 ? undefined : '#fff',
                fontWeight: 600,
              }}
              title="Clear the entire grid"
            >
              Clear Grid All
            </button>
            {memoryElements.length > 0 && !memoryPanelOpen && (
              <button
                type="button"
                className={styles.memoryToggleButton}
                onClick={() => setMemoryPanelOpen(true)}
              >
                Memory ({memoryElements.length})
              </button>
            )}
            <div className={styles.paginationControls}>
              <label>Rows per page: </label>
              <select
                value={blockRowsPerPage}
                onChange={(e) => {
                  setBlockRowsPerPage(Number(e.target.value));
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {(() => {
            const q = findText.trim().toLowerCase();
            const filteredEntries = Object.entries(elementGrouped)
              .map(([typeElement, elementData]) => {
                if (!q) return [typeElement, elementData] as const;
                const groupMatches = typeElement.toLowerCase().includes(q);
                const filteredElements = groupMatches
                  ? elementData.elements
                  : elementData.elements.filter((el) => matchesFind(el, q));
                return [typeElement, { ...elementData, elements: filteredElements }] as const;
              })
              .filter(([, elementData]) => elementData.elements.length > 0);

            if (q && filteredEntries.length === 0) {
              return (
                <div className={styles.block}>
                  <div className={styles.noDataMessage}>No matches for “{findText}”</div>
                </div>
              );
            }

            return filteredEntries.map(([typeElement, elementData], index) => {
            const currentPage = blockCurrentPages[typeElement] || 1;
            const totalPages = blockPages[typeElement] || 1;
            const paginatedElements = elementData.elements.slice(
              (currentPage - 1) * blockRowsPerPage,
              currentPage * blockRowsPerPage
            );

            return (
              <div key={typeElement} className={styles.block}>
                <div className={`${styles.blockHeader} ${styles.colorComponent1}`}>
                  <div className={styles.blockHeaderLeft}>
                    <button
                      type="button"
                      className={`${styles.blockCollapseBadge} ${collapsedBlocks.has(typeElement) ? 'is-collapsed' : ''}`}
                      title={collapsedBlocks.has(typeElement) ? "Expand block" : "Collapse block"}
                      onClick={() => toggleBlockCollapsed(typeElement)}
                    >
                      <CollapseToggleIcon collapsed={collapsedBlocks.has(typeElement)} />
                    </button>
                    <span className={styles.blockOrderNumber}>#{index + 1}</span>
                    <span className={styles.blockName}>{getInstructionTypeElement(typeElement)}</span>
                    <span className={styles.blockCount}>({elementData.elements.length})</span>
                    <button
                      type="button"
                      className={styles.memoryAddButton}
                      title="Add all web elements in this block to memory list"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddElementBlockToMemory(elementData.elements);
                      }}
                    >
                      +
                    </button>
      {isPreScanMode && (
                      <>
                        <button
                          type="button"
                          className={`${styles.blockViewToggle} ${blockViewModes[typeElement] === 'id' ? styles.blockViewToggleActive : ''}`}
                          title="Show the raw DOM id of each element (hover an id for its humanized form and visible text)"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleBlockViewMode(typeElement, 'id');
                          }}
                        >
                          id
                        </button>
                        <button
                          type="button"
                          className={`${styles.blockViewToggle} ${blockViewModes[typeElement] === 'testid' ? styles.blockViewToggleActive : ''}`}
                          title="Show which elements carry a testing attribute (data-testid / data-cy / …)"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleBlockViewMode(typeElement, 'testid');
                          }}
                        >
                          id-test
                        </button>
                        <button
                          type="button"
                          className={`${styles.blockViewToggle} ${ocrReviewBlock === typeElement ? styles.blockViewToggleActive : ''}`}
                          title="Review OCR name suggestions for this block — agree with the OCR name or keep the scanned text, per element"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOcrReviewBlock((prev) => (prev === typeElement ? null : typeElement));
                          }}
                        >
                          OCR
                        </button>
                      </>
      )}
      {ocrConfig && <OCRConfigPanel key={ocrConfig.activeProfileId || 'new'} data={ocrConfig} busy={ocrConfigBusy} error={ocrConfigError} onSelect={profileId=>sendOcrConfigCommand('ocrConfig.profile',{profileId})} onSave={saveOcrConfig} onDelete={deleteOcrConfig} onCleanup={()=>sendOcrConfigCommand('ocrConfig.cleanupPreview',{homeBankingId})} onTest={parameters=>sendOcrConfigCommand('ocrTest.run',{parameters})} onClose={()=>setOcrConfig(null)}/>}
      {ocrTestResult && <OCRTestResultsPanel result={ocrTestResult} onAccept={acceptOcrSuggestions} onClose={()=>setOcrTestResult(null)}/>}
                    {isInputTextBlock(typeElement) && (
                      <img
                        src={testInputImage}
                        alt="Test Input"
                        title={`Type "${SCANNER_TEST_INPUT_VALUE}" into each input in this block`}
                        className={`${styles.testButton} ${styles.blockHeaderTestButton}`}
                        onClick={(event) => handleBlockTestInputClick(event, elementData.elements)}
                      />
                    )}
                  </div>
                  {elementData.elements.length > blockRowsPerPage && (
                    <div className={styles.bottomPaginationControls}>
                      <button disabled={currentPage === 1} onClick={() => handlePrevBlockPage(typeElement)}>
                        Prev
                      </button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button disabled={currentPage === totalPages} onClick={() => handleNextBlockPage(typeElement)}>
                        Next
                      </button>
                    </div>
                  )}
                  <img
                    src={crossImage}
                    alt="Remove Block"
                    className={styles.crossButton}
                    onClick={() => handleRemoveRowsBlock(typeElement)}
                  />

                </div>
                {!collapsedBlocks.has(typeElement) && (
                <div className={styles.instructionsList}>
                  {paginatedElements.map((elementDTO, i) => (
                    <div
                      key={i}
                      className={styles.instructionItem}
                      onMouseEnter={() => handleRowHover(elementDTO)}
                      onMouseLeave={handleRowLeave}
                    // onDoubleClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")}
                    // onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")}
                    >
                      {/* Keep-this-one selector. Checking it marks the element as a keeper,
                          so it survives when the user clicks "Delete Unchecked" in the header. */}
                      <input
                        type="checkbox"
                        className={styles.keepCheckbox}
                        checked={keepSelectedIds.has(elementDTO.id)}
                        onChange={() => toggleKeep(elementDTO.id)}
                        title="Keep this element (survives 'Delete Unchecked')"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {editingElementId === elementDTO.xPath && editingElementTagName === elementDTO.tagName ? (
                        <div className={styles.editContainer}>
                          <input
                            type="text"
                            value={elementName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInstruction(elementDTO); // Trigger save when "Enter" is pressed
                              }
                            }}
                            onChange={(e) => {
                              console.log(e.target.value);
                              setElementName(e.target.value);
                            }}
                            ref={elementDTORef} // Associate the ref with the input element
                            className={styles.editTextbox}
                          />
                          <img
                            src={saveImage}
                            alt="save"
                            className={styles.saveButton}
                            onClick={() =>
                              handleSaveInstruction(elementDTO)
                            } // Save instruction logic
                          />
                        </div>
                      ) : (
                        <span className={styles.instructionLine}>
                          {getInstructionElement(elementDTO, blockViewModes[typeElement] ?? 'name')}
                          <button
                            type="button"
                            className={styles.memoryAddButton}
                            title="Add web element to memory list"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddElementToMemory(elementDTO);
                            }}
                          >
                            +
                          </button>
                        </span>)}
                      {/* {showAttributes ? (
                        <div className="attr-slot">
                          <AttributeDropdown dataArray={elementDTO.attributeData} onChange={handleAttributeChange} />
                        </div>
                      ) : (
                        <span className="attr-slot">{"\u00A0".repeat(20)}</span>
                      )} */}
                      <div className={styles.optionsColumn}>
                        <CompForce item={elementDTO} onChange={handleElementForceChange} />
                        {/* Hidden — MultiPlugins support disabled
                        <img
                          src={warningRedImage}
                          alt="Report this element to support"
                          title="Report this element to support"
                          className={styles.warningButton}
                          onClick={() => requestElementsSupport(elementDTO)}
                        />
                        */}
                        {/* Details only fills the legacy pane's text fields — dead click
                            in preScan mode where the pane isn't open. */}
                        {!isPreScanMode && (
                          <img src={pickItemImage} alt="" className={styles.pickButton} onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")} />
                        )}
                        {renderEditButton(
                          elementDTO,
                          editImage
                        )}
                        {/* Row save removed in preScan mode: the Memory List "+" → Apply is the
                            single insert path for this version. */}
                        {!isPreScanMode && (
                          <img src={saveImage} alt="" className={styles.saveButton} onClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")} />
                        )}
                        {(() => {
                          // Test Input only makes sense on typeable elements (inputs, selects,
                          // textareas). For links / buttons / anchors the element can't accept
                          // text, so we hide that button and keep Test Click only.
                          const tag = (elementDTO.tagName || "").toLowerCase();
                          const isTypeable = tag === "input" || tag === "select" || tag === "textarea";
                          return isTypeable ? (
                            <img src={testInputImage} alt="Test Input" title="Test Input" className={styles.testButton} onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_INPUT_DTO")} />
                          ) : null;
                        })()}
                        <img src={clickTestImage} alt="Test Click" title="Test Click" className={styles.testButton} onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_CLICK_DTO")} />
                        <img src={crossImage} alt="" className={styles.crossButton} onClick={() => handleRemoveElementDTO(elementDTO)} />
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
          });
          })()}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default GridItemScann;
