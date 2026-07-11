import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AboutPanel from './AboutPanel';

const mockSend = jest.fn();
let mockMessages: string[] = [];
jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({ webSocket: { send: mockSend }, connected: true, messages: mockMessages }),
}));
jest.mock('./LicenseManager', () => (props: { onClose?: () => void }) => (
  <section aria-label="Shared license manager">
    <button onClick={props.onClose}>Close license</button>
  </section>
));

const response = JSON.stringify({
  sessionId: 'aboutPanel-test',
  operationId: 'about.bootstrapResponse',
  body: JSON.stringify({
    product: 'AR Web Scanner', version: '4.6.0', build: '2026.07.11',
    expiration: '2027-07-11', copyright: 'Allinweb AG',
    license: { status: 'Active' },
  }),
});

beforeEach(() => {
  mockSend.mockClear();
  mockMessages = [response];
  delete (window as any).receiveDataFromJava;
});

test('renders backend product, build, expiration, and license metadata', () => {
  render(<AboutPanel socketPort={59772} sessionId="aboutPanel-test"/>);
  expect(screen.getByRole('heading', { name: 'AR Web Scanner' })).toBeInTheDocument();
  expect(screen.getByText('4.6.0')).toBeInTheDocument();
  expect(screen.getByText('2026.07.11')).toBeInTheDocument();
  expect(screen.getByText('2027-07-11')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByText(/Allinweb AG/)).toBeInTheDocument();
  expect(mockSend.mock.calls.map(([message]) => JSON.parse(message).type)).toContain('about.bootstrap');
});

test('refreshes metadata and returns to the dashboard route', () => {
  const receiveDataFromJava = jest.fn();
  (window as any).receiveDataFromJava = receiveDataFromJava;
  render(<AboutPanel socketPort={59772} sessionId="aboutPanel-test"/>);
  const initialBootstrapCalls = mockSend.mock.calls.length;
  fireEvent.click(screen.getByTitle('Refresh'));
  expect(mockSend.mock.calls.length).toBeGreaterThan(initialBootstrapCalls);
  fireEvent.click(screen.getByTitle('Back to dashboard'));
  expect(receiveDataFromJava).toHaveBeenCalledWith('[]', 59772, 'mainDashboard', -9999, '', -9999, '');
});

test('opens and closes the shared License Manager', () => {
  render(<AboutPanel socketPort={59772} sessionId="aboutPanel-test"/>);
  fireEvent.click(screen.getByRole('button', { name: 'License' }));
  expect(screen.getByRole('region', { name: 'Shared license manager' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close license' }));
  expect(screen.queryByRole('region', { name: 'Shared license manager' })).not.toBeInTheDocument();
});

test('keeps safe fallback values for malformed backend responses', () => {
  mockMessages = ['{invalid-json'];
  render(<AboutPanel socketPort={59772} sessionId="aboutPanel-test"/>);
  expect(screen.getByRole('heading', { name: 'Unavailable' })).toBeInTheDocument();
  expect(screen.getAllByText('Unavailable')).toHaveLength(4);
  expect(screen.getByText('Copyright unavailable')).toBeInTheDocument();
  expect(screen.getByText('Checking...')).toBeInTheDocument();
});
