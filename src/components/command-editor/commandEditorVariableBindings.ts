import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import { requiredVariableSlots } from '../variables/domain/variableSlotRequirements';
import type {
  ComponentEditorCommand,
  ComponentEditorVariableSlot,
} from './componentEditor.types';

type VariableBindingCommand = Pick<
  ComponentEditorCommand,
  'action' | 'variableId' | 'variableSlots' | 'storedConfiguration'
>;

export interface CommandEditorVariableBinding {
  slot: ComponentEditorVariableSlot;
  currentVariableId: number | null;
  desiredVariableId: number | null;
}

const positiveVariableId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const currentBindingsBySlot = (
  command: VariableBindingCommand,
): ReadonlyMap<ComponentEditorVariableSlot, number> => {
  const required = requiredVariableSlots(command.action);
  const connected = new Map<ComponentEditorVariableSlot, number>();
  for (const link of command.variableSlots ?? []) {
    const slot = link.slot.trim().toUpperCase() as ComponentEditorVariableSlot;
    const variableId = positiveVariableId(link.variableId);
    if (variableId !== null && required.includes(slot) && !connected.has(slot)) {
      connected.set(slot, variableId);
    }
  }

  // An explicitly supplied slot collection is the authoritative relationship
  // state, including when it is empty. Compatibility projections are used only
  // by older/detached snapshots that do not expose variableSlots yet.
  if (command.variableSlots !== undefined) return connected;

  const primaryVariableId = positiveVariableId(command.variableId);
  const primarySlot = required.find(slot => slot !== 'RIGHT');
  if (primarySlot && primaryVariableId !== null && !connected.has(primarySlot)) {
    connected.set(primarySlot, primaryVariableId);
  }

  const stored = command.storedConfiguration;
  const legacyLeftVariableId = positiveVariableId(stored?.leftVariableId);
  if (
    required.includes('LEFT')
    && legacyLeftVariableId !== null
    && !connected.has('LEFT')
  ) {
    connected.set('LEFT', legacyLeftVariableId);
  }
  const legacyRightVariableId = positiveVariableId(stored?.operandVariableId);
  if (
    required.includes('RIGHT')
    && legacyRightVariableId !== null
    && stored?.operandKind === 'VARIABLE'
    && !connected.has('RIGHT')
  ) {
    connected.set('RIGHT', legacyRightVariableId);
  }
  return connected;
};

/**
 * Creates the editor-owned current/desired relationship state for one action.
 * A command-type transformation starts disconnected because Java clears the
 * old action's slots before any new action-specific graph mutation is sent.
 */
export const commandEditorVariableBindings = (
  command: VariableBindingCommand,
  targetAction: string,
): readonly CommandEditorVariableBinding[] => {
  const required = requiredVariableSlots(targetAction);
  const sameAction = canonicalInstructionAction(command.action)
    === canonicalInstructionAction(targetAction);
  const current = sameAction ? currentBindingsBySlot(command) : new Map();
  return required.map(slot => {
    const variableId = current.get(slot) ?? null;
    return {
      slot,
      currentVariableId: variableId,
      desiredVariableId: variableId,
    };
  });
};

export const updateCommandEditorVariableBinding = (
  bindings: readonly CommandEditorVariableBinding[],
  slot: ComponentEditorVariableSlot,
  desiredVariableId: number | null,
): readonly CommandEditorVariableBinding[] => {
  const normalized = positiveVariableId(desiredVariableId);
  return bindings.map(binding => binding.slot === slot
    ? { ...binding, desiredVariableId: normalized }
    : binding);
};

export const changedCommandEditorVariableBindings = (
  bindings: readonly CommandEditorVariableBinding[],
): readonly CommandEditorVariableBinding[] => bindings.filter(
  binding => binding.currentVariableId !== binding.desiredVariableId,
);
