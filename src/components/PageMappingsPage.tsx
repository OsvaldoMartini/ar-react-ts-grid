import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import PageMappingsCachePanel, {
  PageMappingsCacheState,
} from './page-mappings/PageMappingsCachePanel';
import PageMappingsOcrReviewPanel from './page-mappings/PageMappingsOcrReviewPanel';
import PageMappingsRetentionPanel, {
  type PageMappingsRetentionState,
} from './page-mappings/PageMappingsRetentionPanel';
import type {
  PageMappingsOcrAliasChange,
  PageMappingsOcrCorrelation,
  PageMappingsOcrReviewResult,
} from './page-mappings/PageMappingsOcrReview.types';
import {
  PAGE_MAPPINGS_OCR_REVIEW_CONTRACT_VERSION,
  pageMappingsOcrFailureMatches,
  pageMappingsOcrMessage,
  parsePageMappingsOcrApply,
  parsePageMappingsOcrReview,
} from './page-mappings/PageMappingsOcrReview.types';
import { useWebSocket } from './useWebSocket';
import type {
  MemoryListItem,
  MemoryListItemIcon,
  MemoryListSnapshot,
  PageMappingsMemoryListPayload,
} from './memoryList.contract';
import styles from './PageMappingsPage.module.scss';

export const PAGE_MAPPINGS_SESSION_ID = 'pageMappingsManager';

type PageMappingsBinding = {
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
};

type PageMappingsBindingIdentity = Pick<
  PageMappingsBinding,
  'bindingEpoch' | 'workspaceEpoch' | 'homeBankingId' | 'botJobId'
>;

type Snapshot = {
  scanId: string;
  homeUrlId?: number;
  pageKey: string;
  pageUrl: string;
  capturedAt: string;
  elementCount: number;
  manifestSha256: string;
  status: 'READY' | 'FAILED' | 'STAGED' | string;
  pinned: boolean;
};

type CaptureElement = Record<string, unknown>;

type CaptureRectangle = {
  elementIndex: number;
  scannedElementId?: number;
  elementHash?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CaptureViewport = {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
  screenshotScope: 'VIEWPORT' | 'FULL_PAGE' | string;
};

type LoadedCapture = {
  requestId: string;
  bindingEpoch: string;
  scanId: string;
  pageKey: string;
  capturedAt: string;
  manifestSha256: string;
  elements: CaptureElement[];
  rectangles: CaptureRectangle[];
  viewport: CaptureViewport | null;
  screenshotBase64: string | null;
  screenshotMime: string;
};

type MappingMemoryItem = MemoryListItem<PageMappingsMemoryListPayload>;
type Props = { socketPort: number; sessionId: string; onClose?: () => void };
const RESCAN_TIMEOUT_MS = 120_000;
const OCR_REVIEW_TIMEOUT_MS = 120_000;
const RETENTION_TIMEOUT_MS = 30_000;

type RetentionCorrelation = PageMappingsBindingIdentity & {
  requestId: string;
};

type PendingRetention = RetentionCorrelation & (
  | { operation: 'pin'; scanId: string; pinned: boolean }
  | { operation: 'save'; retentionDays: number; maxUnpinnedPerPage: number }
  | {
    operation: 'purge';
    expectedRetentionDays: number;
    expectedMaxUnpinnedPerPage: number;
  }
);

const emptyCacheState: PageMappingsCacheState = {
  state: 'LOADING',
  message: 'Checking the active Playwright page…',
  browserAvailable: false,
  livePageKey: '',
  livePageUrl: '',
  liveNodeCount: 0,
  reusableScanId: '',
  comparedScanId: '',
};

const positiveInteger = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
};

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

const boundedInteger = (value: unknown, maximum: number): number | null => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maximum ? parsed : null;
};

const requestId = (purpose: string): string => {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `page-mappings-${purpose}-${Date.now()}-${random}`;
};

const parseBinding = (body: Record<string, unknown>): PageMappingsBinding | null => {
  const bindingEpoch = text(body.bindingEpoch);
  const workspaceEpoch = positiveInteger(body.workspaceEpoch);
  const homeBankingId = positiveInteger(body.homeBankingId);
  const botJobId = positiveInteger(body.botJobId);
  if (!bindingEpoch || !workspaceEpoch || !homeBankingId || !botJobId) return null;
  return {
    bindingEpoch,
    workspaceEpoch,
    homeBankingId,
    botJobId,
    botJobName: text(body.botJobName),
  };
};

const invalidationIdentity = (
  body: Record<string, unknown>,
  alternate: boolean,
): { present: boolean; identity: PageMappingsBindingIdentity | null } => {
  const fields = alternate
    ? ['alternateBindingEpoch', 'alternateWorkspaceEpoch', 'alternateHomeBankingId', 'alternateBotJobId'] as const
    : ['bindingEpoch', 'workspaceEpoch', 'homeBankingId', 'botJobId'] as const;
  const present = fields.some(field => Object.prototype.hasOwnProperty.call(body, field));
  const bindingEpoch = text(body[fields[0]]);
  const workspaceEpoch = positiveInteger(body[fields[1]]);
  const homeBankingId = positiveInteger(body[fields[2]]);
  const botJobId = positiveInteger(body[fields[3]]);
  return {
    present,
    identity: bindingEpoch && workspaceEpoch && homeBankingId && botJobId
      ? { bindingEpoch, workspaceEpoch, homeBankingId, botJobId }
      : null,
  };
};

const sameBindingIdentity = (
  active: PageMappingsBinding,
  candidate: PageMappingsBindingIdentity | null,
): boolean => Boolean(candidate
  && candidate.bindingEpoch === active.bindingEpoch
  && candidate.workspaceEpoch === active.workspaceEpoch
  && candidate.homeBankingId === active.homeBankingId
  && candidate.botJobId === active.botJobId);

const parseSnapshot = (value: unknown): Snapshot | null => {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const scanId = text(source.scanId);
  const pageKey = text(source.pageKey);
  const capturedAt = text(source.capturedAt);
  if (!scanId || !pageKey || !capturedAt) return null;
  const homeUrlId = positiveInteger(source.homeUrlId);
  return {
    scanId,
    ...(homeUrlId ? { homeUrlId } : {}),
    pageKey,
    pageUrl: text(source.pageUrl),
    capturedAt,
    elementCount: positiveInteger(source.elementCount),
    manifestSha256: text(source.manifestSha256),
    status: text(source.status),
    pinned: source.pinned === true,
  };
};

const parseRetention = (value: unknown): PageMappingsRetentionState | null => {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const retentionDays = boundedInteger(source.retentionDays, 3650);
  const maxUnpinnedPerPage = boundedInteger(source.maxUnpinnedPerPage, 1000);
  const readyCount = boundedInteger(source.readyCount, Number.MAX_SAFE_INTEGER);
  const pinnedCount = boundedInteger(source.pinnedCount, Number.MAX_SAFE_INTEGER);
  const eligibleCount = boundedInteger(source.eligibleCount, Number.MAX_SAFE_INTEGER);
  if (retentionDays === null
    || maxUnpinnedPerPage === null
    || readyCount === null
    || pinnedCount === null
    || eligibleCount === null
    || typeof source.enabled !== 'boolean') return null;
  return {
    retentionDays,
    maxUnpinnedPerPage,
    enabled: source.enabled,
    readyCount,
    pinnedCount,
    eligibleCount,
  };
};

const retentionCorrelation = (
  active: PageMappingsBinding | null,
): RetentionCorrelation | null => active ? {
  requestId: requestId('retention'),
  bindingEpoch: active.bindingEpoch,
  workspaceEpoch: active.workspaceEpoch,
  homeBankingId: active.homeBankingId,
  botJobId: active.botJobId,
} : null;

const retentionResponseMatches = (
  body: Record<string, unknown>,
  expected: RetentionCorrelation,
  allowOmittedAssertions: boolean,
): boolean => {
  if (text(body.requestId) !== expected.requestId) return false;
  const stringAssertionMatches = (field: 'bindingEpoch') => (
    allowOmittedAssertions && !Object.prototype.hasOwnProperty.call(body, field)
      ? true
      : text(body[field]) === expected[field]
  );
  const numberAssertionMatches = (
    field: 'workspaceEpoch' | 'homeBankingId' | 'botJobId',
  ) => (
    allowOmittedAssertions && !Object.prototype.hasOwnProperty.call(body, field)
      ? true
      : positiveInteger(body[field]) === expected[field]
  );
  return stringAssertionMatches('bindingEpoch')
    && numberAssertionMatches('workspaceEpoch')
    && numberAssertionMatches('homeBankingId')
    && numberAssertionMatches('botJobId');
};

