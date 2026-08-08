import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import PageMappingsCachePanel, {
  PageMappingsCacheState,
} from './page-mappings/PageMappingsCachePanel';
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
    setCacheState(emptyCacheState);
    setCacheBusy(false);
  }, [retireRescan]);

  const bootstrap = useCallback((expectedBindingEpoch?: string) => {
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
    const activeBindingEpoch = expectedBindingEpoch || bindingRef.current?.bindingEpoch || '';
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !activeBindingEpoch) {
      setStatus('Page Mappings ownership is not ready.');
      return;
    }
    const nextRequestId = requestId('capture');
    pendingCapture.current = { requestId: nextRequestId, scanId, bindingEpoch: activeBindingEpoch };
    setSelectedScanId(scanId);
    setLoadedCapture(null);
    setSelectedElementIndex(null);
    setCaptureImageSize({ width: 0, height: 0 });
    setCaptureLoading(true);
    webSocket.send(JSON.stringify({
      type: 'pageMappings.capture',
      sessionId,
      body: JSON.stringify({ requestId: nextRequestId, scanId, bindingEpoch: activeBindingEpoch }),
    }));
  }, [sessionId, webSocket]);

  const requestCacheState = useCallback((expectedBinding?: PageMappingsBinding) => {
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
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !active || rescanBusy) return;
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
  }, [rescanBusy, retireRescan, sessionId, webSocket]);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    if (connected) return;
    pendingCache.current = null;
    setCacheBusy(false);
    retireRescan();
  }, [connected, retireRescan]);

  useEffect(() => () => {
    if (rescanTimer.current !== null) {
      window.clearTimeout(rescanTimer.current);
      rescanTimer.current = null;
    }
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
          if (!body.ok) {
            setStatus(text(body.message) || 'Page Mappings history is unavailable.');
            continue;
          }
          const nextBinding = parseBinding(body);
          if (!nextBinding) {
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
          updateUrlHint(nextBinding.botJobId);
          const next = Array.isArray(body.snapshots)
            ? body.snapshots.map(parseSnapshot).filter((item): item is Snapshot => item !== null)
            : [];
          setSnapshots(next);
          const initial = next.find(item => item.status === 'READY') || null;
          setSelectedScanId(initial?.scanId ?? null);
          setStatus(next.length
            ? `${next.length} scan capture${next.length === 1 ? '' : 's'} available.`
            : 'No scan captures yet.');
          if (initial) loadCapture(initial.scanId, nextBinding.bindingEpoch);
          requestCacheState(nextBinding);
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
        }
      } catch {
        setStatus('Page Mappings received an invalid response.');
      }
    }
  }, [bootstrap, loadCapture, messages, requestCacheState, resetOwnerState, retireRescan, updateUrlHint]);

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
      || !memoryItems.length
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

  const captureImage = loadedCapture?.screenshotBase64
    ? `data:${loadedCapture.screenshotMime};base64,${loadedCapture.screenshotBase64}`
    : null;
  const canStage = Boolean(!invalidated
    && loadedCapture
    && loadedCapture.scanId === selectedScanId
    && !captureLoading);

  return (
    <DetachedPageShell title="Page Mappings" testId="page-mappings-workspace" onClose={onClose}>
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
            <button type="button" onClick={() => bootstrap(binding?.bindingEpoch)} disabled={!connected || invalidated}>Reload</button>
            <PagesOpenButton webSocket={webSocket} connected={connected} messages={messages} sessionId={sessionId} />
            <button type="button" className={styles.close} onClick={onClose}>Close</button>
          </div>
        </header>
        <div className={styles.status} role="status">{status}</div>
        <section className={styles.workspace} aria-label="Page Mappings explorer">
          <aside className={styles.history}>
            <div className={styles.sectionHeading}><h2>Captures</h2><span>{snapshots.length}</span></div>
            {snapshots.length === 0 ? <p className={styles.empty}>Run Page Scanner to create the first immutable capture.</p> : (
              <div className={styles.captureList}>
                {snapshots.map(item => (
                  <button
                    type="button"
                    key={item.scanId}
                    className={`${styles.capture} ${item.scanId === selectedScanId ? styles.selected : ''}`}
                    onClick={() => {
                      setElementSearch('');
                      setSelectedElementIndex(null);
                      loadCapture(item.scanId);
                    }}
                    disabled={item.status !== 'READY'}
                  >
                    <strong>{new Date(item.capturedAt).toLocaleString()}</strong>
                    <span>{item.pageUrl || item.pageKey}</span>
                    <small>{item.elementCount} elements · {item.status}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <section className={styles.details} aria-label="Selected scan capture">
            <PageMappingsCachePanel
              cache={cacheState}
              busy={cacheBusy || rescanBusy}
              disabled={!connected || invalidated}
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
                        draggable={stageable}
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
                          disabled={!stageable}
                          onClick={event => { event.stopPropagation(); addToMemory(element, index); }}
                        >Add</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default PageMappingsPage;
