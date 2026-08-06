export const SYNTHETIC_CONTEXTS = [
  'Bank Account',
  'Bank Trading',
  'Trading Platform',
  'Financial',
] as const;

export type SyntheticContext = typeof SYNTHETIC_CONTEXTS[number];
type BlockShape = { name: string; columns: string[] };

const firstNames = ['Anna', 'Luca', 'Sofia', 'Noah', 'Mia', 'Leon'];
const lastNames = ['Muster', 'Meier', 'Rossi', 'Keller', 'Frei', 'Bernasconi'];
const cities = [
  ['8001', 'Zürich', 'Bahnhofstrasse'],
  ['3000', 'Bern', 'Marktgasse'],
  ['1201', 'Genève', 'Rue du Rhône'],
  ['6900', 'Lugano', 'Via Nassa'],
] as const;
const symbols = ['NESN', 'NOVN', 'ROG', 'UBSG', 'ZURN'];

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const pick = <T,>(items: readonly T[], seed: number) => items[seed % items.length];
const digits = (seed: number, length: number) => Array.from({ length }, (_, index) =>
  String((seed + index * 7 + Math.floor(index / 3) * 3) % 10)).join('');

const mod97 = (value: string) => {
  let remainder = 0;
  for (const character of value) remainder = (remainder * 10 + Number(character)) % 97;
  return remainder;
};

/** Structurally valid Swiss test IBAN using non-production-style IID 99999. */
export const swissTestIban = (seed: number) => {
  const bban = `99999${digits(seed, 12)}`;
  const checksum = String(98 - mod97(`${bban}121700`)).padStart(2, '0');
  return `CH${checksum}${bban}`;
};

const syntheticValue = (context: SyntheticContext, column: string, row: number) => {
  const key = column.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const seed = hash(`${context}:${column}:${row}`);
  const person = `${pick(firstNames, seed)} ${pick(lastNames, seed >>> 4)}`;
  const [postalCode, city, street] = pick(cities, seed >>> 7);
  if (key.includes('iban')) return swissTestIban(seed);
  if (key.includes('account') || key.includes('konto')) return `TEST-${digits(seed, 12)}`;
  if (key.includes('firstname') || key.includes('vorname')) return person.split(' ')[0];
  if (key.includes('lastname') || key.includes('surname') || key.includes('nachname')) return person.split(' ')[1];
  if (key === 'name' || key.includes('fullname') || key.includes('customer')) return person;
  if (key.includes('postcode') || key.includes('postal') || key.includes('zip')) return postalCode;
  if (key.includes('city') || key.includes('town') || key.includes('ort')) return city;
  if (key.includes('address') || key.includes('street') || key.includes('strasse')) return `${street} ${(seed % 90) + 1}`;
  if (key.includes('country')) return 'CH';
  if (key.includes('currency')) return 'CHF';
  if (key.includes('email')) return `${person.toLowerCase().replace(' ', '.')}.${row + 1}@example.test`;
  if (key.includes('phone') || key.includes('mobile')) return `+41 79 ${digits(seed, 3)} ${digits(seed >>> 3, 2)} ${digits(seed >>> 6, 2)}`;
  if (key.includes('amount') || key.includes('balance') || key.includes('price')) return ((seed % 250000) / 100 + 10).toFixed(2);
  if (key.includes('date')) return new Date(Date.UTC(2026, seed % 12, (seed % 27) + 1)).toISOString().slice(0, 10);
  if (key.includes('bic') || key.includes('swift')) return 'TESTCHZZXXX';
  if (context === 'Bank Trading' && (key.includes('symbol') || key.includes('ticker'))) return pick(symbols, seed);
  if (context === 'Trading Platform' && key.includes('side')) return seed % 2 === 0 ? 'BUY' : 'SELL';
  if (context === 'Trading Platform' && key.includes('quantity')) return String((seed % 500) + 1);
  if (key.includes('reference') || key.includes('order') || key.includes('transaction')) return `TEST-${context.replace(/\W/g, '').toUpperCase()}-${digits(seed, 10)}`;
  return `${context.replace(/\s+/g, '_').toUpperCase()}_${column.replace(/\W+/g, '_').toUpperCase()}_${row + 1}`;
};

export const generateSyntheticBlocks = (
  blocks: readonly BlockShape[], rowCount: number, context: SyntheticContext,
) => blocks.map(block => ({
  name: block.name,
  rows: Array.from({ length: rowCount }, (_, row) => Object.fromEntries(
    block.columns.map(column => [column, syntheticValue(context, column, row)]),
  )),
}));
