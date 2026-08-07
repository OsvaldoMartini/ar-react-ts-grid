import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings2 } from 'lucide-react';
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
import activeImage from '../assets/active3.png';
import inactiveImage from '../assets/inactive2.png';
import CompForce from './CompForce';
import AlertModal from './AlertModal';
import DomReviewModal, { type DomReviewData, type DomReviewAction } from './DomReviewModal';
import SupportRequestModal, { type SupportRequestData, type SupportRequestAction } from './SupportRequestModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';
import NameDropdown from './NameDropdown';
import CreateNewBlock, { CreateBlockOption, CreateBlockPosition } from './CreateNewBlock';
import OCRPanel from './OCRPanel';
import BotJobDetailsChrome from './bot-job-details/BotJobDetailsChrome';
import { useBotJobDetailsController } from './bot-job-details/useBotJobDetailsController';
import ScannerWorkspaceHeader from './scanner/ScannerWorkspaceHeader';
import PageScannerWorkspaceHeader from './scanner/PageScannerWorkspaceHeader';
import PageScannerExecutionControls from './scanner/PageScannerExecutionControls';
import WebElementTypeToggle from './scanner/WebElementTypeToggle';
import type { WebElementExecutionType } from './webElementExecutionType';
import {
  pageScannerExecutionTypeFor,
  pageScannerGroupTagFor,
  replacePageScannerExecutionTypeOverride,
} from './scanner/PageScannerExecutionType';
import PageScannerFocusProfileEditor, {
  type PageScannerFocusProfileDraft,
} from './scanner/PageScannerFocusProfileEditor';
import {
  FALLBACK_PAGE_SCANNER_PROFILES,
  PAGE_SCANNER_CUSTOM_PROFILE_KEY,
  PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  pageScannerProfilesEqual,
  pageScannerProfilesOrFallback,
  resolvePageScannerProfileResponse,
  type PageScannerFocusProfile,
  type PendingPageScannerProfileRequest,
  type PageScannerProfileRequestOperation,
} from './scanner/PageScannerFocusProfile';
import {
  createPageScannerRequestId,
  pageScannerCloseMessage,
  pageScannerRetargetDisposition,
  pageScannerRequestForResponse,
  pageScannerWorkspaceRetarget,
  pageScannerWorkspaceCloseReason,
  type PageScannerRequestOperation,
} from './scanner/PageScanner.contract';
import LocatorGeneratorPanel from './scanner/LocatorGeneratorPanel';
import {
  PAGE_SCANNER_LOCATOR_APPLY_RESPONSE,
  PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE,
  pageScannerLocatorElementKey,
  pageScannerLocatorElementLabel,
  pageScannerLocatorApplyMessage,
  pageScannerLocatorGenerateMessage,
  elementDTOFromLocatorResult,
  mergeGeneratedLocatorElements,
  replacePageScannerLocatorElement,
  replacePageScannerLocatorGroupedElement,
  resolvePageScannerLocatorApplyResponse,
  type LocatorResult,
  type PendingLocatorApply,
} from './scanner/PageScannerLocator';
import {
  PAGE_SCANNER_ELEMENT_RENAME_RESPONSE,
  applyPageScannerAliasesByXPath,
  normalizePageScannerClientNamed,
  pageScannerElementRenameMessage,
  replacePageScannerElementAlias,
  replacePageScannerGroupedElementAlias,
  resolvePageScannerElementRenameResponse,
  type PendingPageScannerElementRename,
} from './scanner/PageScannerElementRename';
import { useScannerController } from './scanner/useScannerController';
import FindBar from './bot-job-details/grid/FindBar';
import { useMemoryListSummary } from './bot-job-details/grid/hooks/useMemoryListSummary';
import type {
  MemoryListItem,
  MemoryListItemIcon,
  MemoryListSnapshot,
} from './memoryList.contract';
import {
  PRE_SCAN_CLEAR_GRID_OPERATION,
  PRE_SCAN_PAGE_OPERATION,
  PRE_SCAN_REFRESH_PAGE_OPERATION,
  PRE_SCAN_REQUEST_SUPPORT_OPERATION,
  PRE_SCAN_SEND_DOM_REVIEW_OPERATION,
  SCANNER_DOM_REVIEW_RESPONSE_OPERATION,
  SCANNER_REQUEST_SUPPORT_ELEMENTS_OPERATION,
  SCANNER_REQUEST_SUPPORT_OPERATION,
  SCANNER_SEARCH_TERMS_OPERATION,
  SCANNER_SEND_DOM_REVIEW_OPERATION,
  SCANNER_SUPPORT_REQUEST_ELEMENTS_RESPONSE_OPERATION,
  SCANNER_SUPPORT_REQUEST_RESPONSE_OPERATION,
} from './scanner/Scanner.operations';
import {
  OCR_CONFIG_WORKSPACE_KIND,
  OCR_RESULTS_WORKSPACE_KIND,
  isPageScannerWorkspaceSession,
  type OcrWorkspaceKind,
  SCANNER_ELEMENT_PANE_SESSION_ID,
  PRE_SCANNER_GRID_SESSION_ID,
  SCANNER_GRID_SESSION_ID,
  SCANNER_TOOL_SESSION_ID,
} from './scanner/Scanner.sessions';
import styles from './GridItemScann.module.scss';


export interface GridItemScannProps {
  homeBankingIdInitial: number;
  botJobIdInitial: number;
  botJobNameInitial: string;
  dataDTO: ElementDTO[];
  socketPort: number;
  sessionId: string;
  mode?: 'scanner' | 'preScan';
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
  onWorkspaceNotice?: (message: string) => void;
}

// Canonical group buckets. The scanner's DECIDED category (typeElement) wins over
// the raw tag, so a <select> classified as clickable lands in the Button group and
// nothing ever mints a one-off group like "Select Text" (mat-select, svg, option…).
// Undecided elements render as Output — same convention as the AR Web Factory pane
// (input → input, click → button, link → a, output → label).
// The override only changes the staged execution category. Raw scanner fields
// remain unchanged, so locator keys and scanned-element registry identity stay
// stable while the row moves to the selected visual group.
const groupTagFor = pageScannerGroupTagFor;

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

const isElementActive = (element: ElementDTO): boolean => element.active !== false;

const scannerMemoryElementKey = (element: ElementDTO): string =>
  `${element.xPath || ''}||${element.tagName || ''}||${element.typeElement || ''}||${element.attributeType || ''}||${element.someText || ''}`;

const scannerMemoryIcon = (element: ElementDTO): MemoryListItemIcon => {
  const tag = groupTagFor(element);
  if (tag === 'input') return 'input';
  if (tag === 'button') return 'click';
  if (tag === 'a' || tag === 'link') return 'link';
  return 'output';
};

