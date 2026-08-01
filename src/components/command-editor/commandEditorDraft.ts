import type { ComponentEditorCommand } from './componentEditor.types';
import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';

export interface LoopCommandEditorDraft {
  kind: 'LOOP';
  intervalSeconds: number;
  iterations: number;
}

export interface RefreshLoopCommandEditorDraft {
  kind: 'REFRESH_LOOP';
  intervalSeconds: number;
  iterations: number;
}

export interface WaitCommandEditorDraft {
  kind: 'WAIT';
  waitSeconds: number;
}

export interface LegacyCommandEditorDraft {
  kind: 'LEGACY';
  operation: string;
}

export type CommandEditorConfiguration =
  | LoopCommandEditorDraft
  | RefreshLoopCommandEditorDraft
  | WaitCommandEditorDraft
  | LegacyCommandEditorDraft;

export interface CommandEditorBaseDraft {
  name: string;
  action: string;
  operation: string;
  configuration: CommandEditorConfiguration;
}

const boundedPositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 9999
    ? parsed
    : fallback;
};

const loopConfiguration = (
  kind: 'LOOP' | 'REFRESH_LOOP',
  operation: string,
): LoopCommandEditorDraft | RefreshLoopCommandEditorDraft => {
  const [interval, iterations] = operation.split(':', 2);
  return {
    kind,
    intervalSeconds: boundedPositiveInteger(interval, 1),
    iterations: boundedPositiveInteger(iterations, 1),
  };
};

export const commandEditorConfiguration = (
  actionValue: string,
  operation: string,
  onHoldSeconds: number | null,
): CommandEditorConfiguration => {
  const action = canonicalInstructionAction(actionValue);
  if (action === 'LOOP') return loopConfiguration('LOOP', operation);
  if (action === 'REFRESH_LOOP') {
    return loopConfiguration('REFRESH_LOOP', operation);
  }
  if (action === 'H') {
    return {
      kind: 'WAIT',
      waitSeconds: boundedPositiveInteger(onHoldSeconds, 5),
    };
  }
  return { kind: 'LEGACY', operation };
};

export const commandEditorBaseDraft = (
  command: ComponentEditorCommand,
): CommandEditorBaseDraft => ({
  name: command.instructionName,
  action: command.action,
  operation: command.operation,
  configuration: commandEditorConfiguration(
    command.action,
    command.operation,
    command.onHoldSeconds,
  ),
});

const isPositiveEditorInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 1 && value <= 9999;

const isConfigurationValid = (configuration: CommandEditorConfiguration): boolean => {
  if (configuration.kind === 'LOOP' || configuration.kind === 'REFRESH_LOOP') {
    return isPositiveEditorInteger(configuration.intervalSeconds)
      && isPositiveEditorInteger(configuration.iterations);
  }
  if (configuration.kind === 'WAIT') {
    return isPositiveEditorInteger(configuration.waitSeconds);
  }
  return true;
};

export const isCommandEditorBaseDraftValid = (
  draft: CommandEditorBaseDraft,
): boolean => draft.name.trim().length > 0
  && draft.action.trim().length > 0
  && isConfigurationValid(draft.configuration);
