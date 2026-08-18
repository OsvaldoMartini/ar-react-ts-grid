import {
  OCR_CONFIG_WORKSPACE_KIND,
  isOcrConfigWorkspaceSession,
  isOcrWorkspaceSession,
} from '../scanner/Scanner.sessions';
import {
  ocrWorkspaceRetarget,
  ocrWorkspaceRetargetDisposition,
  ocrWorkspaceTargetUrl,
} from './OCRWorkspace.contract';

const CURRENT_CONFIG = 'ocr-config-current-window';
const NEXT_CONFIG = 'ocr-config-next-window';

test('validates OCR sessions with the exact backend kind and suffix grammar', () => {
  expect(isOcrConfigWorkspaceSession(CURRENT_CONFIG)).toBe(true);
  expect(isOcrWorkspaceSession(NEXT_CONFIG)).toBe(true);
  expect(isOcrWorkspaceSession('ocr-results-current-window')).toBe(false);
  expect(isOcrWorkspaceSession('ocr-config-')).toBe(false);
  expect(isOcrWorkspaceSession('ocr-config-bad_value')).toBe(false);
});

test('accepts a fresh same-kind OCR Config target only from the current binding', () => {
  const retarget = ocrWorkspaceRetarget({
    kind: OCR_CONFIG_WORKSPACE_KIND,
    previousSessionId: CURRENT_CONFIG,
    sessionId: NEXT_CONFIG,
    homeBankingId: 7,
    botJobId: 42,
    homeUrlId: 8,
  }, CURRENT_CONFIG, OCR_CONFIG_WORKSPACE_KIND);

  expect(retarget).toEqual({
    kind: OCR_CONFIG_WORKSPACE_KIND,
    previousSessionId: CURRENT_CONFIG,
    sessionId: NEXT_CONFIG,
    homeBankingId: 7,
    botJobId: 42,
    homeUrlId: 8,
  });
  expect(ocrWorkspaceRetargetDisposition(retarget!, CURRENT_CONFIG)).toBe('SWITCH_SESSION');
});

test('rejects stale and incomplete OCR Config retarget messages', () => {
  const valid = {
    kind: OCR_CONFIG_WORKSPACE_KIND,
    previousSessionId: CURRENT_CONFIG,
    sessionId: NEXT_CONFIG,
    homeBankingId: 7,
    botJobId: 42,
  };
  expect(ocrWorkspaceRetarget({ ...valid, previousSessionId: NEXT_CONFIG }, CURRENT_CONFIG, OCR_CONFIG_WORKSPACE_KIND)).toBeNull();
  expect(ocrWorkspaceRetarget({ ...valid, sessionId: 'ocr-results-next-window' }, CURRENT_CONFIG, OCR_CONFIG_WORKSPACE_KIND)).toBeNull();
  expect(ocrWorkspaceRetarget({ ...valid, botJobId: 0 }, CURRENT_CONFIG, OCR_CONFIG_WORKSPACE_KIND)).toBeNull();
  expect(ocrWorkspaceRetarget({ ...valid, homeUrlId: -1 }, CURRENT_CONFIG, OCR_CONFIG_WORKSPACE_KIND)).toBeNull();
});

test('replaces the detached OCR URL without creating another browser window', () => {
  const target = new URL(ocrWorkspaceTargetUrl(
    `http://127.0.0.1:53972/?desktopShell=1&openOcr=config&ocrSession=${CURRENT_CONFIG}`,
    OCR_CONFIG_WORKSPACE_KIND,
    NEXT_CONFIG,
  ));
  expect(target.searchParams.get('desktopShell')).toBe('1');
  expect(target.searchParams.get('openOcr')).toBe(OCR_CONFIG_WORKSPACE_KIND);
  expect(target.searchParams.get('ocrSession')).toBe(NEXT_CONFIG);
  expect(() => ocrWorkspaceTargetUrl(target.toString(), OCR_CONFIG_WORKSPACE_KIND, 'ocr-results-next-window')).toThrow();
});
