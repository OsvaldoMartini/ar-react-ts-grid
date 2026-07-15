export const SCANNER_BOOTSTRAP_COMMAND = 'scanner.bootstrap';
export const SCANNER_ACTION_COMMAND = 'scanner.action';

export const SCANNER_BOOTSTRAP_RESPONSE = 'scanner.bootstrapResponse';
export const SCANNER_ACTION_RESPONSE = 'scanner.actionResponse';
export const SCANNER_STATE_EVENT = 'scanner.state';
export const SCANNER_SEARCH_TERMS_OPERATION = 'searchTerms';

export const SCANNER_OPERATIONS = new Set([
  SCANNER_BOOTSTRAP_RESPONSE,
  SCANNER_ACTION_RESPONSE,
  SCANNER_STATE_EVENT,
]);
