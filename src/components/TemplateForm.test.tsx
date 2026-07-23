import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TemplateForm from './TemplateForm';
import { useWebSocket } from './useWebSocket';

jest.mock('./useWebSocket', () => ({ useWebSocket: jest.fn() }));

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

beforeEach(() => {
  mockedUseWebSocket.mockReturnValue({
    webSocket: null,
    connected: false,
    reconnectAttempts: 0,
    messages: [],
    error: null,
  });
});

test('closes only the detached template workspace', () => {
  const onClose = jest.fn();
  render(
    <TemplateForm
      socketPort={7357}
      sessionId="aTemplateManager"
      showCloseAction
      onClose={onClose}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Exit' })).not.toBeInTheDocument();
});
