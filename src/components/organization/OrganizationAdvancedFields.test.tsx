import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OrganizationAdvancedFields from './OrganizationAdvancedFields';

test('edits advanced organization values and requests defaults', () => {
  const onChange = jest.fn();
  const onLoadTemplate = jest.fn();
  render(
    <OrganizationAdvancedFields
      value={{ priority: '1,xpath,currentXPath', searchConfig: '', optionsConfig: '' }}
      onChange={onChange}
      onLoadTemplate={onLoadTemplate}
    />,
  );

  fireEvent.click(screen.getByText('Advanced scanner and WebDriver configuration'));
  fireEvent.change(screen.getByLabelText('Scanner search configuration'), { target: { value: '1,ByAttribute,test-id' } });
  fireEvent.click(screen.getByRole('button', { name: 'Load defaults' }));

  expect(onChange).toHaveBeenCalledWith({
    priority: '1,xpath,currentXPath', searchConfig: '1,ByAttribute,test-id', optionsConfig: '',
  });
  expect(onLoadTemplate).toHaveBeenCalledTimes(1);
});
