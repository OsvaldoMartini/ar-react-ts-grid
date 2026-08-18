import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariableInstructionNode } from '../../variablesWorkspace.contract';

/**
 * THE variable model (user decision 2026-08-03):
 * an instruction is a Web Element or a Command; commands need 0, 1 or 2
 * GET extracts an external value and writes it through GET_WRITE; SET reads a
 * variable through READ_SET; E reads a variable through READ; CheckValue compares
 * LEFT + RIGHT. Everything else needs no variable slot.
 *
 * This map is the single source of truth for "how many variables and which
 * spots". Connections live as instruction_variable_slot rows; while the slot
 * write-through is being rolled out, resolution falls back to the legacy
 * storages (instruction.variable_id, config operand) so the UI stays truthful.
 */

export type VariableSlotName = 'LEFT' | 'RIGHT' | 'GET_WRITE' | 'READ_SET' | 'READ';

const CHECK_ACTIONS = new Set(['CK', 'CSV CHECK', 'PDF CHECK']);

export const requiredVariableSlots = (
  action: string | null | undefined,
): readonly VariableSlotName[] => {
  const canonical = canonicalInstructionAction(action);
  if (CHECK_ACTIONS.has(canonical)) return ['LEFT', 'RIGHT'];
  if (canonical === 'GET') return ['GET_WRITE'];
  if (canonical === 'SET') return ['READ_SET'];
  if (canonical === 'E') return ['READ'];
  return [];
};

/**
 * Resolves which required spots are connected: slot rows first (authoritative),
 * then the legacy fallback — instruction.variable_id covers the single spot
 * (or a CheckValue's LEFT), config operand_kind='VARIABLE' covers RIGHT.
 */
export const connectedVariableSlots = (
  command: VariableInstructionNode,
): ReadonlyMap<VariableSlotName, number> => {
  const required = requiredVariableSlots(command.command);
  const connected = new Map<VariableSlotName, number>();
  for (const link of command.variableSlots ?? []) {
    const slot = link.slot.trim().toUpperCase() as VariableSlotName;
    if (required.includes(slot) && !connected.has(slot)) {
      connected.set(slot, link.variableId);
    }
  }
  const legacyPrimary = typeof command.variableId === 'number'
    && Number.isSafeInteger(command.variableId)
    && command.variableId > 0
      ? command.variableId
      : null;
  if (legacyPrimary !== null) {
    const primarySlot = required.find(slot => slot !== 'RIGHT');
    if (primarySlot && !connected.has(primarySlot)) {
      connected.set(primarySlot, legacyPrimary);
    }
  }
  const configuration = command.commandConfiguration;
  if (
    required.includes('RIGHT')
    && !connected.has('RIGHT')
    && configuration
    && configuration.operandKind === 'VARIABLE'
    && typeof configuration.operandVariableId === 'number'
    && configuration.operandVariableId > 0
  ) {
    connected.set('RIGHT', configuration.operandVariableId);
  }
  return connected;
};

export const missingVariableSlots = (
  command: VariableInstructionNode,
): readonly VariableSlotName[] => {
  const connected = connectedVariableSlots(command);
  return requiredVariableSlots(command.command)
    .filter(slot => !connected.has(slot));
};
