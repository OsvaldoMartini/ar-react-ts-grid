import { instructionDisplayLabel, isWaitInstruction } from './instructionDisplay';

test.each([
  ['H', 5, 'Wait 5s'],
  ['H', 2, 'Wait 2s'],
  ['HOLD', 9, 'Wait 9s'],
  ['WAIT', null, 'Wait 5s'],
])('formats %s with its selected duration', (actions, onHoldSeconds, expected) => {
  expect(instructionDisplayLabel({ actions, onHoldSeconds })).toBe(expected);
});

test('keeps the client display name for non-wait instructions', () => {
  expect(instructionDisplayLabel({ actions: 'C', name: 'Canonical', clientNamed: 'Client label' }))
    .toBe('Client label');
  expect(isWaitInstruction({ actions: 'C' })).toBe(false);
});
