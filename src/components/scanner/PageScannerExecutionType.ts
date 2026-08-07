import type { ElementDTO } from '../instructionsMockData';
import {
  isWebElementExecutionType,
  type WebElementExecutionType,
} from '../webElementExecutionType';
import { pageScannerLocatorElementKey } from './PageScannerLocator';

export const inferredPageScannerGroupTagFor = (element: ElementDTO): string => {
  const decidedType = (element.typeElement ?? '').toLowerCase();
  if (decidedType === 'input' || decidedType === 'textarea') return 'input';
  if (decidedType === 'button' || decidedType === 'click') return 'button';
  if (decidedType === 'a' || decidedType === 'link') return 'a';
  if (decidedType === 'label' || decidedType === 'output') return 'label';

  const rawTag = (element.tagName ?? '').toLowerCase();
  if (rawTag === 'input' || rawTag === 'textarea') return 'input';
  if (rawTag === 'button') return 'button';
  if (rawTag === 'a' || rawTag === 'link') return 'a';
  return 'label';
};

export const pageScannerExecutionTypeFor = (
  element: ElementDTO,
): WebElementExecutionType => {
  if (isWebElementExecutionType(element.executionTypeOverride)) {
    return element.executionTypeOverride;
  }
  const tag = inferredPageScannerGroupTagFor(element);
  if (tag === 'input') return 'INPUT';
  if (tag === 'button' || tag === 'a') return 'CLICK';
  return 'OUTPUT';
};

export const pageScannerGroupTagFor = (element: ElementDTO): string => {
  if (!isWebElementExecutionType(element.executionTypeOverride)) {
    return inferredPageScannerGroupTagFor(element);
  }
  if (element.executionTypeOverride === 'INPUT') return 'input';
  if (element.executionTypeOverride === 'CLICK') return 'button';
  return 'label';
};

export const replacePageScannerExecutionTypeOverride = (
  elements: ElementDTO[],
  targetKey: string,
  nextExecutionType: WebElementExecutionType,
): ElementDTO[] => elements.map((element) => (
  pageScannerLocatorElementKey(element) === targetKey
    ? { ...element, executionTypeOverride: nextExecutionType }
    : element
));
