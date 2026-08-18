import { RefObject, useCallback, useEffect, useRef } from 'react';
import styles from './InstructionFocus.module.scss';

export interface InstructionFocusRequest {
  blockId: number;
  instructionId?: number | null;
}

export type InstructionFocusResult = 'instruction' | 'block' | 'not-found';

export interface UseInstructionFocusOptions {
  containerRef: RefObject<HTMLElement>;
  expandBlock: (blockId: number) => void;
  clearFind?: () => void;
  /** Bounded render retries; prevents a stale diagnostic from polling forever. */
  maxAttempts?: number;
  retryDelayMs?: number;
  highlightDurationMs?: number;
  onResult?: (result: InstructionFocusResult) => void;
}

const selectorFor = (attribute: string, id: number): string =>
  `[${attribute}="${id}"]`;

export interface ResolvedInstructionFocus {
  element: HTMLElement;
  result: Exclude<InstructionFocusResult, 'not-found'>;
}

/**
 * Resolve an instruction first and its containing block second.
 *
 * EXCEL GOTO intentionally has no normal InstructionRow. Its diagnostic
 * therefore falls back to the BlockCard marker instead of failing focus.
 */
export const resolveInstructionFocus = (
  container: HTMLElement,
  request: InstructionFocusRequest,
): ResolvedInstructionFocus | null => {
  if (
    request.instructionId != null
    && Number.isSafeInteger(request.instructionId)
  ) {
    const instruction = container.querySelector<HTMLElement>(
      `[data-focus-target="instruction"]${selectorFor(
        'data-instruction-id',
        request.instructionId,
      )}`,
    );
    if (instruction) return { element: instruction, result: 'instruction' };
  }

  const block = container.querySelector<HTMLElement>(
    `[data-focus-target="block"]${selectorFor('data-block-id', request.blockId)}`,
  );
  if (block) return { element: block, result: 'block' };

  // Compatibility fallback for a block rendered before its BlockCard marker
  // is available. A visible row in the same block is still a useful target.
  const rowInBlock = container.querySelector<HTMLElement>(
    `[data-focus-target="instruction"]${selectorFor('data-block-id', request.blockId)}`,
  );
  return rowInBlock ? { element: rowInBlock, result: 'block' } : null;
};

/**
 * Provides bounded, reusable grid navigation for diagnostics. It clears Find,
 * expands the owning block, waits only a fixed number of render turns, then
 * scrolls, focuses, and transiently highlights the best available target.
 */
export function useInstructionFocus({
  containerRef,
  expandBlock,
  clearFind,
  maxAttempts = 4,
  retryDelayMs = 0,
  highlightDurationMs = 1600,
  onResult,
}: UseInstructionFocusOptions): (request: InstructionFocusRequest) => void {
  const retryTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);

  const clearPending = useCallback(() => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (highlightTimerRef.current != null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    highlightedElementRef.current?.classList.remove(styles.focusHighlight);
    highlightedElementRef.current = null;
  }, []);

  useEffect(() => clearPending, [clearPending]);

  return useCallback((request: InstructionFocusRequest) => {
    clearPending();

    if (!Number.isSafeInteger(request.blockId)) {
      onResult?.('not-found');
      return;
    }

    clearFind?.();
    expandBlock(request.blockId);

    let attempt = 0;
    const seek = () => {
      retryTimerRef.current = null;
      const container = containerRef.current;
      const resolved = container
        ? resolveInstructionFocus(container, request)
        : null;

      if (resolved) {
        resolved.element.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        resolved.element.focus({ preventScroll: true });
        resolved.element.classList.add(styles.focusHighlight);
        highlightedElementRef.current = resolved.element;
        highlightTimerRef.current = window.setTimeout(() => {
          resolved.element.classList.remove(styles.focusHighlight);
          if (highlightedElementRef.current === resolved.element) {
            highlightedElementRef.current = null;
          }
          highlightTimerRef.current = null;
        }, Math.max(0, highlightDurationMs));
        onResult?.(resolved.result);
        return;
      }

      attempt += 1;
      if (attempt >= Math.max(1, maxAttempts)) {
        onResult?.('not-found');
        return;
      }
      retryTimerRef.current = window.setTimeout(seek, Math.max(0, retryDelayMs));
    };

    retryTimerRef.current = window.setTimeout(seek, 0);
  }, [
    clearFind,
    clearPending,
    containerRef,
    expandBlock,
    highlightDurationMs,
    maxAttempts,
    onResult,
    retryDelayMs,
  ]);
}
