import {
  matchesMemorySourceCommand,
  matchesMemoryWorkspaceEpoch,
} from './memoryList.sourceCorrelation';

test('requires the exact workspace epoch for static Memory sources', () => {
  expect(matchesMemoryWorkspaceEpoch({ workspaceEpoch: 7 }, 7)).toBe(true);
  expect(matchesMemoryWorkspaceEpoch({ workspaceEpoch: 6 }, 7)).toBe(false);
  expect(matchesMemoryWorkspaceEpoch({}, 7)).toBe(false);
});

test('allows server-bound detached sources to omit a client-owned epoch assertion', () => {
  expect(matchesMemoryWorkspaceEpoch({}, 0)).toBe(true);
  expect(matchesMemoryWorkspaceEpoch({ workspaceEpoch: 14 }, 0)).toBe(true);
});

test('requires both owner and workspace generations for routed commands', () => {
  const current = { workspaceEpoch: 7, ownerEpoch: 'owner-7' };
  expect(matchesMemorySourceCommand(current, 7, 'owner-7')).toBe(true);
  expect(matchesMemorySourceCommand(current, 8, 'owner-7')).toBe(false);
  expect(matchesMemorySourceCommand(current, 7, 'owner-8')).toBe(false);
  expect(matchesMemorySourceCommand(current, 7, '')).toBe(false);
});
