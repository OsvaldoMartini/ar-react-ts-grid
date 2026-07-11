import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import InstructionCommandPanel from './InstructionCommandPanel';

const bootstrapMessage = JSON.stringify({
  operationId: 'commandEditor.bootstrapResponse',
  body: JSON.stringify({
    ok: true,
    graphRevision: 'revision-1',
    rowCapabilities: { canInsertElseIf: false, canSplit: false },
    commands: [{
      code: 'SET', label: 'Set Value', target: 'variable', fields: ['webField', 'variable'],
      allowedTags: ['input'], allowedVariableTypes: ['$String'], insertAllowed: true, editAllowed: true,
    }],
    webFields: [{ id: 10, name: 'Account', actions: 'INPUT', tagName: 'input', blockId: 5 }],
    variables: [
      { id: 20, type: '$String', name: 'accepted', value: 'yes', instructionId: 10, usedVars: '2' },
      { id: 21, type: '#Numeric', name: 'rejected', value: '1', instructionId: 10 },
      { id: 22, type: '$String', name: 'unused', value: 'old', instructionId: 10, usedVars: '0' },
    ],
    draft: {
      action: 'SET', name: 'Set Value', hold: 1, operator: '=', interval: 1, count: 1,
      parentId: 10, variableId: 20, graphRevision: 'revision-1',
      warnings: ['SET operation must contain Web Field and Variable/Value segments.'],
    },
  }),
});

const instruction = { id: 10, name: 'Account', actions: 'SET', blockId: 5, blockName: 'Login', blockOrderNumber: 1, instructionOrderNumber: 1 };

test('renders codec warnings and filters variables from backend metadata', () => {
  const onSocketCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={instruction}
    onClose={jest.fn()}
    onApplyCommand={jest.fn()}
    messages={[bootstrapMessage]}
    context={{ sessionId: 'botJobTasks', targetSessionId: 'botJobTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={onSocketCommand}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Command' }));
  expect(screen.getByText('Historical operation warning')).toBeInTheDocument();
  expect(screen.getByText(/SET operation must contain/)).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /accepted/ })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /rejected/ })).not.toBeInTheDocument();
  expect(onSocketCommand).toHaveBeenCalledWith('commandEditor.bootstrap', expect.objectContaining({ instructionId: 10 }));
});

test('creates variables in component context and protects used variables from deletion', () => {
  const onSocketCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={instruction}
    onClose={jest.fn()}
    onApplyCommand={jest.fn()}
    messages={[bootstrapMessage]}
    context={{ sessionId: 'componentTasks', targetSessionId: 'componentTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={onSocketCommand}
  />);

  expect(onSocketCommand).toHaveBeenCalledWith('commandEditor.bootstrap', expect.objectContaining({ targetSessionId: 'componentTasks' }));
  fireEvent.click(screen.getByRole('button', { name: 'Variables' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.bootstrap', expect.objectContaining({ targetSessionId: 'componentTasks' }));

  fireEvent.click(screen.getByRole('button', { name: 'New' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'created' } });
  fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'ready' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.save', expect.objectContaining({
    targetSessionId: 'componentTasks',
    variable: expect.objectContaining({ name: 'created', value: 'ready', type: '$String' }),
  }));

  fireEvent.click(screen.getByRole('button', { name: /accepted/ }));
  expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('title', 'Used by 2 instruction(s)');
});

test('edits, selects, and deletes an unused bot-job variable', () => {
  const onSocketCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={instruction}
    onClose={jest.fn()}
    onApplyCommand={jest.fn()}
    messages={[bootstrapMessage]}
    context={{ sessionId: 'botJobTasks', targetSessionId: 'botJobTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={onSocketCommand}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Variables' }));
  fireEvent.click(screen.getByRole('button', { name: /unused/ }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.save', expect.objectContaining({
    targetSessionId: 'botJobTasks',
    variable: expect.objectContaining({ id: 22, name: 'renamed' }),
  }));

  fireEvent.click(screen.getByRole('button', { name: 'Use in command' }));
  expect(screen.getByRole('option', { name: /unused/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Variables' }));
  fireEvent.click(screen.getByRole('button', { name: /unused/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.delete', expect.objectContaining({
    targetSessionId: 'botJobTasks', variableId: 22,
  }));
});

test('submits typed command fields without constructing an operation string', () => {
  const onApplyCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={instruction}
    onClose={jest.fn()}
    onApplyCommand={onApplyCommand}
    messages={[bootstrapMessage]}
    context={{ sessionId: 'botJobTasks', targetSessionId: 'botJobTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={jest.fn()}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Command' }));
  fireEvent.change(screen.getByLabelText('Variable'), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onApplyCommand).toHaveBeenCalledTimes(1);
  const draft = onApplyCommand.mock.calls[0][0];
  expect(draft).toEqual(expect.objectContaining({
    action: 'SET', parentId: 10, variableId: 20, graphRevision: 'revision-1',
  }));
  expect(draft).not.toHaveProperty('operation');
});
