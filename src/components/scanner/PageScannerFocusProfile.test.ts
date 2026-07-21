import {
  FALLBACK_PAGE_SCANNER_PROFILES,
  PAGE_SCANNER_CUSTOM_PROFILE_KEY,
  PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  normalizePageScannerProfiles,
  pageScannerProfilesEqual,
  pageScannerProfileKeyFromLabel,
  pageScannerProfileRequestForResponse,
  pageScannerProfilesOrFallback,
  resolvePageScannerProfileResponse,
} from './PageScannerFocusProfile';

test('keeps the seven existing Page Scanner choices as the disconnected fallback', () => {
  expect(FALLBACK_PAGE_SCANNER_PROFILES.map(profile => [
    profile.key,
    profile.label,
    profile.searchTerms,
    profile.sortOrder,
    profile.protected,
  ])).toEqual([
    ['factory-default', 'All page scanner controls', '', 10, true],
    ['all-interactive', 'All interactive controls', 'button, a, select, option, input, textarea, role, aria-haspopup, data-testid', 20, false],
    ['select-options', 'Select options', 'select, option, combobox, listbox', 30, false],
    ['inputs', 'Inputs and textareas', 'input, textarea, textbox, contenteditable', 40, false],
    ['clickables', 'Buttons and clickables', 'button, link, menuitem, tab, treeitem, svg', 50, false],
    ['outputs', 'Labels and outputs', 'label, span, p, div, h1, h2, h3, output', 60, false],
    ['data-ids', 'Data/test id attributes', 'attr:data-testid, attr:data-test-id, attr:test-id, attr:data-cy, attr:data-qa, attr:id, attr:name', 70, false],
  ]);

  const firstRead = pageScannerProfilesOrFallback(null);
  firstRead[0].label = 'changed locally';
  expect(pageScannerProfilesOrFallback(undefined)[0].label).toBe('All page scanner controls');
});

test('normalizes the authoritative database list and protects the blank factory default', () => {
  const profiles = normalizePageScannerProfiles([
    null,
    { key: PAGE_SCANNER_CUSTOM_PROFILE_KEY, label: 'Reserved UI entry' },
    { id: '8', key: ' alpha ', label: ' First ', searchTerms: 'button', sortOrder: '30' },
    { id: 9, key: 'beta', label: 'Beta', searchTerms: 'input', sortOrder: 20 },
    { id: 10, key: 'alpha', label: 'Latest Alpha', searchTerms: 'a', sortOrder: 15, protected: true },
    { id: 1, key: PAGE_SCANNER_DEFAULT_PROFILE_KEY, label: 'Everything', searchTerms: 'must be discarded', sortOrder: 1 },
    { key: '', label: 'Invalid' },
  ]);

  expect(profiles).toEqual([
    {
      id: 1,
      key: PAGE_SCANNER_DEFAULT_PROFILE_KEY,
      label: 'Everything',
      searchTerms: '',
      sortOrder: 1,
      protected: true,
    },
    {
      id: 10,
      key: 'alpha',
      label: 'Latest Alpha',
      searchTerms: 'a',
      sortOrder: 15,
      protected: true,
    },
    {
      id: 9,
      key: 'beta',
      label: 'Beta',
      searchTerms: 'input',
      sortOrder: 20,
      protected: false,
    },
  ]);
});

test('creates stable profile keys from user-facing labels', () => {
  expect(pageScannerProfileKeyFromLabel('  Depósitos & QA / 2026  ')).toBe('depositos-qa-2026');
  expect(pageScannerProfileKeyFromLabel('***')).toBe('');
  expect(pageScannerProfileKeyFromLabel('x'.repeat(120))).toHaveLength(64);
});

test('maps only correlated profile response operations', () => {
  expect(pageScannerProfileRequestForResponse('pageScannerProfile.listResponse')).toBe('pageScannerProfile.list');
  expect(pageScannerProfileRequestForResponse('pageScannerProfile.saveResponse')).toBe('pageScannerProfile.save');
  expect(pageScannerProfileRequestForResponse('pageScannerProfile.deleteResponse')).toBe('pageScannerProfile.delete');
  expect(pageScannerProfileRequestForResponse('pageScannerProfile.save')).toBeNull();
  expect(pageScannerProfileRequestForResponse(null)).toBeNull();
});

test('resolves only the correlated request and applies authoritative failure profiles', () => {
  const current = pageScannerProfilesOrFallback(null);
  const pending = new Map([
    ['save-1', { operation: 'pageScannerProfile.save' as const, profileKey: 'new-profile' }],
  ]);
  const authoritative = [
    { id: 1, key: PAGE_SCANNER_DEFAULT_PROFILE_KEY, label: 'All page scanner controls', searchTerms: 'ignored', sortOrder: 10, protected: true },
    { id: 12, key: 'server-profile', label: 'Server profile', searchTerms: 'attr:test-id', sortOrder: 20, protected: false },
  ];

  expect(resolvePageScannerProfileResponse(
    'pageScannerProfile.saveResponse',
    { requestId: 'wrong', ok: false, profiles: authoritative },
    pending,
    current,
    PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  )).toBeNull();
  expect(resolvePageScannerProfileResponse(
    'pageScannerProfile.deleteResponse',
    { requestId: 'save-1', ok: false, profiles: authoritative },
    pending,
    current,
    PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  )).toBeNull();

  const failure = resolvePageScannerProfileResponse(
    'pageScannerProfile.saveResponse',
    { requestId: 'save-1', ok: false, message: 'Duplicate profile', profiles: authoritative },
    pending,
    current,
    PAGE_SCANNER_CUSTOM_PROFILE_KEY,
  );
  expect(failure).not.toBeNull();
  expect(failure).toMatchObject({
    requestId: 'save-1',
    ok: false,
    error: 'Duplicate profile',
    replaceProfiles: true,
    selectedProfileKey: null,
  });
  expect(failure?.profiles.map(profile => profile.key)).toEqual([
    PAGE_SCANNER_DEFAULT_PROFILE_KEY,
    'server-profile',
  ]);
  expect(failure?.profiles[0].searchTerms).toBe('');
  expect(pageScannerProfilesEqual(current, failure!.profiles)).toBe(false);
});

test('selects the server-confirmed profile after a correlated success', () => {
  const current = pageScannerProfilesOrFallback(null);
  const pending = new Map([
    ['save-2', { operation: 'pageScannerProfile.save' as const, profileKey: 'new-profile' }],
  ]);
  const success = resolvePageScannerProfileResponse(
    'pageScannerProfile.saveResponse',
    {
      requestId: 'save-2',
      ok: true,
      selectedProfileKey: 'new-profile',
      profiles: [
        ...current,
        { id: 12, key: 'new-profile', label: 'New profile', searchTerms: 'attr:test-id', sortOrder: 80, protected: false },
      ],
    },
    pending,
    current,
    PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  );

  expect(success?.selectedProfileKey).toBe('new-profile');
  expect(success?.profiles.some(profile => profile.key === 'new-profile')).toBe(true);
});
