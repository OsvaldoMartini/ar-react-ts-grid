# MultiTest i18n — Integration Guide

## What's included

| File | Action required |
|------|----------------|
| `src/i18n.ts` | **Replace** your existing `src/i18n.ts` (adds `'mt'` to the `ns` array) |
| `src/components/MultiTest/useMtT.ts` | **New file** — hook + class helper for the `mt` namespace |
| `public/locales/en/mt.json` | **New** — English translations |
| `public/locales/de/mt.json` | **New** — German translations |
| `public/locales/fr/mt.json` | **New** — French translations |
| `public/locales/it/mt.json` | **New** — Italian translations |
| `public/locales/pt/mt.json` | **New** — Brazilian Portuguese translations |

Copy each file to the matching path in your project. No other files need changing to enable the translations.

---

## Using translations in function components

```tsx
import { useMtT } from './useMtT';

export function ReadyForTestTab() {
  const { t } = useMtT();

  return (
    <div>
      <h2>{t('ready.title')}</h2>
      <button>{t('ready.saveCsv')}</button>
      <button>{t('common.clearAll')}</button>
    </div>
  );
}
```

## Using translations in class components

```tsx
import { mtT } from './useMtT';

export class ReadyForTestTab extends React.Component<...> {
  render() {
    const t = mtT;   // just alias it

    return (
      <div>
        <h2>{t('ready.title')}</h2>
        <button>{t('ready.executionMode')}</button>
      </div>
    );
  }
}
```

## Key structure

```
mt.json
├── nav.*          Tab labels and step labels
├── header.*       App header strings
├── common.*       Shared: save, cancel, close, error…
├── upload.*       File Upload panel
├── workflow.*     API Workflow Diagram tab
├── datagen.*      Data Generator / BizWizard
├── ready.*        Ready for Test tab (largest section)
├── running.*      Running tab
├── report.*       Report tab
├── library.*      Test Library tab
├── ai.*           AI Assistant tab
├── mock.*         Mock Server modal
└── errors.*       All error messages
```

## Interpolation examples

```tsx
// Simple key
t('common.save')                          // "Save"

// With count
t('ready.queued', { count: 5 })           // "5 test cases queued"

// With name variable
t('ready.reApply', { name: 'Dev' })       // "✓ Re-apply Dev"

// With provider name
t('ai.waiting', { provider: 'Claude' })   // "Waiting for Claude…"
```

## Adding a new language

1. Create `public/locales/<code>/mt.json`
2. Copy the English file as a starting point
3. Add the code to `supportedLngs` in `src/i18n.ts`
4. Add the language option to `LanguagePicker.tsx`

## Gradual migration

You do not need to migrate all strings at once. The `mtT` helper
returns the key itself if no translation is found, so you can migrate
component by component without breaking anything.
