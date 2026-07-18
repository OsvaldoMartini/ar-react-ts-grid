import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FloatingWorkspaceFrame.module.scss';

export type FloatingWorkspacePosition = { x: number; y: number };

type Props = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onPointerDown'> & {
  initialPosition: () => FloatingWorkspacePosition;
  edgeMargin?: number;
  visibleHeaderHeight?: number;
  dragHandleSelector?: string;
  dragEnabled?: boolean;
  children: React.ReactNode;
};

const DEFAULT_DRAG_HANDLE_SELECTOR = '[data-floating-workspace-drag-handle]';
const INTERACTIVE_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  'a',
  '[role="menu"]',
  '[data-floating-drag-ignore]',
].join(', ');

const FloatingWorkspaceFrame: React.FC<Props> = ({
  initialPosition,
  edgeMargin = 8,
  visibleHeaderHeight = 56,
  dragHandleSelector = DEFAULT_DRAG_HANDLE_SELECTOR,
  dragEnabled = true,
  children,
  className,
  style,
  ...sectionProps
}) => {
  const frameRef = useRef<HTMLElement | null>(null);
  const stopActiveDragRef = useRef<(() => void) | null>(null);
  const [position, setPosition] = useState<FloatingWorkspacePosition>(initialPosition);

  const clampPosition = useCallback((
    requestedX: number,
    requestedY: number,
    width: number,
    height: number,
  ): FloatingWorkspacePosition => {
    const maximumX = Math.max(edgeMargin, window.innerWidth - width - edgeMargin);
    const visibleHeight = Math.min(height, visibleHeaderHeight);
    const maximumY = Math.max(edgeMargin, window.innerHeight - visibleHeight);
    return {
      x: Math.min(Math.max(edgeMargin, requestedX), maximumX),
      y: Math.min(Math.max(edgeMargin, requestedY), maximumY),
    };
  }, [edgeMargin, visibleHeaderHeight]);

  const keepInsideViewport = useCallback(() => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPosition(previous => clampPosition(
      previous.x,
      previous.y,
      bounds.width,
      bounds.height,
    ));
  }, [clampPosition]);

  useEffect(() => {
    keepInsideViewport();
    window.addEventListener('resize', keepInsideViewport);
    return () => window.removeEventListener('resize', keepInsideViewport);
  }, [keepInsideViewport]);

  useEffect(() => () => stopActiveDragRef.current?.(), []);

  const startDrag = useCallback<React.PointerEventHandler<HTMLElement>>((event) => {
    const target = event.target as HTMLElement;
    if (
      !dragEnabled
      || event.button !== 0
      || !target.closest(dragHandleSelector)
      || target.closest(INTERACTIVE_SELECTOR)
    ) return;

    event.stopPropagation();
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    stopActiveDragRef.current?.();

    const pointerId = event.pointerId;
    const captureOwner = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = { x: bounds.left, y: bounds.top };

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      setPosition(clampPosition(
        startPosition.x + moveEvent.clientX - startX,
        startPosition.y + moveEvent.clientY - startY,
        bounds.width,
        bounds.height,
      ));
    };

    const stop = (stopEvent?: PointerEvent) => {
      if (stopEvent && stopEvent.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      if (captureOwner.hasPointerCapture?.(pointerId)) captureOwner.releasePointerCapture(pointerId);
      if (stopActiveDragRef.current === stopDrag) stopActiveDragRef.current = null;
    };
    const stopDrag = () => stop();

    captureOwner.setPointerCapture?.(pointerId);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    stopActiveDragRef.current = stopDrag;
  }, [clampPosition, dragEnabled, dragHandleSelector]);

  return (
    <section
      {...sectionProps}
      ref={frameRef}
      className={[styles.frame, className].filter(Boolean).join(' ')}
      style={{ ...style, left: position.x, top: position.y }}
      onPointerDown={startDrag}
    >
      {children}
    </section>
  );
};

export default FloatingWorkspaceFrame;
