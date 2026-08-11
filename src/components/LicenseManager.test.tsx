import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LicenseManager from './LicenseManager';

const mockSend = jest.fn();
const mockWebSocket = { send: mockSend };
let mockMessages: string[] = [];
jest.mock('./useWebSocket', () => ({ useWebSocket: () => ({ webSocket: mockWebSocket, connected: true, messages: mockMessages }) }));

const response = JSON.stringify({
  sessionId: 'licenseManager-test', operationId: 'license.bootstrapResponse',
  body: JSON.stringify({ ok: true, statusCode: 'MISSING', status: 'Missing license', active: false,
    requiresActivation: true, organization: 'Banca Stato', owner: 'Owner', path: '/licenses',
    capabilities: { request: true, activate: true, useExisting: true, onlineRequest: false } }),
});

const licenseResponse = (operationId: string, body: Record<string, unknown>) => JSON.stringify({
  sessionId: 'licenseManager-test', operationId, body: JSON.stringify(body),
});

beforeEach(() => { mockSend.mockClear(); mockMessages = [response]; });

const sentOperation = (type: string) => mockSend.mock.calls
  .map(([message]) => JSON.parse(message))
  .find((message) => message.type === type);

const fillRequestForm = () => {
  fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'Client Org' } });
  fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Client Owner' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'client@example.com' } });
};

test('renders status and sends an agreement-gated license request', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  expect(screen.getByRole('status')).toHaveTextContent('Missing license');
  expect(screen.getByText('License Request')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /Software License Agreement v1.0/ })).toBeInTheDocument();
  expect(screen.getByText(/7\. Miscellaneous/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Generate request' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Organization is required.');
  fillRequestForm();
  fireEvent.click(screen.getByRole('button', { name: 'Generate request' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Accept the software license agreement to continue.');
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
  expect(screen.getByRole('region', { name: /Software License Agreement v1.0/ })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Response file'), { target: { value: '/licenses/client.response' } });
  fireEvent.click(screen.getByText('I accept the software license agreement.'));
  fireEvent.click(screen.getByRole('button', { name: 'Activate license' }));
  expect(sentOperation('license.activate')).toBeDefined();
});

test('sends the existing-license path', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  fireEvent.click(screen.getByRole('button', { name: 'Use existing' }));
  expect(screen.queryByRole('region', { name: /Software License Agreement/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Use existing license' }));
  expect(screen.getByRole('alert')).toHaveTextContent('License file is required.');
  fireEvent.change(screen.getByLabelText('License file'), { target: { value: '/licenses/ARWeb.lic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use existing license' }));
  expect(sentOperation('license.useExisting')).toBeDefined();
});

test('disables license modes excluded by backend capabilities', () => {
  mockMessages = [licenseResponse('license.bootstrapResponse', {
    ok: true, statusCode: 'MISSING', status: 'Missing license', active: false,
    capabilities: { request: true, activate: false, useExisting: false },
  })];
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  expect(screen.getByRole('button', { name: 'Request' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use existing' })).toBeDisabled();
});

test('prevents repeated submission while a request is pending', () => {
  render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  fillRequestForm();
  fireEvent.click(screen.getByText('I accept the software license agreement.'));
  const submit = screen.getByRole('button', { name: 'Generate request' });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
  expect(mockSend.mock.calls.map(([message]) => JSON.parse(message).type)
    .filter(type => type === 'license.request')).toHaveLength(1);
});

test('shows a structured backend error and clears pending state', () => {
  const { rerender } = render(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  fillRequestForm();
  fireEvent.click(screen.getByText('I accept the software license agreement.'));
  fireEvent.click(screen.getByRole('button', { name: 'Generate request' }));
  mockMessages = [response, licenseResponse('license.requestResponse', {
    ok: false, error: 'Organization is required.', statusCode: 'VALIDATION_ERROR',
  })];
  rerender(<LicenseManager socketPort={59772} sessionId="licenseManager-test"/>);
  expect(screen.getByText('Organization is required.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Generate request' })).toBeEnabled();
});

test('refreshes status after success and reports active state', () => {
  const onActivated = jest.fn();
  const { rerender } = render(<LicenseManager socketPort={59772} sessionId="licenseManager-test" onActivated={onActivated}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Use existing' }));
  fireEvent.change(screen.getByLabelText('License file'), { target: { value: '/licenses/ARWeb.lic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use existing license' }));
  const bootstrapCount = () => mockSend.mock.calls
    .map(([message]) => JSON.parse(message).type).filter(type => type === 'license.bootstrap').length;
  const countBeforeSuccess = bootstrapCount();
  mockMessages = [response, licenseResponse('license.useExistingResponse', {
    ok: true, statusCode: 'ACTIVE', status: 'License active', active: true,
    message: 'License verified.', capabilities: { request: true, activate: true, useExisting: true },
  })];
  rerender(<LicenseManager socketPort={59772} sessionId="licenseManager-test" onActivated={onActivated}/>);
  expect(screen.getByText('License verified.')).toBeInTheDocument();
  expect(bootstrapCount()).toBeGreaterThan(countBeforeSuccess);
  expect(onActivated).toHaveBeenCalledTimes(1);
});
