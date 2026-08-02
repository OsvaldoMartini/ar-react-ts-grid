/** Parse common browser-facing number/currency shapes without changing raw memory. */
export const parseCheckValueSmokeNumber = (raw: string): number | null => {
  const compact = raw.trim()
    .replace(/[\s'\u2019]/g, '')
    .replace(/[^0-9+\-.,]/g, '');
  if (!compact || !/[0-9]/.test(compact)) return null;

  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const groupingSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = normalized.replaceAll(groupingSeparator, '');
    if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
  } else if (lastComma >= 0) {
    normalized = normalized.replaceAll('.', '').replace(',', '.');
  } else {
    normalized = normalized.replaceAll(',', '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
