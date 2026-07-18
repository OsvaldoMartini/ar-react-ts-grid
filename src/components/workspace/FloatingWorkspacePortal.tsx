import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import FloatingWorkspaceFrame from './FloatingWorkspaceFrame';

type Props = React.ComponentProps<typeof FloatingWorkspaceFrame> & {
  initialZIndex?: number;
};

let nextFloatingWorkspaceZIndex = 10020;

const reserveZIndex = (minimum: number) => {
  nextFloatingWorkspaceZIndex = Math.max(nextFloatingWorkspaceZIndex + 1, minimum);
  return nextFloatingWorkspaceZIndex;
};

/**
 * Renders a draggable workspace directly under document.body so parent panes cannot
 * clip it. Pointer interaction also brings the workspace above its floating peers.
 */
const FloatingWorkspacePortal: React.FC<Props> = ({
  initialZIndex = 10020,
  onPointerDownCapture,
  style,
  ...frameProps
}) => {
  const [zIndex, setZIndex] = useState(() => reserveZIndex(initialZIndex));

  const bringToFront = useCallback<React.PointerEventHandler<HTMLElement>>((event) => {
    setZIndex(reserveZIndex(initialZIndex));
    onPointerDownCapture?.(event);
  }, [initialZIndex, onPointerDownCapture]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <FloatingWorkspaceFrame
      {...frameProps}
      style={{ ...style, zIndex }}
      onPointerDownCapture={bringToFront}
    />,
    document.body,
  );
};

export default FloatingWorkspacePortal;
