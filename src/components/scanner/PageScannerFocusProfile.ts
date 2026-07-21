export type PageScannerFocusProfile = {
  id?: number;
  key: string;
  label: string;
  searchTerms: string;
  sortOrder: number;
  protected: boolean;
};

export type PageScannerProfileRequestOperation =
  | 'pageScannerProfile.list'
  | 'pageScannerProfile.save'
  | 'pageScannerProfile.delete';

export type PendingPageScannerProfileRequest = {
  operation: PageScannerProfileRequestOperation;
  profileKey?: string;
};

export type PageScannerProfileResponseResolution = {
  requestId: string;
  ok: boolean;
  error: string;
  profiles: PageScannerFocusProfile[];
  replaceProfiles: boolean;
  selectedProfileKey: string | null;
};

export const PAGE_SCANNER_CUSTOM_PROFILE_KEY = '__custom__';
export const PAGE_SCANNER_DEFAULT_PROFILE_KEY = 'factory-default';

export const FALLBACK_PAGE_SCANNER_PROFILES: PageScannerFocusProfile[] = [
  { id: undefined, key: PAGE_SCANNER_DEFAULT_PROFILE_KEY, label: 'All page scanner controls', searchTerms: '', sortOrder: 10, protected: true },
  { id: undefined, key: 'all-interactive', label: 'All interactive controls', searchTerms: 'button, a, select, option, input, textarea, role, aria-haspopup, data-testid', sortOrder: 20, protected: false },
  { id: undefined, key: 'select-options', label: 'Select options', searchTerms: 'select, option, combobox, listbox', sortOrder: 30, protected: false },
  { id: undefined, key: 'inputs', label: 'Inputs and textareas', searchTerms: 'input, textarea, textbox, contenteditable', sortOrder: 40, protected: false },
  { id: undefined, key: 'clickables', label: 'Buttons and clickables', searchTerms: 'button, link, menuitem, tab, treeitem, svg', sortOrder: 50, protected: false },
  { id: undefined, key: 'outputs', label: 'Labels and outputs', searchTerms: 'label, span, p, div, h1, h2, h3, output', sortOrder: 60, protected: false },
  { id: undefined, key: 'data-ids', label: 'Data/test id attributes', searchTerms: 'attr:data-testid, attr:data-test-id, attr:test-id, attr:data-cy, attr:data-qa, attr:id, attr:name', sortOrder: 70, protected: false },
];

const copyFallbackProfiles = (): PageScannerFocusProfile[] =>
  FALLBACK_PAGE_SCANNER_PROFILES.map(profile => ({ ...profile }));

export function normalizePageScannerProfiles(value: unknown): PageScannerFocusProfile[] {
  if (!Array.isArray(value)) return [];

  const byKey = new Map<string, PageScannerFocusProfile>();
  value.forEach((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') return;
    const raw = candidate as Record<string, unknown>;
    const key = typeof raw.key === 'string' ? raw.key.trim() : '';
    const label = typeof raw.label === 'string' ? raw.label.trim() : '';
    if (!key || !label || key === PAGE_SCANNER_CUSTOM_PROFILE_KEY) return;

    const parsedId = Number(raw.id);
    const parsedSortOrder = Number(raw.sortOrder);
    byKey.set(key, {
      ...(Number.isSafeInteger(parsedId) && parsedId > 0 ? { id: parsedId } : {}),
      key,
      label,
      searchTerms: key === PAGE_SCANNER_DEFAULT_PROFILE_KEY
        ? ''
        : typeof raw.searchTerms === 'string' ? raw.searchTerms : '',
      sortOrder: Number.isFinite(parsedSortOrder) ? Math.trunc(parsedSortOrder) : (index + 1) * 10,
      protected: raw.protected === true || key === PAGE_SCANNER_DEFAULT_PROFILE_KEY,
    });
  });

  return Array.from(byKey.values()).sort((left, right) => (
    left.sortOrder - right.sortOrder
    || left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
    || left.key.localeCompare(right.key)
  ));
}

export function pageScannerProfilesOrFallback(value: unknown): PageScannerFocusProfile[] {
  const normalized = normalizePageScannerProfiles(value);
  return normalized.length > 0 ? normalized : copyFallbackProfiles();
}

export function pageScannerProfileKeyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function pageScannerProfileRequestForResponse(
  responseOperation: unknown,
): PageScannerProfileRequestOperation | null {
  switch (responseOperation) {
    case 'pageScannerProfile.listResponse':
      return 'pageScannerProfile.list';
    case 'pageScannerProfile.saveResponse':
      return 'pageScannerProfile.save';
    case 'pageScannerProfile.deleteResponse':
      return 'pageScannerProfile.delete';
    default:
      return null;
  }
}

export function pageScannerProfilesEqual(
  left: PageScannerFocusProfile[],
  right: PageScannerFocusProfile[],
): boolean {
  return left.length === right.length && left.every((profile, index) => {
    const candidate = right[index];
    return Boolean(candidate)
      && profile.id === candidate.id
      && profile.key === candidate.key
      && profile.label === candidate.label
      && profile.searchTerms === candidate.searchTerms
      && profile.sortOrder === candidate.sortOrder
      && profile.protected === candidate.protected;
  });
}

export function resolvePageScannerProfileResponse(
  responseOperation: unknown,
  body: unknown,
  pendingRequests: ReadonlyMap<string, PendingPageScannerProfileRequest>,
  currentProfiles: PageScannerFocusProfile[],
  currentProfileKey: string,
): PageScannerProfileResponseResolution | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Record<string, unknown>;
  const requestId = typeof payload.requestId === 'string' ? payload.requestId : '';
  const expectedOperation = pageScannerProfileRequestForResponse(responseOperation);
  const pending = requestId ? pendingRequests.get(requestId) : undefined;
  if (!requestId || !expectedOperation || !pending || pending.operation !== expectedOperation) return null;

  const replaceProfiles = Array.isArray(payload.profiles);
  const profiles = replaceProfiles
    ? pageScannerProfilesOrFallback(payload.profiles)
    : currentProfiles;
  const ok = payload.ok !== false;
  let selectedProfileKey: string | null = null;
  if (ok) {
    const responseSelection = typeof payload.selectedProfileKey === 'string'
      ? payload.selectedProfileKey
      : '';
    const requestedSelection = responseSelection || pending.profileKey || currentProfileKey;
    selectedProfileKey = profiles.some(profile => profile.key === requestedSelection)
      ? requestedSelection
      : profiles.some(profile => profile.key === PAGE_SCANNER_DEFAULT_PROFILE_KEY)
        ? PAGE_SCANNER_DEFAULT_PROFILE_KEY
        : profiles[0]?.key || null;
  }

  return {
    requestId,
    ok,
    error: ok ? '' : String(payload.error || payload.message || 'The Page Scanner profile operation failed.'),
    profiles,
    replaceProfiles,
    selectedProfileKey,
  };
}
