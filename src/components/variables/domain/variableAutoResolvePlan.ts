import { instructionRelationshipPolicy } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';

/**
 * Resolve Connections rules 5 + 6 — independent React-owned implementation
 * (2026-08-03 rebuild; the earlier Java auto-resolve engine stays dormant).
 *
 * Rule 5 — DEFAULT VARIABLE CREATED: a command that requires a variable and has
 * none connects the OLDEST existing variable; when no variable exists at all a
 * sequential `Variable_N` is created and connected.
 *
 * Rule 6 — CHECKVALUE VARIABLES: CK / PDF CHECK / CSV CHECK need two
 * independent variables — the oldest becomes the LEFT operand (the
 * instruction's own variable binding) and the next-oldest becomes the RIGHT
 * operand (typed configuration `operand_variable_id`). Missing operands are
 * created as `Left_Operand` / `Right_Operand` (suffixed on collision).
 *
 * Only MISSING slots are filled — existing bindings and configured right
 * operands are never overwritten. Persistence reuses the proven ops: variable
 * create, graphMutationV3 variable-binding patches, and Command Editor UPDATE.
 */

const CHECK_ACTIONS = new Set(['CK', 'PDF CHECK', 'CSV CHECK']);

export type VariableAutoResolveCreation = {
  name: string;
  slot: 'MAIN' | 'LEFT' | 'RIGHT';
  instructionId: number;
};

export type VariableAutoResolveBinding = {
  instructionId: number;
  variableId: number | null;
  pendingName: string | null;
};

export type VariableAutoResolveRightOperand = {
  instructionId: number;
  variableId: number | null;
  pendingName: string | null;
};

export type VariableAutoResolvePlan = {
  creations: readonly VariableAutoResolveCreation[];
  bindings: readonly VariableAutoResolveBinding[];
  rightOperands: readonly VariableAutoResolveRightOperand[];
};

const positiveId = (value: number | null | undefined): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;

const canonical = (action: string | null | undefined): string =>
  instructionRelationshipPolicy(action).canonicalAction;

const requiresVariable = (action: string | null | undefined): boolean =>
  instructionRelationshipPolicy(action).requirements.includes('VARIABLE_BINDING');

class NameSequencer {
  private readonly taken: Set<string>;
  private nextVariableNumber: number;

  constructor(existingNames: readonly string[]) {
    this.taken = new Set(existingNames.map(name => name.trim().toLowerCase()));
    this.nextVariableNumber = existingNames.reduce((highest, name) => {
      const match = /^Variable_(\d+)$/i.exec(name.trim());
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
  }

  nextVariableName(): string {
    let name = `Variable_${this.nextVariableNumber}`;
    while (this.taken.has(name.toLowerCase())) {
      this.nextVariableNumber += 1;
      name = `Variable_${this.nextVariableNumber}`;
    }
    this.nextVariableNumber += 1;
    this.taken.add(name.toLowerCase());
    return name;
  }

  operandName(base: 'Left_Operand' | 'Right_Operand'): string {
    if (!this.taken.has(base.toLowerCase())) {
      this.taken.add(base.toLowerCase());
      return base;
    }
    let suffix = 2;
    while (this.taken.has(`${base.toLowerCase()}_${suffix}`)) suffix += 1;
    const name = `${base}_${suffix}`;
    this.taken.add(name.toLowerCase());
    return name;
  }
}

const rightOperandMissing = (command: VariableInstructionNode): boolean => {
  const configuration = command.commandConfiguration;
  return !configuration
    || configuration.operandKind !== 'VARIABLE'
    || !positiveId(configuration.operandVariableId);
};

export const planVariableAutoResolve = (
  snapshot: VariableWorkspaceSnapshot,
): VariableAutoResolvePlan => {
  const orderedVariables = snapshot.variables
    .filter(variable => positiveId(variable.id))
    .slice()
    .sort((left, right) => left.id - right.id);
  const sequencer = new NameSequencer(orderedVariables.map(variable => variable.name));
  const oldestId = orderedVariables.length > 0 ? orderedVariables[0].id : null;

  const creations: VariableAutoResolveCreation[] = [];
  const bindings: VariableAutoResolveBinding[] = [];
  const rightOperands: VariableAutoResolveRightOperand[] = [];

  const commands = snapshot.commands
    .filter((command): command is VariableInstructionNode & { id: number } =>
      positiveId(command.id))
    .slice()
    .sort((left, right) => left.id - right.id);

  for (const command of commands) {
    const action = canonical(command.command);
    if (CHECK_ACTIONS.has(action)) {
      const leftMissing = !positiveId(command.variableId);
      const rightMissing = rightOperandMissing(command);
      let leftId = leftMissing ? oldestId : (command.variableId as number);
      if (leftMissing) {
        if (leftId !== null) {
          bindings.push({
            instructionId: command.id, variableId: leftId, pendingName: null,
          });
        } else {
          const name = sequencer.operandName('Left_Operand');
          creations.push({ name, slot: 'LEFT', instructionId: command.id });
          bindings.push({
            instructionId: command.id, variableId: null, pendingName: name,
          });
        }
      }
      if (rightMissing) {
        // "Next-oldest": the first existing variable that is not the left operand.
        const candidate =
          orderedVariables.find(variable => variable.id !== leftId)?.id ?? null;
        if (candidate !== null) {
          rightOperands.push({
            instructionId: command.id, variableId: candidate, pendingName: null,
          });
        } else {
          const name = sequencer.operandName('Right_Operand');
          creations.push({ name, slot: 'RIGHT', instructionId: command.id });
          rightOperands.push({
            instructionId: command.id, variableId: null, pendingName: name,
          });
        }
      }
      continue;
    }
    if (!requiresVariable(command.command)) continue;
    if (positiveId(command.variableId)) continue;
    if (oldestId !== null) {
      bindings.push({
        instructionId: command.id, variableId: oldestId, pendingName: null,
      });
    } else {
      const name = sequencer.nextVariableName();
      creations.push({ name, slot: 'MAIN', instructionId: command.id });
      bindings.push({
        instructionId: command.id, variableId: null, pendingName: name,
      });
    }
  }

  return Object.freeze({
    creations: Object.freeze(creations),
    bindings: Object.freeze(bindings),
    rightOperands: Object.freeze(rightOperands),
  });
};
