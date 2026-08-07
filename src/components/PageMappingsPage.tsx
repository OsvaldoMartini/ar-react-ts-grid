import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import type { ElementDTO } from './instructionsMockData';
import type { MemoryListItem, MemoryListItemIcon, MemoryListSnapshot } from './memoryList.contract';
import styles from './PageMappingsPage.module.scss';

export const PAGE_MAPPINGS_SESSION_ID = 'pageMappingsManager';

type Snapshot = {
  scanId: string;
  homeUrlId?: number;
  pageKey: string;
  pageUrl: string;
  capturedAt: string;
  elementCount: number;
  artifactPath: string;
  manifestSha256: string;
  status: 'READY' | 'FAILED' | string;
  pinned: boolean;
};
type CaptureElement = Record<string, unknown>;
type MappingMemoryItem = MemoryListItem & { payload: { elementDTO: ElementDTO; captureId: string; pageKey: string; expectedLastScannedAt?: string } };

type Props = { socketPort: number; sessionId: string; onClose?: () => void };

const PageMappingsPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  useEffect(() => { document.title = 'Page Mappings'; }, []);
  const { webSocket, connected, messages } = useWebSocket(socketPort, sessionId);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting to Page Mappings…');
  const [captureElements, setCaptureElements] = useState<CaptureElement[]>([]);
  const [captureImage, setCaptureImage] = useState<string | null>(null);
  const [elementSearch, setElementSearch] = useState('');
  const [captureLoading, setCaptureLoading] = useState(false);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [captureImageSize, setCaptureImageSize] = useState({ width: 0, height: 0 });
  const [memoryItems, setMemoryItems] = useState<MappingMemoryItem[]>([]);
  const [memoryOwnerEpoch, setMemoryOwnerEpoch] = useState('');
  const memoryOpenRequested = useRef(false);
  const memoryOpened = useRef(false);
  const bootstrapCursor = useRef(0);
  const captureCursor = useRef(0);
  const memoryCursor = useRef(0);
  const sourceBotJobId = useMemo(() => {
    const value = Number(new URLSearchParams(window.location.search).get('sourceBotJobId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }, []);
  const homeBankingId = useMemo(() => {
    const value = Number(new URLSearchParams(window.location.search).get('homeBankingId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }, []);

  const bootstrap = useCallback(() => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus('Page Mappings is disconnected.');
      return;
    }
    setStatus('Loading scan history…');
    webSocket.send(JSON.stringify({
      type: 'pageMappings.bootstrap',
      sessionId,
      body: JSON.stringify({
        requestId: `page-mappings-${Date.now()}`,
        botJobId: sourceBotJobId,
        homeBankingId,
      }),
    }));
  }, [homeBankingId, sessionId, sourceBotJobId, webSocket]);

  const loadCapture = useCallback((scanId: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    setCaptureLoading(true);
    webSocket.send(JSON.stringify({ type: 'pageMappings.capture', sessionId,
      body: JSON.stringify({ scanId, botJobId: sourceBotJobId, homeBankingId }) }));
  }, [homeBankingId, sessionId, sourceBotJobId, webSocket]);

  useEffect(() => {
    if (connected) bootstrap();
  }, [bootstrap, connected]);

  useEffect(() => {
    for (const raw of messages.slice(bootstrapCursor.current)) {
      bootstrapCursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        const operation = envelope.operationId || envelope.type;
        if (operation !== 'pageMappings.bootstrapResponse') continue;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body || {};
        if (!body.ok) {
          setStatus(body.message || 'Page Mappings history is unavailable.');
          continue;
        }
        const next = Array.isArray(body.snapshots) ? body.snapshots as Snapshot[] : [];
        setSnapshots(next);
        setSelectedScanId(current => current && next.some(item => item.scanId === current) ? current : next[0]?.scanId ?? null);
        setStatus(next.length ? `${next.length} scan capture${next.length === 1 ? '' : 's'} available.` : 'No scan captures yet.');
      } catch {
        setStatus('Page Mappings received an invalid response.');
      }
    }
  }, [messages]);

  useEffect(() => {
    for (const raw of messages.slice(captureCursor.current)) {
      captureCursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        if ((envelope.operationId || envelope.type) !== 'pageMappings.captureResponse') continue;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body || {};
        setCaptureLoading(false);
        if (!body.ok) { setStatus(body.message || 'The selected capture could not be loaded.'); continue; }
        setCaptureElements(Array.isArray(body.elements) ? body.elements : []);
        setSelectedElementIndex(null);
        setCaptureImageSize({ width: 0, height: 0 });
        setCaptureImage(typeof body.screenshotBase64 === 'string'
          ? `data:${body.screenshotMime || 'image/png'};base64,${body.screenshotBase64}` : null);
      } catch { setCaptureLoading(false); }
    }
  }, [messages]);

  const parseRectangle = useCallback((element: CaptureElement) => {
    if (!captureImageSize.width || !captureImageSize.height) return null;
    const raw = element.coordinates ?? element.bounds ?? element.boundingBox;
    const numbers = String(raw ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (numbers.length < 4) return null;
    const [x, y, width, height] = numbers;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
    return { left: `${Math.max(0, x) / captureImageSize.width * 100}%`, top: `${Math.max(0, y) / captureImageSize.height * 100}%`, width: `${Math.min(width, captureImageSize.width) / captureImageSize.width * 100}%`, height: `${Math.min(height, captureImageSize.height) / captureImageSize.height * 100}%` };
  }, [captureImageSize]);

  const filteredElements = useMemo(() => captureElements
    .map((element, index) => ({ element, index }))
    .filter(({ element }) => JSON.stringify(element).toLowerCase().includes(elementSearch.toLowerCase()))
    .slice(0, 200), [captureElements, elementSearch]);

  const selected = snapshots.find(item => item.scanId === selectedScanId) || null;

  const toElementDTO = useCallback((element: CaptureElement): ElementDTO => ({
    id: Number(element.id) || 0,
    typeElement: String(element.typeElement || element.type || 'OUTPUT'),
    tagName: String(element.tagName || ''),
    xPath: String(element.xPath || ''),
    someText: String(element.someText || element.text || ''),
    attribId: String(element.attribId || ''),
    attribName: String(element.attribName || ''),
    coordinates: String(element.coordinates || ''),
    attributeData: Array.isArray(element.attributeData) ? element.attributeData as ElementDTO['attributeData'] : [],
    customXPath: String(element.customXPath || ''),
    iFrameXPath: String(element.iFrameXPath || ''),
    cssSelector: element.cssSelector == null ? null : String(element.cssSelector),
    attributeValue: String(element.attributeValue || ''),
    attributeType: String(element.attributeType || ''),
    autoScroll: String(element.autoScroll || ''),
    autoEnter: String(element.autoEnter || ''),
    active: element.active == null ? true : Boolean(element.active),
    definedName: element.definedName == null ? null : String(element.definedName),
    clientNamed: element.clientNamed == null ? null : String(element.clientNamed),
  }), []);

  const memoryItemFor = useCallback((element: CaptureElement, index: number): MappingMemoryItem => {
    const label = String(element.clientNamed || element.definedName || element.someText || element.tagName || `Element ${index + 1}`);
    const sourceItemKey = `${selectedScanId || 'capture'}:${index}:${String(element.id || index)}`;
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
        elementDTO: toElementDTO(element),
        captureId: selectedScanId || '',
        pageKey: selected?.pageKey || '',
        expectedLastScannedAt: selected?.capturedAt,
      },
    };
  }, [selectedScanId, selected, toElementDTO]);

  const addToMemory = useCallback((element: CaptureElement, index: number) => {
    const item = memoryItemFor(element, index);
    setMemoryItems(current => current.some(existing => existing.sourceItemKey === item.sourceItemKey) ? current : [...current, item]);
    memoryOpenRequested.current = true;
  }, [memoryItemFor]);

  const memorySnapshot = useMemo<MemoryListSnapshot>(() => ({
    ownerEpoch: memoryOwnerEpoch,
    sourceKind: 'PAGE_MAPPINGS',
    homeBankingId,
    botJobId: sourceBotJobId,
    botJobName: '',
    items: memoryItems,
    blocks: [],
    targetBlockId: null,
    emptyMessage: 'Select a captured element to add it to Memory List.',
    status: memoryItems.length ? `${memoryItems.length} mapping${memoryItems.length === 1 ? '' : 's'} selected.` : 'Memory List ready',
    busy: false,
    canApply: false,
  }), [homeBankingId, memoryItems, memoryOwnerEpoch, sourceBotJobId]);

  useEffect(() => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !sourceBotJobId || !memoryItems.length) return;
    const operation = memoryOpenRequested.current || !memoryOpened.current ? 'memoryList.open' : 'memoryList.sync';
    const requestId = `page-mappings-memory-${Date.now()}`;
    webSocket.send(JSON.stringify({ type: operation, sessionId, homeBankingId, botJobId: sourceBotJobId,
      body: JSON.stringify({ requestId, homeBankingId, botJobId: sourceBotJobId, ownerEpoch: memoryOwnerEpoch, snapshot: memorySnapshot }) }));
    memoryOpenRequested.current = false;
  }, [homeBankingId, memoryItems, memoryOwnerEpoch, memorySnapshot, sessionId, sourceBotJobId, webSocket]);

  useEffect(() => {
    for (const raw of messages.slice(memoryCursor.current)) {
      memoryCursor.current += 1;
      try {
        const envelope = JSON.parse(raw);
        const operation = envelope.operationId || envelope.type;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body || {};
        if (operation === 'memoryList.openResponse' || operation === 'memoryList.syncResponse') {
          if (!body.ok) { setStatus(body.message || 'Memory List could not be updated.'); continue; }
          if (typeof body.ownerEpoch === 'string') setMemoryOwnerEpoch(body.ownerEpoch);
          memoryOpened.current = true;
          setStatus(body.message || 'Selected mapping added to Memory List.');
        } else if (operation === 'memoryList.command') {
          const command = String(body.command || body.action || '').toUpperCase();
          const itemKey = String(body.payload?.sourceItemKey || body.payload?.itemKey || '');
          if (command === 'CLEAR') setMemoryItems([]);
          if (command === 'REMOVE' && itemKey) setMemoryItems(current => current.filter(item => item.sourceItemKey !== itemKey));
        }
      } catch { /* Ignore messages owned by other Page Mappings operations. */ }
    }
  }, [messages]);

  return (
    <DetachedPageShell title="Page Mappings" testId="page-mappings-workspace" onClose={onClose}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PAGE SCAN HISTORY</p>
            <h1>Page Mappings</h1>
            <p className={styles.subtitle}>Owner-scoped captures for Bot Job {sourceBotJobId || '—'}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={bootstrap} disabled={!connected}>Reload</button>
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
                  <button type="button" key={item.scanId}
                    className={`${styles.capture} ${item.scanId === selectedScanId ? styles.selected : ''}`}
                    onClick={() => { setSelectedScanId(item.scanId); setElementSearch(''); setSelectedElementIndex(null); loadCapture(item.scanId); }}>
                    <strong>{new Date(item.capturedAt).toLocaleString()}</strong>
                    <span>{item.pageUrl || item.pageKey}</span>
                    <small>{item.elementCount} elements · {item.status}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <section className={styles.details} aria-label="Selected scan capture">
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
                  <div><dt>Artifact folder</dt><dd>{selected.artifactPath || 'Unavailable'}</dd></div>
                  <div><dt>Manifest SHA-256</dt><dd className={styles.hash}>{selected.manifestSha256 || 'Unavailable'}</dd></div>
                </dl>
                <div className={styles.notice}>Capture artifacts are read-only. Select an element or drag it into Memory List to stage it for the active Bot Job.</div>
                {captureLoading && <p className={styles.empty}>Loading immutable capture artifacts…</p>}
                {captureImage && <div className={styles.imageStage}>
                  <img className={styles.captureImage} src={captureImage} alt="Selected scanned page capture"
                    onLoad={event => setCaptureImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
                  {captureElements.map((element, index) => {
                    const rectangle = parseRectangle(element);
                    if (!rectangle) return null;
                    return <button type="button" key={`overlay-${index}`} className={`${styles.overlay} ${selectedElementIndex === index ? styles.overlaySelected : ''}`}
                      style={rectangle} aria-label={`Select scanned element ${index + 1}`} title={`Element ${index + 1}`}
                      onClick={() => setSelectedElementIndex(index)} />;
                  })}
                </div>}
                <label className={styles.searchLabel}>
                  Search captured elements
                  <input value={elementSearch} onChange={event => setElementSearch(event.target.value)} placeholder="name, text, XPath, CSS…" />
                </label>
                <section className={styles.memoryDropZone} aria-label="Selected elements for Memory List"
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    const index = Number(event.dataTransfer.getData('application/x-page-mapping-index'));
                    if (Number.isInteger(index) && captureElements[index]) addToMemory(captureElements[index], index);
                  }}>
                  <div className={styles.memoryHeader}><strong>Memory List</strong><span>{memoryItems.length} selected</span></div>
                  <p>Drop captured elements here, or use Add. The existing Memory List window opens automatically.</p>
                  {memoryItems.length > 0 && <div className={styles.memoryChips}>{memoryItems.map(item => <span key={item.sourceItemKey}>{item.label}</span>)}</div>}
                </section>
                <div className={styles.elementResults}>
                  {filteredElements.map(({ element, index }) => (
                    <div className={`${styles.elementRow} ${selectedElementIndex === index ? styles.elementRowSelected : ''}`} key={`${selected.scanId}-${index}`} draggable
                      onDragStart={event => event.dataTransfer.setData('application/x-page-mapping-index', String(index))}
                      onClick={() => setSelectedElementIndex(index)}>
                      <div><strong>{String(element.clientNamed || element.definedName || element.someText || element.tagName || 'Element')}</strong>
                        <span>{String(element.typeElement || '')} · {String(element.xPath || element.cssSelector || 'locator unavailable')}</span></div>
                      <button type="button" className={styles.addButton} onClick={event => { event.stopPropagation(); addToMemory(element, index); }}>Add</button>
                    </div>
                  ))}
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
