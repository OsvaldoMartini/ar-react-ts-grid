import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CloneJobManager from './CloneJobManager';

const mockSend = jest.fn();
jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: { readyState: WebSocket.OPEN, send: mockSend },
    connected: true,
    messages: [],
    error: null,
  }),
}));

test('bootstraps the selected source and keeps clone disabled until required data loads', () => {
  render(<CloneJobManager socketPort={54525} sessionId="cloneJobManager" sourceBotJobId={42} />);
  expect(screen.getByRole('heading', { name: 'Clone Job' })).toBeInTheDocument();
  const bootstrap = JSON.parse(mockSend.mock.calls[0][0]);
  expect(bootstrap.type).toBe('cloneJob.bootstrap');
  expect(JSON.parse(bootstrap.body).sourceBotJobId).toBe(42);
  expect(screen.getByRole('button', { name: 'Clone Bot Job' })).toBeDisabled();
});

test('cancel uses the typed clone contract', () => {
  render(<CloneJobManager socketPort={54525} sessionId="cloneJobManager" sourceBotJobId={42} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('"type":"cloneJob.cancel"'));
});
