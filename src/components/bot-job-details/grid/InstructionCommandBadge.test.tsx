import React from 'react';
import { render, screen } from '@testing-library/react';
import InstructionCommandBadge from './InstructionCommandBadge';

describe('InstructionCommandBadge', () => {
  test.each([
    ['GET', 'GetValue', 'GET_VALUE'],
    ['E', 'ExcelWrite', 'EXCEL'],
    ['H', 'Wait', 'WAIT'],
    ['GOTO', 'GOTO', 'GOTO'],
    ['EXCEL GOTO', 'Excel GOTO', 'EXCEL_GOTO'],
  ])('renders the GridItem asset for %s', (action, label, icon) => {
    const { container } = render(
      <InstructionCommandBadge action={action} />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      container.querySelector(`[data-command-icon="${icon}"]`),
    ).toBeInTheDocument();
  });

  test('supports a Variables-owned label without changing its command icon', () => {
    const { container } = render(
      <InstructionCommandBadge action="CK" label="Custom visible label" />,
    );

    expect(screen.getByText('Custom visible label')).toBeInTheDocument();
    expect(container.querySelector('[data-command-icon="CHECK"]'))
      .toBeInTheDocument();
  });

  test('renders the hidden marker for an encoded hidden input', () => {
    const { container } = render(
      <InstructionCommandBadge action="I:text:hidden" />,
    );

    expect(screen.getByText('Input Field')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(2);
  });
});
