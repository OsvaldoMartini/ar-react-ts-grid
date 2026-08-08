import {
  MEMORY_LIST_SESSION_ID,
  memoryListConnectionQuery,
} from './MemoryList';

describe('Memory List WebSocket launch capability', () => {
  test('forwards only a nonblank capability for the fixed Memory List session', () => {
    expect(memoryListConnectionQuery(
      MEMORY_LIST_SESSION_ID,
      '?windowCapability=opaque%2Bcapability&sourceBotJobId=32',
    )).toEqual({ windowCapability: 'opaque+capability' });

    expect(memoryListConnectionQuery(
      MEMORY_LIST_SESSION_ID,
      '?windowCapability=%20%20',
    )).toBeUndefined();
  });

  test('does not attach the Memory capability to another workspace session', () => {
    expect(memoryListConnectionQuery(
      'botJobTasks',
      '?windowCapability=must-not-leak',
    )).toBeUndefined();
  });
});
