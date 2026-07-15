export function scannerRequestId(now: number, sequence: number, label: string): string {
  return `${now}-${sequence}-scanner-${label}`;
}
