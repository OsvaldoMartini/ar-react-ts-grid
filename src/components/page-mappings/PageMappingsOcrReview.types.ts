export const PAGE_MAPPINGS_OCR_REVIEW_CONTRACT_VERSION = 1;

export type PageMappingsOcrQuality = 'EXACT_CONTAIN' | 'OVERLAP' | 'PROXIMITY' | 'NONE';

export type PageMappingsOcrCorrelation = {
  contractVersion: 1;
  requestId: string;
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
  scanId: string;
  pageKey: string;
  capturedAt: string;
  manifestSha256: string;
};

export type PageMappingsOcrReviewRow = {
  elementIndex: number;
  scannedElementId: number;
  elementHash: string;
  expectedLastScannedAt: string;
  expectedScanCount: number;
  definedName: string;
  clientNamed: string | null;
  quality: PageMappingsOcrQuality;
  tag: string;
  domText: string;
  ocrText: string;
  xPath: string;
  iFrameXPath: string;
  confidence: number;
};

export type PageMappingsOcrWord = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type PageMappingsOcrReviewResult = PageMappingsOcrCorrelation & {
  source: string;
  wordCount: number;
  counts: Record<PageMappingsOcrQuality, number>;
  rows: PageMappingsOcrReviewRow[];
  words: PageMappingsOcrWord[];
  message: string;
};

export type PageMappingsOcrAliasChange = {
  scannedElementId: number;
  elementHash: string;
  expectedLastScannedAt: string;
  expectedScanCount: number;
  expectedClientNamed: string | null;
  clientNamed: string | null;
};

export type PageMappingsOcrAppliedAlias = {
  scannedElementId: number;
  elementHash: string;
  lastScannedAt: string;
  scanCount: number;
  clientNamed: string | null;
  changed: boolean;
};

export type PageMappingsOcrApplyResult = PageMappingsOcrCorrelation & {
  changedCount: number;
  aliases: PageMappingsOcrAppliedAlias[];
  message: string;
};

const qualityValues: readonly PageMappingsOcrQuality[] = [
  'EXACT_CONTAIN',
  'OVERLAP',
  'PROXIMITY',
  'NONE',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const stringValue = (value: unknown): string => typeof value === 'string' ? value : '';

const nullableString = (record: Record<string, unknown>, field: string): string | null | undefined => {
  if (!Object.prototype.hasOwnProperty.call(record, field) || record[field] == null) return null;
  return typeof record[field] === 'string' ? record[field] as string : undefined;
};

const safeInteger = (value: unknown, minimum = 0): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
};

const finiteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const quality = (value: unknown): PageMappingsOcrQuality =>
  qualityValues.includes(value as PageMappingsOcrQuality)
    ? value as PageMappingsOcrQuality
    : 'NONE';

const exactCorrelation = (
  body: Record<string, unknown>,
  pending: PageMappingsOcrCorrelation,
): boolean => safeInteger(body.contractVersion) === PAGE_MAPPINGS_OCR_REVIEW_CONTRACT_VERSION
  && stringValue(body.requestId) === pending.requestId
  && stringValue(body.bindingEpoch) === pending.bindingEpoch
  && safeInteger(body.workspaceEpoch, 1) === pending.workspaceEpoch
  && safeInteger(body.homeBankingId, 1) === pending.homeBankingId
  && safeInteger(body.botJobId, 1) === pending.botJobId
  && stringValue(body.scanId) === pending.scanId
  && stringValue(body.pageKey) === pending.pageKey
  && stringValue(body.capturedAt) === pending.capturedAt
  && stringValue(body.manifestSha256) === pending.manifestSha256;

const optionalFieldMatches = (
  body: Record<string, unknown>,
  field: keyof PageMappingsOcrCorrelation,
  expected: string | number,
): boolean => {
  if (!Object.prototype.hasOwnProperty.call(body, field)) return true;
  const value = body[field];
  return typeof expected === 'number'
    ? safeInteger(value) === expected
    : stringValue(value) === expected;
};

/** Failures settle the exact request; any authority assertion supplied by Java must still match. */
export const pageMappingsOcrFailureMatches = (
  body: Record<string, unknown>,
  pending: PageMappingsOcrCorrelation,
): boolean => body.ok === false
  && stringValue(body.requestId) === pending.requestId
  && optionalFieldMatches(body, 'contractVersion', pending.contractVersion)
  && optionalFieldMatches(body, 'bindingEpoch', pending.bindingEpoch)
  && optionalFieldMatches(body, 'workspaceEpoch', pending.workspaceEpoch)
  && optionalFieldMatches(body, 'homeBankingId', pending.homeBankingId)
  && optionalFieldMatches(body, 'botJobId', pending.botJobId)
  && optionalFieldMatches(body, 'scanId', pending.scanId)
  && optionalFieldMatches(body, 'pageKey', pending.pageKey)
  && optionalFieldMatches(body, 'capturedAt', pending.capturedAt)
  && optionalFieldMatches(body, 'manifestSha256', pending.manifestSha256);

export const pageMappingsOcrMessage = (
  body: Record<string, unknown>,
  fallback: string,
): string => stringValue(body.error) || stringValue(body.message) || fallback;

