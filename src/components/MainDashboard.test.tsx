import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MainDashboard from './MainDashboard';

const mockSend = jest.fn();

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: 1,
      send: mockSend,
    },
    connected: true,
    messages: [],
    error: null,
  }),
}));

const shutdownRequests = () => mockSend.mock.calls
  .map(([payload]) => JSON.parse(payload))
  .filter(message => message.type === 'mainDashboard.exit');

beforeEach(() => {
  mockSend.mockClear();
});

test('requests application shutdown once when Exit is clicked', () => {
  render(<MainDashboard socketPort={7357} sessionId="mainDashboard" />);

  fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Exit' }));

  expect(shutdownRequests()).toHaveLength(1);
  expect(JSON.parse(shutdownRequests()[0].body)).toEqual({ reason: 'EXIT_BUTTON' });
});
