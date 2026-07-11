import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivationRequired from './ActivationRequired';

jest.mock('./LicenseManager', () => (
  props: { socketPort: number; sessionId: string; onActivated?: () => void },
) => <section aria-label="Shared license manager">
  <span>{props.socketPort}</span><span>{props.sessionId}</span>
  <button onClick={props.onActivated}>Complete activation</button>
</section>);

beforeEach(() => {
  delete (window as any).receiveDataFromJava;
  jest.restoreAllMocks();
});

test('renders the blocking activation surface with the shared License Manager', () => {
  render(<ActivationRequired socketPort={59772} sessionId="activationRequired-test"/>);
  expect(screen.getByRole('heading', { name: 'Activation required' })).toBeInTheDocument();
  expect(screen.getByText(/valid license is required/i)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Shared license manager' })).toBeInTheDocument();
  expect(screen.getByText('59772')).toBeInTheDocument();
  expect(screen.getByText('activationRequired-test')).toBeInTheDocument();
});

test('opens the main dashboard only after License Manager reports activation', () => {
  const receiveDataFromJava = jest.fn();
  (window as any).receiveDataFromJava = receiveDataFromJava;
  render(<ActivationRequired socketPort={59772} sessionId="activationRequired-test"/>);
  expect(receiveDataFromJava).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Complete activation' }));
  expect(receiveDataFromJava).toHaveBeenCalledWith(
    '[]', 59772, 'mainDashboard', -9999, '', -9999, '',
  );
});

test('closes the host window from the exit action', () => {
  const close = jest.spyOn(window, 'close').mockImplementation(() => undefined);
  render(<ActivationRequired socketPort={59772} sessionId="activationRequired-test"/>);
  fireEvent.click(screen.getByRole('button', { name: 'Exit application' }));
  expect(close).toHaveBeenCalledTimes(1);
});
