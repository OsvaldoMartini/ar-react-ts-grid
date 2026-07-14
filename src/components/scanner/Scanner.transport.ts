export interface ScannerTransportEnvelope {
  type: string;
  sessionId: string;
  homeBankingId: number;
  body: string;
}

export function scannerTransportMessage(
  type: string,
  sessionId: string,
  homeBankingId: number,
  requestBody: Record<string, unknown>,
): string {
  const envelope: ScannerTransportEnvelope = {
    type,
    sessionId,
    homeBankingId,
    body: JSON.stringify(requestBody),
  };
  return JSON.stringify(envelope);
}
