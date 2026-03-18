// src/components/MultiTest/useMtT.ts
import i18nInstance from '../../i18n';

// Escape the strict 0-argument typing on i18n.t
const _t = (i18nInstance.t as unknown as (
  key: string,
  options?: Record<string, unknown>
) => string);

export function mtT(key: string, options?: Record<string, unknown>): string {
  return _t(key, { ns: 'mt', ...options });
}

export function useMtT(): { t: typeof mtT; i18n: typeof i18nInstance } {
  return { t: mtT, i18n: i18nInstance };
}

export default useMtT;
