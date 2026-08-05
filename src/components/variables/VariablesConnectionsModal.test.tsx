import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VariablesConnectionsModal, {
  type VariablesConnectionReviewItem,
  type VariablesConnectionsModalProps,
} from './VariablesConnectionsModal';

beforeEach(() => window.localStorage.clear());

const resolveItems: VariablesConnectionReviewItem[] = [
  {
    id: 'ELEMENT_TARGET:101',
    sourceLabel: '#4 Get account',
    sourceSublabel: 'Block #1 Login',
    relationLabel: 'Web Element',
    state: 'RECONNECT',
    stateTone: 'red',
    currentTargetLabel: null,
    compatibleOptions: [
      {
        value: 'INSTRUCTION:91',
        label: '(91) Account field',
        badges: [{ text: 'INPUT', tone: 'blue' }],
      },
    ],
    initialOptionValue: 'INSTRUCTION:91',
  },
  {
    id: 'VARIABLE_BINDING:102',
    sourceLabel: '#5 Check account',
    relationLabel: 'Variable',
    state: 'VOID',
    stateTone: 'orange',
    compatibleOptions: [
      {
        value: 'VARIABLE:12',
        label: '#12 account_number',
        sublabel: 'Runtime variable',
      },
    ],
  },
];

const renderModal = (
  overrides: Partial<VariablesConnectionsModalProps> = {},
) => {
  const props: VariablesConnectionsModalProps = {
    mode: 'RESOLVE',
    scopeLabel: 'All visible commands',
    scopeCount: 12,
    items: resolveItems,
    pending: false,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
  const rendered = render(<VariablesConnectionsModal {...props} />);
  return { ...rendered, props };
};

test('freezes scope and submits only reviewed compatible selections', () => {
  const { props, rerender } = renderModal();

  expect(screen.getByText('All visible commands')).toBeInTheDocument();
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(screen.getByRole('button', {
    name: 'Resolve 1 Connection',
  })).toBeEnabled();

  rerender(
    <VariablesConnectionsModal
      {...props}
      scopeLabel="Changed while open"
      scopeCount={99}
    />,
  );
  expect(screen.getByText('All visible commands')).toBeInTheDocument();
  expect(screen.queryByText('Changed while open')).not.toBeInTheDocument();
  expect(screen.queryByText('99')).not.toBeInTheDocument();

  const variableSelector = screen.getByRole('combobox', {
    name: 'Variable target for #5 Check account',
  });
  fireEvent.click(variableSelector);
  fireEvent.click(screen.getByRole('option', {
    name: /#12 account_number/i,
  }));

  const confirm = screen.getByRole('button', {
    name: 'Resolve 2 Connections',
  });
  fireEvent.click(confirm);

  expect(props.onConfirm).toHaveBeenCalledWith({
    mode: 'RESOLVE',
    resolutions: [
      {
        itemId: 'ELEMENT_TARGET:101',
        optionValue: 'INSTRUCTION:91',
      },
      {
        itemId: 'VARIABLE_BINDING:102',
        optionValue: 'VARIABLE:12',
      },
    ],
  });
});

test('reviews and releases the exact caller-supplied connection set', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  renderModal({
    mode: 'RELEASE',
    items: resolveItems,
    onConfirm,
    onCancel,
  });

  expect(screen.getByRole('heading', { name: 'Release Connections' }))
    .toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getByText('To release')).toBeInTheDocument();
  expect(screen.getByText(
    'Release will disconnect all 2 reviewed connections in this frozen scope.',
  )).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {
    name: 'Release 2 Connections',
  }));
  expect(onConfirm).toHaveBeenCalledWith({
    mode: 'RELEASE',
    itemIds: ['ELEMENT_TARGET:101', 'VARIABLE_BINDING:102'],
  });

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('shows unavailable targets and locks modal actions while pending', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const noTargetItem: VariablesConnectionReviewItem = {
    id: 'LOOP_ANCHOR:200',
    sourceLabel: '#8 LOOP',
    relationLabel: 'LOOP anchor',
    state: 'OWNER MISSING',
    stateTone: 'red',
    compatibleOptions: [],
  };
  renderModal({
    items: [noTargetItem],
    pending: true,
    onCancel,
    onConfirm,
  });

  expect(screen.getByText(
    'No compatible options are available for this connection.',
  )).toBeInTheDocument();
  expect(screen.getByText('Resolving selected connections...'))
    .toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Resolving...' })).toBeDisabled();

  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onCancel).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});

test('defaults variable resolution to Same Vars and allows Distinct resolution', () => {
  const onCreateCheckValueDefaults = jest.fn();
  const first = renderModal({
    onCreateCheckValueDefaults,
    items: [{ ...resolveItems[1], blockId: 1, stateTone: 'red' }],
    blocks: [{ id: 1, order: 1, name: 'Login', active: true }],
  });

  const modeToggle = screen.getByRole('button', {
    name: 'Variable resolution mode',
  });
  expect(modeToggle).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(modeToggle);
  const distinctToggle = screen.getByRole('button', {
    name: 'Variable resolution mode',
  });
  expect(distinctToggle).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', {
    name: /Resolve Parents\(0\) Vars\(1\)/i,
  }));
  expect(onCreateCheckValueDefaults).toHaveBeenCalledWith('DISTINCT');

  first.unmount();
  renderModal({
    onCreateCheckValueDefaults,
    items: [{ ...resolveItems[1], blockId: 1, stateTone: 'red' }],
    blocks: [{ id: 1, order: 1, name: 'Login', active: true }],
  });
  expect(screen.getByRole('button', {
    name: 'Variable resolution mode',
  })).toHaveAttribute('aria-pressed', 'true');
});
