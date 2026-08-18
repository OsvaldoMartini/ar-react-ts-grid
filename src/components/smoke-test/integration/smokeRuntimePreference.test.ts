import {
  readSmokeRuntimePreference,
  writeSmokeRuntimePreference,
} from './smokeRuntimePreference';

beforeEach(() => window.localStorage.clear());

test('defaults to V1 and isolates the last selection by Home Banking and Bot Job', () => {
  expect(readSmokeRuntimePreference(13, 29)).toBe('JAVA_V1');

  writeSmokeRuntimePreference(13, 29, 'TYPESCRIPT_PLAYWRIGHT_V2');

  expect(readSmokeRuntimePreference(13, 29)).toBe('TYPESCRIPT_PLAYWRIGHT_V2');
  expect(readSmokeRuntimePreference(13, 30)).toBe('JAVA_V1');
  expect(readSmokeRuntimePreference(2, 29)).toBe('JAVA_V1');
});

test('fails closed to V1 for invalid persisted values and invalid owners', () => {
  window.localStorage.setItem('arweb.smoke.runtime-mode.13.29', 'AUTO');

  expect(readSmokeRuntimePreference(13, 29)).toBe('JAVA_V1');
  expect(readSmokeRuntimePreference(0, 29)).toBe('JAVA_V1');
});
