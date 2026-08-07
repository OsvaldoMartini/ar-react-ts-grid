import type { ElementDTO } from '../instructionsMockData';
import { pageScannerLocatorElementKey } from './PageScannerLocator';
import {
  pageScannerExecutionTypeFor,
  pageScannerGroupTagFor,
  replacePageScannerExecutionTypeOverride,
} from './PageScannerExecutionType';

const element = (overrides: Partial<ElementDTO> = {}): ElementDTO => ({
  id: 7,
  typeElement: 'button',
  tagName: 'input',
  xPath: '/html/body/input[1]',
  someText: 'Submit',
  attribId: 'submit',
  attribName: '',
  coordinates: '1,1',
  attributeData: [],
  customXPath: '',
  iFrameXPath: '',
  attributeValue: '',
  attributeType: '',
  autoScroll: 'false',
  autoEnter: 'false',
  ...overrides,
});

describe('PageScannerExecutionType', () => {
  it('uses the scanner-decided category before a conflicting raw DOM tag', () => {
    const clickableInput = element();

    expect(pageScannerExecutionTypeFor(clickableInput)).toBe('CLICK');
    expect(pageScannerGroupTagFor(clickableInput)).toBe('button');
  });

  it('falls back to the raw DOM tag when the scanner category is undecided', () => {
    const undecidedInput = element({ typeElement: '', tagName: 'textarea' });

    expect(pageScannerExecutionTypeFor(undecidedInput)).toBe('INPUT');
    expect(pageScannerGroupTagFor(undecidedInput)).toBe('input');
  });

  it('uses the transient override without changing scanner identity fields', () => {
    const original = element();
    const targetKey = pageScannerLocatorElementKey(original);
    const [updated] = replacePageScannerExecutionTypeOverride(
      [original],
      targetKey,
      'OUTPUT',
    );

    expect(updated).not.toBe(original);
    expect(updated.executionTypeOverride).toBe('OUTPUT');
    expect(pageScannerExecutionTypeFor(updated)).toBe('OUTPUT');
    expect(pageScannerGroupTagFor(updated)).toBe('label');
    expect(updated.typeElement).toBe(original.typeElement);
    expect(updated.tagName).toBe(original.tagName);
    expect(updated.xPath).toBe(original.xPath);
    expect(pageScannerLocatorElementKey(updated)).toBe(targetKey);
  });

  it('updates only copies with the same stable scanner identity', () => {
    const target = element();
    const other = element({ id: 8, xPath: '/html/body/input[2]' });
    const result = replacePageScannerExecutionTypeOverride(
      [target, { ...target }, other],
      pageScannerLocatorElementKey(target),
      'INPUT',
    );

    expect(result[0].executionTypeOverride).toBe('INPUT');
    expect(result[1].executionTypeOverride).toBe('INPUT');
    expect(result[2]).toBe(other);
  });
});
