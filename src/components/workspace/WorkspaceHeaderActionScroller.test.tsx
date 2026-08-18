import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkspaceHeaderActionScroller from './WorkspaceHeaderActionScroller';

test('keeps actions in a horizontal viewport and scrolls them with edge-aware controls', () => {
  render(
    <WorkspaceHeaderActionScroller ariaLabel="Bot Job actions">
      <button type="button">First</button>
      <button type="button">Last</button>
    </WorkspaceHeaderActionScroller>,
  );

  const viewport = screen.getByRole('navigation', { name: 'Bot Job actions' });
  Object.defineProperties(viewport, {
    clientWidth: { configurable: true, value: 100 },
    scrollWidth: { configurable: true, value: 400 },
    scrollLeft: { configurable: true, writable: true, value: 0 },
    scrollBy: { configurable: true, value: jest.fn() },
  });
  fireEvent(window, new Event('resize'));

  const left = screen.getByRole('button', { name: 'Scroll Bot Job actions left' });
  const right = screen.getByRole('button', { name: 'Scroll Bot Job actions right' });
  expect(left).toBeDisabled();
  expect(right).toBeEnabled();

  fireEvent.click(right);
  expect(viewport.scrollBy).toHaveBeenCalledWith({ left: 180, behavior: 'smooth' });

  viewport.scrollLeft = 300;
  fireEvent.scroll(viewport);
  expect(left).toBeEnabled();
  expect(right).toBeDisabled();
});
