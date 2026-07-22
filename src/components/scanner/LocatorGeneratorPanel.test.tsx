import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ElementDTO } from '../instructionsMockData';
import LocatorGeneratorPanel from './LocatorGeneratorPanel';
import { pageScannerLocatorElementKey, type LocatorResult } from './PageScannerLocator';

const target: ElementDTO = {
  id: 8,
  typeElement: 'button',
  tagName: 'button',
  xPath: '//button[1]',
  someText: 'Avanti',
  attribId: '',
  attribName: '',
  coordinates: '',
  attributeData: [],
  customXPath: '',
  iFrameXPath: '',
  attributeValue: '',
  attributeType: '',
  autoScroll: '',
  autoEnter: '',
};

const result: LocatorResult = {
  tagName: 'button',
  controlKind: 'button',
  label: 'Avanti',
  xpath: "//button[@test-id='next']",
  css: "button[test-id='next']",
  positional: false,
  note: 'Unique by test-id.',
};

const baseProps = {
  open: false,
  position: { x: 10, y: 20 },
  elements: [] as ElementDTO[],
  targetKey: '',
  results: [] as LocatorResult[],
  busy: false,
  applying: false,
  error: '',
  warning: '',
  feedback: '',
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onDragStart: jest.fn(),
  onTargetChange: jest.fn(),
  onGenerate: jest.fn(),
  onApplyXPath: jest.fn(),
  onClearFeedback: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('keeps the Locator Generator launcher available with an empty scanner grid', () => {
  render(<LocatorGeneratorPanel {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open Locator Generator' }));
  expect(baseProps.onOpen).toHaveBeenCalledTimes(1);
});

test('applies XPath only to the explicitly selected scanned element and marks CSS copy-only', () => {
  const onApplyXPath = jest.fn();
  render(
    <LocatorGeneratorPanel
      {...baseProps}
      open
      elements={[target]}
      targetKey={pageScannerLocatorElementKey(target)}
      results={[result]}
      onApplyXPath={onApplyXPath}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Apply XPath' }));
  expect(onApplyXPath).toHaveBeenCalledWith(result);
  expect(screen.getByText('Copy only')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Apply XPath' })).toHaveLength(1);
});

test('awaits clipboard success before claiming that a locator was copied', async () => {
  const writeText = jest.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  render(<LocatorGeneratorPanel {...baseProps} open results={[result]} />);

  fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]);
  expect(screen.queryByText('Locator copied to the clipboard.')).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Locator copied to the clipboard.')).toBeInTheDocument());
  expect(writeText).toHaveBeenCalledWith(result.xpath);
});

test('reports refused clipboard access honestly and never displays copied success', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: jest.fn(() => Promise.reject(new Error('denied'))) },
  });
  render(<LocatorGeneratorPanel {...baseProps} open results={[result]} />);

  fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]);
  await waitFor(() => expect(screen.getByText(/refused clipboard access/i)).toBeInTheDocument());
  expect(screen.queryByText('Locator copied to the clipboard.')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument();
});
