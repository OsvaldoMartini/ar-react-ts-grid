import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VariableFlowRepairModal, {
  type VariableFlowRepairModalProps,
} from './VariableFlowRepairModal';

const renderModal = (
  overrides: Partial<VariableFlowRepairModalProps> = {},
) => {
  const props: VariableFlowRepairModalProps = {
    variableId: 7,
    variableName: 'account_number',
    variableType: '$String',
    currentOwnerLabel: null,
    webElementOptions: [
      {
        instructionId: 10,
        label: '(10) Account field',
        sublabel: 'Block #1 Login',
        badges: [{ text: 'INPUT', tone: 'blue' }],
      },
      {
        instructionId: 20,
        label: '(20) Balance field',
        sublabel: 'Block #2 Balance',
        badges: [{ text: 'DIV', tone: 'gray' }],
      },
    ],
    getOptions: [
      {
        instructionId: 11,
        label: '(11) GET account',
        sublabel: 'Block #1 · Step 2',
        compatibleWebElementInstructionIds: [10],
      },
      {
        instructionId: 21,
        label: '(21) GET balance',
        sublabel: 'Block #2 · Step 2',
        compatibleWebElementInstructionIds: [20],
      },
    ],
    pending: false,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
  return {
    ...render(<VariableFlowRepairModal {...props} />),
    props,
  };
};

const choose = (comboboxName: string, optionName: RegExp) => {
  fireEvent.click(screen.getByRole('combobox', { name: comboboxName }));
  fireEvent.click(screen.getByRole('option', { name: optionName }));
};

test('requires explicit searchable Web Element and GET choices', () => {
  const { props } = renderModal();

  expect(screen.getByRole('heading', { name: 'Repair Variable Flow' }))
    .toBeInTheDocument();
  expect(screen.getAllByText('#7 account_number')).toHaveLength(3);
  expect(screen.getByRole('button', {
    name: 'Connect Variable Flow',
  })).toBeDisabled();
  expect(screen.getByRole('combobox', {
    name: 'Compatible GET producer',
  })).toBeDisabled();

  choose('Compatible Web Element', /Account field/i);
  expect(screen.getByRole('combobox', {
    name: 'Compatible GET producer',
  })).toBeEnabled();

  choose('Compatible GET producer', /GET account/i);
  const confirm = screen.getByRole('button', {
    name: 'Connect Variable Flow',
  });
  expect(confirm).toBeEnabled();
  fireEvent.click(confirm);

  expect(props.onConfirm).toHaveBeenCalledWith({
    webElementInstructionId: 10,
    getInstructionId: 11,
  });
});

test('changing Web Element clears an incompatible GET selection', () => {
  renderModal();
  choose('Compatible Web Element', /Account field/i);
  choose('Compatible GET producer', /GET account/i);
  expect(screen.getByRole('button', {
    name: 'Connect Variable Flow',
  })).toBeEnabled();

  choose('Compatible Web Element', /Balance field/i);
  expect(screen.getByRole('button', {
    name: 'Connect Variable Flow',
  })).toBeDisabled();
  expect(screen.getByRole('combobox', {
    name: 'Compatible GET producer',
  })).toHaveValue('');
  expect(screen.queryByRole('option', { name: /GET account/i }))
    .not.toBeInTheDocument();

  choose('Compatible GET producer', /GET balance/i);
  expect(screen.getByRole('button', {
    name: 'Connect Variable Flow',
  })).toBeEnabled();
});

test('shows frozen relationship risks before connecting', () => {
  renderModal({
    reviewWarnings: () => [
      'GET #11 currently writes variable #9; it will be reassigned.',
      '1 reader runs before this GET.',
    ],
  });
  choose('Compatible Web Element', /Account field/i);
  choose('Compatible GET producer', /GET account/i);

  expect(screen.getByRole('region', {
    name: 'Variable flow repair warnings',
  })).toHaveTextContent('GET #11 currently writes variable #9');
  expect(screen.getByText('1 reader runs before this GET.'))
    .toBeInTheDocument();
});

test('freezes the reviewed variable and candidate set while open', () => {
  const { props, rerender } = renderModal();
  rerender(
    <VariableFlowRepairModal
      {...props}
      variableId={99}
      variableName="changed_variable"
      webElementOptions={[]}
      getOptions={[]}
    />,
  );

  expect(screen.getAllByText('#7 account_number')).toHaveLength(3);
  expect(screen.queryByText('#99 changed_variable')).not.toBeInTheDocument();
  choose('Compatible Web Element', /Account field/i);
  expect(screen.getByRole('combobox', {
    name: 'Compatible GET producer',
  })).toBeEnabled();
});

test('shows unavailable choices and locks actions while pending', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  renderModal({
    webElementOptions: [],
    getOptions: [],
    pending: true,
    onCancel,
    onConfirm,
  });

  expect(screen.getByText('No compatible Web Element is available.'))
    .toBeInTheDocument();
  expect(screen.getByText('Connecting the reviewed variable flow...'))
    .toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled();

  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onCancel).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});
