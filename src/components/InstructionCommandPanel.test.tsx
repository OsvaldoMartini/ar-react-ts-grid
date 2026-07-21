import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  fireEvent.click(screen.getByRole('button', { name: /unused/ }));
  fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'component-ready' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.save', expect.objectContaining({
    targetSessionId: 'componentTasks',
    variable: expect.objectContaining({ id: 22, value: 'component-ready' }),
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Use in command' }));
  fireEvent.click(screen.getByRole('button', { name: 'Variables' }));
  fireEvent.click(screen.getByRole('button', { name: /unused/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.delete', expect.objectContaining({
    targetSessionId: 'componentTasks', variableId: 22,
  }));
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
  fireEvent.change(screen.getByLabelText('Type'), { target: { value: '#Numeric' } });
  fireEvent.change(screen.getByLabelText('Number format'), { target: { value: 'EU' } });
  fireEvent.change(screen.getByLabelText('CSV delimiter'), { target: { value: ';' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(onSocketCommand).toHaveBeenCalledWith('variableEditor.save', expect.objectContaining({
    targetSessionId: 'botJobTasks',
    variable: expect.objectContaining({ id: 22, name: 'renamed', type: '#Numeric', localFormat: 'EU', delimiter: ';' }),
  }));

  fireEvent.change(screen.getByLabelText('Type'), { target: { value: '$String' } });
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

const registeredCommands: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['SET', ['webField', 'variable']],
  ['GET', ['webField', 'variable']],
  ['CK', ['webField', 'variable', 'operator']],
  ['PDF CHECK', ['webField', 'variable', 'operator']],
  ['CSV CHECK', ['webField', 'variable', 'operator']],
  ['E', ['webField', 'variable']],
  ['IF', []],
  ['GOTO', ['block', 'count']],
  ['EXCEL GOTO', ['block']],
  ['LOOP', ['webField', 'interval', 'count']],
  ['REFRESH_LOOP', ['webField', 'interval', 'count']],
  ['REFRESH', []],
  ['NEXT_ENTER', []],
  ['SWIPE_UP', ['count']],
  ['SWIPE_DOWN', ['count']],
  ['H', ['hold']],
  ['PAUSE', []],
  ['Q', []],
  ['P', []],
];

const commandBootstrapMessage = (code: string, fields: readonly string[], webFields = [{ id: 10, name: 'Account', actions: 'INPUT', tagName: 'input', blockId: 5 }]) => JSON.stringify({
  operationId: 'commandEditor.bootstrapResponse',
  body: JSON.stringify({
    ok: true,
    graphRevision: 'all-command-revision',
    rowCapabilities: { canInsertElseIf: false, canSplit: false },
    commands: [{
      code, label: code, target: 'none', fields,
      allowedTags: code === 'SET' ? ['input'] : [],
      allowedVariableTypes: fields.includes('variable') ? ['$String', '#Numeric'] : [],
      insertAllowed: true, editAllowed: true,
    }],
    webFields,
    variables: [{ id: 20, type: '$String', name: 'value', value: 'ready', instructionId: 10 }],
    blocks: [{ id: 6, name: 'Destination', blockOrderNumber: 2 }],
  }),
});

test.each(registeredCommands)('submits registered %s command with typed fields', async (code, fields) => {
  const onApplyCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={{ ...instruction, actions: 'INPUT' }}
    onClose={jest.fn()}
    onApplyCommand={onApplyCommand}
    messages={[commandBootstrapMessage(code, fields)]}
    context={{ sessionId: 'botJobTasks', targetSessionId: 'botJobTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={jest.fn()}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Command' }));
  if (fields.includes('variable')) {
    fireEvent.change(await screen.findByLabelText('Variable'), { target: { value: '20' } });
  }
  if (fields.includes('block')) {
    fireEvent.change(await screen.findByLabelText('Destination Block'), { target: { value: '6' } });
  }
  if (fields.includes('operator')) {
    fireEvent.change(await screen.findByLabelText('Operator'), { target: { value: '!=' } });
  }
  if (code === 'LOOP' || code === 'REFRESH_LOOP') {
    fireEvent.change(await screen.findByLabelText('Interval seconds'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Iterations'), { target: { value: '100' } });
  } else if (fields.includes('count')) {
    fireEvent.change(await screen.findByRole('spinbutton'), { target: { value: '3' } });
  }
  if (fields.includes('hold')) {
    fireEvent.change(await screen.findByLabelText('Wait seconds'), { target: { value: '7' } });
  }
  const apply = await screen.findByRole('button', { name: 'Apply' });
  await waitFor(() => expect(apply).not.toBeDisabled());
  fireEvent.click(apply);

  expect(onApplyCommand).toHaveBeenCalledTimes(1);
  expect(onApplyCommand).toHaveBeenCalledWith(expect.objectContaining({
    action: code,
    parentId: fields.includes('webField') ? 10 : undefined,
    variableId: fields.includes('variable') ? 20 : undefined,
    parentBlockId: fields.includes('block') ? 6 : undefined,
    hold: fields.includes('hold') ? 7 : undefined,
    operator: fields.includes('operator') ? '!=' : '=',
    interval: code === 'LOOP' || code === 'REFRESH_LOOP' ? 5 : 1,
    count: code === 'LOOP' || code === 'REFRESH_LOOP' ? 100 : fields.includes('count') ? 3 : 1,
  }));
});

test('does not submit LOOP with a command row masquerading as a Web Field', async () => {
  const onApplyCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={{ ...instruction, id: 99, actions: 'H', parentId: undefined }}
    onClose={jest.fn()}
    onApplyCommand={onApplyCommand}
    messages={[commandBootstrapMessage('LOOP', ['webField', 'interval', 'count'])]}
    context={{ sessionId: 'botJobTasks', targetSessionId: 'botJobTasks', homeBankingId: 2, botJobId: 19, botJobName: 'Banca Stato' }}
    onSocketCommand={jest.fn()}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Command' }));
  const apply = await screen.findByRole('button', { name: 'Apply' });
  expect(apply).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Web Field'), { target: { value: '10' } });
  expect(apply).not.toBeDisabled();
  fireEvent.click(apply);
  expect(onApplyCommand).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOOP', parentId: 10 }));
});
