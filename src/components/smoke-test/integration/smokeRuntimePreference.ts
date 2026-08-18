import type { SmokeTestIntegrationRuntimeMode } from './smokeTestIntegration.contract';

const PREFIX = 'arweb.smoke.runtime-mode.';

const key = (homeBankingId: number, botJobId: number): string =>
  `${PREFIX}${homeBankingId}.${botJobId}`;

export const readSmokeRuntimePreference = (
  homeBankingId: number,
  botJobId: number | null,
): SmokeTestIntegrationRuntimeMode => {
  if (homeBankingId <= 0 || botJobId === null || botJobId <= 0) return 'JAVA_V1';
  try {
    return window.localStorage.getItem(key(homeBankingId, botJobId)) === 'TYPESCRIPT_PLAYWRIGHT_V2'
      ? 'TYPESCRIPT_PLAYWRIGHT_V2'
      : 'JAVA_V1';
  } catch {
    return 'JAVA_V1';
  }
};

export const writeSmokeRuntimePreference = (
  homeBankingId: number,
  botJobId: number | null,
  mode: SmokeTestIntegrationRuntimeMode,
): void => {
  if (homeBankingId <= 0 || botJobId === null || botJobId <= 0) return;
  try {
    window.localStorage.setItem(key(homeBankingId, botJobId), mode);
  } catch {
    // The current React state remains authoritative for this window when storage is unavailable.
  }
};
