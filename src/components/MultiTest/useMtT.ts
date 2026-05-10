// src/components/MultiTest/useMtT.ts
import i18nInstance from '../../i18n';

const _t = (i18nInstance.t as unknown as (
  key: string,
  options?: Record<string, unknown>
) => string);

// Humanize the last segment of a dotted key as a final visual fallback when
// neither the active language nor the bundled English contains an entry for
// the key. Prevents UI from ever showing raw keys like "nav.apiFiles".
//   nav.apiFiles  → "Api Files"
//   header.title  → "Title"
//   shell.dark    → "Dark"
function humanize(key: string): string {
  const last = key.split('.').pop() ?? key;
  const spaced = last
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function mtT(key: string, options?: Record<string, unknown>): string {
  const value = _t(key, { ns: 'mt', ...options });
  // i18next returns the key itself when no translation is found in any
  // namespace / fallback language. Catch that and humanize so the user sees
  // readable text instead of "nav.foo".
  if (value === key || value === `mt:${key}`) {
    return humanize(key);
  }
  return value;
}

export function useMtT(): { t: typeof mtT; i18n: typeof i18nInstance } {
  return { t: mtT, i18n: i18nInstance };
}

export default useMtT;
