import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
      { id: 20, type: '$String', name: 'accepted', value: 'yes', instructionId: 10 },
      { id: 21, type: '#Numeric', name: 'rejected', value: '1', instructionId: 10 },
    ],
    draft: {
      action: 'SET', name: 'Set Value', hold: 1, operator: '=', interval: 1, count: 1,
      parentId: 10, variableId: 20, graphRevision: 'revision-1',
      warnings: ['SET operation must contain Web Field and Variable/Value segments.'],
    },
  }),
});

test('renders codec warnings and filters variables from backend metadata', () => {
  const onSocketCommand = jest.fn();
  render(<InstructionCommandPanel
    instruction={{ id: 10, name: 'Account', actions: 'SET', blockId: 5, blockName: 'Login', blockOrderNumber: 1, instructionOrderNumber: 1 }}
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
