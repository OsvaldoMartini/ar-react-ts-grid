export const PAGE_SCANNER_ELEMENT_EXECUTION_TYPES = [
  'INPUT',
  'OUTPUT',
  'CLICK',
] as const;

export type PageScannerElementExecutionType =
  typeof PAGE_SCANNER_ELEMENT_EXECUTION_TYPES[number];

export const isPageScannerElementExecutionType = (
  value: unknown,
): value is PageScannerElementExecutionType => (
  typeof value === 'string'
  && (PAGE_SCANNER_ELEMENT_EXECUTION_TYPES as readonly string[]).includes(value)
);

export const nextPageScannerElementExecutionType = (
  current: PageScannerElementExecutionType,
): PageScannerElementExecutionType => {
  const currentIndex = PAGE_SCANNER_ELEMENT_EXECUTION_TYPES.indexOf(current);
  return PAGE_SCANNER_ELEMENT_EXECUTION_TYPES[
    (currentIndex + 1) % PAGE_SCANNER_ELEMENT_EXECUTION_TYPES.length
  ];
};
