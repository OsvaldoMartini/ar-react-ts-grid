import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './WorkspaceHeaderActionScroller.module.scss';

interface WorkspaceHeaderActionScrollerProps {
  ariaLabel: string;
  children: React.ReactNode;
  navClassName?: string;
}

interface ScrollState {
  overflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

const initialScrollState: ScrollState = {
  overflow: false,
  canScrollLeft: false,
  canScrollRight: false,
};

const WorkspaceHeaderActionScroller: React.FC<WorkspaceHeaderActionScrollerProps> = ({
  ariaLabel,
  children,
  navClassName = '',
}) => {
  const viewportRef = useRef<HTMLElement | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>(initialScrollState);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maximumScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const nextState: ScrollState = {
      overflow: maximumScrollLeft > 1,
      canScrollLeft: viewport.scrollLeft > 1,
      canScrollRight: viewport.scrollLeft < maximumScrollLeft - 1,
    };

    setScrollState((current) => (
      current.overflow === nextState.overflow
      && current.canScrollLeft === nextState.canScrollLeft
      && current.canScrollRight === nextState.canScrollRight
        ? current
        : nextState
    ));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [children, measure]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(measure);
    resizeObserver?.observe(viewport);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const scroll = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distance = Math.max(180, Math.round(viewport.clientWidth * 0.75));
    if (typeof viewport.scrollBy === 'function') {
      viewport.scrollBy({ left: direction * distance, behavior: 'smooth' });
    } else {
      viewport.scrollLeft += direction * distance;
      measure();
    }
  };

  const controlClassName = `${styles.scrollButton} ${scrollState.overflow ? styles.visible : styles.hidden}`;

  return (
    <div
      className={styles.scroller}
      data-horizontal-action-scroll
      data-floating-drag-ignore
    >
      <button
        type="button"
        className={controlClassName}
        aria-label={`Scroll ${ariaLabel} left`}
        aria-hidden={!scrollState.overflow}
        tabIndex={scrollState.overflow ? 0 : -1}
        disabled={!scrollState.canScrollLeft}
        onClick={() => scroll(-1)}
        data-floating-drag-ignore
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      <nav
        ref={viewportRef}
        className={`${navClassName} ${styles.viewport}`}
        aria-label={ariaLabel}
        onScroll={measure}
      >
        {children}
      </nav>
      <button
        type="button"
        className={controlClassName}
        aria-label={`Scroll ${ariaLabel} right`}
        aria-hidden={!scrollState.overflow}
        tabIndex={scrollState.overflow ? 0 : -1}
        disabled={!scrollState.canScrollRight}
        onClick={() => scroll(1)}
        data-floating-drag-ignore
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </div>
  );
};

export default WorkspaceHeaderActionScroller;
