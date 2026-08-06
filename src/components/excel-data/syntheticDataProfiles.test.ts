import { generateSyntheticBlocks, swissTestIban } from './syntheticDataProfiles';

test('creates deterministic Swiss test banking values for recognized columns', () => {
  const first = generateSyntheticBlocks([{ name: 'Account', columns: ['IBAN', 'Name', 'Postal Code', 'City'] }], 2, 'Bank Account');
  expect(first).toEqual(generateSyntheticBlocks([{ name: 'Account', columns: ['IBAN', 'Name', 'Postal Code', 'City'] }], 2, 'Bank Account'));
  expect(first[0].rows[0].IBAN).toMatch(/^CH\d{19}$/);
  expect(first[0].rows[0].City).toBeTruthy();
});

test('Swiss test IBAN satisfies modulo 97 without using a live account source', () => {
  const iban = swissTestIban(42);
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`
    .replace(/[A-Z]/g, character => String(character.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  expect(remainder).toBe(1);
  expect(iban.slice(4, 9)).toBe('99999');
});