const parseReviewRow = (value: unknown): PageMappingsOcrReviewRow | null => {
  if (!isRecord(value)) return null;
  const elementIndex = safeInteger(value.elementIndex);
  const scannedElementId = safeInteger(value.scannedElementId);
  const expectedScanCount = safeInteger(value.expectedScanCount);
  const confidence = finiteNumber(value.confidence);
  const clientNamed = nullableString(value, 'clientNamed');
  if (elementIndex == null || scannedElementId == null || expectedScanCount == null
    || confidence == null || clientNamed === undefined) return null;
  return {
    elementIndex,
    scannedElementId,
    elementHash: stringValue(value.elementHash),
    expectedLastScannedAt: stringValue(value.expectedLastScannedAt),
    expectedScanCount,
    definedName: stringValue(value.definedName),
    clientNamed,
    quality: quality(value.quality),
    tag: stringValue(value.tag),
    domText: stringValue(value.domText),
    ocrText: stringValue(value.ocrText),
    xPath: stringValue(value.xPath),
    iFrameXPath: stringValue(value.iFrameXPath),
    confidence,
  };
};

const parseWord = (value: unknown): PageMappingsOcrWord | null => {
  if (!isRecord(value)) return null;
  const x = finiteNumber(value.x);
  const y = finiteNumber(value.y);
  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);
  const confidence = finiteNumber(value.confidence);
  if (x == null || y == null || width == null || height == null || confidence == null
    || width <= 0 || height <= 0) return null;
  return { text: stringValue(value.text), x, y, width, height, confidence };
};

export const parsePageMappingsOcrReview = (
  body: Record<string, unknown>,
  pending: PageMappingsOcrCorrelation,
): PageMappingsOcrReviewResult | null => {
  if (body.ok !== true || !exactCorrelation(body, pending)
    || !Array.isArray(body.rows) || !Array.isArray(body.words)
    || body.rows.length > 100_000 || body.words.length > 100_000
    || !isRecord(body.counts)) return null;
  const rows = body.rows.map(parseReviewRow);
  const words = body.words.map(parseWord);
  const wordCount = safeInteger(body.wordCount);
  if (rows.some(row => row === null) || words.some(word => word === null) || wordCount == null) {
    return null;
  }
  const counts = qualityValues.reduce((result, key) => {
    result[key] = safeInteger((body.counts as Record<string, unknown>)[key]) ?? 0;
    return result;
  }, {} as Record<PageMappingsOcrQuality, number>);
  if (wordCount !== words.length
    || qualityValues.reduce((total, key) => total + counts[key], 0) !== rows.length) return null;
  return {
    ...pending,
    source: stringValue(body.source),
    wordCount,
    counts,
    rows: rows as PageMappingsOcrReviewRow[],
    words: words as PageMappingsOcrWord[],
    message: pageMappingsOcrMessage(body, 'OCR Review completed.'),
  };
};

const parseAppliedAlias = (value: unknown): PageMappingsOcrAppliedAlias | null => {
  if (!isRecord(value)) return null;
  const scannedElementId = safeInteger(value.scannedElementId, 1);
  const scanCount = safeInteger(value.scanCount, 1);
  const clientNamed = nullableString(value, 'clientNamed');
  if (scannedElementId == null || scanCount == null || clientNamed === undefined
    || typeof value.changed !== 'boolean') return null;
  return {
    scannedElementId,
    elementHash: stringValue(value.elementHash),
    lastScannedAt: stringValue(value.lastScannedAt),
    scanCount,
    clientNamed,
    changed: value.changed,
  };
};

export const parsePageMappingsOcrApply = (
  body: Record<string, unknown>,
  pending: PageMappingsOcrCorrelation,
  changes: readonly PageMappingsOcrAliasChange[],
): PageMappingsOcrApplyResult | null => {
  if (body.ok !== true || !exactCorrelation(body, pending) || !Array.isArray(body.aliases)
    || body.aliases.length !== changes.length) return null;
  const aliases = body.aliases.map(parseAppliedAlias);
  const changedCount = safeInteger(body.changedCount);
  if (aliases.some(alias => alias === null)
    || changedCount == null
    || changedCount > aliases.length) return null;
  const expected = new Map(changes.map(change => [change.scannedElementId, change.elementHash.toLowerCase()]));
  const seen = new Set<number>();
  for (const alias of aliases as PageMappingsOcrAppliedAlias[]) {
    if (seen.has(alias.scannedElementId)
      || expected.get(alias.scannedElementId) !== alias.elementHash.toLowerCase()
      || !alias.lastScannedAt) return null;
    seen.add(alias.scannedElementId);
  }
  return {
    ...pending,
    changedCount,
    aliases: aliases as PageMappingsOcrAppliedAlias[],
    message: pageMappingsOcrMessage(body, 'OCR Review names were saved.'),
  };
};

export const pageMappingsOcrRowKey = (row: PageMappingsOcrReviewRow): string =>
  `${row.scannedElementId}:${row.elementHash}:${row.elementIndex}`;

export const pageMappingsOcrRowPersistable = (row: PageMappingsOcrReviewRow): boolean =>
  row.scannedElementId > 0
  && row.expectedScanCount > 0
  && Boolean(row.elementHash && row.expectedLastScannedAt);
