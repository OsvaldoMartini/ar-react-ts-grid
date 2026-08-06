import type { RuntimeVariableMemoryEntry } from '../variablesWorkspace.contract';
import type { RuntimeMemoryPanelItem } from './RuntimeMemoryPanel';

/**
 * Shared presentation boundary for every editable runtime-memory surface.
 *
 * Keeping this mapping outside either page prevents Variables and Runtime
 * Variables from drifting on EMPTY versus VOID behavior or editability.
 */
export const runtimeMemoryPanelItems = (
  entries: readonly RuntimeVariableMemoryEntry[],
): RuntimeMemoryPanelItem[] => entries.map(entry => ({
  variableId: entry.variableId,
  name: entry.name,
  state: entry.state,
  value: entry.state === 'VALUE' ? entry.value : null,
  voidReason: entry.voidReason,
  editable: true,
}));