const scannerMemoryItem = (element: ElementDTO): MemoryListItem => {
  const sourceItemKey = scannerMemoryElementKey(element);
  const label = String(
    (element as any).clientNamed
    || (element as any).definedName
    || element.someText
    || element.tagName
    || 'Web element',
  ).trim();
  return {
    key: `PAGE_SCANNER:${sourceItemKey}`,
    sourceKind: 'PAGE_SCANNER',
    sourceItemKey,
    label,
    detail: element.xPath || `${element.tagName || 'element'} #${element.id}`,
    icon: scannerMemoryIcon(element),
    active: isElementActive(element),
    payload: { elementDTO: element },
  };
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
      blockId: Number(block.blockId ?? block.id),
      blockOrderNumber: Number(block.blockOrderNumber ?? block.order),
      blockName: String(block.blockName ?? block.name ?? ''),
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

type PendingPageScannerRequest = {
  requestId: string;
  operation: PageScannerRequestOperation;
  timeout: ReturnType<typeof setTimeout>;
};

type PageScannerCreateBlockPayload = {
  requestId: string;
  blockName: string;
  insertPosition: 'END' | 'BEFORE';
  beforeBlockId: number;
  beforeBlockOrderNumber: number;
};

type PendingPageScannerCreateBlock = {
  requestId: string;
  payload: PageScannerCreateBlockPayload;
};

const PAGE_SCANNER_RESPONSE_TIMEOUT_MS = 12000;

const GridItemScann: React.FC<GridItemScannProps> = ({
  homeBankingIdInitial,
  botJobIdInitial,
  botJobNameInitial,
  dataDTO,
  socketPort,
  sessionId,
  mode = 'scanner',
  onSessionOpen,
  onDetachedClose,
  onWorkspaceNotice,
}) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);
  const canonicalMemoryItemCount = useMemoryListSummary({
    webSocket,
    connected,
    messages,
    sessionId,
    homeBankingId,
    botJobId,
  });

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
  const [pageScannerProfiles, setPageScannerProfiles] = useState<PageScannerFocusProfile[]>(
    () => pageScannerProfilesOrFallback(null),
  );
  const [dashboardSearchText, setDashboardSearchText] = useState<string>(
    FALLBACK_PAGE_SCANNER_PROFILES[0].searchTerms,
  );
  const [dashboardFocus, setDashboardFocus] = useState<string>(PAGE_SCANNER_DEFAULT_PROFILE_KEY);
  const [dashboardSearchHidden, setDashboardSearchHidden] = useState<boolean>(false);
  const [pageScannerProfileEditorOpen, setPageScannerProfileEditorOpen] = useState(false);
  const [pageScannerProfileBusy, setPageScannerProfileBusy] = useState<PageScannerProfileRequestOperation | null>(null);
  const [pageScannerProfileError, setPageScannerProfileError] = useState('');
  const [pageScannerBootstrapError, setPageScannerBootstrapError] = useState('');
  const [preScanStatus, setPreScanStatus] = useState<PreScanStatus>({
    status: 'idle',
    message: 'Ready',
    elementCount: 0,
  });
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const isDetachedPageScanner = isPageScannerWorkspaceSession(sessionId);
  useEffect(() => {
    if (isDetachedPageScanner) document.title = 'Page Scanner';
  }, [isDetachedPageScanner]);
  const isPreScanMode = mode === 'preScan'
    || sessionId.includes(PRE_SCANNER_GRID_SESSION_ID)
    || isDetachedPageScanner;
  const botJobHeader = useBotJobDetailsController({
    webSocket,
    connected,
    messages,
    sessionId,
    homeBankingId,
    botJobId,
    enabled: isPreScanMode,
    onSurfaceOpen: (targetSession, nextBotJobId) => onSessionOpen(targetSession, socketPort, nextBotJobId),
  });
  const scannerController = useScannerController({
    webSocket, connected, messages, sessionId, homeBankingId, botJobId, enabled: !isPreScanMode,
  });

  const returnToMainDashboard = useCallback(() => {
    if (onDetachedClose) {
      onDetachedClose();
      return;
    }
    onSessionOpen('mainDashboard', socketPort);
  }, [onDetachedClose, onSessionOpen, socketPort]);

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
  const pageScannerRetiredRef = useRef(false);

  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);
  const [domReviewData, setDomReviewData] = useState<DomReviewData | null>(null);
  const [supportReqData, setSupportReqData] = useState<SupportRequestData | null>(null);
  const [elementsSupportReqData, setElementsSupportReqData] = useState<SupportRequestData | null>(null);
  const clickedSupportElementRef = useRef<ElementDTO | null>(null);
  const [memoryElements, setMemoryElements] = useState<ElementDTO[]>([]);
  const memoryListOpenRequestedRef = useRef(false);
  const memoryListOpenedRef = useRef(false);
  const memoryListOpenPendingRequestRef = useRef<string | null>(null);
  const memoryListOwnerEpochRef = useRef('');
  const [memoryListOpenVersion, setMemoryListOpenVersion] = useState(0);

  const [locatorPanelOpen, setLocatorPanelOpen] = useState<boolean>(false);
  const [locatorPanelPos, setLocatorPanelPos] = useState<{ x: number; y: number }>({ x: 120, y: 150 });
  const [locatorTargetKey, setLocatorTargetKey] = useState<string>('');
  const [locatorBusy, setLocatorBusy] = useState<boolean>(false);
  const [locatorApplying, setLocatorApplying] = useState<boolean>(false);
  const [locatorError, setLocatorError] = useState<string>('');
  const [locatorWarning, setLocatorWarning] = useState<string>('');
  const [locatorFeedback, setLocatorFeedback] = useState<string>('');
  const [locatorResults, setLocatorResults] = useState<LocatorResult[]>([]);
  const [locatorCommittedUpdate, setLocatorCommittedUpdate] = useState<{
    pending: PendingLocatorApply;
    element: ElementDTO;
  } | null>(null);
  const locatorRequestRef = useRef<string | null>(null);
  const locatorApplyRef = useRef<PendingLocatorApply | null>(null);
  const locatorRequestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locatorApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageScannerElementRenameRef = useRef<PendingPageScannerElementRename | null>(null);
  const pageScannerElementRenameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memoryTargetBlockId, setMemoryTargetBlockId] = useState<number | null>(null);
  const [memoryBlockOptions, setMemoryBlockOptions] = useState<CreateBlockOption[]>([]);
  const [createBlockOpen, setCreateBlockOpen] = useState<boolean>(false);
  const [createBlockRequestPending, setCreateBlockRequestPending] = useState<boolean>(false);
  const [createBlockBusy, setCreateBlockBusy] = useState<boolean>(false);
  const [memoryApplyBusy, setMemoryApplyBusy] = useState<boolean>(false);
  const [pageScannerClosing, setPageScannerClosing] = useState<boolean>(false);
  const pageScannerBootstrapSocketRef = useRef<WebSocket | null>(null);
  const pageScannerBootstrapRequestRef = useRef<string | null>(null);
  const pendingPageScannerApplyRef = useRef<{ requestId: string; elementKeys: string[] } | null>(null);
  const pageScannerApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageScannerCloseRequestRef = useRef<string | null>(null);
  const pageScannerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPageScannerRequestsRef = useRef<Map<string, PendingPageScannerRequest>>(new Map());
  const pendingPageScannerCreateBlockRef = useRef<PendingPageScannerCreateBlock | null>(null);
  const pageScannerCreateBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageScannerProfileSocketRef = useRef<WebSocket | null>(null);
  const pendingPageScannerProfileRequestsRef = useRef<Map<string, PendingPageScannerProfileRequest>>(new Map());

  const memoryElementKey = scannerMemoryElementKey;

  const requestMemoryListOpen = () => {
    memoryListOpenRequestedRef.current = true;
    if (memoryListOpenPendingRequestRef.current) return;
    memoryListOpenedRef.current = false;
    memoryListOwnerEpochRef.current = '';
    setMemoryListOpenVersion(version => version + 1);
  };

  const clearPendingPageScannerRequests = () => {
    pendingPageScannerRequestsRef.current.forEach((pending) => clearTimeout(pending.timeout));
    pendingPageScannerRequestsRef.current.clear();
  };

  const trackPageScannerRequest = (
    requestId: string,
    operation: PageScannerRequestOperation,
  ) => {
    const previous = pendingPageScannerRequestsRef.current.get(requestId);
    if (previous) clearTimeout(previous.timeout);
    const timeout = setTimeout(() => {
      const pending = pendingPageScannerRequestsRef.current.get(requestId);
      if (!pending || pending.operation !== operation) return;
      pendingPageScannerRequestsRef.current.delete(requestId);
      setPreScanStatus((current) => ({
        ...current,
        status: 'failed',
        message: 'The backend did not acknowledge the Page Scanner operation.',
      }));
    }, PAGE_SCANNER_RESPONSE_TIMEOUT_MS);
    pendingPageScannerRequestsRef.current.set(requestId, { requestId, operation, timeout });
  };

  const takePageScannerRequest = (
    requestId: unknown,
    expectedOperation?: PageScannerRequestOperation,
  ): PendingPageScannerRequest | null => {
    if (typeof requestId !== 'string' || !requestId) return null;
    const pending = pendingPageScannerRequestsRef.current.get(requestId);
    if (!pending || (expectedOperation && pending.operation !== expectedOperation)) return null;
    clearTimeout(pending.timeout);
    pendingPageScannerRequestsRef.current.delete(requestId);
    return pending;
  };

  const selectDashboardProfile = (
    profileKey: string,
    availableProfiles: PageScannerFocusProfile[] = pageScannerProfiles,
  ) => {
    if (profileKey === PAGE_SCANNER_CUSTOM_PROFILE_KEY) {
      setDashboardFocus(PAGE_SCANNER_CUSTOM_PROFILE_KEY);
      return;
    }
    const profile = availableProfiles.find(item => item.key === profileKey);
    if (!profile) return;
    setDashboardFocus(profile.key);
    setDashboardSearchText(profile.searchTerms);
  };

  const sendPageScannerProfileCommand = (
    operation: PageScannerProfileRequestOperation,
    body: Record<string, unknown> = {},
    profileKey?: string,
  ): boolean => {
    if (
      !isDetachedPageScanner
      || !webSocket
      || webSocket.readyState !== WebSocket.OPEN
    ) {
      setPageScannerProfileError('Page Scanner is not connected.');
      return false;
    }

    const requestId = createPageScannerRequestId(operation);
    pendingPageScannerProfileRequestsRef.current.set(requestId, { operation, profileKey });
    setPageScannerProfileBusy(operation);
    setPageScannerProfileError('');
    try {
      webSocket.send(JSON.stringify({
        type: operation,
        sessionId,
        homeBankingId,
        botJobId,
        body: JSON.stringify({ requestId, ...body }),
      }));
      return true;
    } catch (profileError) {
      pendingPageScannerProfileRequestsRef.current.delete(requestId);
      setPageScannerProfileBusy(null);
      setPageScannerProfileError(profileError instanceof Error
        ? profileError.message
        : 'The Page Scanner profile request could not be sent.');
      return false;
    }
  };

  const retireDetachedPageScanner = (
    reason: 'BOT_JOB_CLOSED' | 'SUPERSEDED' | 'EXPIRED',
    backendMessage?: unknown,
  ) => {
    const message = typeof backendMessage === 'string' && backendMessage.trim()
      ? backendMessage.trim()
      : pageScannerCloseMessage(reason);
    clearPendingPageScannerRequests();
    setMemoryApplyBusy(false);
    setCreateBlockBusy(false);
    setPageScannerBootstrapError(message);
    setPreScanStatus((current) => ({ ...current, status: 'failed', message }));
    setPageScannerClosing(true);
    if (pageScannerCloseTimerRef.current) clearTimeout(pageScannerCloseTimerRef.current);
    pageScannerCloseTimerRef.current = setTimeout(() => returnToMainDashboard(), 1400);
  };

  useEffect(() => {
    if (!isDetachedPageScanner) {
      pageScannerBootstrapSocketRef.current = null;
      pageScannerBootstrapRequestRef.current = null;
      setPageScannerBootstrapError('');
      return;
    }
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    if (pageScannerBootstrapSocketRef.current === webSocket) return;

    const requestId = createPageScannerRequestId('page-scanner-bootstrap');
    pageScannerBootstrapSocketRef.current = webSocket;
    pageScannerBootstrapRequestRef.current = requestId;
    setPageScannerBootstrapError('');
    try {
      webSocket.send(JSON.stringify({
        type: 'pageScannerWorkspace.bootstrap',
        sessionId,
        body: JSON.stringify({ requestId, sessionId }),
      }));
    } catch (bootstrapError) {
      pageScannerBootstrapSocketRef.current = null;
      pageScannerBootstrapRequestRef.current = null;
      setPageScannerBootstrapError(
        bootstrapError instanceof Error
          ? bootstrapError.message
          : 'Page Scanner details could not be loaded.',
      );
    }
  }, [connected, isDetachedPageScanner, sessionId, webSocket]);

  useEffect(() => {
    if (!isDetachedPageScanner) {
      pageScannerProfileSocketRef.current = null;
      pendingPageScannerProfileRequestsRef.current.clear();
      setPageScannerProfileBusy(null);
      return;
    }
    if (!connected || !webSocket || webSocket.readyState !== WebSocket.OPEN) {
      if (pageScannerProfileSocketRef.current) {
        pageScannerProfileSocketRef.current = null;
        pendingPageScannerProfileRequestsRef.current.clear();
        setPageScannerProfileBusy(null);
      }
      return;
    }
    if (pageScannerProfileSocketRef.current === webSocket) return;

    const requestId = createPageScannerRequestId('page-scanner-profile-list');
    pageScannerProfileSocketRef.current = webSocket;
    pendingPageScannerProfileRequestsRef.current.set(requestId, {
      operation: 'pageScannerProfile.list',
    });
    setPageScannerProfileBusy('pageScannerProfile.list');
    setPageScannerProfileError('');
    try {
      webSocket.send(JSON.stringify({
        type: 'pageScannerProfile.list',
        sessionId,
        homeBankingId,
        botJobId,
        body: JSON.stringify({ requestId }),
      }));
    } catch (profileError) {
      pageScannerProfileSocketRef.current = null;
      pendingPageScannerProfileRequestsRef.current.delete(requestId);
      setPageScannerProfileBusy(null);
      setPageScannerProfileError(profileError instanceof Error
        ? profileError.message
        : 'Page Scanner profiles could not be loaded.');
    }
  }, [botJobId, connected, homeBankingId, isDetachedPageScanner, sessionId, webSocket]);

  const closeDetachedPageScanner = () => {
    if (pageScannerClosing) return;
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const requestId = createPageScannerRequestId('page-scanner-close');
      try {
        webSocket.send(JSON.stringify({
          type: 'pageScanner.close',
          sessionId,
          homeBankingId,
          botJobId,
          body: JSON.stringify({ requestId, sessionId }),
        }));
        pageScannerCloseRequestRef.current = requestId;
        setPageScannerClosing(true);
        pageScannerCloseTimerRef.current = setTimeout(() => returnToMainDashboard(), 1500);
        return;
      } catch (closeError) {
        console.error('Could not notify the backend that Page Scanner closed:', closeError);
      }
    }
    returnToMainDashboard();
  };

  useEffect(() => () => {
    if (pageScannerCloseTimerRef.current) clearTimeout(pageScannerCloseTimerRef.current);
    if (pageScannerApplyTimerRef.current) clearTimeout(pageScannerApplyTimerRef.current);
    if (pageScannerCreateBlockTimerRef.current) clearTimeout(pageScannerCreateBlockTimerRef.current);
    if (locatorRequestTimerRef.current) clearTimeout(locatorRequestTimerRef.current);
    if (locatorApplyTimerRef.current) clearTimeout(locatorApplyTimerRef.current);
    if (pageScannerElementRenameTimerRef.current) clearTimeout(pageScannerElementRenameTimerRef.current);
    clearPendingPageScannerRequests();
    pendingPageScannerProfileRequestsRef.current.clear();
    pageScannerProfileSocketRef.current = null;
  }, []);

  const handleAddElementToMemory = (element: ElementDTO) => {
    const key = memoryElementKey(element);
    setMemoryElements((prev) =>
      prev.some((item) => memoryElementKey(item) === key) ? prev : [...prev, element]
    );
    requestMemoryListOpen();
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
    requestMemoryListOpen();
  };

  useEffect(() => {
    if (!memoryListOpenRequestedRef.current && !memoryListOpenedRef.current) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !botJobId || botJobId <= 0) return;
    if (memoryListOpenRequestedRef.current && memoryListOpenPendingRequestRef.current) return;

    const activeItems = memoryElements.filter(isElementActive);
    const busy = memoryApplyBusy || createBlockBusy;
    const snapshot: MemoryListSnapshot = {
      ownerEpoch: memoryListOwnerEpochRef.current,
      sourceKind: 'PAGE_SCANNER',
      homeBankingId,
      botJobId,
      botJobName: botJobName || '',
      items: memoryElements.map(scannerMemoryItem),
      blocks: memoryBlockOptions,
      targetBlockId: memoryTargetBlockId,
      emptyMessage: 'Click "+" on a web element to add it here.',
      status: busy ? 'Applying Memory List changes...' : 'Memory List ready',
      busy,
      canApply: memoryTargetBlockId !== null
        && activeItems.length > 0
        && !busy
        && memoryBlockOptions.some(block => block.blockId === memoryTargetBlockId),
    };
    const operation = memoryListOpenRequestedRef.current ? 'memoryList.open' : 'memoryList.sync';
    const requestId = `memory-list-${Date.now()}-${operation === 'memoryList.open' ? 'open' : 'sync'}`;

    try {
      webSocket.send(JSON.stringify({
        type: operation,
        sessionId,
        homeBankingId,
        botJobId,
        body: JSON.stringify({
          requestId,
          homeBankingId,
          botJobId,
          ownerEpoch: memoryListOwnerEpochRef.current,
          snapshot,
        }),
      }));
      if (operation === 'memoryList.open') {
        memoryListOpenPendingRequestRef.current = requestId;
      }
    } catch (memoryListError) {
      if (operation === 'memoryList.open') {
        memoryListOpenPendingRequestRef.current = null;
      }
      console.error('Could not synchronize Page Scanner Memory List:', memoryListError);
    }
  }, [
    botJobId,
    botJobName,
    createBlockBusy,
    homeBankingId,
    memoryApplyBusy,
    memoryBlockOptions,
    memoryElements,
    memoryListOpenVersion,
    memoryTargetBlockId,
    sessionId,
    webSocket,
  ]);

  const addGeneratedElementsToScannerGrid = (generatedElements: ElementDTO[]): ElementDTO[] => {
    const merged = mergeGeneratedLocatorElements(elementDTO, generatedElements);
    setElementDTO(merged.elements);
    setElementGrouped(groupByTagName(merged.elements));
    setIsElementGrouped(true);
    if (merged.accepted.length > 0) {
      setKeepSelectedIds((prev) => {
        const next = new Set(prev);
        merged.accepted.forEach((element) => next.add(element.id));
        return next;
      });
      setLocatorTargetKey(pageScannerLocatorElementKey(merged.accepted[0]));
    }
    return merged.accepted;
  };

  const handleElementActiveToggle = (target: ElementDTO) => {
    const nextActive = !isElementActive(target);
    const updateElement = (element: ElementDTO): ElementDTO =>
      element.id === target.id ? { ...element, active: nextActive } : element;

    setElementDTO((prev) => prev.map(updateElement));
    setElementGrouped((prevGrouped) => {
      const updated = { ...prevGrouped };
      for (const tagName of Object.keys(updated)) {
        updated[tagName] = {
          ...updated[tagName],
          elements: updated[tagName].elements.map(updateElement),
        };
      }
      return updated;
    });
    setMemoryElements((prev) => prev.map((element) =>
      element.id === target.id || memoryElementKey(element) === memoryElementKey(target)
        ? { ...element, active: nextActive }
        : element
    ));
  };

  const handleElementExecutionTypeChange = (
    target: ElementDTO,
    nextExecutionType: WebElementExecutionType,
  ) => {
    const targetKey = pageScannerLocatorElementKey(target);
    const updateElements = (current: ElementDTO[]) => (
      replacePageScannerExecutionTypeOverride(current, targetKey, nextExecutionType)
    );

    setElementDTO(updateElements);
    setElementGrouped((current) => groupByTagName(
      updateElements(Object.values(current).flatMap((group) => group.elements)),
    ));
    setMemoryElements(updateElements);
  };

  const startLocatorPanelDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = locatorPanelPos.x;
    const startTop = locatorPanelPos.y;
    const onMove = (moveEvent: MouseEvent) => {
      setLocatorPanelPos({
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

  const clearLocatorGenerateRequest = () => {
    if (locatorRequestTimerRef.current) {
      clearTimeout(locatorRequestTimerRef.current);
      locatorRequestTimerRef.current = null;
    }
    locatorRequestRef.current = null;
    setLocatorBusy(false);
  };

  const clearLocatorApplyRequest = () => {
    if (locatorApplyTimerRef.current) {
      clearTimeout(locatorApplyTimerRef.current);
      locatorApplyTimerRef.current = null;
    }
    locatorApplyRef.current = null;
    setLocatorApplying(false);
  };

  const openLocatorPanel = (target?: ElementDTO) => {
    if (target) {
      setLocatorTargetKey(pageScannerLocatorElementKey(target));
    } else if (elementDTO.length === 1) {
      setLocatorTargetKey(pageScannerLocatorElementKey(elementDTO[0]));
    } else if (!elementDTO.some((element) => pageScannerLocatorElementKey(element) === locatorTargetKey)) {
      setLocatorTargetKey('');
    }
    setLocatorPanelOpen(true);
  };

  const closeLocatorPanel = () => {
    setLocatorPanelOpen(false);
  };

  const clearLocatorFeedback = () => {
    setLocatorResults([]);
    setLocatorError('');
    setLocatorWarning('');
    setLocatorFeedback('');
  };

  const generateLocators = (htmlInput: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setLocatorError('Scanner is not connected.');
      return;
    }
    const html = htmlInput.trim();
    if (!html) {
      setLocatorError('Paste the HTML of the controls first.');
      return;
    }
    if (locatorRequestRef.current) return;
    const requestId = createPageScannerRequestId('page-scanner-locator-generate');
    locatorRequestRef.current = requestId;
    setLocatorBusy(true);
    setLocatorError('');
    setLocatorWarning('');
    setLocatorFeedback('');
    setLocatorResults([]);
    try {
      webSocket.send(JSON.stringify(pageScannerLocatorGenerateMessage(
        { sessionId, homeBankingId, botJobId },
        requestId,
        html,
      )));
      locatorRequestTimerRef.current = setTimeout(() => {
        if (locatorRequestRef.current !== requestId) return;
        clearLocatorGenerateRequest();
        setLocatorError('Locator generation timed out. Check the Page Scanner connection and try again.');
      }, PAGE_SCANNER_RESPONSE_TIMEOUT_MS);
    } catch (sendError) {
      clearLocatorGenerateRequest();
      setLocatorError(sendError instanceof Error ? sendError.message : 'Could not send the request.');
    }
  };

  const applyGeneratedXPath = (result: LocatorResult) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setLocatorError('Scanner is not connected. The XPath was not applied.');
      return;
    }
    if (locatorApplyRef.current) return;
    const target = elementDTO.find(
      (element) => pageScannerLocatorElementKey(element) === locatorTargetKey,
    );
    if (!target) {
      setLocatorError('Select a scanned element before applying an XPath.');
      return;
    }
    const xpath = result.xpath.trim();
    if (!xpath) {
      setLocatorError('The generated XPath is empty and cannot be applied.');
      return;
    }

    const requestId = createPageScannerRequestId('page-scanner-locator-apply');
    const elementKey = pageScannerLocatorElementKey(target);
    locatorApplyRef.current = { requestId, elementKey, xpath, target };
    setLocatorApplying(true);
    setLocatorError('');
    setLocatorFeedback('');
    try {
      webSocket.send(JSON.stringify(pageScannerLocatorApplyMessage(
        { sessionId, homeBankingId, botJobId },
        { requestId, elementKey, xpath, target },
        target,
      )));
      locatorApplyTimerRef.current = setTimeout(() => {
        if (locatorApplyRef.current?.requestId !== requestId) return;
        clearLocatorApplyRequest();
        setLocatorError(
          'The backend did not acknowledge the XPath change. Refresh or rescan before retrying so the current value can be confirmed.',
        );
      }, PAGE_SCANNER_RESPONSE_TIMEOUT_MS);
    } catch (sendError) {
      clearLocatorApplyRequest();
      setLocatorError(sendError instanceof Error
        ? sendError.message
        : 'The XPath apply request could not be sent.');
    }
  };

  const addGeneratedElementDTO = (result: LocatorResult, index: number) => {
    const generatedElement = elementDTOFromLocatorResult(result, index);
    const [acceptedElement] = addGeneratedElementsToScannerGrid([generatedElement]);
    const visibleElement = acceptedElement || generatedElement;
    handleAddElementToMemory(visibleElement);
    setLocatorError('');
    setLocatorFeedback(
      `${pageScannerLocatorElementLabel(visibleElement)} added to Memory List and Scanner Grid. `
      + 'Test it here or choose a block and Apply to insert it into the Bot Job.',
    );
  };

  const addAllGeneratedElementDTO = () => {
    if (locatorResults.length === 0) {
      setLocatorError('Generate locator ElementDTO candidates first.');
      return;
    }
    const generatedElements = locatorResults.map((result, index) =>
      elementDTOFromLocatorResult(result, index)
    );
    const acceptedElements = addGeneratedElementsToScannerGrid(generatedElements);
    handleAddElementBlockToMemory(acceptedElements);
    setLocatorError('');
    setLocatorFeedback(
      `${acceptedElements.length} generated ElementDTO candidate`
      + `${acceptedElements.length === 1 ? '' : 's'} added to Memory List and Scanner Grid. `
      + 'Test them here or choose a block and Apply to insert them into the Bot Job.',
    );
  };

  // ── OCR review panel (preScan): per-block floating OCRPanel where the client agrees
  // with the OCR-resolved name or keeps the scanned DOM text, per element. The
  // backend stashes the pre-OCR text in attributeData['scanned-text'] whenever the
  // resolver changed it; rows without it are shown as "same".
  const [ocrReviewBlock, setOcrReviewBlock] = useState<string | null>(null);
  const [ocrWorkspaceBusy, setOcrWorkspaceBusy] = useState(false);
  const [ocrWorkspaceError, setOcrWorkspaceError] = useState('');

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
  const handleApplyMemory = (
    targetBlockIdOverride?: number | null,
    sourceItemKeys?: string[],
  ) => {
    const memoryElementBySourceKey = new Map(
      memoryElements.map(element => [memoryElementKey(element), element] as const),
    );
    const requestedElements = sourceItemKeys === undefined
      ? memoryElements
      : sourceItemKeys
        .map((itemKey) => {
          const rawKey = String(itemKey).replace(/^PAGE_SCANNER:/, '');
          return memoryElementBySourceKey.get(rawKey);
        })
        .filter((element): element is ElementDTO => Boolean(element));
    const activeMemoryElements = requestedElements.filter(isElementActive);
    const targetBlockId = targetBlockIdOverride === undefined
      ? memoryTargetBlockId
      : targetBlockIdOverride;
    if (targetBlockId === null || activeMemoryElements.length === 0 || memoryApplyBusy) return;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected. Cannot apply scanner memory list.');
      return;
    }

    const targetBlock = memoryBlockOptions.find((block) => block.blockId === targetBlockId);
    if (!targetBlock) return;

    const elementKeys = activeMemoryElements.map(memoryElementKey);
    const previousApply = pendingPageScannerApplyRef.current;
    const repeatsUnacknowledgedApply = Boolean(
      previousApply
      && previousApply.elementKeys.length === elementKeys.length
      && previousApply.elementKeys.every((key, index) => key === elementKeys[index]),
    );
    const requestId = repeatsUnacknowledgedApply
      ? previousApply!.requestId
      : createPageScannerRequestId('page-scanner-apply');
    const payload = {
      requestId,
      targetBlockId: targetBlock.blockId,
      blockId: targetBlock.blockId,
      blockName: targetBlock.blockName,
      blockOrderNumber: targetBlock.blockOrderNumber,
      elementDetails: activeMemoryElements,
    };
    const message = isDetachedPageScanner
      ? {
        type: 'pageScanner.apply',
        homeBankingId,
        botJobId,
        botJobName,
        sessionId,
        body: JSON.stringify(payload),
      }
      : {
        type: 'SEND_ALL_ELEMENTS_DTO',
        homeBankingId,
        botJobId,
        botJobName,
        sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
        ...payload,
      };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('Sent scanner memory apply:', message);
      if (isDetachedPageScanner) {
        pendingPageScannerApplyRef.current = {
          requestId,
          elementKeys,
        };
        setMemoryApplyBusy(true);
        if (pageScannerApplyTimerRef.current) clearTimeout(pageScannerApplyTimerRef.current);
        pageScannerApplyTimerRef.current = setTimeout(() => {
          setMemoryApplyBusy(false);
          setAlertMessageHeader('Apply acknowledgement pending');
          setAlertMessageBody(
            'The selected elements remain in Memory List. Apply again to safely retry the same request.',
          );
        }, 15000);
      } else {
        setMemoryElements([]);
      }
    } catch (error) {
      console.error('Error sending scanner memory apply:', error);
      setMemoryApplyBusy(false);
    }
  };

  useEffect(() => {
    if (!isDetachedPageScanner || connected) return;
    if (pageScannerApplyTimerRef.current) {
      clearTimeout(pageScannerApplyTimerRef.current);
      pageScannerApplyTimerRef.current = null;
    }
    setMemoryApplyBusy(false);
    setCreateBlockBusy(false);
    if (locatorRequestRef.current || locatorApplyRef.current) {
      clearLocatorGenerateRequest();
      clearLocatorApplyRequest();
      setLocatorError(
        'The Page Scanner connection was lost before the locator request was confirmed. Reconnect and refresh or rescan before retrying.',
      );
    }
    if (pendingPageScannerRequestsRef.current.size > 0) {
      clearPendingPageScannerRequests();
      setPreScanStatus((current) => ({
        ...current,
        status: 'failed',
        message: 'Page Scanner connection was lost before the operation was acknowledged.',
      }));
    }
  }, [connected, isDetachedPageScanner]);

  const handleCreateNewBlock = (newBlockName: string, position: CreateBlockPosition) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setAlertMessageHeader('Could not create block');
      setAlertMessageBody('Page Scanner is not connected. The block was not submitted.');
      return;
    }

    const pending = pendingPageScannerCreateBlockRef.current;
    const requestId = isDetachedPageScanner && pending
      ? pending.requestId
      : createPageScannerRequestId('page-scanner-create-block');
    const payload: PageScannerCreateBlockPayload = isDetachedPageScanner && pending
      ? pending.payload
      : {
        requestId,
        blockName: newBlockName,
        insertPosition: position.type === 'end' ? 'END' : 'BEFORE',
        beforeBlockId: position.type === 'before' ? position.blockId : -1,
        beforeBlockOrderNumber: position.type === 'before' ? position.blockOrderNumber : -1,
      };
    const message = isDetachedPageScanner
      ? {
        type: 'pageScanner.createBlock',
        botJobId,
        botJobName,
        homeBankingId,
        sessionId,
        body: JSON.stringify(payload),
      }
      : {
        type: 'BLOCK_CREATE',
        botJobId,
        botJobName,
        homeBankingId,
        sessionId: SCANNER_ELEMENT_PANE_SESSION_ID,
        ...payload,
      };

    if (isDetachedPageScanner && !pending) {
      pendingPageScannerCreateBlockRef.current = { requestId, payload };
      setCreateBlockRequestPending(true);
    }

    try {
      webSocket.send(JSON.stringify(message));
      console.log('Sent BLOCK_CREATE from scanner memory:', message);
      if (isDetachedPageScanner) {
        setCreateBlockBusy(true);
        if (pageScannerCreateBlockTimerRef.current) {
          clearTimeout(pageScannerCreateBlockTimerRef.current);
        }
        pageScannerCreateBlockTimerRef.current = setTimeout(() => {
          pageScannerCreateBlockTimerRef.current = null;
          setCreateBlockBusy(false);
          setAlertMessageHeader('Create block acknowledgement pending');
          setAlertMessageBody(
            'The request remains unchanged. Click Retry to safely check the same block creation request.',
          );
        }, PAGE_SCANNER_RESPONSE_TIMEOUT_MS);
      } else {
        setCreateBlockOpen(false);
      }
    } catch (err) {
      console.log('Error sending BLOCK_CREATE from scanner memory:', err);
      setCreateBlockBusy(false);
      setAlertMessageHeader('Could not create block');
      setAlertMessageBody(
        err instanceof Error ? err.message : 'The block creation request could not be sent.',
      );
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
    // Once a retarget has retired this logical scanner identity, ignore every late envelope
    // until React key-remounts the component for the fresh session.
    if (pageScannerRetiredRef.current) return;

    // useWebSocket clears its message array when it reconnects. Reset the cursor before
    // returning on that empty transition so the first bootstrap/retarget message on the
    // replacement transport is not skipped as though it belonged to the old array.
    if (messages.length < lastProcessedIndexRef.current) {
      lastProcessedIndexRef.current = 0;
    }
    if (messages.length === 0) return;

    const tryParse = (val: any) => {
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    // A detached workspace has an unguessable, transport-authoritative identity and
    // must never consume another scanner's events. Legacy embedded scanner surfaces
    // retain their broader routing until that protocol is removed.
    const acceptedSessions = isDetachedPageScanner
      ? new Set([sessionId])
      : new Set([
        sessionId,
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

        if (!acceptedSessions.has(parsedMessage.sessionId)) continue;

        const bodyData = tryParse(parsedMessage.body);

        switch (parsedMessage.operationId) {
          case 'memoryList.openResponse': {
            if (String(bodyData?.requestId || '') !== memoryListOpenPendingRequestRef.current) break;
            memoryListOpenPendingRequestRef.current = null;
            const ownerEpoch = String(bodyData?.ownerEpoch || '');
            if (bodyData?.ok === false || !ownerEpoch) {
              memoryListOpenedRef.current = false;
              memoryListOpenRequestedRef.current = false;
              memoryListOwnerEpochRef.current = '';
              setAlertMessageHeader('Memory List not opened');
              setAlertMessageBody(String(
                bodyData?.message || bodyData?.error || 'Memory List workspace could not be opened.',
              ));
            } else {
              memoryListOwnerEpochRef.current = ownerEpoch;
              memoryListOpenedRef.current = true;
              memoryListOpenRequestedRef.current = false;
              setMemoryListOpenVersion(version => version + 1);
            }
            break;
          }
          case 'memoryList.syncResponse': {
            if (
              bodyData?.ok === false
              && String(bodyData?.ownerEpoch || '') === memoryListOwnerEpochRef.current
            ) {
              memoryListOpenedRef.current = false;
              memoryListOwnerEpochRef.current = '';
            }
            break;
          }
          case 'memoryList.command': {
            const command = String(bodyData?.command || bodyData?.action || '').toUpperCase();
            const payload = bodyData?.payload && typeof bodyData.payload === 'object'
              ? bodyData.payload
              : bodyData;
            if (Number(bodyData?.botJobId) !== Number(botJobId)) break;

            if (command === 'REMOVE') {
              const itemKey = String(
                payload?.sourceItemKey
                ?? payload?.item?.sourceItemKey
                ?? payload?.itemKey
                ?? '',
              ).replace(/^PAGE_SCANNER:/, '');
              setMemoryElements(previous =>
                previous.filter(element => memoryElementKey(element) !== itemKey)
              );
            } else if (command === 'CLEAR') {
              setMemoryElements([]);
            } else if (command === 'SELECT_TARGET_BLOCK') {
              const selectedBlockId = Number(payload?.blockId);
              setMemoryTargetBlockId(
                Number.isFinite(selectedBlockId) && selectedBlockId > 0 ? selectedBlockId : null,
              );
            } else if (command === 'APPLY') {
              const requestedTargetBlockId = Number(payload?.targetBlockId);
              const requestedSourceItemKeys = Array.isArray(payload?.sourceItemKeys)
                ? payload.sourceItemKeys.map((itemKey: unknown) => String(itemKey))
                : undefined;
              handleApplyMemory(
                Number.isFinite(requestedTargetBlockId) && requestedTargetBlockId > 0
                  ? requestedTargetBlockId
                  : null,
                requestedSourceItemKeys,
              );
            } else if (command === 'REORDER') {
              // The aggregate Memory List owns the mixed-source display order.
              // Producers apply the ordered sourceItemKeys routed with APPLY.
            } else if (command === 'CREATE_BLOCK') {
              const blockName = String(payload?.blockName || '').trim();
              if (!blockName) break;
              const rawPosition = payload?.position;
              const position: CreateBlockPosition = rawPosition?.type === 'before'
                ? {
                  type: 'before',
                  blockId: Number(rawPosition.blockId),
                  blockOrderNumber: Number(rawPosition.blockOrderNumber),
                  blockName: String(rawPosition.blockName || ''),
                }
                : { type: 'end' };
              handleCreateNewBlock(blockName, position);
            }
            break;
          }
          case 'pageScanner.workspaceRetarget': {
            const retarget = pageScannerWorkspaceRetarget(
              bodyData,
              sessionId,
              isPageScannerWorkspaceSession,
            );
            if (!retarget) break;

            // A repeated open for the same Bot Job is a focus request only. Keeping the
            // exact session mounted preserves the current scan, Memory List, and pending work.
            if (pageScannerRetargetDisposition(retarget, sessionId) === 'FOCUS_ONLY') {
              try {
                window.focus();
              } catch {
                // Native focus is best-effort and may be refused by the window manager.
              }
              onWorkspaceNotice?.('Page Scanner workspace already open.');
              break;
            }

            // A different Bot Job receives a fresh logical scanner identity. Updating the
            // route and parent session causes the keyed PageScannerWorkspace to remount, so
            // no grid, Memory List, dialog, timer, or request state crosses Bot Jobs.
            const targetUrl = new URL(window.location.href);
            targetUrl.searchParams.set('openPageScanner', 'preScan');
            targetUrl.searchParams.set('pageScannerSession', retarget.sessionId);
            window.history.replaceState(window.history.state, '', targetUrl.toString());
            try {
              window.focus();
            } catch {
              // Native focus is best-effort and may be refused by the window manager.
            }
            pageScannerRetiredRef.current = true;
            onSessionOpen(retarget.sessionId, socketPort, retarget.botJobId);
            lastProcessedIndexRef.current = messages.length;
            return;
          }

          case 'pageScannerProfile.listResponse':
          case 'pageScannerProfile.saveResponse':
          case 'pageScannerProfile.deleteResponse': {
            const resolution = resolvePageScannerProfileResponse(
              parsedMessage.operationId,
              bodyData,
              pendingPageScannerProfileRequestsRef.current,
              pageScannerProfiles,
              dashboardFocus,
            );
            if (!resolution) break;

            pendingPageScannerProfileRequestsRef.current.delete(resolution.requestId);
            setPageScannerProfileBusy(null);
            if (resolution.replaceProfiles) {
              setPageScannerProfiles(current => (
                pageScannerProfilesEqual(current, resolution.profiles)
                  ? current
                  : resolution.profiles
              ));
            }
            if (!resolution.ok) {
              setPageScannerProfileError(resolution.error);
              break;
            }
            setPageScannerProfileError('');
            if (resolution.selectedProfileKey) {
              selectDashboardProfile(resolution.selectedProfileKey, resolution.profiles);
            }
            break;
          }

          case PAGE_SCANNER_LOCATOR_GENERATE_RESPONSE: {
            if (!bodyData || bodyData.requestId !== locatorRequestRef.current) break;
            clearLocatorGenerateRequest();
            if (bodyData.ok === false) {
              setLocatorResults([]);
              setLocatorWarning('');
              setLocatorError(bodyData.message || bodyData.warning || 'Locator generation failed.');
            } else {
              setLocatorError('');
              setLocatorWarning(typeof bodyData.warning === 'string' ? bodyData.warning : '');
              setLocatorResults(Array.isArray(bodyData.controls) ? bodyData.controls : []);
            }
            break;
          }

          case PAGE_SCANNER_LOCATOR_APPLY_RESPONSE: {
            const pendingApply = locatorApplyRef.current;
            const resolution = resolvePageScannerLocatorApplyResponse(bodyData, pendingApply);
            if (resolution.status === 'stale' || !pendingApply) break;
            clearLocatorApplyRequest();
            if (resolution.status === 'error') {
              setLocatorError(resolution.message);
              break;
            }
            setLocatorCommittedUpdate({ pending: pendingApply, element: resolution.element });
            break;
          }

          case PAGE_SCANNER_ELEMENT_RENAME_RESPONSE: {
            const pendingRename = pageScannerElementRenameRef.current;
            const resolution = resolvePageScannerElementRenameResponse(bodyData, pendingRename);
            if (resolution.status === 'stale' || !pendingRename) break;
            if (pageScannerElementRenameTimerRef.current) {
              clearTimeout(pageScannerElementRenameTimerRef.current);
              pageScannerElementRenameTimerRef.current = null;
            }
            pageScannerElementRenameRef.current = null;
            if (resolution.status === 'error') {
              setPreScanStatus((current) => ({
                ...current,
                status: 'failed',
                message: resolution.message,
              }));
              break;
            }
            setElementDTO((current) => replacePageScannerElementAlias(
              current,
              pendingRename.elementKey,
              resolution.clientNamed,
            ).elements);
            setElementGrouped((current) => replacePageScannerGroupedElementAlias(
              current,
              pendingRename.elementKey,
              resolution.clientNamed,
            ));
            setMemoryElements((current) => replacePageScannerElementAlias(
              current,
              pendingRename.elementKey,
              resolution.clientNamed,
            ).elements);
            setEditingElementId(null);
            setEditingElementTagName(null);
            setPreScanStatus((current) => ({
              ...current,
              status: 'done',
              message: 'Page Scanner name saved.',
            }));
            break;
          }

          case 'pageScanner.scanResponse':
          case 'pageScanner.refreshResponse':
          case 'pageScanner.clearResponse':
          case 'pageScanner.testElementResponse': {
            const expectedOperation = pageScannerRequestForResponse(parsedMessage.operationId);
            if (!expectedOperation) break;
            const pending = takePageScannerRequest(bodyData?.requestId, expectedOperation);
            if (!pending) break;
            const responseMessage = String(
              bodyData?.message
              || (bodyData?.ok === false
                ? 'The Page Scanner operation failed.'
                : 'Page Scanner operation accepted.'),
            );
            if (bodyData?.ok === false) {
              setPreScanStatus((current) => ({
                ...current,
                status: 'failed',
                message: responseMessage,
              }));
              break;
            }
            if (expectedOperation === 'pageScanner.clear') {
              handleClearGridAll();
              setPreScanStatus({ status: 'idle', message: responseMessage, elementCount: 0 });
              break;
            }
            setPreScanStatus((current) => {
              if (['done', 'empty', 'failed'].includes(current.status)) return current;
              return { ...current, status: 'waiting', message: responseMessage };
            });
            break;
          }

          case 'pageScanner.errorResponse': {
            const responseRequestId = typeof bodyData?.requestId === 'string'
              ? bodyData.requestId
              : '';
            if (
              responseRequestId
              && responseRequestId === memoryListOpenPendingRequestRef.current
            ) {
              memoryListOpenPendingRequestRef.current = null;
              memoryListOpenedRef.current = false;
              memoryListOpenRequestedRef.current = false;
              memoryListOwnerEpochRef.current = '';
              setAlertMessageHeader('Memory List not opened');
              setAlertMessageBody(String(
                bodyData?.message || bodyData?.error || 'Memory List workspace could not be opened.',
              ));
              break;
            }
            if (responseRequestId && responseRequestId === locatorRequestRef.current) {
              clearLocatorGenerateRequest();
              setLocatorError(String(
                bodyData?.message || bodyData?.error || 'Locator generation failed.',
              ));
              break;
            }
            if (responseRequestId && responseRequestId === locatorApplyRef.current?.requestId) {
              clearLocatorApplyRequest();
              setLocatorError(String(
                bodyData?.message || bodyData?.error || 'The XPath was not applied.',
              ));
              break;
            }
            const closeReason = pageScannerWorkspaceCloseReason(bodyData);
            if (closeReason) {
              retireDetachedPageScanner(closeReason, bodyData?.message);
              break;
            }
            takePageScannerRequest(bodyData?.requestId);
            setPreScanStatus((current) => ({
              ...current,
              status: 'failed',
              message: String(
                bodyData?.message || bodyData?.error || 'The Page Scanner operation failed.',
              ),
            }));
            break;
          }

          case 'pageScanner.workspaceClosed': {
            const closeReason = pageScannerWorkspaceCloseReason(bodyData);
            if (closeReason) {
              retireDetachedPageScanner(closeReason, bodyData?.message);
            } else {
              const message = String(bodyData?.message || 'The Page Scanner workspace was closed.');
              clearPendingPageScannerRequests();
              setPageScannerBootstrapError(message);
              setPreScanStatus((current) => ({ ...current, status: 'failed', message }));
            }
            break;
          }

          case 'pageScannerWorkspace.bootstrapResponse': {
            if (
              !pageScannerBootstrapRequestRef.current
              || bodyData?.requestId !== pageScannerBootstrapRequestRef.current
            ) break;
            pageScannerBootstrapRequestRef.current = null;
            if (bodyData?.ok === false) {
              setPageScannerBootstrapError(String(
                bodyData?.message || bodyData?.error || 'Page Scanner details could not be loaded.',
              ));
              break;
            }
            setPageScannerBootstrapError('');
            if (pendingPageScannerRequestsRef.current.size === 0) {
              setPreScanStatus((current) => current.status === 'failed'
                ? { status: 'idle', message: 'Ready', elementCount: current.elementCount }
                : current);
            }
            if (Number(bodyData?.homeBankingId) > 0) setHomeBankingId(Number(bodyData.homeBankingId));
            if (Number(bodyData?.botJobId) > 0) setBotJobId(Number(bodyData.botJobId));
            if (typeof bodyData?.botJobName === 'string') setBotJobName(bodyData.botJobName);
            setMemoryBlockOptions((prev) => normalizeBlockOptions([
              ...prev,
              ...blockOptionsFromPayload(bodyData),
            ]));
            break;
          }

          case 'pageScanner.status':
          case "preScanStatus": {
            const status = String(bodyData?.status ?? 'idle') as PreScanStatus['status'];
            setPreScanStatus({
              status: ['idle', 'waiting', 'running', 'done', 'empty', 'failed'].includes(status) ? status : 'idle',
              message: String(bodyData?.message ?? ''),
              elementCount: Number(bodyData?.elementCount ?? 0),
            });
            break;
          }

          case 'pageScanner.reset': {
            setElementDTO([]);
            setElementGrouped({});
            setKeepSelectedIds(new Set());
            setIsElementGrouped(false);
            break;
          }

          case 'pageScanner.chunk':
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
            setElementDTO((prev) => applyPageScannerAliasesByXPath(prev, byXPath));
            setMemoryElements((prev) => applyPageScannerAliasesByXPath(prev, byXPath));
            // Trigger a re-grouping so the row labels refresh from the new clientNamed values.
            setIsElementGrouped(false);
            console.log(`[applyOcrSuggestions] applied ${byXPath.size} OCR-derived clientNamed value(s).`);
            break;
          }

          case "ocrWorkspace.openResponse": {
            setOcrWorkspaceBusy(false);
            setOcrWorkspaceError(bodyData?.ok === false
              ? String(bodyData?.message || bodyData?.error || 'OCR workspace could not be opened.')
              : '');
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

          case 'pageScanner.createBlockResponse': {
            const pendingCreate = pendingPageScannerCreateBlockRef.current;
            if (!pendingCreate || bodyData?.requestId !== pendingCreate.requestId) break;
            if (pageScannerCreateBlockTimerRef.current) {
              clearTimeout(pageScannerCreateBlockTimerRef.current);
              pageScannerCreateBlockTimerRef.current = null;
            }
            setCreateBlockBusy(false);
            const createdBlockId = Number(bodyData?.blockId ?? bodyData?.createdBlockId);
            const committed = bodyData?.committed === true
              || (Number.isFinite(createdBlockId) && createdBlockId > 0);
            pendingPageScannerCreateBlockRef.current = null;
            setCreateBlockRequestPending(false);
            if (!committed && bodyData?.ok === false) {
              setAlertMessageHeader('Could not create block');
              setAlertMessageBody(String(bodyData?.message || bodyData?.error || 'The block was not created.'));
              break;
            }
            setMemoryBlockOptions((prev) => normalizeBlockOptions([
              ...prev,
              ...blockOptionsFromPayload(bodyData),
            ]));
            if (Number.isFinite(createdBlockId) && createdBlockId > 0) {
              setMemoryTargetBlockId(createdBlockId);
            }
            setCreateBlockOpen(false);
            if (bodyData?.warningCode || bodyData?.synchronized === false || bodyData?.ok === false) {
              setAlertMessageHeader('Block created with a warning');
              setAlertMessageBody(String(
                bodyData?.message || 'The block was created, but the refreshed block list is not available yet.',
              ));
            }
            break;
          }

          case 'pageScanner.applyResponse': {
            const pendingApply = pendingPageScannerApplyRef.current;
            if (!pendingApply || bodyData?.requestId !== pendingApply.requestId) break;
            pendingPageScannerApplyRef.current = null;
            setMemoryApplyBusy(false);
            if (pageScannerApplyTimerRef.current) {
              clearTimeout(pageScannerApplyTimerRef.current);
              pageScannerApplyTimerRef.current = null;
            }
            const committed = bodyData?.committed === true
              || (bodyData?.committed == null && bodyData?.ok !== false);
            if (!committed) {
              setAlertMessageHeader('Could not add instructions');
              setAlertMessageBody(String(
                bodyData?.message || bodyData?.error || 'The selected elements remain in Memory List.',
              ));
              break;
            }
            const acknowledgedKeys = new Set(pendingApply.elementKeys);
            setMemoryElements((prev) => prev.filter((element) => !acknowledgedKeys.has(memoryElementKey(element))));
            if (bodyData?.synchronized === false || bodyData?.warningCode) {
              setAlertMessageHeader('Instructions added with a warning');
              setAlertMessageBody(String(
                bodyData?.message
                || 'Instructions were saved, but Bot Job Details could not refresh in real time.',
              ));
            }
            break;
          }

          case 'pageScanner.closeResponse': {
            if (
              !pageScannerCloseRequestRef.current
              || bodyData?.requestId !== pageScannerCloseRequestRef.current
            ) break;
            pageScannerCloseRequestRef.current = null;
            if (pageScannerCloseTimerRef.current) {
              clearTimeout(pageScannerCloseTimerRef.current);
              pageScannerCloseTimerRef.current = null;
            }
            returnToMainDashboard();
            break;
          }

          case SCANNER_SEND_DOM_REVIEW_OPERATION: {
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

          case SCANNER_REQUEST_SUPPORT_OPERATION: {
            const reqData: SupportRequestData = {
              url: bodyData?.url || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
            };
            setSupportReqData(reqData);
            break;
          }

          case SCANNER_REQUEST_SUPPORT_ELEMENTS_OPERATION: {
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
  }, [isDetachedPageScanner, messages, sessionId]);

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

  useEffect(() => {
    if (!locatorTargetKey) return;
    if (elementDTO.some((element) => pageScannerLocatorElementKey(element) === locatorTargetKey)) return;
    setLocatorTargetKey('');
    setLocatorFeedback('');
  }, [elementDTO, locatorTargetKey]);

  useEffect(() => {
    if (!locatorCommittedUpdate) return;
    const { pending, element: authoritativeElement } = locatorCommittedUpdate;
    setLocatorCommittedUpdate(null);

    const currentTarget = elementDTO.find(
      (element) => pageScannerLocatorElementKey(element) === pending.elementKey,
    );
    if (!currentTarget) {
      setLocatorFeedback('');
      setLocatorError(
        'The XPath was persisted, but its scanned row is no longer in the grid. Refresh or rescan to load the saved value.',
      );
      return;
    }

    setElementDTO((current) => replacePageScannerLocatorElement(
      current,
      pending.elementKey,
      authoritativeElement,
    ).elements);
    setElementGrouped((current) => replacePageScannerLocatorGroupedElement(
      current,
      pending.elementKey,
      authoritativeElement,
    ));
    setMemoryElements((current) => replacePageScannerLocatorElement(
      current,
      pending.elementKey,
      authoritativeElement,
    ).elements);
    const updatedTarget = { ...currentTarget, ...authoritativeElement };
    setLocatorTargetKey(pageScannerLocatorElementKey(updatedTarget));
    setLocatorError('');
    setLocatorFeedback(
      `XPath applied to ${pageScannerLocatorElementLabel(updatedTarget)}. `
      + 'Use Memory List > Apply when you are ready to add it to the Bot Job.',
    );
  }, [elementDTO, locatorCommittedUpdate]);


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
    const allElements = Object.values(elementGrouped)
      .flatMap(group => group.elements)
      .filter(isElementActive);
    if (allElements.length === 0) {
      setAlertMessageHeader('No active elements to insert');
      setAlertMessageBody('Activate at least one scanned element before inserting all elements.');
      setIsSendingAll(false);
      return;
    }

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
    const allElements = Object.values(elementGrouped)
      .flatMap(group => group.elements)
      .filter(isElementActive);
    if (allElements.length === 0) {
      setAlertMessageHeader('No active elements to update');
      setAlertMessageBody('Activate at least one scanned element before updating all elements.');
      setIsUpdatingAll(false);
      return;
    }

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
    const actionAllowedWhenInactive = action === "HOVERED_ROW" || action === "DETAILS_ELEMENT_DTO";
    if (!isElementActive(elementDTO) && !actionAllowedWhenInactive) {
      setAlertMessageHeader('Element is inactive');
      setAlertMessageBody('Activate this scanned element before saving or testing it.');
      return;
    }

    const sessionDestine = action === "HOVERED_ROW"
      ? SCANNER_TOOL_SESSION_ID
      : SCANNER_ELEMENT_PANE_SESSION_ID;

    if (
      isDetachedPageScanner
      && (action === 'TEST_INPUT_DTO' || action === 'TEST_CLICK_DTO')
    ) {
      const requestId = createPageScannerRequestId('page-scanner-test-element');
      const testedElement = action === 'TEST_INPUT_DTO'
        ? { ...elementDTO, defaultValue: SCANNER_TEST_INPUT_VALUE }
        : elementDTO;
      const payload = {
        requestId,
        action,
        testAction: action === 'TEST_INPUT_DTO' ? 'input' : 'click',
        elementDetails: [testedElement],
      };
      const message = {
        type: 'pageScanner.testElement',
        homeBankingId,
        botJobId,
        botJobName,
        sessionId,
        body: JSON.stringify(payload),
      };
      try {
        webSocket.send(JSON.stringify(message));
        trackPageScannerRequest(requestId, 'pageScanner.testElement');
        setPreScanStatus((current) => ({
          ...current,
          status: 'waiting',
          message: action === 'TEST_INPUT_DTO'
            ? 'Starting Page Scanner input test...'
            : 'Starting Page Scanner click test...',
        }));
        console.log('Sent detached Page Scanner element test:', message);
      } catch (error) {
        console.error('Error sending Page Scanner element test:', error);
        setPreScanStatus((current) => ({
          ...current,
          status: 'failed',
          message: error instanceof Error
            ? error.message
            : 'The Page Scanner element test could not be sent.',
        }));
      }
      return;
    }

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
    const activeElements = elements.filter(isElementActive);
    if (activeElements.length === 0) {
      setAlertMessageHeader('No active inputs to test');
      setAlertMessageBody('Activate at least one input in this block before running the block input test.');
      return;
    }
    activeElements.forEach((element) => {
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

    const requestId = createPageScannerRequestId('page-scanner-command');
    const payload = {
      requestId,
      focusProfile: dashboardFocus,
      searchTerms: dashboardSearchText,
      searchHiddenFields: dashboardSearchHidden,
      ...extra,
    };
    const detachedOperation = type === PRE_SCAN_PAGE_OPERATION
      ? 'pageScanner.scan'
      : type === PRE_SCAN_REFRESH_PAGE_OPERATION
        ? 'pageScanner.refresh'
        : type === PRE_SCAN_CLEAR_GRID_OPERATION
          ? 'pageScanner.clear'
          : type;
    const message = isDetachedPageScanner
      ? {
        type: detachedOperation,
        homeBankingId,
        botJobId,
        botJobName,
        sessionId,
        body: JSON.stringify(payload),
      }
      : {
        type,
        homeBankingId,
        botJobId,
        botJobName,
        sessionId: PRE_SCANNER_GRID_SESSION_ID,
        ...payload,
      };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("Sent pre-scan dashboard command:", message);
      if (
        isDetachedPageScanner
        && ['pageScanner.scan', 'pageScanner.refresh', 'pageScanner.clear'].includes(detachedOperation)
      ) {
        const operation = detachedOperation as PageScannerRequestOperation;
        trackPageScannerRequest(requestId, operation);
        const messageByOperation: Record<string, string> = {
          'pageScanner.scan': 'Starting Page Scanner...',
          'pageScanner.refresh': 'Refreshing the scanner web page...',
          'pageScanner.clear': 'Clearing the Page Scanner grid...',
        };
        setPreScanStatus((current) => ({
          ...current,
          status: 'waiting',
          message: messageByOperation[operation],
        }));
      }
    } catch (error) {
      console.error("Error sending pre-scan dashboard command:", error);
      if (isDetachedPageScanner) {
        setPreScanStatus((current) => ({
          ...current,
          status: 'failed',
          message: error instanceof Error
            ? error.message
            : 'The Page Scanner operation could not be sent.',
        }));
      }
    }
  };

  const openOcrWorkspace = (
    kind: OcrWorkspaceKind,
    scope: Record<string, unknown> = {},
  ) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setOcrWorkspaceError('WebSocket is not connected.');
      return;
    }

    const requestedHomeBankingId = Number(scope.homeBankingId ?? homeBankingId);
    const requestedBotJobId = Number(scope.botJobId ?? botJobId);
    const requestedHomeUrlId = Number(scope.homeUrlId ?? 0);
    const parameters = Array.isArray(scope.parameters) ? scope.parameters : [];
    const requestId = `ocr-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const body = {
      requestId,
      kind,
      homeBankingId: requestedHomeBankingId,
      botJobId: requestedBotJobId,
      ...(requestedHomeUrlId > 0 ? { homeUrlId: requestedHomeUrlId } : {}),
      parameters,
    };

    setOcrWorkspaceBusy(true);
    setOcrWorkspaceError('');
    try {
      webSocket.send(JSON.stringify({
        type: 'ocrWorkspace.open',
        sessionId,
        homeBankingId: requestedHomeBankingId,
        botJobId: requestedBotJobId,
        body: JSON.stringify(body),
      }));
    } catch (sendError) {
      setOcrWorkspaceBusy(false);
      setOcrWorkspaceError(sendError instanceof Error
        ? sendError.message
        : 'OCR workspace could not be opened.');
    }
  };
  const openOcrConfig = (scope: Record<string, unknown> = {}) =>
    openOcrWorkspace(OCR_CONFIG_WORKSPACE_KIND, scope);
  const openOcrResults = (scope: Record<string, unknown> = {}) =>
    openOcrWorkspace(OCR_RESULTS_WORKSPACE_KIND, scope);

  const openPageMappings = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setOcrWorkspaceError('WebSocket is not connected.');
      return;
    }
    webSocket.send(JSON.stringify({
      type: 'pageMappings.open',
      sessionId,
      homeBankingId,
      body: JSON.stringify({ botJobId, homeBankingId }),
    }));
  };

  const handleDashboardFocusChange = (value: string) => {
    selectDashboardProfile(value);
  };

  const handleDashboardSearchTextChange = (value: string) => {
    setDashboardSearchText(value);
    const matchingProfile = pageScannerProfiles.find(profile => profile.searchTerms === value);
    setDashboardFocus(matchingProfile?.key || PAGE_SCANNER_CUSTOM_PROFILE_KEY);
  };

  const handleSavePageScannerProfile = (draft: PageScannerFocusProfileDraft) => {
    sendPageScannerProfileCommand(
      'pageScannerProfile.save',
      {
        ...(draft.id ? { id: draft.id } : {}),
        key: draft.key,
        label: draft.label,
        searchTerms: draft.searchTerms,
        sortOrder: draft.sortOrder,
      },
      draft.key,
    );
  };

  const handleDeletePageScannerProfile = (profile: PageScannerFocusProfile) => {
    if (profile.protected || profile.key === PAGE_SCANNER_DEFAULT_PROFILE_KEY) return;
    sendPageScannerProfileCommand(
      'pageScannerProfile.delete',
      {
        ...(profile.id ? { id: profile.id } : {}),
        key: profile.key,
      },
      profile.key,
    );
  };

  const handleRefreshPageScannerProfiles = () => sendPageScannerProfileCommand(
    'pageScannerProfile.list',
    {},
    dashboardFocus,
  );

  const handleDashboardClearGrid = () => {
    if (!isDetachedPageScanner) handleClearGridAll();
    sendDashboardCommand(PRE_SCAN_CLEAR_GRID_OPERATION);
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

    // Roadmap 3 Phase 3d: someText and definedName are frozen at JS-injection time
    // and must NEVER be overwritten — they're what the backend writes to instruction.name.
    // The renamed value the user typed lives in clientNamed (the easy display label),
    // which the backend persists into instruction.client_named on save.
    // If the user typed nothing OR typed back exactly what the display chain would have
    // produced from immutable fields (definedName / someText / tagName), clear the
    // override (null) so the row reverts to the canonical name.
    const typed = (elementName ?? "").trim();
    const clientNamed = normalizePageScannerClientNamed(typed, elementToUpdate);
    const elementKey = pageScannerLocatorElementKey(elementToUpdate);

    if (isDetachedPageScanner) {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        setPreScanStatus((current) => ({
          ...current,
          status: 'failed',
          message: 'Page Scanner is disconnected. The name was not changed.',
        }));
        return;
      }
      if (pageScannerElementRenameRef.current) return;
      const requestId = createPageScannerRequestId('page-scanner-element-rename');
      const pending: PendingPageScannerElementRename = {
        requestId,
        elementKey,
        target: elementToUpdate,
      };
      pageScannerElementRenameRef.current = pending;
      setPreScanStatus((current) => ({
        ...current,
        status: 'waiting',
        message: 'Saving Page Scanner name...',
      }));
      try {
        webSocket.send(JSON.stringify(pageScannerElementRenameMessage(
          { sessionId, homeBankingId, botJobId },
          pending,
          clientNamed,
        )));
        pageScannerElementRenameTimerRef.current = setTimeout(() => {
          if (pageScannerElementRenameRef.current?.requestId !== requestId) return;
          pageScannerElementRenameRef.current = null;
          pageScannerElementRenameTimerRef.current = null;
          setPreScanStatus((current) => ({
            ...current,
            status: 'failed',
            message: 'Page Scanner name save timed out. The current name was preserved.',
          }));
        }, PAGE_SCANNER_RESPONSE_TIMEOUT_MS);
      } catch (sendError) {
        pageScannerElementRenameRef.current = null;
        setPreScanStatus((current) => ({
          ...current,
          status: 'failed',
          message: sendError instanceof Error
            ? sendError.message
            : 'The Page Scanner name request could not be sent.',
        }));
      }
      return;
    }

    const updatedElements = elementDTO.map((element) => {
      if (pageScannerLocatorElementKey(element) !== elementKey) return element;
      return { ...element, clientNamed };
    });

    setElementDTO(updatedElements);
    setMemoryElements((current) => replacePageScannerElementAlias(
      current,
      elementKey,
      clientNamed,
    ).elements);
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
    setMemoryElements(prev =>
      prev.map(el => (el.id === elementId ? { ...el, forceCoordinates: nextForceCoordinates } : el))
    );
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
        type: SCANNER_SUPPORT_REQUEST_RESPONSE_OPERATION,
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
        type: SCANNER_REQUEST_SUPPORT_ELEMENTS_OPERATION,
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
        type: SCANNER_SUPPORT_REQUEST_ELEMENTS_RESPONSE_OPERATION,
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
        type: SCANNER_DOM_REVIEW_RESPONSE_OPERATION,
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
      {isDetachedPageScanner ? (
        <PageScannerWorkspaceHeader
          botJobId={botJobId}
          botJobName={botJobName}
          connected={connected}
          reconnectAttempts={reconnectAttempts}
          error={pageScannerBootstrapError || error}
          status={preScanStatus.message}
          statusTone={preScanStatus.status === 'failed'
            ? 'error'
            : preScanStatus.status === 'done'
              ? 'success'
              : preScanStatus.status === 'waiting' || preScanStatus.status === 'running'
                ? 'warning'
                : 'neutral'}
          closing={pageScannerClosing}
          webSocket={webSocket}
          messages={messages}
          sessionId={sessionId}
          onClose={closeDetachedPageScanner}
          onOpenPageMappings={openPageMappings}
        />
      ) : isPreScanMode ? (
        <BotJobDetailsChrome
          fallbackBotJobId={botJobId}
          fallbackBotJobName={botJobName}
          fallbackSurface="preScan"
          connected={connected}
          controller={{
            ...botJobHeader,
            sendAction: (action: Parameters<typeof botJobHeader.sendAction>[0]) => {
              if (action === 'CLOSE') {
                returnToMainDashboard();
                return;
              }
              botJobHeader.sendAction(action);
            },
          }}
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
      {ocrWorkspaceError && (
        <p className={styles.ocrWorkspaceError} role="alert">
          {ocrWorkspaceError}
        </p>
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
              onClick={() => sendDashboardCommand(PRE_SCAN_PAGE_OPERATION)}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Run the Playwright page scanner for the selected URL"
            >
              Page Scanner
            </button>
            <button
              type="button"
              className={styles.preScanIconButton}
              onClick={() => openOcrConfig()}
              disabled={ocrWorkspaceBusy}
              title="OCR Configuration"
            >
              OCR Config
            </button>
            <button
              type="button"
              className={styles.preScanButton}
              onClick={() => openOcrResults()}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting' || ocrWorkspaceBusy}
              title="Open highlighted OCR results for the newest page scan"
            >
              OCR Results
            </button>
            <button
              type="button"
              className={styles.preScanButton}
              onClick={openPageMappings}
              disabled={!botJobId || botJobId <= 0}
              title="Open historical Page Mappings captures"
            >
              Mappings
            </button>
            <button
              type="button"
              className={styles.preScanButton}
              onClick={() => sendDashboardCommand(PRE_SCAN_REFRESH_PAGE_OPERATION)}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Refresh the pre-scan browser page"
            >
              Refresh Web Page
            </button>
            <button
              type="button"
              className={`${styles.preScanButton} ${styles.preScanHiddenControl}`}
              onClick={() => sendDashboardCommand(PRE_SCAN_SEND_DOM_REVIEW_OPERATION)}
              title="Send sanitized HTML for review"
            >
              Send Pure HTML Review
            </button>
            <button
              type="button"
              className={`${styles.preScanButton} ${styles.preScanHiddenControl}`}
              onClick={() => sendDashboardCommand(PRE_SCAN_REQUEST_SUPPORT_OPERATION)}
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
            {isDetachedPageScanner && (
              <PageScannerExecutionControls
                connected={connected}
                jobState={botJobHeader.state}
                pendingToolbarAction={botJobHeader.pendingToolbarAction}
                operationBusy={Boolean(botJobHeader.pendingAction || botJobHeader.savingMetadata)}
                onToolbarAction={botJobHeader.sendToolbarAction}
              />
            )}
          </div>

          <div className={styles.preScanSearchRow}>
            <div className={styles.preScanFocusGroup}>
              <label className={styles.preScanLabel}>
                Focus:
                <select
                  className={styles.preScanSelect}
                  value={dashboardFocus}
                  onChange={(event) => handleDashboardFocusChange(event.target.value)}
                >
                  {dashboardFocus === PAGE_SCANNER_CUSTOM_PROFILE_KEY && (
                    <option value={PAGE_SCANNER_CUSTOM_PROFILE_KEY}>Custom (unsaved)</option>
                  )}
                  {pageScannerProfiles.map((profile) => (
                    <option key={profile.key} value={profile.key}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>
              {isDetachedPageScanner && (
                <button
                  type="button"
                  className={styles.preScanProfileManageButton}
                  title="Manage Page Scanner focus profiles"
                  aria-label="Manage Page Scanner focus profiles"
                  aria-expanded={pageScannerProfileEditorOpen}
                  onClick={() => setPageScannerProfileEditorOpen(true)}
                >
                  <Settings2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            <label className={styles.preScanLabel}>
              Search by:
              <input
                className={styles.preScanSearchInput}
                type="text"
                value={dashboardSearchText}
                onChange={(event) => handleDashboardSearchTextChange(event.target.value)}
                placeholder="button, input, attr:test-id, attr:data-testid"
              />
            </label>
            <label className={styles.preScanToggle}>
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
              onClick={() => sendDashboardCommand(PRE_SCAN_PAGE_OPERATION)}
              disabled={preScanStatus.status === 'running' || preScanStatus.status === 'waiting'}
              title="Run scanner with current focus and search terms"
            >
              Search
            </button>
          </div>
        </div>
      )}
      {isDetachedPageScanner && pageScannerProfileEditorOpen && (
        <PageScannerFocusProfileEditor
          profiles={pageScannerProfiles}
          selectedProfileKey={dashboardFocus}
          currentSearchTerms={dashboardSearchText}
          busy={pageScannerProfileBusy !== null}
          error={pageScannerProfileError}
          onSelect={handleDashboardFocusChange}
          onSave={handleSavePageScannerProfile}
          onDelete={handleDeletePageScannerProfile}
          onRefresh={handleRefreshPageScannerProfiles}
          onClose={() => setPageScannerProfileEditorOpen(false)}
        />
      )}
      <div className={styles.gridFindRow}>
        <FindBar
          value={findText}
          onChange={setFindText}
          memoryCount={canonicalMemoryItemCount}
          onOpenMemory={requestMemoryListOpen}
        />
        {isDetachedPageScanner && (
          <LocatorGeneratorPanel
            open={locatorPanelOpen}
            position={locatorPanelPos}
            elements={elementDTO}
            targetKey={locatorTargetKey}
            results={locatorResults}
            busy={locatorBusy}
            applying={locatorApplying}
            error={locatorError}
            warning={locatorWarning}
            feedback={locatorFeedback}
            onOpen={() => openLocatorPanel()}
            onClose={closeLocatorPanel}
            onDragStart={startLocatorPanelDrag}
            onTargetChange={(elementKey) => {
              setLocatorTargetKey(elementKey);
              setLocatorError('');
              setLocatorFeedback('');
            }}
            onGenerate={generateLocators}
            onApplyXPath={applyGeneratedXPath}
            onAddElementDTO={addGeneratedElementDTO}
            onAddAllElementDTO={addAllGeneratedElementDTO}
            onClearFeedback={clearLocatorFeedback}
          />
        )}
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

      {createBlockOpen && (
        <CreateNewBlock
          blocks={memoryBlockOptions}
          onCreate={handleCreateNewBlock}
          onClose={() => {
            if (!createBlockRequestPending) setCreateBlockOpen(false);
          }}
          pending={isDetachedPageScanner && createBlockRequestPending}
          submitting={isDetachedPageScanner && createBlockBusy}
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
            {/* Pane-dependent bulk actions are hidden in preScan mode. */}
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
                      className={`${styles.instructionItem} ${!isElementActive(elementDTO) ? styles.instructionItemInactive : ''}`}
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
                      <WebElementTypeToggle
                        className={styles.executionTypeToggle}
                        value={pageScannerExecutionTypeFor(elementDTO)}
                        onChange={(nextExecutionType) => {
                          handleElementExecutionTypeChange(elementDTO, nextExecutionType);
                        }}
                      />
                      {/* {showAttributes ? (
                        <div className="attr-slot">
                          <AttributeDropdown dataArray={elementDTO.attributeData} onChange={handleAttributeChange} />
                        </div>
                      ) : (
                        <span className="attr-slot">{"\u00A0".repeat(20)}</span>
                      )} */}
                      <div className={styles.optionsColumn}>
                        <img
                          src={isElementActive(elementDTO) ? activeImage : inactiveImage}
                          alt={isElementActive(elementDTO) ? 'Active' : 'Inactive'}
                          title={isElementActive(elementDTO) ? 'Deactivate element' : 'Activate element'}
                          className={isElementActive(elementDTO) ? styles.activeButton : styles.inactiveButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleElementActiveToggle(elementDTO);
                          }}
                        />
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
                        <img src={testInputImage} alt="Test Input" title="Test Input" className={styles.testButton} onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_INPUT_DTO")} />
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
