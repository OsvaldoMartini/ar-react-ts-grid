import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExecutionPreflightDialog from './ExecutionPreflightDialog';
import type {
  ExecutionPreflightIssue,
  ExecutionPreflightReport,
} from '../BotJobDetails.types';

const issue = (index: number): ExecutionPreflightIssue => ({
  code: `ISSUE_${index}`,
  kind: 'ELEMENT_TARGET',
  blockId: 10,
  instructionId: 100 + index,
  message: `Preflight problem ${index}`,
});

const report = (
  overrides: Partial<ExecutionPreflightReport> = {},
): ExecutionPreflightReport => ({
  enforcement: 'WARN',
  status: 'WOULD_BLOCK',
  stage: 'BOT_JOB_TEST_RUN',
  owner: { homeBankingId: 2, botJobId: 5 },
  runScope: { kind: 'ONE', selectedBlockId: 10 },
  graphVersion: 12,
  contentRevision: 'revision-a',
  reachableBlockIds: [10],
  reachableInstructionIds: [101],
  totalIssues: 1,
  issues: [issue(1)],
  unavailableReason: null,
  ...overrides,
});

test('renders a close-only WARN observation and closes with Escape', () => {
  const onClose = jest.fn();
  render(
    <ExecutionPreflightDialog
      action="TEST_RUN"
      report={report()}
      onClose={onClose}
    />,
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Test Run preflight' }))
    .toBeInTheDocument();
  expect(screen.getByText(
    'Execution was started because observation mode is active.',
  )).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /continue/i }))
    .not.toBeInTheDocument();

  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('bounds the issue list to 25 rows and reports the remainder', () => {
  const issues = Array.from({ length: 30 }, (_, index) => issue(index + 1));
  render(
    <ExecutionPreflightDialog
      action="LAUNCH"
      report={report({ totalIssues: 30, issues })}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByRole('list', { name: 'Execution preflight issues' })
    .querySelectorAll('li')).toHaveLength(25);
  expect(screen.getByText('Preflight problem 25')).toBeInTheDocument();
  expect(screen.queryByText('Preflight problem 26')).not.toBeInTheDocument();
  expect(screen.getByText('5 more issues are not shown.'))
    .toBeInTheDocument();
});

test('offers Focus only for instruction issues when a callback is supplied', () => {
  const onClose = jest.fn();
  const onFocusIssue = jest.fn();
  const instructionIssue = issue(1);
  const blockIssue = { ...issue(2), instructionId: null };
  render(
    <ExecutionPreflightDialog
      action="TEST_RUN"
      report={report({
        totalIssues: 2,
        issues: [instructionIssue, blockIssue],
      })}
      onClose={onClose}
      onFocusIssue={onFocusIssue}
    />,
  );

  const focusButtons = screen.getAllByRole('button', { name: 'Focus' });
  expect(focusButtons).toHaveLength(1);
  fireEvent.click(focusButtons[0]);
  expect(onFocusIssue).toHaveBeenCalledWith(instructionIssue);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('does not render Focus controls when no focus callback is supplied', () => {
  render(
    <ExecutionPreflightDialog
      action="TEST_RUN"
      report={report()}
      onClose={jest.fn()}
    />,
  );

  expect(screen.queryByRole('button', { name: 'Focus' }))
    .not.toBeInTheDocument();
});

test('keeps the preflight check failure bounded and close-only', () => {
  render(
    <ExecutionPreflightDialog
      action="LAUNCH"
      report={report({
        status: 'UNAVAILABLE',
        owner: null,
        runScope: null,
        graphVersion: null,
        contentRevision: null,
        reachableBlockIds: [],
        reachableInstructionIds: [],
        totalIssues: 0,
        issues: [],
        unavailableReason: 'Database snapshot could not be loaded.',
      })}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByText('The authoritative execution check was unavailable.'))
    .toBeInTheDocument();
  expect(screen.getByText('Database snapshot could not be loaded.'))
    .toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
});
