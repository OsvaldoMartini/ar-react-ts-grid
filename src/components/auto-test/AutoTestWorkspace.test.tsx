import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AutoTestWorkspace, { AutomationTestCatalog } from './AutoTestWorkspace';

const catalog: AutomationTestCatalog = {
  schemaVersion: 1,
  generatedAt: '2026-07-17T12:00:00Z',
  summary: {
    catalogEntries: 3,
    automatedCodeCases: 2,
    generatedApiCases: 10,
    totalAutomatedCases: 12,
    automatedSuites: 2,
    generatedSuites: 1,
    manualArtifacts: 0,
    supportArtifacts: 0,
    defaultRunnable: 2,
    safeRunAllEligible: 2,
  },
  sources: [
    {
      project: 'AR Web Scanner',
      repository: 'ar-web-selenium',
      branch: 'test',
      commit: 'abc',
      sourceFiles: 1,
      automatedSuites: 1,
      automatedTestCases: 1,
      generatedSuites: 0,
      generatedCases: 0,
    },
    {
      project: 'AR React UI',
      repository: 'abr-react-ts-grid',
      branch: 'test',
      commit: 'def',
      sourceFiles: 1,
      automatedSuites: 1,
      automatedTestCases: 1,
      generatedSuites: 1,
      generatedCases: 10,
    },
  ],
  tests: [
    {
      id: 'java-one', project: 'AR Web Scanner', repository: 'ar-web-selenium',
      recordType: 'AUTOMATED_CASE', suite: 'LicenseServiceTest', name: 'mapsLicense',
      displayName: 'mapsLicense', framework: 'JUnit 5', language: 'Java', kind: 'UNIT',
      runtime: 'JVM', execution: 'DEFAULT', safety: 'SAFE',
      sourcePath: 'src/test/LicenseServiceTest.java', line: 10, caseCount: 1,
      runnable: true, runAllEligible: true, command: 'mvn test', tags: ['Test'],
    },
    {
      id: 'react-one', project: 'AR React UI', repository: 'abr-react-ts-grid',
      recordType: 'AUTOMATED_CASE', suite: 'Auto Test', name: 'opens catalog',
      displayName: 'opens catalog', framework: 'Jest / Testing Library', language: 'TypeScript',
      kind: 'FRONTEND', runtime: 'JSDOM', execution: 'DEFAULT', safety: 'SAFE',
      sourcePath: 'src/AutoTest.test.tsx', line: 20, caseCount: 1,
      runnable: true, runAllEligible: true, command: 'npm test', tags: ['frontend'],
    },
    {
      id: 'api-suite', project: 'AR React UI', repository: 'abr-react-ts-grid',
      recordType: 'GENERATED_SUITE', suite: 'CAPI Flow', name: 'capi-flow',
      displayName: 'capi-flow (10 requests)', framework: 'Generated Bash / curl', language: 'Shell',
      kind: 'API_GENERATED', runtime: 'LIVE_API', execution: 'MANUAL_ONLY', safety: 'LIVE_EXTERNAL',
      sourcePath: 'bash_tests/capi-flow.sh', line: 1, caseCount: 10,
      runnable: false, runAllEligible: false, command: '', tags: ['api'],
    },
  ],
};

test('lists the complete catalog and filters by repository, type, safety, and text', () => {
  render(<AutoTestWorkspace catalog={catalog} loading={false} error={String()} onRefresh={jest.fn()} onClose={jest.fn()} />);
  const workspace = screen.getByLabelText('Auto Test automation catalog');
  expect(within(workspace).getAllByRole('row')).toHaveLength(4);
  expect(screen.getByText('Code test cases').parentElement).toHaveTextContent('2');
  expect(screen.getByText('Generated API requests').parentElement).toHaveTextContent('10');

  fireEvent.change(screen.getByLabelText('Filter by repository'), { target: { value: 'AR Web Scanner' } });
  expect(within(workspace).getAllByRole('row')).toHaveLength(2);
  expect(screen.getByText('mapsLicense')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  fireEvent.change(screen.getByLabelText('Filter by test type'), { target: { value: 'API_GENERATED' } });
  expect(screen.getByText('capi-flow (10 requests)')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  fireEvent.change(screen.getByLabelText('Find tests'), { target: { value: 'opens catalog' } });
  expect(screen.getByText('opens catalog')).toBeInTheDocument();
  expect(screen.queryByText('mapsLicense')).not.toBeInTheDocument();
});

test('exposes refresh, close, and non-modal draggable workspace controls', () => {
  const onRefresh = jest.fn();
  const onClose = jest.fn();
  render(<AutoTestWorkspace catalog={catalog} loading={false} error={String()} onRefresh={onRefresh} onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: 'Refresh test catalog' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Close Auto Test' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('auto-test-drag-handle')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
