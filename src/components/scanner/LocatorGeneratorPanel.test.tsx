import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
  controlIndex: 0,
  tagName: 'button',
  controlKind: 'button',
  label: 'Avanti',
  someText: 'Avanti',
  definedName: 'avanti',
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
  onAddElementDTO: jest.fn(),
  onAddAllElementDTO: jest.fn(),
  onClearFeedback: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('keeps the Locator Generator launcher available with an empty scanner grid', () => {
  render(<LocatorGeneratorPanel {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open Locator Generator' }));
  expect(baseProps.onOpen).toHaveBeenCalledTimes(1);
});

test('applies XPath only to the explicitly selected scanned element and exposes ElementDTO add', () => {
  const onApplyXPath = jest.fn();
  const onAddElementDTO = jest.fn();
  render(
    <LocatorGeneratorPanel
      {...baseProps}
      open
      elements={[target]}
      targetKey={pageScannerLocatorElementKey(target)}
      results={[result]}
      onApplyXPath={onApplyXPath}
      onAddElementDTO={onAddElementDTO}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Apply XPath' }));
  expect(onApplyXPath).toHaveBeenCalledWith(result);
  fireEvent.click(screen.getByRole('button', { name: 'Add ElementDTO' }));
  expect(onAddElementDTO).toHaveBeenCalledWith(result, 0);
  expect(screen.getByText('ElementDTO cssSelector')).toBeInTheDocument();
  expect(screen.getByText('SomeText: Avanti')).toBeInTheDocument();
  expect(screen.getByText('Defined Name: avanti')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Apply XPath' })).toHaveLength(1);
});

test('adds all generated locator controls as ElementDTO candidates', () => {
  const onAddAllElementDTO = jest.fn();
  render(
    <LocatorGeneratorPanel
      {...baseProps}
      open
      results={[result]}
      onAddAllElementDTO={onAddAllElementDTO}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Apply All ElementDTOs' }));
  expect(onAddAllElementDTO).toHaveBeenCalledTimes(1);
});