const retentionFailureMatches = (
  body: Record<string, unknown>,
  expected: PendingRetention,
): boolean => {
  if (!retentionResponseMatches(body, expected, true)) return false;
  if (expected.operation === 'pin') {
    if (Object.prototype.hasOwnProperty.call(body, 'scanId')
      && text(body.scanId) !== expected.scanId) return false;
    if (Object.prototype.hasOwnProperty.call(body, 'pinned')
      && body.pinned !== expected.pinned) return false;
  }
  if (expected.operation === 'save') {
    if (Object.prototype.hasOwnProperty.call(body, 'retentionDays')
      && boundedInteger(body.retentionDays, 3650) !== expected.retentionDays) return false;
    if (Object.prototype.hasOwnProperty.call(body, 'maxUnpinnedPerPage')
      && boundedInteger(body.maxUnpinnedPerPage, 1000) !== expected.maxUnpinnedPerPage) return false;
  }
  if (expected.operation === 'purge') {
    if (Object.prototype.hasOwnProperty.call(body, 'expectedRetentionDays')
      && boundedInteger(body.expectedRetentionDays, 3650) !== expected.expectedRetentionDays) return false;
    if (Object.prototype.hasOwnProperty.call(body, 'expectedMaxUnpinnedPerPage')
      && boundedInteger(body.expectedMaxUnpinnedPerPage, 1000)
        !== expected.expectedMaxUnpinnedPerPage) return false;
  }
  return true;
};

const ocrCorrelation = (
  active: PageMappingsBinding | null,
  capture: LoadedCapture | null,
  selectedScanId: string | null,
  purpose: 'review' | 'apply',
): PageMappingsOcrCorrelation | null => {
  if (!active
    || !capture
    || capture.bindingEpoch !== active.bindingEpoch
    || capture.scanId !== selectedScanId
    || !capture.pageKey
    || !capture.capturedAt
    || !capture.manifestSha256) return null;
  return {
    contractVersion: PAGE_MAPPINGS_OCR_REVIEW_CONTRACT_VERSION,
    requestId: requestId(`ocr-${purpose}`),
    bindingEpoch: active.bindingEpoch,
    workspaceEpoch: active.workspaceEpoch,
    homeBankingId: active.homeBankingId,
    botJobId: active.botJobId,
    scanId: capture.scanId,
    pageKey: capture.pageKey,
    capturedAt: capture.capturedAt,
    manifestSha256: capture.manifestSha256,
  };
};

const currentOcrContextMatches = (
  active: PageMappingsBinding | null,
  capture: LoadedCapture | null,
  selectedScanId: string | null,
  expected: PageMappingsOcrCorrelation,
): boolean => Boolean(active
  && capture
  && active.bindingEpoch === expected.bindingEpoch
  && active.workspaceEpoch === expected.workspaceEpoch
  && active.homeBankingId === expected.homeBankingId
  && active.botJobId === expected.botJobId
  && capture.bindingEpoch === expected.bindingEpoch
  && capture.scanId === expected.scanId
  && selectedScanId === expected.scanId
  && capture.pageKey === expected.pageKey
  && capture.capturedAt === expected.capturedAt
  && capture.manifestSha256 === expected.manifestSha256);

const PageMappingsPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => { document.title = 'Page Mappings'; }, []);
  const windowCapability = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('windowCapability');
    return value && value.trim() ? value : '';
  }, []);
  const connectionQueryParameters = useMemo(() => windowCapability
    ? { windowCapability }
    : undefined, [windowCapability]);
  const { webSocket, connected, messages } = useWebSocket(
    socketPort,
    sessionId,
    connectionQueryParameters,
  );
  const sourceBotJobHint = useMemo(() => {
    const value = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }, []);

  const [binding, setBinding] = useState<PageMappingsBinding | null>(null);
  const bindingRef = useRef<PageMappingsBinding | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting to Page Mappings…');
  const [loadedCapture, setLoadedCapture] = useState<LoadedCapture | null>(null);
  const [elementSearch, setElementSearch] = useState('');
  const [captureLoading, setCaptureLoading] = useState(false);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [captureImageSize, setCaptureImageSize] = useState({ width: 0, height: 0 });
  const [memoryItems, setMemoryItems] = useState<MappingMemoryItem[]>([]);
  const [memoryOwnerEpoch, setMemoryOwnerEpoch] = useState('');
  const [cacheState, setCacheState] = useState<PageMappingsCacheState>(emptyCacheState);
  const [cacheBusy, setCacheBusy] = useState(false);
  const [rescanBusy, setRescanBusy] = useState(false);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const [retention, setRetention] = useState<PageMappingsRetentionState | null>(null);
  const [retentionOperation, setRetentionOperation] = useState<PendingRetention['operation'] | null>(null);
  const [retentionReloadRequired, setRetentionReloadRequired] = useState(false);
  const [retentionRevision, setRetentionRevision] = useState('');
  const [detailMode, setDetailMode] = useState<'explorer' | 'ocr-review'>('explorer');
  const [ocrReview, setOcrReview] = useState<PageMappingsOcrReviewResult | null>(null);
  const [ocrReviewBusy, setOcrReviewBusy] = useState(false);
  const [ocrApplyBusy, setOcrApplyBusy] = useState(false);
  const [ocrMessage, setOcrMessage] = useState('');
  const [invalidated, setInvalidated] = useState(false);
  const invalidatedRef = useRef(false);
  const bindingEstablishedRef = useRef(false);
  const memoryOwnerEpochRef = useRef('');
  const memoryOpenRequested = useRef(false);
  const memoryOpened = useRef(false);
  const workspaceCursor = useRef(0);
  const memoryCursor = useRef(0);
  const pendingBootstrap = useRef<string | null>(null);
  const pendingCapture = useRef<{ requestId: string; scanId: string; bindingEpoch: string } | null>(null);
  const pendingCache = useRef<{ requestId: string; bindingEpoch: string } | null>(null);
  const pendingRescan = useRef<{ requestId: string; bindingEpoch: string } | null>(null);
  const rescanTimer = useRef<number | null>(null);
  const pendingMemory = useRef<{ requestId: string; bindingEpoch: string } | null>(null);
  const pendingOcrReview = useRef<PageMappingsOcrCorrelation | null>(null);
  const pendingOcrApply = useRef<{
    correlation: PageMappingsOcrCorrelation;
    changes: PageMappingsOcrAliasChange[];
  } | null>(null);
  const ocrReviewTimer = useRef<number | null>(null);
  const ocrApplyTimer = useRef<number | null>(null);
  const pendingRetention = useRef<PendingRetention | null>(null);
  const retentionTimer = useRef<number | null>(null);
  const retentionReloadRequiredRef = useRef(false);

  const updateUrlHint = useCallback((botJobId: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sourceBotJobId', String(botJobId));
    url.searchParams.delete('homeBankingId');
    if (windowCapability) url.searchParams.set('windowCapability', windowCapability);
    window.history.replaceState(window.history.state, '', url);
  }, [windowCapability]);

  const retireRescan = useCallback((expectedRequestId?: string) => {
    if (expectedRequestId
      && pendingRescan.current?.requestId !== expectedRequestId) return;
    if (rescanTimer.current !== null) {
      window.clearTimeout(rescanTimer.current);
      rescanTimer.current = null;
    }
    pendingRescan.current = null;
    setRescanBusy(false);
  }, []);

  const retireOcrReview = useCallback((expectedRequestId?: string) => {
    if (expectedRequestId && pendingOcrReview.current?.requestId !== expectedRequestId) return;
    if (ocrReviewTimer.current !== null) {
      window.clearTimeout(ocrReviewTimer.current);
      ocrReviewTimer.current = null;
    }
    pendingOcrReview.current = null;
    setOcrReviewBusy(false);
  }, []);

  const retireOcrApply = useCallback((expectedRequestId?: string) => {
    if (expectedRequestId
      && pendingOcrApply.current?.correlation.requestId !== expectedRequestId) return;
    if (ocrApplyTimer.current !== null) {
      window.clearTimeout(ocrApplyTimer.current);
      ocrApplyTimer.current = null;
    }
    pendingOcrApply.current = null;
    setOcrApplyBusy(false);
  }, []);

  const retireRetention = useCallback((expectedRequestId?: string) => {
    if (expectedRequestId && pendingRetention.current?.requestId !== expectedRequestId) return;
    if (retentionTimer.current !== null) {
      window.clearTimeout(retentionTimer.current);
      retentionTimer.current = null;
    }
    pendingRetention.current = null;
    setRetentionOperation(null);
  }, []);

  const markRetentionReloadRequired = useCallback(() => {
    retentionReloadRequiredRef.current = true;
    setRetentionReloadRequired(true);
    setStorageReady(null);
    setRetention(null);
  }, []);

  const clearRetentionReloadRequired = useCallback(() => {
    retentionReloadRequiredRef.current = false;
    setRetentionReloadRequired(false);
  }, []);

  const clearOcrState = useCallback(() => {
    retireOcrReview();
    retireOcrApply();
    setOcrReview(null);
    setOcrMessage('');
  }, [retireOcrApply, retireOcrReview]);

  const resetOwnerState = useCallback(() => {
    setSnapshots([]);
    setSelectedScanId(null);
    setLoadedCapture(null);
    setElementSearch('');
    setCaptureLoading(false);
    setSelectedElementIndex(null);
    setCaptureImageSize({ width: 0, height: 0 });
    setMemoryItems([]);
    setMemoryOwnerEpoch('');
    memoryOwnerEpochRef.current = '';
    memoryOpenRequested.current = false;
    memoryOpened.current = false;
    pendingBootstrap.current = null;
    pendingCapture.current = null;
    pendingMemory.current = null;
    pendingCache.current = null;
    retireRescan();
    clearOcrState();
    retireRetention();
    setDetailMode('explorer');
    setCacheState(emptyCacheState);
    setCacheBusy(false);
    setStorageReady(null);
    setRetention(null);
    setRetentionRevision('');
  }, [clearOcrState, retireRescan, retireRetention]);

  const bootstrap = useCallback((expectedBindingEpoch?: string) => {
    if (pendingRetention.current) {
      setStatus('Wait for the snapshot retention action to finish before reloading Page Mappings.');
      return;
    }
    if (pendingOcrApply.current) {
      setStatus('Wait for the OCR Review save to finish before reloading Page Mappings.');
      return;
    }
    if (invalidatedRef.current && !expectedBindingEpoch) {
      setStatus('Page Mappings is unavailable.');
      return;
    }
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Page Mappings is disconnected.');
      return;
    }
    const nextRequestId = requestId('bootstrap');
    pendingBootstrap.current = nextRequestId;
    setStatus('Loading scan history…');
    webSocket.send(JSON.stringify({
      type: 'pageMappings.bootstrap',
      sessionId,
      body: JSON.stringify({
        requestId: nextRequestId,
        ...(expectedBindingEpoch ? { bindingEpoch: expectedBindingEpoch } : {}),
      }),
    }));
  }, [sessionId, webSocket]);

  const loadCapture = useCallback((scanId: string, expectedBindingEpoch?: string) => {
    if (pendingRetention.current) {
      setStatus('Wait for the snapshot retention action to finish before changing captures.');
      return;
    }
    if (pendingOcrApply.current) {
      const message = 'Wait for the OCR Review save to finish before changing captures.';
      setOcrMessage(message);
      setStatus(message);
      return;
    }
    const activeBindingEpoch = expectedBindingEpoch || bindingRef.current?.bindingEpoch || '';
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !activeBindingEpoch) {
      setStatus('Page Mappings ownership is not ready.');
      return;
    }
    const nextRequestId = requestId('capture');
    pendingCapture.current = { requestId: nextRequestId, scanId, bindingEpoch: activeBindingEpoch };
    setSelectedScanId(scanId);
    clearOcrState();
    setLoadedCapture(null);
    setSelectedElementIndex(null);
    setCaptureImageSize({ width: 0, height: 0 });
    setCaptureLoading(true);
    webSocket.send(JSON.stringify({
      type: 'pageMappings.capture',
      sessionId,
      body: JSON.stringify({ requestId: nextRequestId, scanId, bindingEpoch: activeBindingEpoch }),
    }));
  }, [clearOcrState, sessionId, webSocket]);

  const requestCacheState = useCallback((expectedBinding?: PageMappingsBinding) => {
    if (pendingOcrApply.current || pendingRetention.current) return;
    const active = expectedBinding || bindingRef.current;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !active) {
      setCacheState({
        ...emptyCacheState,
        state: 'UNAVAILABLE',
        message: 'Page Mappings ownership is not ready.',
      });
      return;
    }
    const nextRequestId = requestId('cache');
    pendingCache.current = { requestId: nextRequestId, bindingEpoch: active.bindingEpoch };
    setCacheBusy(true);
    webSocket.send(JSON.stringify({
      type: 'pageMappings.cacheState',
      sessionId,
      body: JSON.stringify({
        requestId: nextRequestId,
        bindingEpoch: active.bindingEpoch,
        workspaceEpoch: active.workspaceEpoch,
        homeBankingId: active.homeBankingId,
        botJobId: active.botJobId,
      }),
    }));
  }, [sessionId, webSocket]);

  const rescan = useCallback(() => {
    const active = bindingRef.current;
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !active
      || rescanBusy
      || !storageReady
      || pendingOcrApply.current
      || pendingRetention.current) return;
    const nextRequestId = requestId('rescan');
    pendingRescan.current = { requestId: nextRequestId, bindingEpoch: active.bindingEpoch };
    setRescanBusy(true);
    setStatus('Starting Page Mappings rescan...');
    rescanTimer.current = window.setTimeout(() => {
      if (pendingRescan.current?.requestId !== nextRequestId) return;
      retireRescan(nextRequestId);
      setStatus('Page Mappings rescan timed out. Check the current history before retrying.');
    }, RESCAN_TIMEOUT_MS);
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.rescan',
        sessionId,
        body: JSON.stringify({
          requestId: nextRequestId,
          bindingEpoch: active.bindingEpoch,
          workspaceEpoch: active.workspaceEpoch,
          homeBankingId: active.homeBankingId,
          botJobId: active.botJobId,
        }),
      }));
    } catch (_) {
      retireRescan(nextRequestId);
      setStatus('Page Mappings rescan could not be sent.');
    }
  }, [rescanBusy, retireRescan, sessionId, storageReady, webSocket]);

  const runOcrReview = useCallback(() => {
    const correlation = ocrCorrelation(
      bindingRef.current,
      loadedCapture,
      selectedScanId,
      'review',
    );
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !correlation
      || !loadedCapture?.screenshotBase64
      || ocrReviewBusy
      || ocrApplyBusy
      || rescanBusy
      || !storageReady
      || pendingOcrReview.current
      || pendingOcrApply.current
      || pendingRetention.current) {
      setOcrMessage('Load one verified capture before running OCR Review.');
      return;
    }
    pendingOcrReview.current = correlation;
    setOcrReviewBusy(true);
    setOcrMessage('Running OCR Review on the selected immutable capture...');
    ocrReviewTimer.current = window.setTimeout(() => {
      if (pendingOcrReview.current?.requestId !== correlation.requestId) return;
      retireOcrReview(correlation.requestId);
      setOcrMessage('OCR Review timed out. The capture was not changed; retry when OCR is available.');
    }, OCR_REVIEW_TIMEOUT_MS);
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.ocrReview',
        sessionId,
        body: JSON.stringify(correlation),
      }));
    } catch (_) {
      retireOcrReview(correlation.requestId);
      setOcrMessage('OCR Review could not be sent.');
    }
  }, [loadedCapture, ocrApplyBusy, ocrReviewBusy, rescanBusy, retireOcrReview, selectedScanId, sessionId, storageReady, webSocket]);

  const applyOcrNames = useCallback((changes: PageMappingsOcrAliasChange[]) => {
    const correlation = ocrCorrelation(
      bindingRef.current,
      loadedCapture,
      selectedScanId,
      'apply',
    );
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !correlation
      || !changes.length
      || changes.length > 1_000
      || ocrReviewBusy
      || ocrApplyBusy
      || rescanBusy
      || !storageReady
      || pendingOcrReview.current
      || pendingOcrApply.current
      || pendingRetention.current) {
      setOcrMessage('Select valid OCR names from the current capture before saving.');
      return;
    }
    const exactChanges = changes.map(change => ({
      scannedElementId: change.scannedElementId,
      elementHash: change.elementHash,
      expectedLastScannedAt: change.expectedLastScannedAt,
      expectedScanCount: change.expectedScanCount,
      expectedClientNamed: change.expectedClientNamed ?? null,
      clientNamed: change.clientNamed ?? null,
    }));
    pendingOcrApply.current = { correlation, changes: exactChanges };
    setOcrApplyBusy(true);
    setOcrMessage(`Saving ${exactChanges.length} reviewed name${exactChanges.length === 1 ? '' : 's'}...`);
    ocrApplyTimer.current = window.setTimeout(() => {
      if (pendingOcrApply.current?.correlation.requestId !== correlation.requestId) return;
      retireOcrApply(correlation.requestId);
      setOcrReview(null);
      setOcrMessage('The save response timed out. Reload OCR Review before retrying because the commit outcome is unknown.');
    }, OCR_REVIEW_TIMEOUT_MS);
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.ocrReviewApply',
        sessionId,
        body: JSON.stringify({ ...correlation, changes: exactChanges }),
      }));
    } catch (_) {
      retireOcrApply(correlation.requestId);
      setOcrMessage('OCR Review names could not be sent.');
    }
  }, [loadedCapture, ocrApplyBusy, ocrReviewBusy, rescanBusy, retireOcrApply, selectedScanId, sessionId, storageReady, webSocket]);

  const armRetentionTimeout = useCallback((pending: PendingRetention) => {
    pendingRetention.current = pending;
    setRetentionOperation(pending.operation);
    retentionTimer.current = window.setTimeout(() => {
      if (pendingRetention.current?.requestId !== pending.requestId) return;
      retireRetention(pending.requestId);
      markRetentionReloadRequired();
      setStatus('The retention response timed out. Reload Page Mappings before retrying because the outcome is unknown.');
    }, RETENTION_TIMEOUT_MS);
  }, [markRetentionReloadRequired, retireRetention]);

  const pinSnapshot = useCallback((scanId: string, pinned: boolean) => {
    const correlation = retentionCorrelation(bindingRef.current);
    const candidate = snapshots.find(snapshot => snapshot.scanId === scanId);
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !correlation
      || !storageReady
      || !retention
      || retentionReloadRequiredRef.current
      || candidate?.status !== 'READY'
      || captureLoading
      || cacheBusy
      || rescanBusy
      || ocrReviewBusy
      || ocrApplyBusy
      || pendingCapture.current
      || pendingCache.current
      || pendingRescan.current
      || pendingOcrReview.current
      || pendingOcrApply.current
      || pendingRetention.current) return;
    const pending: PendingRetention = { ...correlation, operation: 'pin', scanId, pinned };
    armRetentionTimeout(pending);
    setStatus(pinned ? 'Pinning capture...' : 'Unpinning capture...');
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.pin',
        sessionId,
        body: JSON.stringify({ ...correlation, scanId, pinned }),
      }));
    } catch (_) {
      retireRetention(correlation.requestId);
      setStatus('The capture pin request could not be sent.');
    }
  }, [armRetentionTimeout, cacheBusy, captureLoading, ocrApplyBusy, ocrReviewBusy, rescanBusy, retention, retireRetention, sessionId, snapshots, storageReady, webSocket]);

  const saveRetention = useCallback((retentionDays: number, maxUnpinnedPerPage: number) => {
    const correlation = retentionCorrelation(bindingRef.current);
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !correlation
      || !storageReady
      || !retention
      || retentionReloadRequiredRef.current
      || boundedInteger(retentionDays, 3650) === null
      || boundedInteger(maxUnpinnedPerPage, 1000) === null
      || captureLoading
      || cacheBusy
      || rescanBusy
      || ocrReviewBusy
      || ocrApplyBusy
      || pendingCapture.current
      || pendingCache.current
      || pendingRescan.current
      || pendingOcrReview.current
      || pendingOcrApply.current
      || pendingRetention.current) return;
    const pending: PendingRetention = {
      ...correlation,
      operation: 'save',
      retentionDays,
      maxUnpinnedPerPage,
    };
    armRetentionTimeout(pending);
    setStatus('Saving snapshot retention policy...');
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.retentionUpdate',
        sessionId,
        body: JSON.stringify({ ...correlation, retentionDays, maxUnpinnedPerPage }),
      }));
    } catch (_) {
      retireRetention(correlation.requestId);
      setStatus('The snapshot retention policy could not be sent.');
    }
  }, [armRetentionTimeout, cacheBusy, captureLoading, ocrApplyBusy, ocrReviewBusy, rescanBusy, retention, retireRetention, sessionId, storageReady, webSocket]);

  const purgeRetention = useCallback(() => {
    const correlation = retentionCorrelation(bindingRef.current);
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !correlation
      || !storageReady
      || !retention?.eligibleCount
      || retentionReloadRequiredRef.current
      || captureLoading
      || cacheBusy
      || rescanBusy
      || ocrReviewBusy
      || ocrApplyBusy
      || pendingCapture.current
      || pendingCache.current
      || pendingRescan.current
      || pendingOcrReview.current
      || pendingOcrApply.current
      || pendingRetention.current) return;
    const confirmed = window.confirm(
      `Permanently purge ${retention.eligibleCount} eligible unpinned capture${retention.eligibleCount === 1 ? '' : 's'} for this Bot Job?`,
    );
    if (!confirmed) {
      setStatus('Snapshot purge cancelled.');
      return;
    }
    const pending: PendingRetention = {
      ...correlation,
      operation: 'purge',
      expectedRetentionDays: retention.retentionDays,
      expectedMaxUnpinnedPerPage: retention.maxUnpinnedPerPage,
    };
    armRetentionTimeout(pending);
    setStatus('Purging eligible unpinned captures...');
    try {
      webSocket.send(JSON.stringify({
        type: 'pageMappings.retentionPurge',
        sessionId,
        body: JSON.stringify({
          ...correlation,
          expectedRetentionDays: pending.expectedRetentionDays,
          expectedMaxUnpinnedPerPage: pending.expectedMaxUnpinnedPerPage,
        }),
      }));
    } catch (_) {
      retireRetention(correlation.requestId);
      setStatus('The snapshot purge request could not be sent.');
    }
  }, [armRetentionTimeout, cacheBusy, captureLoading, ocrApplyBusy, ocrReviewBusy, rescanBusy, retention, retireRetention, sessionId, storageReady, webSocket]);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    if (connected) return;
    const retentionOutcomeUnknown = pendingRetention.current !== null;
    pendingCache.current = null;
    setCacheBusy(false);
    retireRescan();
    clearOcrState();
    retireRetention();
    if (retentionOutcomeUnknown) {
      markRetentionReloadRequired();
      setStatus('Connection lost during snapshot retention. Reconnect and reload before another retention action.');
    } else {
      setStorageReady(null);
      setRetention(null);
    }
  }, [clearOcrState, connected, markRetentionReloadRequired, retireRescan, retireRetention]);

  useEffect(() => () => {
    if (rescanTimer.current !== null) {
      window.clearTimeout(rescanTimer.current);
      rescanTimer.current = null;
    }
    if (ocrReviewTimer.current !== null) window.clearTimeout(ocrReviewTimer.current);
    if (ocrApplyTimer.current !== null) window.clearTimeout(ocrApplyTimer.current);
    if (retentionTimer.current !== null) window.clearTimeout(retentionTimer.current);
  }, []);

  useEffect(() => {
    for (const raw of messages.slice(workspaceCursor.current)) {
      workspaceCursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        const operation = envelope.operationId || envelope.type;
        const body = (typeof envelope.body === 'string'
          ? JSON.parse(envelope.body)
          : envelope.body || {}) as Record<string, unknown>;

        if (operation === 'pageMappings.invalidated') {
          const activeBinding = bindingRef.current;
          const primary = invalidationIdentity(body, false);
          const alternate = invalidationIdentity(body, true);
          const malformed = !primary.identity || (alternate.present && !alternate.identity);
          if (malformed
            || (activeBinding
              && !sameBindingIdentity(activeBinding, primary.identity)
              && !sameBindingIdentity(activeBinding, alternate.identity))
            || (!activeBinding && bindingEstablishedRef.current)) continue;
          bindingRef.current = null;
          setBinding(null);
          resetOwnerState();
          invalidatedRef.current = true;
          setInvalidated(true);
          setStatus('Page Mappings is unavailable.');
          continue;
        }

        if (operation === 'pageMappings.retarget') {
          const nextBinding = parseBinding(body);
          if (!nextBinding) {
            setStatus('Page Mappings received an invalid owner update.');
            continue;
          }
          if (bindingRef.current?.bindingEpoch === nextBinding.bindingEpoch) continue;
          bindingEstablishedRef.current = true;
          bindingRef.current = nextBinding;
          setBinding(nextBinding);
          resetOwnerState();
          invalidatedRef.current = false;
          setInvalidated(false);
          updateUrlHint(nextBinding.botJobId);
          setStatus(`Switching to Bot Job #${nextBinding.botJobId}…`);
          bootstrap(nextBinding.bindingEpoch);
          continue;
        }

        if (operation === 'pageMappings.bootstrapResponse') {
          const responseRequestId = text(body.requestId);
          if (!responseRequestId || responseRequestId !== pendingBootstrap.current) continue;
          const nextBinding = parseBinding(body);
          const nextRetention = parseRetention(body.retention);
          if (!body.ok) {
            pendingBootstrap.current = null;
            if (body.storageReady === false && nextBinding) {
              if (bindingRef.current
                && bindingRef.current.bindingEpoch !== nextBinding.bindingEpoch) continue;
              bindingEstablishedRef.current = true;
              bindingRef.current = nextBinding;
              setBinding(nextBinding);
              invalidatedRef.current = false;
              setInvalidated(false);
              clearRetentionReloadRequired();
              setRetentionRevision(`${nextBinding.bindingEpoch}:${responseRequestId}`);
              updateUrlHint(nextBinding.botJobId);
              setSnapshots([]);
              setSelectedScanId(null);
              setLoadedCapture(null);
              clearOcrState();
              setStorageReady(false);
              setRetention(nextRetention);
              setCacheState({
                ...emptyCacheState,
                state: 'MIGRATION_REQUIRED',
                message: 'Page Mappings storage is not initialized. Apply the database migration, then Reload.',
              });
              setStatus(text(body.message)
                || 'Page Mappings storage is not initialized. Apply the database migration, then Reload.');
            } else {
              setStorageReady(false);
              setRetention(null);
              setStatus(text(body.message) || 'Page Mappings history is unavailable.');
            }
            continue;
          }
          if (!nextBinding) {
            pendingBootstrap.current = null;
            setStorageReady(false);
            setRetention(null);
            setStatus('Page Mappings owner could not be verified.');
            continue;
          }
          if (bindingRef.current && bindingRef.current.bindingEpoch !== nextBinding.bindingEpoch) continue;
          pendingBootstrap.current = null;
          bindingEstablishedRef.current = true;
          bindingRef.current = nextBinding;
          setBinding(nextBinding);
          invalidatedRef.current = false;
          setInvalidated(false);
          const nextStorageReady = body.storageReady === true;
          setStorageReady(nextStorageReady);
          setRetention(nextRetention);
          setRetentionRevision(`${nextBinding.bindingEpoch}:${responseRequestId}`);
          if (!nextStorageReady) {
            clearRetentionReloadRequired();
          } else if (nextRetention) {
            clearRetentionReloadRequired();
          } else {
            markRetentionReloadRequired();
          }
          updateUrlHint(nextBinding.botJobId);
          const next = Array.isArray(body.snapshots)
            ? body.snapshots.map(parseSnapshot).filter((item): item is Snapshot => item !== null)
            : [];
          setSnapshots(next);
          const initial = next.find(item => item.status === 'READY') || null;
          setSelectedScanId(initial?.scanId ?? null);
          setStatus(!nextStorageReady
            ? 'Page Mappings storage is not initialized. Apply the database migration, then Reload.'
            : !nextRetention
              ? 'Snapshot retention settings are unavailable. Reload Page Mappings.'
              : next.length
                ? `${next.length} scan capture${next.length === 1 ? '' : 's'} available.`
                : 'No scan captures yet.');
          if (nextStorageReady && nextRetention && initial) {
            loadCapture(initial.scanId, nextBinding.bindingEpoch);
          }
          if (nextStorageReady && nextRetention) requestCacheState(nextBinding);
          continue;
        }

        if (operation === 'pageMappings.cacheStateResponse') {
          const pending = pendingCache.current;
          if (!pending
            || text(body.requestId) !== pending.requestId
            || text(body.bindingEpoch) !== pending.bindingEpoch
            || bindingRef.current?.bindingEpoch !== pending.bindingEpoch) continue;
          pendingCache.current = null;
          setCacheBusy(false);
          if (!body.ok) {
            setCacheState({
              ...emptyCacheState,
              state: 'UNAVAILABLE',
              message: text(body.message) || 'Live mapping comparison is unavailable.',
            });
            continue;
          }
          setCacheState({
            state: text(body.cacheState) || 'UNAVAILABLE',
            message: text(body.message) || 'Live mapping comparison completed.',
            browserAvailable: body.browserAvailable === true,
            livePageKey: text(body.livePageKey),
            livePageUrl: text(body.livePageUrl),
            liveNodeCount: positiveInteger(body.liveNodeCount),
            reusableScanId: text(body.reusableScanId),
            comparedScanId: text(body.comparedScanId),
          });
          continue;
        }

        if (operation === 'pageMappings.rescanResponse') {
          const pending = pendingRescan.current;
          if (!pending
            || text(body.requestId) !== pending.requestId
            || (body.bindingEpoch && text(body.bindingEpoch) !== pending.bindingEpoch)
            || bindingRef.current?.bindingEpoch !== pending.bindingEpoch) continue;
          if (!body.ok) {
            retireRescan(pending.requestId);
            setStatus(text(body.message) || 'Page Mappings rescan could not be started.');
          }
          continue;
        }

        if (operation === 'pageMappings.rescanStatus') {
          const pending = pendingRescan.current;
          const active = bindingRef.current;
          if (!pending
            || !active
            || text(body.requestId) !== pending.requestId
            || text(body.bindingEpoch) !== pending.bindingEpoch
            || active.bindingEpoch !== pending.bindingEpoch
            || positiveInteger(body.workspaceEpoch) !== active.workspaceEpoch
            || positiveInteger(body.homeBankingId) !== active.homeBankingId
            || positiveInteger(body.botJobId) !== active.botJobId) continue;
          const scanStatus = text(body.status).toLowerCase();
          setStatus(text(body.message) || 'Page Mappings rescan is running…');
          if (scanStatus === 'done' || scanStatus === 'empty' || scanStatus === 'failed') {
            retireRescan(pending.requestId);
            if (scanStatus !== 'failed') {
              bootstrap(active.bindingEpoch);
            }
          }
          continue;
        }

        if (operation === 'pageMappings.captureResponse') {
          const pending = pendingCapture.current;
          if (!pending
            || text(body.requestId) !== pending.requestId
            || text(body.scanId) !== pending.scanId
            || text(body.bindingEpoch) !== pending.bindingEpoch
            || bindingRef.current?.bindingEpoch !== pending.bindingEpoch) continue;
          pendingCapture.current = null;
          setCaptureLoading(false);
          if (!body.ok) {
            setLoadedCapture(null);
            setStatus(text(body.message) || 'The selected capture could not be loaded.');
            continue;
          }
          const pageKey = text(body.pageKey);
          const capturedAt = text(body.capturedAt);
          const manifestSha256 = text(body.manifestSha256);
          if (!pageKey || !capturedAt || !manifestSha256) {
            setLoadedCapture(null);
            setStatus('The selected capture identity could not be verified.');
            continue;
          }
          const rawViewport = body.viewport && typeof body.viewport === 'object'
            ? body.viewport as Record<string, unknown>
            : null;
          const viewport = rawViewport ? {
            cssWidth: Number(rawViewport.cssWidth) || 0,
            cssHeight: Number(rawViewport.cssHeight) || 0,
            devicePixelRatio: Number(rawViewport.devicePixelRatio) || 1,
            screenshotScope: text(rawViewport.screenshotScope) || 'VIEWPORT',
          } : null;
          setLoadedCapture({
            requestId: pending.requestId,
            bindingEpoch: pending.bindingEpoch,
            scanId: pending.scanId,
            pageKey,
            capturedAt,
            manifestSha256,
            elements: Array.isArray(body.elements) ? body.elements as CaptureElement[] : [],
            rectangles: Array.isArray(body.rectangles) ? body.rectangles as CaptureRectangle[] : [],
            viewport,
            screenshotBase64: text(body.screenshotBase64) || null,
            screenshotMime: text(body.screenshotMime) || 'image/png',
          });
          setStatus('Immutable capture loaded.');
          continue;
        }

        if (operation === 'pageMappings.pinResponse'
          || operation === 'pageMappings.retentionUpdateResponse'
          || operation === 'pageMappings.retentionPurgeResponse') {
          const pending = pendingRetention.current;
          const expectedOperation = operation === 'pageMappings.pinResponse'
            ? 'pin'
            : operation === 'pageMappings.retentionUpdateResponse'
              ? 'save'
              : 'purge';
          if (!pending
            || pending.operation !== expectedOperation
            || text(body.requestId) !== pending.requestId) continue;
          if (body.ok !== true) {
            if (!retentionFailureMatches(body, pending)) continue;
            retireRetention(pending.requestId);
            if (body.reloadRequired === true) markRetentionReloadRequired();
            setStatus(text(body.error) || text(body.message) || 'The snapshot retention action failed.');
            continue;
          }
          if (!retentionResponseMatches(body, pending, false)
            || !bindingRef.current
            || !sameBindingIdentity(bindingRef.current, pending)) continue;
          const nextRetention = parseRetention(body.retention);
          if (!nextRetention) {
            retireRetention(pending.requestId);
            markRetentionReloadRequired();
            setStatus('The snapshot retention response was invalid. Reload Page Mappings.');
            continue;
          }

          if (pending.operation === 'pin') {
            if (text(body.scanId) !== pending.scanId || body.pinned !== pending.pinned) {
              retireRetention(pending.requestId);
              markRetentionReloadRequired();
              setStatus('The capture pin response was stale. Reload Page Mappings.');
              continue;
            }
            setSnapshots(current => current.map(snapshot => snapshot.scanId === pending.scanId
              ? { ...snapshot, pinned: pending.pinned }
              : snapshot));
            setRetention(nextRetention);
            retireRetention(pending.requestId);
            setStatus(text(body.message) || (pending.pinned ? 'Capture pinned.' : 'Capture unpinned.'));
            continue;
          }

          if (pending.operation === 'save') {
            if (nextRetention.retentionDays !== pending.retentionDays
              || nextRetention.maxUnpinnedPerPage !== pending.maxUnpinnedPerPage) {
              retireRetention(pending.requestId);
              markRetentionReloadRequired();
              setStatus('The saved retention policy response did not match the request. Reload Page Mappings.');
              continue;
            }
            setRetention(nextRetention);
            retireRetention(pending.requestId);
            setStatus(text(body.message) || 'Snapshot retention policy saved.');
            continue;
          }

          if (nextRetention.retentionDays !== pending.expectedRetentionDays
            || nextRetention.maxUnpinnedPerPage !== pending.expectedMaxUnpinnedPerPage) {
            retireRetention(pending.requestId);
            markRetentionReloadRequired();
            setStatus('The purge policy changed while the request was running. Reload Page Mappings.');
            continue;
          }
          if (!Array.isArray(body.purgedScanIds)
            || !body.purgedScanIds.every(scanId => typeof scanId === 'string' && scanId.trim())) {
            retireRetention(pending.requestId);
            markRetentionReloadRequired();
            setStatus('The snapshot purge response was invalid. Reload Page Mappings.');
            continue;
          }
          const purgedScanIds = new Set(body.purgedScanIds as string[]);
          setRetention(nextRetention);
          setSnapshots(current => current.filter(snapshot => !purgedScanIds.has(snapshot.scanId)));
          setMemoryItems(current => current.filter(item => (
            !item.payload?.captureId || !purgedScanIds.has(item.payload.captureId)
          )));
          if (selectedScanId && purgedScanIds.has(selectedScanId)) {
            pendingCapture.current = null;
            setCaptureLoading(false);
            setSelectedScanId(null);
            setLoadedCapture(null);
            setSelectedElementIndex(null);
            setCaptureImageSize({ width: 0, height: 0 });
            setElementSearch('');
            clearOcrState();
            setDetailMode('explorer');
          }
          retireRetention(pending.requestId);
          bootstrap(pending.bindingEpoch);
          setStatus(`${text(body.message) || 'Eligible captures purged.'}${body.cleanupPending === true
            ? ' Artifact cleanup will finish during startup.'
            : ''} Reloading scan history...`);
          continue;
        }

        if (operation === 'pageMappings.ocrReviewResponse') {
          const pending = pendingOcrReview.current;
          if (!pending || text(body.requestId) !== pending.requestId) continue;
          if (body.ok === false) {
            if (!pageMappingsOcrFailureMatches(body, pending)) continue;
            retireOcrReview(pending.requestId);
            const failureMessage = pageMappingsOcrMessage(body, 'OCR Review could not be completed.');
            setOcrMessage(failureMessage);
            setStatus(failureMessage);
            continue;
          }
          const parsed = parsePageMappingsOcrReview(body, pending);
          retireOcrReview(pending.requestId);
          if (!parsed || !currentOcrContextMatches(
            bindingRef.current,
            loadedCapture,
            selectedScanId,
            pending,
          )) {
            setOcrReview(null);
            setOcrMessage('OCR Review returned an invalid or stale capture response.');
            continue;
          }
          setOcrReview(parsed);
          setOcrMessage(parsed.message);
          setStatus(parsed.message);
          continue;
        }

        if (operation === 'pageMappings.ocrReviewApplyResponse') {
          const pending = pendingOcrApply.current;
          if (!pending || text(body.requestId) !== pending.correlation.requestId) continue;
          if (body.ok === false) {
            if (!pageMappingsOcrFailureMatches(body, pending.correlation)) continue;
            retireOcrApply(pending.correlation.requestId);
            const failureMessage = pageMappingsOcrMessage(body, 'OCR Review names could not be saved.');
            setOcrMessage(failureMessage);
            setStatus(failureMessage);
            continue;
          }
          const parsed = parsePageMappingsOcrApply(body, pending.correlation, pending.changes);
          retireOcrApply(pending.correlation.requestId);
          if (!parsed || !currentOcrContextMatches(
            bindingRef.current,
            loadedCapture,
            selectedScanId,
            pending.correlation,
          )) {
            setOcrReview(null);
            setOcrMessage('OCR Review returned an invalid or stale save response. Reload the capture.');
            continue;
          }

          const aliases = new Map(parsed.aliases.map(alias => [alias.scannedElementId, alias]));
          const reviewRows = new Map((ocrReview?.rows || []).map(row => [row.scannedElementId, row]));
          setOcrReview(current => current && current.scanId === parsed.scanId
            ? {
              ...current,
              message: parsed.message,
              rows: current.rows.map(row => {
                const alias = aliases.get(row.scannedElementId);
                return alias ? {
                  ...row,
                  clientNamed: alias.clientNamed,
                  elementHash: alias.elementHash,
                  expectedLastScannedAt: alias.lastScannedAt,
                  expectedScanCount: alias.scanCount,
                } : row;
              }),
            }
            : current);
          setLoadedCapture(current => current && current.scanId === parsed.scanId
            ? {
              ...current,
              elements: current.elements.map(element => {
                const alias = aliases.get(positiveInteger(element.scannedElementId));
                return alias ? {
                  ...element,
                  clientNamed: alias.clientNamed,
                  elementHash: alias.elementHash,
                  lastScannedAt: alias.lastScannedAt,
                  scanCount: alias.scanCount,
                } : element;
              }),
            }
            : current);
          setMemoryItems(current => current.map(item => {
            const payload = item.payload;
            if (!payload) return item;
            const alias = aliases.get(payload.scannedElementId);
            if (!alias) return item;
            const row = reviewRows.get(alias.scannedElementId);
            return {
              ...item,
              label: alias.clientNamed || row?.definedName || row?.domText || row?.tag || item.label,
              payload: {
                ...payload,
                elementHash: alias.elementHash,
                expectedLastScannedAt: alias.lastScannedAt,
                expectedScanCount: alias.scanCount,
              },
            };
          }));
          setOcrMessage(parsed.message);
          setStatus(parsed.message);
          continue;
        }
      } catch {
        setStatus('Page Mappings received an invalid response.');
      }
    }
  }, [
    bootstrap,
    clearRetentionReloadRequired,
    clearOcrState,
    loadCapture,
    loadedCapture,
    messages,
    markRetentionReloadRequired,
    ocrReview,
    requestCacheState,
    resetOwnerState,
    retireRetention,
    retireOcrApply,
    retireOcrReview,
    retireRescan,
    selectedScanId,
    updateUrlHint,
  ]);

  const captureElements = loadedCapture?.scanId === selectedScanId
    ? loadedCapture.elements
    : [];
  const selected = snapshots.find(item => item.scanId === selectedScanId) || null;

  const useExisting = useCallback((scanId: string) => {
    const candidate = snapshots.find(item => item.scanId === scanId && item.status === 'READY');
    if (!candidate) {
      setStatus('The reusable capture is no longer available. Reload Page Mappings.');
      return;
    }
    loadCapture(candidate.scanId);
    setStatus('Using the latest saved mapping for the active page.');
  }, [loadCapture, snapshots]);

  const parseRectangle = useCallback((rectangle: CaptureRectangle) => {
    const dpr = loadedCapture?.viewport?.devicePixelRatio || 1;
    const cssWidth = loadedCapture?.viewport?.cssWidth || captureImageSize.width / dpr;
    const cssHeight = loadedCapture?.viewport?.cssHeight || captureImageSize.height / dpr;
    const { x, y, width, height } = rectangle;
    if (!cssWidth || !cssHeight
      || ![x, y, width, height].every(Number.isFinite)
      || width <= 0 || height <= 0) return null;
    return {
      left: `${Math.max(0, x) / cssWidth * 100}%`,
      top: `${Math.max(0, y) / cssHeight * 100}%`,
      width: `${Math.min(width, cssWidth) / cssWidth * 100}%`,
      height: `${Math.min(height, cssHeight) / cssHeight * 100}%`,
    };
  }, [captureImageSize, loadedCapture]);

  const filteredElements = useMemo(() => captureElements
    .map((element, index) => ({ element, index }))
    .filter(({ element }) => JSON.stringify(element).toLowerCase().includes(elementSearch.toLowerCase()))
    .slice(0, 200), [captureElements, elementSearch]);

  const memoryItemFor = useCallback((element: CaptureElement, index: number): MappingMemoryItem | null => {
    if (!loadedCapture || loadedCapture.scanId !== selectedScanId) return null;
    const scannedElementId = positiveInteger(element.scannedElementId);
    const scanCount = positiveInteger(element.scanCount);
    const elementHash = text(element.elementHash);
    const lastScannedAt = text(element.lastScannedAt);
    if (!scannedElementId || !scanCount || !elementHash || !lastScannedAt) return null;
    const label = String(element.clientNamed || element.definedName || element.someText || element.tagName || `Element ${index + 1}`);
    const sourceItemKey = `${loadedCapture.scanId}:${scannedElementId}`;
    const icon = String(element.typeElement || '').toLowerCase().includes('input') ? 'input' : 'output';
    return {
      key: `PAGE_MAPPINGS:${sourceItemKey}`,
      sourceKind: 'PAGE_MAPPINGS',
      sourceItemKey,
      label,
      detail: `${String(element.tagName || '')} · ${String(element.xPath || element.cssSelector || 'locator unavailable')}`,
      icon: icon as MemoryListItemIcon,
      active: true,
      payload: {
        captureId: loadedCapture.scanId,
        pageKey: loadedCapture.pageKey,
        scannedElementId,
        elementHash,
        expectedLastScannedAt: lastScannedAt,
        expectedScanCount: scanCount,
      },
    };
  }, [loadedCapture, selectedScanId]);

  const addToMemory = useCallback((element: CaptureElement, index: number) => {
    const item = memoryItemFor(element, index);
    if (!item) {
      setStatus('This capture row is stale or incomplete. Reload the capture before adding it.');
      return;
    }
    setMemoryItems(current => current.some(existing => existing.sourceItemKey === item.sourceItemKey)
      ? current
      : [...current, item]);
    memoryOpenRequested.current = true;
  }, [memoryItemFor]);

  const memorySnapshot = useMemo<MemoryListSnapshot>(() => ({
    ownerEpoch: memoryOwnerEpoch,
    workspaceEpoch: binding?.workspaceEpoch || 0,
    sourceKind: 'PAGE_MAPPINGS',
    homeBankingId: binding?.homeBankingId || 0,
    botJobId: binding?.botJobId || 0,
    botJobName: binding?.botJobName || '',
    items: memoryItems,
    blocks: [],
    targetBlockId: null,
    emptyMessage: 'Select a captured element to add it to Memory List.',
    status: memoryItems.length
      ? `${memoryItems.length} mapping${memoryItems.length === 1 ? '' : 's'} selected.`
      : 'Memory List ready',
    busy: false,
    canApply: false,
  }), [binding, memoryItems, memoryOwnerEpoch]);

  useEffect(() => {
    if (!webSocket
      || webSocket.readyState !== WebSocket.OPEN
      || !binding
      || (!memoryItems.length && !memoryOpened.current)
      || invalidatedRef.current
      || bindingRef.current?.bindingEpoch !== binding.bindingEpoch) return;
    const operation = memoryOpenRequested.current || !memoryOpened.current ? 'memoryList.open' : 'memoryList.sync';
    const nextRequestId = requestId('memory');
    webSocket.send(JSON.stringify({
      type: operation,
      sessionId,
      homeBankingId: binding.homeBankingId,
      botJobId: binding.botJobId,
      body: JSON.stringify({
        requestId: nextRequestId,
        sourceBindingEpoch: binding.bindingEpoch,
        homeBankingId: binding.homeBankingId,
        botJobId: binding.botJobId,
        workspaceEpoch: binding.workspaceEpoch,
        ownerEpoch: memoryOwnerEpoch,
        snapshot: memorySnapshot,
      }),
    }));
    pendingMemory.current = {
      requestId: nextRequestId,
      bindingEpoch: binding.bindingEpoch,
    };
    memoryOpenRequested.current = false;
  }, [binding, memoryItems, memoryOwnerEpoch, memorySnapshot, sessionId, webSocket]);

  useEffect(() => {
    for (const raw of messages.slice(memoryCursor.current)) {
      memoryCursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        const operation = envelope.operationId || envelope.type;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body || {};
        if (operation === 'memoryList.openResponse' || operation === 'memoryList.syncResponse') {
          const pending = pendingMemory.current;
          if (!pending
            || text(body.requestId) !== pending.requestId
            || bindingRef.current?.bindingEpoch !== pending.bindingEpoch) continue;
          if (!body.ok) {
            pendingMemory.current = null;
            setStatus(body.message || 'Memory List could not be updated.');
            continue;
          }
          const activeBinding = bindingRef.current;
          const nextOwnerEpoch = text(body.ownerEpoch);
          if (!activeBinding
            || positiveInteger(body.homeBankingId) !== activeBinding.homeBankingId
            || positiveInteger(body.botJobId) !== activeBinding.botJobId
            || !nextOwnerEpoch) continue;
          pendingMemory.current = null;
          memoryOwnerEpochRef.current = nextOwnerEpoch;
          setMemoryOwnerEpoch(nextOwnerEpoch);
          memoryOpened.current = true;
          setStatus(body.message || 'Selected mapping added to Memory List.');
        } else if (operation === 'memoryList.command') {
          const activeBinding = bindingRef.current;
          const commandOwnerEpoch = text(body.ownerEpoch);
          const commandBindingEpoch = text(body.sourceBindingEpoch) || text(body.bindingEpoch);
          if (!activeBinding
            || positiveInteger(body.homeBankingId) !== activeBinding.homeBankingId
            || positiveInteger(body.botJobId) !== activeBinding.botJobId
            || commandBindingEpoch !== activeBinding.bindingEpoch
            || !memoryOwnerEpochRef.current
            || commandOwnerEpoch !== memoryOwnerEpochRef.current) continue;
          const command = String(body.command || body.action || '').toUpperCase();
          const itemKey = String(body.payload?.sourceItemKey || body.payload?.itemKey || '');
          if (command === 'CLEAR') setMemoryItems([]);
          if (command === 'REMOVE' && itemKey) {
            setMemoryItems(current => current.filter(item => item.sourceItemKey !== itemKey));
          }
        }
      } catch { /* Ignore messages owned by other Page Mappings operations. */ }
    }
  }, [messages]);

  const closePage = useCallback(() => {
    if (pendingRetention.current) {
      setStatus('Wait for the snapshot retention action to finish before closing Page Mappings.');
      return;
    }
    if (pendingOcrApply.current) {
      const message = 'Wait for the OCR Review save to finish before closing Page Mappings.';
      setOcrMessage(message);
      setStatus(message);
      return;
    }
    onClose?.();
  }, [onClose]);

  const captureImage = loadedCapture?.screenshotBase64
    ? `data:${loadedCapture.screenshotMime};base64,${loadedCapture.screenshotBase64}`
    : null;
  const retentionBusy = retentionOperation !== null;
  const pageOperationBusy = captureLoading
    || cacheBusy
    || rescanBusy
    || ocrReviewBusy
    || ocrApplyBusy
    || retentionBusy;
  const canStage = Boolean(connected
    && storageReady
    && !invalidated
    && !pageOperationBusy
    && loadedCapture
    && loadedCapture.scanId === selectedScanId);
  const canRunOcr = Boolean(connected
    && storageReady
    && !invalidated
    && !captureLoading
    && !rescanBusy
    && !retentionBusy
    && selected?.status === 'READY'
    && loadedCapture?.bindingEpoch === binding?.bindingEpoch
    && loadedCapture?.scanId === selectedScanId
    && loadedCapture?.pageKey === selected?.pageKey
    && loadedCapture?.capturedAt === selected?.capturedAt
    && loadedCapture?.manifestSha256 === selected?.manifestSha256
    && captureImage);

  return (
    <DetachedPageShell title="Page Mappings" testId="page-mappings-workspace" onClose={closePage}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PAGE SCAN HISTORY</p>
            <h1>Page Mappings</h1>
            <p className={styles.subtitle}>
              Owner-scoped captures for Bot Job {binding?.botJobId || (!invalidated && sourceBotJobHint) || '—'}
              {binding?.botJobName ? ` · ${binding.botJobName}` : ''}
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => bootstrap(binding?.bindingEpoch)} disabled={!connected || invalidated || pageOperationBusy}>Reload</button>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={styles.close} onClick={closePage} disabled={ocrApplyBusy || retentionBusy}>Close</button>
          </div>
        </header>
        <div className={styles.status} role="status">{status}</div>
        <section className={styles.workspace} aria-label="Page Mappings explorer">
          <aside className={styles.history}>
            <div className={styles.sectionHeading}><h2>Captures</h2><span>{snapshots.length}</span></div>
            <PageMappingsRetentionPanel
              retention={retention}
              storageReady={storageReady}
              authoritativeRevision={retentionRevision}
              reloadRequired={retentionReloadRequired}
              busy={pageOperationBusy}
              pendingOperation={retentionOperation}
              disabled={!connected || invalidated || retentionReloadRequired}
              onSave={saveRetention}
              onPurge={purgeRetention}
            />
            {storageReady === false ? (
              <p className={styles.storageMissing}>Page Mappings history storage is not initialized. The legacy Page Scanner remains available.</p>
            ) : snapshots.length === 0 ? <p className={styles.empty}>Run Page Scanner to create the first immutable capture.</p> : (
              <div className={styles.captureList}>
                {snapshots.map(item => (
                  <div className={styles.captureRow} key={item.scanId}>
                    <button
                      type="button"
                      className={`${styles.capture} ${item.scanId === selectedScanId ? styles.selected : ''}`}
                      onClick={() => {
                        setElementSearch('');
                        setSelectedElementIndex(null);
                        loadCapture(item.scanId);
                      }}
                      disabled={item.status !== 'READY' || pageOperationBusy || storageReady !== true}
                    >
                      <strong>{new Date(item.capturedAt).toLocaleString()}</strong>
                      <span>{item.pageUrl || item.pageKey}</span>
                      <small>{item.elementCount} elements · {item.status}</small>
                    </button>
                    <button
                      type="button"
                      className={`${styles.pinButton} ${item.pinned ? styles.pinned : ''}`}
                      aria-pressed={item.pinned}
                      title={item.pinned ? 'Unpin this capture' : 'Pin this capture'}
                      onClick={() => pinSnapshot(item.scanId, !item.pinned)}
                      disabled={item.status !== 'READY'
                        || pageOperationBusy
                        || storageReady !== true
                        || retentionReloadRequired
                        || !retention}
                    >{item.pinned ? 'Unpin' : 'Pin'}</button>
                  </div>
                ))}
              </div>
            )}
          </aside>
          <section className={styles.details} aria-label="Selected scan capture">
            <PageMappingsCachePanel
              cache={cacheState}
              busy={pageOperationBusy}
              disabled={!connected || invalidated || storageReady !== true || pageOperationBusy}
              onRefresh={() => requestCacheState()}
              onUseExisting={useExisting}
              onRescan={rescan}
            />
            {!selected ? <div className={styles.emptyDetail}>Select a capture to inspect its immutable metadata.</div> : (
              <>
                <div className={styles.detailHeader}>
                  <div><p className={styles.eyebrow}>SELECTED CAPTURE</p><h2>{selected.pageUrl || selected.pageKey}</h2></div>
                  <span className={selected.status === 'READY' ? styles.ready : styles.failed}>{selected.status}</span>
                </div>
                <dl className={styles.metadata}>
                  <div><dt>Captured</dt><dd>{new Date(selected.capturedAt).toLocaleString()}</dd></div>
                  <div><dt>Elements</dt><dd>{selected.elementCount}</dd></div>
                  <div><dt>Page key</dt><dd>{selected.pageKey}</dd></div>
                  <div><dt>Manifest SHA-256</dt><dd className={styles.hash}>{selected.manifestSha256 || 'Unavailable'}</dd></div>
                </dl>
                <nav className={styles.modeTabs} aria-label="Page Mappings selected capture mode">
                  <button
                    type="button"
                    className={detailMode === 'explorer' ? styles.modeActive : ''}
                    aria-pressed={detailMode === 'explorer'}
                    disabled={retentionBusy || ocrApplyBusy}
                    onClick={() => setDetailMode('explorer')}
                  >Explorer</button>
                  <button
                    type="button"
                    className={detailMode === 'ocr-review' ? styles.modeActive : ''}
                    aria-pressed={detailMode === 'ocr-review'}
                    disabled={retentionBusy || ocrApplyBusy}
                    onClick={() => setDetailMode('ocr-review')}
                  >OCR Review</button>
                </nav>
                <div className={styles.modeContent} hidden={detailMode !== 'explorer'}>
                <div className={styles.notice}>Capture artifacts are read-only. Select an element or drag it into Memory List to stage it for the active Bot Job.</div>
                {captureLoading && <p className={styles.empty}>Loading immutable capture artifacts…</p>}
                {captureImage && <div className={styles.imageStage}>
                  <img
                    className={styles.captureImage}
                    src={captureImage}
                    alt="Selected scanned page capture"
                    onLoad={event => setCaptureImageSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    })}
                  />
                  {loadedCapture?.rectangles.map((rectangle, rectangleIndex) => {
                    const placement = parseRectangle(rectangle);
                    if (!placement) return null;
                    const elementIndex = Number.isInteger(rectangle.elementIndex)
                      ? rectangle.elementIndex
                      : rectangleIndex;
                    return <button
                      type="button"
                      key={`overlay-${rectangle.elementHash || rectangle.scannedElementId || rectangleIndex}`}
                      className={`${styles.overlay} ${selectedElementIndex === elementIndex ? styles.overlaySelected : ''}`}
                      style={placement}
                      aria-label={`Select scanned element ${elementIndex + 1}`}
                      title={`Element ${elementIndex + 1}`}
                      onClick={() => setSelectedElementIndex(elementIndex)}
                    />;
                  })}
                </div>}
                <label className={styles.searchLabel}>
                  Search captured elements
                  <input value={elementSearch} onChange={event => setElementSearch(event.target.value)} placeholder="name, text, XPath, CSS…" />
                </label>
                <section
                  className={styles.memoryDropZone}
                  aria-label="Selected elements for Memory List"
                  onDragOver={event => { if (canStage) event.preventDefault(); }}
                  onDrop={event => {
                    event.preventDefault();
                    if (!canStage) return;
                    const index = Number(event.dataTransfer.getData('application/x-page-mapping-index'));
                    if (Number.isInteger(index) && captureElements[index]) addToMemory(captureElements[index], index);
                  }}
                >
                  <div className={styles.memoryHeader}><strong>Memory List</strong><span>{memoryItems.length} selected</span></div>
                  <p>Drop captured elements here, or use Add. The existing Memory List window opens automatically.</p>
                  {memoryItems.length > 0 && <div className={styles.memoryChips}>{memoryItems.map(item => <span key={item.sourceItemKey}>{item.label}</span>)}</div>}
                </section>
                <div className={styles.elementResults}>
                  {filteredElements.map(({ element, index }) => {
                    const stageable = Boolean(memoryItemFor(element, index));
                    return (
                      <div
                        className={`${styles.elementRow} ${selectedElementIndex === index ? styles.elementRowSelected : ''}`}
                        key={`${selected.scanId}-${String(element.scannedElementId || index)}`}
                        draggable={canStage && stageable}
                        onDragStart={event => {
                          if (!stageable) {
                            event.preventDefault();
                            return;
                          }
                          event.dataTransfer.setData('application/x-page-mapping-index', String(index));
                        }}
                        onClick={() => setSelectedElementIndex(index)}
                      >
                        <div>
                          <strong>{String(element.clientNamed || element.definedName || element.someText || element.tagName || 'Element')}</strong>
                          <span>{String(element.typeElement || '')} · {String(element.xPath || element.cssSelector || 'locator unavailable')}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.addButton}
                          disabled={!canStage || !stageable}
                          onClick={event => { event.stopPropagation(); addToMemory(element, index); }}
                        >Add</button>
                      </div>
                    );
                  })}
                </div>
                </div>
                {detailMode === 'ocr-review' && <PageMappingsOcrReviewPanel
                  result={ocrReview}
                  captureImage={captureImage}
                  busy={ocrReviewBusy}
                  applying={ocrApplyBusy}
                  message={ocrMessage}
                  canRun={canRunOcr}
                  onRun={runOcrReview}
                  onApply={applyOcrNames}
                />}
              </>
            )}
          </section>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default PageMappingsPage;
