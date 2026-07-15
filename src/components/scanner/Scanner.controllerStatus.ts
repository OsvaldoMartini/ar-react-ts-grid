export const SCANNER_SOCKET_DISCONNECTED_MESSAGE = 'Backend socket is not connected';
export const SCANNER_BOOTSTRAP_TIMEOUT_MESSAGE = 'The backend did not return scanner state';
export const SCANNER_BOOTSTRAP_SEND_FAILURE_MESSAGE = 'Could not load scanner state';
export const SCANNER_ACTION_TIMEOUT_MESSAGE = 'The backend did not answer the scanner action';
export const SCANNER_ACTION_SEND_FAILURE_MESSAGE = 'Could not send scanner action';

export function scannerErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
