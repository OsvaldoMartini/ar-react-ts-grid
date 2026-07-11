import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LicenseManager from './LicenseManager';

const mockSend = jest.fn();
let mockMessages: string[] = [];
jest.mock('./useWebSocket', () => ({ useWebSocket: () => ({ webSocket: { send: mockSend }, connected: true, messages: mockMessages }) }));

const response = JSON.stringify({
  sessionId: 'licenseManager-test', operationId: 'license.bootstrapResponse',
  body: JSON.stringify({ ok: true, statusCode: 'MISSING', status: 'Missing license', active: false,
    requiresActivation: true, organization: 'Banca Stato', owner: 'Owner', path: '/licenses',
    capabilities: { request: true, activate: true, useExisting: true, onlineRequest: false } }),
});

beforeEach(() => { mockSend.mockClear(); mockMessages = [response]; });

const sentOperation = (type: string) => mockSend.mock.calls
  .map(([message]) => JSON.parse(message))
  .find((message) => message.type === type);

test('renders status and sends an agreement-gated license request', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  expect(screen.getByText('Missing license')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'Client Org' } });
  fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Client Owner' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'client@example.com' } });
  expect(screen.getByRole('button', { name: 'Generate request' })).toBeDisabled();
  fireEvent.click(screen.getByText('I accept the software license agreement.'));
  fireEvent.click(screen.getByRole('button', { name: 'Generate request' }));
  const request = sentOperation('license.request');
  expect(request).toEqual(expect.objectContaining({ type: 'license.request' }));
  expect(JSON.parse(request.body)).toEqual(expect.objectContaining({
    organization: 'Client Org', owner: 'Client Owner', email: 'client@example.com', agreementAccepted: true,
  }));
});

test('sends the activation response path', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
  fireEvent.change(screen.getByLabelText('Response file'), { target: { value: '/licenses/client.response' } });
  fireEvent.click(screen.getByText('I accept the software license agreement.'));
  fireEvent.click(screen.getByRole('button', { name: 'Activate license' }));
  expect(sentOperation('license.activate')).toBeDefined();
});

test('sends the existing-license path', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  fireEvent.click(screen.getByRole('button', { name: 'Use existing' }));
  fireEvent.change(screen.getByLabelText('License file'), { target: { value: '/licenses/ARWeb.lic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use existing license' }));
  expect(sentOperation('license.useExisting')).toBeDefined();
});
