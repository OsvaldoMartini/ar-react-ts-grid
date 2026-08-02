import type {
  ComponentEditorCommand,
  ComponentEditorStoredConfiguration,
} from './componentEditor.types';
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

export type ComparisonOperandKind = 'LITERAL' | 'VARIABLE' | 'EMPTY' | 'VOID';

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty';

export interface CheckValueCommandEditorDraft {
  kind: 'CHECK_VALUE';
  operator: ComparisonOperator;
  operandKind: ComparisonOperandKind;
  operandRawValue: string;
  operandVariableId: number | null;
  formatPolicy: string;
}

export interface ExternalCheckCommandEditorDraft {
  kind: 'EXTERNAL_CHECK';
  checkType: 'CSV CHECK' | 'PDF CHECK';
  operator: ComparisonOperator;
  operandKind: ComparisonOperandKind;
  operandRawValue: string;
  operandVariableId: number | null;
  externalSourceKey: string;
  formatPolicy: string;
}

export interface ExcelWriteCommandEditorDraft {
  kind: 'EXCEL_WRITE';
  outputKey: string;
  outputColumn: string;
  outputFile: string;
  formatPolicy: string;
}

export interface LegacyCommandEditorDraft {
  kind: 'LEGACY';
  operation: string;
}

export type CommandEditorConfiguration =
  | LoopCommandEditorDraft
  | RefreshLoopCommandEditorDraft
  | WaitCommandEditorDraft
  | CheckValueCommandEditorDraft
  | ExternalCheckCommandEditorDraft
  | ExcelWriteCommandEditorDraft
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

const COMPARISON_OPERATORS = new Set<ComparisonOperator>([
  '=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith',
  'isEmpty', 'isNotEmpty',
]);

const comparisonOperator = (value: string): ComparisonOperator =>
  COMPARISON_OPERATORS.has(value as ComparisonOperator)
    ? value as ComparisonOperator
    : '=';

const comparisonConfiguration = (
  operation: string,
  stored: ComponentEditorStoredConfiguration | null | undefined,
  checkType: 'CK' | 'CSV CHECK' | 'PDF CHECK',
): CheckValueCommandEditorDraft | ExternalCheckCommandEditorDraft => {
  const parts = operation.split(':');
  const hasStored = stored != null;
  const legacyOperand = parts.slice(2).join(':');
  const legacyOperandKind: ComparisonOperandKind = legacyOperand === '$EMPTY'
    || legacyOperand === '#EMPTY'
    ? 'EMPTY'
    : legacyOperand === 'VOID'
      ? 'VOID'
      : 'LITERAL';
  const base = {
    operator: comparisonOperator(hasStored ? stored.comparisonOperator : parts[1] || '='),
    operandKind: (['LITERAL', 'VARIABLE', 'EMPTY', 'VOID'].includes(stored?.operandKind || '')
      ? stored?.operandKind
      : legacyOperandKind) as ComparisonOperandKind,
    operandRawValue: hasStored || legacyOperandKind !== 'LITERAL'
      ? stored?.operandRawValue || ''
      : legacyOperand,
    operandVariableId: stored?.operandVariableId ?? null,
    formatPolicy: stored?.formatPolicy || 'EXACT_TEXT',
  };
  return checkType === 'CK'
    ? { kind: 'CHECK_VALUE', ...base }
    : {
        kind: 'EXTERNAL_CHECK',
        checkType,
        externalSourceKey: stored?.externalSourceKey || '',
        ...base,
      };
};

const legacyExcelOutputKey = (operation: string): string => {
  const parts = operation.split(':');
  const value = parts[parts.length - 1]?.trim() || '';
  return value.replace(/^[$#]/, '').trim() || 'ExcelWrite';
};

export const commandEditorConfiguration = (
  actionValue: string,
  operation: string,
  onHoldSeconds: number | null,
  storedConfiguration?: ComponentEditorStoredConfiguration | null,
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
  if (action === 'CK') {
    return comparisonConfiguration(operation, storedConfiguration, 'CK');
  }
  if (action === 'CSV CHECK' || action === 'PDF CHECK') {
    return comparisonConfiguration(operation, storedConfiguration, action);
  }
  if (action === 'E') {
    const stored = storedConfiguration;
    return {
      kind: 'EXCEL_WRITE',
      outputKey: stored ? stored.outputKey : legacyExcelOutputKey(operation),
      outputColumn: stored ? stored.outputColumn : '',
      outputFile: stored ? stored.outputFile : '',
      formatPolicy: stored ? stored.formatPolicy : 'EXACT_TEXT',
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
    command.storedConfiguration,
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
  if (configuration.kind === 'CHECK_VALUE' || configuration.kind === 'EXTERNAL_CHECK') {
    const operandValid = configuration.operandKind === 'VARIABLE'
      ? configuration.operandVariableId !== null && configuration.operandVariableId > 0
      : configuration.operandKind === 'LITERAL'
        ? true
        : configuration.operandRawValue.length === 0;
    return operandValid && (configuration.kind !== 'EXTERNAL_CHECK'
      || configuration.externalSourceKey.trim().length > 0);
  }
  if (configuration.kind === 'EXCEL_WRITE') {
    return configuration.outputKey.trim().length > 0;
  }
  return true;
};

export const isCommandEditorBaseDraftValid = (
  draft: CommandEditorBaseDraft,
): boolean => draft.name.trim().length > 0
  && draft.action.trim().length > 0
  && isConfigurationValid(draft.configuration);
