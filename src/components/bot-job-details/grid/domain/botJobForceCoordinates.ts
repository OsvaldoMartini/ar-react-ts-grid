export type BotJobForceCoordinates = '' | 'E' | 'T' | 'ET';

/**
 * Bot Job GridItem exposes only Enter and Tab. Remove every other legacy
 * browser-action flag before the value reaches local instruction state or the
 * FORCE_COORDINATES_UPDATE WebSocket contract.
 */
export const botJobForceCoordinates = (raw: string): BotJobForceCoordinates => {
  const normalized = raw.toUpperCase();
  const enter = normalized.includes('E');
  const tab = normalized.includes('T');
  if (enter && tab) return 'ET';
  if (enter) return 'E';
  if (tab) return 'T';
  return '';
};
