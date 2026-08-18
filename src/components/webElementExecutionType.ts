export const WEB_ELEMENT_EXECUTION_TYPES = ['INPUT', 'OUTPUT', 'CLICK'] as const;

export type WebElementExecutionType = typeof WEB_ELEMENT_EXECUTION_TYPES[number];

export const isWebElementExecutionType = (
  value: unknown,
): value is WebElementExecutionType => (
  typeof value === 'string'
  && (WEB_ELEMENT_EXECUTION_TYPES as readonly string[]).includes(value)
);

export const nextWebElementExecutionType = (
  current: WebElementExecutionType,
): WebElementExecutionType => {
  const currentIndex = WEB_ELEMENT_EXECUTION_TYPES.indexOf(current);
  return WEB_ELEMENT_EXECUTION_TYPES[(currentIndex + 1) % WEB_ELEMENT_EXECUTION_TYPES.length];
};
