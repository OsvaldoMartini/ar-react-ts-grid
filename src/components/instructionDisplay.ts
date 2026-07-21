export type InstructionDisplayFields = {
  actions?: string | null;
  name?: string | null;
  clientNamed?: string | null;
  onHoldSeconds?: number | null;
};

export function isWaitInstruction(instruction: InstructionDisplayFields): boolean {
  const action = (instruction.actions || '').split(':')[0].trim().toUpperCase();
  return action === 'H' || action === 'HOLD' || action === 'WAIT';
}

export function instructionDisplayLabel(instruction: InstructionDisplayFields): string {
  if (isWaitInstruction(instruction)) {
    const selected = Number(instruction.onHoldSeconds);
    const seconds = Number.isFinite(selected) && selected > 0 ? Math.trunc(selected) : 5;
    return `Wait ${seconds}s`;
  }
  return instruction.clientNamed?.trim() || instruction.name || '';
}
