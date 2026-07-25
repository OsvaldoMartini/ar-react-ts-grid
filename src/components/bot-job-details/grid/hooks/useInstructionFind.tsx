import React, { useCallback, useState } from 'react';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { instructionDisplayLabel } from '../../../instructionDisplay';
// The highlight `<mark>` keeps GridItem's `.findHighlight` styling.
import styles from '../../../GridItem.module.scss';

/**
 * Pure predicate: does an instruction match the (already lower-cased) find query,
 * by its display label or its canonical name? Extracted verbatim from GridItem.
 */
export const instructionMatchesFind = (
  instruction: BlockLoopInstructionLoadDTO,
  query: string,
): boolean => {
  const shownLabel = instructionDisplayLabel(instruction);
  return (
    (shownLabel ?? '').toLowerCase().includes(query)
    || (instruction.name ?? '').toLowerCase().includes(query)
  );
};

export interface UseInstructionFind {
  findText: string;
  setFindText: React.Dispatch<React.SetStateAction<string>>;
  /** Wraps the first case-insensitive match of `query` in `text` with a highlight mark. */
  renderHighlighted: (text: string, query: string) => React.ReactNode;
}

/**
 * Phase 6, step 1 — the Bot Job Details grid "Find" state. Owns `findText` and the
 * highlight renderer; `instructionMatchesFind` is exported separately as a pure
 * function. First (lowest-risk) slice of the GridItem → useInstructionGrid refactor.
 */
export function useInstructionFind(): UseInstructionFind {
  const [findText, setFindText] = useState<string>('');

  const renderHighlighted = useCallback((text: string, query: string): React.ReactNode => {
    const q = query.trim();
    if (!q) return text;

    const lowerText = text.toLowerCase();
    const idx = lowerText.indexOf(q.toLowerCase());
    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);

    return (
      <>
        {before}
        <mark className={styles.findHighlight}>{match}</mark>
        {after}
      </>
    );
  }, []);

  return { findText, setFindText, renderHighlighted };
}
